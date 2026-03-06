import { Trophy, Medal, Clock, Target, RotateCcw } from 'lucide-react';

interface PlayerResult {
  name: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  readingTime: number;
  averageAnswerTime: number;
}

interface ResultsScreenProps {
  player1: PlayerResult;
  player2: PlayerResult;
  onPlayAgain: () => void;
}

export const ResultsScreen = ({
  player1,
  player2,
  onPlayAgain,
}: ResultsScreenProps) => {
  const winner =
    player1.score > player2.score
      ? player1
      : player2.score > player1.score
      ? player2
      : null;
  const isDraw = player1.score === player2.score;

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent/20 mb-4">
          <Trophy className="text-accent" size={48} />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {isDraw ? 'Нічия!' : `${winner?.name} переміг!`}
        </h2>
        <p className="text-muted-foreground">
          {isDraw
            ? 'Обидва гравці показали однаковий результат'
            : `Вітаємо з перемогою у змаганні зі швидкочитання!`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {[player1, player2].map((player, index) => {
          const isWinner = !isDraw && player === winner;
          const playerNum = index + 1;

          return (
            <div
              key={playerNum}
              className={`glass-card p-6 relative ${
                isWinner ? 'ring-2 ring-accent glow-primary' : ''
              }`}
            >
              {isWinner && (
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                  <Medal size={20} className="text-accent-foreground" />
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    playerNum === 1 ? 'player-badge-1' : 'player-badge-2'
                  }`}
                >
                  <span className="font-bold text-lg">{playerNum}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{player.name}</h3>
                  <span className="text-muted-foreground text-sm">
                    Гравець {playerNum}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-accent" />
                    <span>Загальний бал</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {player.score}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <Target size={18} className="mx-auto mb-1 text-success" />
                    <div className="text-lg font-semibold">
                      {player.correctAnswers}/{player.totalQuestions}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Правильних
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <Clock size={18} className="mx-auto mb-1 text-primary" />
                    <div className="text-lg font-semibold">
                      {player.readingTime.toFixed(1)}с
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Час читання
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button onClick={onPlayAgain} className="btn-primary inline-flex items-center gap-2">
          <RotateCcw size={20} />
          Грати знову
        </button>
      </div>
    </div>
  );
};
