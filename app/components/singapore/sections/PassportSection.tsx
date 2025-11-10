/**
 * PassportSection Component
 *
 * Handles passport information input for Singapore Travel Info Screen
 * Simplified component demonstrating the refactoring pattern
 */

import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle, type TextStyle } from 'react-native';
import Input from '../../Input';
import { NationalitySelector, DateTimeInput } from '../..';
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

type HandleFieldBlur = (field: string, value: string | undefined) => void;

type HandleUserInteraction = (field: string, value: string) => void;

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

export interface SingaporePassportSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  passportNo: string;
  visaNumber?: string;
  fullName: string;
  nationality: string;
  dob: string;
  expiryDate: string;
  sex: string;
  setPassportNo: (value: string) => void;
  setVisaNumber: (value: string) => void;
  setFullName: (value: string) => void;
  setNationality: (value: string) => void;
  setDob: (value: string) => void;
  setExpiryDate: (value: string) => void;
  setSex: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldChange: HandleFieldChange;
  handleUserInteraction?: HandleUserInteraction;
  handleFieldBlur: HandleFieldBlur;
  t: TranslationFn;
  styles: Record<string, ViewStyle | TextStyle>;
}

const PassportSection: React.FC<SingaporePassportSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
  passportNo,
  visaNumber,
  fullName,
  nationality,
  dob,
  expiryDate,
  sex,
  setPassportNo,
  setVisaNumber,
  setFullName,
  setNationality,
  setDob,
  setExpiryDate,
  setSex,
  errors,
  warnings,
  handleFieldChange,
  handleUserInteraction,
  handleFieldBlur,
  t,
  styles,
}) => {
  return (
    <CollapsibleSection
      title={t('singapore.travelInfo.sections.passport', { defaultValue: '📘 护照信息' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
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
        {warnings.passportNo && !errors.passportNo ? (
          <Text style={styles.warningText as TextStyle}>{warnings.passportNo}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.visaNumber', { defaultValue: '签证号码 (可选)' })}
        </Text>
        <Input
          value={visaNumber ?? ''}
          onChangeText={(value) => handleFieldChange('visaNumber', value, setVisaNumber)}
          onBlur={() => handleFieldBlur('visaNumber', visaNumber)}
          placeholder={t('singapore.travelInfo.visaNumberPlaceholder', { defaultValue: '如有签证请输入' })}
          error={!!errors.visaNumber}
          errorMessage={errors.visaNumber}
        />
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
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
        {warnings.fullName && !errors.fullName ? (
          <Text style={styles.warningText as TextStyle}>{warnings.fullName}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.nationality', { defaultValue: '国籍' })}
        </Text>
        <NationalitySelector
          value={nationality}
          onChange={(code: string) => handleFieldChange('nationality', code, setNationality)}
          onBlur={() => handleFieldBlur('nationality', nationality)}
          error={!!errors.nationality}
          errorMessage={errors.nationality}
        />
        {warnings.nationality && !errors.nationality ? (
          <Text style={styles.warningText as TextStyle}>{warnings.nationality}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.dob', { defaultValue: '出生日期' })}
        </Text>
        <DateTimeInput
          value={dob}
          onChangeText={(value: string) => handleFieldChange('dob', value, setDob)}
          onBlur={(value: string) => handleFieldBlur('dob', value)}
          mode="date"
          placeholder={t('singapore.travelInfo.dobPlaceholder', { defaultValue: 'YYYY-MM-DD' })}
          error={!!errors.dob}
          errorMessage={errors.dob}
        />
        {warnings.dob && !errors.dob ? (
          <Text style={styles.warningText as TextStyle}>{warnings.dob}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.expiryDate', { defaultValue: '护照有效期' })}
        </Text>
        <DateTimeInput
          value={expiryDate}
          onChangeText={(value: string) => handleFieldChange('expiryDate', value, setExpiryDate)}
          onBlur={(value: string) => handleFieldBlur('expiryDate', value)}
          mode="date"
          placeholder={t('singapore.travelInfo.expiryDatePlaceholder', { defaultValue: 'YYYY-MM-DD' })}
          error={!!errors.expiryDate}
          errorMessage={errors.expiryDate}
        />
        {warnings.expiryDate && !errors.expiryDate ? (
          <Text style={styles.warningText as TextStyle}>{warnings.expiryDate}</Text>
        ) : null}
      </View>

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>
          {t('singapore.travelInfo.sex', { defaultValue: '性别' })}
        </Text>
        <View style={styles.genderContainer as ViewStyle}>
          {['Male', 'Female'].map((gender) => {
            const isSelected = sex === gender;
            return (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton as ViewStyle,
                  isSelected && (styles.genderButtonActive as ViewStyle),
                ]}
                onPress={() => {
                  handleFieldChange('sex', gender, setSex);
                  handleUserInteraction?.('sex', gender);
                  handleFieldBlur('sex', gender);
                }}
              >
                <Text
                  style={[
                    styles.genderButtonText as TextStyle,
                    isSelected && (styles.genderButtonTextActive as TextStyle),
                  ]}
                >
                  {gender === 'Male' ? '男' : '女'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </CollapsibleSection>
  );
};

export default PassportSection;
