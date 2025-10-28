/**
 * PersonalInfoSection Component
 *
 * Displays personal information form section (occupation, contact, etc.)
 * for Thailand Travel Info Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { NationalitySelector } from '../../../components';
import { CollapsibleSection, InputWithValidation } from '../ThailandTravelComponents';
import OccupationSelector from '../../OccupationSelector';
import Input from '../../../components/Input';
import { getPhoneCode } from '../../../data/phoneCodes';

const PersonalInfoSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  // Form state
  occupation,
  customOccupation,
  cityOfResidence,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,
  // Computed values
  cityOfResidenceLabel,
  cityOfResidenceHelpText,
  cityOfResidencePlaceholder,
  // Setters
  setOccupation,
  setCustomOccupation,
  setCityOfResidence,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,
  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  // Actions
  debouncedSaveData,
  // Styles from parent (optional)
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;

  return (
    <CollapsibleSection
      title="👤 个人信息"
      subtitle="泰国需要了解你的基本信息"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Border Crossing Context for Personal Info */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>📱</Text>
        <Text style={styles.sectionIntroText}>
          提供你的基本个人信息，包括职业、居住地和联系方式，以便泰国海关了解你的情况。
        </Text>
      </View>

      <OccupationSelector
        label="职业"
        value={occupation}
        onValueChange={(value) => {
          setOccupation(value);
          if (value !== 'OTHER') {
            setCustomOccupation('');
            handleFieldBlur('occupation', value);
          }
          debouncedSaveData();
        }}
        customValue={customOccupation}
        onCustomChange={(text) => {
          setCustomOccupation(text.toUpperCase());
        }}
        onCustomBlur={() => {
          const finalOccupation = customOccupation.trim() ? customOccupation : occupation;
          handleFieldBlur('occupation', finalOccupation);
          debouncedSaveData();
        }}
        customLabel="请输入您的职业"
        customPlaceholder="例如：ACCOUNTANT, ENGINEER 等"
        customHelpText="请用英文填写您的职业"
        helpText={!errors.occupation && warnings.occupation ? warnings.occupation : "请选择您的职业"}
        error={!!errors.occupation}
        errorMessage={errors.occupation}
      />

      <InputWithValidation
        label={cityOfResidenceLabel}
        value={cityOfResidence}
        onChangeText={(text) => {
          setCityOfResidence(text.toUpperCase());
        }}
        onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
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
          setResidentCountry(code);
          setPhoneCode(getPhoneCode(code));
          debouncedSaveData();
        }}
        helpText="请选择您居住的国家"
        error={!!errors.residentCountry}
        errorMessage={errors.residentCountry}
      />

      <View style={styles.phoneInputContainer}>
        <Input
          label="国家代码"
          value={phoneCode}
          onChangeText={setPhoneCode}
          onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
          keyboardType="phone-pad"
          maxLength={5}
          error={!!errors.phoneCode}
          errorMessage={errors.phoneCode}
          style={styles.phoneCodeInput}
        />
        <Input
          label="电话号码"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
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
        onChangeText={setEmail}
        onBlur={() => handleFieldBlur('email', email)}
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
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  phoneCodeInput: {
    flex: 0.3,
  },
  phoneInput: {
    flex: 0.7,
  },
});

export default PersonalInfoSection;
