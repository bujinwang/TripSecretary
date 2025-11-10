// @ts-nocheck

/**
 * NameParser Utility
 *
 * Utility for parsing passport names into surname, middle name, and given name components.
 * Supports both comma-separated and space-separated name formats.
 */

/**
 * Parses a full name string into surname, middle name, and given name components.
 *
 * Supports two formats:
 * 1. Comma-separated: "Surname, Middle, Given" or "Surname, Given"
 * 2. Space-separated: "Surname Middle Given" or "Surname Given"
 *
 * @param {string} fullName - The full name to parse
 * @returns {{surname: string, middleName: string, givenName: string}} Parsed name components
 *
 * @example
 * parsePassportName("Smith, John, Robert")
 * // Returns: { surname: "Smith", middleName: "John", givenName: "Robert" }
 *
 * @example
 * parsePassportName("Smith, John")
 * // Returns: { surname: "Smith", middleName: "", givenName: "John" }
 *
 * @example
 * parsePassportName("John Robert Smith")
 * // Returns: { surname: "John", middleName: "Robert", givenName: "Smith" }
 */
export const parsePassportName = (fullName) => {
  const result = {
    surname: '',
    middleName: '',
    givenName: '',
  };

  if (!fullName || typeof fullName !== 'string') {
    return result;
  }

  const nameToParse = fullName.trim();

  if (!nameToParse) {
    return result;
  }

  // Handle comma-separated format (e.g., "Surname, Middle, Given")
  if (nameToParse.includes(',')) {
    const parts = nameToParse.split(',').map(part => part.trim());

    if (parts.length === 3) {
      result.surname = parts[0];
      result.middleName = parts[1];
      result.givenName = parts[2];
    } else if (parts.length === 2) {
      result.surname = parts[0];
      result.middleName = '';
      result.givenName = parts[1];
    } else if (parts.length === 1) {
      result.surname = parts[0];
      result.middleName = '';
      result.givenName = '';
    }
  } else {
    // Handle space-separated format (e.g., "Surname Middle Given")
    const spaceParts = nameToParse.split(/\s+/);

    if (spaceParts.length >= 3) {
      result.surname = spaceParts[0];
      result.middleName = spaceParts[1];
      result.givenName = spaceParts.slice(2).join(' ');
    } else if (spaceParts.length === 2) {
      result.surname = spaceParts[0];
      result.middleName = '';
      result.givenName = spaceParts[1];
    } else if (spaceParts.length === 1) {
      result.surname = spaceParts[0];
      result.middleName = '';
      result.givenName = '';
    }
  }

  return result;
};

/**
 * Formats name components back into a full name string.
 *
 * @param {string} surname - The surname
 * @param {string} middleName - The middle name (optional)
 * @param {string} givenName - The given name
 * @param {boolean} useCommaFormat - If true, uses comma-separated format; otherwise space-separated
 * @returns {string} The formatted full name
 *
 * @example
 * formatFullName("Smith", "John", "Robert", true)
 * // Returns: "Smith, John, Robert"
 *
 * @example
 * formatFullName("Smith", "", "John", false)
 * // Returns: "Smith John"
 */
export const formatFullName = (surname, middleName, givenName, useCommaFormat = false) => {
  const parts = [surname, middleName, givenName].filter(part => part && part.trim());

  if (useCommaFormat) {
    return parts.join(', ');
  }

  return parts.join(' ');
};

export default {
  parsePassportName,
  formatFullName,
};
