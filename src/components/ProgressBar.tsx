interface ProgressBarProps {
  progress: number;
  label?: string;
  variant?: 'primary' | 'player1' | 'player2';
}

export const ProgressBar = ({ progress, label, variant = 'primary' }: ProgressBarProps) => {
  const getGradient = () => {
    switch (variant) {
      case 'player1':
        return 'bg-gradient-to-r from-primary to-primary/70';
      case 'player2':
        return 'bg-gradient-to-r from-player2 to-player2/70';
      default:
        return 'bg-gradient-to-r from-primary to-accent/70';
    }
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-semibold text-foreground">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className={`progress-fill ${getGradient()}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
};
