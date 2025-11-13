/**
 * Shared TravelDetailsSection Component
 *
 * Generic, country-agnostic travel details section
 * Includes: travel purpose, arrival/departure flights, accommodation
 *
 * Highly customizable - can show/hide subsections and fields via config
 *
 * Usage:
 * <TravelDetailsSection
 *   isExpanded={true}
 *   onToggle={() => setExpanded(!expanded)}
 *   fieldCount={{ filled: 12, total: 15 }}
 *   // ... form state
 *   labels={{
 *     title: "Travel Details",
 *     subtitle: "Flight and accommodation information",
 *     // ... other labels
 *   }}
 *   config={{
 *     showTravelPurpose: true,
 *     showArrivalFlight: true,
 *     showDepartureFlight: true,
 *     showAccommodation: true,
 *     // ... more config
 *   }}
 * />
 */

import React from 'react';
import {
  YStack,
  XStack,
  CollapsibleSection,
  BaseCard,
  BaseInput,
  Text as TamaguiText,
} from '../../tamagui';
import {
  NationalitySelector,
  TravelPurposeSelector,
  DateTimeInput,
  LocationHierarchySelector,
} from '../../../components';
import AccommodationTypeSelector from '../../AccommodationTypeSelector';
import GenderSelector from '../../GenderSelector';

type FieldCount = {
  filled: number;
  total: number;
};

type LocationEntry = {
  id: string;
  name?: string;
  nameEn?: string;
  postalCode?: string;
} & Record<string, unknown>;

type LocationDataSource = LocationEntry[] | (() => LocationEntry[]);

type GetByParentFn = (parentId: string) => LocationEntry[];

type ErrorMap = Record<string, string | undefined>;

type WarningMap = Record<string, string | undefined>;

type AccommodationOption = {
  label: string;
  value: string;
};

interface TravelDetailsSectionConfig {
  showTravelPurpose: boolean;
  showRecentStayCountry: boolean;
  showBoardingCountry: boolean;
  showArrivalFlight: boolean;
  showDepartureFlight: boolean;
  showAccommodation: boolean;
  showFlightTicketPhoto: boolean;
  showDepartureFlightTicketPhoto: boolean;
  showTransitPassenger: boolean;
  showHotelReservationPhoto: boolean;
  locationDepth: number;
  showPostalCode: boolean;
  purposeType: string;
  accommodationOptions: AccommodationOption[];
  accommodationSelectorVariant: 'modal' | 'quickSelect';
  hideDistrictForAccommodationTypes: string[];
  hideSubDistrictForAccommodationTypes: string[];
}

export interface TravelDetailsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  fieldCount: FieldCount;
  travelPurpose?: string;
  customTravelPurpose?: string;
  recentStayCountry?: string;
  boardingCountry?: string;
  arrivalFlightNumber?: string;
  arrivalDate?: string;
  flightTicketPhoto?: string;
  departureFlightNumber?: string;
  departureDate?: string;
  departureFlightTicketPhoto?: string;
  isTransitPassenger?: boolean;
  accommodationType?: string;
  customAccommodationType?: string;
  province?: string;
  district?: string;
  districtId?: string;
  subDistrict?: string;
  subDistrictId?: string;
  postalCode?: string;
  hotelAddress?: string;
  hotelReservationPhoto?: string;
  setTravelPurpose?: (value: string) => void;
  setCustomTravelPurpose?: (value: string) => void;
  setRecentStayCountry?: (value: string) => void;
  setBoardingCountry?: (value: string) => void;
  setArrivalFlightNumber?: (value: string) => void;
  setArrivalDate?: (value: string) => void;
  setFlightTicketPhoto?: (value: string) => void;
  setDepartureFlightNumber?: (value: string) => void;
  setDepartureDate?: (value: string) => void;
  setDepartureFlightTicketPhoto?: (value: string) => void;
  setIsTransitPassenger?: (value: boolean) => void;
  setAccommodationType?: (value: string) => void;
  setCustomAccommodationType?: (value: string) => void;
  setProvince?: (value: string) => void;
  setDistrict?: (value: string) => void;
  setDistrictId?: (value: string) => void;
  setSubDistrict?: (value: string) => void;
  setSubDistrictId?: (value: string) => void;
  setPostalCode?: (value: string) => void;
  setHotelAddress?: (value: string) => void;
  setHotelReservationPhoto?: (value: string) => void;
  errors?: ErrorMap;
  warnings?: WarningMap;
  handleFieldBlur?: (field: string, value: unknown) => void;
  debouncedSaveData?: () => void;
  getProvinceData?: LocationDataSource;
  getDistrictData?: GetByParentFn;
  getSubDistrictData?: GetByParentFn;
  handleFlightTicketPhotoUpload?: () => void;
  handleDepartureFlightTicketPhotoUpload?: () => void;
  handleHotelReservationPhotoUpload?: () => void;
  labels?: Record<string, string>;
  config?: Partial<TravelDetailsSectionConfig>;
}

const TravelDetailsSection: React.FC<TravelDetailsSectionProps> = ({
  isExpanded,
  onToggle,
  fieldCount,
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  arrivalFlightNumber,
  arrivalDate,
  flightTicketPhoto,
  departureFlightNumber,
  departureDate,
  departureFlightTicketPhoto,
  isTransitPassenger = false,
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
  setArrivalDate,
  setFlightTicketPhoto,
  setDepartureFlightNumber,
  setDepartureDate,
  setDepartureFlightTicketPhoto,
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
  setHotelReservationPhoto,
  errors = {},
  warnings = {},
  handleFieldBlur,
  debouncedSaveData,
  getProvinceData,
  getDistrictData,
  getSubDistrictData,
  handleFlightTicketPhotoUpload,
  handleDepartureFlightTicketPhotoUpload,
  handleHotelReservationPhotoUpload,
  labels = {},
  config = {},
}) => {
  // Default labels
  const defaultLabels = {
    // Section
    title: 'Travel Details',
    subtitle: 'Flight and accommodation information',
    icon: '✈️',
    introIcon: '✈️',
    introText: 'Customs needs to know your travel plans',

    // Travel Purpose
    travelPurpose: 'Purpose of Visit',
    travelPurposeHelp: 'Select your reason for visiting',
    travelPurposePlaceholder: 'Please select',
    customTravelPurposeLabel: 'Other purpose',
    customTravelPurposePlaceholder: 'Please specify',
    recentStayCountry: 'Countries visited in last 30 days',
    recentStayCountryHelp: 'Select countries you visited recently',
    boardingCountry: 'Boarding country',
    boardingCountryHelp: 'Country where you boarded the flight',

    // Arrival Flight
    arrivalFlightNumber: 'Arrival Flight Number',
    arrivalFlightNumberHelp: 'Enter your arrival flight number',
    arrivalFlightNumberPlaceholder: 'e.g., TG123',
    arrivalDate: 'Arrival Date',
    arrivalDateHelp: 'Select your arrival date',
    flightTicketPhoto: 'Flight Ticket Photo',
    uploadFlightTicket: 'Upload Flight Ticket',

    // Departure Flight
    departureFlightNumber: 'Departure Flight Number',
    departureFlightNumberHelp: 'Enter your departure flight number',
    departureFlightNumberPlaceholder: 'e.g., TG456',
    departureDate: 'Departure Date',
    departureDateHelp: 'Select your departure date',
    departureFlightTicketPhoto: 'Departure Flight Ticket Photo',
    uploadDepartureFlightTicket: 'Upload Departure Ticket',

    // Accommodation
    isTransitPassenger: 'Are you a transit passenger?',
    transitYes: 'Yes',
    transitNo: 'No',
    accommodationType: 'Accommodation Type',
    accommodationTypeHelp: 'Select where you will stay',
    accommodationTypePlaceholder: 'Please select accommodation type',
    accommodationTypeModalTitle: 'Select accommodation type',
    customAccommodationType: 'Other accommodation type',
    province: 'Province/State',
    provinceHelp: 'Select province',
    provincePlaceholder: 'Please select province',
    district: 'District/City',
    districtHelp: 'Select district',
    districtPlaceholder: 'Please select district',
    subDistrict: 'Sub-district/Area',
    subDistrictHelp: 'Select sub-district',
    subDistrictPlaceholder: 'Please select sub-district',
    postalCode: 'Postal Code',
    hotelAddress: 'Hotel/Accommodation Address',
    hotelAddressHelp: 'Enter full address',
    hotelAddressPlaceholder: 'Enter address',
    hotelReservationPhoto: 'Hotel Reservation',
    uploadHotelReservation: 'Upload Reservation',
  };

  // Default configuration
  const defaultConfig: TravelDetailsSectionConfig = {
    // Show/hide subsections
    showTravelPurpose: true,
    showRecentStayCountry: true,
    showBoardingCountry: true,
    showArrivalFlight: true,
    showDepartureFlight: true,
    showAccommodation: true,

    // Show/hide specific fields
    showFlightTicketPhoto: true,
    showDepartureFlightTicketPhoto: true,
    showTransitPassenger: true,
    showHotelReservationPhoto: true,

    // Location hierarchy depth (1-3)
    locationDepth: 3, // 1=province only, 2=province+district, 3=province+district+subdistrict
    showPostalCode: true,

    // Purpose type for TravelPurposeSelector
    purposeType: 'basic', // 'basic' | 'thailand' | 'japan' | etc

    // Accommodation options
    accommodationOptions: [
      { label: 'Hotel', value: 'HOTEL' },
      { label: 'Hostel', value: 'HOSTEL' },
      { label: 'Airbnb', value: 'AIRBNB' },
      { label: 'Friend/Family', value: 'FRIEND_FAMILY' },
      { label: 'Other', value: 'OTHER' },
    ],
    accommodationSelectorVariant: 'modal',
    hideDistrictForAccommodationTypes: [],
    hideSubDistrictForAccommodationTypes: [],
  };

  // Merge defaults with provided values
  const l = { ...defaultLabels, ...labels };
  const c: TravelDetailsSectionConfig = { ...defaultConfig, ...config };

  const shouldHideDistrictForType = (type?: string | null) =>
    Boolean(type) &&
    Array.isArray(c.hideDistrictForAccommodationTypes) &&
    c.hideDistrictForAccommodationTypes.includes(type as string);

  const shouldHideSubDistrictForType = (type?: string | null) =>
    Boolean(type) &&
    Array.isArray(c.hideSubDistrictForAccommodationTypes) &&
    c.hideSubDistrictForAccommodationTypes.includes(type as string);

  const hideDistrict = shouldHideDistrictForType(accommodationType);
  const hideSubDistrict = shouldHideSubDistrictForType(accommodationType) || hideDistrict;

  const handleAccommodationTypeChange = (selectedValue: string) => {
    setAccommodationType?.(selectedValue);
    if (selectedValue !== 'OTHER') {
      setCustomAccommodationType?.('');
    }

    const shouldClearDistrict = shouldHideDistrictForType(selectedValue);
    const shouldClearSubDistrict = shouldHideSubDistrictForType(selectedValue) || shouldClearDistrict;

    if (shouldClearDistrict) {
      setDistrict?.('');
      setDistrictId?.('');
    }

    if (shouldClearSubDistrict) {
      setSubDistrict?.('');
      setSubDistrictId?.('');
      setPostalCode?.('');
    }

    debouncedSaveData && debouncedSaveData();
  };

  return (
    <CollapsibleSection
      title={l.title}
      subtitle={l.subtitle}
      icon={l.icon}
      badge={`${fieldCount.filled}/${fieldCount.total}`}
      badgeVariant={
        fieldCount.filled === fieldCount.total
          ? 'success'
          : fieldCount.filled > 0
          ? 'warning'
          : 'danger'
      }
      expanded={isExpanded}
      onToggle={onToggle}
      variant="default"
    >
      {/* Context Info Card */}
      <BaseCard
        variant="flat"
        padding="md"
        backgroundColor="#F8F9FA"
        marginBottom="$md"
        borderLeftWidth={4}
        borderLeftColor="$primary"
      >
        <XStack gap="$sm" alignItems="flex-start">
          <TamaguiText fontSize={20}>{l.introIcon}</TamaguiText>
          <TamaguiText fontSize="$2" color="$textSecondary" flex={1} lineHeight={20}>
            {l.introText}
          </TamaguiText>
        </XStack>
      </BaseCard>

      {/* Travel Purpose Subsection */}
      {c.showTravelPurpose && (
        <YStack marginBottom="$lg">
          <TravelPurposeSelector
            label={l.travelPurpose}
            value={travelPurpose}
            onValueChange={(code) => {
              setTravelPurpose?.(code);
              if (code !== 'OTHER') {
                setCustomTravelPurpose?.('');
              }
              handleFieldBlur && handleFieldBlur('travelPurpose', code);
              debouncedSaveData && debouncedSaveData();
            }}
            placeholder={l.travelPurposePlaceholder}
            purposeType={c.purposeType}
            showSearch={true}
            otherValue={customTravelPurpose}
            onOtherValueChange={(text) => {
              setCustomTravelPurpose && setCustomTravelPurpose(text.toUpperCase());
            }}
            helpText={l.travelPurposeHelp}
            error={!!errors.travelPurpose}
            errorMessage={errors.travelPurpose}
          />
        </YStack>
      )}

      {c.showRecentStayCountry && (
        <NationalitySelector
          label={l.recentStayCountry}
          value={recentStayCountry}
          onValueChange={(code) => {
            setRecentStayCountry?.(code);
            handleFieldBlur && handleFieldBlur('recentStayCountry', code);
            debouncedSaveData && debouncedSaveData();
          }}
          helpText={l.recentStayCountryHelp}
          error={!!errors.recentStayCountry}
          errorMessage={errors.recentStayCountry}
        />
      )}

      {c.showBoardingCountry && (
        <NationalitySelector
          label={l.boardingCountry}
          value={boardingCountry}
          onValueChange={(code) => {
            setBoardingCountry?.(code);
            handleFieldBlur && handleFieldBlur('boardingCountry', code);
            debouncedSaveData && debouncedSaveData();
          }}
          helpText={l.boardingCountryHelp}
          error={!!errors.boardingCountry}
          errorMessage={errors.boardingCountry}
        />
      )}

      {/* Arrival Flight Subsection */}
      {c.showArrivalFlight && (
        <YStack marginBottom="$lg">
          <BaseInput
            label={l.arrivalFlightNumber}
            value={arrivalFlightNumber}
            onChangeText={(text) => setArrivalFlightNumber?.(text.toUpperCase())}
            onBlur={() => handleFieldBlur && handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
            helperText={l.arrivalFlightNumberHelp}
            error={errors.arrivalFlightNumber}
            autoCapitalize="characters"
          />

          <DateTimeInput
            label={l.arrivalDate}
            value={arrivalDate}
            onChangeText={(newValue) => {
              setArrivalDate?.(newValue);
              handleFieldBlur && handleFieldBlur('arrivalDate', newValue);
            }}
            mode="date"
            dateType="future"
            helpText={l.arrivalDateHelp}
            error={!!errors.arrivalDate}
            errorMessage={errors.arrivalDate}
          />
        </YStack>
      )}

      {/* Departure Flight Subsection */}
      {c.showDepartureFlight && (
        <YStack marginBottom="$lg">
          <BaseInput
            label={l.departureFlightNumber}
            value={departureFlightNumber}
            onChangeText={(text) => setDepartureFlightNumber?.(text.toUpperCase())}
            onBlur={() => handleFieldBlur && handleFieldBlur('departureFlightNumber', departureFlightNumber)}
            helperText={l.departureFlightNumberHelp}
            error={errors.departureFlightNumber}
            autoCapitalize="characters"
          />

          <DateTimeInput
            label={l.departureDate}
            value={departureDate}
            onChangeText={(newValue) => {
              setDepartureDate?.(newValue);
              handleFieldBlur && handleFieldBlur('departureDate', newValue);
            }}
            mode="date"
            dateType="future"
            helpText={l.departureDateHelp}
            error={!!errors.departureDate}
            errorMessage={errors.departureDate}
          />
        </YStack>
      )}

      {/* Accommodation Subsection */}
      {c.showAccommodation && (
        <YStack marginBottom="$lg">
          {c.showTransitPassenger && (
            <YStack marginBottom="$md">
              <TamaguiText fontSize="$2" fontWeight="600" color="$text" marginBottom="$sm">
                {l.isTransitPassenger}
              </TamaguiText>
              <GenderSelector
                value={isTransitPassenger ? 'yes' : 'no'}
                onChange={(val) => setIsTransitPassenger?.(val === 'yes')}
                options={[
                  { label: l.transitYes, value: 'yes' },
                  { label: l.transitNo, value: 'no' },
                ]}
              />
            </YStack>
          )}

          {!isTransitPassenger && (
            <>
              <AccommodationTypeSelector
                label={l.accommodationType}
                value={accommodationType}
                options={c.accommodationOptions}
                onValueChange={handleAccommodationTypeChange}
                placeholder={l.accommodationTypePlaceholder || l.accommodationTypeHelp || '请选择您的住宿类型'}
                modalTitle={l.accommodationTypeModalTitle || l.accommodationType || '选择住宿类型'}
                helpText={l.accommodationTypeHelp}
                error={!!errors.accommodationType}
                errorMessage={errors.accommodationType}
                displayMode={c.accommodationSelectorVariant}
              />

              {/* Location Selection */}
              {c.locationDepth >= 1 && getProvinceData && (
                <LocationHierarchySelector
                  dataSource={typeof getProvinceData === 'function' ? getProvinceData() : getProvinceData}
                  label={l.province}
                  placeholder={l.provincePlaceholder}
                  value={province}
                  onValueChange={(code) => {
                    setProvince?.(code);
                    // Reset child selections
                    setDistrict?.('');
                    setDistrictId?.('');
                    setSubDistrict?.('');
                    setSubDistrictId?.('');
                    setPostalCode?.('');
                  }}
                  displayFormat="bilingual"
                  helpText={l.provinceHelp}
                  error={!!errors.province}
                  errorMessage={errors.province}
                />
              )}

              {c.locationDepth >= 2 && getDistrictData && province && !hideDistrict && (
                <LocationHierarchySelector
                  getDataByParent={getDistrictData}
                  parentId={province}
                  label={l.district}
                  placeholder={l.districtPlaceholder}
                  selectedId={districtId}
                  onSelect={(district) => {
                    setDistrictId?.(district.id ?? '');
                    setDistrict?.(district.nameEn || district.name || '');
                    // Reset child selections
                    setSubDistrict?.('');
                    setSubDistrictId?.('');
                    setPostalCode?.('');
                  }}
                  displayFormat="bilingual"
                  helpText={l.districtHelp}
                  error={!!errors.district}
                  errorMessage={errors.district}
                />
              )}

              {c.locationDepth >= 3 && getSubDistrictData && districtId && !hideSubDistrict && (
                <LocationHierarchySelector
                  getDataByParent={getSubDistrictData}
                  parentId={districtId}
                  label={l.subDistrict}
                  placeholder={l.subDistrictPlaceholder}
                  selectedId={subDistrictId}
                  onSelect={(subDistrict) => {
                    setSubDistrictId?.(subDistrict.id ?? '');
                    setSubDistrict?.(subDistrict.nameEn || subDistrict.name || '');
                    setPostalCode?.(subDistrict.postalCode || '');
                  }}
                  showPostalCode={c.showPostalCode}
                  displayFormat="bilingual"
                  helpText={l.subDistrictHelp}
                  error={!!errors.subDistrict}
                  errorMessage={errors.subDistrict}
                />
              )}

              <BaseInput
                label={l.hotelAddress}
                value={hotelAddress}
                onChangeText={(value) => setHotelAddress?.(value)}
                onBlur={() => handleFieldBlur && handleFieldBlur('hotelAddress', hotelAddress)}
                helperText={l.hotelAddressHelp}
                placeholder={l.hotelAddressPlaceholder}
                error={errors.hotelAddress}
                multiline
                numberOfLines={3}
              />
            </>
          )}
        </YStack>
      )}
    </CollapsibleSection>
  );
};

export default TravelDetailsSection;
