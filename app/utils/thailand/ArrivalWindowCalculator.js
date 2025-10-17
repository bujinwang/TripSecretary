/**
 * Arrival Window Calculator Utility
 * Handles 72-hour window calculations and messaging for Thailand TDAC submissions
 * Provides timezone handling and countdown functionality
 */

class ArrivalWindowCalculator {
  /**
   * Calculate the 72-hour submission window for Thailand arrival
   * @param {string|Date} arrivalDate - Arrival date (YYYY-MM-DD or Date object)
   * @returns {Object} - Arrival window information
   */
  static calculateWindow(arrivalDate) {
    if (!arrivalDate) {
      return {
        isWithin72Hours: false,
        hoursRemaining: null,
        canSubmit: false,
        arrivalDate: null,
        submissionWindowStart: null,
        daysRemaining: null,
        hoursUntilWindow: null
      };
    }

    const arrival = new Date(arrivalDate);
    const now = new Date();
    
    // Calculate 72 hours (3 days) before arrival
    const submissionWindowStart = new Date(arrival.getTime() - (72 * 60 * 60 * 1000));
    
    // Calculate time differences
    const msUntilArrival = arrival.getTime() - now.getTime();
    const hoursUntilArrival = msUntilArrival / (1000 * 60 * 60);
    
    const msUntilWindow = submissionWindowStart.getTime() - now.getTime();
    const hoursUntilWindow = msUntilWindow / (1000 * 60 * 60);
    
    // Determine if we're within the 72-hour window
    const isWithin72Hours = hoursUntilArrival <= 72 && hoursUntilArrival > 0;
    const canSubmit = isWithin72Hours;
    
    // Calculate days and hours remaining until window opens (if not yet open)
    let daysRemaining = null;
    let hoursRemainingUntilWindow = null;
    
    if (hoursUntilWindow > 0) {
      daysRemaining = Math.floor(hoursUntilWindow / 24);
      hoursRemainingUntilWindow = Math.ceil(hoursUntilWindow % 24);
    }

    return {
      isWithin72Hours,
      hoursRemaining: isWithin72Hours ? Math.ceil(hoursUntilArrival) : null,
      canSubmit,
      arrivalDate: arrival,
      submissionWindowStart,
      daysRemaining,
      hoursUntilWindow: hoursUntilWindow > 0 ? Math.ceil(hoursUntilWindow) : 0,
      hoursUntilArrival: Math.ceil(hoursUntilArrival)
    };
  }

  /**
   * Get localized status message based on arrival window
   * @param {Object} window - Window object from calculateWindow()
   * @param {string} locale - Locale code ('zh', 'en', etc.)
   * @returns {string} - Localized status message
   */
  static getStatusMessage(window, locale = 'zh') {
    if (!window.arrivalDate) {
      return this.getTranslation('no_arrival_date', locale);
    }

    if (window.hoursUntilArrival <= 0) {
      return this.getTranslation('arrival_passed', locale);
    }

    if (window.canSubmit) {
      if (window.hoursRemaining <= 24) {
        // Within 24 hours - show countdown
        return this.getTranslation('countdown_hours', locale, { hours: window.hoursRemaining });
      } else {
        // Within 72 hours but more than 24 hours
        return this.getTranslation('can_submit', locale);
      }
    } else {
      // Outside 72-hour window
      if (window.daysRemaining > 0) {
        return this.getTranslation('days_until_window', locale, { 
          days: window.daysRemaining, 
          hours: window.hoursUntilWindow % 24 
        });
      } else {
        return this.getTranslation('hours_until_window', locale, { hours: window.hoursUntilWindow });
      }
    }
  }

  /**
   * Get submission availability date and time
   * @param {Object} window - Window object from calculateWindow()
   * @param {string} locale - Locale code
   * @returns {string} - Formatted availability message
   */
  static getAvailabilityMessage(window, locale = 'zh') {
    if (!window.submissionWindowStart) {
      return '';
    }

    if (window.canSubmit) {
      return this.getTranslation('available_now', locale);
    }

    const date = window.submissionWindowStart.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US');
    const time = window.submissionWindowStart.toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return this.getTranslation('available_at', locale, { date, time });
  }

  /**
   * Check if submission can be made now
   * @param {string|Date} arrivalDate - Arrival date
   * @returns {boolean} - Can submit now
   */
  static canSubmitNow(arrivalDate) {
    const window = this.calculateWindow(arrivalDate);
    return window.canSubmit;
  }

  /**
   * Get countdown display for submissions within 24 hours
   * @param {Object} window - Window object from calculateWindow()
   * @param {string} locale - Locale code
   * @returns {string} - Countdown display string
   */
  static getCountdownDisplay(window, locale = 'zh') {
    if (!window.canSubmit || window.hoursRemaining > 24) {
      return '';
    }

    const hours = Math.floor(window.hoursRemaining);
    const minutes = Math.floor((window.hoursRemaining % 1) * 60);

    if (locale === 'zh') {
      return `${hours}小时${minutes}分钟后抵达`;
    } else {
      return `${hours}h ${minutes}m until arrival`;
    }
  }

  /**
   * Get time remaining until window opens (for display when outside 72h window)
   * @param {Object} window - Window object from calculateWindow()
   * @param {string} locale - Locale code
   * @returns {string} - Time remaining display
   */
  static getTimeUntilWindowDisplay(window, locale = 'zh') {
    if (window.canSubmit || !window.daysRemaining) {
      return '';
    }

    const days = window.daysRemaining;
    const hours = Math.ceil(window.hoursUntilWindow % 24);

    if (locale === 'zh') {
      if (days > 0) {
        return `${days}天 ${hours}小时`;
      } else {
        return `${hours}小时`;
      }
    } else {
      if (days > 0) {
        return `${days}d ${hours}h`;
      } else {
        return `${hours}h`;
      }
    }
  }

  /**
   * Get translation for a key with interpolation support
   * @param {string} key - Translation key
   * @param {string} locale - Locale code
   * @param {Object} params - Parameters for interpolation
   * @returns {string} - Translated string
   */
  static getTranslation(key, locale, params = {}) {
    const translations = {
      zh: {
        no_arrival_date: '请设置抵达日期',
        arrival_passed: '抵达时间已过',
        countdown_hours: `${params.hours || 0}小时后抵达 - 可以提交！`,
        can_submit: '可以提交 TDAC',
        days_until_window: `${params.days || 0}天后可提交`,
        hours_until_window: `${params.hours || 0}小时后可提交`,
        available_now: '现在可以提交',
        available_at: `${params.date} ${params.time} 可提交`
      },
      en: {
        no_arrival_date: 'Please set arrival date',
        arrival_passed: 'Arrival time has passed',
        countdown_hours: `${params.hours || 0} hours until arrival - Ready to submit!`,
        can_submit: 'Ready to submit TDAC',
        days_until_window: `Available in ${params.days || 0} days`,
        hours_until_window: `Available in ${params.hours || 0} hours`,
        available_now: 'Available now',
        available_at: `Available at ${params.date} ${params.time}`
      }
    };

    const localeTranslations = translations[locale] || translations.en;
    return localeTranslations[key] || key;
  }

  /**
   * Get window status for UI display
   * @param {Object} window - Window object from calculateWindow()
   * @returns {string} - Status for UI ('ready', 'waiting', 'expired', 'no_date')
   */
  static getWindowStatus(window) {
    if (!window.arrivalDate) {
      return 'no_date';
    }

    if (window.hoursUntilArrival <= 0) {
      return 'expired';
    }

    if (window.canSubmit) {
      return 'ready';
    }

    return 'waiting';
  }

  /**
   * Get CSS class or style indicator for window status
   * @param {Object} window - Window object from calculateWindow()
   * @returns {string} - Style indicator ('success', 'warning', 'error', 'neutral')
   */
  static getStatusStyle(window) {
    const status = this.getWindowStatus(window);
    
    switch (status) {
      case 'ready':
        return 'success';
      case 'waiting':
        return 'warning';
      case 'expired':
        return 'error';
      case 'no_date':
      default:
        return 'neutral';
    }
  }

  /**
   * Check if arrival date is valid for TDAC submission
   * @param {string|Date} arrivalDate - Arrival date
   * @returns {Object} - Validation result
   */
  static validateArrivalDate(arrivalDate) {
    if (!arrivalDate) {
      return {
        isValid: false,
        error: 'Arrival date is required'
      };
    }

    const arrival = new Date(arrivalDate);
    const now = new Date();

    if (isNaN(arrival.getTime())) {
      return {
        isValid: false,
        error: 'Invalid arrival date format'
      };
    }

    if (arrival <= now) {
      return {
        isValid: false,
        error: 'Arrival date must be in the future'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Get next update time for dynamic UI updates
   * Returns when the status should be recalculated (e.g., when window opens)
   * @param {Object} window - Window object from calculateWindow()
   * @returns {Date|null} - Next update time or null if no update needed
   */
  static getNextUpdateTime(window) {
    if (!window.arrivalDate || window.hoursUntilArrival <= 0) {
      return null;
    }

    if (window.canSubmit) {
      // Update every hour when within submission window
      const now = new Date();
      const nextHour = new Date(now.getTime() + (60 * 60 * 1000));
      return nextHour;
    } else {
      // Update when submission window opens
      return window.submissionWindowStart;
    }
  }
}

export default ArrivalWindowCalculator;