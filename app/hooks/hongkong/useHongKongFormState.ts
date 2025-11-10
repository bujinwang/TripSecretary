// @ts-nocheck

/**
 * useHongKongFormState - Consolidates all form state for Hong Kong Travel Info Screen
 *
 * This hook consolidates 58 individual useState declarations into a single,
 * manageable state management hook, following the Single Responsibility Principle.
 *
 * Reference: docs/TRAVEL_INFO_SCREEN_REFACTORING_GUIDE.md - Phase 1
 */

import { useState, useCallback } from 'react';
import { getPhoneCode } from '../../data/phoneCodes';

export const useHongKongFormState = (passport) => {
  // Smart defaults for common scenarios
  const getSmartDefaults = () => {
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
  };

  const smartDefaults = getSmartDefaults();

  // ======================
  // Data Model State
  // ======================
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);

  // ======================
  // Passport Section State
  // ======================
  const [passportNo, setPassportNo] = useState(passport?.passportNo || '');
  const [visaNumber, setVisaNumber] = useState('');
  const [surname, setSurname] = useState(passport?.surname || '');
  const [middleName, setMiddleName] = useState('');
  const [givenName, setGivenName] = useState(passport?.givenName || '');
  const [nationality, setNationality] = useState(passport?.nationality || '');
  const [dob, setDob] = useState(passport?.dateOfBirth || '');
  const [expiryDate, setExpiryDate] = useState(passport?.expiryDate || '');

  // ======================
  // Personal Info Section State
  // ======================
  const [sex, setSex] = useState(passport?.sex || passport?.gender || '');
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // ======================
  // Funds Section State
  // ======================
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [currentFundItem, setCurrentFundItem] = useState(null);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // ======================
  // Entry Info State
  // ======================
  const [entryInfoId, setEntryInfoId] = useState(null);
  const [entryInfoInitialized, setEntryInfoInitialized] = useState(false);

  // ======================
  // Travel Details Section State
  // ======================
  const [travelPurpose, setTravelPurpose] = useState(smartDefaults.travelPurpose);
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [recentStayCountry, setRecentStayCountry] = useState('');
  const [boardingCountry, setBoardingCountry] = useState(smartDefaults.boardingCountry);

  // Flight information
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState(smartDefaults.arrivalDate);
  const [previousArrivalDate, setPreviousArrivalDate] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState(smartDefaults.departureDate);

  // Accommodation information
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationType, setAccommodationType] = useState(smartDefaults.accommodationType);
  const [customAccommodationType, setCustomAccommodationType] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState(null);
  const [subDistrict, setSubDistrict] = useState('');
  const [subDistrictId, setSubDistrictId] = useState(null);
  const [postalCode, setPostalCode] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');

  // ======================
  // Document Photos
  // ======================
  const [flightTicketPhoto, setFlightTicketPhoto] = useState(null);
  const [hotelReservationPhoto, setHotelReservationPhoto] = useState(null);

  // ======================
  // UI State
  // ======================
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastEditedAt, setLastEditedAt] = useState(null);

  // Session state
  const [lastEditedField, setLastEditedField] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Completion tracking
  const [completionMetrics, setCompletionMetrics] = useState(null);
  const [totalCompletionPercent, setTotalCompletionPercent] = useState(0);

  // ======================
  // Helper Methods
  // ======================
  const resetForm = useCallback(() => {
    // Passport section
    setPassportNo('');
    setVisaNumber('');
    setSurname('');
    setMiddleName('');
    setGivenName('');
    setNationality('');
    setDob('');
    setExpiryDate('');

    // Personal info section
    setSex('');
    setOccupation('');
    setCustomOccupation('');
    setCityOfResidence('');
    setResidentCountry('');
    setPhoneCode('');
    setPhoneNumber('');
    setEmail('');

    // Funds section
    setFunds([]);
    setSelectedFundItem(null);

    // Travel details section
    setTravelPurpose(smartDefaults.travelPurpose);
    setCustomTravelPurpose('');
    setRecentStayCountry('');
    setBoardingCountry(smartDefaults.boardingCountry);
    setArrivalFlightNumber('');
    setArrivalArrivalDate(smartDefaults.arrivalDate);
    setDepartureFlightNumber('');
    setDepartureDepartureDate(smartDefaults.departureDate);
    setIsTransitPassenger(false);
    setAccommodationType(smartDefaults.accommodationType);
    setCustomAccommodationType('');
    setProvince('');
    setDistrict('');
    setDistrictId(null);
    setSubDistrict('');
    setSubDistrictId(null);
    setPostalCode('');
    setHotelAddress('');
    setFlightTicketPhoto(null);
    setHotelReservationPhoto(null);

    // UI state
    setErrors({});
    setWarnings({});
    setExpandedSection(null);
  }, [smartDefaults]);

  // Return all state and setters
  return {
    // Data models
    passportData, setPassportData,
    personalInfoData, setPersonalInfoData,
    entryData, setEntryData,

    // Passport section
    passportNo, setPassportNo,
    visaNumber, setVisaNumber,
    surname, setSurname,
    middleName, setMiddleName,
    givenName, setGivenName,
    nationality, setNationality,
    dob, setDob,
    expiryDate, setExpiryDate,

    // Personal info section
    sex, setSex,
    occupation, setOccupation,
    customOccupation, setCustomOccupation,
    cityOfResidence, setCityOfResidence,
    residentCountry, setResidentCountry,
    phoneCode, setPhoneCode,
    phoneNumber, setPhoneNumber,
    email, setEmail,

    // Funds section
    funds, setFunds,
    fundItemModalVisible, setFundItemModalVisible,
    selectedFundItem, setSelectedFundItem,
    currentFundItem, setCurrentFundItem,
    newFundItemType, setNewFundItemType,

    // Entry info
    entryInfoId, setEntryInfoId,
    entryInfoInitialized, setEntryInfoInitialized,

    // Travel details section
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
    accommodationType, setAccommodationType,
    customAccommodationType, setCustomAccommodationType,
    province, setProvince,
    district, setDistrict,
    districtId, setDistrictId,
    subDistrict, setSubDistrict,
    subDistrictId, setSubDistrictId,
    postalCode, setPostalCode,
    hotelAddress, setHotelAddress,

    // Document photos
    flightTicketPhoto, setFlightTicketPhoto,
    hotelReservationPhoto, setHotelReservationPhoto,

    // UI state
    errors, setErrors,
    warnings, setWarnings,
    isLoading, setIsLoading,
    expandedSection, setExpandedSection,
    saveStatus, setSaveStatus,
    lastEditedAt, setLastEditedAt,
    lastEditedField, setLastEditedField,
    scrollPosition, setScrollPosition,
    completionMetrics, setCompletionMetrics,
    totalCompletionPercent, setTotalCompletionPercent,

    // Helper methods
    resetForm,
  };
};
