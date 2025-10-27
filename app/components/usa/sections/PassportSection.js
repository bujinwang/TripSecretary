import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CollapsibleSection from '../../CollapsibleSection';
import PassportNameInput from '../../PassportNameInput';
import NationalitySelector from '../../NationalitySelector';
import DateTimeInput from '../../DateTimeInput';
import Input from '../../Input';

/**
 * PassportSection Component
 * Handles all passport-related form fields
 *
 * @param {Object} props
 * @param {Function} props.t - Translation function
 * @param {boolean} props.isExpanded - Whether section is expanded
 * @param {Function} props.onToggle - Toggle expansion handler
 * @param {Object} props.fieldCount - Field completion count { total, filled }
 * @param {Object} props - All form state props (passportNo, fullName, etc.)
 * @param {Object} props.styles - Style object
 */
const PassportSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,

  // Form state
  passportNo,
  fullName,
  nationality,
  dob,
  expiryDate,
  gender,

  // Setters
  setPassportNo,
  setFullName,
  setNationality,
  setDob,
  setExpiryDate,
  setGender,

  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,

  // Actions
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,

  // Styles
  styles,
}) => {
  return (
    <CollapsibleSection
      title={t('us.travelInfo.sections.passport', { defaultValue: '📘 护照信息' })}
      expanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
      style={styles.sectionCard}
      headerStyle={styles.sectionHeader}
      contentStyle={styles.sectionContent}
    >
      {/* Passport Name */}
      <PassportNameInput
        label={t('us.travelInfo.fields.passportName', { defaultValue: '护照姓名' })}
        value={fullName}
        onChangeText={setFullName}
        onBlur={() => handleFieldBlur('fullName', fullName)}
        placeholder={t('us.travelInfo.fields.passportNamePlaceholder', { defaultValue: 'ZHANG/SAN' })}
        error={!!errors.fullName}
        errorMessage={errors.fullName}
        warning={warnings.fullName}
        helpText={t('us.travelInfo.fields.passportNameHelp', {
          defaultValue: '请按照护照上的拼写填写'
        })}
        isLastEdited={lastEditedField === 'fullName'}
      />

      {/* Nationality */}
      <NationalitySelector
        label={t('us.travelInfo.fields.nationality', { defaultValue: '国籍' })}
        value={nationality}
        onValueChange={(value) => {
          setNationality(value);
          handleFieldBlur('nationality', value);
        }}
        placeholder={t('us.travelInfo.fields.nationalityPlaceholder', { defaultValue: '选择国籍' })}
        error={!!errors.nationality}
        errorMessage={errors.nationality}
      />

      {/* Passport Number */}
      <Input
        label={t('us.travelInfo.fields.passportNumber', { defaultValue: '护照号码' })}
        value={passportNo}
        onChangeText={setPassportNo}
        onBlur={() => handleFieldBlur('passportNo', passportNo)}
        placeholder={t('us.travelInfo.fields.passportNumberPlaceholder', { defaultValue: 'E12345678' })}
        autoCapitalize="characters"
        error={!!errors.passportNo}
        errorMessage={errors.passportNo}
        helpText={t('us.travelInfo.fields.passportNumberHelp', {
          defaultValue: '护照号码通常在护照信息页右上角'
        })}
        isLastEdited={lastEditedField === 'passportNo'}
      />

      {/* Date of Birth */}
      <DateTimeInput
        label={t('us.travelInfo.fields.dateOfBirth', { defaultValue: '出生日期' })}
        value={dob}
        onChangeText={setDob}
        onBlur={() => handleFieldBlur('dob', dob)}
        mode="date"
        dateType="past"
        error={!!errors.dob}
        errorMessage={errors.dob}
        helpText={t('us.travelInfo.fields.dateOfBirthHelp', {
          defaultValue: '护照上的出生日期'
        })}
      />

      {/* Expiry Date */}
      <DateTimeInput
        label={t('us.travelInfo.fields.expiryDate', { defaultValue: '护照有效期' })}
        value={expiryDate}
        onChangeText={setExpiryDate}
        onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
        mode="date"
        dateType="future"
        error={!!errors.expiryDate}
        errorMessage={errors.expiryDate}
        helpText={t('us.travelInfo.fields.expiryDateHelp', {
          defaultValue: '护照过期日期'
        })}
      />

      {/* Gender */}
      <View style={styles.genderContainer}>
        <Text style={styles.genderLabel}>
          {t('us.travelInfo.fields.gender', { defaultValue: '性别' })}
        </Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'Male' && styles.genderButtonSelected
            ]}
            onPress={async () => {
              setGender('Male');
              try {
                await saveDataToSecureStorageWithOverride({ gender: 'Male' });
                setLastEditedAt(new Date());
              } catch (error) {
                console.error('Failed to save gender:', error);
              }
            }}
          >
            <Text style={[
              styles.genderButtonText,
              gender === 'Male' && styles.genderButtonTextSelected
            ]}>
              {t('us.travelInfo.fields.genderMale', { defaultValue: '男' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'Female' && styles.genderButtonSelected
            ]}
            onPress={async () => {
              setGender('Female');
              try {
                await saveDataToSecureStorageWithOverride({ gender: 'Female' });
                setLastEditedAt(new Date());
              } catch (error) {
                console.error('Failed to save gender:', error);
              }
            }}
          >
            <Text style={[
              styles.genderButtonText,
              gender === 'Female' && styles.genderButtonTextSelected
            ]}>
              {t('us.travelInfo.fields.genderFemale', { defaultValue: '女' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'Undefined' && styles.genderButtonSelected
            ]}
            onPress={async () => {
              setGender('Undefined');
              try {
                await saveDataToSecureStorageWithOverride({ gender: 'Undefined' });
                setLastEditedAt(new Date());
              } catch (error) {
                console.error('Failed to save gender:', error);
              }
            }}
          >
            <Text style={[
              styles.genderButtonText,
              gender === 'Undefined' && styles.genderButtonTextSelected
            ]}>
              {t('us.travelInfo.fields.genderUndefined', { defaultValue: '其他' })}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.gender && (
          <Text style={styles.errorText}>{errors.gender}</Text>
        )}
      </View>
    </CollapsibleSection>
  );
};

export default PassportSection;
