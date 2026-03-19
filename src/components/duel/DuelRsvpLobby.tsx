import { useState } from 'react';
import { Eye } from 'lucide-react';
import { type JoinQueueRequest } from '@/lib/api';

interface DuelRsvpLobbyProps {
  onStartSearch: (req: JoinQueueRequest) => void;
  onBack: () => void;
}

const DISPLAY_TIME_OPTIONS = [
  { label: '100мс', value: 100 },
  { label: '200мс', value: 200 },
  { label: '300мс', value: 300 },
  { label: '500мс', value: 500 },
  { label: '700мс', value: 700 },
  { label: '1с',    value: 1000 },
];

const DuelRsvpLobby = ({ onStartSearch, onBack }: DuelRsvpLobbyProps) => {
  const [syntagmWidth, setSyntagmWidth] = useState(3);
  const [rsvpDisplayTime, setRsvpDisplayTime]   = useState(300);

  const handleSearch = () => {
    onStartSearch({
      exerciseType: 'rsvp',
      rsvpSyntagmWidth: syntagmWidth,
      rsvpDisplayTime,
    });
  };

  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Eye size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">RSVP — Дуель</h2>
        <p className="text-sm text-muted-foreground">
          Обидва гравці читають один текст за синтагмами і відповідають на питання
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* Syntagm width */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Ширина синтагми:{' '}
            <span className="text-primary font-bold text-lg">{syntagmWidth} сл.</span>
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setSyntagmWidth(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  syntagmWidth === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Display time */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Час показу синтагми:{' '}
            <span className="text-accent font-bold text-lg">{rsvpDisplayTime} мс</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {DISPLAY_TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRsvpDisplayTime(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  rsvpDisplayTime === opt.value
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 text-sm text-muted-foreground space-y-1">
          <p>⚙️ Параметри узгоджуються із суперником:</p>
          <p className="pl-4">• Ширина синтагми — <span className="text-foreground">менша із двох</span></p>
          <p className="pl-4">• Час показу — <span className="text-foreground">більший із двох</span></p>
          <p className="pl-4">• Текст — <span className="text-foreground">обирає сервер випадково</span></p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleSearch}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Eye size={20} />
          Знайти суперника
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          ← Назад до вибору вправи
        </button>
      </div>
    </div>
  );
};

export default DuelRsvpLobby;

