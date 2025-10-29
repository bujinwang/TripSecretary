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
import {
  YStack,
  XStack,
  CollapsibleSection,
  BaseCard,
  Text as TamaguiText,
} from '../../tamagui';
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
}) => {
  return (
    <CollapsibleSection
      title={t('thailand.travelInfo.sectionTitles.travel', { defaultValue: '旅行详情' })}
      subtitle={t('thailand.travelInfo.sectionTitles.travelSubtitle', { defaultValue: '航班、住宿等信息' })}
      icon="✈️"
      badge={`${fieldCount.filled}/${fieldCount.total}`}
      badgeVariant={fieldCount.filled === fieldCount.total ? 'success' : 'warning'}
      expanded={isExpanded}
      onToggle={onToggle}
      variant="default"
    >
      {/* Border Crossing Context for Travel Info */}
      <BaseCard
        variant="flat"
        padding="md"
        backgroundColor="#F8F9FA"
        marginBottom="$md"
      >
        <XStack gap="$sm" alignItems="flex-start">
          <TamaguiText fontSize={20}>✈️</TamaguiText>
          <TamaguiText fontSize="$2" color="$textSecondary" flex={1} lineHeight={20}>
            {t('thailand.travelInfo.sectionIntros.travel', { defaultValue: '海关需要知道您的旅行计划' })}
          </TamaguiText>
        </XStack>
      </BaseCard>

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
        saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
        setLastEditedAt={setLastEditedAt}
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
      />
    </CollapsibleSection>
  );
};

export default TravelDetailsSection;
