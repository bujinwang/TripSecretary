/**
 * CountdownFormatter Utility
 * Formats time remaining for countdown displays with localization support
 * 
 * Requirements: 3.1-3.6
 */

class CountdownFormatter {
  /**
   * Format time remaining for display
   * @param {number} milliseconds - Time remaining in milliseconds
   * @param {string} locale - Locale code ('zh', 'en', 'es', etc.)
   * @param {Object} options - Formatting options
   * @returns {Object} - Formatted countdown information
   */
  static formatTimeRemaining(milliseconds, locale = 'zh', options = {}) {
    const {
      showSeconds = false,
      shortFormat = false,
      includeColorHints = true,
      maxUnit = 'days' // 'days', 'hours', 'minutes'
    } = options;

    // Handle invalid or past time
    if (!milliseconds || milliseconds <= 0) {
      return {
        display: this.getTranslation('expired', locale),
        components: { days: 0, hours: 0, minutes: 0, seconds: 0 },
        color: 'red',
        urgency: 'expired',
        isUrgent: true,
        isEmpty: true
      };
    }

    // Calculate time components
    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    const components = {
      days: totalDays,
      hours: totalHours % 24,
      minutes: totalMinutes % 60,
      seconds: totalSeconds % 60
    };

    // Determine display format and urgency
    const urgencyInfo = this.calculateUrgency(totalHours);
    const displayText = this.formatDisplay(components, locale, { shortFormat, showSeconds, maxUnit });

    return {
      display: displayText,
      components,
      color: includeColorHints ? urgencyInfo.color : null,
      urgency: urgencyInfo.level,
      isUrgent: urgencyInfo.isUrgent,
      isEmpty: false,
      totalHours,
      totalMinutes,
      totalSeconds
    };
  }

  /**
   * Calculate urgency level based on time remaining
   * @param {number} totalHours - Total hours remaining
   * @returns {Object} - Urgency information
   */
  static calculateUrgency(totalHours) {
    if (totalHours <= 0) {
      return { level: 'expired', color: 'red', isUrgent: true };
    } else if (totalHours <= 6) {
      return { level: 'critical', color: 'red', isUrgent: true };
    } else if (totalHours <= 24) {
      return { level: 'urgent', color: 'orange', isUrgent: true };
    } else if (totalHours <= 72) {
      return { level: 'moderate', color: 'yellow', isUrgent: false };
    } else {
      return { level: 'low', color: 'green', isUrgent: false };
    }
  }

  /**
   * Format display text based on components and locale
   * @param {Object} components - Time components
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {string} - Formatted display text
   */
  static formatDisplay(components, locale, options = {}) {
    const { shortFormat = false, showSeconds = false, maxUnit = 'days' } = options;
    const { days, hours, minutes, seconds } = components;

    // Determine which components to show based on maxUnit and values
    let showDays = maxUnit === 'days' && days > 0;
    let showHours = (maxUnit === 'days' || maxUnit === 'hours') && (hours > 0 || days > 0);
    let showMinutes = minutes > 0 || hours > 0 || days > 0;

    // Special case: if everything is 0 except seconds, show minutes as 0
    if (days === 0 && hours === 0 && minutes === 0 && seconds > 0) {
      showMinutes = true;
    }

    const parts = [];

    if (showDays && days > 0) {
      parts.push(this.formatTimeUnit('days', days, locale, shortFormat));
    }

    if (showHours && hours > 0) {
      parts.push(this.formatTimeUnit('hours', hours, locale, shortFormat));
    }

    if (showMinutes) {
      parts.push(this.formatTimeUnit('minutes', minutes, locale, shortFormat));
    }

    if (showSeconds && seconds > 0) {
      parts.push(this.formatTimeUnit('seconds', seconds, locale, shortFormat));
    }

    // If no parts, show 0 minutes
    if (parts.length === 0) {
      parts.push(this.formatTimeUnit('minutes', 0, locale, shortFormat));
    }

    // Enhanced formatting for Chinese users - more natural language
    if (locale.startsWith('zh')) {
      return this.formatChineseTime(parts, components, options);
    }

    // Join parts based on locale
    return this.joinTimeParts(parts, locale);
  }

  /**
   * Format time display specifically for Chinese users with more natural language
   * @param {string[]} parts - Array of formatted time parts
   * @param {Object} components - Time components
   * @param {Object} options - Formatting options
   * @returns {string} - Chinese-optimized time display
   */
  static formatChineseTime(parts, components, options = {}) {
    const { days, hours, minutes, seconds } = components;
    const { showSeconds = false } = options;

    // For times over 24 hours, use "X天X小时X分钟" format
    if (days > 0) {
      const dayPart = days > 0 ? `${days}天` : '';
      const hourPart = hours > 0 ? `${hours}小时` : '';
      const minutePart = minutes > 0 ? `${minutes}分钟` : '';
      const secondPart = showSeconds && seconds > 0 ? `${seconds}秒` : '';

      return [dayPart, hourPart, minutePart, secondPart].filter(Boolean).join(' ');
    }

    // For times under 24 hours, use more conversational format
    if (hours > 0) {
      const hourPart = `${hours}小时`;
      const minutePart = minutes > 0 ? `${minutes}分钟` : '';
      const secondPart = showSeconds && seconds > 0 ? `${seconds}秒` : '';

      return [hourPart, minutePart, secondPart].filter(Boolean).join(' ');
    }

    // For times under 1 hour
    if (minutes > 0) {
      const minutePart = `${minutes}分钟`;
      const secondPart = showSeconds && seconds > 0 ? `${seconds}秒` : '';

      return [minutePart, secondPart].filter(Boolean).join(' ');
    }

    // For times under 1 minute
    if (showSeconds && seconds > 0) {
      return `${seconds}秒`;
    }

    return '0分钟';
  }

  /**
   * Format a single time unit with proper plural forms
   * @param {string} unit - Time unit ('days', 'hours', 'minutes', 'seconds')
   * @param {number} value - Value for the unit
   * @param {string} locale - Locale code
   * @param {boolean} shortFormat - Use short format
   * @returns {string} - Formatted time unit
   */
  static formatTimeUnit(unit, value, locale, shortFormat = false) {
    // Normalize locale codes
    const normalizedLocale = this.normalizeLocale(locale);
    
    const translations = {
      'zh-CN': {
        days: { long: '天', short: '天' },
        hours: { long: '小时', short: '时' },
        minutes: { long: '分钟', short: '分' },
        seconds: { long: '秒', short: '秒' }
      },
      'zh-TW': {
        days: { long: '天', short: '天' },
        hours: { long: '小時', short: '時' },
        minutes: { long: '分鐘', short: '分' },
        seconds: { long: '秒', short: '秒' }
      },
      'zh': {
        days: { long: '天', short: '天' },
        hours: { long: '小时', short: '时' },
        minutes: { long: '分钟', short: '分' },
        seconds: { long: '秒', short: '秒' }
      },
      en: {
        days: { 
          long: this.getPlural(value, 'day', 'days'), 
          short: 'd' 
        },
        hours: { 
          long: this.getPlural(value, 'hour', 'hours'), 
          short: 'h' 
        },
        minutes: { 
          long: this.getPlural(value, 'minute', 'minutes'), 
          short: 'm' 
        },
        seconds: { 
          long: this.getPlural(value, 'second', 'seconds'), 
          short: 's' 
        }
      },
      es: {
        days: { 
          long: this.getPlural(value, 'día', 'días'), 
          short: 'd' 
        },
        hours: { 
          long: this.getPlural(value, 'hora', 'horas'), 
          short: 'h' 
        },
        minutes: { 
          long: this.getPlural(value, 'minuto', 'minutos'), 
          short: 'm' 
        },
        seconds: { 
          long: this.getPlural(value, 'segundo', 'segundos'), 
          short: 's' 
        }
      },
      fr: {
        days: { 
          long: this.getPlural(value, 'jour', 'jours'), 
          short: 'j' 
        },
        hours: { 
          long: this.getPlural(value, 'heure', 'heures'), 
          short: 'h' 
        },
        minutes: { 
          long: this.getPlural(value, 'minute', 'minutes'), 
          short: 'm' 
        },
        seconds: { 
          long: this.getPlural(value, 'seconde', 'secondes'), 
          short: 's' 
        }
      },
      de: {
        days: { 
          long: this.getPlural(value, 'Tag', 'Tage'), 
          short: 'T' 
        },
        hours: { 
          long: this.getPlural(value, 'Stunde', 'Stunden'), 
          short: 'h' 
        },
        minutes: { 
          long: this.getPlural(value, 'Minute', 'Minuten'), 
          short: 'm' 
        },
        seconds: { 
          long: this.getPlural(value, 'Sekunde', 'Sekunden'), 
          short: 's' 
        }
      }
    };

    const localeTranslations = translations[normalizedLocale] || translations.en;
    const unitTranslation = localeTranslations[unit];
    const format = shortFormat ? 'short' : 'long';
    const unitText = unitTranslation[format];

    // Format based on locale conventions
    if (normalizedLocale.startsWith('zh')) {
      return `${value} ${unitText}`;
    } else {
      return shortFormat ? `${value}${unitText}` : `${value} ${unitText}`;
    }
  }

  /**
   * Get plural form for a given value
   * @param {number} value - The numeric value
   * @param {string} singular - Singular form
   * @param {string} plural - Plural form
   * @returns {string} - Correct form based on value
   */
  static getPlural(value, singular, plural) {
    return value === 1 ? singular : plural;
  }

  /**
   * Normalize locale codes for consistent handling
   * @param {string} locale - Input locale code
   * @returns {string} - Normalized locale code
   */
  static normalizeLocale(locale) {
    if (!locale) return 'en';
    
    // Handle common variations
    const localeMap = {
      'zh': 'zh-CN',
      'zh-Hans': 'zh-CN',
      'zh-Hant': 'zh-TW',
      'zh-HK': 'zh-TW'
    };
    
    return localeMap[locale] || locale;
  }

  /**
   * Join time parts based on locale conventions
   * @param {string[]} parts - Array of formatted time parts
   * @param {string} locale - Locale code
   * @returns {string} - Joined time string
   */
  static joinTimeParts(parts, locale) {
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];

    const joiners = {
      zh: ' ',
      en: ' ',
      es: ' ',
      fr: ' ',
      de: ' '
    };

    const joiner = joiners[locale] || ' ';
    return parts.join(joiner);
  }

  /**
   * Get translation for common countdown messages
   * @param {string} key - Translation key
   * @param {string} locale - Locale code
   * @returns {string} - Translated message
   */
  static getTranslation(key, locale) {
    const normalizedLocale = this.normalizeLocale(locale);
    
    const translations = {
      'zh-CN': {
        expired: '已过期',
        remaining: '剩余',
        until: '直到',
        left: '剩余',
        ago: '前',
        noDate: '未设置泰国入境日期，无法提交入境卡'
      },
      'zh-TW': {
        expired: '已過期',
        remaining: '剩餘',
        until: '直到',
        left: '剩餘',
        ago: '前',
        noDate: '未設置泰國入境日期，無法提交入境卡'
      },
      zh: {
        expired: '已过期',
        remaining: '剩余',
        until: '直到',
        left: '剩余',
        ago: '前',
        noDate: '未设置泰国入境日期，无法提交入境卡'
      },
      en: {
        expired: 'Expired',
        remaining: 'remaining',
        until: 'until',
        left: 'left',
        ago: 'ago',
        noDate: 'No Thailand arrival date set, cannot submit entry card'
      },
      es: {
        expired: 'Expirado',
        remaining: 'restante',
        until: 'hasta',
        left: 'restante',
        ago: 'hace',
        noDate: 'No se ha establecido fecha de llegada a Tailandia, no se puede enviar tarjeta de entrada'
      },
      fr: {
        expired: 'Expiré',
        remaining: 'restant',
        until: 'jusqu\'à',
        left: 'restant',
        ago: 'il y a',
        noDate: 'Aucune date d\'arrivée en Thaïlande définie, impossible de soumettre la carte d\'entrée'
      },
      de: {
        expired: 'Abgelaufen',
        remaining: 'verbleibend',
        until: 'bis',
        left: 'übrig',
        ago: 'vor',
        noDate: 'Kein Ankunftsdatum für Thailand festgelegt, Einreisekarte kann nicht eingereicht werden'
      }
    };

    const localeTranslations = translations[normalizedLocale] || translations.en;
    return localeTranslations[key] || key;
  }

  /**
   * Format countdown with context message
   * @param {number} milliseconds - Time remaining in milliseconds
   * @param {string} locale - Locale code
   * @param {string} context - Context ('until_deadline', 'until_arrival', 'until_window_opens')
   * @param {Object} options - Formatting options
   * @returns {Object} - Formatted countdown with context
   */
  static formatWithContext(milliseconds, locale = 'zh', context = 'until_deadline', options = {}) {
    const countdown = this.formatTimeRemaining(milliseconds, locale, options);
    
    if (countdown.isEmpty) {
      return countdown;
    }

    const normalizedLocale = this.normalizeLocale(locale);
    
    const contextMessages = {
      'zh-CN': {
        until_deadline: `距离截止还有 ${countdown.display}`,
        until_arrival: `距离抵达还有 ${countdown.display}`,
        until_window_opens: `还有 ${countdown.display} 可以提交入境卡`,
        time_left: `剩余 ${countdown.display}`,
        pre_window: `还有 ${countdown.display} 可以提交入境卡`,
        within_window: `距离截止还有 ${countdown.display}，请尽快提交`,
        urgent: `距离截止还有 ${countdown.display}`
      },
      'zh-TW': {
        until_deadline: `距離截止還有 ${countdown.display}`,
        until_arrival: `距離抵達還有 ${countdown.display}`,
        until_window_opens: `還有 ${countdown.display} 可以提交入境卡`,
        time_left: `剩餘 ${countdown.display}`,
        pre_window: `還有 ${countdown.display} 可以提交入境卡`,
        within_window: `距離截止還有 ${countdown.display}，請儘快提交`,
        urgent: `距離截止還有 ${countdown.display}`
      },
      zh: {
        until_deadline: `距离截止还有 ${countdown.display}`,
        until_arrival: `距离抵达还有 ${countdown.display}`,
        until_window_opens: `还有 ${countdown.display} 可以提交入境卡`,
        time_left: `剩余 ${countdown.display}`,
        pre_window: `还有 ${countdown.display} 可以提交入境卡`,
        within_window: `距离截止还有 ${countdown.display}，请尽快提交`,
        urgent: `距离截止还有 ${countdown.display}`
      },
      en: {
        until_deadline: `${countdown.display} until deadline`,
        until_arrival: `${countdown.display} until arrival`,
        until_window_opens: `${countdown.display} until submission opens`,
        time_left: `${countdown.display} left`,
        pre_window: `${countdown.display} until submission opens`,
        within_window: `${countdown.display} until deadline, please submit soon`,
        urgent: `${countdown.display} until deadline`
      },
      es: {
        until_deadline: `${countdown.display} hasta la fecha límite`,
        until_arrival: `${countdown.display} hasta la llegada`,
        until_window_opens: `${countdown.display} hasta que se abra el envío`,
        time_left: `${countdown.display} restante`,
        pre_window: `${countdown.display} hasta que se abra el envío`,
        within_window: `${countdown.display} hasta la fecha límite, por favor envíe pronto`,
        urgent: `${countdown.display} hasta la fecha límite`
      },
      fr: {
        until_deadline: `${countdown.display} jusqu'à la date limite`,
        until_arrival: `${countdown.display} jusqu'à l'arrivée`,
        until_window_opens: `${countdown.display} jusqu'à l'ouverture de la soumission`,
        time_left: `${countdown.display} restant`,
        pre_window: `${countdown.display} jusqu'à l'ouverture de la soumission`,
        within_window: `${countdown.display} jusqu'à la date limite, veuillez soumettre bientôt`,
        urgent: `${countdown.display} jusqu'à la date limite`
      },
      de: {
        until_deadline: `${countdown.display} bis zur Frist`,
        until_arrival: `${countdown.display} bis zur Ankunft`,
        until_window_opens: `${countdown.display} bis zur Öffnung der Einreichung`,
        time_left: `${countdown.display} übrig`,
        pre_window: `${countdown.display} bis zur Öffnung der Einreichung`,
        within_window: `${countdown.display} bis zur Frist, bitte bald einreichen`,
        urgent: `${countdown.display} bis zur Frist`
      }
    };

    const localeMessages = contextMessages[normalizedLocale] || contextMessages.en;
    const contextMessage = localeMessages[context] || countdown.display;

    return {
      ...countdown,
      contextMessage,
      context
    };
  }

  /**
   * Get color hints based on urgency level
   * @param {string} urgencyLevel - Urgency level
   * @returns {Object} - Color information for UI
   */
  static getColorHints(urgencyLevel) {
    const colorMap = {
      expired: {
        primary: '#FF4444',
        background: '#FFEBEE',
        text: '#B71C1C',
        border: '#FF4444'
      },
      critical: {
        primary: '#FF6B35',
        background: '#FFF3E0',
        text: '#E65100',
        border: '#FF6B35'
      },
      urgent: {
        primary: '#FFA726',
        background: '#FFF8E1',
        text: '#F57C00',
        border: '#FFA726'
      },
      moderate: {
        primary: '#FFEB3B',
        background: '#FFFDE7',
        text: '#F57F17',
        border: '#FFEB3B'
      },
      low: {
        primary: '#4CAF50',
        background: '#E8F5E8',
        text: '#2E7D32',
        border: '#4CAF50'
      }
    };

    return colorMap[urgencyLevel] || colorMap.low;
  }

  /**
   * Create a live countdown that updates automatically
   * @param {Date} targetDate - Target date/time
   * @param {Function} callback - Callback function to receive updates
   * @param {string} locale - Locale code
   * @param {Object} options - Formatting options
   * @returns {Function} - Function to stop the countdown
   */
  static createLiveCountdown(targetDate, callback, locale = 'zh', options = {}) {
    if (!targetDate || typeof callback !== 'function') {
      return () => {}; // Return empty stop function
    }

    const updateInterval = options.updateInterval || 1000; // Default 1 second
    
    const update = () => {
      const now = new Date();
      const timeRemaining = targetDate.getTime() - now.getTime();
      const formatted = this.formatTimeRemaining(timeRemaining, locale, options);
      callback(formatted);

      // Stop if expired
      if (timeRemaining <= 0) {
        clearInterval(intervalId);
      }
    };

    // Initial update
    update();

    // Set up interval
    const intervalId = setInterval(update, updateInterval);

    // Return stop function
    return () => clearInterval(intervalId);
  }

  /**
   * Format multiple countdown formats for different use cases
   * @param {number} milliseconds - Time remaining in milliseconds
   * @param {string} locale - Locale code
   * @returns {Object} - Multiple format options
   */
  static formatMultiple(milliseconds, locale = 'zh') {
    return {
      compact: this.formatTimeRemaining(milliseconds, locale, { shortFormat: true, maxUnit: 'hours' }),
      detailed: this.formatTimeRemaining(milliseconds, locale, { shortFormat: false, showSeconds: true }),
      simple: this.formatTimeRemaining(milliseconds, locale, { shortFormat: false, maxUnit: 'hours' }),
      minimal: this.formatTimeRemaining(milliseconds, locale, { shortFormat: true, maxUnit: 'minutes' })
    };
  }
}

export default CountdownFormatter;