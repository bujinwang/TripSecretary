/**
 * Name Parsing and Formatting Utilities
 *
 * Centralized utilities for parsing, formatting, and validating names
 * across different formats and conventions.
 *
 * Supports:
 * - Comma-separated format: "ZHANG, WEI MING"
 * - Space-separated format: "LI A MAO" (3 parts: Family Middle First)
 * - Two-part format: "WANG BAOBAO" (Family First)
 * - Multi-part format: "SMITH JOHN MICHAEL DAVID" (Family Middle First...)
 * - Single name: "MADONNA"
 *
 * @module nameUtils
 */

/**
 * @typedef {Object} ParsedName
 * @property {string} familyName - Family name (surname, last name)
 * @property {string} firstName - First name (given name)
 * @property {string} middleName - Middle name (optional)
 */

/**
 * Parse full name into components
 *
 * Handles multiple name formats commonly found in passports:
 * - Western format with comma: "ZHANG, WEI MING" → Family: ZHANG, Middle: WEI, First: MING
 * - Chinese format (3 parts): "LI A MAO" → Family: LI, Middle: A, First: MAO
 * - Simple format: "WANG BAOBAO" → Family: WANG, First: BAOBAO
 * - Complex format: "SMITH JOHN MICHAEL" → Family: SMITH, Middle: JOHN, First: MICHAEL
 * - Single name: "MADONNA" → First: MADONNA
 *
 * @param {string} fullName - Full name string to parse
 * @param {Object} [options] - Parsing options
 * @param {boolean} [options.removeCommas=true] - Remove trailing commas
 * @param {boolean} [options.normalize=true] - Normalize whitespace
 * @param {boolean} [options.uppercase=false] - Convert to uppercase
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @returns {ParsedName} Parsed name components
 *
 * @example
 * // Comma-separated format
 * parseFullName("ZHANG, WEI MING")
 * // → { familyName: 'ZHANG', middleName: 'WEI', firstName: 'MING' }
 *
 * @example
 * // Three-part space-separated
 * parseFullName("LI A MAO")
 * // → { familyName: 'LI', middleName: 'A', firstName: 'MAO' }
 *
 * @example
 * // Two-part format
 * parseFullName("WANG BAOBAO")
 * // → { familyName: 'WANG', middleName: '', firstName: 'BAOBAO' }
 */
export const parseFullName = (fullName, options = {}) => {
  const {
    removeCommas = true,
    normalize = true,
    uppercase = false,
    debug = false
  } = options;

  // Handle empty or null names
  if (!fullName || typeof fullName !== 'string') {
    return { familyName: '', firstName: '', middleName: '' };
  }

  if (debug) {
    console.log('🔍 Parsing full name:', fullName);
  }

  // Clean the full name - remove extra spaces and normalize
  let cleanedName = fullName.trim();
  if (normalize) {
    cleanedName = cleanedName.replace(/\s+/g, ' ');
  }
  if (uppercase) {
    cleanedName = cleanedName.toUpperCase();
  }

  // Helper function to clean individual name parts
  const cleanPart = (part) => {
    let cleaned = part.trim();
    if (removeCommas) {
      cleaned = cleaned.replace(/,+$/, '');
    }
    return cleaned.trim();
  };

  // Try comma-separated format first (e.g., "ZHANG, WEI MING" or "WANG, BAOBAO")
  if (cleanedName.includes(',')) {
    const parts = cleanedName.split(',').map(part => part.trim());
    if (parts.length === 2) {
      const givenNames = parts[1].split(' ').filter(name => name.length > 0);
      const result = {
        familyName: cleanPart(parts[0]),
        // If only one given name, it's the first name with no middle name
        // If two or more given names, first is middle, rest is first name
        middleName: givenNames.length >= 2 ? cleanPart(givenNames[0]) : '',
        firstName: givenNames.length >= 2
          ? givenNames.slice(1).map(cleanPart).join(' ')
          : cleanPart(givenNames[0] || '')
      };
      if (debug) {
        console.log('✅ Comma format parsed:', result);
      }
      return result;
    }
  }

  // Try space-separated format (e.g., "LI A MAO")
  const spaceParts = cleanedName.split(/\s+/).filter(part => part.length > 0);

  if (spaceParts.length === 3) {
    // Three parts: Family Middle First
    const result = {
      familyName: cleanPart(spaceParts[0]),
      middleName: cleanPart(spaceParts[1]),
      firstName: cleanPart(spaceParts[2])
    };
    if (debug) {
      console.log('✅ Three-part name parsed:', result);
    }
    return result;
  } else if (spaceParts.length === 2) {
    // Two parts: Family First (no middle name)
    const result = {
      familyName: cleanPart(spaceParts[0]),
      middleName: '',
      firstName: cleanPart(spaceParts[1])
    };
    if (debug) {
      console.log('✅ Two-part name parsed:', result);
    }
    return result;
  } else if (spaceParts.length > 3) {
    // More than three parts: First is family, second is middle, rest is first
    const result = {
      familyName: cleanPart(spaceParts[0]),
      middleName: cleanPart(spaceParts[1]),
      firstName: spaceParts.slice(2).map(cleanPart).join(' ')
    };
    if (debug) {
      console.log('✅ Multi-part name parsed:', result);
    }
    return result;
  }

  // Single name - treat as first name
  const result = {
    familyName: '',
    middleName: '',
    firstName: cleanPart(cleanedName)
  };
  if (debug) {
    console.log('✅ Single name parsed:', result);
  }
  return result;
};

/**
 * Format parsed name components for display
 *
 * @param {string} familyName - Family name
 * @param {string} firstName - First name
 * @param {string} [middleName=''] - Middle name (optional)
 * @param {Object} [options] - Formatting options
 * @param {string} [options.format='western'] - Format style: 'western', 'eastern', 'full'
 * @param {boolean} [options.includeMiddle=true] - Include middle name
 * @param {string} [options.separator=' '] - Separator between name parts
 * @returns {string} Formatted full name
 *
 * @example
 * formatForDisplay('ZHANG', 'MING', 'WEI', { format: 'western' })
 * // → "ZHANG WEI MING"
 *
 * @example
 * formatForDisplay('ZHANG', 'MING', 'WEI', { format: 'eastern' })
 * // → "ZHANG WEI MING"
 */
export const formatForDisplay = (familyName, firstName, middleName = '', options = {}) => {
  const {
    format = 'western',
    includeMiddle = true,
    separator = ' '
  } = options;

  const parts = [];

  if (format === 'western') {
    // Western: Family Middle First
    if (familyName) parts.push(familyName);
    if (includeMiddle && middleName) parts.push(middleName);
    if (firstName) parts.push(firstName);
  } else if (format === 'eastern') {
    // Eastern: Family Middle First (same as western for now)
    if (familyName) parts.push(familyName);
    if (includeMiddle && middleName) parts.push(middleName);
    if (firstName) parts.push(firstName);
  } else if (format === 'full') {
    // Full: Include all parts in order
    if (familyName) parts.push(familyName);
    if (middleName) parts.push(middleName);
    if (firstName) parts.push(firstName);
  } else if (format === 'comma') {
    // Comma format: "Family, First Middle"
    if (familyName) {
      const givenNames = [];
      if (firstName) givenNames.push(firstName);
      if (middleName) givenNames.unshift(middleName);
      return `${familyName}, ${givenNames.join(' ')}`;
    }
  }

  return parts.filter(Boolean).join(separator);
};

/**
 * Format parsed name for API submission (combines middle and first names)
 *
 * @param {ParsedName} parsedName - Parsed name object
 * @returns {Object} API-formatted name
 *
 * @example
 * formatForAPI({ familyName: 'ZHANG', middleName: 'WEI', firstName: 'MING' })
 * // → { familyName: 'ZHANG', firstName: 'WEI MING' }
 */
export const formatForAPI = (parsedName) => {
  const { familyName, firstName, middleName } = parsedName;

  return {
    familyName: familyName || '',
    firstName: middleName
      ? `${middleName} ${firstName}`.trim()
      : firstName || ''
  };
};

/**
 * Validate name format
 *
 * @param {string} fullName - Full name to validate
 * @param {Object} [rules] - Validation rules
 * @param {number} [rules.minLength=2] - Minimum name length
 * @param {number} [rules.maxLength=100] - Maximum name length
 * @param {boolean} [rules.allowNumbers=false] - Allow numbers in name
 * @param {boolean} [rules.allowSpecialChars=true] - Allow special characters (,.-')
 * @param {boolean} [rules.requireFamilyName=false] - Require family name
 * @param {RegExp} [rules.customPattern] - Custom validation pattern
 * @returns {Object} Validation result
 *
 * @example
 * validateNameFormat("ZHANG, WEI MING")
 * // → { isValid: true, errors: [] }
 *
 * @example
 * validateNameFormat("123", { minLength: 2 })
 * // → { isValid: false, errors: ['Name contains numbers'] }
 */
export const validateNameFormat = (fullName, rules = {}) => {
  const {
    minLength = 2,
    maxLength = 100,
    allowNumbers = false,
    allowSpecialChars = true,
    requireFamilyName = false,
    customPattern = null
  } = rules;

  const errors = [];

  // Check if name exists
  if (!fullName || typeof fullName !== 'string') {
    errors.push('Name is required');
    return { isValid: false, errors };
  }

  const trimmedName = fullName.trim();

  // Check length
  if (trimmedName.length < minLength) {
    errors.push(`Name must be at least ${minLength} characters`);
  }
  if (trimmedName.length > maxLength) {
    errors.push(`Name must be no more than ${maxLength} characters`);
  }

  // Check for numbers
  if (!allowNumbers && /\d/.test(trimmedName)) {
    errors.push('Name contains numbers');
  }

  // Check special characters
  if (!allowSpecialChars) {
    if (/[^A-Za-z\s]/.test(trimmedName)) {
      errors.push('Name contains special characters');
    }
  } else {
    // Allow only specific special characters: comma, period, hyphen, apostrophe
    if (/[^A-Za-z\s,.\-']/.test(trimmedName)) {
      errors.push('Name contains invalid special characters');
    }
  }

  // Check for Chinese characters (not allowed in most passport systems)
  if (/[\u4e00-\u9fff]/.test(trimmedName)) {
    errors.push('Name contains Chinese characters (use romanized version)');
  }

  // Check custom pattern
  if (customPattern && !customPattern.test(trimmedName)) {
    errors.push('Name does not match required format');
  }

  // Check if family name is present (if required)
  if (requireFamilyName) {
    const parsed = parseFullName(trimmedName);
    if (!parsed.familyName) {
      errors.push('Family name is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Extract initials from a name
 *
 * @param {string} fullName - Full name
 * @param {Object} [options] - Options
 * @param {boolean} [options.includeMiddle=true] - Include middle initial
 * @returns {string} Initials
 *
 * @example
 * getInitials("ZHANG WEI MING")
 * // → "ZWM"
 */
export const getInitials = (fullName, options = {}) => {
  const { includeMiddle = true } = options;

  const parsed = parseFullName(fullName);
  const initials = [];

  if (parsed.familyName) {
    initials.push(parsed.familyName.charAt(0).toUpperCase());
  }
  if (includeMiddle && parsed.middleName) {
    initials.push(parsed.middleName.charAt(0).toUpperCase());
  }
  if (parsed.firstName) {
    initials.push(parsed.firstName.charAt(0).toUpperCase());
  }

  return initials.join('');
};

/**
 * Default export containing all name utilities
 */
export default {
  parseFullName,
  formatForDisplay,
  formatForAPI,
  validateNameFormat,
  getInitials
};
