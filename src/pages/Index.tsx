import { useNavigate } from 'react-router-dom';
import { Hash, BookOpen, Zap, Brain, LogOut, User, Eye, ScanEye, Grid3X3, Search } from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const EXERCISE_ICONS: Record<string, React.ElementType> = {
  numbers: Hash,
  duel: BookOpen,
  'word-pairs': Brain,
  'word-search': Zap,
  rsvp: Eye,
  'syntagm-reading': ScanEye,
  'schulte-table': Grid3X3,
  'letter-search': Search,
};

const EXERCISE_PATHS: Record<string, string> = {
  numbers: '/exercises/numbers',
  duel: '/exercises/duel',
  'word-pairs': '/exercises/word-pairs',
  'word-search': '/exercises/word-search',
  rsvp: '/exercises/rsvp',
  'syntagm-reading': '/exercises/syntagm-reading',
  'schulte-table': '/exercises/schulte-table',
  'letter-search': '/exercises/letter-search',
};

const EXERCISE_IDS = ['numbers', 'duel', 'word-pairs', 'word-search', 'rsvp', 'syntagm-reading', 'schulte-table', 'letter-search'];

const Index = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="relative z-10 border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">{t('nav.appName')}</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={16} />
              <span>{currentUser}</span>
            </div>
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <LogOut size={16} />
              {t('nav.logout')}
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
              <span className="text-sm font-medium text-primary">{t('index.tagline')}</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="text-gradient">Read Sprinter</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('index.subtitle')}
            </p>
          </div>

          {/* Exercise Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {EXERCISE_IDS.map((id, index) => {
              const Icon = EXERCISE_ICONS[id];
              const path = EXERCISE_PATHS[id];
              return (
                <button
                  key={id}
                  onClick={() => navigate(path)}
                  className="glass-card p-6 text-left transition-all duration-300 animate-fade-in-up group hover:scale-[1.02] hover:border-primary/40 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon size={28} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{t(`index.exercises.${id}.title`)}</h3>
                      <p className="text-sm text-muted-foreground">{t(`index.exercises.${id}.description`)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
