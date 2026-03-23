import { useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type JoinQueueRequest } from '@/lib/api';

interface DuelLetterSearchLobbyProps {
  onStartSearch: (req: JoinQueueRequest) => void;
  onBack: () => void;
}

const GRID_SIZE_OPTIONS = [
  { label: '8×10',  idx: 0 },
  { label: '9×10',  idx: 1 },
  { label: '10×12', idx: 2 },
  { label: '11×14', idx: 3 },
];

const LETTER_COUNT_OPTIONS = [1, 2, 3, 4];

const DuelLetterSearchLobby = ({ onStartSearch, onBack }: DuelLetterSearchLobbyProps) => {
  const [gridSizeIdx, setGridSizeIdx] = useState(1);
  const [letterCount, setLetterCount] = useState(2);
  const { t } = useTranslation();

  const handleSearch = () => {
    onStartSearch({ exerciseType: 'letter-search', gridSizeIdx, letterCount });
  };

  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Search size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('letterSearch.titleDuel')}</h2>
        <p className="text-sm text-muted-foreground">{t('letterSearch.subtitleDuel')}</p>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('letterSearch.gridSizeLabel')} <span className="text-primary font-bold text-lg">{GRID_SIZE_OPTIONS[gridSizeIdx].label}</span>
          </p>
          <div className="flex gap-2">
            {GRID_SIZE_OPTIONS.map((opt) => (
              <button key={opt.idx} onClick={() => setGridSizeIdx(opt.idx)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${gridSizeIdx === opt.idx ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            {t('letterSearch.lettersForSearch')} <span className="text-accent font-bold text-lg">{letterCount}</span>
          </p>
          <div className="flex gap-2">
            {LETTER_COUNT_OPTIONS.map((n) => (
              <button key={n} onClick={() => setLetterCount(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${letterCount === n ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
              >{n}</button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 text-sm text-muted-foreground space-y-1">
          <p>{t('letterSearch.negotiation')}</p>
          <p className="pl-4">• {t('letterSearch.negotiationGrid')}</p>
          <p className="pl-4">• {t('letterSearch.negotiationLetters')}</p>
          <p className="pl-4">• {t('letterSearch.negotiationTable')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={handleSearch}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Search size={20} /> {t('duel.joinQueue')}
        </button>
        <button onClick={onBack}
          className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors text-sm"
        >{t('duel.back')}</button>
      </div>
    </div>
  );
};

export default DuelLetterSearchLobby;

