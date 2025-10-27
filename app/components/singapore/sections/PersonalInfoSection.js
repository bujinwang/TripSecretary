/**
 * PersonalInfoSection Component
 *
 * Handles personal information input for Singapore Travel Info Screen
 */

import React from 'react';
import { View, Text } from 'react-native';
import Input from '../../Input';
import { NationalitySelector } from '../..';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';

const PersonalInfoSection = ({
  // Section state
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  occupation,
  cityOfResidence,
  residentCountry,
  phoneCode,
  phoneNumber,
  email,

  // Setters
  setOccupation,
  setCityOfResidence,
  setResidentCountry,
  setPhoneCode,
  setPhoneNumber,
  setEmail,

  // Validation
  errors,
  warnings,
  handleFieldChange,
  handleFieldBlur,

  // i18n
  t,

  // Styles
  styles,
}) => {
  return (
    <CollapsibleSection
      title={t('singapore.travelInfo.sections.personal', { defaultValue: '🙋 个人信息' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Occupation */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
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
        {warnings.occupation && !errors.occupation && (
          <Text style={styles.warningText}>{warnings.occupation}</Text>
        )}
      </View>

      {/* City of Residence */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
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
        {warnings.cityOfResidence && !errors.cityOfResidence && (
          <Text style={styles.warningText}>{warnings.cityOfResidence}</Text>
        )}
      </View>

      {/* Resident Country */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.residentCountry', { defaultValue: '居住国家' })}
        </Text>
        <NationalitySelector
          value={residentCountry}
          onChange={(value) => handleFieldChange('residentCountry', value, setResidentCountry)}
          onBlur={() => handleFieldBlur('residentCountry', residentCountry)}
          error={!!errors.residentCountry}
          errorMessage={errors.residentCountry}
        />
        {warnings.residentCountry && !errors.residentCountry && (
          <Text style={styles.warningText}>{warnings.residentCountry}</Text>
        )}
      </View>

      {/* Phone Number */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.phoneNumber', { defaultValue: '联系电话' })}
        </Text>
        <View style={styles.phoneInputContainer}>
          <View style={styles.phoneCodeContainer}>
            <Input
              value={phoneCode}
              onChangeText={(value) => handleFieldChange('phoneCode', value, setPhoneCode)}
              onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
              placeholder="+86"
              style={styles.phoneCodeInput}
              error={!!errors.phoneCode}
            />
          </View>
          <View style={styles.phoneNumberContainer}>
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
        {warnings.phoneNumber && !errors.phoneNumber && (
          <Text style={styles.warningText}>{warnings.phoneNumber}</Text>
        )}
      </View>

      {/* Email */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
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
        {warnings.email && !errors.email && (
          <Text style={styles.warningText}>{warnings.email}</Text>
        )}
      </View>
    </CollapsibleSection>
  );
};

export default PersonalInfoSection;
