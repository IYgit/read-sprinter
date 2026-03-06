import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeedReadingProps {
  content: string;
  speed: number;
  isPlaying: boolean;
  onComplete: () => void;
}

export const useSpeedReading = ({
  content,
  speed,
  isPlaying,
  onComplete,
}: UseSpeedReadingProps) => {
  const words = content.split(/\s+/);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const progress = (currentWordIndex / words.length) * 100;
  const isFinished = currentWordIndex >= words.length;

  const reset = useCallback(() => {
    setCurrentWordIndex(0);
    setReadingTime(0);
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || isFinished) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const intervalMs = (60 / speed) * 1000;

    intervalRef.current = setInterval(() => {
      setCurrentWordIndex((prev) => {
        const next = prev + 1;
        if (next >= words.length) {
          if (startTimeRef.current) {
            setReadingTime((Date.now() - startTimeRef.current) / 1000);
          }
          onComplete();
          return words.length;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed, words.length, onComplete, isFinished]);

  return {
    currentWordIndex,
    progress,
    isFinished,
    readingTime,
    totalWords: words.length,
    reset,
  };
};
