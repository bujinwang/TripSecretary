/**
 * Arrival Window Calculator Utility for Singapore SGAC
 * Handles 72-hour window calculations and messaging for Singapore SGAC submissions
 * Provides timezone handling and countdown functionality
 *
 * IMPORTANT: Singapore requires submission within 3 days (72 hours) BEFORE arrival
 */

class ArrivalWindowCalculator {
  /**
   * Calculate the 72-hour submission window for Singapore arrival
   * @param {string|Date} arrivalDate - Arrival date (YYYY-MM-DD or Date object)
   * @returns {Object} - Arrival window information
   */
  static calculateWindow(arrivalDate: string | Date) {
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
   * Get submission window status and message
   * @param {string|Date} arrivalDate - Arrival date
   * @param {string} locale - Locale code ('zh', 'en', etc.)
   * @returns {Object} - Submission window information
   */
  static getSubmissionWindow(arrivalDate: string | Date, locale: string = 'zh') {
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
    const arrival = new Date(arrivalDate);
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
  static getProgressiveTranslation(key: string, locale: string, params: Record<string, number> = {}) {
    const translations = {
      zh: {
        no_date: '未设置新加坡入境日期，无法提交入境卡',
        pre_window: `还有 ${params.days || 0} 天 ${params.hours || 0} 小时可以提交入境卡`,
        within_window: `距离截止还有 ${params.hours || 0} 小时 ${params.minutes || 0} 分钟，请尽快提交`,
        urgent: `紧急：距离截止还有 ${params.hours || 0} 小时 ${params.minutes || 0} 分钟`,
        past_deadline: '提交截止时间已过，请联系相关部门'
      },
      en: {
        no_date: 'No Singapore arrival date set, cannot submit arrival card',
        pre_window: `Can submit in ${params.days || 0} days ${params.hours || 0} hours`,
        within_window: `${params.hours || 0}h ${params.minutes || 0}m until deadline, please submit soon`,
        urgent: `URGENT: ${params.hours || 0}h ${params.minutes || 0}m until deadline`,
        past_deadline: 'Submission deadline has passed, please contact authorities'
      },
      es: {
        no_date: 'No se ha establecido la fecha de llegada a Singapur, no se puede enviar la tarjeta de entrada',
        pre_window: `Se puede enviar en ${params.days || 0} días ${params.hours || 0} horas`,
        within_window: `${params.hours || 0}h ${params.minutes || 0}m hasta la fecha límite, envíe pronto`,
        urgent: `URGENTE: ${params.hours || 0}h ${params.minutes || 0}m hasta la fecha límite`,
        past_deadline: 'La fecha límite de envío ha pasado, contacte a las autoridades'
      },
      fr: {
        no_date: 'Aucune date d\'arrivée à Singapour définie, impossible de soumettre la carte d\'entrée',
        pre_window: `Peut soumettre dans ${params.days || 0} jours ${params.hours || 0} heures`,
        within_window: `${params.hours || 0}h ${params.minutes || 0}m jusqu\'à la date limite, veuillez soumettre bientôt`,
        urgent: `URGENT: ${params.hours || 0}h ${params.minutes || 0}m jusqu\'à la date limite`,
        past_deadline: 'La date limite de soumission est passée, veuillez contacter les autorités'
      },
      de: {
        no_date: 'Kein Singapur-Ankunftsdatum festgelegt, Einreisekarte kann nicht eingereicht werden',
        pre_window: `Kann in ${params.days || 0} Tagen ${params.hours || 0} Stunden eingereicht werden`,
        within_window: `${params.hours || 0}h ${params.minutes || 0}m bis zur Frist, bitte bald einreichen`,
        urgent: `DRINGEND: ${params.hours || 0}h ${params.minutes || 0}m bis zur Frist`,
        past_deadline: 'Einreichungsfrist ist abgelaufen, bitte kontaktieren Sie die Behörden'
      }
    };

    const localeTranslations = translations[locale] || translations.en;
    return localeTranslations[key] || key;
  }

  /**
   * Check if submission can be made now
   * @param {string|Date} arrivalDate - Arrival date
   * @returns {boolean} - Can submit now
   */
  static canSubmitNow(arrivalDate: string | Date) {
    const window = this.calculateWindow(arrivalDate);
    return window.canSubmit;
  }

  /**
   * Validate arrival date
   * @param {string|Date} arrivalDate - Arrival date
   * @returns {Object} - Validation result
   */
  static validateArrivalDate(arrivalDate: string | Date) {
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
   * Get window state for UI styling
   * @param {Object} window - Window object from getSubmissionWindow()
   * @returns {Object} - UI state information
   */
  static getUIState(window: Record<string, unknown>) {
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

  /**
   * Format time remaining for display
   * @param {number} milliseconds - Time remaining in milliseconds
   * @param {string} locale - Locale code
   * @returns {Object} - Formatted countdown
   */
  static formatTimeRemaining(milliseconds: number, locale: string = 'zh') {
    if (!milliseconds || milliseconds <= 0) {
      return {
        display: locale === 'zh' ? '已过期' : 'Expired',
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
      // More than 1 day
      display = locale === 'zh'
        ? `${days} 天 ${hours} 小时`
        : `${days}d ${hours}h`;
      color = 'green';
      isUrgent = false;
    } else if (hours > 0) {
      // Hours remaining
      display = locale === 'zh'
        ? `${hours} 小时 ${minutes} 分钟`
        : `${hours}h ${minutes}m`;
      color = hours <= 6 ? 'red' : 'yellow';
      isUrgent = hours <= 6;
    } else {
      // Minutes only
      display = locale === 'zh'
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
}

export default ArrivalWindowCalculator;
