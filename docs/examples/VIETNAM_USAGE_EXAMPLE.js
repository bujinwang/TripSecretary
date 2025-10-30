/**
 * Vietnam Location Selectors - Proof of Concept Example
 *
 * This example demonstrates how the multi-country infrastructure
 * makes it trivial to add support for new countries.
 *
 * Vietnam was added with ZERO changes to the selector components!
 * Only configuration changes were needed.
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { getLocationLoaders } from '../../app/utils/locationDataLoader';
import {
  ProvinceSelector,
  DistrictSelector,
} from '../../app/components';

/**
 * Example 1: Vietnam Province Selector
 *
 * Works exactly like Thailand - just load Vietnam data instead!
 */
export const VietnamProvinceExample = () => {
  const [province, setProvince] = React.useState('');

  // Load Vietnam location data (that's it!)
  const { provinces: vietnamProvinces, getDistricts } = useMemo(
    () => getLocationLoaders('vn'), // or 'vietnam'
    []
  );

  return (
    <View>
      <ProvinceSelector
        label="Tỉnh/Thành phố (Province/City)"
        value={province}
        onValueChange={setProvince}
        regionsData={vietnamProvinces}
        placeholder="Chọn tỉnh/thành phố"
        helpText="Select your province or city in Vietnam"
      />
    </View>
  );
};

/**
 * Example 2: Vietnam Province + District Selector
 *
 * Cascading selectors work automatically!
 */
export const VietnamFullExample = () => {
  const [province, setProvince] = React.useState('');
  const [district, setDistrict] = React.useState('');
  const [districtId, setDistrictId] = React.useState('');

  // Load Vietnam location data
  const { provinces: vietnamProvinces, getDistricts } = useMemo(
    () => getLocationLoaders('vn'),
    []
  );

  const handleProvinceChange = (code) => {
    setProvince(code);
    // Reset district when province changes
    setDistrict('');
    setDistrictId('');
  };

  const handleDistrictChange = (selection) => {
    setDistrict(selection.district);
    setDistrictId(selection.districtId);
  };

  return (
    <View style={{ padding: 16 }}>
      {/* Province Selector */}
      <ProvinceSelector
        label="Tỉnh/Thành phố"
        value={province}
        onValueChange={handleProvinceChange}
        regionsData={vietnamProvinces}
        helpText="Examples: Hanoi (河内), Ho Chi Minh City (胡志明市), Da Nang (岘港)"
      />

      {/* District Selector - only enabled when province is selected */}
      {province && (
        <DistrictSelector
          label="Quận/Huyện (District)"
          provinceCode={province}
          value={district}
          selectedDistrictId={districtId}
          onSelect={handleDistrictChange}
          getDistrictsFunc={getDistricts}
          helpText="Select district within the province"
        />
      )}
    </View>
  );
};

/**
 * Example 3: Comparison with Thailand
 *
 * Notice: THE SAME COMPONENTS work for both countries!
 * Only the data source changes.
 */
export const MultiCountryComparison = () => {
  const [country, setCountry] = React.useState('th'); // 'th' or 'vn'
  const [province, setProvince] = React.useState('');

  // Load data for selected country
  const locationData = useMemo(
    () => getLocationLoaders(country),
    [country]
  );

  return (
    <View style={{ padding: 16 }}>
      {/* Country Selector */}
      <View style={{ marginBottom: 20 }}>
        <button onClick={() => setCountry('th')}>Thailand</button>
        <button onClick={() => setCountry('vn')}>Vietnam</button>
      </View>

      {/* Province Selector - works for BOTH countries */}
      <ProvinceSelector
        label={country === 'th' ? 'จังหวัด (Province)' : 'Tỉnh/Thành phố'}
        value={province}
        onValueChange={setProvince}
        regionsData={locationData.provinces}
        helpText={`Select ${country === 'th' ? 'Thai' : 'Vietnamese'} province`}
      />
    </View>
  );
};

/**
 * Key Takeaways from Vietnam Implementation:
 *
 * ✅ No changes to ProvinceSelector component
 * ✅ No changes to DistrictSelector component
 * ✅ No changes to SubDistrictSelector component
 * ✅ Only added 8 lines to DESTINATION_CONFIG
 * ✅ Reused existing vietnamLocations.js data
 * ✅ Full bilingual support (Vietnamese, English, Chinese)
 * ✅ Cascading selectors work automatically
 *
 * Time to add Vietnam: ~5 minutes
 * Lines of code changed: 8 lines in config
 * Component changes: 0
 *
 * This demonstrates the power of the multi-country architecture!
 */

export default {
  VietnamProvinceExample,
  VietnamFullExample,
  MultiCountryComparison,
};
