export const SUPPORTED_LANGUAGES = ['en', 'zh', 'fr', 'de', 'es'];

export const translations = {
  en: {
    languages: {
      en: 'English',
      zh: '中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Enter For Free',
      footerMessage: 'Try BorderBuddy for free — AI handles your border paperwork',
      ok: 'OK',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
    },
    login: {
      hotlistLabel: 'Trending destinations',
      hotlistDescription: 'Popular picks this week',
    },
  },
  zh: {
    languages: {
      en: 'English',
      zh: '中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
    },
    common: {
      appName: '出境通 BorderBuddy',
      enterCta: '免费进入',
      footerMessage: '现在免费体验 BorderBuddy · AI 帮你搞定出入境',
      ok: '好的',
      cancel: '取消',
      confirm: '确认',
      back: '返回',
    },
    login: {
      hotlistLabel: '热门目的地',
      hotlistDescription: '本周最受关注的旅行地',
    },
  },
  fr: {
    languages: {
      en: 'English',
      zh: '中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Entrée Gratuite',
      footerMessage: 'Essayez BorderBuddy gratuitement – l’IA gère vos formalités d’entrée',
      ok: 'OK',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      back: 'Retour',
    },
    login: {
      hotlistLabel: 'Destinations en tendance',
      hotlistDescription: 'Les favoris de la semaine',
    },
  },
  de: {
    languages: {
      en: 'English',
      zh: '中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Kostenlos Starten',
      footerMessage: 'Teste BorderBuddy gratis – KI erledigt deine Einreiseformalitäten',
      ok: 'OK',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      back: 'Zurück',
    },
    login: {
      hotlistLabel: 'Reisetrends',
      hotlistDescription: 'Beliebte Ziele dieser Woche',
    },
  },
  es: {
    languages: {
      en: 'English',
      zh: '中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Entrar Gratis',
      footerMessage: 'Prueba BorderBuddy gratis: la IA gestiona tus trámites de entrada',
      ok: 'OK',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      back: 'Atrás',
    },
    login: {
      hotlistLabel: 'Destinos en tendencia',
      hotlistDescription: 'Favoritos de esta semana',
    },
  },
};

export const getLanguageLabel = (language) =>
  translations?.en?.languages?.[language] || language;
