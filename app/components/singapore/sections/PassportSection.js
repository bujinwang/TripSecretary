/**
 * PassportSection Component
 *
 * Handles passport information input for Singapore Travel Info Screen
 * Simplified component demonstrating the refactoring pattern
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Input from '../../Input';
import { NationalitySelector, DateTimeInput } from '../..';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';

const PassportSection = ({
  // Section state
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  passportNo,
  visaNumber,
  fullName,
  nationality,
  dob,
  expiryDate,
  sex,

  // Setters
  setPassportNo,
  setVisaNumber,
  setFullName,
  setNationality,
  setDob,
  setExpiryDate,
  setSex,

  // Validation
  errors,
  warnings,
  handleFieldChange,
  handleUserInteraction,
  handleFieldBlur,

  // i18n
  t,

  // Styles
  styles,
}) => {
  return (
    <CollapsibleSection
      title={t('singapore.travelInfo.sections.passport', { defaultValue: '📘 护照信息' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Passport Number */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.passportNo', { defaultValue: '护照号码' })}
        </Text>
        <Input
          value={passportNo}
          onChangeText={(value) => handleFieldChange('passportNo', value, setPassportNo)}
          onBlur={() => handleFieldBlur('passportNo', passportNo)}
          placeholder={t('singapore.travelInfo.passportNoPlaceholder', { defaultValue: '请输入护照号码' })}
          error={!!errors.passportNo}
          errorMessage={errors.passportNo}
        />
        {warnings.passportNo && !errors.passportNo && (
          <Text style={styles.warningText}>{warnings.passportNo}</Text>
        )}
      </View>

      {/* Visa Number (Optional) */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.visaNumber', { defaultValue: '签证号码 (可选)' })}
        </Text>
        <Input
          value={visaNumber}
          onChangeText={(value) => handleFieldChange('visaNumber', value, setVisaNumber)}
          onBlur={() => handleFieldBlur('visaNumber', visaNumber)}
          placeholder={t('singapore.travelInfo.visaNumberPlaceholder', { defaultValue: '如有签证请输入' })}
          error={!!errors.visaNumber}
          errorMessage={errors.visaNumber}
        />
      </View>

      {/* Full Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.fullName', { defaultValue: '护照姓名 (英文)' })}
        </Text>
        <Input
          value={fullName}
          onChangeText={(value) => handleFieldChange('fullName', value, setFullName)}
          onBlur={() => handleFieldBlur('fullName', fullName)}
          placeholder={t('singapore.travelInfo.fullNamePlaceholder', { defaultValue: 'SURNAME, Given Names' })}
          error={!!errors.fullName}
          errorMessage={errors.fullName}
        />
        {warnings.fullName && !errors.fullName && (
          <Text style={styles.warningText}>{warnings.fullName}</Text>
        )}
      </View>

      {/* Nationality */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.nationality', { defaultValue: '国籍' })}
        </Text>
        <NationalitySelector
          value={nationality}
          onChange={(code) => handleFieldChange('nationality', code, setNationality)}
          onBlur={() => handleFieldBlur('nationality', nationality)}
          error={!!errors.nationality}
          errorMessage={errors.nationality}
        />
        {warnings.nationality && !errors.nationality && (
          <Text style={styles.warningText}>{warnings.nationality}</Text>
        )}
      </View>

      {/* Date of Birth */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.dob', { defaultValue: '出生日期' })}
        </Text>
        <DateTimeInput
          value={dob}
          onChange={(value) => handleFieldChange('dob', value, setDob)}
          onBlur={() => handleFieldBlur('dob', dob)}
          mode="date"
          placeholder={t('singapore.travelInfo.dobPlaceholder', { defaultValue: 'YYYY-MM-DD' })}
          error={!!errors.dob}
          errorMessage={errors.dob}
        />
        {warnings.dob && !errors.dob && (
          <Text style={styles.warningText}>{warnings.dob}</Text>
        )}
      </View>

      {/* Expiry Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.expiryDate', { defaultValue: '护照有效期' })}
        </Text>
        <DateTimeInput
          value={expiryDate}
          onChange={(value) => handleFieldChange('expiryDate', value, setExpiryDate)}
          onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
          mode="date"
          placeholder={t('singapore.travelInfo.expiryDatePlaceholder', { defaultValue: 'YYYY-MM-DD' })}
          error={!!errors.expiryDate}
          errorMessage={errors.expiryDate}
        />
        {warnings.expiryDate && !errors.expiryDate && (
          <Text style={styles.warningText}>{warnings.expiryDate}</Text>
        )}
      </View>

      {/* Gender */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          {t('singapore.travelInfo.sex', { defaultValue: '性别' })}
        </Text>
        <View style={styles.genderContainer}>
          {['Male', 'Female'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.genderButton,
                sex === gender && styles.genderButtonActive,
              ]}
              onPress={() => {
                handleFieldChange('sex', gender, setSex);
                handleUserInteraction?.('sex', gender);
                handleFieldBlur('sex', gender);
              }}
            >
              <Text style={[
                styles.genderButtonText,
                sex === gender && styles.genderButtonTextActive,
              ]}>
                {gender === 'Male' ? '男' : '女'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </CollapsibleSection>
  );
};

export default PassportSection;
