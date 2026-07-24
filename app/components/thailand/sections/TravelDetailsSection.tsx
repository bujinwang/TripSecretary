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
  AccommodationSubSection,
} from './subsections';
import type { RegionRecord } from '../../../components/ProvinceSelector';
import type { DistrictRecord } from '../../../components/DistrictSelector';
import type { SubDistrictRecord } from '../../../components/SubDistrictSelector';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type FieldCount = {
  filled: number;
  total: number;
};

type ValidationMap = Record<string, string | undefined>;

type SaveOverrideFn = (data: Record<string, unknown>) => Promise<void>;

type TravelDetailsSectionProps = {
  t: TranslationFn;
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount: FieldCount;
  travelPurpose: string;
  customTravelPurpose: string;
  recentStayCountry?: string;
  boardingCountry?: string;
  arrivalFlightNumber: string;
  arrivalArrivalDate: string;
  flightTicketPhoto?: string | null;
  departureFlightNumber: string;
  departureDepartureDate: string;
  departureFlightTicketPhoto?: string | null;
  isTransitPassenger: boolean;
  accommodationType: string;
  customAccommodationType: string;
  province?: string;
  district?: string;
  districtId?: string | null;
  subDistrict?: string;
  subDistrictId?: string | null;
  postalCode?: string;
  hotelAddress: string;
  hotelReservationPhoto?: string | null;
  setTravelPurpose: (value: string) => void;
  setCustomTravelPurpose: (value: string) => void;
  setRecentStayCountry: (value: string) => void;
  setBoardingCountry: (value: string) => void;
  setArrivalFlightNumber: (value: string) => void;
  setArrivalArrivalDate: (value: string) => void;
  setDepartureFlightNumber: (value: string) => void;
  setDepartureDepartureDate: (value: string) => void;
  setIsTransitPassenger: (value: boolean) => void;
  setAccommodationType: (value: string) => void;
  setCustomAccommodationType: (value: string) => void;
  setProvince?: (value: string) => void;
  setDistrict: (value: string) => void;
  setDistrictId: (value: string | null) => void;
  setSubDistrict: (value: string) => void;
  setSubDistrictId: (value: string | null) => void;
  setPostalCode: (value: string) => void;
  setHotelAddress: (value: string) => void;
  errors: ValidationMap;
  warnings: ValidationMap;
  handleFieldBlur: (field: string, value: string) => void;
  lastEditedField?: string | null;
  debouncedSaveData: () => void;
  saveDataToSecureStorageWithOverride?: SaveOverrideFn;
  setLastEditedAt?: (date: Date) => void;
  handleProvinceSelect?: (province: string) => void;
  handleDistrictSelect?: (selection: DistrictRecord) => void;
  handleSubDistrictSelect?: (selection: SubDistrictRecord) => void;
  handleFlightTicketPhotoUpload?: () => void;
  handleDepartureFlightTicketPhotoUpload?: () => void;
  handleHotelReservationPhotoUpload?: () => void;
  regionsData?: RegionRecord[];
  getDistrictsFunc?: (provinceCode: string) => DistrictRecord[] | null | undefined;
  getSubDistrictsFunc?: (districtId: string) => SubDistrictRecord[] | null | undefined;
};

const TravelDetailsSection: React.FC<TravelDetailsSectionProps> = ({
  t,
  isExpanded,
  onToggle,
  fieldCount,
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  arrivalFlightNumber,
  arrivalArrivalDate,
  flightTicketPhoto,
  departureFlightNumber,
  departureDepartureDate,
  departureFlightTicketPhoto,
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
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,
  debouncedSaveData,
  saveDataToSecureStorageWithOverride,
  setLastEditedAt,
  handleProvinceSelect,
  handleDistrictSelect,
  handleSubDistrictSelect,
  handleFlightTicketPhotoUpload,
  handleDepartureFlightTicketPhotoUpload,
  handleHotelReservationPhotoUpload,
  regionsData,
  getDistrictsFunc,
  getSubDistrictsFunc,
}) => {
  const badgeFilled = fieldCount?.filled ?? 0;
  const badgeTotal = fieldCount?.total ?? 0;
  const badgeVariant = badgeFilled === badgeTotal ? 'success' : badgeFilled > 0 ? 'warning' : 'danger';

  return (
    <CollapsibleSection
      title={t('thailand.travelInfo.sectionTitles.travel', { defaultValue: '旅行详情' })}
      subtitle={t('thailand.travelInfo.sectionTitles.travelSubtitle', { defaultValue: '航班、住宿等信息' })}
      icon="✈️"
      badge={`${badgeFilled}/${badgeTotal}`}
      badgeVariant={badgeVariant}
      expanded={isExpanded}
      onToggle={onToggle}
      variant="default"
    >
      <BaseCard variant="flat" padding="md" backgroundColor="#F8F9FA" marginBottom="$md">
        <XStack gap="$sm" alignItems="flex-start">
          <TamaguiText fontSize={20}>✈️</TamaguiText>
          <TamaguiText fontSize="$2" color="$textSecondary" flex={1} lineHeight={20}>
            {t('thailand.travelInfo.sectionIntros.travel', { defaultValue: '海关需要知道您的旅行计划' })}
          </TamaguiText>
        </XStack>
      </BaseCard>

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

      <AccommodationSubSection
        isTransitPassenger={isTransitPassenger}
        accommodationType={accommodationType}
        customAccommodationType={customAccommodationType}
        province={province}
        district={district}
        districtId={districtId ?? null}
        subDistrict={subDistrict}
        subDistrictId={subDistrictId ?? null}
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
        regionsData={regionsData}
        getDistrictsFunc={getDistrictsFunc}
        getSubDistrictsFunc={getSubDistrictsFunc}
        setProvince={setProvince}
      />
    </CollapsibleSection>
  );
};

export default TravelDetailsSection;
