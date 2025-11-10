/**
 * PassportSection Component
 *
 * Displays passport information form section
 * for Hong Kong Travel Info Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../../components';
import { CollapsibleSection, FieldWarningIcon, InputWithValidation } from '../../thailand/ThailandTravelComponents';
import GenderSelector, { type GenderOption } from '../../GenderSelector';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type SaveOverrideFn = (data: Record<string, unknown>) => Promise<void>;

type HongKongPassportSectionProps = {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  surname: string;
  middleName: string;
  givenName: string;
  nationality: string;
  passportNo: string;
  visaNumber: string;
  dob: string;
  expiryDate: string;
  sex: string;
  setSurname: (value: string) => void;
  setMiddleName: (value: string) => void;
  setGivenName: (value: string) => void;
  setNationality: (value: string) => void;
  setPassportNo: (value: string) => void;
  setVisaNumber: (value: string) => void;
  setDob: (value: string) => void;
  setExpiryDate: (value: string) => void;
  setSex: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: (field: string, value: string) => void;
  lastEditedField?: string | null;
  debouncedSaveData?: () => void;
  saveDataToSecureStorageWithOverride?: SaveOverrideFn;
  setLastEditedAt?: (date: Date) => void;
  styles?: typeof localStyles;
};

const genderOptions: GenderOption[] = [
  {
    value: 'Female',
    translationKey: 'hongkong.travelInfo.fields.sex.options.female',
    defaultLabel: '女性',
  },
  {
    value: 'Male',
    translationKey: 'hongkong.travelInfo.fields.sex.options.male',
    defaultLabel: '男性',
  },
  {
    value: 'Undefined',
    translationKey: 'hongkong.travelInfo.fields.sex.options.undefined',
    defaultLabel: '未定义',
  },
];

const PassportSection: React.FC<HongKongPassportSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  surname,
  middleName,
  givenName,
  nationality,
  passportNo,
  visaNumber,
  dob,
  expiryDate,
  sex,
  setSurname,
  setMiddleName,
  setGivenName,
  setNationality,
  setPassportNo,
  setVisaNumber,
  setDob,
  setExpiryDate,
  setSex,
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField: _lastEditedField,
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  styles: parentStyles,
}) => {
  const styles = parentStyles || localStyles;

  const handleGenderChange = async (nextSex: string) => {
    setSex(nextSex);
    try {
      if (saveDataToSecureStorageWithOverride && setLastEditedAt) {
        await saveDataToSecureStorageWithOverride({ sex: nextSex });
        setLastEditedAt(new Date());
      } else {
        debouncedSaveData?.();
      }
    } catch (error) {
      console.error('Failed to save gender:', error);
    }
    handleFieldBlur('sex', nextSex);
  };

  return (
    <CollapsibleSection
      title="👤 护照信息"
      subtitle="香港海关需要核实你的身份"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>🛂</Text>
        <Text style={styles.sectionIntroText}>
          海关官员会核对你的护照信息，请确保与护照完全一致。别担心，我们会帮你格式化！
        </Text>
      </View>

      <View style={styles.inputWithValidationContainer}>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>护照上的姓名</Text>
          <FieldWarningIcon hasWarning={!!warnings.fullName} hasError={!!errors.fullName} />
        </View>
        <PassportNameInput
          surname={surname}
          middleName={middleName}
          givenName={givenName}
          onSurnameChange={setSurname}
          onMiddleNameChange={setMiddleName}
          onGivenNameChange={setGivenName}
          onBlur={() =>
            handleFieldBlur('fullName', [surname, middleName, givenName].filter(Boolean).join(', '))
          }
          helpText="填写护照上显示的英文姓名，例如：LI, MAO（姓在前，名在后）"
          error={!!errors.fullName}
          errorMessage={errors.fullName}
        />
        {warnings.fullName && !errors.fullName ? (
          <Text style={styles.warningText}>{warnings.fullName}</Text>
        ) : null}
      </View>

      <NationalitySelector
        label="国籍"
        value={nationality}
        onValueChange={(code: string) => {
          setNationality(code);
          debouncedSaveData?.();
        }}
        helpText="请选择您的国籍"
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      <InputWithValidation
        label="护照号码"
        value={passportNo}
        onChangeText={setPassportNo}
        onBlur={() => handleFieldBlur('passportNo', passportNo)}
        helpText="护照号码通常是8-9位字母和数字的组合，输入时会自动转大写"
        error={!!errors.passportNo}
        errorMessage={errors.passportNo}
        warning={!!warnings.passportNo}
        warningMessage={warnings.passportNo}
        required
        autoCapitalize="characters"
        testID="passport-number-input"
      />

      <InputWithValidation
        label="签证号（如有）"
        value={visaNumber}
        onChangeText={(text: string) => setVisaNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('visaNumber', visaNumber)}
        helpText="如有签证，请填写签证号码（仅限字母或数字）"
        error={!!errors.visaNumber}
        errorMessage={errors.visaNumber}
        warning={!!warnings.visaNumber}
        warningMessage={warnings.visaNumber}
        optional
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        keyboardType="ascii-capable"
      />

      <DateTimeInput
        label="出生日期"
        value={dob}
        onChangeText={(newValue: string) => {
          setDob(newValue);
          handleFieldBlur('dob', newValue);
        }}
        mode="date"
        dateType="past"
        helpText="选择出生日期"
        error={!!errors.dob}
        errorMessage={errors.dob}
      />

      <DateTimeInput
        label="护照有效期"
        value={expiryDate}
        onChangeText={(newValue: string) => {
          setExpiryDate(newValue);
          handleFieldBlur('expiryDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText="选择护照有效期"
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
      />

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>性别</Text>
        <GenderSelector
          value={sex}
          onChange={handleGenderChange}
          options={genderOptions}
          t={t}
          style={styles.genderSelector}
        />
      </View>
    </CollapsibleSection>
  );
};

const localStyles = StyleSheet.create({
  sectionIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    ...typography.body2,
    color: '#2C5AA0',
    flex: 1,
    lineHeight: 20,
  },
  inputWithValidationContainer: {
    marginBottom: spacing.md,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inputLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  warningText: {
    ...typography.caption,
    color: '#FF9500',
    marginTop: spacing.xs,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  genderSelector: {
    width: '100%',
  },
});

export default PassportSection;
