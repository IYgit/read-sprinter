import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Settings, Trophy, RotateCcw, Grid3X3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveExerciseResult } from '@/lib/exerciseStats';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';
import { calcSchulteScore } from '@/lib/scoring';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FONT_SIZE_OPTIONS = [
  { label: 'S', value: 16 },
  { label: 'M', value: 20 },
  { label: 'L', value: 26 },
  { label: 'XL', value: 32 },
];

const SchulteTableExercise = () => {
  const navigate = useNavigate();

  const [gridSize, setGridSize] = useState(5);
  const [fontSize, setFontSize] = useState(20);
  const [phase, setPhase] = useState<'settings' | 'playing' | 'results'>('settings');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [clickedCells, setClickedCells] = useState<Set<number>>(new Set());
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSaved = useRef(false);

  const totalCells = gridSize * gridSize;

  const startGame = useCallback(() => {
    const nums = shuffleArray(Array.from({ length: totalCells }, (_, i) => i + 1));
    setNumbers(nums);
    setNextNumber(1);
    setClickedCells(new Set());
    setWrongCell(null);
    setErrors(0);
    setScore(0);
    hasSaved.current = false;
    setPhase('playing');
    setStartTime(Date.now());
    setElapsed(0);
  }, [totalCells]);

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 100);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase, startTime]);

  const handleCellClick = (num: number, index: number) => {
    if (phase !== 'playing') return;
    if (clickedCells.has(index)) return;

    if (num === nextNumber) {
      const newClicked = new Set(clickedCells);
      newClicked.add(index);
      setClickedCells(newClicked);
      setWrongCell(null);

      if (nextNumber === totalCells) {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalTime = Date.now() - startTime;
        setElapsed(finalTime);
        // Score: base 1000, minus time penalty, minus error penalty
        const calculatedScore = calcSchulteScore(finalTime, errors);
        setScore(calculatedScore);
        setPhase('results');
      } else {
        setNextNumber(nextNumber + 1);
      }
    } else {
      setWrongCell(index);
      setErrors(e => e + 1);
      setTimeout(() => setWrongCell(null), 400);
    }
  };

  useEffect(() => {
    if (phase === 'results' && !hasSaved.current) {
      hasSaved.current = true;
      saveExerciseResult('schulte-table', score);
    }
  }, [phase, score]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return min > 0 ? `${min}:${sec.toString().padStart(2, '0')}.${tenths}` : `${sec}.${tenths}с`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <nav className="border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            На головну
          </button>
          <span className="text-sm font-medium text-primary">Таблиця Шульте</span>
          <div className="w-20" />
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">

          {/* Settings */}
          {phase === 'settings' && (
            <div className="glass-card p-8 animate-fade-in-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Grid3X3 size={32} className="text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Таблиця Шульте</h1>
                <p className="text-sm text-muted-foreground">
                  Знайдіть і натисніть всі числа по порядку якомога швидше.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-3">
                    Розмір таблиці: {gridSize}×{gridSize} ({totalCells} чисел)
                  </label>
                  <div className="flex gap-2">
                    {[3, 4, 5, 6, 7].map(s => (
                      <button
                        key={s}
                        onClick={() => setGridSize(s)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          gridSize === s
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {s}×{s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-3">
                    Розмір шрифта
                  </label>
                  <div className="flex gap-2">
                    {FONT_SIZE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFontSize(opt.value)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          fontSize === opt.value
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startGame}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Почати
                </button>
              </div>

              <ExerciseStatsChart exerciseId="schulte-table" title="Історія результатів" />
            </div>
          )}

          {/* Playing */}
          {phase === 'playing' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Знайдіть: <span className="text-2xl font-bold text-primary ml-1">{nextNumber}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>⏱ {formatTime(elapsed)}</span>
                  <span className={errors > 0 ? 'text-destructive' : ''}>Помилки: {errors}</span>
                </div>
              </div>

              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
              >
                {numbers.map((num, index) => {
                  const isClicked = clickedCells.has(index);
                  const isWrong = wrongCell === index;

                  return (
                    <button
                      key={index}
                      onClick={() => handleCellClick(num, index)}
                      disabled={isClicked}
                      style={{ fontSize: `${fontSize}px` }}
                      className={`
                        aspect-square rounded-xl font-bold transition-all duration-200 select-none
                        ${isClicked
                          ? 'bg-primary/20 text-primary/40 scale-95'
                          : isWrong
                            ? 'bg-destructive/30 text-destructive border-destructive/50 border scale-95 animate-shake'
                            : 'bg-card border border-border hover:border-primary/40 hover:bg-card/80 text-foreground active:scale-95 cursor-pointer'
                        }
                      `}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results */}
          {phase === 'results' && (
            <div className="glass-card p-8 animate-fade-in-up">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Trophy size={32} className="text-accent" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Результати</h2>
                <p className="text-4xl font-bold text-primary">{score} балів</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatTime(elapsed)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Час</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{errors}</p>
                  <p className="text-xs text-muted-foreground mt-1">Помилки</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{gridSize}×{gridSize}</p>
                  <p className="text-xs text-muted-foreground mt-1">Розмір</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Ще раз
                </button>
                <button
                  onClick={() => setPhase('settings')}
                  className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings size={18} />
                  Налаштування
                </button>
              </div>

              <ExerciseStatsChart exerciseId="schulte-table" title="Історія результатів" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchulteTableExercise;
