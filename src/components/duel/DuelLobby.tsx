import { useState } from 'react';
import { Swords, Grid3X3 } from 'lucide-react';
import { type JoinQueueRequest } from '@/lib/api';

interface DuelLobbyProps {
  onStartSearch: (req: JoinQueueRequest) => void;
}

const FONT_SIZE_OPTIONS = [
  { label: 'S', value: 16 },
  { label: 'M', value: 20 },
  { label: 'L', value: 26 },
  { label: 'XL', value: 32 },
];

const DuelLobby = ({ onStartSearch }: DuelLobbyProps) => {
  const [gridSize, setGridSize] = useState(5);
  const [fontSize, setFontSize] = useState(20);

  const handleSearch = () => {
    onStartSearch({ exerciseType: 'schulte-table', gridSize, fontSize });
  };

  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Swords size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Швидкочитання Дуель</h2>
        <p className="text-sm text-muted-foreground">
          Змагайтесь з іншим гравцем у Таблиці Шульте в реальному часі
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Розмір таблиці: {gridSize}×{gridSize} ({gridSize * gridSize} чисел)
          </p>
          <div className="flex gap-2">
            {[3, 4, 5, 6, 7].map(s => (
              <button
                key={s}
                onClick={() => setGridSize(s)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  gridSize === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Розмір шрифта
          </p>
          <div className="flex gap-2">
            {FONT_SIZE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  fontSize === opt.value
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Grid3X3 size={16} className="text-primary shrink-0" />
            Параметри узгоджуються із суперником: розмір — менший із двох, шрифт — більший.
          </p>
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        <Swords size={20} />
        Знайти суперника
      </button>
    </div>
  );
};

export default DuelLobby;
