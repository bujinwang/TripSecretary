// @ts-nocheck — Thailand-specific arrival window; full typing deferred
/**
 * Arrival Window Calculator Utility
 * Handles 72-hour window calculations and messaging for Thailand TDAC submissions
 * Provides timezone handling and countdown functionality
 * 
 * Extended for Progressive Entry Flow
 * Requirements: 3.1-3.6
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

    // Parse date string correctly to avoid timezone issues
    // "2025-10-31" should be interpreted as local date, not UTC
    let arrival;
    if (typeof arrivalDate === 'string') {
      const [year, month, day] = arrivalDate.split('-').map(Number);
      arrival = new Date(year, month - 1, day);
    } else {
      arrival = new Date(arrivalDate);
    }
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
  static getStatusMessage(window, locale = 'zh-CN') {
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
  static getAvailabilityMessage(window, locale = 'zh-CN') {
    if (!window.submissionWindowStart) {
      return '';
    }

    if (window.canSubmit) {
      return this.getTranslation('available_now', locale);
    }

    const date = window.submissionWindowStart.toLocaleDateString(locale);
    const time = window.submissionWindowStart.toLocaleTimeString(locale, {
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
  static getCountdownDisplay(window, locale = 'zh-CN') {
    if (!window.canSubmit || window.hoursRemaining > 24) {
      return '';
    }

    const hours = Math.floor(window.hoursRemaining);
    const minutes = Math.floor((window.hoursRemaining % 1) * 60);

    if (locale && locale.startsWith('zh')) {
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
  static getTimeUntilWindowDisplay(window, locale = 'zh-CN') {
    if (window.canSubmit || !window.daysRemaining) {
      return '';
    }

    const days = window.daysRemaining;
    const hours = Math.ceil(window.hoursUntilWindow % 24);

    if (locale && locale.startsWith('zh')) {
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
      'zh-CN': {
        no_arrival_date: '请设置抵达日期',
        arrival_passed: '抵达时间已过',
        countdown_hours: `${params.hours || 0}小时后抵达 - 可以提交！`,
        can_submit: '可以提交 TDAC',
        days_until_window: `${params.days || 0}天后可提交`,
        hours_until_window: `${params.hours || 0}小时后可提交`,
        available_now: '现在可以提交',
        available_at: `${params.date} ${params.time} 可提交`
      },
      'zh-TW': {
        no_arrival_date: '請設置抵達日期',
        arrival_passed: '抵達時間已過',
        countdown_hours: `${params.hours || 0}小時後抵達 - 可以提交！`,
        can_submit: '可以提交 TDAC',
        days_until_window: `${params.days || 0}天後可提交`,
        hours_until_window: `${params.hours || 0}小時後可提交`,
        available_now: '現在可以提交',
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

    const localeTranslations = translations[locale] || (locale && locale.startsWith('zh') ? translations['zh-CN'] : translations.en);
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

  // ===== PROGRESSIVE ENTRY FLOW EXTENSIONS =====

  /**
   * Get submission window status and message for progressive entry flow
   * @param {string|Date} arrivalDate - Arrival date
   * @param {string} locale - Locale code ('zh', 'en', 'es', etc.)
   * @returns {Object} - Submission window information
   */
  static getSubmissionWindow(arrivalDate, locale = 'zh-CN') {
    if (!arrivalDate) {
      return {
        state: 'no-date',
        message: this.getProgressiveTranslation('no_date', locale),
        timeRemaining: null,
        submissionOpensAt: null,
        submissionClosesAt: null,
        canSubmit: false,
        urgencyColor: 'gray'
      };
    }

    const window = this.calculateWindow(arrivalDate);

    // Parse date string correctly to avoid timezone issues
    // "2025-10-31" should be interpreted as local date, not UTC
    let arrival;
    if (typeof arrivalDate === 'string') {
      const [year, month, day] = arrivalDate.split('-').map(Number);
      arrival = new Date(year, month - 1, day);
    } else {
      arrival = new Date(arrivalDate);
    }
    const now = new Date();
    
    // Calculate time remaining until arrival
    const msUntilArrival = arrival.getTime() - now.getTime();
    const hoursUntilArrival = msUntilArrival / (1000 * 60 * 60);

    // Determine window state
    let state, message, urgencyColor;

    if (hoursUntilArrival <= 0) {
      // Past deadline
      state = 'past-deadline';
      message = this.getProgressiveTranslation('past_deadline', locale);
      urgencyColor = 'red';
    } else if (hoursUntilArrival <= 24) {
      // Urgent - within 24 hours
      state = 'urgent';
      const hours = Math.floor(hoursUntilArrival);
      const minutes = Math.floor((hoursUntilArrival % 1) * 60);
      message = this.getProgressiveTranslation('urgent', locale, { hours, minutes });
      urgencyColor = 'red';
    } else if (hoursUntilArrival <= 72) {
      // Within window - can submit
      state = 'within-window';
      const hours = Math.floor(hoursUntilArrival);
      const minutes = Math.floor((hoursUntilArrival % 1) * 60);
      message = this.getProgressiveTranslation('within_window', locale, { hours, minutes });
      urgencyColor = 'yellow';
    } else {
      // Pre-window - too early to submit
      state = 'pre-window';
      const days = Math.floor(hoursUntilArrival / 24);
      const hours = Math.floor(hoursUntilArrival % 24);
      message = this.getProgressiveTranslation('pre_window', locale, { days, hours });
      urgencyColor = 'green';
    }

    return {
      state,
      message,
      timeRemaining: msUntilArrival > 0 ? msUntilArrival : null,
      submissionOpensAt: window.submissionWindowStart,
      submissionClosesAt: arrival,
      canSubmit: window.canSubmit,
      urgencyColor,
      hoursUntilArrival: Math.max(0, hoursUntilArrival),
      daysUntilArrival: Math.max(0, Math.floor(hoursUntilArrival / 24))
    };
  }

  /**
   * Get localized messages for progressive entry flow
   * @param {string} key - Translation key
   * @param {string} locale - Locale code
   * @param {Object} params - Parameters for interpolation
   * @returns {string} - Localized message
   */
  static getProgressiveTranslation(key, locale, params = {}) {
    const translations = {
      'zh-CN': {
        no_date: '未设置泰国入境日期，无法提交入境卡',
        pre_window: `还有 ${params.days || 0} 天 ${params.hours || 0} 小时可以提交入境卡`,
        within_window: '提交窗口已开启，请在倒计时结束前完成提交',
        urgent: '进入最后冲刺！窗口即将关闭，请立即提交入境卡',
        past_deadline: '提交截止时间已过，请联系相关部门'
      },
      'zh-TW': {
        no_date: '未設置泰國入境日期，無法提交入境卡',
        pre_window: `還有 ${params.days || 0} 天 ${params.hours || 0} 小時可以提交入境卡`,
        within_window: '提交窗口已開啟，請在倒計時結束前完成提交',
        urgent: '進入最後衝刺！窗口即將關閉，請立即提交入境卡',
        past_deadline: '提交截止時間已過，請聯繫相關部門'
      },
      en: {
        no_date: 'No Thailand arrival date set, cannot submit entry card',
        pre_window: `Can submit in ${params.days || 0} days ${params.hours || 0} hours`,
        within_window: 'Submission window is open. Submit before the countdown ends.',
        urgent: 'Final call! The window is closing—submit now.',
        past_deadline: 'Submission deadline has passed, please contact authorities'
      },
      es: {
        no_date: 'No se ha establecido la fecha de llegada a Tailandia, no se puede enviar la tarjeta de entrada',
        pre_window: `Se puede enviar en ${params.days || 0} días ${params.hours || 0} horas`,
        within_window: 'La ventana de envío está abierta. Envíe antes de que termine la cuenta regresiva.',
        urgent: '¡Último aviso! La ventana está por cerrar, envíe ahora.',
        past_deadline: 'La fecha límite de envío ha pasado, contacte a las autoridades'
      },
      fr: {
        no_date: 'Aucune date d\'arrivée en Thaïlande définie, impossible de soumettre la carte d\'entrée',
        pre_window: `Peut soumettre dans ${params.days || 0} jours ${params.hours || 0} heures`,
        within_window: 'La fenêtre de soumission est ouverte. Envoyez avant la fin du compte à rebours.',
        urgent: 'Dernier rappel ! La fenêtre va fermer — soumettez maintenant.',
        past_deadline: 'La date limite de soumission est passée, veuillez contacter les autorités'
      },
      de: {
        no_date: 'Kein Thailand-Ankunftsdatum festgelegt, Einreisekarte kann nicht eingereicht werden',
        pre_window: `Kann in ${params.days || 0} Tagen ${params.hours || 0} Stunden eingereicht werden`,
        within_window: 'Das Einreichfenster ist geöffnet. Reiche vor Ablauf des Countdowns ein.',
        urgent: 'Letzter Aufruf! Das Fenster schließt bald – jetzt einreichen.',
        past_deadline: 'Einreichungsfrist ist abgelaufen, bitte kontaktieren Sie die Behörden'
      }
    };

    const localeTranslations = translations[locale] || (locale && locale.startsWith('zh') ? translations['zh-CN'] : translations.en);
    return localeTranslations[key] || key;
  }

  /**
   * Start real-time countdown updates (every minute)
   * @param {string|Date} arrivalDate - Arrival date
   * @param {Function} callback - Callback function to receive updates
   * @param {string} locale - Locale code
   * @returns {Function} - Function to stop updates
   */
  static startRealtimeUpdates(arrivalDate, callback, locale = 'zh-CN') {
    if (!arrivalDate || typeof callback !== 'function') {
      return () => {}; // Return empty stop function
    }

    // Initial update
    const initialWindow = this.getSubmissionWindow(arrivalDate, locale);
    callback(initialWindow);

    // Set up interval for updates every minute
    const intervalId = setInterval(() => {
      const window = this.getSubmissionWindow(arrivalDate, locale);
      callback(window);

      // Stop updates if past deadline
      if (window.state === 'past-deadline') {
        clearInterval(intervalId);
      }
    }, 60000); // Update every minute

    // Return stop function
    return () => clearInterval(intervalId);
  }

  /**
   * Get countdown format for display
   * @param {number} milliseconds - Time remaining in milliseconds
   * @param {string} locale - Locale code
   * @returns {Object} - Formatted countdown
   */
  static formatTimeRemaining(milliseconds, locale = 'zh-CN') {
    if (!milliseconds || milliseconds <= 0) {
      return {
        display: locale && locale.startsWith('zh') ? '已过期' : 'Expired',
        days: 0,
        hours: 0,
        minutes: 0,
        color: 'red',
        isUrgent: true
      };
    }

    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    let display, color, isUrgent;

    if (days > 0) {
      display = locale && locale.startsWith('zh') 
        ? `${days} 天 ${hours} 小时` 
        : `${days}d ${hours}h`;
      color = 'green';
      isUrgent = false;
    } else if (hours > 0) {
      display = locale && locale.startsWith('zh') 
        ? `${hours} 小时 ${minutes} 分钟` 
        : `${hours}h ${minutes}m`;
      color = hours <= 6 ? 'red' : 'yellow';
      isUrgent = hours <= 6;
    } else {
      display = locale && locale.startsWith('zh') 
        ? `${minutes} 分钟` 
        : `${minutes}m`;
      color = 'red';
      isUrgent = true;
    }

    return {
      display,
      days,
      hours,
      minutes,
      color,
      isUrgent
    };
  }

  /**
   * Check if notification should be sent based on time remaining
   * @param {string|Date} arrivalDate - Arrival date
   * @returns {Object} - Notification recommendation
   */
  static getNotificationRecommendation(arrivalDate) {
    const window = this.getSubmissionWindow(arrivalDate);
    
    if (!window.canSubmit) {
      return { shouldNotify: false, type: null, urgency: 'low' };
    }

    const hoursRemaining = window.hoursUntilArrival;

    if (hoursRemaining <= 6) {
      return { 
        shouldNotify: true, 
        type: 'urgent_deadline', 
        urgency: 'high',
        message: 'Urgent: Submit entry card within 6 hours'
      };
    } else if (hoursRemaining <= 24) {
      return { 
        shouldNotify: true, 
        type: 'deadline_24h', 
        urgency: 'medium',
        message: 'Reminder: Submit entry card within 24 hours'
      };
    } else if (hoursRemaining <= 48) {
      return { 
        shouldNotify: true, 
        type: 'deadline_48h', 
        urgency: 'low',
        message: 'Reminder: Submit entry card within 48 hours'
      };
    }

    return { shouldNotify: false, type: null, urgency: 'low' };
  }

  /**
   * Get window state for UI styling
   * @param {Object} window - Window object from getSubmissionWindow()
   * @returns {Object} - UI state information
   */
  static getUIState(window) {
    const stateMap = {
      'no-date': {
        color: 'gray',
        icon: '📅',
        buttonState: 'disabled',
        showCountdown: false,
        priority: 'low'
      },
      'pre-window': {
        color: 'blue',
        icon: '⏰',
        buttonState: 'disabled',
        showCountdown: true,
        priority: 'low'
      },
      'within-window': {
        color: 'green',
        icon: '✅',
        buttonState: 'enabled',
        showCountdown: true,
        priority: 'medium'
      },
      'urgent': {
        color: 'red',
        icon: '🚨',
        buttonState: 'enabled',
        showCountdown: true,
        priority: 'high'
      },
      'past-deadline': {
        color: 'red',
        icon: '❌',
        buttonState: 'disabled',
        showCountdown: false,
        priority: 'high'
      }
    };

    return stateMap[window.state] || stateMap['no-date'];
  }
}

export default ArrivalWindowCalculator;
