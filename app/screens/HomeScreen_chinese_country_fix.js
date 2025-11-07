// HomeScreen Chinese Country Name Display Fix
// This file contains the key changes needed to display country names in Chinese

// 1. Add import for getCountryName if not already present
// import { getCountryName } from '../utils/countriesService';

// 2. Update the handleCountrySelect function to use getCountryName for Chinese localization

const handleCountrySelect = async (country) => {
  // Check if country is enabled
  if (!country.enabled) {
    Alert.alert(t('home.alerts.notAvailableTitle'), t('home.alerts.notAvailableBody'));
    return;
  }

  // Get country name with proper Chinese localization - KEY FIX
  const countryName = country.displayName || getCountryName(country.id, language) || t(`home.destinationNames.${country.id}`, {
    defaultValue: country.name || country.id,
  });
  
  const destinationForNav = {
    id: country.id,
    name: countryName,
    flag: country.flag,
  };

  // Convert passport data to legacy format for navigation
  const passportForNav = hasPassport
    ? {
        type: t('home.passport.type'),
        name: passportData.fullName || '',
        nameEn: passportData.fullName || '',
        passportNo: passportData.passportNumber || '',
        expiry: passportData.expiryDate || '',
      }
    : null;

  // Use centralized navigation helper
  navigateToCountry(
    navigation,
    country.id,
    'info', // Navigate to info screen first
    {
      passport: passportForNav,
      destination: destinationForNav,
    }
  );
};

// 3. Ensure the getDestinationName function also uses getCountryName

const getDestinationName = (destinationId) => {
  return getCountryName(destinationId, language) || t(`home.destinationNames.${destinationId}`, {
    defaultValue: destinationId
  });
};

// 4. Update country cards rendering to use localized country names

{/* Update CountryCard rendering in the countriesGrid section */}
{localizedHotCountries.map((country) => (
  <CountryCard
    key={country.id}
    flag={country.flag}
    name={country.displayName || getCountryName(country.id, language)} // Ensure Chinese names
    flightTime={country.flightTime}
    visaRequirement={country.visaRequirement}
    onPress={() => handleCountrySelect(country)}
    disabled={!country.enabled}
  />
))}

// 5. Make sure the getCountryName function is imported and used consistently throughout

export default {
  // Export the fixed functions
};