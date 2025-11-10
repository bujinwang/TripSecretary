/**
 * PersonalInfoSection Component
 *
 * Displays personal information form section (occupation, contact, etc.)
 * for Hong Kong Travel Info Screen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { NationalitySelector } from '../../../components';
import { CollapsibleSection, InputWithValidation } from '../../thailand/ThailandTravelComponents';
import OptionSelector from '../../thailand/OptionSelector';
import Input from '../../../components/Input';
import { getOccupationOptions } from '../../../screens/hongkong/constants';
import { getPhoneCode } from '../../../data/phoneCodes';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type HongKongPersonalInfoSectionProps = {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  occupation: string;
  customOccupation: string;
  cityOfResidence: string;
  residentCountry: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  cityOfResidenceLabel: string;
  cityOfResidenceHelpText?: string;
  cityOfResidencePlaceholder?: string;
  setOccupation: (value: string) => void;
  setCustomOccupation: (value: string) => void;
  setCityOfResidence: (value: string) => void;
  setResidentCountry: (value: string) => void;
  setPhoneCode: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setEmail: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: (field: string, value: string) => void;
  lastEditedField?: string | null;
  debouncedSaveData?: () => void;
  styles?: typeof localStyles;
};

const PersonalInfoSection: React.FC<HongKongPersonalInfoSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  occupation,
  customOccupation,
  cityOfResidence,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,
  cityOfResidenceLabel,
  cityOfResidenceHelpText,
  cityOfResidencePlaceholder,
  setOccupation,
  setCustomOccupation,
  setCityOfResidence,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  debouncedSaveData,
  styles: parentStyles,
}) => {
  const styles = parentStyles || localStyles;

  return (
    <CollapsibleSection
      title="👤 个人信息"
      subtitle="香港需要了解你的基本信息"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>📱</Text>
        <Text style={styles.sectionIntroText}>
          提供你的基本个人信息，包括职业、居住地和联系方式，以便香港海关了解你的情况。
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>职业</Text>
        <OptionSelector
          options={getOccupationOptions(t)}
          value={occupation}
          onSelect={(value: string) => {
            setOccupation(value);
            if (value !== 'OTHER') {
              setCustomOccupation('');
              handleFieldBlur('occupation', value);
            }
            debouncedSaveData?.();
          }}
          customValue={customOccupation}
          onCustomChange={(text: string) => {
            setCustomOccupation(text.toUpperCase());
          }}
          onCustomBlur={() => {
            const finalOccupation = customOccupation.trim() ? customOccupation : occupation;
            handleFieldBlur('occupation', finalOccupation);
            debouncedSaveData?.();
          }}
          customLabel="请输入您的职业"
          customPlaceholder="例如：ACCOUNTANT, ENGINEER 等"
          customHelpText="请用英文填写您的职业"
        />
        {errors.occupation ? <Text style={styles.errorText}>{errors.occupation}</Text> : null}
        {warnings.occupation && !errors.occupation ? (
          <Text style={styles.warningText}>{warnings.occupation}</Text>
        ) : null}
      </View>

      <InputWithValidation
        label={cityOfResidenceLabel}
        value={cityOfResidence}
        onChangeText={(text: string) => {
          setCityOfResidence(text.toUpperCase());
        }}
        onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
        helpText={cityOfResidenceHelpText}
        error={!!errors.cityOfResidence}
        errorMessage={errors.cityOfResidence}
        warning={!!warnings.cityOfResidence}
        warningMessage={warnings.cityOfResidence}
        fieldName="cityOfResidence"
        lastEditedField={lastEditedField ?? undefined}
        autoCapitalize="characters"
        placeholder={cityOfResidencePlaceholder}
      />

      <NationalitySelector
        label="居住国家"
        value={residentCountry}
        onValueChange={(code: string) => {
          setResidentCountry(code);
          setPhoneCode(getPhoneCode(code));
          debouncedSaveData?.();
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
        lastEditedField={lastEditedField ?? undefined}
        testID="email-input"
      />
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
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: '#FF9500',
    marginTop: spacing.xs,
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
