import { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, Zap, WifiOff, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saveExerciseResult } from '@/lib/exerciseStats';
import { calcWordSearchScore } from '@/lib/scoring';

interface WsWordPosition {
  word: string;
  row: number;
  startCol: number;
}

interface MatchInfo {
  sessionId: number;
  opponentName: string;
  wsGrid: string[][];
  wsWords: string[];
  wsWordPositions: WsWordPosition[];
  wsRows: number;
  wsCols: number;
  wsWordCount: number;
  wsFontSize: number;
  totalCells: number; // = wsWordCount
}

interface DuelWordSearchGameProps {
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

function formatTime(ms: number, secondsUnit = 'с'): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0
    ? `${min}:${sec.toString().padStart(2, '0')}`
    : `${totalSec}${secondsUnit}`;
}

const DuelWordSearchGame = ({
  matchInfo,
  opponentProgress,
  opponentFinished,
  opponentDurationMs,
  opponentDisconnected,
  opponentLeft,
  onProgress,
  onFinish,
  onLeave,
}: DuelWordSearchGameProps) => {
  const {
    wsGrid, wsWords, wsWordPositions,
    wsCols, wsFontSize, totalCells, opponentName,
  } = matchInfo;
  const { t } = useTranslation();

  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [elapsed,    setElapsed]    = useState(0);
  const [finished,   setFinished]   = useState(false);

  const startTimeRef = useRef(Date.now());
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSaved     = useRef(false);

  // Start elapsed timer on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (finished) return;

    const matchedPos = wsWordPositions.find(wp =>
      !foundWords.has(wp.word) &&
      wp.row === row &&
      col >= wp.startCol &&
      col < wp.startCol + wp.word.length,
    );
    if (!matchedPos) return;

    const newFoundWords = new Set([...foundWords, matchedPos.word]);
    setFoundWords(newFoundWords);

    const foundCount = newFoundWords.size;

    if (foundCount === totalCells) {
      if (timerRef.current) clearInterval(timerRef.current);
      const finalMs    = Date.now() - startTimeRef.current;
      setElapsed(finalMs);
      setFinished(true);

      const elapsedSec = Math.floor(finalMs / 1000);
      const score      = calcWordSearchScore(foundCount, elapsedSec);

      onFinish(finalMs, 0, score, foundCount);

      if (!hasSaved.current) {
        hasSaved.current = true;
        saveExerciseResult('word-search', score, {
          durationSec:  elapsedSec,
          correctCount: foundCount,
          totalCount:   totalCells,
        });
      }
    } else {
      onProgress(foundCount, 0);
    }
  }, [finished, foundWords, wsWordPositions, totalCells, onProgress, onFinish]);

  const isCellFound = useCallback((row: number, col: number): boolean =>
    wsWordPositions.some(wp =>
      foundWords.has(wp.word) &&
      wp.row === row &&
      col >= wp.startCol &&
      col < wp.startCol + wp.word.length,
    ), [wsWordPositions, foundWords]);

  const opponentPct = totalCells > 0 ? (opponentProgress / totalCells) * 100 : 0;
  const myPct       = finished ? 100 : totalCells > 0 ? (foundWords.size / totalCells) * 100 : 0;

  const opponentStatusText = opponentFinished
    ? t('duel.opponentFoundAll', { time: opponentDurationMs != null ? formatTime(opponentDurationMs, t('common.seconds')) : '' }).trim()
    : `${opponentProgress}/${totalCells}`;

  return (
    <div className="animate-fade-in-up">

      {opponentDisconnected && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-4">
          <WifiOff size={15} />
          {t('duel.opponentDisconnected')}
        </div>
      )}
      {opponentLeft && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-4">
          <UserX size={15} />
          {t('duel.opponentLeft')}
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

      {/* Header: timer + found count */}
      <div className="flex items-center justify-between mb-3">
        <div className="glass-card px-4 py-2 text-sm font-mono">
          ⏱ {formatTime(elapsed, t('common.seconds'))}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('duel.found')}:{' '}
          <span className="font-bold text-primary">{foundWords.size}/{totalCells}</span>
        </div>
      </div>

      {/* Words to find */}
      <div className="glass-card p-4 mb-3">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{t('wordSearch.wordsToFind')}</p>
        <div className="flex gap-2 flex-wrap">
          {wsWords.map(word => (
            <span
              key={word}
              className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${
                foundWords.has(word)
                  ? 'bg-primary/20 text-primary line-through'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Letter grid */}
      <div className="glass-card p-3 mb-3 overflow-x-auto select-none">
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${wsCols}, minmax(22px, 1fr))` }}
        >
          {wsGrid.map((row, r) =>
            row.map((letter, c) => {
              const isFound = isCellFound(r, c);
              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  style={{ fontSize: `${wsFontSize}px` }}
                  className={`aspect-square flex items-center justify-center font-mono font-bold rounded transition-all select-none ${
                    isFound
                      ? 'bg-primary/20 text-primary cursor-default'
                      : finished
                        ? 'text-foreground/40 cursor-default'
                        : 'hover:bg-muted/50 text-foreground/70 cursor-pointer'
                  }`}
                >
                  {letter}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* My progress bar */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">{t('duel.myProgress')}</span>
          <span className="text-muted-foreground">{foundWords.size}/{totalCells}</span>
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
            {t('duel.leaveGame')}
          </button>
        </div>
      )}

      {finished && !opponentFinished && (
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">
            {t('duel.waitingForOpponent')}
          </p>
          <button
            onClick={onLeave}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:text-foreground transition-colors"
          >
            <Zap size={15} />
            {t('duel.noWait')}
          </button>
        </div>
      )}
    </div>
  );
};

export default DuelWordSearchGame;

