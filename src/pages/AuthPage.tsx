import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { register, loginUser } from '@/lib/auth';
import { LogIn, UserPlus, Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [verifiedBanner, setVerifiedBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerifiedBanner(true);
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => setVerifiedBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isRegister
      ? await register(username, login, password)
      : await loginUser(login, password);

    setLoading(false);

    if (result.success) {
      if ('pendingVerification' in result && result.pendingVerification) {
        setRegistrationSuccess(true);
      } else {
        navigate('/');
      }
    } else {
      const key = result.error ?? 'auth.errors.unknown';
      setError(t(key, { defaultValue: key }));
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />

        <div className="relative glass-card w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <MailCheck size={48} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gradient mb-3">
            {t('auth.registerSuccessTitle')}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {t('auth.registerSuccessText')}
          </p>
          <button
            onClick={() => { setRegistrationSuccess(false); setIsRegister(false); setUsername(''); setLogin(''); setPassword(''); }}
            className="text-sm text-primary hover:underline"
          >
            {t('auth.haveAccount')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />

      <div className="relative glass-card w-full max-w-md p-8">
        {verifiedBanner && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-400 animate-fade-in">
            <ShieldCheck size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">{t('auth.emailVerifiedTitle')}</p>
              <p className="text-xs text-green-400/80 mt-0.5">{t('auth.emailVerifiedText')}</p>
            </div>
          </div>
        )}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            {isRegister ? t('auth.register') : t('auth.login')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRegister ? t('auth.createAccount') : t('auth.continueTraining')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">{t('auth.usernameLabel')}</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder={t('auth.usernamePlaceholder')}
                maxLength={50}
                autoComplete="username"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">{t('auth.loginLabel')}</label>
            <input
              type="email"
              value={login}
              onChange={e => { setLogin(e.target.value); setError(''); }}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={t('auth.loginPlaceholder')}
              maxLength={50}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">{t('auth.passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder={t('auth.passwordPlaceholder')}
              maxLength={100}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : isRegister ? <UserPlus size={18} /> : <LogIn size={18} />
            }
            {loading
              ? t('auth.loading')
              : isRegister ? t('auth.registerBtn') : t('auth.loginBtn')
            }
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); setUsername(''); }}
            className="text-sm text-primary hover:underline"
          >
            {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
