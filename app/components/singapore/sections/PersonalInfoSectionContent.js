/**
 * PersonalInfoSectionContent Component
 *
 * Renders the personal information form fields
 * Extracted from Singapore Travel Info Screen for better organization
 */

import React from 'react';
import { View, Text } from 'react-native';
import { InputWithValidation, Input, NationalitySelector } from '../..';

const PersonalInfoSectionContent = ({
  formState,
  handleFieldBlur,
  debouncedSaveData,
  renderGenderOptions,
  getPhoneCode,
  lastEditedField,
  styles,
}) => {
  // Destructure form state for easier access
  const {
    occupation, setOccupation,
    cityOfResidence, setCityOfResidence,
    residentCountry, setResidentCountry,
    phoneCode, setPhoneCode,
    phoneNumber, setPhoneNumber,
    email, setEmail,
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
        lastEditedField={lastEditedField}
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

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>性别</Text>
        {renderGenderOptions()}
      </View>
    </>
  );
};

export default PersonalInfoSectionContent;
