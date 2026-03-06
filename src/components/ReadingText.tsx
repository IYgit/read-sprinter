import { useMemo } from 'react';

interface ReadingTextProps {
  content: string;
  currentWordIndex: number;
}

export const ReadingText = ({ content, currentWordIndex }: ReadingTextProps) => {
  const words = useMemo(() => content.split(/\s+/), [content]);

  return (
    <div className="reading-text p-6 rounded-2xl bg-card/50 border border-border/30 min-h-[300px]">
      <p className="leading-[2]">
        {words.map((word, index) => {
          let className = 'word-unread';
          if (index < currentWordIndex) {
            className = 'word-read';
          } else if (index === currentWordIndex) {
            className = 'word-highlight';
          }

          return (
            <span key={index} className={`${className} inline-block mx-0.5`}>
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
};
