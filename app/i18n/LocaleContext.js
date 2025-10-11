import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, translations } from './locales';

const DEFAULT_LANGUAGE = 'en';
const FALLBACK_LANGUAGE = 'en';
const STORAGE_KEY = '@tripassistant.locale';

const normalizeLanguage = (code) => {
  if (!code) return DEFAULT_LANGUAGE;
  const lower = code.toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(lower)) {
    return lower;
  }
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('es')) return 'es';
  return DEFAULT_LANGUAGE;
};

const detectDeviceLanguage = () => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return normalizeLanguage(locale);
  } catch (error) {
    return DEFAULT_LANGUAGE;
  }
};

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const persisted = await AsyncStorage.getItem(STORAGE_KEY);
        if (persisted) {
          setLanguage(normalizeLanguage(persisted));
        } else {
          setLanguage(normalizeLanguage(detectDeviceLanguage()));
        }
      } catch (error) {
        setLanguage((prev) => prev || detectDeviceLanguage());
      } finally {
        setReady(true);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, language).catch(() => {});
  }, [language, ready]);

  const value = useMemo(() => {
    const t = (key, options = {}) => {
      if (!key) {
        return options.defaultValue ?? '';
      }
      let translation = getTranslationByPath(language, key);
      if (translation !== undefined) {
        // Handle variable interpolation like {{name}}, {{country}}, etc.
        if (typeof translation === 'string' && options) {
          Object.keys(options).forEach((param) => {
            if (param !== 'defaultValue') {
              const regex = new RegExp(`\\{\\{${param}\\}\\}`, 'g');
              translation = translation.replace(regex, options[param]);
            }
          });
        }
        return translation;
      }
      if (options.defaultValue !== undefined) {
        return options.defaultValue;
      }
      return key;
    };

    const changeLanguage = (nextLanguage) => {
      setLanguage(normalizeLanguage(nextLanguage));
    };

    return {
      language,
      setLanguage: changeLanguage,
      t,
      translations,
    };
  }, [language, ready]);

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
