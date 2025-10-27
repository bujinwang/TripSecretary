/**
 * PassportSectionContent Component
 *
 * Renders the passport information form fields
 * Extracted from Singapore Travel Info Screen for better organization
 */

import React from 'react';
import { View, Text } from 'react-native';
import { InputWithValidation, PassportNameInput, NationalitySelector, DateTimeInput, FieldWarningIcon } from '../..';

const PassportSectionContent = ({
  formState,
  handleFieldBlur,
  debouncedSaveData,
  lastEditedField,
  styles,
}) => {
  // Destructure form state for easier access
  const {
    fullName, setFullName,
    nationality, setNationality,
    passportNo, setPassportNo,
    visaNumber, setVisaNumber,
    dob, setDob,
    expiryDate, setExpiryDate,
    errors,
    warnings,
  } = formState;

  return (
    <>
      <View style={styles.inputWithValidationContainer}>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <FieldWarningIcon hasWarning={!!warnings.fullName} hasError={!!errors.fullName} />
        </View>
        <PassportNameInput
          value={fullName}
          onChangeText={setFullName}
          onBlur={() => handleFieldBlur('fullName', fullName)}
          helpText="请填写汉语拼音（例如：LI, MAO）- 不要输入中文字符"
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
          setNationality(code);
          debouncedSaveData();
        }}
        helpText="请选择您的国籍"
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      <InputWithValidation
        label="护照号"
        value={passportNo}
        onChangeText={setPassportNo}
        onBlur={() => handleFieldBlur('passportNo', passportNo)}
        helpText="请输入您的护照号码"
        error={!!errors.passportNo}
        errorMessage={errors.passportNo}
        warning={!!warnings.passportNo}
        warningMessage={warnings.passportNo}
        autoCapitalize="characters"
        testID="passport-number-input"
      />

      <InputWithValidation
        label="签证号（如有）"
        value={visaNumber}
        onChangeText={(text) => setVisaNumber(text.toUpperCase())}
        onBlur={() => handleFieldBlur('visaNumber', visaNumber)}
        helpText="如有签证，请填写签证号码（仅限字母或数字）"
        error={!!errors.visaNumber}
        errorMessage={errors.visaNumber}
        warning={!!warnings.visaNumber}
        warningMessage={warnings.visaNumber}
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
          setDob(newValue);
          handleFieldBlur('dob', newValue);
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
          setExpiryDate(newValue);
          handleFieldBlur('expiryDate', newValue);
        }}
        mode="date"
        dateType="future"
        helpText="选择护照有效期"
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
      />
    </>
  );
};

export default PassportSectionContent;
