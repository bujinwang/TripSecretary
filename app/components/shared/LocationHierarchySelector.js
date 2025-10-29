/**
 * Generic Location Hierarchy Selector
 *
 * A flexible, country-agnostic component for selecting locations at any hierarchy level
 * (Province/State/Region → District/City → SubDistrict/Ward/Postal Area)
 *
 * Usage Examples:
 *
 * 1. Top-level (Province/State):
 *    <LocationHierarchySelector
 *      dataSource={thailandProvinces}
 *      label="选择省份"
 *      value={value}
 *      onSelect={(location) => setProvince(location.code)}
 *    />
 *
 * 2. Child level (District/City):
 *    <LocationHierarchySelector
 *      getDataByParent={getDistrictsByProvince}
 *      parentId={provinceCode}
 *      label="选择区"
 *      value={value}
 *      onSelect={(location) => setDistrict(location)}
 *    />
 *
 * 3. With postal codes (SubDistrict):
 *    <LocationHierarchySelector
 *      getDataByParent={getSubDistrictsByDistrict}
 *      parentId={districtId}
 *      label="选择街道"
 *      value={value}
 *      onSelect={(location) => setSubDistrict(location)}
 *      showPostalCode={true}
 *    />
 */

import React, { useMemo, useState, useEffect } from 'react';
import { BaseSearchableSelector } from '../tamagui';
import { useLocale } from '../../i18n/LocaleContext';

const normalize = (value) => (value || '').toLowerCase().trim();

/**
 * Default display format handlers
 */
const DISPLAY_FORMATS = {
  // Shows: "Bangkok - 曼谷"
  bilingual: (location, isChinese) => {
    if (!location) return '';
    const fallback = location.nameTh || location.nameLocal || location.nameZh || '';
    const secondary = isChinese
      ? location.nameZh || fallback
      : fallback || location.nameZh || '';

    if (!secondary || secondary === location.nameEn) {
      return location.nameEn || location.name || '';
    }
    return `${location.nameEn || location.name} - ${secondary}`;
  },

  // Shows: "曼谷" (native language only)
  native: (location, isChinese) => {
    if (!location) return '';
    return isChinese
      ? location.nameZh || location.nameTh || location.nameLocal || location.name
      : location.nameTh || location.nameLocal || location.nameZh || location.name || '';
  },

  // Shows: "Bangkok" (English only)
  english: (location) => {
    if (!location) return '';
    return location.nameEn || location.name || '';
  },

  // Shows: "Bangkok - 曼谷 (10200)"
  withPostalCode: (location, isChinese) => {
    const base = DISPLAY_FORMATS.bilingual(location, isChinese);
    const postal = location.postalCode ? ` (${location.postalCode})` : '';
    return `${base}${postal}`;
  },
};

const LocationHierarchySelector = ({
  // Core selection props
  label,
  value,
  selectedId,  // Alternative to value (uses ID for matching)
  onSelect,    // Callback with full location object: (location) => void
  onValueChange,  // Simple callback: (code) => void (for backwards compatibility)

  // Data source (provide ONE of these)
  dataSource = null,              // Static array of locations
  getDataByParent = null,         // Function(parentId) => locations[]
  parentId = null,                // Required if using getDataByParent

  // Display configuration
  displayFormat = 'bilingual',    // 'bilingual' | 'native' | 'english' | 'custom'
  getDisplayLabel = null,         // Custom label function: (location, isChinese) => string
  showPostalCode = false,         // Append postal code to label
  locale = null,                  // Override locale (defaults to context)

  // Empty state messages
  emptyMessage = '没有可用的选项',
  parentRequiredMessage = '请先选择上级',

  // BaseSearchableSelector pass-through props
  placeholder = '请选择',
  error,
  errorMessage,
  helpText,
  showSearch = true,
  searchPlaceholder = '搜索...',
  modalTitle = '请选择',
  style,
  ...rest
}) => {
  const { language } = useLocale();
  const effectiveLocale = locale || language;
  const isChinese = effectiveLocale?.startsWith('zh');

  const [locations, setLocations] = useState([]);

  // Load location data
  useEffect(() => {
    try {
      let data = [];

      if (dataSource) {
        // Static data source
        data = Array.isArray(dataSource) ? dataSource : [];
      } else if (getDataByParent && parentId) {
        // Dynamic data based on parent
        data = getDataByParent(parentId);
        data = Array.isArray(data) ? data : [];
      } else if (getDataByParent && !parentId) {
        // Parent required but not provided
        data = [];
      }

      setLocations(data);
    } catch (error) {
      console.error('Error loading location data:', error);
      setLocations([]);
    }
  }, [dataSource, getDataByParent, parentId]);

  // Determine display label function
  const getLabelForLocation = useMemo(() => {
    if (getDisplayLabel) {
      return (loc) => getDisplayLabel(loc, isChinese);
    }

    if (showPostalCode) {
      return (loc) => DISPLAY_FORMATS.withPostalCode(loc, isChinese);
    }

    const formatFunc = DISPLAY_FORMATS[displayFormat] || DISPLAY_FORMATS.bilingual;
    return (loc) => formatFunc(loc, isChinese);
  }, [displayFormat, isChinese, showPostalCode, getDisplayLabel]);

  // Map locations to BaseSearchableSelector format
  const options = useMemo(() => {
    return locations.map(location => {
      // Determine unique value (prefer id, fallback to code, then name)
      const uniqueValue = location.id || location.code || location.name || location.nameEn;

      return {
        label: getLabelForLocation(location),
        value: uniqueValue,
        // Store full location data for callback
        _locationData: location,
      };
    });
  }, [locations, getLabelForLocation]);

  // Custom display value function for selected value
  const getDisplayValue = (val) => {
    if (!val) return value || '';
    if (!Array.isArray(locations) || locations.length === 0) return value || '';

    const normalizedValue = normalize(value);

    // Find matching location
    const matched = locations.find((location) => {
      if (!location) return false;

      // Match by selectedId
      if (selectedId && location.id === selectedId) return true;

      // Match by value
      if (val && (location.id === val || location.code === val)) return true;

      // Match by name (any variant)
      const nameEn = normalize(location.nameEn || location.name);
      const nameTh = normalize(location.nameTh || location.nameLocal);
      const nameZh = normalize(location.nameZh);

      return (
        normalizedValue &&
        (nameEn === normalizedValue ||
         nameTh === normalizedValue ||
         nameZh === normalizedValue)
      );
    });

    if (!matched) return value || '';
    return getLabelForLocation(matched);
  };

  // Handle selection
  const handleValueChange = (selectedValue) => {
    if (!selectedValue) return;

    // Find the full location data
    const option = options.find(opt => opt.value === selectedValue);

    if (option && option._locationData) {
      const locationData = option._locationData;

      // Call onSelect with full location object
      if (onSelect) {
        onSelect(locationData);
      }

      // Call onValueChange for backwards compatibility (simple string/code)
      if (onValueChange) {
        onValueChange(locationData.code || locationData.id || selectedValue);
      }
    }
  };

  // Custom filter for multilingual search
  const filterOptions = (opts, search) => {
    if (!search) return opts;
    const lowerSearch = search.toLowerCase();
    return opts.filter(opt => {
      const label = opt.label || '';
      return label.toLowerCase().includes(lowerSearch);
    });
  };

  // Determine current value for BaseSearchableSelector
  const selectorValue = useMemo(() => {
    if (selectedId) return selectedId;

    // Try to match value to a location ID/code
    const normalizedValue = normalize(value);
    const matched = locations.find((location) => {
      const nameEn = normalize(location.nameEn || location.name);
      const nameTh = normalize(location.nameTh || location.nameLocal);
      const nameZh = normalize(location.nameZh);
      const code = normalize(location.code);
      const id = location.id;

      return (
        id === value ||
        code === normalizedValue ||
        nameEn === normalizedValue ||
        nameTh === normalizedValue ||
        nameZh === normalizedValue
      );
    });

    return matched ? (matched.id || matched.code) : value;
  }, [value, selectedId, locations]);

  // Determine placeholder based on state
  const effectivePlaceholder = useMemo(() => {
    // If using getDataByParent but no parent provided, show parent required message
    if (getDataByParent && !parentId) {
      return parentRequiredMessage;
    }

    // If no data available, show empty message
    if (locations.length === 0 && (dataSource || parentId)) {
      return emptyMessage;
    }

    return placeholder;
  }, [getDataByParent, parentId, locations.length, dataSource, placeholder, parentRequiredMessage, emptyMessage]);

  return (
    <BaseSearchableSelector
      label={label}
      value={selectorValue}
      onValueChange={handleValueChange}
      options={options}
      placeholder={effectivePlaceholder}
      getDisplayValue={getDisplayValue}
      filterOptions={filterOptions}
      showSearch={showSearch}
      searchPlaceholder={searchPlaceholder}
      modalTitle={modalTitle}
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default LocationHierarchySelector;
