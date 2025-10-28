/**
 * TravelDetailsSection Component
 *
 * Displays travel information section (flights, dates, accommodation)
 * for Thailand Travel Info Screen
 *
 * Refactored to use sub-components for better organization:
 * - TravelPurposeSubSection
 * - FlightInfoSubSection
 * - AccommodationSubSection
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../theme';
import { CollapsibleSection } from '../ThailandTravelComponents';
import {
  TravelPurposeSubSection,
  FlightInfoSubSection,
  AccommodationSubSection
} from './subsections';

const TravelDetailsSection = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  // Form state - Travel purpose
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  // Form state - Arrival
  arrivalFlightNumber,
  arrivalArrivalDate,
  flightTicketPhoto,
  // Form state - Departure
  departureFlightNumber,
  departureDepartureDate,
  departureFlightTicketPhoto,
  // Form state - Accommodation
  isTransitPassenger,
  accommodationType,
  customAccommodationType,
  province,
  district,
  districtId,
  subDistrict,
  subDistrictId,
  postalCode,
  hotelAddress,
  hotelReservationPhoto,
  // Setters
  setTravelPurpose,
  setCustomTravelPurpose,
  setRecentStayCountry,
  setBoardingCountry,
  setArrivalFlightNumber,
  setArrivalArrivalDate,
  setDepartureFlightNumber,
  setDepartureDepartureDate,
  setIsTransitPassenger,
  setAccommodationType,
  setCustomAccommodationType,
  setProvince,
  setDistrict,
  setDistrictId,
  setSubDistrict,
  setSubDistrictId,
  setPostalCode,
  setHotelAddress,
  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  // Actions
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  handleProvinceSelect,
  handleDistrictSelect,
  handleSubDistrictSelect,
  handleFlightTicketPhotoUpload,
  handleDepartureFlightTicketPhotoUpload,
  handleHotelReservationPhotoUpload,
  // Styles from parent (optional)
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;

  return (
    <CollapsibleSection
      title={t('thailand.travelInfo.sectionTitles.travel')}
      subtitle={t('thailand.travelInfo.sectionTitles.travelSubtitle')}
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Border Crossing Context for Travel Info */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>✈️</Text>
        <Text style={styles.sectionIntroText}>
          {t('thailand.travelInfo.sectionIntros.travel')}
        </Text>
      </View>

      {/* Travel Purpose Sub-Section */}
      <TravelPurposeSubSection
        travelPurpose={travelPurpose}
        customTravelPurpose={customTravelPurpose}
        recentStayCountry={recentStayCountry}
        boardingCountry={boardingCountry}
        setTravelPurpose={setTravelPurpose}
        setCustomTravelPurpose={setCustomTravelPurpose}
        setRecentStayCountry={setRecentStayCountry}
        setBoardingCountry={setBoardingCountry}
        handleFieldBlur={handleFieldBlur}
        debouncedSaveData={debouncedSaveData}
        styles={styles}
      />

      {/* Flight Info Sub-Section */}
      <FlightInfoSubSection
        arrivalFlightNumber={arrivalFlightNumber}
        arrivalArrivalDate={arrivalArrivalDate}
        flightTicketPhoto={flightTicketPhoto}
        departureFlightNumber={departureFlightNumber}
        departureDepartureDate={departureDepartureDate}
        departureFlightTicketPhoto={departureFlightTicketPhoto}
        setArrivalFlightNumber={setArrivalFlightNumber}
        setArrivalArrivalDate={setArrivalArrivalDate}
        setDepartureFlightNumber={setDepartureFlightNumber}
        setDepartureDepartureDate={setDepartureDepartureDate}
        errors={errors}
        warnings={warnings}
        handleFieldBlur={handleFieldBlur}
        lastEditedField={lastEditedField}
        handleFlightTicketPhotoUpload={handleFlightTicketPhotoUpload}
        handleDepartureFlightTicketPhotoUpload={handleDepartureFlightTicketPhotoUpload}
        styles={styles}
      />

      {/* Accommodation Sub-Section */}
      <AccommodationSubSection
        isTransitPassenger={isTransitPassenger}
        accommodationType={accommodationType}
        customAccommodationType={customAccommodationType}
        province={province}
        district={district}
        districtId={districtId}
        subDistrict={subDistrict}
        subDistrictId={subDistrictId}
        postalCode={postalCode}
        hotelAddress={hotelAddress}
        hotelReservationPhoto={hotelReservationPhoto}
        setIsTransitPassenger={setIsTransitPassenger}
        setAccommodationType={setAccommodationType}
        setCustomAccommodationType={setCustomAccommodationType}
        setHotelAddress={setHotelAddress}
        setDistrict={setDistrict}
        setDistrictId={setDistrictId}
        setSubDistrict={setSubDistrict}
        setSubDistrictId={setSubDistrictId}
        setPostalCode={setPostalCode}
        errors={errors}
        warnings={warnings}
        handleFieldBlur={handleFieldBlur}
        lastEditedField={lastEditedField}
        debouncedSaveData={debouncedSaveData}
        saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
        setLastEditedAt={setLastEditedAt}
        handleProvinceSelect={handleProvinceSelect}
        handleDistrictSelect={handleDistrictSelect}
        handleSubDistrictSelect={handleSubDistrictSelect}
        handleHotelReservationPhotoUpload={handleHotelReservationPhotoUpload}
        styles={styles}
      />
    </CollapsibleSection>
  );
};

const localStyles = StyleSheet.create({
  sectionIntro: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  sectionIntroIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  photoUploadCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoUploadHeader: {
    marginBottom: spacing.sm,
  },
  photoUploadTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    fontSize: 16,
  },
  photoInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  photoInfoIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  photoInfoText: {
    ...typography.caption,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: spacing.lg,
    backgroundColor: '#F0F7FF',
  },
  uploadButtonContent: {
    alignItems: 'center',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadButtonText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  uploadButtonSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  changePhotoIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  changePhotoText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    minWidth: 100,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  input: {
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  subSectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  documentUploadSection: {
    marginBottom: spacing.md,
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  photoUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#f8f9fa',
  },
  photoUploadIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  photoUploadText: {
    fontSize: 14,
    color: colors.primary,
  },
  photoPreview: {
    marginTop: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
  },
});

export default TravelDetailsSection;
