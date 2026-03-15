import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import { getAccessToken, duelApi, type JoinQueueRequest } from '@/lib/api';

// Native WebSocket URL — no SockJS needed with @stomp/stompjs v6+
// Connect directly to /ws endpoint (no /websocket suffix — that's SockJS only).
const WS_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/^http/, 'ws');
const WS_URL = `${WS_BASE}/ws`;

export interface DuelEvent {
  type:
    | 'COUNTDOWN'
    | 'START'
    | 'OPPONENT_PROGRESS'
    | 'OPPONENT_FINISHED'
    | 'OPPONENT_DISCONNECTED'
    | 'OPPONENT_LEFT'
    | 'SESSION_RESULT';
  countdown?: number;
  opponentName?: string;
  opponentProgress?: number;
  totalCells?: number;
  opponentDurationMs?: number;
  opponentErrors?: number;
  opponentScore?: number;
  myResult?: ParticipantResult;
  opponentResult?: ParticipantResult;
}

export interface MatchFoundEvent {
  type: 'MATCH_FOUND';
  sessionId: number;
  opponentName: string;
  exerciseType: string;
  gridSize: number;
  fontSize: number;
  numbers: number[];
  totalCells: number;
}

export interface ParticipantResult {
  username: string;
  durationMs: number;
  errors: number;
  score: number;
  progress: number;
  totalCells: number;
  finished: boolean;
  disconnected: boolean;
}

interface UseDuelWebSocketOptions {
  onMatchFound?: (event: MatchFoundEvent) => void;
  onDuelEvent?: (event: DuelEvent) => void;
  onQueueError?: (err: unknown) => void;
  sessionId?: number | null;
}

export function useDuelWebSocket({
  onMatchFound,
  onDuelEvent,
  onQueueError,
  sessionId,
}: UseDuelWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const sessionIdRef = useRef<number | null>(sessionId ?? null);

  // Keep sessionIdRef in sync
  useEffect(() => {
    sessionIdRef.current = sessionId ?? null;
  }, [sessionId]);

  const subscribeToSession = useCallback((client: Client, sid: number) => {
    client.subscribe(`/topic/duel/${sid}`, (msg: IMessage) => {
      const data = JSON.parse(msg.body) as DuelEvent;
      onDuelEvent?.(data);
    });
  }, [onDuelEvent]);

  /**
   * connect() + joinQueue in ONE call.
   * The POST /api/duels/queue is sent ONLY after WebSocket is CONNECTED
   * and the personal subscription /user/queue/duel is already active.
   * This eliminates the race condition where MATCH_FOUND could arrive
   * before the subscription was set up.
   */
  const connect = useCallback((req: JoinQueueRequest) => {
    if (clientRef.current?.active) return;

    const token = getAccessToken();
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 0, // no auto-reconnect for matchmaking

      onConnect: () => {
        // 1. Subscribe to personal queue FIRST.
        //    This channel receives:
        //      - MATCH_FOUND  (from matchmaking)
        //      - OPPONENT_PROGRESS, OPPONENT_FINISHED, OPPONENT_LEFT,
        //        OPPONENT_DISCONNECTED (personal events — sent only to the recipient)
        client.subscribe('/user/queue/duel', (msg: IMessage) => {
          const data = JSON.parse(msg.body) as MatchFoundEvent | DuelEvent;

          if (data.type === 'MATCH_FOUND') {
            const matchData = data as MatchFoundEvent;
            // Subscribe to session topic IMMEDIATELY before notifying React,
            // to avoid missing COUNTDOWN that arrives right after MATCH_FOUND.
            if (sessionIdRef.current == null) {
              sessionIdRef.current = matchData.sessionId;
              subscribeToSession(client, matchData.sessionId);
            }
            onMatchFound?.(matchData);
          } else {
            // All other personal messages are duel events for onDuelEvent handler
            onDuelEvent?.(data as DuelEvent);
          }
        });

        // 2. Subscribe to session topic if sessionId already known
        if (sessionIdRef.current != null) {
          subscribeToSession(client, sessionIdRef.current);
        }

        // 3. Only NOW call the REST API to join queue —
        //    server may immediately push MATCH_FOUND, we are already subscribed
        duelApi.joinQueue(req).catch((err) => {
          console.error('Failed to join queue:', err);
          onQueueError?.(err);
        });
      },

      onStompError: (frame) => {
        console.error('STOMP error', frame);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [onMatchFound, onQueueError, subscribeToSession]);

  // Subscribe to session topic when sessionId becomes available after connect
  useEffect(() => {
    if (sessionId != null && clientRef.current?.active) {
      subscribeToSession(clientRef.current, sessionId);
    }
  }, [sessionId, subscribeToSession]);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
  }, []);

  const sendProgress = useCallback((sid: number, progress: number, errors: number) => {
    clientRef.current?.publish({
      destination: '/app/duel/progress',
      body: JSON.stringify({ sessionId: sid, progress, errors }),
    });
  }, []);

  const sendFinish = useCallback(
    (sid: number, durationMs: number, errors: number, score: number, progress: number) => {
      clientRef.current?.publish({
        destination: '/app/duel/finish',
        body: JSON.stringify({ sessionId: sid, durationMs, errors, score, progress }),
      });
    },
    [],
  );

  const sendLeave = useCallback((sid: number) => {
    clientRef.current?.publish({
      destination: '/app/duel/leave',
      body: JSON.stringify({ sessionId: sid }),
    });
  }, []);

  return { connect, disconnect, sendProgress, sendFinish, sendLeave };
}
