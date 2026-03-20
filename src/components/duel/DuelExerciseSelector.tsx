import { useTranslation } from 'react-i18next';
import { Grid3X3, Hash, Swords, BookOpen, Eye, Search } from 'lucide-react';

type ExerciseType = 'schulte-table' | 'numbers' | 'word-pairs' | 'rsvp' | 'word-search' | 'syntagm-reading' | 'letter-search';

interface DuelExerciseSelectorProps {
  onSelect: (exerciseType: ExerciseType) => void;
}

const exerciseIds: ExerciseType[] = [
  'schulte-table', 'numbers', 'word-pairs', 'rsvp', 'word-search', 'syntagm-reading', 'letter-search',
];

const exerciseIcons: Record<ExerciseType, typeof Grid3X3> = {
  'schulte-table': Grid3X3,
  'numbers': Hash,
  'word-pairs': BookOpen,
  'rsvp': Eye,
  'word-search': Search,
  'syntagm-reading': BookOpen,
  'letter-search': Search,
};

const DuelExerciseSelector = ({ onSelect }: DuelExerciseSelectorProps) => {
  const { t } = useTranslation();
  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Swords size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('duel.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('duel.selectExerciseSubtitle')}</p>
      </div>

      <div className="space-y-4">
        {exerciseIds.map((id) => {
          const Icon = exerciseIcons[id];
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="w-full text-left p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon size={24} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{t(`duel.exercises.${id}.title`)}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground shrink-0">
                      {t(`duel.badges.${id}`)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t(`duel.exercises.${id}.description`)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DuelExerciseSelector;
