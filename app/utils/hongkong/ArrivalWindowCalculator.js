/**
 * Arrival Window Calculator Utility for Hong Kong
 * Hong Kong doesn't have a specific submission window like Thailand's 72-hour rule
 * Arrival cards can be submitted anytime before arrival
 *
 * Simplified version for Hong Kong Entry Flow
 */

class ArrivalWindowCalculator {
  /**
   * Calculate submission window for Hong Kong arrival
   * Hong Kong doesn't have time restrictions, so always returns canSubmit: true
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

    // Calculate time until arrival
    const msUntilArrival = arrival.getTime() - now.getTime();
    const hoursUntilArrival = msUntilArrival / (1000 * 60 * 60);
    const daysUntilArrival = hoursUntilArrival / 24;

    // Hong Kong: No specific window, can submit anytime before arrival
    const canSubmit = hoursUntilArrival > 0;

    return {
      isWithin72Hours: true, // Always true for Hong Kong (no restriction)
      hoursRemaining: Math.max(0, hoursUntilArrival),
      canSubmit: canSubmit,
      arrivalDate: arrival,
      submissionWindowStart: null, // No window start for Hong Kong
      daysRemaining: Math.max(0, Math.ceil(daysUntilArrival)),
      hoursUntilWindow: 0, // Window is always open
      status: hoursUntilArrival <= 0 ? 'past' : 'open'
    };
  }

  /**
   * Get submission window details for display
   * @param {string|Date} arrivalDate - Arrival date
   * @returns {Object} - Window details with user-friendly messages
   */
  static getSubmissionWindow(arrivalDate) {
    const window = this.calculateWindow(arrivalDate);

    return {
      ...window,
      message: window.canSubmit
        ? '可以提交入境卡 / Ready to submit'
        : '抵达日期已过 / Arrival date has passed',
      windowStatus: window.canSubmit ? 'open' : 'closed'
    };
  }

  /**
   * Check if arrival date is in the past
   * @param {string|Date} arrivalDate - Arrival date
   * @returns {boolean} - True if date is in the past
   */
  static isArrivalPast(arrivalDate) {
    if (!arrivalDate) return false;
    const arrival = new Date(arrivalDate);
    const now = new Date();
    return arrival.getTime() < now.getTime();
  }

  /**
   * Get days until arrival
   * @param {string|Date} arrivalDate - Arrival date
   * @returns {number} - Days until arrival (0 if past)
   */
  static getDaysUntilArrival(arrivalDate) {
    const window = this.calculateWindow(arrivalDate);
    return window.daysRemaining || 0;
  }
}

export default ArrivalWindowCalculator;
