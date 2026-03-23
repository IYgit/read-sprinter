import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const toggle = () => {
    const next = isEn ? 'uk' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      title={isEn ? 'Switch to Ukrainian' : 'Перейти на українську'}
    >
      {isEn ? '🇺🇦 UA' : '🇬🇧 EN'}
    </button>
  );
};

export default LanguageSwitcher;

