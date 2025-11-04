// Location data loader utility for Thailand and other countries
import { thailandProvinces } from '../data/thailandProvinces';
import { thailandDistricts, thailandSubDistricts, getSubDistrictsByDistrictId } from '../data/thailandLocations';

// Helper functions for Thailand data transformation
const createThailandLocationLoaders = () => {
  // Transform districts object to array format expected by the component
  const getDistricts = (provinceCode) => {
    if (thailandDistricts[provinceCode]) {
      return thailandDistricts[provinceCode].map(district => ({
        ...district,
        provinceId: provinceCode
      }));
    }
    return [];
  };

  // Transform sub-districts to array format
  const getSubDistricts = (districtId) => {
    return getSubDistrictsByDistrictId(districtId);
  };

  return {
    provinces: thailandProvinces,
    getDistricts,
    getSubDistricts
  };
};

/**
 * Get location data loaders for a specific country
 * @param {string} countryCode - Country code (e.g., 'th' for Thailand)
 * @returns {Object} Object containing location data and loader functions
 */
export const getLocationLoaders = (countryCode) => {
  switch (countryCode) {
    case 'th':
    case 'thailand':
      return createThailandLocationLoaders();
    
    case 'malaysia':
    case 'my':
      // Add Malaysia location data when available
      return {
        provinces: [],
        getDistricts: () => [],
        getSubDistricts: () => []
      };
    
    default:
      return {
        provinces: [],
        getDistricts: () => [],
        getSubDistricts: () => []
      };
  }
};

export default getLocationLoaders;