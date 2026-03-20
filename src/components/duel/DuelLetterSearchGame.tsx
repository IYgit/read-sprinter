import { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, Zap, WifiOff, UserX } from 'lucide-react';
import { saveExerciseResult } from '@/lib/exerciseStats';
import { calcLetterSearchScore } from '@/lib/scoring';

interface MatchInfo {
  sessionId: number;
  opponentName: string;
  lsGrid: string[][];
  lsTargetLetters: string[];
  lsRows: number;
  lsCols: number;
  lsLetterCount: number;
  totalCells: number; // = totalTargets
}

interface DuelLetterSearchGameProps {
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
  return min > 0 ? `${min}:${sec.toString().padStart(2, '0')}` : `${totalSec}с`;
}

const DuelLetterSearchGame = ({
  matchInfo,
  opponentProgress,
  opponentFinished,
  opponentDurationMs,
  opponentDisconnected,
  opponentLeft,
  onProgress,
  onFinish,
  onLeave,
}: DuelLetterSearchGameProps) => {
  const { lsGrid, lsTargetLetters, lsCols, lsRows, lsLetterCount, totalCells, opponentName } = matchInfo;

  // Track which cells have been found: Set of "r-c" keys
  const [foundCells,  setFoundCells]  = useState<Set<string>>(new Set());
  const [errors,      setErrors]      = useState(0);
  const [elapsed,     setElapsed]     = useState(0);
  const [finished,    setFinished]    = useState(false);

  const startTimeRef = useRef(Date.now());
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSaved     = useRef(false);
  const errorsRef    = useRef(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (finished) return;
    const key = `${r}-${c}`;
    if (foundCells.has(key)) return;

    const letter = lsGrid[r]?.[c];
    if (!letter) return;

    if (lsTargetLetters.includes(letter)) {
      setFoundCells(prev => {
        const next = new Set([...prev, key]);
        const foundCount = next.size;

        onProgress(foundCount, errorsRef.current);

        if (foundCount >= totalCells && !hasSaved.current) {
          hasSaved.current = true;
          if (timerRef.current) clearInterval(timerRef.current);
          const finalMs  = Date.now() - startTimeRef.current;
          const elapsedSec = Math.floor(finalMs / 1000);
          const score = calcLetterSearchScore(
            foundCount, errorsRef.current, elapsedSec,
            lsRows * lsCols, lsLetterCount,
          );
          setFinished(true);
          setElapsed(finalMs);
          saveExerciseResult('letter-search', score);
          onFinish(finalMs, errorsRef.current, score, foundCount);
        }
        return next;
      });
    } else {
      errorsRef.current += 1;
      setErrors(errorsRef.current);
    }
  }, [finished, foundCells, lsGrid, lsTargetLetters, totalCells, lsRows, lsCols, lsLetterCount, onProgress, onFinish]);

  const foundCount  = foundCells.size;
  const opponentPct = totalCells > 0 ? (opponentProgress / totalCells) * 100 : 0;
  const myPct       = totalCells > 0 ? (foundCount / totalCells) * 100 : 0;

  const opponentStatusText = opponentFinished
    ? `✅ Знайшов усі! ${opponentDurationMs != null ? formatTime(opponentDurationMs) : ''}`.trim()
    : `${opponentProgress}/${totalCells}`;

  return (
    <div className="animate-fade-in-up">

      {opponentDisconnected && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4">
          <WifiOff size={15} />
          Суперник відключився від мережі
        </div>
      )}
      {opponentLeft && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-4">
          <UserX size={15} />
          Суперник покинув дуель
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

      {/* Timer + found count + errors */}
      <div className="flex items-center justify-between mb-3">
        <div className="glass-card px-4 py-2 text-sm font-mono">
          ⏱ {formatTime(elapsed)}
        </div>
        <div className="text-sm text-muted-foreground">
          Знайдено: <span className="font-bold text-primary">{foundCount}/{totalCells}</span>
          {errors > 0 && (
            <span className="ml-3 text-destructive">✗ {errors}</span>
          )}
        </div>
      </div>

      {/* Target letters */}
      <div className="glass-card p-4 mb-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">Знайти:</span>
        {lsTargetLetters.map(l => (
          <span
            key={l}
            className="px-3 py-1 rounded-lg bg-accent/20 text-accent font-bold text-lg"
          >
            {l}
          </span>
        ))}
      </div>

      {/* Letter grid */}
      <div className="glass-card p-3 mb-3 overflow-x-auto select-none">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${lsCols}, minmax(22px, 1fr))` }}
        >
          {lsGrid.map((row, r) =>
            row.map((letter, c) => {
              const key     = `${r}-${c}`;
              const isFound = foundCells.has(key);
              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(r, c)}
                  className={`aspect-square flex items-center justify-center text-sm font-bold rounded transition-all select-none cursor-pointer ${
                    isFound
                      ? 'bg-accent/25 text-accent scale-90 cursor-default'
                      : finished
                        ? 'text-foreground/40 cursor-default'
                        : 'hover:bg-muted/50 text-foreground/80 active:scale-95'
                  }`}
                >
                  {letter}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* My progress */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Мій прогрес</span>
          <span className="text-muted-foreground">{foundCount}/{totalCells}</span>
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
            <LogOut size={15} />
            Покинути дуель
          </button>
        </div>
      )}

      {finished && !opponentFinished && (
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">
            Ви знайшли всі букви! Очікуємо результати суперника...
          </p>
          <button
            onClick={onLeave}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:text-foreground transition-colors"
          >
            <Zap size={15} />
            Не чекати (покинути дуель)
          </button>
        </div>
      )}
    </div>
  );
};

export default DuelLetterSearchGame;

