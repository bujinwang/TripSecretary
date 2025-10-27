/**
 * PassportSection Component
 *
 * Displays passport information form section
 * for Thailand Travel Info Screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../../components';
import GenderSelector from '../../GenderSelector';
import { CollapsibleSection, FieldWarningIcon, InputWithValidation } from '../ThailandTravelComponents';
import { GENDER_OPTIONS } from '../../../screens/thailand/constants';

const PassportSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  // Form state
  surname,
  middleName,
  givenName,
  nationality,
  passportNo,
  visaNumber,
  dob,
  expiryDate,
  sex,
  // Setters
  setSurname,
  setMiddleName,
  setGivenName,
  setNationality,
  setPassportNo,
  setVisaNumber,
  setDob,
  setExpiryDate,
  setSex,
  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  // Actions
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  // Styles from parent (optional - can use inline styles if not provided)
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;

  const handleGenderChange = async (newSex) => {
    setSex(newSex);
    // Save immediately to ensure gender is saved without requiring other field interaction
    try {
      await saveDataToSecureStorageWithOverride({ sex: newSex });
      setLastEditedAt(new Date());
    } catch (error) {
      console.error('Failed to save gender:', error);
    }
  };

  return (
    <CollapsibleSection
      title="👤 护照信息"
      subtitle="泰国海关需要核实你的身份"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Border Crossing Context for Personal Info */}
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
          onBlur={() => handleFieldBlur('fullName', [surname, middleName, givenName].filter(Boolean).join(', '))}
          helpText="填写护照上显示的英文姓名，例如：LI, MAO（姓在前，名在后）"
          error={!!errors.fullName}
          errorMessage={errors.fullName}
        />
        {warnings.fullName && !errors.fullName && (
          <Text style={styles.warningText}>{warnings.fullName}</Text>
        )}
      </View>

      <NationalitySelector
        label="国籍"
        value={nationality}
        onValueChange={(code) => {
          setNationality(code);
          debouncedSaveData();
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
        required={true}
        autoCapitalize="characters"
        testID="passport-number-input"
      />

      <InputWithValidation
        label="签证号（如有）"
        value={visaNumber}
        onChangeText={(text) => setVisaNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('visaNumber', visaNumber)}
        helpText="如有签证，请填写签证号码（仅限字母或数字）"
        error={!!errors.visaNumber}
        errorMessage={errors.visaNumber}
        warning={!!warnings.visaNumber}
        warningMessage={warnings.visaNumber}
        optional={true}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        keyboardType="ascii-capable"
      />

      <DateTimeInput
        label="出生日期"
        value={dob}
        onChangeText={(newValue) => {
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
        onChangeText={(newValue) => {
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
          t={t}
          options={GENDER_OPTIONS}
        />
      </View>
    </CollapsibleSection>
  );
};

// Local styles (fallback if parent styles not provided)
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  optionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default PassportSection;
