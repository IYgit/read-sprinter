import { Grid3X3, Hash, Swords, BookOpen, Eye, Search } from 'lucide-react';

type ExerciseType = 'schulte-table' | 'numbers' | 'word-pairs' | 'rsvp' | 'word-search';

interface DuelExerciseSelectorProps {
  onSelect: (exerciseType: ExerciseType) => void;
}

const exercises = [
  {
    id: 'schulte-table' as ExerciseType,
    icon: Grid3X3,
    title: 'Таблиця Шульте',
    description: 'Знаходьте числа від 1 до N у випадковому порядку якомога швидше.',
    badge: 'Увага · Швидкість',
  },
  {
    id: 'numbers' as ExerciseType,
    icon: Hash,
    title: 'Числа',
    description: 'Запам\'ятайте число, що з\'являється на короткий час, і введіть його.',
    badge: 'Пам\'ять · Концентрація',
  },
  {
    id: 'word-pairs' as ExerciseType,
    icon: BookOpen,
    title: 'Словопари',
    description: 'Знайдіть клітинки, де слова відрізняються, якомога швидше.',
    badge: 'Увага · Розрізнення',
  },
  {
    id: 'rsvp' as ExerciseType,
    icon: Eye,
    title: 'RSVP',
    description: 'Читайте текст за синтагмами — хто краще зрозумів, той і переміг.',
    badge: 'Читання · Розуміння',
  },
  {
    id: 'word-search' as ExerciseType,
    icon: Search,
    title: 'Пошук слів',
    description: 'Знайдіть приховані слова у сітці з букв якомога швидше.',
    badge: 'Увага · Пошук',
  },
];

const DuelExerciseSelector = ({ onSelect }: DuelExerciseSelectorProps) => {
  return (
    <div className="glass-card p-8 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Swords size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Дуель</h2>
        <p className="text-sm text-muted-foreground">
          Оберіть вправу для змагання з суперником
        </p>
      </div>

      <div className="space-y-4">
        {exercises.map((ex) => {
          const Icon = ex.icon;
          return (
            <button
              key={ex.id}
              onClick={() => onSelect(ex.id)}
              className="w-full text-left p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon size={24} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{ex.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground shrink-0">
                      {ex.badge}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ex.description}</p>
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

