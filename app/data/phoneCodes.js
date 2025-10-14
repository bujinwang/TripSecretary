// Phone country codes mapped to ISO-3166 codes
export const PHONE_CODES = {
  'CHN': '+86', // China
  'JPN': '+81', // Japan
  'THA': '+66', // Thailand
  'HKG': '+852', // Hong Kong
  'TWN': '+886', // Taiwan
  'KOR': '+82', // South Korea
  'SGP': '+65', // Singapore
  'MYS': '+60', // Malaysia
  'USA': '+1', // United States
  'CAN': '+1', // Canada
  'AUS': '+61', // Australia
  'GBR': '+44', // United Kingdom
  'FRA': '+33', // France
  'DEU': '+49', // Germany
  'ITA': '+39', // Italy
  'ESP': '+34', // Spain
  'NLD': '+31', // Netherlands
  'BEL': '+32', // Belgium
  'CHE': '+41', // Switzerland
  'AUT': '+43', // Austria
  'SWE': '+46', // Sweden
  'NOR': '+47', // Norway
  'DNK': '+45', // Denmark
  'FIN': '+358', // Finland
  'IRL': '+353', // Ireland
  'PRT': '+351', // Portugal
  'GRC': '+30', // Greece
  'POL': '+48', // Poland
  'CZE': '+420', // Czech Republic
  'HUN': '+36', // Hungary
  'RUS': '+7', // Russia
  'VNM': '+84', // Vietnam
  'PHL': '+63', // Philippines
  'IDN': '+62', // Indonesia
  'IND': '+91', // India
  'MEX': '+52', // Mexico
  'BRA': '+55', // Brazil
  'ARG': '+54', // Argentina
  'COL': '+57', // Colombia
  'PER': '+51', // Peru
  'TUR': '+90', // Turkey
};

export const getPhoneCode = (countryCode) => {
  return PHONE_CODES[countryCode] || '';
};