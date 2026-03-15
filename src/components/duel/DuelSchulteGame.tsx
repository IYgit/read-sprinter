﻿import { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, Zap, WifiOff, UserX } from 'lucide-react';
import { saveExerciseResult } from '@/lib/exerciseStats';

interface MatchInfo {
  sessionId: number;
  opponentName: string;
  gridSize: number;
  fontSize: number;
  numbers: number[];
  totalCells: number;
}

interface DuelSchulteGameProps {
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

const DuelSchulteGame = ({
  matchInfo,
  opponentProgress,
  opponentFinished,
  opponentDurationMs,
  opponentDisconnected,
  opponentLeft,
  onProgress,
  onFinish,
  onLeave,
}: DuelSchulteGameProps) => {
  const { numbers, gridSize, fontSize, totalCells, opponentName } = matchInfo;

  const [nextNumber, setNextNumber] = useState(1);
  const [clickedCells, setClickedCells] = useState<Set<number>>(new Set());
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSaved = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getCellClass = useCallback((index: number): string => {
    if (clickedCells.has(index)) return 'bg-primary/20 text-primary/40 scale-95';
    if (wrongCell === index) return 'bg-destructive/30 text-destructive border border-destructive/50 scale-95';
    if (finished) return 'bg-secondary/50 text-muted-foreground cursor-default';
    return 'bg-card border border-border hover:border-primary/40 hover:bg-card/80 text-foreground active:scale-95 cursor-pointer';
  }, [clickedCells, wrongCell, finished]);

  const handleCellClick = useCallback((num: number, index: number) => {
    if (finished || clickedCells.has(index)) return;

    if (num === nextNumber) {
      const newClicked = new Set(clickedCells);
      newClicked.add(index);
      setClickedCells(newClicked);
      setWrongCell(null);

      const newProgress = nextNumber;

      if (nextNumber === totalCells) {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalMs = Date.now() - startTimeRef.current;
        setElapsed(finalMs);
        setFinished(true);

        const timePenalty = Math.floor(finalMs / 100);
        const errorPenalty = errors * 50;
        const score = Math.max(0, 1000 - timePenalty - errorPenalty);

        // onProgress is intentionally NOT called here — onFinish already carries progress.
        // Sending both would cause OPPONENT_PROGRESS to arrive after OPPONENT_FINISHED
        // on the opponent's side, and could cause a race condition on the backend.
        onFinish(finalMs, errors, score, newProgress);

        if (!hasSaved.current) {
          hasSaved.current = true;
          saveExerciseResult('schulte-table', score, {
            durationSec: Math.floor(finalMs / 1000),
            correctCount: totalCells,
            totalCount: totalCells,
          });
        }
      } else {
        setNextNumber(nextNumber + 1);
        onProgress(newProgress, errors);
      }
    } else {
      setWrongCell(index);
      const newErrors = errors + 1;
      setErrors(newErrors);
      setTimeout(() => setWrongCell(null), 400);
    }
  }, [finished, clickedCells, nextNumber, totalCells, errors, onProgress, onFinish]);

  const opponentPct = totalCells > 0 ? (opponentProgress / totalCells) * 100 : 0;
  const myPct = finished
    ? 100
    : totalCells > 0 ? ((nextNumber - 1) / totalCells) * 100 : 0;

  const opponentStatusText = opponentFinished
    ? `✅ Фінішував! ${opponentDurationMs != null ? formatTime(opponentDurationMs) : ''}`.trim()
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

      {/* Game header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">
          Знайдіть:{' '}
          <span className="text-2xl font-bold text-primary ml-1">
            {finished ? '✓' : nextNumber}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>⏱ {formatTime(elapsed)}</span>
          <span className={errors > 0 ? 'text-destructive' : ''}>Помилки: {errors}</span>
        </div>
      </div>

      {/* Schulte grid */}
      <div
        className="grid gap-1.5 mb-4"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {numbers.map((num, index) => (
          <button
            key={num}
            onClick={() => handleCellClick(num, index)}
            disabled={clickedCells.has(index) || finished}
            style={{ fontSize: `${fontSize}px` }}
            className={`aspect-square rounded-xl font-bold transition-all duration-200 select-none ${getCellClass(index)}`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* My progress */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">Мій прогрес</span>
          <span className="text-muted-foreground">{finished ? totalCells : nextNumber - 1}/{totalCells}</span>
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
            Ви завершили! Очікуємо результати суперника...
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

export default DuelSchulteGame;
