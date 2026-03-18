import { useState } from 'react';
import { Hash } from 'lucide-react';
import { type JoinQueueRequest } from '@/lib/api';

interface DuelNumbersLobbyProps {
  onStartSearch: (req: JoinQueueRequest) => void;
  onBack: () => void;
}

const DISPLAY_TIME_OPTIONS = [
  { label: '50мс', value: 50 },
  { label: '100мс', value: 100 },
  { label: '200мс', value: 200 },
  { label: '300мс', value: 300 },
  { label: '500мс', value: 500 },
  { label: '700мс', value: 700 },
  { label: '1с', value: 1000 },
  { label: '1.5с', value: 1500 },
  { label: '2с', value: 2000 },
];

const DuelNumbersLobby = ({ onStartSearch, onBack }: DuelNumbersLobbyProps) => {
  const [digitCount, setDigitCount] = useState(4);
  const [displayTime, setDisplayTime] = useState(1000);

  const handleSearch = () => {
    onStartSearch({ exerciseType: 'numbers', digitCount, displayTime, gridSize: 5, fontSize: 20 });
  };

  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Hash size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Числа — Дуель</h2>
        <p className="text-sm text-muted-foreground">
          Змагайтесь з суперником у запам'ятовуванні чисел
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* Digit count */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Кількість цифр:{' '}
            <span className="text-primary font-bold text-lg">{digitCount}</span>
          </p>
          <div className="flex gap-2">
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => setDigitCount(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  digitCount === n
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
            Час показу числа
          </p>
          <div className="flex gap-2 flex-wrap">
            {DISPLAY_TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDisplayTime(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  displayTime === opt.value
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
          <p className="pl-4">• Кількість цифр — <span className="text-foreground">менша із двох</span></p>
          <p className="pl-4">• Час показу — <span className="text-foreground">більший із двох</span></p>
          <p className="pl-4">• Кількість раундів — <span className="text-foreground">10 (фіксовано)</span></p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleSearch}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Hash size={20} />
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

export default DuelNumbersLobby;

