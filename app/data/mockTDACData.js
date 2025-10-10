/**
 * Mock TDAC Data for Testing
 * Centralized test data to avoid scattered fallback values
 */

export const MOCK_TDAC_DATA = {
  // Personal Information In Passport
  familyName: 'WANG',
  firstName: 'XIAOMING',
  middleName: '',
  passportNo: 'E12345678',
  nationality: 'CHN',
  
  // Personal Information
  birthDate: '1990-05-15',
  occupation: 'ENGINEER',
  gender: 'MALE',
  countryResidence: 'CHN',
  cityResidence: 'BEIJING',
  phoneCode: '86',
  phoneNo: '13800138000',
  visaNo: '',
  
  // Contact
  email: 'test@example.com',
  
  // Trip Information
  // Note: TDAC can only be submitted within 72 hours (3 days) before arrival
  // Using a date within valid range (server date is 2025/10/11, so valid: 10/11-10/14)
  arrivalDate: '2025-10-13',
  departureDate: null,
  countryBoarded: 'CHN',
  purpose: 'HOLIDAY',
  travelMode: 'AIR',
  flightNo: 'CA981',
  tranModeId: '',
  
  // Accommodation
  accommodationType: 'HOTEL',
  province: 'BANGKOK',
  district: 'BANG_BON',
  subDistrict: 'BANG_BON_NUEA',
  postCode: '10150',
  address: 'Bangkok Hotel, 123 Sukhumvit Road, Bangkok',
};

/**
 * Merge user data with mock data (only fills missing fields)
 */
const hasValue = (value) => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
};

export function mergeTDACData(userData = {}) {
  const result = { ...userData };

  // Only use mock data for fields that are missing or empty in userData
  for (const key of Object.keys(MOCK_TDAC_DATA)) {
    if (hasValue(userData[key])) {
      result[key] = userData[key];
    } else {
      result[key] = MOCK_TDAC_DATA[key];
    }
  }

  if (!hasValue(result.cloudflareToken)) {
    result.cloudflareToken = 'auto';
  }

  return result;
}
