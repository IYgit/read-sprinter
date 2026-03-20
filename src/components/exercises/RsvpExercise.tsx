import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowLeft, Play, Trophy, RotateCcw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { textsApi, type TextDto } from '@/lib/api';
import { saveExerciseResult } from '@/lib/exerciseStats';
import ExerciseStatsChart from '@/components/ExerciseStatsChart';
import { calcRsvpScore } from '@/lib/scoring';

const FONT_SIZE_OPTIONS = [
  { label: 'M', value: 28 },
  { label: 'L', value: 36 },
  { label: 'XL', value: 44 },
];

const RsvpExercise = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Texts from API
  const [texts, setTexts] = useState<TextDto[]>([]);
  const [textsLoading, setTextsLoading] = useState(true);

  useEffect(() => {
    textsApi.getAll()
      .then(setTexts)
      .catch(console.error)
      .finally(() => setTextsLoading(false));
  }, []);

  // Settings
  const [syntagmWidth, setSyntagmWidth] = useState(1);
  const [displayTime, setDisplayTime] = useState(300);
  const [selectedText, setSelectedText] = useState<TextDto | null>(null);
  const [fontSize, setFontSize] = useState(36);

  // Game state
  const [phase, setPhase] = useState<'settings' | 'reading' | 'questions' | 'results'>('settings');
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showCorrect, setShowCorrect] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const chunks = useMemo(() => {
    if (!selectedText) return [];
    const words = selectedText.content.split(/\s+/);
    const result: string[] = [];
    for (let i = 0; i < words.length; i += syntagmWidth) {
      result.push(words.slice(i, i + syntagmWidth).join(' '));
    }
    return result;
  }, [selectedText, syntagmWidth]);

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
            // Move to questions after short delay
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

  const startGame = (text: TextDto) => {
    setSelectedText(text);
    setCurrentChunkIndex(0);
    setAnswers({});
    setShowCorrect(false);
    setPhase('reading');
    setIsPlaying(false);
  };

  const handleAnswer = (questionId: number, optionIndex: number) => {
    if (showCorrect) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitAnswers = async () => {
    setShowCorrect(true);
    const finalScore = calcRsvpScore(correctCount, totalQuestions, displayTime, syntagmWidth);
    await saveExerciseResult('rsvp', finalScore);
    setPhase('results');
  };

  const correctCount = selectedText
    ? selectedText.questions.filter(q => answers[q.id] === q.correctIndex).length
    : 0;
  const totalQuestions = selectedText?.questions.length || 0;

  const score = calcRsvpScore(correctCount, totalQuestions, displayTime, syntagmWidth);



  const progress = chunks.length > 0 ? ((currentChunkIndex + 1) / chunks.length) * 100 : 0;

  // RESULTS
  if (phase === 'results' && selectedText) {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          {t('common.back')}
        </button>

        <div className="glass-card p-8 text-center">
          <Trophy size={48} className="text-accent mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">{t('common.results')}</h2>
          <p className="text-muted-foreground mb-8">{t('rsvp.resultSubtitle', { title: selectedText.title })}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-primary">{score}</p>
              <p className="text-sm text-muted-foreground">{t('common.score')}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-accent">{correctCount}/{totalQuestions}</p>
              <p className="text-sm text-muted-foreground">{t('common.correct')}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-foreground">{displayTime} {t('common.ms')}</p>
              <p className="text-sm text-muted-foreground">{t('rsvp.highlightTime')}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-2xl font-bold text-foreground">{syntagmWidth}</p>
              <p className="text-sm text-muted-foreground">{t('rsvp.syntagmWidth')}</p>
            </div>
          </div>

          {/* Question details */}
          <div className="text-left space-y-2 mb-8">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              {t('rsvp.answers')}
            </h3>
            {selectedText.questions.map((q, i) => {
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
                    {t('rsvp.yourAnswer')} <span className={isCorrect ? 'text-success' : 'text-destructive'}>
                      {userAnswer !== undefined ? q.options[userAnswer] : '—'}
                    </span>
                    {!isCorrect && (
                      <> · {t('rsvp.correctAnswer')} <span className="text-success">{q.options[q.correctIndex]}</span></>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <ExerciseStatsChart exerciseId="rsvp" title={t('rsvp.history')} />

          <div className="flex gap-4 justify-center mt-6">
            <button onClick={() => { setPhase('settings'); setSelectedText(null); }} className="btn-primary flex items-center gap-2">
              <RotateCcw size={18} />
              {t('common.restart')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors"
            >
              {t('common.toExercises')}
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
          {t('common.back')}
        </button>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-2 text-center">{t('rsvp.comprehension')}</h2>
          <p className="text-muted-foreground text-center mb-8">{t('rsvp.comprehensionSubtitle')}</p>

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
            {t('rsvp.submit')}
          </button>
        </div>
      </div>
    );
  }

  // READING
  if (phase === 'reading' && selectedText) {
    return (
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { pauseReading(); setPhase('settings'); setSelectedText(null); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            {t('common.stop')}
          </button>
          <div className="text-sm text-muted-foreground">
            {syntagmWidth} {t('rsvp.syntagmWidth').toLowerCase()} · {displayTime} {t('common.ms')}
          </div>
        </div>

        {/* Progress */}
        <div className="progress-bar mb-8">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* RSVP display */}
        <div className="glass-card p-8 mb-6">
          <div className="min-h-[200px] flex items-center justify-center">
            {currentChunkIndex < chunks.length ? (
              <span
                key={currentChunkIndex}
                style={{ fontSize: `${fontSize}px` }}
                className="font-reading font-bold text-foreground animate-fade-in-up text-center leading-relaxed"
              >
                {chunks[currentChunkIndex]}
              </span>
            ) : (
              <span className="text-muted-foreground text-lg">{t('rsvp.readingComplete')}</span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isPlaying ? (
            <button onClick={startReading} className="btn-primary flex items-center gap-2 text-lg">
              <Play size={22} />
              {currentChunkIndex === 0 ? t('common.start') : t('common.resume')}
            </button>
          ) : (
            <button
              onClick={pauseReading}
              className="px-6 py-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors flex items-center gap-2"
            >
              {t('common.pause')}
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
        {t('common.back')}
      </button>

      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Eye size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t('rsvp.title')}</h2>
          <p className="text-muted-foreground">
            {t('rsvp.subtitle')}
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {/* Syntagm width */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              {t('rsvp.syntagmWidthLabel')} <span className="text-primary font-bold text-lg">{syntagmWidth} {t('rsvp.wordUnit', { count: syntagmWidth })}</span>
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
              {t('rsvp.displayTime')}: <span className="text-accent font-bold text-lg">{displayTime} {t('common.ms')}</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {[100, 200, 300, 500, 700, 1000].map((time) => (
                <button
                  key={time}
                  onClick={() => setDisplayTime(time)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    displayTime === time
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {time >= 1000 ? `${time / 1000}${t('common.seconds')}` : `${time}${t('common.ms')}`}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              {t('common.fontSize')}
            </label>
            <div className="flex gap-2">
              {FONT_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFontSize(opt.value)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    fontSize === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              {t('rsvp.selectText')}
            </label>
            <div className="space-y-3">
              {textsLoading ? (
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : texts.map((text) => (
                <button
                  key={text.id}
                  onClick={() => startGame(text)}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold group-hover:text-primary transition-colors">{text.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {text.content.split(/\s+/).length} {t('rsvp.wordUnit', { count: text.content.split(/\s+/).length })} · {text.questions.length}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      text.difficulty === 'easy' ? 'bg-success/20 text-success' :
                      text.difficulty === 'medium' ? 'bg-accent/20 text-accent' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {text.difficulty === 'easy' ? t('rsvp.difficultyEasy') : text.difficulty === 'medium' ? t('rsvp.difficultyMedium') : t('rsvp.difficultyHard')}
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

export default RsvpExercise;
