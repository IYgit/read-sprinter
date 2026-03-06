import { User, Trophy, Clock } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface PlayerCardProps {
  playerNumber: 1 | 2;
  name: string;
  score: number;
  progress: number;
  isReading: boolean;
  isAnswering: boolean;
  isFinished: boolean;
  readingTime?: number;
}

export const PlayerCard = ({
  playerNumber,
  name,
  score,
  progress,
  isReading,
  isAnswering,
  isFinished,
  readingTime,
}: PlayerCardProps) => {
  const badgeClass = playerNumber === 1 ? 'player-badge-1' : 'player-badge-2';
  const variant = playerNumber === 1 ? 'player1' : 'player2';

  const getStatus = () => {
    if (isFinished) return 'Завершено!';
    if (isAnswering) return 'Відповідає...';
    if (isReading) return 'Читає...';
    return 'Очікує';
  };

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 ${
        isReading || isAnswering ? 'animate-pulse-glow' : ''
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${badgeClass}`}
        >
          <User size={24} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{name}</h3>
          <span className={`text-sm ${badgeClass} px-2 py-0.5 rounded-full`}>
            {getStatus()}
          </span>
        </div>
      </div>

      <ProgressBar progress={progress} label="Прогрес" variant={variant} />

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-accent" />
          <span className="font-bold text-xl">{score}</span>
          <span className="text-sm text-muted-foreground">балів</span>
        </div>
        {readingTime !== undefined && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock size={16} />
            <span className="text-sm">{readingTime.toFixed(1)}с</span>
          </div>
        )}
      </div>
    </div>
  );
};
