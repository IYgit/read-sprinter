import { useState } from 'react';
import { Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type JoinQueueRequest } from '@/lib/api';

interface DuelNumbersLobbyProps {
  onStartSearch: (req: JoinQueueRequest) => void;
  onBack: () => void;
}

const DISPLAY_TIME_OPTIONS = [1, 5, 20, 30, 50, 100, 200, 300, 500, 700, 1000, 1500, 2000];

const DuelNumbersLobby = ({ onStartSearch, onBack }: DuelNumbersLobbyProps) => {
  const [digitCount, setDigitCount] = useState(4);
  const [displayTime, setDisplayTime] = useState(1000);
  const { t } = useTranslation();

  const handleSearch = () => {
    onStartSearch({
      exerciseType: 'numbers',
      digitCount,
      displayTime,
    });
  };

  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Hash size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('numbers.titleDuel')}</h2>
        <p className="text-sm text-muted-foreground">{t('numbers.subtitleDuel')}</p>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('numbers.digits')}: <span className="text-primary font-bold text-lg">{digitCount}</span>
          </p>
          <div className="flex gap-2">
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <button key={n} onClick={() => setDigitCount(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${digitCount === n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              >{n}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">{t('numbers.displayTimeNumber')}</p>
          <div className="flex gap-2 flex-wrap">
            {DISPLAY_TIME_OPTIONS.map((ms) => (
              <button key={ms} onClick={() => setDisplayTime(ms)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${displayTime === ms ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              >{ms < 1000 ? `${ms}${t('common.ms')}` : `${ms / 1000}${t('common.seconds')}`}</button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 text-sm text-muted-foreground space-y-1">
          <p>{t('numbers.negotiation')}</p>
          <p className="pl-4">• {t('numbers.negotiationDigits')}</p>
          <p className="pl-4">• {t('numbers.negotiationTime')}</p>
          <p className="pl-4">• {t('numbers.negotiationRounds')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={handleSearch}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Hash size={20} /> {t('duel.joinQueue')}
        </button>
        <button onClick={onBack}
          className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors text-sm"
        >{t('duel.back')}</button>
      </div>
    </div>
  );
};

export default DuelNumbersLobby;

