import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { CollapsibleSection } from '../../tamagui';
import PassportNameInput from '../../PassportNameInput';
import NationalitySelector from '../../NationalitySelector';
import DateTimeInput from '../../DateTimeInput';
import Input from '../../Input';
import GenderSelector from '../../GenderSelector';
import type { GenderOption } from '../../GenderSelector';
import { colors, spacing, typography, borderRadius } from '../../../theme';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type HandleFieldBlur = (field: string, value: string) => void;

type SaveOverrideFn = (data: Record<string, unknown>) => Promise<void>;

type PassportSectionStyles = ReturnType<typeof createStyles>;
type PassportSectionStyleKey = keyof PassportSectionStyles;
type StyleOverrides = Partial<Record<PassportSectionStyleKey, ViewStyle | TextStyle>>;

export interface USAPassportSectionProps {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  passportNo: string;
  fullName: string;
  nationality: string;
  dob: string;
  expiryDate: string;
  gender: string;
  setPassportNo: (value: string) => void;
  setFullName: (value: string) => void;
  setNationality: (value: string) => void;
  setDob: (value: string) => void;
  setExpiryDate: (value: string) => void;
  setGender: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: HandleFieldBlur;
  lastEditedField?: string | null;
  debouncedSaveData?: () => void;
  saveDataToSecureStorageWithOverride?: SaveOverrideFn;
  setLastEditedAt?: (date: Date) => void;
  styles?: StyleOverrides;
}

const PassportSection: React.FC<USAPassportSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  passportNo,
  fullName,
  nationality,
  dob,
  expiryDate,
  gender,
  setPassportNo,
  setFullName,
  setNationality,
  setDob,
  setExpiryDate,
  setGender,
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  styles: styleOverrides,
}) => {
  const sectionStyles = React.useMemo(
    () => (styleOverrides ? ({ ...defaultStyles, ...styleOverrides } as PassportSectionStyles) : defaultStyles),
    [styleOverrides],
  );

  const handleGenderSelection = async (nextGender: string) => {
    setGender(nextGender);
    try {
      if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
        await saveDataToSecureStorageWithOverride({ gender: nextGender });
        setLastEditedAt(new Date());
      } else {
        debouncedSaveData?.();
      }
    } catch (error) {
      console.error('Failed to save gender:', error);
    }
    handleFieldBlur('gender', nextGender);
  };

  return (
    <CollapsibleSection
      title={t('us.travelInfo.sections.passport', { defaultValue: '📘 护照信息' })}
      expanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
      style={sectionStyles.sectionCard}
      headerStyle={sectionStyles.sectionHeader}
      contentStyle={sectionStyles.sectionContent}
    >
      <PassportNameInput
        label={t('us.travelInfo.fields.passportName', { defaultValue: '护照姓名' })}
        value={fullName}
        onChangeText={setFullName}
        onBlur={() => handleFieldBlur('fullName', fullName)}
        placeholder={t('us.travelInfo.fields.passportNamePlaceholder', { defaultValue: 'ZHANG/SAN' })}
        error={!!errors.fullName}
        errorMessage={errors.fullName}
        warning={warnings.fullName}
        helpText={t('us.travelInfo.fields.passportNameHelp', {
          defaultValue: '请按照护照上的拼写填写',
        })}
        isLastEdited={lastEditedField === 'fullName'}
      />

      <NationalitySelector
        label={t('us.travelInfo.fields.nationality', { defaultValue: '国籍' })}
        value={nationality}
        onValueChange={(value: string) => {
          setNationality(value);
          handleFieldBlur('nationality', value);
          debouncedSaveData?.();
        }}
        placeholder={t('us.travelInfo.fields.nationalityPlaceholder', { defaultValue: '选择国籍' })}
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      <Input
        label={t('us.travelInfo.fields.passportNumber', { defaultValue: '护照号码' })}
        value={passportNo}
        onChangeText={setPassportNo}
        onBlur={() => handleFieldBlur('passportNo', passportNo)}
        placeholder={t('us.travelInfo.fields.passportNumberPlaceholder', { defaultValue: 'E12345678' })}
        autoCapitalize="characters"
        error={!!errors.passportNo}
        errorMessage={errors.passportNo}
        helpText={t('us.travelInfo.fields.passportNumberHelp', {
          defaultValue: '护照号码通常在护照信息页右上角',
        })}
        isLastEdited={lastEditedField === 'passportNo'}
      />

      <DateTimeInput
        label={t('us.travelInfo.fields.dateOfBirth', { defaultValue: '出生日期' })}
        value={dob}
        onChangeText={(value: string) => {
          setDob(value);
          handleFieldBlur('dob', value);
        }}
        onBlur={() => handleFieldBlur('dob', dob)}
        mode="date"
        dateType="past"
        error={!!errors.dob}
        errorMessage={errors.dob}
        helpText={t('us.travelInfo.fields.dateOfBirthHelp', {
          defaultValue: '护照上的出生日期',
        })}
      />

      <DateTimeInput
        label={t('us.travelInfo.fields.expiryDate', { defaultValue: '护照有效期' })}
        value={expiryDate}
        onChangeText={(value: string) => {
          setExpiryDate(value);
          handleFieldBlur('expiryDate', value);
        }}
        onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
        mode="date"
        dateType="future"
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
        helpText={t('us.travelInfo.fields.expiryDateHelp', {
          defaultValue: '护照过期日期',
        })}
      />

      <View style={sectionStyles.genderField}>
        <Text style={sectionStyles.genderLabel}>
          {t('us.travelInfo.fields.gender', { defaultValue: '性别' })}
        </Text>
        <GenderSelector
          value={gender}
          onChange={handleGenderSelection}
          t={t}
          options={genderOptions}
          style={sectionStyles.genderSelector}
        />
      </View>
    </CollapsibleSection>
  );
};

export default PassportSection;

const genderOptions: GenderOption[] = [
  {
    value: 'Male',
    translationKey: 'us.travelInfo.fields.genderMale',
    defaultLabel: '男',
  },
  {
    value: 'Female',
    translationKey: 'us.travelInfo.fields.genderFemale',
    defaultLabel: '女',
  },
  {
    value: 'Undefined',
    translationKey: 'us.travelInfo.fields.genderUndefined',
    defaultLabel: '未定义',
  },
] ;

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
    genderField: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    genderLabel: {
      ...typography.body1,
      color: colors.text,
      fontWeight: '600',
    },
    genderSelector: {
      width: '100%',
    },
  });

const defaultStyles = createStyles();
