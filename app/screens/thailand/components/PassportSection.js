/**
 * PassportSection Component
 *
 * Displays passport information form section for Thailand travel info.
 * Includes fields for name, nationality, passport number, dates, and gender.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CollapsibleSection, InputWithValidation, FieldWarningIcon } from '../../../components/thailand/ThailandTravelComponents';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../../components';
import { colors, typography, spacing } from '../../../theme';

/**
 * PassportSection - Collapsible form section for passport information
 *
 * @param {Object} props
 * @param {boolean} props.isExpanded - Whether the section is expanded
 * @param {function} props.onToggle - Callback when section is toggled
 * @param {function} props.getFieldCount - Function to get field counts
 * @param {string} props.surname - Surname value
 * @param {function} props.onSurnameChange - Surname change handler
 * @param {string} props.middleName - Middle name value
 * @param {function} props.onMiddleNameChange - Middle name change handler
 * @param {string} props.givenName - Given name value
 * @param {function} props.onGivenNameChange - Given name change handler
 * @param {function} props.onNameBlur - Name field blur handler
 * @param {Object} props.errors - Validation errors object
 * @param {Object} props.warnings - Validation warnings object
 * @param {string} props.nationality - Nationality value
 * @param {function} props.onNationalityChange - Nationality change handler
 * @param {function} props.onDebouncedSave - Debounced save callback
 * @param {string} props.passportNo - Passport number value
 * @param {function} props.onPassportNoChange - Passport number change handler
 * @param {function} props.onFieldBlur - Field blur handler
 * @param {string} props.visaNumber - Visa number value
 * @param {function} props.onVisaNumberChange - Visa number change handler
 * @param {string} props.dob - Date of birth value
 * @param {function} props.onDobChange - DOB change handler
 * @param {string} props.expiryDate - Expiry date value
 * @param {function} props.onExpiryDateChange - Expiry date change handler
 * @param {function} props.renderGenderOptions - Function that renders gender selection UI
 */
const PassportSection = ({
  isExpanded,
  onToggle,
  getFieldCount,
  surname,
  onSurnameChange,
  middleName,
  onMiddleNameChange,
  givenName,
  onGivenNameChange,
  onNameBlur,
  errors,
  warnings,
  nationality,
  onNationalityChange,
  onDebouncedSave,
  passportNo,
  onPassportNoChange,
  onFieldBlur,
  visaNumber,
  onVisaNumberChange,
  dob,
  onDobChange,
  expiryDate,
  onExpiryDateChange,
  renderGenderOptions,
}) => {
  return (
    <CollapsibleSection
      title="👤 护照信息"
      subtitle="泰国海关需要核实你的身份"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={getFieldCount('passport')}
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
          onSurnameChange={onSurnameChange}
          onMiddleNameChange={onMiddleNameChange}
          onGivenNameChange={onGivenNameChange}
          onBlur={onNameBlur}
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
          onNationalityChange(code);
          onDebouncedSave();
        }}
        helpText="请选择您的国籍"
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      <InputWithValidation
        label="护照号码"
        value={passportNo}
        onChangeText={onPassportNoChange}
        onBlur={() => onFieldBlur('passportNo', passportNo)}
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
        onChangeText={(text) => onVisaNumberChange(text.toUpperCase())}
        onBlur={() => onFieldBlur('visaNumber', visaNumber)}
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
          onDobChange(newValue);
          onFieldBlur('dob', newValue);
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
          onExpiryDateChange(newValue);
          onFieldBlur('expiryDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText="选择护照有效期"
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
      />

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>性别</Text>
        {renderGenderOptions()}
      </View>
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  sectionIntro: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inputWithValidationContainer: {
    marginBottom: spacing.md,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
});

export default PassportSection;
