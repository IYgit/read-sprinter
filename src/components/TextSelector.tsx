import { type TextDto } from '@/lib/api';
import { BookOpen, Zap } from 'lucide-react';

interface TextSelectorProps {
  texts: TextDto[];
  onSelect: (text: TextDto) => void;
}

export const TextSelector = ({ texts, onSelect }: TextSelectorProps) => {
  const getDifficultyColor = (difficulty: TextDto['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-success bg-success/10';
      case 'medium':
        return 'text-accent bg-accent/10';
      case 'hard':
        return 'text-destructive bg-destructive/10';
    }
  };

  const getDifficultyLabel = (difficulty: TextDto['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'Легко';
      case 'medium':
        return 'Середньо';
      case 'hard':
        return 'Складно';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen size={20} className="text-primary" />
        Оберіть текст для читання
      </h3>

      <div className="grid gap-4">
        {texts.map((text) => (
          <button
            key={text.id}
            onClick={() => onSelect(text)}
            className="glass-card p-5 text-left hover:border-primary/50 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {text.title}
              </h4>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                  text.difficulty
                )}`}
              >
                {getDifficultyLabel(text.difficulty)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {text.content.slice(0, 150)}...
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap size={14} />
                {text.content.split(/\s+/).length} слів
              </span>
              <span>{text.questions.length} питань</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
