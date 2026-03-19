import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { type JoinQueueRequest } from '@/lib/api';

interface DuelWordPairsLobbyProps {
  onStartSearch: (req: JoinQueueRequest) => void;
  onBack: () => void;
}

const GRID_OPTIONS = [
  { label: '3×3', rows: 3, cols: 3 },
  { label: '3×4', rows: 3, cols: 4 },
  { label: '4×4', rows: 4, cols: 4 },
  { label: '4×5', rows: 4, cols: 5 },
  { label: '5×5', rows: 5, cols: 5 },
];

const TIME_OPTIONS = [30, 45, 60, 90, 120];

const FONT_OPTIONS = [
  { label: 'S', value: 12 },
  { label: 'M', value: 14 },
  { label: 'L', value: 18 },
];

const DuelWordPairsLobby = ({ onStartSearch, onBack }: DuelWordPairsLobbyProps) => {
  const [gridIdx, setGridIdx] = useState(2); // 4×4 default
  const [timeLimit, setTimeLimit] = useState(60);
  const [fontSize, setFontSize] = useState(14);

  const handleSearch = () => {
    const { rows, cols } = GRID_OPTIONS[gridIdx];
    onStartSearch({
      exerciseType: 'word-pairs',
      wpRows: rows,
      wpCols: cols,
      wpTimeLimit: timeLimit,
      wpFontSize: fontSize,
    });
  };

  const { rows, cols } = GRID_OPTIONS[gridIdx];

  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Словопари — Дуель</h2>
        <p className="text-sm text-muted-foreground">
          Змагайтесь із суперником у знаходженні різних слово-пар
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* Grid size */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Розмір таблиці:{' '}
            <span className="text-primary font-bold text-lg">{rows}×{cols}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {GRID_OPTIONS.map((opt, i) => (
              <button
                key={opt.label}
                onClick={() => setGridIdx(i)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  gridIdx === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time limit */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Час:{' '}
            <span className="text-primary font-bold text-lg">{timeLimit}с</span>
          </p>
          <div className="flex gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTimeLimit(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  timeLimit === t
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {t}с
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Розмір шрифта
          </p>
          <div className="flex gap-2">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  fontSize === opt.value
                    ? 'bg-primary text-primary-foreground'
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
          <p className="pl-4">• Розмір таблиці — <span className="text-foreground">менший із двох</span></p>
          <p className="pl-4">• Час — <span className="text-foreground">більший із двох</span></p>
          <p className="pl-4">• Шрифт — <span className="text-foreground">більший із двох</span></p>
          <p className="pl-4">• Набір пар — <span className="text-foreground">однаковий для обох</span></p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleSearch}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <BookOpen size={20} />
          Знайти суперника
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          Назад
        </button>
      </div>
    </div>
  );
};

export default DuelWordPairsLobby;

