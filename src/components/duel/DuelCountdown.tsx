import { Swords } from 'lucide-react';

interface DuelCountdownProps {
  countdown: number;
  opponentName: string;
  gridSize: number;
}

const DuelCountdown = ({ countdown, opponentName, gridSize }: DuelCountdownProps) => {
  return (
    <div className="glass-card p-12 text-center animate-fade-in-up">
      <div className="flex items-center justify-center gap-3 mb-6 text-muted-foreground">
        <Swords size={20} className="text-primary" />
        <span>vs <span className="text-foreground font-semibold">{opponentName}</span></span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        Таблиця Шульте {gridSize}×{gridSize}
      </p>
      <p className="text-sm text-muted-foreground mb-8">Готуйтесь!</p>
      <div key={countdown} className="text-8xl font-bold text-primary animate-fade-in-up mb-4">
        {countdown}
      </div>
      <p className="text-muted-foreground text-sm">Гра починається...</p>
    </div>
  );
};

export default DuelCountdown;
