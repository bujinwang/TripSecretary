import React, { useEffect, useMemo, useState } from 'react';
import { BaseSearchableSelector } from '../tamagui';
import type {
  BaseSearchableSelectorProps,
  FilterOptionsFn,
  GetDisplayValueFn,
  SearchableOption,
} from '../tamagui';
import { useLocale } from '../../i18n/LocaleContext';

type DisplayFormat = 'bilingual' | 'native' | 'english' | 'custom';

export interface LocationRecord {
  id?: string;
  code?: string;
  name?: string;
  nameEn?: string;
  nameZh?: string;
  nameTh?: string;
  nameLocal?: string;
  postalCode?: string;
  [key: string]: unknown;
}

interface LocationOption extends SearchableOption {
  _locationData: LocationRecord;
}

export interface LocationHierarchySelectorProps
  extends Omit<
    BaseSearchableSelectorProps,
    'options' | 'getDisplayValue' | 'filterOptions' | 'onValueChange'
  > {
  value?: string | null;
  selectedId?: string | null;
  onSelect?: (location: LocationRecord) => void;
  onValueChange?: (code: string) => void;
  dataSource?: LocationRecord[] | null;
  getDataByParent?: ((parentId: string) => LocationRecord[] | null | undefined) | null;
  parentId?: string | null;
  displayFormat?: DisplayFormat;
  getDisplayLabel?: ((location: LocationRecord, isChinese: boolean) => string) | null;
  showPostalCode?: boolean;
  locale?: string | null;
  emptyMessage?: string;
  parentRequiredMessage?: string;
  placeholder?: string;
}

const normalize = (value?: string | null) => (value ?? '').toLowerCase().trim();

const DISPLAY_FORMATS = {
  bilingual: (location: LocationRecord, isChinese: boolean) => {
    if (!location) {
      return '';
    }
    const fallback = location.nameTh ?? location.nameLocal ?? location.nameZh ?? '';
    const secondary = isChinese ? location.nameZh ?? fallback : fallback ?? location.nameZh ?? '';

    if (!secondary || secondary === location.nameEn) {
      return location.nameEn ?? location.name ?? '';
    }
    return `${location.nameEn ?? location.name ?? ''} - ${secondary}`;
  },
  native: (location: LocationRecord, isChinese: boolean) => {
    if (!location) {
      return '';
    }
    return isChinese
      ? location.nameZh ?? location.nameTh ?? location.nameLocal ?? location.name ?? ''
      : location.nameTh ?? location.nameLocal ?? location.nameZh ?? location.name ?? '';
  },
  english: (location: LocationRecord) => {
    if (!location) {
      return '';
    }
    return location.nameEn ?? location.name ?? '';
  },
  withPostalCode: (location: LocationRecord, isChinese: boolean) => {
    const base = DISPLAY_FORMATS.bilingual(location, isChinese);
    const postal = location.postalCode ? ` (${location.postalCode})` : '';
    return `${base}${postal}`;
  },
} satisfies Record<string, (location: LocationRecord, isChinese: boolean) => string>;

const LocationHierarchySelector: React.FC<LocationHierarchySelectorProps> = ({
  label,
  value,
  selectedId,
  onSelect,
  onValueChange,
  dataSource = null,
  getDataByParent = null,
  parentId = null,
  displayFormat = 'bilingual',
  getDisplayLabel = null,
  showPostalCode = false,
  locale = null,
  emptyMessage = '没有可用的选项',
  parentRequiredMessage = '请先选择上级',
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
  const effectiveLocale = locale ?? language;
  const isChinese = effectiveLocale?.startsWith('zh') ?? false;

  const [locations, setLocations] = useState<LocationRecord[]>([]);

  useEffect(() => {
    try {
      let data: LocationRecord[] = [];

      if (dataSource) {
        data = Array.isArray(dataSource) ? dataSource : [];
      } else if (getDataByParent && parentId) {
        const result = getDataByParent(parentId);
        data = Array.isArray(result) ? result : [];
      } else if (getDataByParent && !parentId) {
        data = [];
      }

      setLocations(data);
    } catch (err) {
      console.error('[LocationHierarchySelector] Failed to load location data:', err);
      setLocations([]);
    }
  }, [dataSource, getDataByParent, parentId]);

  const getLabelForLocation = useMemo(() => {
    if (getDisplayLabel) {
      return (loc: LocationRecord) => getDisplayLabel(loc, isChinese);
    }

    if (showPostalCode) {
      return (loc: LocationRecord) => DISPLAY_FORMATS.withPostalCode(loc, isChinese);
    }

    const formatter = DISPLAY_FORMATS[displayFormat] ?? DISPLAY_FORMATS.bilingual;
    return (loc: LocationRecord) => formatter(loc, isChinese);
  }, [displayFormat, getDisplayLabel, isChinese, showPostalCode]);

  const options = useMemo<LocationOption[]>(() => {
    return locations.map((location) => {
      const uniqueValue =
        (location.id as string | undefined) ??
        location.code ??
        location.name ??
        location.nameEn ??
        '';

      return {
        label: getLabelForLocation(location),
        value: String(uniqueValue),
        _locationData: location,
      };
    });
  }, [locations, getLabelForLocation]);

  const getDisplayValue: GetDisplayValueFn = (val) => {
    if (!val) {
      return value ?? '';
    }
    if (!Array.isArray(locations) || locations.length === 0) {
      return value ?? '';
    }

    const normalizedValue = normalize(value);

    const matched = locations.find((location) => {
      if (!location) {
        return false;
      }

      if (selectedId && location.id === selectedId) {
        return true;
      }

      if (val && (location.id === val || location.code === val)) {
        return true;
      }

      const nameEn = normalize(location.nameEn ?? location.name);
      const nameTh = normalize(location.nameTh ?? location.nameLocal);
      const nameZh = normalize(location.nameZh);

      return (
        normalizedValue !== '' &&
        (nameEn === normalizedValue || nameTh === normalizedValue || nameZh === normalizedValue)
      );
    });

    if (!matched) {
      return value ?? '';
    }
    return getLabelForLocation(matched);
  };

  const handleValueChange = (selectedValue: string) => {
    if (!selectedValue) {
      return;
    }

    const option = options.find((opt) => opt.value === selectedValue);

    if (option) {
      const locationData = option._locationData;

      onSelect?.(locationData);
      if (onValueChange) {
        onValueChange(locationData.code ?? locationData.id ?? selectedValue);
      }
    }
  };

  const filterOptions: FilterOptionsFn = (opts, search) => {
    if (!search) {
      return opts;
    }
    const lowerSearch = search.toLowerCase();
    return opts.filter((opt) => {
      const label = opt.label ?? '';
      return label.toLowerCase().includes(lowerSearch);
    });
  };

  const selectorValue = useMemo(() => {
    if (selectedId) {
      return selectedId;
    }

    const normalizedValue = normalize(value);
    const matched = locations.find((location) => {
      const nameEn = normalize(location.nameEn ?? location.name);
      const nameTh = normalize(location.nameTh ?? location.nameLocal);
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

    if (!matched) {
      return value ?? '';
    }
    return (matched.id ?? matched.code ?? value) ?? '';
  }, [value, selectedId, locations]);

  const effectivePlaceholder = useMemo(() => {
    if (getDataByParent && !parentId) {
      return parentRequiredMessage;
    }

    if (locations.length === 0 && (dataSource || parentId)) {
      return emptyMessage;
    }

    return placeholder ?? '请选择';
  }, [
    getDataByParent,
    parentId,
    locations.length,
    dataSource,
    placeholder,
    parentRequiredMessage,
    emptyMessage,
  ]);

  return (
    <BaseSearchableSelector
      label={label}
      value={selectorValue ?? ''}
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

