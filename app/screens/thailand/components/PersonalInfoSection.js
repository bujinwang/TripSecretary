/**
 * PersonalInfoSection Component
 *
 * Displays personal information form section for Thailand travel info.
 * Includes fields for occupation, residence, contact information.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CollapsibleSection, InputWithValidation } from '../../../components/thailand/ThailandTravelComponents';
import { NationalitySelector } from '../../../components';
import Input from '../../../components/Input';
import { colors, typography, spacing } from '../../../theme';

/**
 * PersonalInfoSection - Collapsible form section for personal information
 *
 * @param {Object} props
 * @param {boolean} props.isExpanded - Whether the section is expanded
 * @param {function} props.onToggle - Callback when section is toggled
 * @param {function} props.getFieldCount - Function to get field counts
 * @param {string} props.occupation - Occupation value
 * @param {function} props.onOccupationChange - Occupation change handler
 * @param {function} props.onFieldBlur - Field blur handler
 * @param {Object} props.errors - Validation errors object
 * @param {Object} props.warnings - Validation warnings object
 * @param {string} props.lastEditedField - Last edited field name
 * @param {string} props.cityOfResidence - City of residence value
 * @param {function} props.onCityOfResidenceChange - City change handler
 * @param {string} props.cityOfResidenceLabel - Label for city field
 * @param {string} props.cityOfResidenceHelpText - Help text for city field
 * @param {string} props.cityOfResidencePlaceholder - Placeholder for city field
 * @param {string} props.residentCountry - Resident country value
 * @param {function} props.onResidentCountryChange - Country change handler
 * @param {function} props.onPhoneCodeChange - Phone code change handler via country change
 * @param {function} props.onDebouncedSave - Debounced save callback
 * @param {string} props.phoneCode - Phone code value
 * @param {function} props.onPhoneCodeDirectChange - Phone code direct change handler
 * @param {string} props.phoneNumber - Phone number value
 * @param {function} props.onPhoneNumberChange - Phone number change handler
 * @param {string} props.email - Email value
 * @param {function} props.onEmailChange - Email change handler
 */
const PersonalInfoSection = ({
  isExpanded,
  onToggle,
  getFieldCount,
  occupation,
  onOccupationChange,
  onFieldBlur,
  errors,
  warnings,
  lastEditedField,
  cityOfResidence,
  onCityOfResidenceChange,
  cityOfResidenceLabel,
  cityOfResidenceHelpText,
  cityOfResidencePlaceholder,
  residentCountry,
  onResidentCountryChange,
  onPhoneCodeChange,
  onDebouncedSave,
  phoneCode,
  onPhoneCodeDirectChange,
  phoneNumber,
  onPhoneNumberChange,
  email,
  onEmailChange,
}) => {
  return (
    <CollapsibleSection
      title="👤 个人信息"
      subtitle="泰国需要了解你的基本信息"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={getFieldCount('personal')}
    >
      {/* Border Crossing Context for Personal Info */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>📱</Text>
        <Text style={styles.sectionIntroText}>
          提供你的基本个人信息，包括职业、居住地和联系方式，以便泰国海关了解你的情况。
        </Text>
      </View>

      <InputWithValidation
        label="职业"
        value={occupation}
        onChangeText={(text) => {
          onOccupationChange(text.toUpperCase());
        }}
        onBlur={() => onFieldBlur('occupation', occupation)}
        helpText="填写你的工作职位，例如：软件工程师、学生、退休人员等（用英文）"
        error={!!errors.occupation}
        errorMessage={errors.occupation}
        warning={!!warnings.occupation}
        warningMessage={warnings.occupation}
        fieldName="occupation"
        lastEditedField={lastEditedField}
        autoCapitalize="characters"
      />

      <InputWithValidation
        label={cityOfResidenceLabel}
        value={cityOfResidence}
        onChangeText={(text) => {
          onCityOfResidenceChange(text.toUpperCase());
        }}
        onBlur={() => onFieldBlur('cityOfResidence', cityOfResidence)}
        helpText={cityOfResidenceHelpText}
        error={!!errors.cityOfResidence}
        errorMessage={errors.cityOfResidence}
        warning={!!warnings.cityOfResidence}
        warningMessage={warnings.cityOfResidence}
        fieldName="cityOfResidence"
        lastEditedField={lastEditedField}
        autoCapitalize="characters"
        placeholder={cityOfResidencePlaceholder}
      />

      <NationalitySelector
        label="居住国家"
        value={residentCountry}
        onValueChange={(code) => {
          onResidentCountryChange(code);
          onPhoneCodeChange(code);
          onDebouncedSave();
        }}
        helpText="请选择您居住的国家"
        error={!!errors.residentCountry}
        errorMessage={errors.residentCountry}
      />

      <View style={styles.phoneInputContainer}>
        <Input
          label="国家代码"
          value={phoneCode}
          onChangeText={onPhoneCodeDirectChange}
          onBlur={() => onFieldBlur('phoneCode', phoneCode)}
          keyboardType="phone-pad"
          maxLength={5}
          error={!!errors.phoneCode}
          errorMessage={errors.phoneCode}
          style={styles.phoneCodeInput}
        />
        <Input
          label="电话号码"
          value={phoneNumber}
          onChangeText={onPhoneNumberChange}
          onBlur={() => onFieldBlur('phoneNumber', phoneNumber)}
          keyboardType="phone-pad"
          helpText="请输入您的电话号码"
          error={!!errors.phoneNumber}
          errorMessage={errors.phoneNumber}
          style={styles.phoneInput}
        />
      </View>

      <InputWithValidation
        label="电子邮箱"
        value={email}
        onChangeText={onEmailChange}
        onBlur={() => onFieldBlur('email', email)}
        keyboardType="email-address"
        helpText="请输入您的电子邮箱地址"
        error={!!errors.email}
        errorMessage={errors.email}
        warning={!!warnings.email}
        warningMessage={warnings.email}
        fieldName="email"
        lastEditedField={lastEditedField}
        testID="email-input"
      />
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
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  phoneCodeInput: {
    flex: 1,
  },
  phoneInput: {
    flex: 2,
  },
});

export default PersonalInfoSection;
