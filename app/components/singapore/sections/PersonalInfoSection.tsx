/**
 * PersonalInfoSection Component
 *
 * Handles personal information input for Singapore Travel Info Screen
 */

import React from 'react';
import { View, Text, type TextStyle, type ViewStyle } from 'react-native';
import Input from '../../Input';
import { NationalitySelector } from '../..';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type HandleFieldChange = (
  field: string,
  value: string,
  setter?: (nextValue: string) => void,
) => void;

type HandleFieldBlur = (field: string, value: string) => void;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export interface SingaporePersonalInfoSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  occupation: string;
  cityOfResidence: string;
  residentCountry: string;
  phoneCode: string;
  phoneNumber: string;
  email: string;
  setOccupation: (value: string) => void;
  setCityOfResidence: (value: string) => void;
  setResidentCountry: (value: string) => void;
  setPhoneCode: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setEmail: (value: string) => void;
  handleFieldChange: HandleFieldChange;
  handleFieldBlur: HandleFieldBlur;
  errors: ValidationMap;
  warnings: ValidationMap;
  t: TranslationFn;
  styles: Record<string, ViewStyle | TextStyle>;
}

const PersonalInfoSection: React.FC<SingaporePersonalInfoSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
  occupation,
  cityOfResidence,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,
  setOccupation,
  setCityOfResidence,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,
  handleFieldChange,
  handleFieldBlur,
  errors,
  warnings,
  t,
  styles,
}) => {
  return (
    <CollapsibleSection
      title={t('singapore.travelInfo.sections.personal', { defaultValue: '🙋 个人信息' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.occupation', { defaultValue: '职业' })}
        </Text>
        <Input
          value={occupation}
          onChangeText={(value) => handleFieldChange('occupation', value, setOccupation)}
          onBlur={() => handleFieldBlur('occupation', occupation)}
          placeholder={t('singapore.travelInfo.occupationPlaceholder', { defaultValue: '请输入职业 (英文)' })}
          error={!!errors.occupation}
          errorMessage={errors.occupation}
        />
        {warnings.occupation && !errors.occupation ? (
          <Text style={styles.warningText as TextStyle}>{warnings.occupation}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.cityOfResidence', { defaultValue: '居住城市' })}
        </Text>
        <Input
          value={cityOfResidence}
          onChangeText={(value) => handleFieldChange('cityOfResidence', value, setCityOfResidence)}
          onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
          placeholder={t('singapore.travelInfo.cityOfResidencePlaceholder', { defaultValue: '请输入居住城市 (英文)' })}
          error={!!errors.cityOfResidence}
          errorMessage={errors.cityOfResidence}
        />
        {warnings.cityOfResidence && !errors.cityOfResidence ? (
          <Text style={styles.warningText as TextStyle}>{warnings.cityOfResidence}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.residentCountry', { defaultValue: '居住国家' })}
        </Text>
        <NationalitySelector
          value={residentCountry}
          onValueChange={(value: string) => handleFieldChange('residentCountry', value, setResidentCountry)}
          onBlur={() => handleFieldBlur('residentCountry', residentCountry)}
          error={!!errors.residentCountry}
          errorMessage={errors.residentCountry}
        />
        {warnings.residentCountry && !errors.residentCountry ? (
          <Text style={styles.warningText as TextStyle}>{warnings.residentCountry}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.phoneNumber', { defaultValue: '联系电话' })}
        </Text>
        <View style={styles.phoneInputContainer as ViewStyle}>
          <View style={styles.phoneCodeContainer as ViewStyle}>
            <Input
              value={phoneCode}
              onChangeText={(value) => handleFieldChange('phoneCode', value, setPhoneCode)}
              onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
              placeholder="+86"
              style={styles.phoneCodeInput as ViewStyle}
              keyboardType="phone-pad"
              error={!!errors.phoneCode}
            />
          </View>
          <View style={styles.phoneNumberContainer as ViewStyle}>
            <Input
              value={phoneNumber}
              onChangeText={(value) => handleFieldChange('phoneNumber', value, setPhoneNumber)}
              onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
              placeholder={t('singapore.travelInfo.phoneNumberPlaceholder', { defaultValue: '请输入手机号' })}
              keyboardType="phone-pad"
              error={!!errors.phoneNumber}
              errorMessage={errors.phoneNumber}
            />
          </View>
        </View>
        {warnings.phoneNumber && !errors.phoneNumber ? (
          <Text style={styles.warningText as TextStyle}>{warnings.phoneNumber}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.email', { defaultValue: '电子邮箱' })}
        </Text>
        <Input
          value={email}
          onChangeText={(value) => handleFieldChange('email', value, setEmail)}
          onBlur={() => handleFieldBlur('email', email)}
          placeholder={t('singapore.travelInfo.emailPlaceholder', { defaultValue: '请输入邮箱地址' })}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!errors.email}
          errorMessage={errors.email}
        />
        {warnings.email && !errors.email ? (
          <Text style={styles.warningText as TextStyle}>{warnings.email}</Text>
        ) : null}
      </View>
    </CollapsibleSection>
  );
};

export default PersonalInfoSection;
