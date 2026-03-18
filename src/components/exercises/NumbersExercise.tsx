import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Settings, Trophy, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveExerciseResult } from '@/lib/exerciseStats';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';

interface RoundResult {
  number: string;
  userInput: string;
  correct: boolean;
  displayTime: number;
  digitCount: number;
}

const FONT_SIZE_OPTIONS = [
  { label: 'M', value: 48 },
  { label: 'L', value: 60 },
  { label: 'XL', value: 72 },
];

const NumbersExercise = () => {
  const navigate = useNavigate();

  // Settings
  const [digitCount, setDigitCount] = useState(3);
  const [displayTime, setDisplayTime] = useState(1000); // ms
  const [fontSize, setFontSize] = useState(60);

  // Game state
  const [phase, setPhase] = useState<'settings' | 'playing' | 'results'>('settings');
  const [currentNumber, setCurrentNumber] = useState('');
  const [showNumber, setShowNumber] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(10);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const [durationMs, setDurationMs] = useState(0);

  const generateNumber = useCallback((digits: number) => {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }, []);

  const showNextNumber = useCallback(() => {
    const num = generateNumber(digitCount);
    setCurrentNumber(num);
    setShowNumber(true);
    setUserInput('');
    setFeedback(null);
    setWaitingForNext(false);

    timeoutRef.current = setTimeout(() => {
      setShowNumber(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }, displayTime);
  }, [digitCount, displayTime, generateNumber]);

  const startGame = () => {
    setPhase('playing');
    setRound(0);
    setResults([]);
    setFeedback(null);
    setDurationMs(0);
    startTimeRef.current = Date.now();
    setTimeout(showNextNumber, 500);
  };

  const handleSubmit = () => {
    if (waitingForNext || showNumber || !userInput.trim()) return;

    const isCorrect = userInput.trim() === currentNumber;
    const result: RoundResult = {
      number: currentNumber,
      userInput: userInput.trim(),
      correct: isCorrect,
      displayTime,
      digitCount,
    };

    setResults((prev) => [...prev, result]);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setWaitingForNext(true);

    const nextRound = round + 1;
    setRound(nextRound);

    if (nextRound >= totalRounds) {
      setDurationMs(Date.now() - startTimeRef.current);
      setTimeout(() => setPhase('results'), 1200);
    } else {
      setTimeout(() => {
        showNextNumber();
      }, 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const correctCount = results.filter((r) => r.correct).length;
  const timePenalty = Math.floor(durationMs / 1000) * 2;
  const errorPenalty = (results.length - correctCount) * 20;
  const score = Math.max(0, correctCount * 100 - timePenalty - errorPenalty);
  const accuracy = results.length > 0
    ? Math.round((correctCount / results.length) * 100)
    : 0;

  useEffect(() => {
    if (phase === 'results' && results.length > 0) {
      saveExerciseResult('numbers', score);
    }
  }, [phase]);

  if (phase === 'results') {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          До вибору вправ
        </button>

        <div className="glass-card p-8 text-center">
          <Trophy size={48} className="text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Результати</h2>
          <p className="text-muted-foreground mb-8">Вправа «Числа» завершена</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-sm text-muted-foreground">Балів</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-accent">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Точність</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-foreground">
                {results.filter((r) => r.correct).length}/{totalRounds}
              </p>
              <p className="text-sm text-muted-foreground">Правильно</p>
            </div>
          </div>

          {/* Round details */}
          <div className="text-left space-y-2 mb-8">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Деталі раундів
            </h3>
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  r.correct
                    ? 'border-success/30 bg-success/5'
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                <span className="text-sm text-muted-foreground">#{i + 1}</span>
                <span className="font-mono font-bold">{r.number}</span>
                <span className={`font-mono ${r.correct ? 'text-success' : 'text-destructive'}`}>
                  {r.userInput || '—'}
                </span>
                <span className="text-sm">{r.correct ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>

          <ExerciseStatsChart exerciseId="numbers" title="Статистика — Числа" />

          <div className="flex gap-4 justify-center mt-6">
            <button onClick={startGame} className="btn-primary flex items-center gap-2">
              <RotateCcw size={18} />
              Ще раз
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
            >
              До вправ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'settings') {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          До вибору вправ
        </button>

        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Settings size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Числа</h2>
            <p className="text-muted-foreground">
              Число з'явиться на короткий час. Запам'ятайте та введіть його.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {/* Digit count */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Кількість цифр: <span className="text-primary font-bold text-lg">{digitCount}</span>
              </label>
              <div className="flex gap-2">
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDigitCount(n)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      digitCount === n
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Display time */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Час показу:{' '}
                <span className="text-primary font-bold text-lg">{displayTime} мс</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {[50, 100, 200, 300, 500, 700, 1000, 1500, 2000].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDisplayTime(t)}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      displayTime === t
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {t >= 1000 ? `${t / 1000}с` : `${t}мс`}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Розмір шрифта
              </label>
              <div className="flex gap-2">
                {FONT_SIZE_OPTIONS.map((opt) => (
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
            <Play size={22} />
            Почати ({totalRounds} раундів)
          </button>
        </div>
      </div>
    );
  }

  // Playing phase
  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { setPhase('settings'); if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          Зупинити
        </button>
        <div className="text-sm text-muted-foreground">
          Раунд <span className="text-primary font-bold">{round + 1}</span> / {totalRounds}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar mb-8">
        <div
          className="progress-fill"
          style={{ width: `${(round / totalRounds) * 100}%` }}
        />
      </div>

      <div className="glass-card p-8">
        {/* Number display area */}
        <div
          className={`min-h-[120px] flex items-center justify-center rounded-2xl border-2 border-dashed mb-6 transition-all duration-200 ${
            showNumber
              ? 'border-primary bg-primary/5'
              : feedback === 'correct'
              ? 'border-success bg-success/5'
              : feedback === 'incorrect'
              ? 'border-destructive bg-destructive/5'
              : 'border-border bg-card/30'
          }`}
        >
          {showNumber ? (
            <span
              style={{ fontSize: `${fontSize}px` }}
              className="font-mono font-bold text-primary tracking-widest animate-fade-in-up"
            >
              {currentNumber}
            </span>
          ) : feedback === 'correct' ? (
            <span className="text-2xl font-bold text-success">✓ Правильно!</span>
          ) : feedback === 'incorrect' ? (
            <div className="text-center">
              <span className="text-xl font-bold text-destructive block">✗ Неправильно</span>
              <span className="text-muted-foreground text-sm mt-1 block">
                Правильна відповідь: <span className="font-mono font-bold text-foreground">{currentNumber}</span>
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-lg">Введіть число...</span>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            disabled={showNumber || waitingForNext}
            placeholder="Введіть число"
            className="flex-1 px-6 py-4 rounded-xl bg-muted/50 border border-border text-center font-mono text-2xl tracking-widest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-40"
          />
          <button
            onClick={handleSubmit}
            disabled={showNumber || waitingForNext || !userInput.trim()}
            className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            OK
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Натисніть <span className="text-primary font-medium">Enter</span> для підтвердження
        </p>
      </div>
    </div>
  );
};

export default NumbersExercise;
