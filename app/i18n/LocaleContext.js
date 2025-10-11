import React, { createContext, useContext, useMemo, useState } from 'react';
import { SUPPORTED_LANGUAGES, translations } from './locales';

const DEFAULT_LANGUAGE = 'en';
const FALLBACK_LANGUAGE = 'en';

const LocaleContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, options) => options?.defaultValue ?? key,
});

const getTranslationByPath = (language, key) => {
  if (!key) return undefined;
  const segments = key.split('.');

  const resolve = (lang) => {
    let current = translations[lang];
    for (const segment of segments) {
      if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
        current = current[segment];
      } else {
        return undefined;
      }
    }
    return current;
  };

  return resolve(language) ?? resolve(FALLBACK_LANGUAGE);
};

export const LocaleProvider = ({ initialLanguage = DEFAULT_LANGUAGE, children }) => {
  const [language, setLanguage] = useState(
    SUPPORTED_LANGUAGES.includes(initialLanguage) ? initialLanguage : DEFAULT_LANGUAGE
  );

  const value = useMemo(() => {
    const t = (key, options = {}) => {
      if (!key) {
        return options.defaultValue ?? '';
      }
      const translation = getTranslationByPath(language, key);
      if (translation !== undefined) {
        return translation;
      }
      if (options.defaultValue !== undefined) {
        return options.defaultValue;
      }
      return key;
    };

    return {
      language,
      setLanguage,
      t,
      translations,
    };
  }, [language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => useContext(LocaleContext);

export const useTranslation = () => {
  const { t, language } = useLocale();
  return { t, language };
};

export const getLanguageOptions = (t) =>
  SUPPORTED_LANGUAGES.map((code) => ({
    code,
    label: t(`languages.${code}`, { defaultValue: translations.en.languages[code] || code }),
  }));

export { SUPPORTED_LANGUAGES, translations };
