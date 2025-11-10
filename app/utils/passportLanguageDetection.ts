// @ts-nocheck

/**
 * Detect preferred app language based on passport nationality
 */
export function getLanguageFromPassport(nationality) {
  const nationalityToLanguage = {
    'CHN': 'zh-CN',      // China → Simplified Chinese
    'HKG': 'zh-HK',      // Hong Kong → Traditional Chinese (HK)
    'TWN': 'zh-TW',      // Taiwan → Traditional Chinese (TW)
    'JPN': 'ja',         // Japan → Japanese
    'KOR': 'ko',         // Korea → Korean
    'USA': 'en',         // USA → English
    'CAN': 'en',         // Canada → English
    'GBR': 'en',         // UK → English
    'AUS': 'en',         // Australia → English
    'FRA': 'fr',         // France → French
    'DEU': 'de',         // Germany → German
    'ESP': 'es',         // Spain → Spanish
  };
  
  return nationalityToLanguage[nationality] || 'en';
}

/**
 * Get destination-appropriate language for forms
 */
export function getDestinationLanguage(destinationId, userNationality) {
  // For Hong Kong/Taiwan destinations, prefer Traditional Chinese
  if (destinationId === 'hk') {
return 'zh-HK';
}
  if (destinationId === 'tw') {
return 'zh-TW';
}
  if (destinationId === 'jp') {
return 'ja';
}
  if (destinationId === 'kr') {
return 'ko';
}
  
  // For other destinations, use user's nationality-based language
  return getLanguageFromPassport(userNationality);
}