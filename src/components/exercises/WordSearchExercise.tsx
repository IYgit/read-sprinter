import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Trophy, RotateCcw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveExerciseResult } from '@/lib/exerciseStats';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';
import { Slider } from '@/components/ui/slider';
import { calcWordSearchScore } from '@/lib/scoring';
import { wordSearchApi } from '@/lib/api';

const UKRAINIAN_LETTERS = 'абвгґдеєжзиіїйклмнопрстуфхцчшщьюя';

interface GridData {
  grid: string[][];
  wordsToFind: string[];
  wordPositions: { word: string; row: number; startCol: number }[];
}

function generateGrid(rows: number, cols: number, wordCount: number, wordBank: string[]): GridData {
  const shuffled = [...wordBank].sort(() => Math.random() - 0.5);
  // Filter words that fit in the grid
  const fittingWords = shuffled.filter(w => w.length <= cols);
  const wordsToFind = fittingWords.slice(0, Math.min(wordCount, rows));

  // Pick random unique rows for words
  const availableRows = Array.from({ length: rows }, (_, i) => i).sort(() => Math.random() - 0.5);
  const wordRows = availableRows.slice(0, wordsToFind.length).sort((a, b) => a - b);

  const wordPositions: { word: string; row: number; startCol: number }[] = [];
  const grid: string[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    const wordIndex = wordRows.indexOf(r);

    if (wordIndex !== -1) {
      const word = wordsToFind[wordIndex];
      const maxStart = cols - word.length;
      const startCol = Math.floor(Math.random() * (maxStart + 1));
      wordPositions.push({ word, row: r, startCol });

      for (let c = 0; c < cols; c++) {
        const posInWord = c - startCol;
        if (posInWord >= 0 && posInWord < word.length) {
          row.push(word[posInWord]);
        } else {
          row.push(UKRAINIAN_LETTERS[Math.floor(Math.random() * UKRAINIAN_LETTERS.length)]);
        }
      }
    } else {
      for (let c = 0; c < cols; c++) {
        row.push(UKRAINIAN_LETTERS[Math.floor(Math.random() * UKRAINIAN_LETTERS.length)]);
      }
    }

    grid.push(row);
  }

  return { grid, wordsToFind, wordPositions };
}

const FONT_SIZE_OPTIONS = [
  { label: 'S', value: 12 },
  { label: 'M', value: 16 },
  { label: 'L', value: 20 },
];

const WordSearchExercise = () => {
  const navigate = useNavigate();

  // Word bank loaded from API (replaces hardcoded WORD_BANK)
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [wordBankLoading, setWordBankLoading] = useState(true);

  useEffect(() => {
    wordSearchApi.getWords()
      .then(setWordBank)
      .catch(console.error)
      .finally(() => setWordBankLoading(false));
  }, []);

  // Settings
  const [gridRows, setGridRows] = useState(12);
  const [gridCols, setGridCols] = useState(11);
  const [wordCount, setWordCount] = useState(3);
  const [fontSize, setFontSize] = useState(16);

  const [phase, setPhase] = useState<'settings' | 'playing' | 'results'>('settings');
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    if (wordBankLoading) return;

    const data = generateGrid(gridRows, gridCols, wordCount, wordBank);
    setGridData(data);
    setFoundWords(new Set());
    setTimeElapsed(0);
    setPhase('playing');
  }, [gridRows, gridCols, wordCount, wordBank, wordBankLoading]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const finishGame = useCallback(async (finalScore: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    await saveExerciseResult('word-search', finalScore);
    setPhase('results');
  }, []);

  // Check if all words found
  useEffect(() => {
    if (phase === 'playing' && gridData && foundWords.size === gridData.wordsToFind.length) {
      const fs = calcWordSearchScore(foundWords.size, timeElapsed);
      setTimeout(() => finishGame(fs), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundWords, phase, gridData]);

  // Check if clicked cell is part of any word to find
  const handleCellClick = (row: number, col: number) => {
    if (phase !== 'playing' || !gridData) return;

    // Find if this cell is part of any unfound word
    const matchedWordPos = gridData.wordPositions.find(wp =>
      !foundWords.has(wp.word) &&
      wp.row === row &&
      col >= wp.startCol &&
      col < wp.startCol + wp.word.length
    );

    if (matchedWordPos) {
      setFoundWords(prev => new Set([...prev, matchedWordPos.word]));
    }
  };

  const isCellPartOfFoundWord = (row: number, col: number): boolean => {
    if (!gridData) return false;
    return gridData.wordPositions.some(wp =>
      foundWords.has(wp.word) && wp.row === row && col >= wp.startCol && col < wp.startCol + wp.word.length
    );
  };

  const score = calcWordSearchScore(foundWords.size, timeElapsed);


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
              Знайдіть задані слова серед рядків букв. Виділяйте слова протягуванням по буквах.
            </p>
          </div>

          {/* Settings */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-3">
                Розмір сітки: {gridRows} × {gridCols}
              </label>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-muted-foreground">Рядків: {gridRows}</span>
                  <Slider
                    value={[gridRows]}
                    onValueChange={([v]) => setGridRows(v)}
                    min={8}
                    max={16}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Стовпців: {gridCols}</span>
                  <Slider
                    value={[gridCols]}
                    onValueChange={([v]) => setGridCols(v)}
                    min={9}
                    max={15}
                    step={1}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Кількість слів для пошуку: {wordCount}
              </label>
              <Slider
                value={[wordCount]}
                onValueChange={([v]) => setWordCount(v)}
                min={2}
                max={Math.min(6, gridRows)}
                step={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Розмір шрифта
              </label>
              <div className="flex gap-2">
                {FONT_SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      fontSize === opt.value
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={wordBankLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={22} />
            {wordBankLoading ? 'Завантаження...' : 'Почати'}
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
              <p className="text-2xl font-bold text-accent">{foundWords.size}/{gridData?.wordsToFind.length || wordCount}</p>
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
    <div className="max-w-3xl mx-auto p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => finishGame(calcWordSearchScore(foundWords.size, timeElapsed))}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
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
      <div className="glass-card p-4 select-none overflow-x-auto">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(24px, 1fr))` }}
        >
          {gridData?.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r}-${c}`;
              const isFound = isCellPartOfFoundWord(r, c);

              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(r, c)}
                  style={{ fontSize: `${fontSize}px` }}
                  className={`aspect-square flex items-center justify-center font-mono font-bold rounded cursor-pointer transition-all select-none ${
                    isFound
                      ? 'bg-success/20 text-success'
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
        Протягніть по буквах слова в рядку, щоб виділити його
      </p>
    </div>
  );
};

export default WordSearchExercise;
