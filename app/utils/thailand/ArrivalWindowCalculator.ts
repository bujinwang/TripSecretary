/**
 * Arrival Window Calculator Utility
 * Handles 72-hour window calculations and messaging for Thailand TDAC submissions
 * Provides timezone handling and countdown functionality
 */

interface ArrivalWindow {
  isWithin72Hours: boolean;
  hoursRemaining: number | null;
  canSubmit: boolean;
  arrivalDate: Date | null;
  submissionWindowStart: Date | null;
  daysRemaining: number | null;
  hoursUntilWindow: number;
  hoursUntilArrival: number;
}

type TranslationParams = Record<string, string | number>;

class ArrivalWindowCalculator {
  static calculateWindow(arrivalDate: string | Date | null): ArrivalWindow {
    if (!arrivalDate) {
      return {
        isWithin72Hours: false,
        hoursRemaining: null,
        canSubmit: false,
        arrivalDate: null,
        submissionWindowStart: null,
        daysRemaining: null,
        hoursUntilWindow: 0,
        hoursUntilArrival: 0,
      };
    }

    let arrival: Date;
    if (typeof arrivalDate === 'string') {
      const [year, month, day] = arrivalDate.split('-').map(Number);
      arrival = new Date(year, month - 1, day);
    } else {
      arrival = arrivalDate;
    }
    const now = new Date();

    const submissionWindowStart = new Date(arrival.getTime() - 72 * 60 * 60 * 1000);

    const msUntilArrival = arrival.getTime() - now.getTime();
    const hoursUntilArrival = msUntilArrival / (1000 * 60 * 60);

    const msUntilWindow = submissionWindowStart.getTime() - now.getTime();
    const hoursUntilWindow = msUntilWindow / (1000 * 60 * 60);

    const isWithin72Hours = hoursUntilArrival <= 72 && hoursUntilArrival > 0;
    const canSubmit = isWithin72Hours;

    let daysRemaining: number | null = null;

    if (hoursUntilWindow > 0) {
      daysRemaining = Math.floor(hoursUntilWindow / 24);
    }

    return {
      isWithin72Hours,
      hoursRemaining: isWithin72Hours ? Math.ceil(hoursUntilArrival) : null,
      canSubmit,
      arrivalDate: arrival,
      submissionWindowStart,
      daysRemaining,
      hoursUntilWindow: hoursUntilWindow > 0 ? Math.ceil(hoursUntilWindow) : 0,
      hoursUntilArrival: Math.ceil(hoursUntilArrival),
    };
  }

  static getStatusMessage(window: ArrivalWindow, locale = 'zh-CN'): string {
    if (!window.arrivalDate) {
      return this.getTranslation('no_arrival_date', locale);
    }

    if (window.hoursUntilArrival <= 0) {
      return this.getTranslation('arrival_passed', locale);
    }

    if (window.canSubmit) {
      if (window.hoursRemaining !== null && window.hoursRemaining <= 24) {
        return this.getTranslation('countdown_hours', locale, { hours: window.hoursRemaining });
      }
      return this.getTranslation('can_submit', locale);
    }

    if (window.daysRemaining !== null && window.daysRemaining > 0) {
      return this.getTranslation('days_until_window', locale, {
        days: window.daysRemaining,
        hours: window.hoursUntilWindow % 24,
      });
    }
    return this.getTranslation('hours_until_window', locale, { hours: window.hoursUntilWindow });
  }

  static getAvailabilityMessage(window: ArrivalWindow, locale = 'zh-CN'): string {
    if (!window.submissionWindowStart) {
      return '';
    }

    if (window.canSubmit) {
      return this.getTranslation('available_now', locale);
    }

    const date = window.submissionWindowStart.toLocaleDateString(locale);
    const time = window.submissionWindowStart.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });

    return this.getTranslation('available_at', locale, { date, time });
  }

  static canSubmitNow(arrivalDate: string | Date | null): boolean {
    const window = this.calculateWindow(arrivalDate);
    return window.canSubmit;
  }

  static getCountdownDisplay(window: ArrivalWindow, locale = 'zh-CN'): string {
    if (!window.canSubmit || window.hoursRemaining === null || window.hoursRemaining > 24) {
      return '';
    }

    const hours = Math.floor(window.hoursRemaining);
    const minutes = Math.floor((window.hoursRemaining % 1) * 60);

    if (locale && locale.startsWith('zh')) {
      return `${hours}小时${minutes}分钟后抵达`;
    }
    return `${hours}h ${minutes}m until arrival`;
  }

  static getTimeUntilWindowDisplay(window: ArrivalWindow, locale = 'zh-CN'): string {
    if (window.canSubmit || !window.daysRemaining) {
      return '';
    }

    const days = window.daysRemaining;
    const hours = Math.ceil(window.hoursUntilWindow % 24);

    if (locale && locale.startsWith('zh')) {
      if (days > 0) {
        return `${days}天 ${hours}小时`;
      }
      return `${hours}小时`;
    }

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  }

  private static getTranslation(
    key: string,
    locale: string,
    params: TranslationParams = {},
  ): string {
    const translations: Record<string, Record<string, string>> = {
      no_arrival_date: {
        'zh-CN': '请输入抵达日期',
        en: 'Please enter arrival date',
      },
      arrival_passed: {
        'zh-CN': '抵达日期已过',
        en: 'Arrival date has passed',
      },
      countdown_hours: {
        'zh-CN': '距离抵达还有{{hours}}小时',
        en: '{{hours}} hours until arrival',
      },
      can_submit: {
        'zh-CN': '现在可以提交TDAC',
        en: 'You can submit TDAC now',
      },
      days_until_window: {
        'zh-CN': '{{days}}天{{hours}}小时后开放',
        en: '{{days}}d {{hours}}h until open',
      },
      hours_until_window: {
        'zh-CN': '{{hours}}小时后开放',
        en: '{{hours}}h until open',
      },
      available_now: {
        'zh-CN': '现在可用',
        en: 'Available now',
      },
      available_at: {
        'zh-CN': '{{date}} {{time}}可用',
        en: 'Available at {{date}} {{time}}',
      },
    };

    const localeGroup = locale && locale.startsWith('zh') ? 'zh-CN' : 'en';
    let message = translations[key]?.[localeGroup] || translations[key]?.en || key;

    Object.entries(params).forEach(([paramKey, paramValue]) => {
      message = message.replace(`{{${paramKey}}}`, String(paramValue));
    });

    return message;
  }

  static getUrgencyLevel(window: ArrivalWindow): 'urgent' | 'warning' | 'normal' | 'none' {
    if (!window.arrivalDate || window.hoursUntilArrival <= 0) {
      return 'none';
    }

    if (window.hoursRemaining !== null && window.hoursRemaining <= 6) {
      return 'urgent';
    }

    if (window.hoursRemaining !== null && window.hoursRemaining <= 24) {
      return 'warning';
    }

    return 'normal';
  }

  static formatArrivalDate(arrivalDate: string | Date | null, locale = 'zh-CN'): string {
    if (!arrivalDate) {
      return '';
    }

    let date: Date;
    if (typeof arrivalDate === 'string') {
      const [year, month, day] = arrivalDate.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = arrivalDate;
    }

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export default ArrivalWindowCalculator;
