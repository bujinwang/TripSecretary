import React from 'react';
import { View } from 'react-native';
import CollapsibleSection from '../../CollapsibleSection';
import NationalitySelector from '../../NationalitySelector';
import Input from '../../Input';
import { getPhoneCode } from '../../../data/phoneCodes';

/**
 * PersonalInfoSection Component
 * Handles all personal information fields
 *
 * @param {Object} props
 * @param {Function} props.t - Translation function
 * @param {boolean} props.isExpanded - Whether section is expanded
 * @param {Function} props.onToggle - Toggle expansion handler
 * @param {Object} props.fieldCount - Field completion count { total, filled }
 * @param {Object} props - All form state props
 * @param {Object} props.styles - Style object
 */
const PersonalInfoSection = ({
  t,
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
  handleFieldBlur,
  lastEditedField,

  // Actions
  debouncedSaveData,

  // Styles
  styles,
}) => {
  return (
    <CollapsibleSection
      title={t('us.travelInfo.sections.personal', { defaultValue: '👤 个人信息' })}
      expanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
      style={styles.sectionCard}
      headerStyle={styles.sectionHeader}
      contentStyle={styles.sectionContent}
    >
      {/* Occupation */}
      <Input
        label={t('us.travelInfo.fields.occupation', { defaultValue: '职业' })}
        value={occupation}
        onChangeText={setOccupation}
        onBlur={() => handleFieldBlur('occupation', occupation)}
        placeholder={t('us.travelInfo.fields.occupationPlaceholder', { defaultValue: 'Engineer' })}
        error={!!errors.occupation}
        errorMessage={errors.occupation}
        helpText={t('us.travelInfo.fields.occupationHelp', {
          defaultValue: '请用英文填写职业'
        })}
        isLastEdited={lastEditedField === 'occupation'}
      />

      {/* City of Residence */}
      <Input
        label={t('us.travelInfo.fields.cityOfResidence', { defaultValue: '居住城市' })}
        value={cityOfResidence}
        onChangeText={setCityOfResidence}
        onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
        placeholder={t('us.travelInfo.fields.cityOfResidencePlaceholder', { defaultValue: 'Beijing' })}
        error={!!errors.cityOfResidence}
        errorMessage={errors.cityOfResidence}
        helpText={t('us.travelInfo.fields.cityOfResidenceHelp', {
          defaultValue: '您目前居住的城市'
        })}
        isLastEdited={lastEditedField === 'cityOfResidence'}
      />

      {/* Resident Country */}
      <NationalitySelector
        label={t('us.travelInfo.fields.residentCountry', { defaultValue: '居住国家' })}
        value={residentCountry}
        onValueChange={(value) => {
          setResidentCountry(value);
          // Auto-update phone code based on country
          const code = getPhoneCode(value);
          if (code) {
            setPhoneCode(code);
          }
          handleFieldBlur('residentCountry', value);
        }}
        placeholder={t('us.travelInfo.fields.residentCountryPlaceholder', {
          defaultValue: '选择居住国家'
        })}
        error={!!errors.residentCountry}
        errorMessage={errors.residentCountry}
      />

      {/* Phone Number (with code) */}
      <View style={styles.phoneRow}>
        <View style={styles.phoneCodeContainer}>
          <Input
            label={t('us.travelInfo.fields.phoneCode', { defaultValue: '区号' })}
            value={phoneCode}
            onChangeText={setPhoneCode}
            onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
            placeholder={t('us.travelInfo.fields.phoneCodePlaceholder', { defaultValue: '+86' })}
            error={!!errors.phoneCode}
            errorMessage={errors.phoneCode}
            style={styles.phoneCodeInput}
          />
        </View>
        <View style={styles.phoneNumberContainer}>
          <Input
            label={t('us.travelInfo.fields.phoneNumber', { defaultValue: '电话号码' })}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
            placeholder={t('us.travelInfo.fields.phoneNumberPlaceholder', {
              defaultValue: '13800138000'
            })}
            keyboardType="phone-pad"
            error={!!errors.phoneNumber}
            errorMessage={errors.phoneNumber}
            isLastEdited={lastEditedField === 'phoneNumber'}
          />
        </View>
      </View>

      {/* Email */}
      <Input
        label={t('us.travelInfo.fields.email', { defaultValue: '电子邮箱' })}
        value={email}
        onChangeText={setEmail}
        onBlur={() => handleFieldBlur('email', email)}
        placeholder={t('us.travelInfo.fields.emailPlaceholder', {
          defaultValue: 'example@email.com'
        })}
        keyboardType="email-address"
        autoCapitalize="none"
        error={!!errors.email}
        errorMessage={errors.email}
        helpText={t('us.travelInfo.fields.emailHelp', {
          defaultValue: '用于接收重要通知'
        })}
        isLastEdited={lastEditedField === 'email'}
      />
    </CollapsibleSection>
  );
};

export default PersonalInfoSection;
