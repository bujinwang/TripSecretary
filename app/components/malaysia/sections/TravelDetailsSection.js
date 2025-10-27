// TravelDetailsSection.js
// Travel details form section for Malaysia Travel Info Screen
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import { DateTimeInput } from '../../index';
import InputWithUserTracking from '../../InputWithUserTracking';
import OptionSelector from '../../thailand/OptionSelector';
import { colors, typography, spacing } from '../../../theme';

const PREDEFINED_TRAVEL_PURPOSES = [
  { value: 'TOURISM', label: 'Tourism', labelMs: 'Pelancongan', icon: '🏖️' },
  { value: 'BUSINESS', label: 'Business', labelMs: 'Perniagaan', icon: '💼' },
  { value: 'EDUCATION', label: 'Education', labelMs: 'Pendidikan', icon: '📚' },
  { value: 'MEDICAL', label: 'Medical', labelMs: 'Perubatan', icon: '🏥' },
  { value: 'VISIT_FAMILY', label: 'Visit Family', labelMs: 'Lawat Keluarga', icon: '👨‍👩‍👧' },
  { value: 'OTHER', label: 'Other', labelMs: 'Lain-lain', icon: '📝' },
];

const PREDEFINED_ACCOMMODATION_TYPES = [
  { value: 'HOTEL', label: 'Hotel', labelMs: 'Hotel', icon: '🏨' },
  { value: 'APARTMENT', label: 'Apartment', labelMs: 'Pangsapuri', icon: '🏢' },
  { value: 'HOUSE', label: 'House', labelMs: 'Rumah', icon: '🏠' },
  { value: 'HOSTEL', label: 'Hostel', labelMs: 'Asrama', icon: '🛏️' },
  { value: 'RESORT', label: 'Resort', labelMs: 'Resort', icon: '🏝️' },
  { value: 'OTHER', label: 'Other', labelMs: 'Lain-lain', icon: '📝' },
];

/**
 * Travel details section component for Malaysia Travel Info Screen
 * @param {Object} props - Component props
 * @returns {JSX.Element} Travel details section component
 */
const TravelDetailsSection = ({
  // Section state
  isExpanded,
  onToggle,
  fieldCount,

  // Form values
  travelPurpose,
  customTravelPurpose,
  arrivalFlightNumber,
  arrivalDate,
  accommodationType,
  customAccommodationType,
  hotelAddress,
  stayDuration,
  flightTicketPhoto,
  hotelReservationPhoto,

  // Setters (using handleFieldChange from validation hook)
  handleFieldChange,
  setTravelPurpose,
  setCustomTravelPurpose,
  setArrivalFlightNumber,
  setArrivalDate,
  setAccommodationType,
  setCustomAccommodationType,
  setHotelAddress,
  setStayDuration,

  // Photo handling from persistence hook
  savePhoto,

  // Validation
  errors,
  warnings,
  lastEditedField,

  // User interaction
  userInteractionTracker,

  // i18n
  t,

  // Styles
  styles: customStyles,
}) => {
  /**
   * Handle photo upload
   */
  const handlePhotoUpload = async (photoType) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;

        // Use persistence hook's savePhoto
        const { success } = await savePhoto(photoType, photoUri);

        if (success) {
          Alert.alert('Upload Success', `${photoType === 'flightTicket' ? 'Flight ticket' : 'Hotel reservation'} photo uploaded successfully`);
        } else {
          Alert.alert('Upload Failed', 'Failed to save photo. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  return (
    <CollapsibleSection
      title={t('malaysia.travelInfo.sections.travel', { defaultValue: '✈️ Travel Info / Maklumat Perjalanan' })}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      <OptionSelector
        label="Travel Purpose / Tujuan Perjalanan"
        options={PREDEFINED_TRAVEL_PURPOSES}
        selectedValue={travelPurpose}
        onSelect={(value) => handleFieldChange('travelPurpose', value, setTravelPurpose)}
        customValue={customTravelPurpose}
        onCustomChange={(value) => handleFieldChange('customTravelPurpose', value, setCustomTravelPurpose)}
        customPlaceholder="Enter custom purpose / Masukkan tujuan lain"
      />

      <InputWithUserTracking
        label="Flight Number / Nombor Penerbangan"
        value={arrivalFlightNumber}
        onChangeText={(value) => handleFieldChange('arrivalFlightNumber', value, setArrivalFlightNumber)}
        helpText="Enter arrival flight number / Masukkan nombor penerbangan ketibaan"
        error={!!errors.arrivalFlightNumber}
        errorMessage={errors.arrivalFlightNumber}
        autoCapitalize="characters"
        fieldName="arrivalFlightNumber"
        userInteractionTracker={userInteractionTracker}
        lastEditedField={lastEditedField}
      />

      <DateTimeInput
        label="Arrival Date / Tarikh Ketibaan"
        value={arrivalDate}
        onChangeText={(value) => handleFieldChange('arrivalDate', value, setArrivalDate)}
        mode="date"
        dateType="future"
        helpText="Select date / Pilih tarikh"
        error={!!errors.arrivalDate}
        errorMessage={errors.arrivalDate}
      />

      <OptionSelector
        label="Accommodation Type / Jenis Penginapan"
        options={PREDEFINED_ACCOMMODATION_TYPES}
        selectedValue={accommodationType}
        onSelect={(value) => handleFieldChange('accommodationType', value, setAccommodationType)}
        customValue={customAccommodationType}
        onCustomChange={(value) => handleFieldChange('customAccommodationType', value, setCustomAccommodationType)}
        customPlaceholder="Enter custom accommodation / Masukkan jenis penginapan lain"
      />

      <InputWithUserTracking
        label="Address in Malaysia / Alamat di Malaysia"
        value={hotelAddress}
        onChangeText={(value) => handleFieldChange('hotelAddress', value, setHotelAddress)}
        multiline
        helpText="Enter full address / Masukkan alamat lengkap"
        error={!!errors.hotelAddress}
        errorMessage={errors.hotelAddress}
        autoCapitalize="words"
        fieldName="hotelAddress"
        userInteractionTracker={userInteractionTracker}
        lastEditedField={lastEditedField}
      />

      <InputWithUserTracking
        label="Length of Stay (days) / Tempoh Penginapan (hari)"
        value={stayDuration}
        onChangeText={(value) => handleFieldChange('stayDuration', value, setStayDuration)}
        helpText="Enter number of days / Masukkan bilangan hari"
        error={!!errors.stayDuration}
        errorMessage={errors.stayDuration}
        keyboardType="numeric"
        fieldName="stayDuration"
        userInteractionTracker={userInteractionTracker}
        lastEditedField={lastEditedField}
      />

      {/* Document Photos */}
      <View style={styles.documentSection}>
        <Text style={styles.documentSectionTitle}>Supporting Documents (Optional)</Text>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => handlePhotoUpload('flightTicket')}
        >
          <Text style={styles.uploadButtonIcon}>✈️</Text>
          <View style={styles.uploadButtonContent}>
            <Text style={styles.uploadButtonTitle}>Flight Ticket</Text>
            <Text style={styles.uploadButtonSubtitle}>
              {flightTicketPhoto ? 'Uploaded ✓' : 'Tap to upload'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => handlePhotoUpload('hotelReservation')}
        >
          <Text style={styles.uploadButtonIcon}>🏨</Text>
          <View style={styles.uploadButtonContent}>
            <Text style={styles.uploadButtonTitle}>Hotel Reservation</Text>
            <Text style={styles.uploadButtonSubtitle}>
              {hotelReservationPhoto ? 'Uploaded ✓' : 'Tap to upload'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </CollapsibleSection>
  );
};

const styles = StyleSheet.create({
  documentSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  documentSectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  uploadButtonIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  uploadButtonContent: {
    flex: 1,
  },
  uploadButtonTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  uploadButtonSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default TravelDetailsSection;
