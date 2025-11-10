import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, translations } from './locales';

type LanguageCode = 'en' | 'zh-CN' | 'zh-TW' | 'fr' | 'de' | 'es' | 'th' | 'my' | 'sg' | 'vn' | 'hk' | 'us' | 'tw' | 'jp' | 'kr';

interface TranslationOptions {
  defaultValue?: string;
  [key: string]: string | undefined;
}

interface LocaleContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, options?: TranslationOptions) => string;
  translations: Record<string, any>;
}

interface LocaleProviderProps {
  initialLanguage?: LanguageCode;
  children: React.ReactNode;
}

const DEFAULT_LANGUAGE = 'en';
const FALLBACK_LANGUAGE = 'en';
const STORAGE_KEY = '@tripassistant.locale';

const normalizeLanguage = (code: string): string => {
  if (!code) {
    return DEFAULT_LANGUAGE;
  }
  
  // Handle legacy 'zh' mapping - prefer Traditional for generic 'zh'
  if (code === 'zh') {
    return 'zh-TW';
  }
  
  // Handle regional variants - map all Traditional variants to zh-TW
  const languageMap: Record<string, string> = {
    'zh-Hans': 'zh-CN',
    'zh-Hant': 'zh-TW', 
    'zh-HK': 'zh-TW',  // Hong Kong uses Traditional Chinese
    'zh-TW': 'zh-TW',
    'zh-CN': 'zh-CN',
  };
  
  // Extract base language
  const baseLanguage = code.split('-')[0];
  
  // Return exact match or mapped variant
  return languageMap[code] || 
         languageMap[baseLanguage] || 
         (SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE);
};

const detectDeviceLanguage = (): string => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return normalizeLanguage(locale);
  } catch (error) {
    return DEFAULT_LANGUAGE;
  }
};

const LocaleContext = createContext<LocaleContextType>({
  language: DEFAULT_LANGUAGE as LanguageCode,
  setLanguage: () => {},
  t: (key, options = {}) => (options as TranslationOptions)?.defaultValue ?? key,
  translations: {} as Record<string, any>,
});

// Country code mapping for backward compatibility
const COUNTRY_CODE_MAP: Record<string, string> = {
  thailand: 'th',
  malaysia: 'my',
  singapore: 'sg',
  vietnam: 'vn',
  hongkong: 'hk',
  usa: 'us',
  taiwan: 'tw',
  japan: 'jp',
  korea: 'kr',
};

const getTranslationByPath = (language: string, key: string): any => {
  if (!key) {
    return undefined;
  }
  const segments = key.split('.');

  // Check if first segment is an old country code and map it
  if (segments.length > 0 && COUNTRY_CODE_MAP[segments[0]]) {
    segments[0] = COUNTRY_CODE_MAP[segments[0]];
  }

  const resolve = (lang: string): any => {
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

export const LocaleProvider: React.FC<LocaleProviderProps> = ({ initialLanguage = DEFAULT_LANGUAGE, children }) => {
  const [language, setLanguage] = useState<LanguageCode>(
    (SUPPORTED_LANGUAGES.includes(initialLanguage) ? initialLanguage : DEFAULT_LANGUAGE) as LanguageCode
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const persisted = await AsyncStorage.getItem(STORAGE_KEY);
        if (persisted) {
          setLanguage(normalizeLanguage(persisted) as LanguageCode);
        } else {
          setLanguage(normalizeLanguage(detectDeviceLanguage()) as LanguageCode);
        }
      } catch (error) {
        setLanguage((prev) => (prev || detectDeviceLanguage()) as LanguageCode);
      } finally {
        setReady(true);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, language).catch(() => {});
  }, [language, ready]);

  const value = useMemo(() => {
    const t = (key: string, options: TranslationOptions = {}): string => {
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

    const changeLanguage = (nextLanguage: LanguageCode) => {
      setLanguage(normalizeLanguage(nextLanguage) as LanguageCode);
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

// Language display names - always show in their native language
const NATIVE_LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'zh': '繁體中文',
};

export const getLanguageOptions = (t: any) =>
  SUPPORTED_LANGUAGES.map((code) => ({
    code,
    label: NATIVE_LANGUAGE_NAMES[code] || code,
  }));

/**
 * Get user's preferred locale from AsyncStorage
 * @returns {Promise<string>} User's preferred locale
 */
export const getUserPreferredLocale = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? normalizeLanguage(stored) : detectDeviceLanguage();
  } catch (error) {
    console.error('Error getting user preferred locale:', error);
    return DEFAULT_LANGUAGE;
  }
};

export { SUPPORTED_LANGUAGES, translations };
