/**
 * useSingaporeFormState Hook
 *
 * Manages all form state for Singapore Travel Info Screen
 * Consolidates 49+ useState declarations into a single, manageable hook
 */

import { useState, useCallback } from 'react';
import { getPhoneCode } from '../../data/phoneCodes';

/**
 * Custom hook to manage Singapore travel form state
 * @param {Object} passport - Passport information
 * @returns {Object} Form state and setters
 */
export const useSingaporeFormState = (passport) => {
  // ========== Passport State ==========
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // ========== Personal Info State ==========
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // ========== Travel Info State ==========
  const [travelPurpose, setTravelPurpose] = useState('');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [boardingCountry, setBoardingCountry] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState('');
  const [previousArrivalDate, setPreviousArrivalDate] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState('');
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);

  // ========== Accommodation State ==========
  const [accommodationType, setAccommodationType] = useState('');
  const [customAccommodationType, setCustomAccommodationType] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');

  // ========== Funds State ==========
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // ========== Data Model State ==========
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);

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

  // Reset all form state
  const resetFormState = useCallback(() => {
    // Reset passport state
    setPassportNo('');
    setVisaNumber('');
    setFullName('');
    setNationality('');
    setDob('');
    setExpiryDate('');

    // Reset personal info state
    setSex('');
    setOccupation('');
    setCityOfResidence('');
    setResidentCountry('');
    setPhoneCode(getPhoneCode(passport?.nationality || ''));
    setPhoneNumber('');
    setEmail('');

    // Reset travel info state
    setTravelPurpose('');
    setCustomTravelPurpose('');
    setBoardingCountry('');
    setArrivalFlightNumber('');
    setArrivalArrivalDate('');
    setPreviousArrivalDate('');
    setDepartureFlightNumber('');
    setDepartureDepartureDate('');
    setIsTransitPassenger(false);

    // Reset accommodation state
    setAccommodationType('');
    setCustomAccommodationType('');
    setProvince('');
    setDistrict('');
    setSubDistrict('');
    setPostalCode('');
    setHotelAddress('');

    // Reset funds state
    setFunds([]);
    setFundItemModalVisible(false);
    setSelectedFundItem(null);
    setIsCreatingFundItem(false);
    setNewFundItemType(null);

    // Reset UI state
    setErrors({});
    setWarnings({});
    setExpandedSection(null);
    setLastEditedField(null);
  }, [passport?.nationality]);

  // Get all form values as an object
  const getFormValues = useCallback(() => ({
    // Passport fields
    passportNo,
    visaNumber,
    fullName,
    nationality,
    dob,
    expiryDate,
    sex,

    // Personal info fields
    occupation,
    cityOfResidence,
    residentCountry,
    phoneCode,
    phoneNumber,
    email,

    // Travel info fields
    travelPurpose,
    customTravelPurpose,
    boardingCountry,
    arrivalFlightNumber,
    arrivalArrivalDate,
    departureFlightNumber,
    departureDepartureDate,
    isTransitPassenger,

    // Accommodation fields
    accommodationType,
    customAccommodationType,
    province,
    district,
    subDistrict,
    postalCode,
    hotelAddress,

    // Funds
    funds,
  }), [
    passportNo, visaNumber, fullName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, boardingCountry, arrivalFlightNumber, arrivalArrivalDate,
    departureFlightNumber, departureDepartureDate, isTransitPassenger,
    accommodationType, customAccommodationType, province, district, subDistrict, postalCode, hotelAddress,
    funds,
  ]);

  // Return all state and setters
  return {
    // Passport section
    passportNo, setPassportNo,
    visaNumber, setVisaNumber,
    fullName, setFullName,
    nationality, setNationality,
    dob, setDob,
    expiryDate, setExpiryDate,

    // Personal info section
    sex, setSex,
    occupation, setOccupation,
    cityOfResidence, setCityOfResidence,
    residentCountry, setResidentCountry,
    phoneCode, setPhoneCode,
    phoneNumber, setPhoneNumber,
    email, setEmail,

    // Travel info section
    travelPurpose, setTravelPurpose,
    customTravelPurpose, setCustomTravelPurpose,
    boardingCountry, setBoardingCountry,
    arrivalFlightNumber, setArrivalFlightNumber,
    arrivalArrivalDate, setArrivalArrivalDate,
    previousArrivalDate, setPreviousArrivalDate,
    departureFlightNumber, setDepartureFlightNumber,
    departureDepartureDate, setDepartureDepartureDate,
    isTransitPassenger, setIsTransitPassenger,

    // Accommodation section
    accommodationType, setAccommodationType,
    customAccommodationType, setCustomAccommodationType,
    province, setProvince,
    district, setDistrict,
    subDistrict, setSubDistrict,
    postalCode, setPostalCode,
    hotelAddress, setHotelAddress,

    // Funds section
    funds, setFunds,
    fundItemModalVisible, setFundItemModalVisible,
    selectedFundItem, setSelectedFundItem,
    isCreatingFundItem, setIsCreatingFundItem,
    newFundItemType, setNewFundItemType,

    // Data model state
    passportData, setPassportData,
    personalInfoData, setPersonalInfoData,
    entryData, setEntryData,

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

    // Helper methods
    resetFormState,
    getFormValues,
  };
};

export default useSingaporeFormState;
