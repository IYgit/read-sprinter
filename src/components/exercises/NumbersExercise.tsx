import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Play, Trophy, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveExerciseResult } from '@/lib/exerciseStats';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';
import { calcNumbersScore } from '@/lib/scoring';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
    setTimeout(() => {
      startTimeRef.current = Date.now();
      showNextNumber();
    }, 1000);
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
      const newResults = [...results, result];
      const newCorrect = newResults.filter(r => r.correct).length;
      const finalDuration = Date.now() - startTimeRef.current;
      setDurationMs(finalDuration);
      const finalScore = calcNumbersScore(newCorrect, finalDuration, newResults.length - newCorrect, displayTime);
      setTimeout(async () => {
        await saveExerciseResult('numbers', finalScore);
        setPhase('results');
      }, 1200);
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
  const score = calcNumbersScore(correctCount, durationMs, results.length - correctCount, displayTime);
  const accuracy = results.length > 0
    ? Math.round((correctCount / results.length) * 100)
    : 0;



  if (phase === 'results') {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={20} />{t('common.back')}
        </button>
        <div className="glass-card p-8 text-center">
          <Trophy size={48} className="text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">{t('common.results')}</h2>
          <p className="text-muted-foreground mb-8">{t('numbers.resultTitle')}</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-sm text-muted-foreground">{t('common.score')}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-accent">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">{t('common.accuracy')}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-foreground">{results.filter((r) => r.correct).length}/{totalRounds}</p>
              <p className="text-sm text-muted-foreground">{t('common.correct')}</p>
            </div>
          </div>
          <ExerciseStatsChart exerciseId="numbers" title={t('numbers.history')} />
          <div className="flex gap-4 justify-center mt-6">
            <button onClick={startGame} className="btn-primary flex items-center gap-2">
              <RotateCcw size={18} />{t('common.restart')}
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors">
              {t('common.backHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'settings') {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={20} />{t('common.back')}
        </button>
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{t('numbers.title')}</h2>
            <p className="text-muted-foreground">{t('numbers.subtitle')}</p>
          </div>
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">{t('numbers.digits')}: <span className="text-primary font-bold">{digitCount}</span></label>
              <div className="flex gap-2">
                {[3, 4, 5, 6, 7, 8].map(n => (
                  <button key={n} onClick={() => setDigitCount(n)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${digitCount === n ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">{t('numbers.displayTime')}: <span className="text-accent font-bold">{displayTime} {t('common.ms')}</span></label>
              <div className="flex gap-2 flex-wrap">
                {[1, 5, 20, 30, 50, 100, 200, 300, 500, 700, 1000, 1500, 2000].map(ms => (
                  <button key={ms} onClick={() => setDisplayTime(ms)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${displayTime === ms ? 'bg-accent text-accent-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>{ms < 1000 ? `${ms}${t('common.ms')}` : `${ms/1000}${t('common.seconds')}`}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">{t('common.fontSize')}</label>
              <div className="flex gap-2">
                {FONT_SIZE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setFontSize(opt.value)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${fontSize === opt.value ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={startGame} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <Play size={20} />{t('common.start')}
          </button>
        </div>
      </div>
    );
  }

  // Playing phase
  return (
    <div className="max-w-md mx-auto p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />{t('common.finish')}
        </button>
        <span className="text-sm text-muted-foreground">{t('numbers.round', { current: round, total: totalRounds })}</span>
      </div>

      <div className={`glass-card p-8 text-center mb-4 transition-all ${
        feedback === 'correct' ? 'border-success bg-success/5' : feedback === 'incorrect' ? 'border-destructive bg-destructive/5' : 'border-border bg-card/30'
      }`}>
        {showNumber ? (
          <span className="font-mono font-bold text-primary" style={{ fontSize: `${fontSize}px` }}>{currentNumber}</span>
        ) : feedback === 'correct' ? (
          <span className="text-2xl font-bold text-success">{t('numbers.correctFeedback')}</span>
        ) : feedback === 'incorrect' ? (
          <div className="text-center">
            <span className="text-xl font-bold text-destructive block">{t('numbers.incorrectFeedback')}</span>
            <span className="text-muted-foreground text-sm mt-1 block">{t('numbers.correctAnswer')} <span className="font-mono font-bold text-foreground">{currentNumber}</span></span>
          </div>
        ) : (
          <span className="text-muted-foreground text-lg">{t('numbers.enterNumber')}</span>
        )}
      </div>

      {!showNumber && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.replaceAll(/\D/g, ''))}
            onKeyDown={handleKeyDown}
            placeholder={t('numbers.enterNumber')}
            className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-foreground font-mono text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={waitingForNext}
          />
          <button onClick={handleSubmit} disabled={waitingForNext || !userInput.trim()} className="px-6 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            OK
          </button>
        </div>
      )}
    </div>
  );
};

export default NumbersExercise;
