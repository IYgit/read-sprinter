import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface SpeedControlProps {
  speed: number;
  isPlaying: boolean;
  onSpeedChange: (speed: number) => void;
  onTogglePlay: () => void;
  minSpeed?: number;
  maxSpeed?: number;
}

export const SpeedControl = ({
  speed,
  isPlaying,
  onSpeedChange,
  onTogglePlay,
  minSpeed = 100,
  maxSpeed = 600,
}: SpeedControlProps) => {
  const decreaseSpeed = () => {
    if (speed > minSpeed) {
      onSpeedChange(Math.max(minSpeed, speed - 25));
    }
  };

  const increaseSpeed = () => {
    if (speed < maxSpeed) {
      onSpeedChange(Math.min(maxSpeed, speed + 25));
    }
  };

  return (
    <div className="speed-control">
      <button
        onClick={onTogglePlay}
        className="btn-primary w-12 h-12 flex items-center justify-center rounded-xl p-0"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={decreaseSpeed}
          disabled={speed <= minSpeed}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-2xl font-bold text-primary">{speed}</span>
          <span className="text-xs text-muted-foreground">слів/хв</span>
        </div>

        <button
          onClick={increaseSpeed}
          disabled={speed >= maxSpeed}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
