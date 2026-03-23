import { useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { duelApi } from '@/lib/api';

interface DuelWaitingProps {
  onCancel: () => void;
}

const DuelWaiting = ({ onCancel }: DuelWaitingProps) => {
  const cancelledRef = useRef(false);
  const { t } = useTranslation();

  const handleCancel = async () => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    try {
      await duelApi.leaveQueue();
    } catch {
      // ignore
    }
    onCancel();
  };

  return (
    <div className="glass-card p-12 text-center animate-fade-in-up">
      <div className="flex items-center justify-center mb-6">
        <Loader2 size={48} className="text-primary animate-spin" />
      </div>
      <h2 className="text-xl font-bold mb-2">{t('duel.searching')}</h2>
      <p className="text-sm text-muted-foreground mb-8">{t('duel.searchingSubtitle')}</p>
      <div className="flex justify-center gap-1 mb-8">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <button
        onClick={handleCancel}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
      >
        <X size={16} /> {t('duel.cancel')}
      </button>
    </div>
  );
};

export default DuelWaiting;
