import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, loginUser } from '@/lib/auth';
import { LogIn, UserPlus } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = isRegister
      ? await register(login, password)
      : await loginUser(login, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Помилка');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px]" />

      <div className="relative glass-card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            {isRegister ? 'Реєстрація' : 'Вхід'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRegister
              ? 'Створіть акаунт для тренувань'
              : 'Увійдіть, щоб продовжити тренування'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Логін</label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Введіть логін"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/10 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Введіть пароль"
              maxLength={100}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegister ? 'Зареєструватися' : 'Увійти'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-sm text-primary hover:underline"
          >
            {isRegister ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Зареєструватися'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
