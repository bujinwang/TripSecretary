// @ts-nocheck

/**
 * TDAC Language Detection Utility
 *
 * Detects preferred language for TDAC form based on traveler's nationality
 */

/**
 * Detect preferred language based on traveler's nationality
 * @param {Object} travelerInfo - Traveler information object
 * @param {Object} passport - Passport information object
 * @returns {string} - Preferred language code for TDAC
 */
export const getPreferredLanguage = (travelerInfo, passport) => {
  // Use decrypted nationality from travelerInfo first, fallback to passport nationality
  const nationality = travelerInfo?.nationalityDesc || passport?.nationalityDesc || 'CHN';
  const nationalityUpper = nationality.toUpperCase().trim();

  console.log('🌐 Detecting language for nationality:', nationality);

  // Map nationality codes (CHN, JPN, etc.) OR country names to TDAC language options
  // Chinese variants
  if (nationalityUpper === 'CHN' || nationalityUpper === 'CN' ||
      nationalityUpper.includes('CHINA') || nationalityUpper.includes('CHINESE') ||
      nationalityUpper.includes('中国')) {
    return '中文';
  }
  // Japanese variants
  else if (nationalityUpper === 'JPN' || nationalityUpper === 'JP' ||
           nationalityUpper.includes('JAPAN') || nationalityUpper.includes('JAPANESE') ||
           nationalityUpper.includes('日本')) {
    return '日本語';
  }
  // Korean variants
  else if (nationalityUpper === 'KOR' || nationalityUpper === 'KR' ||
           nationalityUpper.includes('KOREA') || nationalityUpper.includes('KOREAN') ||
           nationalityUpper.includes('韩国') || nationalityUpper.includes('한국')) {
    return '한국어';
  }
  // Russian variants
  else if (nationalityUpper === 'RUS' || nationalityUpper === 'RU' ||
           nationalityUpper.includes('RUSSIA') || nationalityUpper.includes('RUSSIAN') ||
           nationalityUpper.includes('俄罗斯')) {
    return 'Русский';
  }

  // Default to English for all other nationalities
  return 'English';
};

export default {
  getPreferredLanguage,
};
