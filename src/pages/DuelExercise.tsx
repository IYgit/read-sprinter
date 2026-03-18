import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DuelExerciseSelector from '@/components/duel/DuelExerciseSelector';
import DuelLobby from '@/components/duel/DuelLobby';
import DuelNumbersLobby from '@/components/duel/DuelNumbersLobby';
import DuelWordPairsLobby from '@/components/duel/DuelWordPairsLobby';
import DuelWaiting from '@/components/duel/DuelWaiting';
import DuelCountdown from '@/components/duel/DuelCountdown';
import DuelSchulteGame from '@/components/duel/DuelSchulteGame';
import DuelNumbersGame from '@/components/duel/DuelNumbersGame';
import DuelWordPairsGame from '@/components/duel/DuelWordPairsGame';
import DuelResults from '@/components/duel/DuelResults';
import { useDuelWebSocket, type MatchFoundEvent, type DuelEvent, type ParticipantResult } from '@/hooks/useDuelWebSocket';
import { type JoinQueueRequest } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type Phase = 'exercise-select' | 'lobby' | 'waiting' | 'countdown' | 'playing' | 'results';
type ExerciseType = 'schulte-table' | 'numbers' | 'word-pairs';

interface MatchInfo {
  sessionId: number;
  opponentName: string;
  exerciseType: ExerciseType;
  // Schulte Table
  gridSize: number;
  fontSize: number;
  // Shared
  numbers: number[];
  totalCells: number;
  // Numbers exercise
  digitCount: number;
  displayTime: number;
  totalRounds: number;
  // Word Pairs exercise
  pairs: { w1: string; w2: string; diff: boolean }[];
  wpRows: number;
  wpCols: number;
  wpTimeLimit: number;
  wpFontSize: number;
}

function buildExerciseLabel(info: MatchInfo): string {
  if (info.exerciseType === 'numbers') {
    return `Числа — ${info.digitCount} цифри, ${info.totalRounds} раундів`;
  }
  if (info.exerciseType === 'word-pairs') {
    return `Словопари ${info.wpRows}×${info.wpCols}, ${info.wpTimeLimit}с`;
  }
  return `Таблиця Шульте ${info.gridSize}×${info.gridSize}`;
}

const DuelExercise = () => {
  const navigate = useNavigate();
  const myUsername = getCurrentUser() ?? '';

  const [phase, setPhase] = useState<Phase>('exercise-select');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [opponentDurationMs, setOpponentDurationMs] = useState<number | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [myResult, setMyResult] = useState<ParticipantResult | null>(null);
  const [opponentResult, setOpponentResult] = useState<ParticipantResult | null>(null);

  const handleMatchFound = useCallback((event: MatchFoundEvent) => {
    setMatchInfo({
      sessionId: event.sessionId,
      opponentName: event.opponentName,
      exerciseType: event.exerciseType as ExerciseType,
      gridSize: event.gridSize ?? 5,
      fontSize: event.fontSize ?? 20,
      numbers: event.numbers ?? [],
      totalCells: event.totalCells,
      digitCount: event.digitCount ?? 3,
      displayTime: event.displayTime ?? 1000,
      totalRounds: event.totalRounds ?? 10,
      pairs: event.pairs ?? [],
      wpRows: event.wpRows ?? 4,
      wpCols: event.wpCols ?? 4,
      wpTimeLimit: event.wpTimeLimit ?? 60,
      wpFontSize: event.wpFontSize ?? 14,
    });
    setPhase('countdown');
  }, []);

  const handleDuelEvent = useCallback((event: DuelEvent) => {
    switch (event.type) {
      case 'COUNTDOWN':
        setCountdown(event.countdown ?? 3);
        break;
      case 'START':
        setPhase('playing');
        break;
      case 'OPPONENT_PROGRESS':
        setOpponentProgress(event.opponentProgress ?? 0);
        break;
      case 'OPPONENT_FINISHED':
        setOpponentFinished(true);
        setOpponentDurationMs(event.opponentDurationMs ?? null);
        if (event.opponentProgress != null) {
          setOpponentProgress(event.opponentProgress);
        }
        break;
      case 'OPPONENT_DISCONNECTED':
        setOpponentDisconnected(true);
        break;
      case 'OPPONENT_LEFT':
        setOpponentLeft(true);
        break;
      case 'SESSION_RESULT': {
        const r1 = event.myResult;
        const r2 = event.opponentResult;
        if (!r1 || !r2) break;
        if (r1.username === myUsername) {
          setMyResult(r1);
          setOpponentResult(r2);
        } else {
          setMyResult(r2);
          setOpponentResult(r1);
        }
        setPhase('results');
        break;
      }
    }
  }, [myUsername]);

  const { connect, disconnect, sendProgress, sendFinish, sendLeave } = useDuelWebSocket({
    onMatchFound: handleMatchFound,
    onDuelEvent: handleDuelEvent,
    sessionId: matchInfo?.sessionId ?? null,
  });

  const handleSelectExercise = useCallback((exerciseType: ExerciseType) => {
    setSelectedExercise(exerciseType);
    setPhase('lobby');
  }, []);

  const handleStartSearch = useCallback((req: JoinQueueRequest) => {
    connect(req);
    setPhase('waiting');
  }, [connect]);

  const handleCancelSearch = useCallback(() => {
    disconnect();
    setPhase('lobby');
  }, [disconnect]);

  const handleMyFinish = useCallback((durationMs: number, errors: number, score: number, progress: number) => {
    if (!matchInfo) return;
    sendFinish(matchInfo.sessionId, durationMs, errors, score, progress);
  }, [matchInfo, sendFinish]);

  const resetState = useCallback(() => {
    setMatchInfo(null);
    setOpponentProgress(0);
    setOpponentFinished(false);
    setOpponentDurationMs(null);
    setOpponentDisconnected(false);
    setOpponentLeft(false);
    setMyResult(null);
    setOpponentResult(null);
  }, []);

  const handleLeave = useCallback(() => {
    if (matchInfo) sendLeave(matchInfo.sessionId);
    disconnect();
    resetState();
    setPhase('lobby');
  }, [matchInfo, sendLeave, disconnect, resetState]);

  const handlePlayAgain = useCallback(() => {
    disconnect();
    resetState();
    setPhase('lobby');
  }, [disconnect, resetState]);

  const handleBackToSelect = useCallback(() => {
    setSelectedExercise(null);
    setPhase('exercise-select');
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-6">
      {(phase === 'exercise-select' || phase === 'lobby') && (
        <button
          onClick={() => phase === 'exercise-select' ? navigate('/') : handleBackToSelect()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          {phase === 'exercise-select' ? 'До вибору вправ' : 'До вибору вправи'}
        </button>
      )}

      {phase === 'exercise-select' && (
        <DuelExerciseSelector onSelect={handleSelectExercise} />
      )}

      {phase === 'lobby' && selectedExercise === 'schulte-table' && (
        <DuelLobby onStartSearch={handleStartSearch} onBack={handleBackToSelect} />
      )}

      {phase === 'lobby' && selectedExercise === 'numbers' && (
        <DuelNumbersLobby onStartSearch={handleStartSearch} onBack={handleBackToSelect} />
      )}

      {phase === 'lobby' && selectedExercise === 'word-pairs' && (
        <DuelWordPairsLobby onStartSearch={handleStartSearch} onBack={handleBackToSelect} />
      )}

      {phase === 'waiting' && (
        <DuelWaiting onCancel={handleCancelSearch} />
      )}

      {phase === 'countdown' && matchInfo && (
        <DuelCountdown
          countdown={countdown}
          opponentName={matchInfo.opponentName}
          exerciseLabel={buildExerciseLabel(matchInfo)}
        />
      )}

      {phase === 'playing' && matchInfo && matchInfo.exerciseType === 'schulte-table' && (
        <DuelSchulteGame
          matchInfo={matchInfo}
          opponentProgress={opponentProgress}
          opponentFinished={opponentFinished}
          opponentDurationMs={opponentDurationMs}
          opponentDisconnected={opponentDisconnected}
          opponentLeft={opponentLeft}
          onProgress={(progress, errors) => sendProgress(matchInfo.sessionId, progress, errors)}
          onFinish={handleMyFinish}
          onLeave={handleLeave}
        />
      )}

      {phase === 'playing' && matchInfo && matchInfo.exerciseType === 'numbers' && (
        <DuelNumbersGame
          matchInfo={matchInfo}
          opponentProgress={opponentProgress}
          opponentFinished={opponentFinished}
          opponentDurationMs={opponentDurationMs}
          opponentDisconnected={opponentDisconnected}
          opponentLeft={opponentLeft}
          onProgress={(progress, errors) => sendProgress(matchInfo.sessionId, progress, errors)}
          onFinish={handleMyFinish}
          onLeave={handleLeave}
        />
      )}

      {phase === 'playing' && matchInfo && matchInfo.exerciseType === 'word-pairs' && (
        <DuelWordPairsGame
          matchInfo={{
            sessionId: matchInfo.sessionId,
            opponentName: matchInfo.opponentName,
            pairs: matchInfo.pairs,
            wpRows: matchInfo.wpRows,
            wpCols: matchInfo.wpCols,
            wpTimeLimit: matchInfo.wpTimeLimit,
            wpFontSize: matchInfo.wpFontSize,
            totalCells: matchInfo.totalCells,
          }}
          opponentProgress={opponentProgress}
          opponentFinished={opponentFinished}
          opponentDurationMs={opponentDurationMs}
          opponentDisconnected={opponentDisconnected}
          opponentLeft={opponentLeft}
          onProgress={(progress, errors) => sendProgress(matchInfo.sessionId, progress, errors)}
          onFinish={handleMyFinish}
          onLeave={handleLeave}
        />
      )}

      {phase === 'results' && matchInfo && (
        <DuelResults
          myResult={myResult}
          opponentResult={opponentResult}
          totalCells={matchInfo.totalCells}
          exerciseType={matchInfo.exerciseType}
          onPlayAgain={handlePlayAgain}
          onBack={() => navigate('/')}
        />
      )}
    </div>
  );
};

export default DuelExercise;
