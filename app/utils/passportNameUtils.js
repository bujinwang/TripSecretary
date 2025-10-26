// 入境通 - Passport Name Utilities
// Provides helpers for parsing and formatting passport full names consistently.

/**
 * Parse a passport full name into surname, middle name, and given name parts.
 * Supports both comma-separated (e.g. "WANG, ANNA, LI") and space-separated formats.
 * @param {string} fullName
 * @returns {{ surname: string, middleName: string, givenName: string }}
 */
export const parsePassportFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return { surname: '', middleName: '', givenName: '' };
  }

  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return { surname: '', middleName: '', givenName: '' };
  }

  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
    const surname = parts[0] || '';
    if (parts.length === 1) {
      return { surname, middleName: '', givenName: '' };
    }

    if (parts.length === 2) {
      return {
        surname,
        middleName: '',
        givenName: parts[1],
      };
    }

    const middleSegments = parts.slice(1, -1).join(' ');
    return {
      surname,
      middleName: middleSegments,
      givenName: parts[parts.length - 1],
    };
  }

  const spaceParts = trimmed.split(' ').filter(Boolean);
  const surname = spaceParts[0] || '';

  if (spaceParts.length === 1) {
    return { surname, middleName: '', givenName: '' };
  }

  if (spaceParts.length === 2) {
    return {
      surname,
      middleName: '',
      givenName: spaceParts[1],
    };
  }

  return {
    surname,
    middleName: spaceParts.slice(1, -1).join(' '),
    givenName: spaceParts[spaceParts.length - 1],
  };
};

/**
 * Format individual passport name parts into a single full name string.
 * Produces comma-separated format expected by downstream services.
 * @param {{ surname?: string, middleName?: string, givenName?: string }} parts
 * @returns {string}
 */
export const formatPassportFullName = ({ surname = '', middleName = '', givenName = '' }) => {
  const cleanSurname = surname.trim();
  const cleanMiddle = middleName.trim();
  const cleanGiven = givenName.trim();

  const otherParts = [cleanMiddle, cleanGiven].filter(Boolean);

  if (!cleanSurname && otherParts.length === 0) {
    return '';
  }

  if (!cleanSurname) {
    return otherParts.join(' ');
  }

  if (otherParts.length === 0) {
    return cleanSurname;
  }

  return `${cleanSurname}, ${otherParts.join(', ')}`;
};

/**
 * Normalize passport name parts by uppercasing and stripping extra spaces.
 * @param {{ surname?: string, middleName?: string, givenName?: string }} parts
 * @returns {{ surname: string, middleName: string, givenName: string }}
 */
export const normalizePassportNameParts = ({ surname = '', middleName = '', givenName = '' }) => ({
  surname: surname.trim().toUpperCase(),
  middleName: middleName.trim().toUpperCase(),
  givenName: givenName.trim().toUpperCase(),
});
