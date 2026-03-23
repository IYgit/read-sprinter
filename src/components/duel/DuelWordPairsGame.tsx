import { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, Zap, WifiOff, UserX, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saveExerciseResult } from '@/lib/exerciseStats';
import { calcWordPairsScore } from '@/lib/scoring';

interface WordPair {
  w1: string;
  w2: string;
  diff: boolean;
}

interface CellState {
  pair: WordPair;
  selected: boolean;  // clicked by user
  revealed: boolean;  // show correct/incorrect highlight
}

interface MatchInfo {
  sessionId: number;
  opponentName: string;
  pairs: WordPair[];
  wpRows: number;
  wpCols: number;
  wpTimeLimit: number;  // seconds
  wpFontSize: number;
  totalCells: number;   // number of "different" pairs (= progress target)
}

interface DuelWordPairsGameProps {
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

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return min > 0
    ? `${min}:${sec.toString().padStart(2, '0')}.${tenths}`
    : `${sec}.${tenths}с`;
}

const DuelWordPairsGame = ({
  matchInfo, opponentProgress, opponentFinished, opponentDurationMs,
  opponentDisconnected, opponentLeft, onProgress, onFinish, onLeave,
}: DuelWordPairsGameProps) => {
  const { pairs, wpRows, wpCols, wpTimeLimit, wpFontSize, totalCells, opponentName } = matchInfo;
  const { t } = useTranslation();

  const [grid, setGrid] = useState<CellState[]>(() =>
    pairs.map((p) => ({ pair: p, selected: false, revealed: false }))
  );
  const [timeLeft, setTimeLeft] = useState(wpTimeLimit);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSaved = useRef(false);
  const finishedRef = useRef(false);

  // Elapsed timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const doFinish = useCallback((currentCorrect: number, currentWrong: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const finalMs = Date.now() - startTimeRef.current;
    setElapsed(finalMs);
    setFinished(true);

    // Reveal all unselected cells
    setGrid((prev) => prev.map((c) => ({ ...c, revealed: true })));

    const score = calcWordPairsScore(currentCorrect, currentWrong, finalMs);
    onFinish(finalMs, currentWrong, score, currentCorrect);

    if (!hasSaved.current) {
      hasSaved.current = true;
      saveExerciseResult('word-pairs', score);
    }
  }, [onFinish]);

  // Time's up
  useEffect(() => {
    if (timeLeft === 0 && !finishedRef.current) {
      doFinish(correctCount, wrongCount);
    }
  }, [timeLeft, correctCount, wrongCount, doFinish]);

  const handleCellClick = useCallback((idx: number) => {
    if (finished || finishedRef.current || grid[idx].selected) return;

    const cell = grid[idx];
    const isCorrect = cell.pair.diff;

    setGrid((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], selected: true, revealed: true };
      return next;
    });

    if (isCorrect) {
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);
      onProgress(newCorrect, wrongCount);

      // All different pairs found → finish immediately
      if (newCorrect >= totalCells) {
        doFinish(newCorrect, wrongCount);
      }
    } else {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      onProgress(correctCount, newWrong);
    }
  }, [finished, grid, correctCount, wrongCount, totalCells, onProgress, doFinish]);

  const opponentPct = totalCells > 0 ? (opponentProgress / totalCells) * 100 : 0;
  const myPct = totalCells > 0 ? (correctCount / totalCells) * 100 : 0;

  const opponentStatusText = opponentFinished
    ? t('duel.opponentFinished', { time: opponentDurationMs != null ? formatTime(opponentDurationMs) : '' }).trim()
    : `${opponentProgress}/${totalCells}`;

  const getCellClass = (cell: CellState) => {
    if (!cell.selected && !cell.revealed) {
      return 'bg-card border-border hover:border-primary/40 hover:bg-card/80 cursor-pointer';
    }
    if (cell.selected && cell.pair.diff) {
      return 'bg-success/10 border-success cursor-default';
    }
    if (cell.selected && !cell.pair.diff) {
      return 'bg-destructive/10 border-destructive cursor-default';
    }
    if (!cell.selected && cell.revealed && cell.pair.diff) {
      // Missed different pair shown at end
      return 'bg-accent/5 border-accent/50 cursor-default';
    }
    return 'bg-secondary/30 border-border cursor-default';
  };

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
          <span className="text-muted-foreground">⚔️ <span className="text-foreground font-medium">{opponentName}</span></span>
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
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {t('wordPairs.instruction')} <span className="text-primary font-semibold">{t('wordPairs.instructionHighlight')}</span>
        </p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>⏱ {formatTime(elapsed)}</span>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold font-mono ${timeLeft <= 10 ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <Timer size={14} /> {timeLeft}{t('wordPairs.timeUnit')}
          </div>
          <span className={wrongCount > 0 ? 'text-destructive' : ''}>{t('schulte.errorsCount', { count: wrongCount })}</span>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid gap-2 mb-4"
        style={{ gridTemplateColumns: `repeat(${wpCols}, 1fr)` }}
      >
        {grid.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            disabled={cell.selected || finished}
            className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${getCellClass(cell)}`}
          >
            <span
              className="block font-medium leading-relaxed"
              style={{ fontSize: `${wpFontSize}px` }}
            >
              {cell.pair.w1}
            </span>
            <span className="block w-8 h-px bg-border mx-auto my-1" />
            <span
              className="block font-medium leading-relaxed"
              style={{ fontSize: `${wpFontSize}px` }}
            >
              {cell.pair.w2}
            </span>
          </button>
        ))}
      </div>

      {/* My progress */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">{t('duel.myProgress')}</span>
          <span className="text-muted-foreground">{correctCount}/{totalCells}</span>
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

export default DuelWordPairsGame;

