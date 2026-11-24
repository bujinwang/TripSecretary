// 入境通 - Date Formatting Utility
// Provides locale-aware date formatting for the progressive entry flow

/**
 * Date formatting utility with internationalization support
 * Supports multiple locales and formats for consistent date display
 */
class DateFormatter {
  /**
   * Format a date according to locale and format type
   * @param {Date|string} date - Date to format
   * @param {string} locale - Locale code (e.g., 'zh-CN', 'en', 'es')
   * @param {string} format - Format type: 'short', 'long', 'relative', 'time'
   * @returns {string} Formatted date string
   */
  static formatDate(date: string | Date | null | undefined, locale = 'en', format = 'short'): string {
    if (!date) {
return '';
}
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    try {
      switch (format) {
        case 'short':
          return this.formatShortDate(dateObj, locale);
        case 'long':
          return this.formatLongDate(dateObj, locale);
        case 'relative':
          return this.formatRelativeTime(dateObj, locale);
        case 'time':
          return this.formatTime(dateObj, locale);
        case 'datetime':
          return this.formatDateTime(dateObj, locale);
        default:
          return this.formatShortDate(dateObj, locale);
      }
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateObj.toLocaleDateString(locale);
    }
  }

  /**
   * Format date in short format (e.g., 2024-10-20, Oct 20, 2024, 20/10/2024)
   */
  static formatShortDate(date: string | Date, locale: string): string {
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      'zh-CN': { year: 'numeric', month: '2-digit', day: '2-digit' },
      'zh-TW': { year: 'numeric', month: '2-digit', day: '2-digit' },
      en: { year: 'numeric', month: 'short', day: 'numeric' },
      es: { day: '2-digit', month: '2-digit', year: 'numeric' },
      fr: { day: '2-digit', month: '2-digit', year: 'numeric' },
      de: { day: '2-digit', month: '2-digit', year: 'numeric' },
    };

    const options = formatOptions[locale] || formatOptions.en;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (locale.startsWith('zh')) {
      const formatted = new Intl.DateTimeFormat(locale, options).format(dateObj);
      return formatted.replace(/\//g, '-');
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  /**
   * Format date in long format (e.g., 2024年10月20日, October 20, 2024)
   */
  static formatLongDate(date: string | Date, locale: string): string {
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      'zh-CN': { year: 'numeric', month: 'long', day: 'numeric' },
      'zh-TW': { year: 'numeric', month: 'long', day: 'numeric' },
      en: { year: 'numeric', month: 'long', day: 'numeric' },
      es: { day: 'numeric', month: 'long', year: 'numeric' },
      fr: { day: 'numeric', month: 'long', year: 'numeric' },
      de: { day: 'numeric', month: 'long', year: 'numeric' },
    };

    const options = formatOptions[locale] || formatOptions.en;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  /**
   * Format relative time (e.g., "2 days ago", "2天前", "hace 2 días")
   */
  static formatRelativeTime(date: string | Date, locale: string): string {
    const now = new Date();
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const diffMs = dateObj.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      
      if (Math.abs(diffDays) >= 1) {
        return rtf.format(diffDays, 'day');
      } else if (Math.abs(diffHours) >= 1) {
        return rtf.format(diffHours, 'hour');
      } else {
        return rtf.format(diffMinutes, 'minute');
      }
    } catch (error) {
      // Fallback for unsupported locales
      return this.formatRelativeTimeFallback(diffDays, diffHours, diffMinutes, locale);
    }
  }

  /**
   * Fallback relative time formatting for unsupported locales
   */
  static formatRelativeTimeFallback(diffDays: number, diffHours: number, diffMinutes: number, locale: string): string {
    interface RelativeTimeTemplate {
      daysAgo: (n: number) => string;
      daysLater: (n: number) => string;
      hoursAgo: (n: number) => string;
      hoursLater: (n: number) => string;
      minutesAgo: (n: number) => string;
      minutesLater: (n: number) => string;
      now: string;
    }

    const templates: Record<string, RelativeTimeTemplate> = {
      'zh-CN': {
        daysAgo: (n: number) => `${Math.abs(n)}天前`,
        daysLater: (n: number) => `${n}天后`,
        hoursAgo: (n: number) => `${Math.abs(n)}小时前`,
        hoursLater: (n: number) => `${n}小时后`,
        minutesAgo: (n: number) => `${Math.abs(n)}分钟前`,
        minutesLater: (n: number) => `${n}分钟后`,
        now: '刚刚'
      },
      'en': {
        daysAgo: (n: number) => `${Math.abs(n)} day${Math.abs(n) !== 1 ? 's' : ''} ago`,
        daysLater: (n: number) => `in ${n} day${n !== 1 ? 's' : ''}`,
        hoursAgo: (n: number) => `${Math.abs(n)} hour${Math.abs(n) !== 1 ? 's' : ''} ago`,
        hoursLater: (n: number) => `in ${n} hour${n !== 1 ? 's' : ''}`,
        minutesAgo: (n: number) => `${Math.abs(n)} minute${Math.abs(n) !== 1 ? 's' : ''} ago`,
        minutesLater: (n: number) => `in ${n} minute${n !== 1 ? 's' : ''}`,
        now: 'just now'
      },
      'es': {
        daysAgo: (n: number) => `hace ${Math.abs(n)} día${Math.abs(n) !== 1 ? 's' : ''}`,
        daysLater: (n: number) => `en ${n} día${n !== 1 ? 's' : ''}`,
        hoursAgo: (n: number) => `hace ${Math.abs(n)} hora${Math.abs(n) !== 1 ? 's' : ''}`,
        hoursLater: (n: number) => `en ${n} hora${n !== 1 ? 's' : ''}`,
        minutesAgo: (n: number) => `hace ${Math.abs(n)} minuto${Math.abs(n) !== 1 ? 's' : ''}`,
        minutesLater: (n: number) => `en ${n} minuto${n !== 1 ? 's' : ''}`,
        now: 'ahora mismo'
      }
    };

    const template: RelativeTimeTemplate = templates[locale] || templates['en'];

    if (Math.abs(diffDays) >= 1) {
      return diffDays < 0 ? template.daysAgo(diffDays) : template.daysLater(diffDays);
    } else if (Math.abs(diffHours) >= 1) {
      return diffHours < 0 ? template.hoursAgo(diffHours) : template.hoursLater(diffHours);
    } else if (Math.abs(diffMinutes) >= 1) {
      return diffMinutes < 0 ? template.minutesAgo(diffMinutes) : template.minutesLater(diffMinutes);
    } else {
      return template.now;
    }
  }

  /**
   * Format time only (e.g., 14:30, 2:30 PM)
   */
  static formatTime(date: string | Date, locale: string): string {
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      'zh-CN': { hour: '2-digit', minute: '2-digit', hour12: false },
      'zh-TW': { hour: '2-digit', minute: '2-digit', hour12: false },
      en: { hour: 'numeric', minute: '2-digit', hour12: true },
      es: { hour: '2-digit', minute: '2-digit', hour12: false },
      fr: { hour: '2-digit', minute: '2-digit', hour12: false },
      de: { hour: '2-digit', minute: '2-digit', hour12: false },
    };

    const options = formatOptions[locale] || formatOptions.en;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  /**
   * Format date and time together
   */
  static formatDateTime(date: string | Date, locale: string): string {
    const dateStr = this.formatShortDate(date, locale);
    const timeStr = this.formatTime(date, locale);
    
    const separators = {
      'zh-CN': ' ',
      'zh-TW': ' ',
      'en': ' at ',
      'es': ' a las ',
      'fr': ' à ',
      'de': ' um '
    };

    const separator = separators[locale] || ' ';
    return `${dateStr}${separator}${timeStr}`;
  }

  /**
   * Format time periods for grouping (Today, Yesterday, This Week, etc.)
   */
  static formatTimePeriod(date: string | Date, locale: string): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const dateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    
    const diffMs = dateOnly.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const periods = {
      'zh-CN': {
        today: '今天',
        yesterday: '昨天',
        thisWeek: '本周',
        thisMonth: '本月',
        earlier: '更早'
      },
      'zh-TW': {
        today: '今天',
        yesterday: '昨天',
        thisWeek: '本週',
        thisMonth: '本月',
        earlier: '更早'
      },
      'en': {
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        earlier: 'Earlier'
      },
      'es': {
        today: 'Hoy',
        yesterday: 'Ayer',
        thisWeek: 'Esta Semana',
        thisMonth: 'Este Mes',
        earlier: 'Anterior'
      },
      'fr': {
        today: 'Aujourd\'hui',
        yesterday: 'Hier',
        thisWeek: 'Cette Semaine',
        thisMonth: 'Ce Mois',
        earlier: 'Plus Tôt'
      },
      'de': {
        today: 'Heute',
        yesterday: 'Gestern',
        thisWeek: 'Diese Woche',
        thisMonth: 'Diesen Monat',
        earlier: 'Früher'
      }
    };

    const period = periods[locale] || periods['en'];

    if (diffDays === 0) {
      return period.today;
    } else if (diffDays === -1) {
      return period.yesterday;
    } else if (diffDays >= -7 && diffDays < 0) {
      return period.thisWeek;
    } else if (diffDays >= -30 && diffDays < -7) {
      return period.thisMonth;
    } else {
      return period.earlier;
    }
  }

  /**
   * Parse date string in various formats
   */
  static parseDate(dateString: string): Date | null {
    if (!dateString) {
return null;
}
    
    // Try ISO format first
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try common formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
      /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        // Assume YYYY-MM-DD format for first match
        if (format === formats[0]) {
          return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
        }
      }
    }

    return null;
  }

  /**
   * Get user's preferred date format based on locale
   */
  static getPreferredFormat(locale: string): string {
    const formats = {
      'zh-CN': 'YYYY-MM-DD',
      'zh-TW': 'YYYY-MM-DD',
      'en': 'MM/DD/YYYY',
      'es': 'DD/MM/YYYY',
      'fr': 'DD/MM/YYYY',
      'de': 'DD.MM.YYYY'
    };

    return formats[locale] || formats['en'];
  }

  /**
   * Format notification timestamp for progressive entry flow
   * @param {Date|string} date - Date to format
   * @param {string} locale - Locale code
   * @returns {string} Formatted notification timestamp
   */
  static formatNotificationTime(date: string | Date, locale = 'en'): string {
    if (!date) {
return '';
}
    
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
return '';
}

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // If less than 1 minute ago, show "just now"
    if (diffMinutes < 1) {
      const justNowText = {
        'zh-CN': '刚刚',
        'zh-TW': '剛剛',
        'en': 'just now',
        'es': 'ahora mismo',
        'fr': 'à l\'instant',
        'de': 'gerade eben'
      };
      return justNowText[locale] || justNowText['en'];
    }

    // If less than 1 hour ago, show minutes
    if (diffHours < 1) {
      const minuteTemplates: Record<string, (n: number) => string> = {
        'zh-CN': (n: number) => `${n}分钟前`,
        'zh-TW': (n: number) => `${n}分鐘前`,
        'en': (n: number) => `${n} minute${n !== 1 ? 's' : ''} ago`,
        'es': (n: number) => `hace ${n} minuto${n !== 1 ? 's' : ''}`,
        'fr': (n: number) => `il y a ${n} minute${n !== 1 ? 's' : ''}`,
        'de': (n: number) => `vor ${n} Minute${n !== 1 ? 'n' : ''}`
      };
      const template = minuteTemplates[locale] || minuteTemplates['en'];
      return template(diffMinutes);
    }

    // If less than 24 hours ago, show hours
    if (diffDays < 1) {
      const hourTemplates: Record<string, (n: number) => string> = {
        'zh-CN': (n: number) => `${n}小时前`,
        'zh-TW': (n: number) => `${n}小時前`,
        'en': (n: number) => `${n} hour${n !== 1 ? 's' : ''} ago`,
        'es': (n: number) => `hace ${n} hora${n !== 1 ? 's' : ''}`,
        'fr': (n: number) => `il y a ${n} heure${n !== 1 ? 's' : ''}`,
        'de': (n: number) => `vor ${n} Stunde${n !== 1 ? 'n' : ''}`
      };
      const template = hourTemplates[locale] || hourTemplates['en'];
      return template(diffHours);
    }

    // If less than 7 days ago, show days
    if (diffDays < 7) {
      const dayTemplates: Record<string, (n: number) => string> = {
        'zh-CN': (n: number) => `${n}天前`,
        'zh-TW': (n: number) => `${n}天前`,
        'en': (n: number) => `${n} day${n !== 1 ? 's' : ''} ago`,
        'es': (n: number) => `hace ${n} día${n !== 1 ? 's' : ''}`,
        'fr': (n: number) => `il y a ${n} jour${n !== 1 ? 's' : ''}`,
        'de': (n: number) => `vor ${n} Tag${n !== 1 ? 'en' : ''}`
      };
      const template: (n: number) => string = dayTemplates[locale] || dayTemplates['en'];
      return template(diffDays);
    }

    // For older dates, show formatted date
    return this.formatShortDate(dateObj, locale);
  }

  /**
   * Format countdown time for progressive entry flow
   * @param {number} milliseconds - Time remaining in milliseconds
   * @param {string} locale - Locale code
   * @returns {Object} Formatted countdown with color hint
   */
  static formatCountdown(milliseconds: number, locale = 'en'): { text: string; color: string } {
    if (milliseconds <= 0) {
      const expiredText = {
        'zh-CN': '已过期',
        'zh-TW': '已過期',
        'en': 'Expired',
        'es': 'Expirado',
        'fr': 'Expiré',
        'de': 'Abgelaufen'
      };
      const text: string = expiredText[locale as keyof typeof expiredText] || expiredText['en'];
      return {
        text,
        color: 'red'
      };
    }

    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const totalHours = Math.floor(milliseconds / (1000 * 60 * 60));
    const totalDays = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    let text = '';
    let color = 'green';

    if (totalDays > 0) {
      // More than 1 day remaining
      const countdownDayTemplates: Record<string, (d: number, h: number, m: number) => string> = {
        'zh-CN': (d: number, h: number, m: number) => `${d}天 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'zh-TW': (d: number, h: number, m: number) => `${d}天 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'en': (d: number, h: number, m: number) => `${d} day${d !== 1 ? 's' : ''} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'es': (d: number, h: number, m: number) => `${d} día${d !== 1 ? 's' : ''} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'fr': (d: number, h: number, m: number) => `${d} jour${d !== 1 ? 's' : ''} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'de': (d: number, h: number, m: number) => `${d} Tag${d !== 1 ? 'e' : ''} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      };
      const template = countdownDayTemplates[locale] || countdownDayTemplates['en'];
      text = template(totalDays, hours, minutes);
      color = totalDays > 2 ? 'green' : 'yellow';
    } else if (totalHours > 0) {
      // Less than 1 day remaining
      text = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      color = totalHours > 12 ? 'yellow' : 'red';
    } else {
      // Less than 1 hour remaining
      const minuteCountdownTemplates: Record<string, (m: number) => string> = {
        'zh-CN': (m: number) => `${m}分钟`,
        'zh-TW': (m: number) => `${m}分鐘`,
        'en': (m: number) => `${m} minute${m !== 1 ? 's' : ''}`,
        'es': (m: number) => `${m} minuto${m !== 1 ? 's' : ''}`,
        'fr': (m: number) => `${m} minute${m !== 1 ? 's' : ''}`,
        'de': (m: number) => `${m} Minute${m !== 1 ? 'n' : ''}`
      };
      const templateC = minuteCountdownTemplates[locale] || minuteCountdownTemplates['en'];
      text = templateC(totalMinutes);
      color = 'red';
    }

    return { text, color };
  }
}

export default DateFormatter;
