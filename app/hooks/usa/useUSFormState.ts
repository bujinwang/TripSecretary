// @ts-nocheck

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing all form state in the US Travel Info Screen
 * Consolidates all useState declarations into a single, organized hook
 *
 * @param {Object} passport - Passport object with initial values
 * @returns {Object} All form state variables and their setters
 */
export const useUSFormState = (passport) => {
  // ============================================================
  // PASSPORT SECTION STATE
  // ============================================================
  const [passportNo, setPassportNo] = useState(passport?.passportNo || passport?.passportNumber || '');
  const [fullName, setFullName] = useState(passport?.fullName || passport?.name || '');
  const [nationality, setNationality] = useState(passport?.nationality || '');
  const [dob, setDob] = useState(passport?.dob || passport?.dateOfBirth || '');
  const [expiryDate, setExpiryDate] = useState(passport?.expiryDate || '');
  const [gender, setGender] = useState(passport?.gender || passport?.sex || '');

  // ============================================================
  // PERSONAL INFO SECTION STATE
  // ============================================================
  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // ============================================================
  // TRAVEL DETAILS SECTION STATE
  // ============================================================
  // Travel purpose
  const [travelPurpose, setTravelPurpose] = useState('Tourism');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');

  // Flight information
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  });

  // Accommodation
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationAddress, setAccommodationAddress] = useState('');
  const [accommodationPhone, setAccommodationPhone] = useState('');
  const [lengthOfStay, setLengthOfStay] = useState('');

  // ============================================================
  // FUNDS SECTION STATE
  // ============================================================
  const [funds, setFunds] = useState([]);

  // ============================================================
  // UI STATE
  // ============================================================
  const [expandedSection, setExpandedSection] = useState(null);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [lastEditedField, setLastEditedField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null); // 'pending' | 'saving' | 'saved' | 'error'
  const [lastEditedAt, setLastEditedAt] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Fund item modal state
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [currentFundItem, setCurrentFundItem] = useState(null);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Reset all form fields to empty/default values
   */
  const resetForm = useCallback(() => {
    // Passport section
    setPassportNo('');
    setFullName('');
    setNationality('');
    setDob('');
    setExpiryDate('');
    setGender('');

    // Personal info section
    setOccupation('');
    setCityOfResidence('');
    setResidentCountry('');
    setPhoneCode('');
    setPhoneNumber('');
    setEmail('');

    // Travel details section
    setTravelPurpose('Tourism');
    setCustomTravelPurpose('');
    setArrivalFlightNumber('');
    const date = new Date();
    date.setDate(date.getDate() + 1);
    setArrivalDate(date.toISOString().split('T')[0]);
    setIsTransitPassenger(false);
    setAccommodationAddress('');
    setAccommodationPhone('');
    setLengthOfStay('');

    // Funds section
    setFunds([]);

    // UI state
    setExpandedSection(null);
    setErrors({});
    setWarnings({});
    setLastEditedField(null);
  }, []);

  /**
   * Get all form data as a single object
   */
  const getFormData = useCallback(() => {
    return {
      // Passport
      passportNo,
      fullName,
      nationality,
      dob,
      expiryDate,
      gender,

      // Personal info
      occupation,
      cityOfResidence,
      residentCountry,
      phoneCode,
      phoneNumber,
      email,

      // Travel details
      travelPurpose,
      customTravelPurpose,
      arrivalFlightNumber,
      arrivalDate,
      isTransitPassenger,
      accommodationAddress,
      accommodationPhone,
      lengthOfStay,

      // Funds
      funds,
    };
  }, [
    passportNo, fullName, nationality, dob, expiryDate, gender,
    occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, arrivalFlightNumber, arrivalDate,
    isTransitPassenger, accommodationAddress, accommodationPhone, lengthOfStay,
    funds
  ]);

  // ============================================================
  // RETURN ALL STATE AND SETTERS
  // ============================================================
  return {
    // Passport section
    passportNo, setPassportNo,
    fullName, setFullName,
    nationality, setNationality,
    dob, setDob,
    expiryDate, setExpiryDate,
    gender, setGender,

    // Personal info section
    occupation, setOccupation,
    cityOfResidence, setCityOfResidence,
    residentCountry, setResidentCountry,
    phoneCode, setPhoneCode,
    phoneNumber, setPhoneNumber,
    email, setEmail,

    // Travel details section
    travelPurpose, setTravelPurpose,
    customTravelPurpose, setCustomTravelPurpose,
    arrivalFlightNumber, setArrivalFlightNumber,
    arrivalDate, setArrivalDate,
    isTransitPassenger, setIsTransitPassenger,
    accommodationAddress, setAccommodationAddress,
    accommodationPhone, setAccommodationPhone,
    lengthOfStay, setLengthOfStay,

    // Funds section
    funds, setFunds,

    // UI state
    expandedSection, setExpandedSection,
    errors, setErrors,
    warnings, setWarnings,
    lastEditedField, setLastEditedField,
    isLoading, setIsLoading,
    saveStatus, setSaveStatus,
    lastEditedAt, setLastEditedAt,
    scrollPosition, setScrollPosition,

    // Fund item modal
    fundItemModalVisible, setFundItemModalVisible,
    currentFundItem, setCurrentFundItem,
    newFundItemType, setNewFundItemType,

    // Helper methods
    resetForm,
    getFormData,
  };
};
