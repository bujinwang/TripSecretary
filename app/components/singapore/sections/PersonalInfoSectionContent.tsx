/**
 * PersonalInfoSectionContent Component
 *
 * Renders the personal information form fields
 * Extracted from Singapore Travel Info Screen for better organization
 */

import React from 'react';
import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import { InputWithValidation, Input, NationalitySelector } from '../..';

type ValidationMap = Record<string, string | undefined>;

type PersonalInfoFormState = {
  occupation: string;
  setOccupation: (value: string) => void;
  cityOfResidence: string;
  setCityOfResidence: (value: string) => void;
  residentCountry: string;
  setResidentCountry: (value: string) => void;
  phoneCode: string;
  setPhoneCode: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
};

type HandleFieldBlur = (field: string, value: string) => void;

type GetPhoneCode = (country: string) => string;

type RenderGenderOptions = () => React.ReactNode;

export interface SingaporePersonalInfoSectionContentProps {
  formState: PersonalInfoFormState;
  handleFieldBlur: HandleFieldBlur;
  debouncedSaveData: () => void;
  renderGenderOptions: RenderGenderOptions;
  getPhoneCode: GetPhoneCode;
  lastEditedField?: string | null;
  styles: Record<string, ViewStyle | TextStyle>;
}

const PersonalInfoSectionContent: React.FC<SingaporePersonalInfoSectionContentProps> = ({
  formState,
  handleFieldBlur,
  debouncedSaveData,
  renderGenderOptions,
  getPhoneCode,
  lastEditedField,
  styles,
}) => {
  const {
    occupation,
    setOccupation,
    cityOfResidence,
    setCityOfResidence,
    residentCountry,
    setResidentCountry,
    phoneCode,
    setPhoneCode,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    errors,
    warnings,
  } = formState;

  return (
    <>
      <InputWithValidation
        label="职业"
        value={occupation}
        onChangeText={(text) => setOccupation(text.toUpperCase())}
        onBlur={() => handleFieldBlur('occupation', occupation)}
        helpText="请输入您的职业 (请使用英文)"
        error={!!errors.occupation}
        errorMessage={errors.occupation}
        warning={!!warnings.occupation}
        warningMessage={warnings.occupation}
        fieldName="occupation"
        lastEditedField={lastEditedField ?? undefined}
        autoCapitalize="characters"
      />

      <Input
        label="居住城市"
        value={cityOfResidence}
        onChangeText={(text) => setCityOfResidence(text.toUpperCase())}
        onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
        helpText="请输入您居住的城市 (请使用英文)"
        error={!!errors.cityOfResidence}
        errorMessage={errors.cityOfResidence}
        autoCapitalize="characters"
      />

      <NationalitySelector
        label="居住国家"
        value={residentCountry}
        onValueChange={(code: string) => {
          setResidentCountry(code);
          setPhoneCode(getPhoneCode(code));
          debouncedSaveData();
        }}
        helpText="请选择您居住的国家"
        error={!!errors.residentCountry}
        errorMessage={errors.residentCountry}
      />

      <View style={styles.phoneInputContainer as ViewStyle}>
        <Input
          label="国家代码"
          value={phoneCode}
          onChangeText={setPhoneCode}
          onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
          keyboardType="phone-pad"
          maxLength={5}
          error={!!errors.phoneCode}
          errorMessage={errors.phoneCode}
          style={styles.phoneCodeInput as ViewStyle}
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
          style={styles.phoneInput as ViewStyle}
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

      <View style={styles.fieldContainer as ViewStyle}>
        <Text style={styles.fieldLabel as TextStyle}>性别</Text>
        {renderGenderOptions()}
      </View>
    </>
  );
};

export default PersonalInfoSectionContent;
