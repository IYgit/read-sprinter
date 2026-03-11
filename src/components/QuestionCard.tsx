import { useState } from 'react';
import { type QuestionDto } from '@/lib/api';
import { Check, X } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionDto;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (isCorrect: boolean, timeSpent: number) => void;
  disabled?: boolean;
}

export const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  disabled = false,
}: QuestionCardProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSelect = (index: number) => {
    if (showResult || disabled) return;

    setSelectedIndex(index);
    setShowResult(true);

    const timeSpent = (Date.now() - startTime) / 1000;
    const isCorrect = index === question.correctIndex;

    setTimeout(() => {
      onAnswer(isCorrect, timeSpent);
    }, 1500);
  };

  const getOptionClass = (index: number) => {
    if (!showResult) {
      return selectedIndex === index ? 'selected' : '';
    }
    if (index === question.correctIndex) {
      return 'correct';
    }
    if (index === selectedIndex && index !== question.correctIndex) {
      return 'incorrect';
    }
    return '';
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          Питання {questionNumber} з {totalQuestions}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i < questionNumber ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-6">{question.text}</h3>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={showResult || disabled}
            className={`answer-option w-full text-left flex items-center justify-between ${getOptionClass(
              index
            )}`}
          >
            <span>{option}</span>
            {showResult && index === question.correctIndex && (
              <Check className="text-success" size={20} />
            )}
            {showResult &&
              index === selectedIndex &&
              index !== question.correctIndex && (
                <X className="text-destructive" size={20} />
              )}
          </button>
        ))}
      </div>
    </div>
  );
};
