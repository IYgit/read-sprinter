import { useState } from 'react';
import { Search } from 'lucide-react';
import { type JoinQueueRequest } from '@/lib/api';

interface DuelWordSearchLobbyProps {
  onStartSearch: (req: JoinQueueRequest) => void;
  onBack: () => void;
}

const ROW_OPTIONS    = [8, 10, 12, 14];
const COL_OPTIONS    = [9, 11, 13, 15];
const WORD_COUNT_OPTIONS = [2, 3, 4, 5];
const FONT_SIZE_OPTIONS = [
  { label: 'S', value: 12 },
  { label: 'M', value: 16 },
  { label: 'L', value: 20 },
];

const DuelWordSearchLobby = ({ onStartSearch, onBack }: DuelWordSearchLobbyProps) => {
  const [wsRows,      setWsRows]      = useState(12);
  const [wsCols,      setWsCols]      = useState(11);
  const [wsWordCount, setWsWordCount] = useState(3);
  const [wsFontSize,  setWsFontSize]  = useState(16);

  const handleSearch = () => {
    onStartSearch({ exerciseType: 'word-search', wsRows, wsCols, wsWordCount, wsFontSize });
  };

  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Search size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Пошук слів — Дуель</h2>
        <p className="text-sm text-muted-foreground">
          Знайдіть приховані слова у сітці з букв швидше за суперника
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* Rows */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Рядків у сітці:{' '}
            <span className="text-primary font-bold text-lg">{wsRows}</span>
          </p>
          <div className="flex gap-2">
            {ROW_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setWsRows(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  wsRows === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Cols */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Стовпців у сітці:{' '}
            <span className="text-primary font-bold text-lg">{wsCols}</span>
          </p>
          <div className="flex gap-2">
            {COL_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setWsCols(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  wsCols === n
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Word count */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Слів для пошуку:{' '}
            <span className="text-accent font-bold text-lg">{wsWordCount}</span>
          </p>
          <div className="flex gap-2">
            {WORD_COUNT_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setWsWordCount(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  wsWordCount === n
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {n}
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
            {FONT_SIZE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setWsFontSize(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  wsFontSize === opt.value
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
          <p className="pl-4">• Розмір сітки — <span className="text-foreground">менший із двох</span></p>
          <p className="pl-4">• Кількість слів — <span className="text-foreground">менша із двох</span></p>
          <p className="pl-4">• Шрифт — <span className="text-foreground">більший із двох</span></p>
          <p className="pl-4">• Сітка — <span className="text-foreground">однакова для обох</span></p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleSearch}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Search size={20} />
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

export default DuelWordSearchLobby;

