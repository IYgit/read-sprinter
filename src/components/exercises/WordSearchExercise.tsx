import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Settings, Trophy, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveExerciseResult } from '@/lib/exerciseStats';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';

const UKRAINIAN_LETTERS = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя';

const WORD_BANK = [
  'кивати', 'лопата', 'трава', 'музика', 'книга', 'сонце',
  'вікно', 'школа', 'дорога', 'молоко', 'ліжко', 'стілець',
  'ранок', 'вечір', 'зірка', 'берег', 'камінь', 'дерево',
  'квітка', 'вітер', 'хмара', 'місяць', 'листок', 'ягода',
  'робота', 'ліхтар', 'площа', 'парасон', 'ковдра', 'горіх',
  'калина', 'пшениця', 'вишня', 'город', 'полуниця',
];

const GRID_ROWS = 14;
const GRID_COLS = 13;

interface GridData {
  grid: string[][];
  wordsToFind: string[];
  wordPositions: { word: string; row: number; startCol: number }[];
}

function generateGrid(): GridData {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
  const wordsToFind = shuffled.slice(0, 3);

  // Pick 3 random unique rows for words
  const availableRows = Array.from({ length: GRID_ROWS }, (_, i) => i).sort(() => Math.random() - 0.5);
  const wordRows = availableRows.slice(0, 3).sort((a, b) => a - b);

  const wordPositions: { word: string; row: number; startCol: number }[] = [];
  const grid: string[][] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    const row: string[] = [];
    const wordIndex = wordRows.indexOf(r);

    if (wordIndex !== -1) {
      const word = wordsToFind[wordIndex];
      const maxStart = GRID_COLS - word.length;
      const startCol = Math.floor(Math.random() * (maxStart + 1));
      wordPositions.push({ word, row: r, startCol });

      for (let c = 0; c < GRID_COLS; c++) {
        const posInWord = c - startCol;
        if (posInWord >= 0 && posInWord < word.length) {
          row.push(word[posInWord]);
        } else {
          row.push(UKRAINIAN_LETTERS[Math.floor(Math.random() * UKRAINIAN_LETTERS.length)]);
        }
      }
    } else {
      for (let c = 0; c < GRID_COLS; c++) {
        row.push(UKRAINIAN_LETTERS[Math.floor(Math.random() * UKRAINIAN_LETTERS.length)]);
      }
    }

    grid.push(row);
  }

  return { grid, wordsToFind, wordPositions };
}

const WordSearchExercise = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<'settings' | 'playing' | 'results'>('settings');
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    const data = generateGrid();
    setGridData(data);
    setSelectedCells(new Set());
    setFoundWords(new Set());
    setTimeElapsed(0);
    setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const finishGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('results');
  }, []);

  // Check if all words found
  useEffect(() => {
    if (phase === 'playing' && gridData && foundWords.size === gridData.wordsToFind.length) {
      setTimeout(finishGame, 600);
    }
  }, [foundWords, phase, gridData, finishGame]);

  const handleCellMouseDown = (row: number, col: number) => {
    if (phase !== 'playing') return;
    setIsSelecting(true);
    setSelectionStart({ row, col });
    setSelectedCells(new Set([`${row}-${col}`]));
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !selectionStart || phase !== 'playing') return;
    // Only allow selection in the same row
    if (row !== selectionStart.row) return;

    const newSelected = new Set<string>();
    const startCol = Math.min(selectionStart.col, col);
    const endCol = Math.max(selectionStart.col, col);
    for (let c = startCol; c <= endCol; c++) {
      newSelected.add(`${row}-${c}`);
    }
    setSelectedCells(newSelected);
  };

  const handleMouseUp = () => {
    if (!isSelecting || !gridData || !selectionStart) {
      setIsSelecting(false);
      return;
    }
    setIsSelecting(false);

    // Extract selected text
    const cells = Array.from(selectedCells).map(key => {
      const [r, c] = key.split('-').map(Number);
      return { r, c };
    }).sort((a, b) => a.c - b.c);

    if (cells.length === 0) return;

    const row = cells[0].r;
    const selectedText = cells.map(({ r, c }) => gridData.grid[r][c]).join('');

    // Check if it matches any word
    const matchedWord = gridData.wordsToFind.find(w => w === selectedText && !foundWords.has(w));
    if (matchedWord) {
      setFoundWords(prev => new Set([...prev, matchedWord]));
      // Keep these cells highlighted permanently
      setSelectedCells(prev => {
        const kept = new Set(prev);
        // We'll track found cells separately via foundWords + positions
        return kept;
      });
    } else {
      setSelectedCells(new Set());
    }
  };

  const isCellPartOfFoundWord = (row: number, col: number): boolean => {
    if (!gridData) return false;
    return gridData.wordPositions.some(wp =>
      foundWords.has(wp.word) && wp.row === row && col >= wp.startCol && col < wp.startCol + wp.word.length
    );
  };

  const score = foundWords.size * 100 + Math.max(0, (180 - timeElapsed)) * foundWords.size;

  useEffect(() => {
    if (phase === 'results') {
      saveExerciseResult('word-search', score);
    }
  }, [phase]);

  if (phase === 'settings') {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={20} /> До вибору вправ
        </button>
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Пошук слів</h2>
            <p className="text-muted-foreground">
              Знайдіть 3 задані слова серед рядків букв. Виділяйте слова мишкою (протягніть по буквах).
            </p>
          </div>
          <button onClick={startGame} className="btn-primary w-full flex items-center justify-center gap-2 text-lg">
            <Play size={22} /> Почати
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={20} /> До вибору вправ
        </button>
        <div className="glass-card p-8 text-center">
          <Trophy size={48} className="text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Результати</h2>
          <p className="text-muted-foreground mb-8">Вправа «Пошук слів» завершена</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-xs text-muted-foreground">Балів</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-accent">{foundWords.size}/3</p>
              <p className="text-xs text-muted-foreground">Знайдено</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-foreground">{timeElapsed}с</p>
              <p className="text-xs text-muted-foreground">Час</p>
            </div>
          </div>

          <ExerciseStatsChart exerciseId="word-search" title="Статистика — Пошук слів" />

          <div className="flex gap-4 justify-center mt-6">
            <button onClick={startGame} className="btn-primary flex items-center gap-2">
              <RotateCcw size={18} /> Ще раз
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
              До вправ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={finishGame} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} /> Завершити
        </button>
        <span className="text-sm font-mono text-muted-foreground">{timeElapsed}с</span>
      </div>

      {/* Words to find */}
      <div className="glass-card p-4 mb-4">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Знайдіть:</p>
        <div className="flex gap-3 flex-wrap">
          {gridData?.wordsToFind.map(word => (
            <span
              key={word}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                foundWords.has(word)
                  ? 'bg-success/20 text-success line-through'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Letter grid */}
      <div className="glass-card p-4 select-none">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
          {gridData?.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r}-${c}`;
              const isFound = isCellPartOfFoundWord(r, c);
              const isCurrentlySelected = selectedCells.has(key);

              return (
                <div
                  key={key}
                  onMouseDown={() => handleCellMouseDown(r, c)}
                  onMouseEnter={() => handleCellMouseEnter(r, c)}
                  className={`aspect-square flex items-center justify-center text-sm lg:text-base font-mono font-bold rounded cursor-pointer transition-all select-none ${
                    isFound
                      ? 'bg-success/20 text-success'
                      : isCurrentlySelected
                      ? 'bg-primary/30 text-primary'
                      : 'hover:bg-muted/50 text-foreground/70'
                  }`}
                >
                  {letter}
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-3">
        Протягніть мишкою по буквах слова в рядку, щоб виділити його
      </p>
    </div>
  );
};

export default WordSearchExercise;
