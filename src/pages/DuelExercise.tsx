import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readingTexts, ReadingText } from '@/data/texts';
import { TextSelector } from '@/components/TextSelector';
import { GameScreen } from '@/components/GameScreen';
import { ArrowLeft, Users } from 'lucide-react';

const DuelExercise = () => {
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedText, setSelectedText] = useState<ReadingText | null>(null);
  const [player1Name, setPlayer1Name] = useState('Гравець 1');
  const [player2Name, setPlayer2Name] = useState('Гравець 2');

  const handleStartGame = (text: ReadingText) => {
    setSelectedText(text);
    setGameStarted(true);
  };

  const handleBack = () => {
    setGameStarted(false);
    setSelectedText(null);
  };

  if (gameStarted && selectedText) {
    return (
      <GameScreen
        text={selectedText}
        player1Name={player1Name}
        player2Name={player2Name}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        До вибору вправ
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 animate-fade-in-up">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Users size={20} className="text-primary" />
            Імена гравців
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Гравець 1</label>
              <input
                type="text"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Введіть ім'я"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Гравець 2</label>
              <input
                type="text"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Введіть ім'я"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <TextSelector texts={readingTexts} onSelect={handleStartGame} />
        </div>
      </div>
    </div>
  );
};

export default DuelExercise;
