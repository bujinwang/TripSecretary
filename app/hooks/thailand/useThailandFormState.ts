// @ts-nocheck

/**
 * useThailandFormState Hook
 *
 * Manages all form state for Thailand Travel Info Screen
 * Consolidates 57+ useState declarations into a single, manageable hook
 */

import { useState, useCallback, useMemo } from 'react';
import { getPhoneCode } from '../../data/phoneCodes';

/**
 * Custom hook to manage Thailand travel form state
 * @param {Object} passport - Passport information
 * @returns {Object} Form state and setters
 */
export const useThailandFormState = (passport) => {
  // Smart defaults for common scenarios
  const getSmartDefaults = useCallback(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      travelPurpose: 'HOLIDAY',
      accommodationType: 'HOTEL',
      arrivalDate: tomorrow.toISOString().split('T')[0],
      departureDate: nextWeek.toISOString().split('T')[0],
      boardingCountry: passport?.nationality || 'CHN',
    };
  }, [passport?.nationality]);

  const smartDefaults = useMemo(() => getSmartDefaults(), [getSmartDefaults]);

  // ========== Passport State ==========
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [surname, setSurname] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // ========== Personal Info State ==========
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // ========== Travel Info State ==========
  const [travelPurpose, setTravelPurpose] = useState('');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [recentStayCountry, setRecentStayCountry] = useState('');
  const [boardingCountry, setBoardingCountry] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState(smartDefaults.arrivalDate);
  const [previousArrivalDate, setPreviousArrivalDate] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState(smartDefaults.departureDate);
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);

  // ========== Accommodation State ==========
  const [accommodationType, setAccommodationType] = useState('HOTEL');
  const [customAccommodationType, setCustomAccommodationType] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState(null);
  const [subDistrict, setSubDistrict] = useState('');
  const [subDistrictId, setSubDistrictId] = useState(null);
  const [postalCode, setPostalCode] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');

  // ========== Document Photos State ==========
  const [flightTicketPhoto, setFlightTicketPhoto] = useState(null);
  const [departureFlightTicketPhoto, setDepartureFlightTicketPhoto] = useState(null);
  const [hotelReservationPhoto, setHotelReservationPhoto] = useState(null);

  // ========== Funds State ==========
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [currentFundItem, setCurrentFundItem] = useState(null);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // ========== Data Model State ==========
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);
  const [entryInfoId, setEntryInfoId] = useState(null);
  const [entryInfoInitialized, setEntryInfoInitialized] = useState(false);

  // ========== UI State ==========
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [lastEditedField, setLastEditedField] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // ========== Save State ==========
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastEditedAt, setLastEditedAt] = useState(null);

  // ========== Completion Tracking State ==========
  const [completionMetrics, setCompletionMetrics] = useState(null);
  const [totalCompletionPercent, setTotalCompletionPercent] = useState(0);

  // Computed values
  const isChineseResidence = residentCountry === 'CHN';
  const cityOfResidenceLabel = isChineseResidence ? '居住省份' : '居住省份 / 城市';
  const cityOfResidenceHelpText = isChineseResidence
    ? '中国地址请填写所在省份（请使用英文，例如 Anhui）'
    : '请输入您居住的省份或城市 (请使用英文)';
  const cityOfResidencePlaceholder = isChineseResidence
    ? '例如 Anhui, Guangdong'
    : '例如 Anhui, Shanghai';

  // Reset all form state
  const resetFormState = useCallback(() => {
    // Reset passport state
    setPassportNo('');
    setVisaNumber('');
    setSurname('');
    setMiddleName('');
    setGivenName('');
    setNationality('');
    setDob('');
    setExpiryDate('');

    // Reset personal info state
    setSex('');
    setOccupation('');
    setCustomOccupation('');
    setCityOfResidence('');
    setResidentCountry('');
    setPhoneCode(getPhoneCode(passport?.nationality || ''));
    setPhoneNumber('');
    setEmail('');

    // Reset travel info state
    setTravelPurpose('');
    setCustomTravelPurpose('');
    setRecentStayCountry('');
    setBoardingCountry('');
    setArrivalFlightNumber('');
    setArrivalArrivalDate(smartDefaults.arrivalDate);
    setPreviousArrivalDate('');
    setDepartureFlightNumber('');
    setDepartureDepartureDate(smartDefaults.departureDate);
    setIsTransitPassenger(false);

    // Reset accommodation state
    setAccommodationType('HOTEL');
    setCustomAccommodationType('');
    setProvince('');
    setDistrict('');
    setDistrictId(null);
    setSubDistrict('');
    setSubDistrictId(null);
    setPostalCode('');
    setHotelAddress('');

    // Reset document photos
    setFlightTicketPhoto(null);
    setHotelReservationPhoto(null);

    // Reset funds state
    setFunds([]);
    setFundItemModalVisible(false);
    setSelectedFundItem(null);
    setCurrentFundItem(null);
    setNewFundItemType(null);

    // Reset UI state
    setErrors({});
    setWarnings({});
    setExpandedSection(null);
    setLastEditedField(null);
  }, [passport?.nationality, smartDefaults.arrivalDate, smartDefaults.departureDate]);

  // Get all form values as an object
  const getFormValues = useCallback(() => ({
    // Passport fields
    passportNo,
    visaNumber,
    surname,
    middleName,
    givenName,
    nationality,
    dob,
    expiryDate,
    sex,

    // Personal info fields
    occupation,
    customOccupation,
    cityOfResidence,
    residentCountry,
    phoneCode,
    phoneNumber,
    email,

    // Travel info fields
    travelPurpose,
    customTravelPurpose,
    recentStayCountry,
    boardingCountry,
    arrivalFlightNumber,
    arrivalArrivalDate,
    previousArrivalDate,
    departureFlightNumber,
    departureDepartureDate,
    isTransitPassenger,

    // Accommodation fields
    accommodationType,
    customAccommodationType,
    province,
    district,
    districtId,
    subDistrict,
    subDistrictId,
    postalCode,
    hotelAddress,

    // Document photos
    flightTicketPhoto,
    departureFlightTicketPhoto,
    hotelReservationPhoto,

    // Funds
    funds,

    // Data models
    passportData,
    personalInfoData,
    entryData,
    entryInfoId,
  }), [
    passportNo, visaNumber, surname, middleName, givenName, nationality, dob, expiryDate, sex,
    occupation, customOccupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, recentStayCountry, boardingCountry, arrivalFlightNumber,
    arrivalArrivalDate, previousArrivalDate, departureFlightNumber, departureDepartureDate,
    isTransitPassenger, accommodationType, customAccommodationType, province, district, districtId,
    subDistrict, subDistrictId, postalCode, hotelAddress, flightTicketPhoto, departureFlightTicketPhoto, hotelReservationPhoto,
    funds, passportData, personalInfoData, entryData, entryInfoId
  ]);

  return {
    // Passport state
    passportNo, setPassportNo,
    visaNumber, setVisaNumber,
    surname, setSurname,
    middleName, setMiddleName,
    givenName, setGivenName,
    nationality, setNationality,
    dob, setDob,
    expiryDate, setExpiryDate,

    // Personal info state
    sex, setSex,
    occupation, setOccupation,
    customOccupation, setCustomOccupation,
    cityOfResidence, setCityOfResidence,
    residentCountry, setResidentCountry,
    phoneCode, setPhoneCode,
    phoneNumber, setPhoneNumber,
    email, setEmail,

    // Computed personal info values
    isChineseResidence,
    cityOfResidenceLabel,
    cityOfResidenceHelpText,
    cityOfResidencePlaceholder,

    // Travel info state
    travelPurpose, setTravelPurpose,
    customTravelPurpose, setCustomTravelPurpose,
    recentStayCountry, setRecentStayCountry,
    boardingCountry, setBoardingCountry,
    arrivalFlightNumber, setArrivalFlightNumber,
    arrivalArrivalDate, setArrivalArrivalDate,
    previousArrivalDate, setPreviousArrivalDate,
    departureFlightNumber, setDepartureFlightNumber,
    departureDepartureDate, setDepartureDepartureDate,
    isTransitPassenger, setIsTransitPassenger,

    // Accommodation state
    accommodationType, setAccommodationType,
    customAccommodationType, setCustomAccommodationType,
    province, setProvince,
    district, setDistrict,
    districtId, setDistrictId,
    subDistrict, setSubDistrict,
    subDistrictId, setSubDistrictId,
    postalCode, setPostalCode,
    hotelAddress, setHotelAddress,

    // Document photos state
    flightTicketPhoto, setFlightTicketPhoto,
    departureFlightTicketPhoto, setDepartureFlightTicketPhoto,
    hotelReservationPhoto, setHotelReservationPhoto,

    // Funds state
    funds, setFunds,
    fundItemModalVisible, setFundItemModalVisible,
    selectedFundItem, setSelectedFundItem,
    currentFundItem, setCurrentFundItem,
    newFundItemType, setNewFundItemType,

    // Data model state
    passportData, setPassportData,
    personalInfoData, setPersonalInfoData,
    entryData, setEntryData,
    entryInfoId, setEntryInfoId,
    entryInfoInitialized, setEntryInfoInitialized,

    // UI state
    errors, setErrors,
    warnings, setWarnings,
    isLoading, setIsLoading,
    expandedSection, setExpandedSection,
    lastEditedField, setLastEditedField,
    scrollPosition, setScrollPosition,

    // Save state
    saveStatus, setSaveStatus,
    lastEditedAt, setLastEditedAt,

    // Completion tracking
    completionMetrics, setCompletionMetrics,
    totalCompletionPercent, setTotalCompletionPercent,

    // Utility functions
    resetFormState,
    getFormValues,
    smartDefaults,
  };
};

export default useThailandFormState;
