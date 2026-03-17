import { Trophy, Medal, Clock, Target, RotateCcw, Home } from 'lucide-react';
import { type ParticipantResult } from '@/hooks/useDuelWebSocket';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';

interface DuelResultsProps {
  myResult: ParticipantResult | null;
  opponentResult: ParticipantResult | null;
  totalCells: number;
  exerciseType: string;
  onPlayAgain: () => void;
  onBack: () => void;
}

function formatTime(ms: number | null | undefined): string {
  if (ms == null) return '—';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return min > 0
    ? `${min}:${sec.toString().padStart(2, '0')}.${tenths}`
    : `${sec}.${tenths}с`;
}

const DuelResults = ({
  myResult,
  opponentResult,
  totalCells,
  exerciseType,
  onPlayAgain,
  onBack,
}: DuelResultsProps) => {
  const myFinished = myResult?.finished ?? false;
  const oppFinished = opponentResult?.finished ?? false;
  const myScore = myResult?.score ?? 0;
  const oppScore = opponentResult?.score ?? 0;

  const iWon = myFinished && myScore > oppScore;
  const isDraw = myFinished && oppFinished && myScore === oppScore;
  const iLost = oppFinished && oppScore > myScore;

  let verdict = '✅ Вправу завершено';
  if (isDraw) verdict = '🤝 Нічия!';
  else if (iWon) verdict = '🎉 Ви перемогли!';
  else if (iLost) verdict = '😔 Суперник переміг';

  let oppFoundText = `${opponentResult?.progress ?? 0}/${totalCells} (не завершив)`;
  if (opponentResult?.finished) oppFoundText = `${opponentResult.progress}/${totalCells}`;
  else if (opponentResult?.disconnected) oppFoundText = 'Відключився';

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-accent" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Результати дуелі</h2>
        <p className="text-xl font-semibold text-primary">{verdict}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* My result */}
        <div className={`glass-card p-5 ${iWon ? 'ring-2 ring-primary' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            {iWon && <Medal size={18} className="text-primary" />}
            <div>
              <p className="font-semibold">Ви</p>
              <p className="text-xs text-muted-foreground">{myResult?.username}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy size={13} /> Бали
              </span>
              <span className="font-bold text-primary">{myScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock size={13} /> Час
              </span>
              <span className="font-medium">{formatTime(myResult?.durationMs)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target size={13} /> Помилки
              </span>
              <span className={`font-medium ${(myResult?.errors ?? 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                {myResult?.errors ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Знайдено</span>
              <span className="font-medium">{myResult?.progress ?? 0}/{totalCells}</span>
            </div>
          </div>
        </div>

        {/* Opponent result */}
        <div className={`glass-card p-5 ${iLost ? 'ring-2 ring-accent' : ''}`}>
          <div className="flex items-center gap-2 mb-4">
            {iLost && <Medal size={18} className="text-accent" />}
            <div>
              <p className="font-semibold">{opponentResult?.username ?? 'Суперник'}</p>
              <p className="text-xs text-muted-foreground">Суперник</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy size={13} /> Бали
              </span>
              <span className="font-bold text-accent">{oppScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock size={13} /> Час
              </span>
              <span className="font-medium">
                {opponentResult?.disconnected ? '—' : formatTime(opponentResult?.durationMs)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target size={13} /> Помилки
              </span>
              <span className={`font-medium ${(opponentResult?.errors ?? 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                {opponentResult?.errors ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Знайдено</span>
              <span className="font-medium">{oppFoundText}</span>
            </div>
          </div>
        </div>
      </div>

      <ExerciseStatsChart
        exerciseId={exerciseType}
        title={`Ваша статистика — ${exerciseType === 'numbers' ? 'Числа' : 'Таблиця Шульте'}`}
      />

      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          Нова дуель
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
        >
          <Home size={18} />
          До вправ
        </button>
      </div>
    </div>
  );
};

export default DuelResults;
