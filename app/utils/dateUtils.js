/**
 * Date utility functions to handle timezone-safe date parsing and formatting.
 *
 * IMPORTANT: Date strings in YYYY-MM-DD format should always be interpreted as LOCAL dates,
 * not UTC. This prevents timezone conversion bugs where dates change when parsed.
 *
 * For example:
 * - BAD: new Date("2025-10-31") → Interprets as UTC midnight, displays as Oct 30 in UTC+7/+8
 * - GOOD: parseLocalDate("2025-10-31") → Interprets as Oct 31 at midnight local time
 */

/**
 * Parses a date string in YYYY-MM-DD format as a local date.
 * This prevents timezone conversion issues where dates change due to UTC interpretation.
 *
 * @param {string|Date|null|undefined} dateValue - Date string in YYYY-MM-DD format, Date object, or null/undefined
 * @returns {Date|null} Date object representing the local date, or null if invalid
 *
 * @example
 * parseLocalDate("2025-10-31") // Returns Oct 31, 2025 at 00:00:00 local time
 * parseLocalDate(new Date()) // Returns the same Date object
 * parseLocalDate(null) // Returns null
 */
export function parseLocalDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  // If already a Date object, return as-is
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it's a string, parse it as local date
  if (typeof dateValue === 'string') {
    // Handle YYYY-MM-DD format
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      // Create date in local timezone (month is 0-indexed)
      return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    }
  }

  // Fallback: try to create Date object (may have timezone issues)
  try {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  } catch (e) {
    return null;
  }
}

/**
 * Formats a Date object as YYYY-MM-DD string using LOCAL timezone.
 * This ensures the date string represents the same calendar date as displayed locally.
 *
 * @param {Date|string|null|undefined} dateValue - Date object, date string, or null/undefined
 * @returns {string|null} Date string in YYYY-MM-DD format, or null if invalid
 *
 * @example
 * formatLocalDate(new Date(2025, 9, 31)) // Returns "2025-10-31"
 * formatLocalDate("2025-10-31") // Returns "2025-10-31" (passes through if already valid)
 * formatLocalDate(null) // Returns null
 */
export function formatLocalDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  // If it's already a valid YYYY-MM-DD string, return as-is
  if (typeof dateValue === 'string') {
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return dateValue;
    }
  }

  // Convert to Date if needed
  let date = dateValue;
  if (!(date instanceof Date)) {
    date = parseLocalDate(dateValue);
    if (!date) {
      return null;
    }
  }

  // Format using local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Checks if a value is a valid date string in YYYY-MM-DD format.
 *
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a valid YYYY-MM-DD date string
 */
export function isValidDateString(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }

  // Verify it's a valid calendar date
  const date = parseLocalDate(value);
  return date !== null && !isNaN(date.getTime());
}

/**
 * Formats a date for display in Chinese format (年月日).
 *
 * @param {Date|string|null|undefined} dateValue - Date to format
 * @returns {string} Formatted date string or empty string if invalid
 *
 * @example
 * formatChineseDate("2025-10-31") // Returns "2025年10月31日"
 */
export function formatChineseDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = parseLocalDate(dateValue);
  if (!date) {
    return '';
  }

  try {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '年').replace(/年(\d+)年/, '年$1月') + '日';
  } catch (e) {
    // Fallback to manual formatting
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }
}
