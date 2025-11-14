// @ts-nocheck

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
  static formatDate(date, locale = 'en', format = 'short') {
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
  static formatShortDate(date, locale) {
    const formatOptions = {
      'zh-CN': { year: 'numeric', month: '2-digit', day: '2-digit' },
      'zh-TW': { year: 'numeric', month: '2-digit', day: '2-digit' },
      'en': { year: 'numeric', month: 'short', day: 'numeric' },
      'es': { day: '2-digit', month: '2-digit', year: 'numeric' },
      'fr': { day: '2-digit', month: '2-digit', year: 'numeric' },
      'de': { day: '2-digit', month: '2-digit', year: 'numeric' }
    };

    const options = formatOptions[locale] || formatOptions['en'];
    
    if (locale.startsWith('zh')) {
      // Chinese format: 2024年10月20日
      const formatted = new Intl.DateTimeFormat(locale, options).format(date);
      return formatted.replace(/\//g, '-'); // Ensure consistent separator
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Format date in long format (e.g., 2024年10月20日, October 20, 2024)
   */
  static formatLongDate(date, locale) {
    const formatOptions = {
      'zh-CN': { year: 'numeric', month: 'long', day: 'numeric' },
      'zh-TW': { year: 'numeric', month: 'long', day: 'numeric' },
      'en': { year: 'numeric', month: 'long', day: 'numeric' },
      'es': { day: 'numeric', month: 'long', year: 'numeric' },
      'fr': { day: 'numeric', month: 'long', year: 'numeric' },
      'de': { day: 'numeric', month: 'long', year: 'numeric' }
    };

    const options = formatOptions[locale] || formatOptions['en'];
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Format relative time (e.g., "2 days ago", "2天前", "hace 2 días")
   */
  static formatRelativeTime(date, locale) {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
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
  static formatRelativeTimeFallback(diffDays, diffHours, diffMinutes, locale) {
    const templates = {
      'zh-CN': {
        daysAgo: (n) => `${Math.abs(n)}天前`,
        daysLater: (n) => `${n}天后`,
        hoursAgo: (n) => `${Math.abs(n)}小时前`,
        hoursLater: (n) => `${n}小时后`,
        minutesAgo: (n) => `${Math.abs(n)}分钟前`,
        minutesLater: (n) => `${n}分钟后`,
        now: '刚刚'
      },
      'en': {
        daysAgo: (n) => `${Math.abs(n)} day${Math.abs(n) !== 1 ? 's' : ''} ago`,
        daysLater: (n) => `in ${n} day${n !== 1 ? 's' : ''}`,
        hoursAgo: (n) => `${Math.abs(n)} hour${Math.abs(n) !== 1 ? 's' : ''} ago`,
        hoursLater: (n) => `in ${n} hour${n !== 1 ? 's' : ''}`,
        minutesAgo: (n) => `${Math.abs(n)} minute${Math.abs(n) !== 1 ? 's' : ''} ago`,
        minutesLater: (n) => `in ${n} minute${n !== 1 ? 's' : ''}`,
        now: 'just now'
      },
      'es': {
        daysAgo: (n) => `hace ${Math.abs(n)} día${Math.abs(n) !== 1 ? 's' : ''}`,
        daysLater: (n) => `en ${n} día${n !== 1 ? 's' : ''}`,
        hoursAgo: (n) => `hace ${Math.abs(n)} hora${Math.abs(n) !== 1 ? 's' : ''}`,
        hoursLater: (n) => `en ${n} hora${n !== 1 ? 's' : ''}`,
        minutesAgo: (n) => `hace ${Math.abs(n)} minuto${Math.abs(n) !== 1 ? 's' : ''}`,
        minutesLater: (n) => `en ${n} minuto${n !== 1 ? 's' : ''}`,
        now: 'ahora mismo'
      }
    };

    const template = templates[locale] || templates['en'];

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
  static formatTime(date, locale) {
    const formatOptions = {
      'zh-CN': { hour: '2-digit', minute: '2-digit', hour12: false },
      'zh-TW': { hour: '2-digit', minute: '2-digit', hour12: false },
      'en': { hour: 'numeric', minute: '2-digit', hour12: true },
      'es': { hour: '2-digit', minute: '2-digit', hour12: false },
      'fr': { hour: '2-digit', minute: '2-digit', hour12: false },
      'de': { hour: '2-digit', minute: '2-digit', hour12: false }
    };

    const options = formatOptions[locale] || formatOptions['en'];
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Format date and time together
   */
  static formatDateTime(date, locale) {
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
  static formatTimePeriod(date, locale) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
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
  static parseDate(dateString) {
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
  static getPreferredFormat(locale) {
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
  static formatNotificationTime(date, locale = 'en') {
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
      const minuteTemplates = {
        'zh-CN': (n) => `${n}分钟前`,
        'zh-TW': (n) => `${n}分鐘前`,
        'en': (n) => `${n} minute${n !== 1 ? 's' : ''} ago`,
        'es': (n) => `hace ${n} minuto${n !== 1 ? 's' : ''}`,
        'fr': (n) => `il y a ${n} minute${n !== 1 ? 's' : ''}`,
        'de': (n) => `vor ${n} Minute${n !== 1 ? 'n' : ''}`
      };
      const template = minuteTemplates[locale] || minuteTemplates['en'];
      return template(diffMinutes);
    }

    // If less than 24 hours ago, show hours
    if (diffDays < 1) {
      const hourTemplates = {
        'zh-CN': (n) => `${n}小时前`,
        'zh-TW': (n) => `${n}小時前`,
        'en': (n) => `${n} hour${n !== 1 ? 's' : ''} ago`,
        'es': (n) => `hace ${n} hora${n !== 1 ? 's' : ''}`,
        'fr': (n) => `il y a ${n} heure${n !== 1 ? 's' : ''}`,
        'de': (n) => `vor ${n} Stunde${n !== 1 ? 'n' : ''}`
      };
      const template = hourTemplates[locale] || hourTemplates['en'];
      return template(diffHours);
    }

    // If less than 7 days ago, show days
    if (diffDays < 7) {
      const dayTemplates = {
        'zh-CN': (n) => `${n}天前`,
        'zh-TW': (n) => `${n}天前`,
        'en': (n) => `${n} day${n !== 1 ? 's' : ''} ago`,
        'es': (n) => `hace ${n} día${n !== 1 ? 's' : ''}`,
        'fr': (n) => `il y a ${n} jour${n !== 1 ? 's' : ''}`,
        'de': (n) => `vor ${n} Tag${n !== 1 ? 'en' : ''}`
      };
      const template = dayTemplates[locale] || dayTemplates['en'];
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
  static formatCountdown(milliseconds, locale = 'en') {
    if (milliseconds <= 0) {
      const expiredText = {
        'zh-CN': '已过期',
        'zh-TW': '已過期',
        'en': 'Expired',
        'es': 'Expirado',
        'fr': 'Expiré',
        'de': 'Abgelaufen'
      };
      return {
        text: expiredText[locale] || expiredText['en'],
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
      const dayTemplates = {
        'zh-CN': (d, h, m) => `${d}天 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'zh-TW': (d, h, m) => `${d}天 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'en': (d, h, m) => `${d} day${d !== 1 ? 's' : ''} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'es': (d, h, m) => `${d} día${d !== 1 ? 's' : ''} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'fr': (d, h, m) => `${d} jour${d !== 1 ? 's' : ''} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        'de': (d, h, m) => `${d} Tag${d !== 1 ? 'e' : ''} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      };
      const template = dayTemplates[locale] || dayTemplates['en'];
      text = template(totalDays, hours, minutes);
      color = totalDays > 2 ? 'green' : 'yellow';
    } else if (totalHours > 0) {
      // Less than 1 day remaining
      text = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      color = totalHours > 12 ? 'yellow' : 'red';
    } else {
      // Less than 1 hour remaining
      const minuteTemplates = {
        'zh-CN': (m) => `${m}分钟`,
        'zh-TW': (m) => `${m}分鐘`,
        'en': (m) => `${m} minute${m !== 1 ? 's' : ''}`,
        'es': (m) => `${m} minuto${m !== 1 ? 's' : ''}`,
        'fr': (m) => `${m} minute${m !== 1 ? 's' : ''}`,
        'de': (m) => `${m} Minute${m !== 1 ? 'n' : ''}`
      };
      const template = minuteTemplates[locale] || minuteTemplates['en'];
      text = template(totalMinutes);
      color = 'red';
    }

    return { text, color };
  }
}

export default DateFormatter;
