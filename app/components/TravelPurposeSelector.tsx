import React, { useEffect, useMemo, useState } from 'react';
import { BaseSearchableSelector } from './tamagui';
import type { BaseSearchableSelectorProps, GetDisplayValueFn, SearchableOption } from './tamagui';
import {
  getBasicTravelPurposes,
  getJapanTravelPurposes,
  getThailandTravelPurposes,
  getTravelPurposeDisplayName,
  normalizeTravelPurpose,
} from '../data/travelPurposes';
import { useLocale } from '../i18n/LocaleContext';

type PurposeCategory = 'basic' | 'japan' | 'thailand' | 'us';

type PurposeType =
  | PurposeCategory
  | 'malaysia'
  | 'singapore'
  | 'hongkong'
  | 'vietnam'
  | 'philippines'
  | 'canada'
  | 'default';

const PURPOSE_TYPE_NORMALIZATION: Record<PurposeType, PurposeCategory> = {
  basic: 'basic',
  japan: 'japan',
  thailand: 'thailand',
  us: 'us',
  malaysia: 'basic',
  singapore: 'basic',
  hongkong: 'basic',
  vietnam: 'basic',
  philippines: 'basic',
  canada: 'basic',
  default: 'basic',
};

interface TravelPurposeRecord {
  code: string;
  name: string;
  displayName: string;
}

export interface TravelPurposeSelectorProps
  extends Omit<
    BaseSearchableSelectorProps,
    'options' | 'getDisplayValue' | 'searchPlaceholder' | 'modalTitle' | 'onValueChange'
  > {
  value?: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showSearch?: boolean;
  locale?: string;
  purposeType?: PurposeType | (string & {});
  otherValue?: string;
  onOtherValueChange?: (value: string) => void;
  searchPlaceholder?: string;
  modalTitle?: string;
}

const TravelPurposeSelector: React.FC<TravelPurposeSelectorProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
  error,
  errorMessage,
  helpText,
  style,
  showSearch = true,
  locale,
  purposeType = 'basic',
  otherValue,
  onOtherValueChange,
  searchPlaceholder,
  modalTitle,
  ...rest
}) => {
  const { t, language } = useLocale();
  const currentLocale = locale ?? language;
  const [travelPurposes, setTravelPurposes] = useState<TravelPurposeRecord[]>([]);

  const normalizedLocale = useMemo(() => {
    const localeToUse = currentLocale ?? 'en';
    const parts = localeToUse.split('-');
    return parts[0];
  }, [currentLocale]);

  useEffect(() => {
    try {
      const normalizeCategory = (type?: string): PurposeCategory => {
        if (!type) {
          return 'basic';
        }
        if (Object.prototype.hasOwnProperty.call(PURPOSE_TYPE_NORMALIZATION, type)) {
          return PURPOSE_TYPE_NORMALIZATION[type as PurposeType];
        }
        return 'basic';
      };

      const normalizedType = normalizeCategory(purposeType as string | undefined);

      let purposes: TravelPurposeRecord[] = [];
      switch (normalizedType) {
        case 'japan':
          purposes = getJapanTravelPurposes(normalizedLocale);
          break;
        case 'thailand':
          purposes = getThailandTravelPurposes(normalizedLocale);
          break;
        case 'us':
          purposes = getBasicTravelPurposes(normalizedLocale);
          break;
        default:
          purposes = getBasicTravelPurposes(normalizedLocale);
          break;
      }

      if (Array.isArray(purposes) && purposes.length > 0) {
        setTravelPurposes(purposes);
      } else {
        console.warn('[TravelPurposeSelector] Invalid purposes list received:', purposes);
        setTravelPurposes([]);
      }
    } catch (err) {
      console.error('[TravelPurposeSelector] Failed to load travel purposes:', err);
      setTravelPurposes([]);
    }
  }, [purposeType, normalizedLocale]);

  const options = useMemo<SearchableOption[]>(
    () =>
      travelPurposes.map((purpose) => ({
        label: purpose.name ?? '',
        value: purpose.code ?? '',
      })),
    [travelPurposes],
  );

  const getDisplayValue: GetDisplayValueFn = (val, customVal) => {
    if (!val) {
      return '';
    }

    if (val === 'OTHER' && customVal && onOtherValueChange) {
      return customVal;
    }

    return getTravelPurposeDisplayName(val, normalizedLocale);
  };

  const handleValueChange = (nextValue: string) => {
    const normalizedValue = normalizeTravelPurpose(nextValue);
    onValueChange(normalizedValue);
  };

  const defaultPlaceholder = placeholder ?? t('common.selectTravelPurpose', { defaultValue: '请选择旅行目的' });
  const defaultCustomLabel = t('common.enterTravelPurposeDetails', { defaultValue: '请输入旅行目的详情' });
  const defaultCustomPlaceholder = t('common.enterTravelPurposeDetails', { defaultValue: '请输入旅行目的详情' });
  const effectiveSearchPlaceholder =
    searchPlaceholder ?? t('common.searchTravelPurpose', { defaultValue: '搜索旅行目的...' });
  const effectiveModalTitle = modalTitle ?? t('common.travelPurposeModalTitle', { defaultValue: '选择旅行目的' });

  return (
    <BaseSearchableSelector
      label={label}
      value={value}
      onValueChange={handleValueChange}
      options={options}
      placeholder={defaultPlaceholder}
      getDisplayValue={(val, custom) => getDisplayValue(val, custom, options)}
      customValue={otherValue}
      onCustomChange={onOtherValueChange}
      customLabel={defaultCustomLabel}
      customPlaceholder={defaultCustomPlaceholder}
      showSearch={showSearch}
      searchPlaceholder={effectiveSearchPlaceholder}
      modalTitle={effectiveModalTitle}
      error={error}
      errorMessage={errorMessage}
      helpText={helpText}
      style={style}
      {...rest}
    />
  );
};

export default TravelPurposeSelector;

