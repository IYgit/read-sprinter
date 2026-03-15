import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DuelLobby from '@/components/duel/DuelLobby';
import DuelWaiting from '@/components/duel/DuelWaiting';
import DuelCountdown from '@/components/duel/DuelCountdown';
import DuelSchulteGame from '@/components/duel/DuelSchulteGame';
import DuelResults from '@/components/duel/DuelResults';
import { useDuelWebSocket, type MatchFoundEvent, type DuelEvent, type ParticipantResult } from '@/hooks/useDuelWebSocket';
import { type JoinQueueRequest } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

type Phase = 'lobby' | 'waiting' | 'countdown' | 'playing' | 'results';

interface MatchInfo {
  sessionId: number;
  opponentName: string;
  gridSize: number;
  fontSize: number;
  numbers: number[];
  totalCells: number;
}

const DuelExercise = () => {
  const navigate = useNavigate();
  const myUsername = getCurrentUser() ?? '';

  const [phase, setPhase] = useState<Phase>('lobby');
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
      gridSize: event.gridSize,
      fontSize: event.fontSize,
      numbers: event.numbers,
      totalCells: event.totalCells,
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

  // Receives JoinQueueRequest from DuelLobby, passes it to connect()
  // connect() will call POST /api/duels/queue ONLY after WebSocket is CONNECTED
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
    // If SESSION_RESULT hasn't arrived yet — show local results and wait
  }, [matchInfo, sendFinish]);

  const handleLeave = useCallback(() => {
    if (matchInfo) sendLeave(matchInfo.sessionId);
    disconnect();
    setPhase('lobby');
    // reset state
    setMatchInfo(null);
    setOpponentProgress(0);
    setOpponentFinished(false);
    setOpponentDurationMs(null);
    setOpponentDisconnected(false);
    setOpponentLeft(false);
    setMyResult(null);
    setOpponentResult(null);
  }, [matchInfo, sendLeave, disconnect]);

  const handlePlayAgain = useCallback(() => {
    disconnect();
    setMatchInfo(null);
    setOpponentProgress(0);
    setOpponentFinished(false);
    setOpponentDurationMs(null);
    setOpponentDisconnected(false);
    setOpponentLeft(false);
    setMyResult(null);
    setOpponentResult(null);
    setPhase('lobby');
  }, [disconnect]);

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-6">
      {phase === 'lobby' && (
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          До вибору вправ
        </button>
      )}

      {phase === 'lobby' && (
        <DuelLobby onStartSearch={handleStartSearch} />
      )}
      {phase === 'waiting' && (
        <DuelWaiting onCancel={handleCancelSearch} />
      )}
      {phase === 'countdown' && matchInfo && (
        <DuelCountdown
          countdown={countdown}
          opponentName={matchInfo.opponentName}
          gridSize={matchInfo.gridSize}
        />
      )}
      {phase === 'playing' && matchInfo && (
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
      {phase === 'results' && matchInfo && (
        <DuelResults
          myResult={myResult}
          opponentResult={opponentResult}
          totalCells={matchInfo.totalCells}
          onPlayAgain={handlePlayAgain}
          onBack={() => navigate('/')}
        />
      )}
    </div>
  );
};

export default DuelExercise;
