/**
 * Field Value Helpers
 *
 * Utilities for checking if field values are valid and should be saved.
 * Handles different data types correctly (booleans, numbers, strings, objects).
 */

/**
 * Check if a value is valid and should be saved
 *
 * @param {any} value - The value to check
 * @returns {boolean} True if the value is valid and non-empty
 *
 * Rules:
 * - null/undefined: invalid (false)
 * - Boolean: always valid (true/false are both meaningful values)
 * - Number: always valid (0, 1, -1 are all meaningful)
 * - String: valid if non-empty after trimming
 * - Array: valid if has at least one element
 * - Object: valid if has at least one property
 */
export const hasValidValue = (value) => {
  // null or undefined are not valid values
  if (value === null || value === undefined) {
    return false;
  }

  // Booleans are always valid (both true and false are meaningful)
  if (typeof value === 'boolean') {
    return true;
  }

  // Numbers are always valid (including 0)
  if (typeof value === 'number') {
    return !isNaN(value);
  }

  // Strings must be non-empty after trimming
  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  // Arrays must have at least one element
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  // Objects must have at least one property
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  // Default: check truthiness
  return Boolean(value);
};

/**
 * Check if two values are effectively different
 *
 * @param {any} value1 - First value
 * @param {any} value2 - Second value
 * @returns {boolean} True if values are different
 *
 * Handles:
 * - Type coercion (e.g., '1' vs 1)
 * - Empty string vs null/undefined
 * - Arrays and objects (shallow comparison)
 */
export const hasValueChanged = (value1, value2) => {
  // Same reference or strict equality
  if (value1 === value2) {
    return false;
  }

  // Both are "empty" (null, undefined, or empty string)
  const isEmpty1 = value1 === null || value1 === undefined || value1 === '';
  const isEmpty2 = value2 === null || value2 === undefined || value2 === '';
  if (isEmpty1 && isEmpty2) {
    return false;
  }

  // Different types
  if (typeof value1 !== typeof value2) {
    return true;
  }

  // Arrays - shallow comparison
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return true;
    return value1.some((item, index) => item !== value2[index]);
  }

  // Objects - shallow comparison
  if (typeof value1 === 'object' && value1 !== null && value2 !== null) {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    if (keys1.length !== keys2.length) return true;
    return keys1.some(key => value1[key] !== value2[key]);
  }

  // Default: values are different
  return true;
};

/**
 * Normalize a field value for consistent comparison and storage
 *
 * @param {any} value - The value to normalize
 * @returns {any} Normalized value
 *
 * Rules:
 * - null/undefined → null
 * - Empty string → null
 * - Non-empty string → trimmed string
 * - Boolean/Number → unchanged
 * - Array/Object → unchanged
 */
export const normalizeFieldValue = (value) => {
  // null or undefined → null
  if (value === null || value === undefined) {
    return null;
  }

  // Empty string → null
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  // All other types unchanged
  return value;
};

export default {
  hasValidValue,
  hasValueChanged,
  normalizeFieldValue,
};
