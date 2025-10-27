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
  handleHotelReservationPhotoUpload,
  // Styles from parent (optional)
  styles: parentStyles,
}) => {
  // Use parent styles if provided, otherwise use local styles
  const styles = parentStyles || localStyles;

  return (
    <CollapsibleSection
      title="✈️ 旅行计划"
      subtitle="告诉泰国你的旅行安排"
      isExpanded={isExpanded}
      onToggle={onToggle}
      fieldCount={fieldCount}
    >
      {/* Border Crossing Context for Travel Info */}
      <View style={styles.sectionIntro}>
        <Text style={styles.sectionIntroIcon}>✈️</Text>
        <Text style={styles.sectionIntroText}>
          海关想知道你为什么来泰国、何时来、何时走、在哪里住。这有助于他们确认你是合法游客。
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
        setArrivalFlightNumber={setArrivalFlightNumber}
        setArrivalArrivalDate={setArrivalArrivalDate}
        setDepartureFlightNumber={setDepartureFlightNumber}
        setDepartureDepartureDate={setDepartureDepartureDate}
        errors={errors}
        warnings={warnings}
        handleFieldBlur={handleFieldBlur}
        lastEditedField={lastEditedField}
        handleFlightTicketPhotoUpload={handleFlightTicketPhotoUpload}
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
