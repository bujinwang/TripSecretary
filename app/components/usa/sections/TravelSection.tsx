import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { CollapsibleSection } from '../../tamagui';
import TravelPurposeSelector from '../../TravelPurposeSelector';
import DateTimeInput from '../../DateTimeInput';
import Input from '../../Input';
import USFormHelper from '../../../utils/usa/USFormHelper';
import { colors, spacing, typography, borderRadius } from '../../../theme';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type HandleFieldBlur = (field: string, value: string | boolean) => void;

type SaveOverrideFn = (data: Record<string, unknown>) => Promise<void>;

type TravelSectionStyles = ReturnType<typeof createStyles>;
type TravelSectionStyleKey = keyof TravelSectionStyles;
type StyleOverrides = Partial<Record<TravelSectionStyleKey, ViewStyle | TextStyle>>;

export interface USATravelSectionProps {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  language?: string;
  travelPurpose: string;
  customTravelPurpose: string;
  arrivalFlightNumber: string;
  arrivalDate: string;
  isTransitPassenger: boolean;
  accommodationAddress: string;
  accommodationPhone: string;
  lengthOfStay: string;
  setTravelPurpose: (value: string) => void;
  setCustomTravelPurpose: (value: string) => void;
  setArrivalFlightNumber: (value: string) => void;
  setArrivalDate: (value: string) => void;
  setIsTransitPassenger: (value: boolean) => void;
  setAccommodationAddress: (value: string) => void;
  setAccommodationPhone: (value: string) => void;
  setLengthOfStay: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: HandleFieldBlur;
  lastEditedField?: string | null;
  debouncedSaveData?: () => void;
  saveDataToSecureStorageWithOverride?: SaveOverrideFn;
  setLastEditedAt?: (date: Date) => void;
  styles?: StyleOverrides;
}

const TravelSection: React.FC<USATravelSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  language,
  travelPurpose,
  customTravelPurpose,
  arrivalFlightNumber,
  arrivalDate,
  isTransitPassenger,
  accommodationAddress,
  accommodationPhone,
  lengthOfStay,
  setTravelPurpose,
  setCustomTravelPurpose,
  setArrivalFlightNumber,
  setArrivalDate,
  setIsTransitPassenger,
  setAccommodationAddress,
  setAccommodationPhone,
  setLengthOfStay,
  errors,
  warnings: _warnings,
  handleFieldBlur,
  lastEditedField,
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  styles: styleOverrides,
}) => {
  const travelPurposeCode = React.useMemo(() => {
    const mapping: Record<string, string> = {
      Tourism: 'TOURISM',
      Business: 'BUSINESS',
      'Visiting Relatives': 'VISITING_RELATIVES',
      Transit: 'TRANSIT',
      Other: 'OTHER',
    };
    return mapping[travelPurpose] || 'OTHER';
  }, [travelPurpose]);

  const sectionStyles = React.useMemo(
    () => (styleOverrides ? ({ ...defaultStyles, ...styleOverrides } as TravelSectionStyles) : defaultStyles),
    [styleOverrides],
  );

  return (
    <CollapsibleSection
      title={t('us.travelInfo.sections.travel', { defaultValue: '✈️ 行程信息' })}
      expanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
      style={sectionStyles.sectionCard as ViewStyle}
      headerStyle={sectionStyles.sectionHeader as ViewStyle}
      contentStyle={sectionStyles.sectionContent as ViewStyle}
    >
      <TravelPurposeSelector
        label={t('us.travelInfo.fields.travelPurpose', { defaultValue: '旅行目的' })}
        value={travelPurposeCode}
        onValueChange={(value) => {
          const normalizedValue = USFormHelper.normalizeTravelPurpose(value);
          setTravelPurpose(normalizedValue);
          if (normalizedValue !== 'Other') {
            setCustomTravelPurpose('');
          }
          handleFieldBlur('travelPurpose', normalizedValue);
          debouncedSaveData?.();
        }}
        purposeType="us"
        locale={language}
        error={!!errors.travelPurpose}
        errorMessage={errors.travelPurpose}
      />

      {travelPurpose === 'Other' ? (
        <Input
          label={t('us.travelInfo.fields.customTravelPurpose', { defaultValue: '其他目的' })}
          value={customTravelPurpose}
          onChangeText={setCustomTravelPurpose}
          onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
          placeholder={t('us.travelInfo.fields.customTravelPurposePlaceholder', {
            defaultValue: '请输入旅行目的',
          })}
          helpText="Please enter in English"
          autoCapitalize="words"
          error={!!errors.customTravelPurpose}
          errorMessage={errors.customTravelPurpose}
          isLastEdited={lastEditedField === 'customTravelPurpose'}
        />
      ) : null}

      <Input
        label={t('us.travelInfo.fields.arrivalFlightNumber', { defaultValue: '抵达航班号' })}
        value={arrivalFlightNumber}
        onChangeText={setArrivalFlightNumber}
        onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
        placeholder={t('us.travelInfo.fields.arrivalFlightNumberPlaceholder', { defaultValue: 'UA857' })}
        autoCapitalize="characters"
        error={!!errors.arrivalFlightNumber}
        errorMessage={errors.arrivalFlightNumber}
        helpText={t('us.travelInfo.fields.arrivalFlightNumberHelp', {
          defaultValue: '抵达美国的航班号',
        })}
        isLastEdited={lastEditedField === 'arrivalFlightNumber'}
      />

      <DateTimeInput
        label={t('us.travelInfo.fields.arrivalDate', { defaultValue: '抵达日期' })}
        value={arrivalDate}
        onChangeText={(value: string) => {
          setArrivalDate(value);
          handleFieldBlur('arrivalDate', value);
        }}
        onBlur={() => handleFieldBlur('arrivalDate', arrivalDate)}
        mode="date"
        dateType="future"
        error={!!errors.arrivalDate}
        errorMessage={errors.arrivalDate}
        helpText={t('us.travelInfo.fields.arrivalDateHelp', {
          defaultValue: '预计抵达美国日期',
        })}
      />

      <TouchableOpacity
        style={sectionStyles.checkboxContainer as ViewStyle}
        onPress={async () => {
          const newValue = !isTransitPassenger;
          setIsTransitPassenger(newValue);
          if (newValue) {
            setAccommodationAddress('');
            setAccommodationPhone('');
          }
          try {
            if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
              await saveDataToSecureStorageWithOverride({ isTransitPassenger: newValue });
              setLastEditedAt(new Date());
            }
          } catch (error) {
            console.error('Failed to save transit passenger status:', error);
          }
          handleFieldBlur('isTransitPassenger', newValue);
        }}
        activeOpacity={0.7}
      >
        <View style={[sectionStyles.checkbox as ViewStyle, isTransitPassenger && (sectionStyles.checkboxChecked as ViewStyle)]}>
          {isTransitPassenger ? <Text style={sectionStyles.checkmark as TextStyle}>✓</Text> : null}
        </View>
        <Text style={sectionStyles.checkboxLabel as TextStyle}>
          {t('us.travelInfo.fields.transitPassenger', {
            defaultValue: '我是过境旅客，不在美国停留',
          })}
        </Text>
      </TouchableOpacity>

      {!isTransitPassenger ? (
        <>
          <Input
            label={t('us.travelInfo.fields.accommodationAddress', { defaultValue: '住宿地址' })}
            value={accommodationAddress}
            onChangeText={setAccommodationAddress}
            onBlur={() => handleFieldBlur('accommodationAddress', accommodationAddress)}
            placeholder={t('us.travelInfo.fields.accommodationAddressPlaceholder', {
              defaultValue: '123 Main St, New York, NY 10001',
            })}
            multiline
            numberOfLines={3}
            error={!!errors.accommodationAddress}
            errorMessage={errors.accommodationAddress}
            helpText={t('us.travelInfo.fields.accommodationAddressHelp', {
              defaultValue: '请输入在美国的住宿地址',
            })}
            isLastEdited={lastEditedField === 'accommodationAddress'}
          />

          <Input
            label={t('us.travelInfo.fields.accommodationPhone', { defaultValue: '住宿电话' })}
            value={accommodationPhone}
            onChangeText={setAccommodationPhone}
            onBlur={() => handleFieldBlur('accommodationPhone', accommodationPhone)}
            placeholder={t('us.travelInfo.fields.accommodationPhonePlaceholder', {
              defaultValue: '212-555-1234',
            })}
            keyboardType="phone-pad"
            error={!!errors.accommodationPhone}
            errorMessage={errors.accommodationPhone}
            helpText={t('us.travelInfo.fields.accommodationPhoneHelp', {
              defaultValue: '酒店或住宿地的联系电话',
            })}
            isLastEdited={lastEditedField === 'accommodationPhone'}
          />
        </>
      ) : null}

      <Input
        label={t('us.travelInfo.fields.lengthOfStay', { defaultValue: '停留天数' })}
        value={lengthOfStay}
        onChangeText={setLengthOfStay}
        onBlur={() => handleFieldBlur('lengthOfStay', lengthOfStay)}
        placeholder={t('us.travelInfo.fields.lengthOfStayPlaceholder', { defaultValue: '7' })}
        keyboardType="numeric"
        error={!!errors.lengthOfStay}
        errorMessage={errors.lengthOfStay}
        helpText={t('us.travelInfo.fields.lengthOfStayHelp', {
          defaultValue: '计划在美国停留的天数',
        })}
        isLastEdited={lastEditedField === 'lengthOfStay'}
      />
    </CollapsibleSection>
  );
};

export default TravelSection;

const createStyles = () =>
  StyleSheet.create({
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    sectionHeader: {
      paddingHorizontal: spacing.sm,
    },
    sectionContent: {
      gap: spacing.md,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: borderRadius.sm / 1.5,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkmark: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '600',
    },
    checkboxLabel: {
      ...typography.body1,
      color: colors.text,
      flex: 1,
    },
  });

const defaultStyles = createStyles();
