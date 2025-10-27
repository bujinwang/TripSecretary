import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CollapsibleSection from '../../CollapsibleSection';
import TravelPurposeSelector from '../../TravelPurposeSelector';
import DateTimeInput from '../../DateTimeInput';
import Input from '../../Input';
import USFormHelper from '../../../utils/usa/USFormHelper';

/**
 * TravelSection Component
 * Handles all US-specific travel information fields
 *
 * @param {Object} props
 * @param {Function} props.t - Translation function
 * @param {boolean} props.isExpanded - Whether section is expanded
 * @param {Function} props.onToggle - Toggle expansion handler
 * @param {Object} props.fieldCount - Field completion count { total, filled }
 * @param {Object} props - All form state props
 * @param {Object} props.styles - Style object
 */
const TravelSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  language,

  // Form state
  travelPurpose,
  customTravelPurpose,
  arrivalFlightNumber,
  arrivalDate,
  isTransitPassenger,
  accommodationAddress,
  accommodationPhone,
  lengthOfStay,

  // Setters
  setTravelPurpose,
  setCustomTravelPurpose,
  setArrivalFlightNumber,
  setArrivalDate,
  setIsTransitPassenger,
  setAccommodationAddress,
  setAccommodationPhone,
  setLengthOfStay,

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
  // Map travel purpose to code for selector
  const travelPurposeCode = React.useMemo(() => {
    const mapping = {
      Tourism: 'TOURISM',
      Business: 'BUSINESS',
      'Visiting Relatives': 'VISITING_RELATIVES',
      Transit: 'TRANSIT',
      Other: 'OTHER',
    };
    return mapping[travelPurpose] || 'OTHER';
  }, [travelPurpose]);

  return (
    <CollapsibleSection
      title={t('us.travelInfo.sections.travel', { defaultValue: '✈️ 行程信息' })}
      expanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
      style={styles.sectionCard}
      headerStyle={styles.sectionHeader}
      contentStyle={styles.sectionContent}
    >
      {/* Travel Purpose */}
      <TravelPurposeSelector
        label={t('us.travelInfo.fields.travelPurpose', { defaultValue: '旅行目的' })}
        value={travelPurposeCode}
        onValueChange={(value) => {
          const normalizedValue = USFormHelper.normalizeTravelPurpose(value);
          setTravelPurpose(normalizedValue);
          if (normalizedValue !== 'Other') {
            setCustomTravelPurpose('');
          }
          handleFieldBlur('travelPurpose', normalizedValue);
        }}
        purposeType="us"
        locale={language}
        error={!!errors.travelPurpose}
        errorMessage={errors.travelPurpose}
      />

      {/* Custom Travel Purpose (if Other selected) */}
      {travelPurpose === 'Other' && (
        <Input
          label={t('us.travelInfo.fields.customTravelPurpose', { defaultValue: '其他目的' })}
          value={customTravelPurpose}
          onChangeText={setCustomTravelPurpose}
          onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
          placeholder={t('us.travelInfo.fields.customTravelPurposePlaceholder', {
            defaultValue: '请输入旅行目的'
          })}
          helpText="Please enter in English"
          autoCapitalize="words"
          error={!!errors.customTravelPurpose}
          errorMessage={errors.customTravelPurpose}
          isLastEdited={lastEditedField === 'customTravelPurpose'}
        />
      )}

      {/* Arrival Flight Number */}
      <Input
        label={t('us.travelInfo.fields.arrivalFlightNumber', { defaultValue: '抵达航班号' })}
        value={arrivalFlightNumber}
        onChangeText={setArrivalFlightNumber}
        onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
        placeholder={t('us.travelInfo.fields.arrivalFlightNumberPlaceholder', { defaultValue: 'UA857' })}
        autoCapitalize="characters"
        error={!!errors.arrivalFlightNumber}
        errorMessage={errors.arrivalFlightNumber}
        helpText={t('us.travelInfo.fields.arrivalFlightNumberHelp', {
          defaultValue: '抵达美国的航班号'
        })}
        isLastEdited={lastEditedField === 'arrivalFlightNumber'}
      />

      {/* Arrival Date */}
      <DateTimeInput
        label={t('us.travelInfo.fields.arrivalDate', { defaultValue: '抵达日期' })}
        value={arrivalDate}
        onChangeText={setArrivalDate}
        onBlur={() => handleFieldBlur('arrivalDate', arrivalDate)}
        mode="date"
        dateType="future"
        error={!!errors.arrivalDate}
        errorMessage={errors.arrivalDate}
        helpText={t('us.travelInfo.fields.arrivalDateHelp', {
          defaultValue: '预计抵达美国日期'
        })}
      />

      {/* Transit Passenger Checkbox */}
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={async () => {
          const newValue = !isTransitPassenger;
          setIsTransitPassenger(newValue);
          if (newValue) {
            // Clear accommodation fields if transit passenger
            setAccommodationAddress('');
            setAccommodationPhone('');
          }
          try {
            await saveDataToSecureStorageWithOverride({ isTransitPassenger: newValue });
            setLastEditedAt(new Date());
          } catch (error) {
            console.error('Failed to save transit passenger status:', error);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
          {isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          {t('us.travelInfo.fields.transitPassenger', {
            defaultValue: '我是过境旅客，不在美国停留'
          })}
        </Text>
      </TouchableOpacity>

      {/* Accommodation Fields (only if not transit passenger) */}
      {!isTransitPassenger && (
        <>
          <Input
            label={t('us.travelInfo.fields.accommodationAddress', { defaultValue: '住宿地址' })}
            value={accommodationAddress}
            onChangeText={setAccommodationAddress}
            onBlur={() => handleFieldBlur('accommodationAddress', accommodationAddress)}
            placeholder={t('us.travelInfo.fields.accommodationAddressPlaceholder', {
              defaultValue: '123 Main St, New York, NY 10001'
            })}
            multiline
            numberOfLines={3}
            error={!!errors.accommodationAddress}
            errorMessage={errors.accommodationAddress}
            helpText={t('us.travelInfo.fields.accommodationAddressHelp', {
              defaultValue: '请输入在美国的住宿地址'
            })}
            isLastEdited={lastEditedField === 'accommodationAddress'}
          />

          <Input
            label={t('us.travelInfo.fields.accommodationPhone', { defaultValue: '住宿电话' })}
            value={accommodationPhone}
            onChangeText={setAccommodationPhone}
            onBlur={() => handleFieldBlur('accommodationPhone', accommodationPhone)}
            placeholder={t('us.travelInfo.fields.accommodationPhonePlaceholder', {
              defaultValue: '212-555-1234'
            })}
            keyboardType="phone-pad"
            error={!!errors.accommodationPhone}
            errorMessage={errors.accommodationPhone}
            helpText={t('us.travelInfo.fields.accommodationPhoneHelp', {
              defaultValue: '酒店或住宿地的联系电话'
            })}
            isLastEdited={lastEditedField === 'accommodationPhone'}
          />
        </>
      )}

      {/* Length of Stay */}
      <Input
        label={t('us.travelInfo.fields.lengthOfStay', { defaultValue: '停留天数' })}
        value={lengthOfStay}
        onChangeText={setLengthOfStay}
        onBlur={() => handleFieldBlur('lengthOfStay', lengthOfStay)}
        placeholder={t('us.travelInfo.fields.lengthOfStayPlaceholder', { defaultValue: '7' })}
        keyboardType="numeric"
        error={!!errors.lengthOfStay}
        errorMessage={errors.lengthOfStay}
        helpText={t('us.travelInfo.fields.lengthOfStayHelp', {
          defaultValue: '计划在美国停留的天数'
        })}
        isLastEdited={lastEditedField === 'lengthOfStay'}
      />
    </CollapsibleSection>
  );
};

export default TravelSection;
