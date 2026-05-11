import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(nextLng);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-hive-dark hover:bg-gray-50 transition-all shadow-sm group"
      title="Toggle Language / Cambiar Idioma"
    >
      <Languages className="w-3.5 h-3.5 text-hive-red group-hover:rotate-12 transition-transform" />
      <span>{i18n.language.toUpperCase()}</span>
    </button>
  );
};

export default LanguageToggle;
