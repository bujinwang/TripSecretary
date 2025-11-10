// @ts-nocheck

/**
 * LocationHierarchySelector - Working Examples
 *
 * This file demonstrates real-world usage with Thailand data
 * Copy these patterns for other countries
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { LocationHierarchySelector } from '../index';
import { thailandProvinces } from '../../../data/thailandProvinces';
import {
  getDistrictsByProvince,
  getSubDistrictsByDistrictId,
} from '../../../data/thailandLocations';

/**
 * Example 1: Thailand Province Selector
 * Replaces: ProvinceSelector
 */
export const ThailandProvinceExample = () => {
  const [province, setProvince] = useState('');

  return (
    <LocationHierarchySelector
      dataSource={thailandProvinces}
      label="จังหวัด (Province)"
      placeholder="กรุณาเลือกจังหวัด"
      value={province}
      onValueChange={setProvince}
      modalTitle="เลือกจังหวัด"
      searchPlaceholder="ค้นหาจังหวัด..."
      displayFormat="bilingual"
      showSearch={true}
    />
  );
};

/**
 * Example 2: Thailand District Selector (depends on Province)
 * Replaces: DistrictSelector
 */
export const ThailandDistrictExample = () => {
  const [province, setProvince] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [districtData, setDistrictData] = useState(null);

  return (
    <View>
      {/* Province Selector */}
      <LocationHierarchySelector
        dataSource={thailandProvinces}
        label="จังหวัด"
        value={province}
        onValueChange={setProvince}
        displayFormat="bilingual"
      />

      {/* District Selector - enabled only when province selected */}
      <LocationHierarchySelector
        getDataByParent={getDistrictsByProvince}
        parentId={province}
        label="อำเภอ/เขต (District)"
        placeholder="กรุณาเลือกอำเภอ/เขต"
        selectedId={districtId}
        onSelect={(district) => {
          setDistrictId(district.id);
          setDistrictData(district);
        }}
        modalTitle="เลือกอำเภอ/เขต"
        searchPlaceholder="ค้นหาอำเภอ/เขต..."
        displayFormat="bilingual"
        parentRequiredMessage="กรุณาเลือกจังหวัดก่อน"
      />
    </View>
  );
};

/**
 * Example 3: Thailand SubDistrict Selector with Postal Code
 * Replaces: SubDistrictSelector
 */
export const ThailandSubDistrictExample = () => {
  const [province, setProvince] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [subDistrictId, setSubDistrictId] = useState('');
  const [postalCode, setPostalCode] = useState('');

  return (
    <View>
      {/* Province */}
      <LocationHierarchySelector
        dataSource={thailandProvinces}
        label="จังหวัด"
        value={province}
        onValueChange={setProvince}
        displayFormat="bilingual"
      />

      {/* District */}
      <LocationHierarchySelector
        getDataByParent={getDistrictsByProvince}
        parentId={province}
        label="อำเภอ/เขต"
        selectedId={districtId}
        onSelect={(district) => setDistrictId(district.id)}
        displayFormat="bilingual"
        parentRequiredMessage="กรุณาเลือกจังหวัดก่อน"
      />

      {/* SubDistrict with Postal Code */}
      <LocationHierarchySelector
        getDataByParent={getSubDistrictsByDistrictId}
        parentId={districtId}
        label="ตำบล/แขวง (Subdistrict)"
        placeholder="กรุณาเลือกตำบล/แขวง"
        selectedId={subDistrictId}
        onSelect={(subDistrict) => {
          setSubDistrictId(subDistrict.id);
          setPostalCode(subDistrict.postalCode || '');
        }}
        modalTitle="เลือกตำบล/แขวง"
        searchPlaceholder="ค้นหาตำบล/แขวง หรือรหัสไปรษณีย์..."
        displayFormat="bilingual"
        showPostalCode={true}
        parentRequiredMessage="กรุณาเลือกอำเภอ/เขตก่อน"
      />
    </View>
  );
};

/**
 * Example 4: Full Thailand Address Form (Complete 3-Level Hierarchy)
 */
export const ThailandFullAddressExample = () => {
  // State
  const [province, setProvince] = useState('');
  const [provinceData, setProvinceData] = useState(null);
  const [districtId, setDistrictId] = useState('');
  const [districtData, setDistrictData] = useState(null);
  const [subDistrictId, setSubDistrictId] = useState('');
  const [subDistrictData, setSubDistrictData] = useState(null);
  const [postalCode, setPostalCode] = useState('');

  // Reset child selections when parent changes
  const handleProvinceChange = (code) => {
    setProvince(code);
    setDistrictId('');
    setDistrictData(null);
    setSubDistrictId('');
    setSubDistrictData(null);
    setPostalCode('');
  };

  const handleDistrictSelect = (district) => {
    setDistrictId(district.id);
    setDistrictData(district);
    setSubDistrictId('');
    setSubDistrictData(null);
    setPostalCode('');
  };

  const handleSubDistrictSelect = (subDistrict) => {
    setSubDistrictId(subDistrict.id);
    setSubDistrictData(subDistrict);
    setPostalCode(subDistrict.postalCode || '');
  };

  return (
    <View style={{ padding: 16 }}>
      {/* Level 1: Province */}
      <LocationHierarchySelector
        dataSource={thailandProvinces}
        label="จังหวัด (Province) *"
        placeholder="กรุณาเลือกจังหวัด"
        value={province}
        onValueChange={handleProvinceChange}
        onSelect={setProvinceData}
        modalTitle="เลือกจังหวัด"
        searchPlaceholder="ค้นหาจังหวัด (ไทย/English/中文)..."
        displayFormat="bilingual"
      />

      {/* Level 2: District */}
      <LocationHierarchySelector
        getDataByParent={getDistrictsByProvince}
        parentId={province}
        label="อำเภอ/เขต (District) *"
        placeholder="กรุณาเลือกอำเภอ/เขต"
        selectedId={districtId}
        onSelect={handleDistrictSelect}
        modalTitle="เลือกอำเภอ/เขต"
        searchPlaceholder="ค้นหาอำเภอ/เขต..."
        displayFormat="bilingual"
        parentRequiredMessage="กรุณาเลือกจังหวัดก่อน"
      />

      {/* Level 3: SubDistrict with Postal Code */}
      <LocationHierarchySelector
        getDataByParent={getSubDistrictsByDistrictId}
        parentId={districtId}
        label="ตำบล/แขวง (Subdistrict) *"
        placeholder="กรุณาเลือกตำบล/แขวง"
        selectedId={subDistrictId}
        onSelect={handleSubDistrictSelect}
        modalTitle="เลือกตำบล/แขวง"
        searchPlaceholder="ค้นหาตำบล/แขวง หรือรหัสไปรษณีย์..."
        displayFormat="bilingual"
        showPostalCode={true}
        parentRequiredMessage="กรุณาเลือกอำเภอ/เขตก่อน"
        helpText={postalCode ? `รหัสไปรษณีย์: ${postalCode}` : ''}
      />

      {/* Display selected values (for debugging) */}
      {/*
      <Text>Selected Province: {provinceData?.name}</Text>
      <Text>Selected District: {districtData?.nameEn}</Text>
      <Text>Selected SubDistrict: {subDistrictData?.nameEn}</Text>
      <Text>Postal Code: {postalCode}</Text>
      */}
    </View>
  );
};

/**
 * Example 5: Custom Display Format
 */
export const CustomDisplayFormatExample = () => {
  const [province, setProvince] = useState('');

  return (
    <LocationHierarchySelector
      dataSource={thailandProvinces}
      label="Province"
      value={province}
      onValueChange={setProvince}
      // Custom format: "BKK - Bangkok (曼谷)"
      getDisplayLabel={(location, isChinese) => {
        const code = location.code || '';
        const nameEn = location.nameEn || location.name || '';
        const nameZh = location.nameZh || '';
        return `${code} - ${nameEn}${nameZh ? ` (${nameZh})` : ''}`;
      }}
    />
  );
};

/**
 * Example 6: English-Only Display
 */
export const EnglishOnlyExample = () => {
  const [province, setProvince] = useState('');

  return (
    <LocationHierarchySelector
      dataSource={thailandProvinces}
      label="Province"
      placeholder="Please select a province"
      value={province}
      onValueChange={setProvince}
      modalTitle="Select Province"
      searchPlaceholder="Search provinces..."
      displayFormat="english"
      locale="en"
    />
  );
};

/**
 * Example 7: Chinese-Only Display
 */
export const ChineseOnlyExample = () => {
  const [province, setProvince] = useState('');

  return (
    <LocationHierarchySelector
      dataSource={thailandProvinces}
      label="省份"
      placeholder="请选择省份"
      value={province}
      onValueChange={setProvince}
      modalTitle="选择省份"
      searchPlaceholder="搜索省份..."
      displayFormat="native"
      locale="zh"
    />
  );
};

/**
 * Example 8: With Validation and Error Messages
 */
export const WithValidationExample = () => {
  const [province, setProvince] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleProvinceChange = (code) => {
    setProvince(code);
    if (code) {
      setError(false);
      setErrorMessage('');
    }
  };

  const validateProvince = () => {
    if (!province) {
      setError(true);
      setErrorMessage('กรุณาเลือกจังหวัด');
    }
  };

  return (
    <LocationHierarchySelector
      dataSource={thailandProvinces}
      label="จังหวัด *"
      value={province}
      onValueChange={handleProvinceChange}
      displayFormat="bilingual"
      error={error}
      errorMessage={errorMessage}
      helpText="เลือกจังหวัดที่คุณอาศัยอยู่"
    />
  );
};

export default {
  ThailandProvinceExample,
  ThailandDistrictExample,
  ThailandSubDistrictExample,
  ThailandFullAddressExample,
  CustomDisplayFormatExample,
  EnglishOnlyExample,
  ChineseOnlyExample,
  WithValidationExample,
};
