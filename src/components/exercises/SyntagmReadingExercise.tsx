import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Play, Trophy, RotateCcw, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { readingTexts, ReadingText } from '@/data/texts';
import { saveExerciseResult } from '@/lib/exerciseStats';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';

const SyntagmReadingExercise = () => {
  const navigate = useNavigate();

  // Settings
  const [syntagmWidth, setSyntagmWidth] = useState(2);
  const [displayTime, setDisplayTime] = useState(500);
  const [selectedText, setSelectedText] = useState<ReadingText | null>(null);

  // Game state
  const [phase, setPhase] = useState<'settings' | 'reading' | 'questions' | 'results'>('settings');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showCorrect, setShowCorrect] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Split text into syntagm chunks
  const chunks = useMemo(() => {
    if (!selectedText) return [];
    const words = selectedText.content.split(/\s+/);
    const result: { start: number; end: number }[] = [];
    for (let i = 0; i < words.length; i += syntagmWidth) {
      result.push({ start: i, end: Math.min(i + syntagmWidth, words.length) });
    }
    return result;
  }, [selectedText, syntagmWidth]);

  const words = useMemo(() => {
    if (!selectedText) return [];
    return selectedText.content.split(/\s+/);
  }, [selectedText]);

  const startReading = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pauseReading = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying && phase === 'reading') {
      intervalRef.current = setInterval(() => {
        setCurrentChunkIndex(prev => {
          if (prev >= chunks.length - 1) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(() => setPhase('questions'), 500);
            return prev;
          }
          return prev + 1;
        });
      }, displayTime);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, phase, displayTime, chunks.length]);

  const startGame = (text: ReadingText) => {
    setSelectedText(text);
    setCurrentChunkIndex(0);
    setAnswers({});
    setShowCorrect(false);
    setPhase('reading');
    setIsPlaying(false);
  };

  const handleAnswer = (questionId: string, optionIndex: number) => {
    if (showCorrect) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitAnswers = () => {
    setShowCorrect(true);
    setTimeout(() => setPhase('results'), 100);
  };

  const correctCount = selectedText
    ? selectedText.questions.filter(q => answers[q.id] === q.correctIndex).length
    : 0;
  const totalQuestions = selectedText?.questions.length || 0;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Save result
  useEffect(() => {
    if (phase === 'results' && selectedText) {
      saveExerciseResult('syntagm-reading', score);
    }
  }, [phase]);

  const progress = chunks.length > 0 ? ((currentChunkIndex + 1) / chunks.length) * 100 : 0;

  // Current highlighted word range
  const currentChunk = chunks[currentChunkIndex];

  // RESULTS
  if (phase === 'results' && selectedText) {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          До вибору вправ
        </button>

        <div className="glass-card p-8 text-center">
          <Trophy size={48} className="text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Результати</h2>
          <p className="text-muted-foreground mb-8">Читання синтагмами — «{selectedText.title}»</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-sm text-muted-foreground">Балів</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-accent">{correctCount}/{totalQuestions}</p>
              <p className="text-sm text-muted-foreground">Правильно</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-foreground">{displayTime} мс</p>
              <p className="text-sm text-muted-foreground">Час підсвітки</p>
            </div>
          </div>

          {/* Question details */}
          <div className="text-left space-y-2 mb-8">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Відповіді
            </h3>
            {selectedText.questions.map((q) => {
              const userAnswer = answers[q.id];
              const isCorrect = userAnswer === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-xl border ${
                    isCorrect
                      ? 'border-success/30 bg-success/5'
                      : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">{q.text}</p>
                  <p className="text-xs text-muted-foreground">
                    Ваша відповідь: <span className={isCorrect ? 'text-success' : 'text-destructive'}>
                      {userAnswer !== undefined ? q.options[userAnswer] : '—'}
                    </span>
                    {!isCorrect && (
                      <> · Правильно: <span className="text-success">{q.options[q.correctIndex]}</span></>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <ExerciseStatsChart exerciseId="syntagm-reading" title="Статистика — Читання синтагмами" />

          <div className="flex gap-4 justify-center mt-6">
            <button onClick={() => { setPhase('settings'); setSelectedText(null); }} className="btn-primary flex items-center gap-2">
              <RotateCcw size={18} />
              Ще раз
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
            >
              До вправ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUESTIONS
  if (phase === 'questions' && selectedText) {
    const allAnswered = selectedText.questions.every(q => answers[q.id] !== undefined);
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button
          onClick={() => { setPhase('settings'); setSelectedText(null); }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Назад
        </button>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-2 text-center">Перевірка розуміння</h2>
          <p className="text-muted-foreground text-center mb-8">Дайте відповідь на питання за текстом</p>

          <div className="space-y-6">
            {selectedText.questions.map((q, qi) => (
              <div key={q.id}>
                <p className="font-medium mb-3">{qi + 1}. {q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(q.id, oi)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        answers[q.id] === oi
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card/50 hover:border-primary/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitAnswers}
            disabled={!allAnswered}
            className="btn-primary w-full mt-8 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Перевірити
          </button>
        </div>
      </div>
    );
  }

  // READING — full text with highlighted syntagm
  if (phase === 'reading' && selectedText) {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { pauseReading(); setPhase('settings'); setSelectedText(null); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Зупинити
          </button>
          <div className="text-sm text-muted-foreground">
            {syntagmWidth} сл. · {displayTime} мс
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar mb-6">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Full text with highlighted syntagm */}
        <div className="glass-card p-6 lg:p-8 mb-6">
          <p className="font-reading text-lg lg:text-xl leading-[2.2] text-left">
            {words.map((word, index) => {
              const isHighlighted = currentChunk && index >= currentChunk.start && index < currentChunk.end;
              const isRead = currentChunk && index < currentChunk.start;

              return (
                <span
                  key={index}
                  className={`inline-block mx-0.5 px-0.5 rounded transition-all duration-150 ${
                    isHighlighted
                      ? 'bg-accent/20 text-accent font-semibold'
                      : isRead
                        ? 'text-foreground/50'
                        : 'text-muted-foreground/40'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isPlaying ? (
            <button onClick={startReading} className="btn-primary flex items-center gap-2 text-lg">
              <Play size={22} />
              {currentChunkIndex === 0 ? 'Старт' : 'Продовжити'}
            </button>
          ) : (
            <button
              onClick={pauseReading}
              className="px-6 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors flex items-center gap-2"
            >
              Пауза
            </button>
          )}
        </div>
      </div>
    );
  }

  // SETTINGS
  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={20} />
        До вибору вправ
      </button>

      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Читання синтагмами</h2>
          <p className="text-muted-foreground">
            Весь текст на екрані, але підсвічується одна синтагма за раз. Читайте разом із підсвіткою, потім — контрольні питання.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {/* Syntagm width */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Ширина синтагми: <span className="text-primary font-bold text-lg">{syntagmWidth} {syntagmWidth === 1 ? 'слово' : syntagmWidth < 5 ? 'слова' : 'слів'}</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSyntagmWidth(n)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    syntagmWidth === n
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Display time */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Час підсвітки: <span className="text-accent font-bold text-lg">{displayTime} мс</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[100, 200, 300, 500, 700, 1000].map((t) => (
                <button
                  key={t}
                  onClick={() => setDisplayTime(t)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    displayTime === t
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {t >= 1000 ? `${t / 1000}с` : `${t}мс`}
                </button>
              ))}
            </div>
          </div>

          {/* Text selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Оберіть текст
            </label>
            <div className="space-y-3">
              {readingTexts.map((text) => (
                <button
                  key={text.id}
                  onClick={() => startGame(text)}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold group-hover:text-primary transition-colors">{text.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {text.content.split(/\s+/).length} слів · {text.questions.length} питань
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      text.difficulty === 'easy' ? 'bg-success/20 text-success' :
                      text.difficulty === 'medium' ? 'bg-accent/20 text-accent' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {text.difficulty === 'easy' ? 'Легко' : text.difficulty === 'medium' ? 'Середньо' : 'Складно'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyntagmReadingExercise;
