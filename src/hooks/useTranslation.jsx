import { useContext, createContext } from 'react';
import { translations } from '../translations';

const TranslationContext = createContext();

export const TranslationProvider = ({ children, language }) => {
  const t = (key, params = {}) => {
    const lang = translations[language] || translations.ru;
    let text = lang[key] || key;

    // Replace parameters in the text
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });

    return text;
  };

  return (
    <TranslationContext.Provider value={{ t, language }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};