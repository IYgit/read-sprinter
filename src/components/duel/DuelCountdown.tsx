import { useTranslation } from 'react-i18next';
import { Swords } from 'lucide-react';

interface DuelCountdownProps {
  countdown: number;
  opponentName: string;
  exerciseLabel: string;
}

const DuelCountdown = ({ countdown, opponentName, exerciseLabel }: DuelCountdownProps) => {
  const { t } = useTranslation();
  return (
    <div className="glass-card p-12 text-center animate-fade-in-up">
      <div className="flex items-center justify-center gap-3 mb-6 text-muted-foreground">
        <Swords size={20} className="text-primary" />
        <span>{t('duel.vs')} <span className="text-foreground font-semibold">{opponentName}</span></span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{exerciseLabel}</p>
      <p className="text-sm text-muted-foreground mb-8">{t('duel.getReady')}</p>
      <div key={countdown} className="text-8xl font-bold text-primary animate-fade-in-up mb-4">
        {countdown}
      </div>
      <p className="text-muted-foreground text-sm">{t('duel.starting')}</p>
    </div>
  );
};

export default DuelCountdown;
