// TravelDetailsSection.js
// Travel details form section for Malaysia Travel Info Screen
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, type ViewStyle, type TextStyle } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CollapsibleSection } from '../../thailand/ThailandTravelComponents';
import { DateTimeInput } from '../../index';
import InputWithUserTracking from '../../InputWithUserTracking';
import OptionSelector from '../../thailand/OptionSelector';
import { colors, typography, spacing } from '../../../theme';

const createStyles = () =>
  StyleSheet.create({
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    documentSection: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    documentSectionTitle: {
      ...typography.body1,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.backgroundLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderLight,
      gap: spacing.md,
    },
    uploadButtonIcon: {
      fontSize: 24,
    },
    uploadButtonContent: {
      flex: 1,
      gap: 2,
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

const baseStyles = createStyles();

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

type SavePhotoFn = (photoType: 'flightTicket' | 'hotelReservation', uri: string) => Promise<{ success: boolean }>;

interface OptionConfig {
  value: string;
  label: string;
  labelMs: string;
  icon: string;
}

const PREDEFINED_TRAVEL_PURPOSES: OptionConfig[] = [
  { value: 'TOURISM', label: 'Tourism', labelMs: 'Pelancongan', icon: '🏖️' },
  { value: 'BUSINESS', label: 'Business', labelMs: 'Perniagaan', icon: '💼' },
  { value: 'EDUCATION', label: 'Education', labelMs: 'Pendidikan', icon: '📚' },
  { value: 'MEDICAL', label: 'Medical', labelMs: 'Perubatan', icon: '🏥' },
  { value: 'VISIT_FAMILY', label: 'Visit Family', labelMs: 'Lawat Keluarga', icon: '👨‍👩‍👧' },
  { value: 'OTHER', label: 'Other', labelMs: 'Lain-lain', icon: '📝' },
];

const PREDEFINED_ACCOMMODATION_TYPES: OptionConfig[] = [
  { value: 'HOTEL', label: 'Hotel', labelMs: 'Hotel', icon: '🏨' },
  { value: 'APARTMENT', label: 'Apartment', labelMs: 'Pangsapuri', icon: '🏢' },
  { value: 'HOUSE', label: 'House', labelMs: 'Rumah', icon: '🏠' },
  { value: 'HOSTEL', label: 'Hostel', labelMs: 'Asrama', icon: '🛏️' },
  { value: 'RESORT', label: 'Resort', labelMs: 'Resort', icon: '🏝️' },
  { value: 'OTHER', label: 'Other', labelMs: 'Lain-lain', icon: '📝' },
];

export interface MalaysiaTravelDetailsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount?: FieldCount;
  travelPurpose?: string;
  customTravelPurpose?: string;
  arrivalFlightNumber?: string;
  arrivalDate?: string;
  accommodationType?: string;
  customAccommodationType?: string;
  hotelAddress?: string;
  stayDuration?: string;
  flightTicketPhoto?: string | null;
  hotelReservationPhoto?: string | null;
  handleFieldChange: HandleFieldChange;
  setTravelPurpose: (value: string) => void;
  setCustomTravelPurpose: (value: string) => void;
  setArrivalFlightNumber: (value: string) => void;
  setArrivalDate: (value: string) => void;
  setAccommodationType: (value: string) => void;
  setCustomAccommodationType: (value: string) => void;
  setHotelAddress: (value: string) => void;
  setStayDuration: (value: string) => void;
  savePhoto?: SavePhotoFn;
  errors: ValidationMap;
  warnings: ValidationMap;
  lastEditedField?: string | null;
  userInteractionTracker?: unknown;
  t: (key: string, options?: Record<string, unknown>) => string;
  styles?: Partial<typeof baseStyles> & Record<string, ViewStyle | TextStyle>;
}

const TravelDetailsSection: React.FC<MalaysiaTravelDetailsSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
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
  handleFieldChange,
  setTravelPurpose,
  setCustomTravelPurpose,
  setArrivalFlightNumber,
  setArrivalDate,
  setAccommodationType,
  setCustomAccommodationType,
  setHotelAddress,
  setStayDuration,
  savePhoto,
  errors,
  warnings: _warnings,
  lastEditedField,
  userInteractionTracker,
  t,
  styles: customStyles,
}) => {
  const sectionStyles = React.useMemo(
    () => (customStyles ? ({ ...baseStyles, ...customStyles } as typeof baseStyles) : baseStyles),
    [customStyles],
  );

  const translate = (key: string, defaultValue: string) =>
    (t && t(key, { defaultValue })) || defaultValue;

  const travelPurposeOptions = PREDEFINED_TRAVEL_PURPOSES.map((option) => ({
    value: option.value,
    icon: option.icon,
    label: `${option.label} / ${option.labelMs}`,
  }));

  const accommodationOptions = PREDEFINED_ACCOMMODATION_TYPES.map((option) => ({
    value: option.value,
    icon: option.icon,
    label: `${option.label} / ${option.labelMs}`,
  }));

  const handlePhotoUpload = async (photoType: 'flightTicket' | 'hotelReservation') => {
    if (!savePhoto) {
      Alert.alert('Unavailable', 'Photo uploads are not supported at the moment.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert('Error', 'Could not read the selected file.');
        return;
      }

      const { success } = await savePhoto(photoType, asset.uri);

      if (success) {
        Alert.alert('Upload Success', photoType === 'flightTicket' ? 'Flight ticket photo uploaded successfully' : 'Hotel reservation photo uploaded successfully');
      } else {
        Alert.alert('Upload Failed', 'Failed to save photo. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  return (
    <View style={sectionStyles.sectionCard}>
      <CollapsibleSection
        title={translate('malaysia.travelInfo.sections.travel', '✈️ Travel Info / Maklumat Perjalanan')}
        isExpanded={isExpanded}
        onToggle={onToggle}
        fieldCount={fieldCount}
      >
      <OptionSelector
        label="Travel Purpose / Tujuan Perjalanan"
        options={travelPurposeOptions}
        value={travelPurpose ?? ''}
        selectedValue={travelPurpose ?? ''}
        onSelect={(value) => handleFieldChange('travelPurpose', value, setTravelPurpose)}
        customValue={customTravelPurpose ?? ''}
        onCustomChange={(value) => handleFieldChange('customTravelPurpose', value, setCustomTravelPurpose)}
        customPlaceholder="Enter custom purpose / Masukkan tujuan lain"
      />

      <InputWithUserTracking
        label="Flight Number / Nombor Penerbangan"
        value={arrivalFlightNumber ?? ''}
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
        options={accommodationOptions}
        value={accommodationType ?? ''}
        selectedValue={accommodationType ?? ''}
        onSelect={(value) => handleFieldChange('accommodationType', value, setAccommodationType)}
        customValue={customAccommodationType ?? ''}
        onCustomChange={(value) => handleFieldChange('customAccommodationType', value, setCustomAccommodationType)}
        customPlaceholder="Enter custom accommodation / Masukkan jenis penginapan lain"
      />

      <InputWithUserTracking
        label="Address in Malaysia / Alamat di Malaysia"
        value={hotelAddress ?? ''}
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
        value={stayDuration ?? ''}
        onChangeText={(value) => handleFieldChange('stayDuration', value, setStayDuration)}
        helpText="Enter number of days / Masukkan bilangan hari"
        error={!!errors.stayDuration}
        errorMessage={errors.stayDuration}
        keyboardType="numeric"
        fieldName="stayDuration"
        userInteractionTracker={userInteractionTracker}
        lastEditedField={lastEditedField}
      />

        <View style={sectionStyles.documentSection}>
        <Text style={sectionStyles.documentSectionTitle}>Supporting Documents (Optional)</Text>

        <TouchableOpacity
          style={sectionStyles.uploadButton}
          onPress={() => handlePhotoUpload('flightTicket')}
        >
          <Text style={sectionStyles.uploadButtonIcon}>✈️</Text>
          <View style={sectionStyles.uploadButtonContent}>
            <Text style={sectionStyles.uploadButtonTitle}>Flight Ticket</Text>
            <Text style={sectionStyles.uploadButtonSubtitle}>
              {flightTicketPhoto ? 'Uploaded ✓' : 'Tap to upload'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={sectionStyles.uploadButton}
          onPress={() => handlePhotoUpload('hotelReservation')}
        >
          <Text style={sectionStyles.uploadButtonIcon}>🏨</Text>
          <View style={sectionStyles.uploadButtonContent}>
            <Text style={sectionStyles.uploadButtonTitle}>Hotel Reservation</Text>
            <Text style={sectionStyles.uploadButtonSubtitle}>
              {hotelReservationPhoto ? 'Uploaded ✓' : 'Tap to upload'}
            </Text>
          </View>
        </TouchableOpacity>
        </View>
      </CollapsibleSection>
    </View>
  );
};

export default TravelDetailsSection;
