import { useState, useCallback } from 'react';
import { ReadingText } from '@/data/texts';
import { SpeedControl } from './SpeedControl';
import { ReadingText as ReadingTextComponent } from './ReadingText';
import { ProgressBar } from './ProgressBar';
import { PlayerCard } from './PlayerCard';
import { QuestionCard } from './QuestionCard';
import { ResultsScreen } from './ResultsScreen';
import { useSpeedReading } from '@/hooks/useSpeedReading';
import { ArrowLeft } from 'lucide-react';

interface PlayerState {
  name: string;
  score: number;
  correctAnswers: number;
  currentQuestionIndex: number;
  isReading: boolean;
  isAnswering: boolean;
  isFinished: boolean;
  readingTime: number;
  answerTimes: number[];
}

interface GameScreenProps {
  text: ReadingText;
  player1Name: string;
  player2Name: string;
  onBack: () => void;
}

export const GameScreen = ({
  text,
  player1Name,
  player2Name,
  onBack,
}: GameScreenProps) => {
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [speed, setSpeed] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gamePhase, setGamePhase] = useState<'reading' | 'questions' | 'results'>('reading');

  const [player1, setPlayer1] = useState<PlayerState>({
    name: player1Name,
    score: 0,
    correctAnswers: 0,
    currentQuestionIndex: 0,
    isReading: true,
    isAnswering: false,
    isFinished: false,
    readingTime: 0,
    answerTimes: [],
  });

  const [player2, setPlayer2] = useState<PlayerState>({
    name: player2Name,
    score: 0,
    correctAnswers: 0,
    currentQuestionIndex: 0,
    isReading: false,
    isAnswering: false,
    isFinished: false,
    readingTime: 0,
    answerTimes: [],
  });

  const handleReadingComplete = useCallback(() => {
    setIsPlaying(false);

    if (currentPlayer === 1) {
      setPlayer1((prev) => ({
        ...prev,
        isReading: false,
        isAnswering: true,
      }));
    } else {
      setPlayer2((prev) => ({
        ...prev,
        isReading: false,
        isAnswering: true,
      }));
    }

    setGamePhase('questions');
  }, [currentPlayer]);

  const {
    currentWordIndex,
    progress,
    isFinished: readingFinished,
    readingTime,
    reset: resetReading,
  } = useSpeedReading({
    content: text.content,
    speed,
    isPlaying,
    onComplete: handleReadingComplete,
  });

  const currentPlayerState = currentPlayer === 1 ? player1 : player2;
  const setCurrentPlayerState = currentPlayer === 1 ? setPlayer1 : setPlayer2;

  const handleAnswer = (isCorrect: boolean, timeSpent: number) => {
    const basePoints = isCorrect ? 100 : 0;
    const speedBonus = isCorrect ? Math.max(0, Math.floor((10 - timeSpent) * 10)) : 0;
    const points = basePoints + speedBonus;

    setCurrentPlayerState((prev) => {
      const newState = {
        ...prev,
        score: prev.score + points,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        answerTimes: [...prev.answerTimes, timeSpent],
        readingTime: readingTime,
      };

      if (newState.currentQuestionIndex >= text.questions.length) {
        newState.isAnswering = false;
        newState.isFinished = true;
      }

      return newState;
    });
  };

  const handleNextQuestion = () => {
    if (currentPlayerState.currentQuestionIndex >= text.questions.length) {
      if (currentPlayer === 1) {
        setPlayer1((prev) => ({
          ...prev,
          isAnswering: false,
          isFinished: true,
          readingTime: readingTime,
        }));
        setCurrentPlayer(2);
        setPlayer2((prev) => ({ ...prev, isReading: true }));
        setGamePhase('reading');
        resetReading();
      } else {
        setPlayer2((prev) => ({
          ...prev,
          isAnswering: false,
          isFinished: true,
          readingTime: readingTime,
        }));
        setGamePhase('results');
      }
    }
  };

  // Auto-progress when player finishes questions
  if (
    currentPlayerState.currentQuestionIndex >= text.questions.length &&
    currentPlayerState.isAnswering
  ) {
    setTimeout(handleNextQuestion, 500);
  }

  const handlePlayAgain = () => {
    setCurrentPlayer(1);
    setSpeed(200);
    setIsPlaying(false);
    setGamePhase('reading');
    resetReading();
    setPlayer1({
      name: player1Name,
      score: 0,
      correctAnswers: 0,
      currentQuestionIndex: 0,
      isReading: true,
      isAnswering: false,
      isFinished: false,
      readingTime: 0,
      answerTimes: [],
    });
    setPlayer2({
      name: player2Name,
      score: 0,
      correctAnswers: 0,
      currentQuestionIndex: 0,
      isReading: false,
      isAnswering: false,
      isFinished: false,
      readingTime: 0,
      answerTimes: [],
    });
  };

  if (gamePhase === 'results') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ResultsScreen
          player1={{
            name: player1.name,
            score: player1.score,
            correctAnswers: player1.correctAnswers,
            totalQuestions: text.questions.length,
            readingTime: player1.readingTime,
            averageAnswerTime:
              player1.answerTimes.reduce((a, b) => a + b, 0) /
              player1.answerTimes.length,
          }}
          player2={{
            name: player2.name,
            score: player2.score,
            correctAnswers: player2.correctAnswers,
            totalQuestions: text.questions.length,
            readingTime: player2.readingTime,
            averageAnswerTime:
              player2.answerTimes.reduce((a, b) => a + b, 0) /
              player2.answerTimes.length,
          }}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        Назад до вибору тексту
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left sidebar - Players */}
        <div className="space-y-4">
          <PlayerCard
            playerNumber={1}
            name={player1.name}
            score={player1.score}
            progress={
              player1.isFinished
                ? 100
                : player1.isAnswering
                ? (player1.currentQuestionIndex / text.questions.length) * 100
                : currentPlayer === 1
                ? progress
                : 0
            }
            isReading={player1.isReading && currentPlayer === 1}
            isAnswering={player1.isAnswering}
            isFinished={player1.isFinished}
            readingTime={player1.isFinished ? player1.readingTime : undefined}
          />
          <PlayerCard
            playerNumber={2}
            name={player2.name}
            score={player2.score}
            progress={
              player2.isFinished
                ? 100
                : player2.isAnswering
                ? (player2.currentQuestionIndex / text.questions.length) * 100
                : currentPlayer === 2
                ? progress
                : 0
            }
            isReading={player2.isReading && currentPlayer === 2}
            isAnswering={player2.isAnswering}
            isFinished={player2.isFinished}
            readingTime={player2.isFinished ? player2.readingTime : undefined}
          />
        </div>

        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{text.title}</h2>
                <p className="text-muted-foreground">
                  {gamePhase === 'reading'
                    ? `Черга: ${currentPlayerState.name}`
                    : `Питання для: ${currentPlayerState.name}`}
                </p>
              </div>
              {gamePhase === 'reading' && (
                <SpeedControl
                  speed={speed}
                  isPlaying={isPlaying}
                  onSpeedChange={setSpeed}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                />
              )}
            </div>

            <ProgressBar progress={progress} label="Прогрес читання" />

            <div className="mt-6">
              {gamePhase === 'reading' ? (
                <ReadingTextComponent
                  content={text.content}
                  currentWordIndex={currentWordIndex}
                />
              ) : (
                currentPlayerState.currentQuestionIndex <
                  text.questions.length && (
                  <QuestionCard
                    key={`${currentPlayer}-${currentPlayerState.currentQuestionIndex}`}
                    question={
                      text.questions[currentPlayerState.currentQuestionIndex]
                    }
                    questionNumber={currentPlayerState.currentQuestionIndex + 1}
                    totalQuestions={text.questions.length}
                    onAnswer={handleAnswer}
                  />
                )
              )}
            </div>
          </div>

          {gamePhase === 'reading' && !isPlaying && currentWordIndex === 0 && (
            <div className="text-center text-muted-foreground">
              <p>
                Натисніть <span className="text-primary font-semibold">Play</span>{' '}
                щоб почати читання
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
