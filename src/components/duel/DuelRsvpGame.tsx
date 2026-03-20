import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LogOut, WifiOff, UserX, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saveExerciseResult } from '@/lib/exerciseStats';
import { calcRsvpScore } from '@/lib/scoring';

interface RsvpQuestion {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

interface MatchInfo {
  sessionId: number;
  opponentName: string;
  rsvpSyntagmWidth: number;
  rsvpDisplayTime: number;
  rsvpTextTitle: string;
  rsvpTextContent: string;
  rsvpQuestions: RsvpQuestion[];
  totalCells: number; // = totalQuestions
}

interface DuelRsvpGameProps {
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

type Phase = 'reading' | 'questions';

const DuelRsvpGame = ({
  matchInfo,
  opponentProgress,
  opponentFinished,
  opponentDurationMs,
  opponentDisconnected,
  opponentLeft,
  onProgress,
  onFinish,
  onLeave,
}: DuelRsvpGameProps) => {
  const {
    opponentName,
    rsvpSyntagmWidth,
    rsvpDisplayTime,
    rsvpTextTitle,
    rsvpTextContent,
    rsvpQuestions,
    totalCells,
  } = matchInfo;
  const { t } = useTranslation();

  // Split text into syntagm chunks
  const chunks = useMemo(() => {
    const words = rsvpTextContent.split(/\s+/).filter(Boolean);
    const result: string[] = [];
    for (let i = 0; i < words.length; i += rsvpSyntagmWidth) {
      result.push(words.slice(i, i + rsvpSyntagmWidth).join(' '));
    }
    return result;
  }, [rsvpTextContent, rsvpSyntagmWidth]);

  const [phase, setPhase] = useState<Phase>('reading');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  const startTimeRef = useRef(Date.now());
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSaved     = useRef(false);

  // ── Reading phase: auto-advance every rsvpDisplayTime ms ─────────────────
  useEffect(() => {
    if (phase !== 'reading') return;

    intervalRef.current = setInterval(() => {
      setCurrentChunkIndex(prev => {
        const next = prev + 1;
        if (next >= chunks.length) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          // Short delay, then switch to questions
          setTimeout(() => setPhase('questions'), 400);
          return prev;
        }
        return next;
      });
    }, rsvpDisplayTime);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, chunks.length, rsvpDisplayTime]);

  // ── Questions phase: handle answer ────────────────────────────────────────
  const handleAnswer = useCallback((questionId: number, optionIndex: number) => {
    if (answers[questionId] !== undefined || finished) return;

    const question = rsvpQuestions.find(q => q.id === questionId);
    if (!question) return;

    const isCorrect = optionIndex === question.correctIndex;

    setAnswers(prev => {
      const updated = { ...prev, [questionId]: optionIndex };

      const answered  = Object.keys(updated).length;
      const correct   = rsvpQuestions.filter(q => updated[q.id] === q.correctIndex).length;
      const errors    = answered - correct;

      // Send progress to opponent
      onProgress(correct, errors);

      // If all answered → finish
      if (answered === rsvpQuestions.length && !hasSaved.current) {
        hasSaved.current = true;
        const durationMs = Date.now() - startTimeRef.current;

        const score = calcRsvpScore(correct, rsvpQuestions.length, rsvpDisplayTime, rsvpSyntagmWidth);

        saveExerciseResult('rsvp', score);
        setFinished(true);
        onFinish(durationMs, errors, score, correct);
      }

      return updated;
    });

    // Suppress unused variable warning
    void isCorrect;
  }, [answers, finished, rsvpQuestions, rsvpDisplayTime, rsvpSyntagmWidth, onProgress, onFinish]);

  const readingProgress = chunks.length > 0 ? ((currentChunkIndex + 1) / chunks.length) * 100 : 0;

  // Opponent status text
  const opponentStatusText = () => {
    if (opponentDisconnected) return t('duel.opponentDisc');
    if (opponentLeft)         return t('duel.opponentLeftGame');
    if (opponentFinished)     return t('duel.opponentFinished', {
      time: opponentDurationMs ? `${Math.round(opponentDurationMs / 1000)}${t('common.seconds')}` : '?',
    });
    return t('duel.answersOf', { answered: opponentProgress, total: totalCells });
  };

  // ── Reading phase UI ───────────────────────────────────────────────────────
  if (phase === 'reading') {
    return (
      <div className="space-y-4 animate-fade-in-up">
        {/* Header */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{rsvpTextTitle}</p>
            <p className="text-xs text-muted-foreground">
              {rsvpSyntagmWidth} {t('rsvp.wordUnit', { count: rsvpSyntagmWidth })} · {rsvpDisplayTime} {t('common.ms')}
            </p>
          </div>
          <button onClick={onLeave} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors">
            <LogOut size={16} /> {t('duel.leaveGame')}
          </button>
        </div>

        {/* Opponent status */}
        <div className="glass-card p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('duel.opponentWithName', { name: opponentName })}</span>
          <span className="font-medium">
            {opponentDisconnected
              ? <span className="flex items-center gap-1 text-destructive"><WifiOff size={14} /> {t('duel.disconnected')}</span>
              : opponentLeft
                ? <span className="flex items-center gap-1 text-muted-foreground"><UserX size={14} /> {t('duel.opponentLeft')}</span>
                : <span className="text-muted-foreground">{t('duel.opponentReading')}</span>}
          </span>
        </div>

        {/* Reading progress */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${readingProgress}%` }} />
        </div>

        {/* Syntagm display */}
        <div className="glass-card p-8">
          <div className="min-h-[180px] flex items-center justify-center">
            {currentChunkIndex < chunks.length ? (
              <span
                key={currentChunkIndex}
                className="text-4xl font-bold text-foreground animate-fade-in-up text-center leading-relaxed"
              >
                {chunks[currentChunkIndex]}
              </span>
            ) : (
              <span className="text-muted-foreground text-lg">{t('rsvp.readingComplete')}</span>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t('duel.syntagmProgress', { current: Math.min(currentChunkIndex + 1, chunks.length), total: chunks.length })}
        </p>
      </div>
    );
  }

  // ── Questions phase UI ─────────────────────────────────────────────────────
  const answeredCount = Object.keys(answers).length;
  const correctCount  = rsvpQuestions.filter(q => answers[q.id] === q.correctIndex).length;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-primary" />
          <div>
            <p className="text-sm font-medium">{t('duel.questionsAboutText')}</p>
            <p className="text-xs text-muted-foreground">{rsvpTextTitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{answeredCount}/{rsvpQuestions.length}</p>
          <p className="text-xs text-muted-foreground">{t('duel.answersCount')}</p>
        </div>
      </div>

      {/* Questions progress bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${rsvpQuestions.length > 0 ? (answeredCount / rsvpQuestions.length) * 100 : 0}%` }}
        />
      </div>

      {/* Opponent progress */}
      <div className="glass-card p-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('duel.opponentWithName', { name: opponentName })}</span>
        <span className="font-medium">{opponentStatusText()}</span>
      </div>
      <div className="progress-bar">
        <div
          className="h-full bg-accent/60 rounded-full transition-all duration-300"
          style={{ width: `${totalCells > 0 ? (opponentProgress / totalCells) * 100 : 0}%` }}
        />
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {rsvpQuestions.map((q, qi) => {
          const userAnswer = answers[q.id];
          const answered   = userAnswer !== undefined;
          const isCorrect  = userAnswer === q.correctIndex;

          return (
            <div key={q.id} className="glass-card p-5">
              <p className="font-medium mb-3">{qi + 1}. {q.text}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  let btnClass = 'border-border bg-card/50 hover:border-primary/50';
                  if (answered) {
                    if (oi === q.correctIndex)  btnClass = 'border-green-500 bg-green-500/10';
                    else if (oi === userAnswer)  btnClass = 'border-destructive bg-destructive/10';
                    else                         btnClass = 'border-border bg-card/50 opacity-50';
                  } else if (userAnswer === oi) {
                    btnClass = 'border-primary bg-primary/10';
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(q.id, oi)}
                      disabled={answered}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p className={`text-xs mt-2 ${isCorrect ? 'text-green-500' : 'text-destructive'}`}>
                  {isCorrect
                    ? `✓ ${t('common.correct')}`
                    : `✗ ${t('rsvp.correctAnswer')} ${q.options[q.correctIndex]}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish state */}
      {finished && (
        <div className="glass-card p-6 text-center border border-primary/30">
          <p className="text-lg font-bold text-primary mb-1">{t('duel.finishedBanner')}</p>
          <p className="text-sm text-muted-foreground">
            {t('duel.correctAnswersCount', { correct: correctCount, total: rsvpQuestions.length })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t('duel.waitingForResults')}</p>
        </div>
      )}

      {/* Disconnect/left banners */}
      {opponentDisconnected && !finished && (
        <div className="glass-card p-4 border border-destructive/30 flex items-center gap-3">
          <WifiOff size={20} className="text-destructive shrink-0" />
          <div>
            <p className="font-medium text-sm">{t('duel.opponentDisconnected')}</p>
            <p className="text-xs text-muted-foreground">{t('duel.finishForResult')}</p>
          </div>
        </div>
      )}
      {opponentLeft && !finished && (
        <div className="glass-card p-4 border border-muted flex items-center gap-3">
          <UserX size={20} className="text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium text-sm">{t('duel.opponentLeft')}</p>
            <p className="text-xs text-muted-foreground">{t('duel.finishForResult')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuelRsvpGame;

