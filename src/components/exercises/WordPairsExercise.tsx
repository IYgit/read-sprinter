import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Settings, Trophy, RotateCcw, Timer, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveExerciseResult } from '@/lib/exerciseStats';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';
import { wordPairsApi } from '@/lib/api';
import { calcWordPairsScore } from '@/lib/scoring';
import { useTranslation } from 'react-i18next';

interface WordPair {
  word1: string;
  word2: string;
  isDifferent: boolean;
}

interface CellState {
  pair: WordPair;
  selected: boolean;
  revealed: boolean;
}

const FONT_SIZE_OPTIONS = [
  { label: 'S', value: 12 },
  { label: 'M', value: 14 },
  { label: 'L', value: 18 },
];

/** Convert flat API response into 2D grid of CellState */
function buildGrid(rows: number, cols: number, items: { w1: string; w2: string; diff: boolean }[]): CellState[][] {
  const grid: CellState[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: CellState[] = [];
    for (let c = 0; c < cols; c++) {
      const item = items[r * cols + c];
      row.push({
        pair: { word1: item.w1, word2: item.w2, isDifferent: item.diff },
        selected: false,
        revealed: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

const WordPairsExercise = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [timeLimit, setTimeLimit] = useState(60);
  const [fontSize, setFontSize] = useState(14);
  const [phase, setPhase] = useState<'settings' | 'loading' | 'playing' | 'results'>('settings');
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [correctSelections, setCorrectSelections] = useState(0);
  const [wrongSelections, setWrongSelections] = useState(0);
  const [missedPairs, setMissedPairs] = useState(0);
  const [totalDifferent, setTotalDifferent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);

  // Реактивне обчислення балів — оновлюється після кожного кліку та кожну секунду.
  // В фазі 'playing' використовує поточний elapsed (точність: 1 сек).
  // В фазі 'results' використовує точний finalMs, збережений у durationMs.
  const score = calcWordPairsScore(
    correctSelections,
    wrongSelections,
    phase === 'results' ? durationMs : (timeLimit - timeLeft) * 1000,
  );

  const startGame = useCallback(async () => {
    setPhase('loading');
    try {
      const items = await wordPairsApi.getGrid(rows, cols);
      const newGrid = buildGrid(rows, cols, items);
      const diffCount = newGrid.flat().filter(c => c.pair.isDifferent).length;
      setGrid(newGrid);
      setTimeLeft(timeLimit);
      setDurationMs(0);
      setCorrectSelections(0);
      setWrongSelections(0);
      setTotalDifferent(diffCount);
      startTimeRef.current = Date.now();
      setPhase('playing');
    } catch {
      // fallback: return to settings on error
      setPhase('settings');
    }
  }, [rows, cols, timeLimit]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      finishGame();
    }
  }, [timeLeft, phase]);

  const finishGame = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalMs = Date.now() - startTimeRef.current;
    const missed = grid.flat().filter(c => c.pair.isDifferent && !c.selected).length;
    setMissedPairs(missed);
    setDurationMs(finalMs);
    setGrid(prev => prev.map(row => row.map(cell => ({ ...cell, revealed: true }))));
    const finalScore = calcWordPairsScore(correctSelections, wrongSelections, finalMs);
    await saveExerciseResult('word-pairs', finalScore);
    setPhase('results');
  }, [grid, correctSelections, wrongSelections]);

  const handleCellClick = (r: number, c: number) => {
    if (phase !== 'playing' || grid[r][c].selected) return;

    const cell = grid[r][c];
    const isCorrect = cell.pair.isDifferent;

    setGrid(prev => {
      const newGrid = prev.map(row => row.map(cell => ({ ...cell })));
      newGrid[r][c].selected = true;
      newGrid[r][c].revealed = true;
      return newGrid;
    });

    if (isCorrect) {
      setCorrectSelections(prev => prev + 1);
    } else {
      setWrongSelections(prev => prev + 1);
    }
  };

  const allDifferentFound = grid.flat().filter(c => c.pair.isDifferent && c.selected).length === totalDifferent && totalDifferent > 0;

  useEffect(() => {
    if (phase === 'playing' && allDifferentFound) {
      setTimeout(finishGame, 500);
    }
  }, [allDifferentFound, phase, finishGame]);



  if (phase === 'settings') {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={20} /> До вибору вправ
        </button>
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Settings size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Словопари</h2>
            <p className="text-muted-foreground">Знайдіть клітинки, де слова різні. Не обирайте однакові!</p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Розмір таблиці: <span className="text-primary font-bold">{rows}×{cols}</span>
              </label>
              <div className="flex gap-2">
                {[
                  [3, 3], [3, 4], [4, 4], [4, 5], [5, 5],
                ].map(([r, c]) => (
                  <button
                    key={`${r}x${c}`}
                    onClick={() => { setRows(r); setCols(c); }}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      rows === r && cols === c
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {r}×{c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Час: <span className="text-primary font-bold">{timeLimit}с</span>
              </label>
              <div className="flex gap-2">
                {[30, 45, 60, 90, 120].map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      timeLimit === t
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {t}с
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Розмір шрифта
              </label>
              <div className="flex gap-2">
                {FONT_SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      fontSize === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
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
          <p className="text-muted-foreground mb-8">Вправа «Словопари» завершена</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-xs text-muted-foreground">Балів</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-success">{correctSelections}</p>
              <p className="text-xs text-muted-foreground">Правильно</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-destructive">{wrongSelections}</p>
              <p className="text-xs text-muted-foreground">Помилок</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-accent">{missedPairs}</p>
              <p className="text-xs text-muted-foreground">Пропущено</p>
            </div>
          </div>

          <ExerciseStatsChart exerciseId="word-pairs" title="Статистика — Словопари" />

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

  if (phase === 'loading') {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p>Завантаження слів...</p>
        </div>
      </div>
    );
  }

  // Playing
  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={finishGame} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} /> Завершити
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Бали: <span className="text-primary font-bold">{score}</span>
          </span>
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${timeLeft <= 10 ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <Timer size={16} />
            <span className="font-bold font-mono">{timeLeft}с</span>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-2 mb-5">
        {/* Time bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Час</span>
            <span>{timeLeft} / {timeLimit}с</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                timeLeft <= 10 ? 'bg-destructive' : timeLeft <= 20 ? 'bg-accent' : 'bg-primary'
              }`}
              style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
            />
          </div>
        </div>

        {/* Found pairs bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Знайдено пар</span>
            <span>{correctSelections} / {totalDifferent}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: totalDifferent > 0 ? `${(correctSelections / totalDifferent) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mb-4">
        Оберіть клітинки, де слова <span className="text-primary font-semibold">різні</span>
      </p>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            let borderClass = 'border-border';
            let bgClass = 'bg-card/50 hover:bg-card/80';

            if (cell.selected || cell.revealed) {
              if (cell.pair.isDifferent && cell.selected) {
                borderClass = 'border-success';
                bgClass = 'bg-success/10';
              } else if (!cell.pair.isDifferent && cell.selected) {
                borderClass = 'border-destructive';
                bgClass = 'bg-destructive/10';
              } else if (cell.pair.isDifferent && !cell.selected && cell.revealed) {
                borderClass = 'border-accent/50';
                bgClass = 'bg-accent/5';
              }
            }

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                disabled={cell.selected}
                className={`p-3 rounded-xl border-2 ${borderClass} ${bgClass} transition-all duration-200 text-center ${
                  cell.selected ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span className="block font-medium leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{cell.pair.word1}</span>
                <span className="block w-8 h-px bg-border mx-auto my-1" />
                <span className="block font-medium leading-relaxed" style={{ fontSize: `${fontSize}px` }}>{cell.pair.word2}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WordPairsExercise;
