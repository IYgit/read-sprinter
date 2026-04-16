import { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, Zap, WifiOff, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saveExerciseResult } from '@/lib/exerciseStats';
import { calcNumbersScore } from '@/lib/scoring';

interface MatchInfo {
  sessionId: number;
  opponentName: string;
  numbers: number[];   // 10 numbers, same for both players
  digitCount: number;
  displayTime: number; // ms
  totalRounds: number; // always 10
  totalCells: number;  // same as totalRounds (used for progress bar)
}

interface DuelNumbersGameProps {
  matchInfo: MatchInfo;
  opponentProgress: number;
  opponentFinished: boolean;
  opponentDurationMs: number | null;
  opponentDisconnected: boolean;
  opponentLeft: boolean;
  onProgress: (progress: number, errors: number) => void;
  onFinish: (durationMs: number, errors: number, score: number, progress: number) => void;
  onLeave: () => void;
}

type RoundPhase = 'showing' | 'input' | 'feedback';

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return min > 0
    ? `${min}:${sec.toString().padStart(2, '0')}.${tenths}`
    : `${sec}.${tenths}с`;
}

const DuelNumbersGame = ({
  matchInfo,
  opponentProgress,
  opponentFinished,
  opponentDurationMs,
  opponentDisconnected,
  opponentLeft,
  onProgress,
  onFinish,
  onLeave,
}: DuelNumbersGameProps) => {
  const { numbers, displayTime, totalRounds, totalCells, opponentName } = matchInfo;
  const { t } = useTranslation();

  const [round, setRound] = useState(0);           // current round index (0-based)
  const [roundPhase, setRoundPhase] = useState<RoundPhase>('showing');
  const [initialDelay, setInitialDelay] = useState(true); // 1s pause before first number
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSaved = useRef(false);

  // Global elapsed timer — starts after the 1s initial delay
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setInitialDelay(false);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 100);
    }, 1000);
    return () => {
      clearTimeout(delayTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-hide number after displayTime and focus input
  useEffect(() => {
    if (initialDelay || roundPhase !== 'showing') return;
    const t = setTimeout(() => {
      setRoundPhase('input');
      setTimeout(() => inputRef.current?.focus(), 80);
    }, displayTime);
    return () => clearTimeout(t);
  }, [round, roundPhase, displayTime, initialDelay]);

  const handleSubmit = useCallback(() => {
    if (roundPhase !== 'input' || !userInput.trim()) return;

    const isCorrect = userInput.trim() === String(numbers[round]);
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    const newErrors = errors + (isCorrect ? 0 : 1);

    setCorrectCount(newCorrect);
    setErrors(newErrors);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setRoundPhase('feedback');

    const completedRounds = round + 1;

    if (completedRounds >= totalRounds) {
      // Last round — finish
      if (timerRef.current) clearInterval(timerRef.current);
      const finalMs = Date.now() - startTimeRef.current;
      setElapsed(finalMs);
      setFinished(true);

      // Score considers both accuracy and speed.
      // +100 per correct answer, -20 per error, -2 per second spent.
      const score = calcNumbersScore(newCorrect, finalMs, newErrors, displayTime);
      onFinish(finalMs, newErrors, score, completedRounds);

      if (!hasSaved.current) {
        hasSaved.current = true;
        saveExerciseResult('numbers', score);
      }
    } else {
      // Report progress after feedback delay, then move to next round
      onProgress(completedRounds, newErrors);
      setTimeout(() => {
        setRound(completedRounds);
        setUserInput('');
        setFeedback(null);
        setRoundPhase('showing');
      }, 1000);
    }
  }, [roundPhase, userInput, numbers, round, correctCount, errors, totalRounds, onProgress, onFinish]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const currentNumber = numbers[round];
  const opponentPct = totalCells > 0 ? (opponentProgress / totalCells) * 100 : 0;
  // correctCount + errors = total answered rounds (always up-to-date, unlike `round` which is queued via setState)
  const answeredRounds = correctCount + errors;
  const myDisplayedProgress = finished ? totalCells : answeredRounds;
  const myPct = totalCells > 0 ? (myDisplayedProgress / totalCells) * 100 : 0;

  let opponentStatusText = `${opponentProgress}/${totalCells}`;
  if (opponentFinished) {
    const timeStr = opponentDurationMs != null ? formatTime(opponentDurationMs) : '';
    opponentStatusText = t('duel.opponentFinished', { time: timeStr }).trim();
  }

  let borderClass = 'border-border bg-card/30';
  if (roundPhase === 'showing') borderClass = 'border-primary bg-card/30';
  else if (feedback === 'correct') borderClass = 'border-success bg-success/5';
  else if (feedback === 'incorrect') borderClass = 'border-destructive bg-destructive/5';

  const renderDisplayContent = () => (
    <div className={`min-h-[100px] flex items-center justify-center rounded-2xl border-2 border-dashed mb-6 transition-all duration-200 ${borderClass}`}>
      {finished && <span className="text-2xl font-bold text-success">{t('duel.finishedBanner')}</span>}
      {!finished && initialDelay && (
        <span className="text-muted-foreground text-lg animate-pulse">{t('numbers.getReady')}</span>
      )}
      {!finished && !initialDelay && roundPhase === 'showing' && (
        <span className="font-mono font-bold text-primary tracking-widest text-5xl">
          {currentNumber}
        </span>
      )}
      {!finished && !initialDelay && roundPhase !== 'showing' && feedback === 'correct' && (
        <span className="text-2xl font-bold text-success">{t('numbers.correctFeedback')}</span>
      )}
      {!finished && !initialDelay && roundPhase !== 'showing' && feedback === 'incorrect' && (
        <div className="text-center">
          <span className="text-xl font-bold text-destructive block">{t('numbers.incorrectFeedback')}</span>
          <span className="text-muted-foreground text-sm mt-1 block">
            {t('numbers.correctAnswer')} <span className="font-mono font-bold text-foreground">{currentNumber}</span>
          </span>
        </div>
      )}
      {!finished && !initialDelay && roundPhase === 'input' && feedback == null && (
        <span className="text-muted-foreground text-lg">{t('numbers.enterNumber')}</span>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in-up">

      {opponentDisconnected && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4">
          <WifiOff size={15} /> {t('duel.opponentDisconnected')}
        </div>
      )}
      {opponentLeft && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-4">
          <UserX size={15} /> {t('duel.opponentLeft')}
        </div>
      )}

      {/* Opponent progress */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">
            ⚔️ <span className="text-foreground font-medium">{opponentName}</span>
          </span>
          <span className="text-muted-foreground">{opponentStatusText}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-500 rounded-full"
            style={{ width: `${opponentPct}%` }}
          />
        </div>
      </div>

      {/* Game header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {t('numbers.round', { current: round + 1, total: totalRounds })}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>⏱ {formatTime(elapsed)}</span>
          <span className={errors > 0 ? 'text-destructive' : ''}>{t('schulte.errorsCount', { count: errors })}</span>
        </div>
      </div>

      {/* Round progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary/50 transition-all duration-300 rounded-full"
          style={{ width: `${(answeredRounds / totalRounds) * 100}%` }}
        />
      </div>

      {/* Number display */}
      <div className="glass-card p-8 mb-4">
        {renderDisplayContent()}

        {/* Input */}
        {!finished && (
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replaceAll(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              disabled={initialDelay || roundPhase !== 'input'}
              placeholder={t('numbers.enterNumber')}
              className="flex-1 px-6 py-4 rounded-xl bg-muted/50 border border-border text-center font-mono text-2xl tracking-widest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-40"
            />
            <button
              onClick={handleSubmit}
              disabled={initialDelay || roundPhase !== 'input' || !userInput.trim()}
              className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              OK
            </button>
          </div>
        )}

        
      </div>

      {/* My progress */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">{t('duel.myProgress')}</span>
          <span className="text-muted-foreground">{myDisplayedProgress}/{totalCells}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 rounded-full"
            style={{ width: `${myPct}%` }}
          />
        </div>
      </div>

      {!finished && (
        <div className="flex justify-center">
          <button
            onClick={onLeave}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:border-destructive/40 hover:text-destructive transition-colors"
          >
            <LogOut size={15} /> {t('duel.leaveGame')}
          </button>
        </div>
      )}

      {finished && !opponentFinished && (
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">{t('duel.waitingForOpponent')}</p>
          <button
            onClick={onLeave}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:text-foreground transition-colors"
          >
            <Zap size={15} /> {t('duel.noWait')}
          </button>
        </div>
      )}
    </div>
  );
};

export default DuelNumbersGame;

