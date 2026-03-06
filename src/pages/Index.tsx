import { useNavigate } from 'react-router-dom';
import { Hash, BookOpen, Zap, Brain, LogOut, User, Eye, ScanEye, Grid3X3, Search } from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';

const exercises = [
  {
    id: 'numbers',
    title: 'Числа',
    description: 'Число з\'являється на короткий час — запам\'ятайте та відтворіть його. Тренує швидкість розпізнавання.',
    icon: Hash,
    path: '/exercises/numbers',
    available: true,
  },
  {
    id: 'duel',
    title: 'Швидкочитання Дуель',
    description: 'Змагайтесь удвох: читайте текст із заданою швидкістю та відповідайте на питання.',
    icon: BookOpen,
    path: '/exercises/duel',
    available: true,
  },
  {
    id: 'word-pairs',
    title: 'Словопари',
    description: 'Знайдіть пари, де слова різні, серед схожих словопар у таблиці.',
    icon: Brain,
    path: '/exercises/word-pairs',
    available: true,
  },
  {
    id: 'word-search',
    title: 'Пошук слів',
    description: 'Знайдіть задані слова серед рядків букв якомога швидше.',
    icon: Zap,
    path: '/exercises/word-search',
    available: true,
  },
  {
    id: 'rsvp',
    title: 'RSVP',
    description: 'Швидкий послідовний показ слів. Регулюйте ширину синтагми та швидкість показу.',
    icon: Eye,
    path: '/exercises/rsvp',
    available: true,
  },
  {
    id: 'syntagm-reading',
    title: 'Читання синтагмами',
    description: 'Текст на екрані з підсвіткою синтагм. Тренує читання групами слів.',
    icon: ScanEye,
    path: '/exercises/syntagm-reading',
    available: true,
  },
  {
    id: 'schulte-table',
    title: 'Таблиця Шульте',
    description: 'Знайдіть і натисніть всі числа по порядку якомога швидше. Тренує периферійний зір.',
    icon: Grid3X3,
    path: '/exercises/schulte-table',
    available: true,
  },
  {
    id: 'letter-search',
    title: 'Пошук букв',
    description: 'Знайдіть задані букви серед таблиці довільних букв якомога швидше.',
    icon: Search,
    path: '/exercises/letter-search',
    available: true,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">Швидкочитання</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={16} />
              <span>{currentUser}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <LogOut size={16} />
              Вийти
            </button>
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-4 py-16 lg:py-24">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Zap size={16} className="text-primary" />
              <span className="text-sm font-medium text-primary">Тренажер швидкочитання</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient">Швидкочитання</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Обирайте вправу та тренуйте швидкість читання і розпізнавання інформації.
            </p>
          </div>

          {/* Exercise Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {exercises.map((exercise, index) => (
              <button
                key={exercise.id}
                onClick={() => exercise.available && navigate(exercise.path)}
                disabled={!exercise.available}
                className={`glass-card p-6 text-left transition-all duration-300 animate-fade-in-up group ${
                  exercise.available
                    ? 'hover:scale-[1.02] hover:border-primary/40 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <exercise.icon size={28} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                      {exercise.title}
                      {!exercise.available && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Скоро
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
