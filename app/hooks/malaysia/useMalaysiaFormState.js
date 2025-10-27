// useMalaysiaFormState.js
// Consolidates all form state management for Malaysia Travel Info Screen
import { useState, useCallback } from 'react';
import { getPhoneCode } from '../../data/phoneCodes';

/**
 * Custom hook to manage all form state for Malaysia Travel Info Screen
 * @param {Object} passport - Passport data object
 * @param {Object} destination - Destination object
 * @returns {Object} All form state variables and setters
 */
export const useMalaysiaFormState = (passport, destination) => {
  // Smart defaults for common scenarios
  const getSmartDefaults = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      travelPurpose: 'TOURISM',
      accommodationType: 'HOTEL',
      arrivalDate: tomorrow.toISOString().split('T')[0],
      stayDuration: '7',
      boardingCountry: passport?.nationality || 'CHN',
    };
  };

  const smartDefaults = getSmartDefaults();

  // ==================== PASSPORT SECTION ====================
  const [passportNo, setPassportNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [sex, setSex] = useState('');

  // ==================== PERSONAL INFO SECTION ====================
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // ==================== FUNDS SECTION ====================
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [currentFundItem, setCurrentFundItem] = useState(null);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // ==================== TRAVEL INFO SECTION ====================
  const [travelPurpose, setTravelPurpose] = useState('');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState(smartDefaults.arrivalDate);
  const [accommodationType, setAccommodationType] = useState('HOTEL');
  const [customAccommodationType, setCustomAccommodationType] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [stayDuration, setStayDuration] = useState(smartDefaults.stayDuration);

  // ==================== DOCUMENT PHOTOS ====================
  const [flightTicketPhoto, setFlightTicketPhoto] = useState(null);
  const [hotelReservationPhoto, setHotelReservationPhoto] = useState(null);

  // ==================== UI STATE ====================
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastEditedAt, setLastEditedAt] = useState(null);
  const [lastEditedField, setLastEditedField] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // ==================== DATA MODELS ====================
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);

  // ==================== ENTRY INFO ====================
  const [entryInfoId, setEntryInfoId] = useState(null);
  const [entryInfoInitialized, setEntryInfoInitialized] = useState(false);

  // ==================== COMPLETION TRACKING ====================
  const [completionMetrics, setCompletionMetrics] = useState(null);
  const [totalCompletionPercent, setTotalCompletionPercent] = useState(0);

  // ==================== HELPER METHODS ====================

  /**
   * Reset all form fields to default values
   */
  const resetForm = useCallback(() => {
    // Reset passport section
    setPassportNo('');
    setFullName('');
    setNationality('');
    setDob('');
    setExpiryDate('');
    setSex('');

    // Reset personal info section
    setOccupation('');
    setCustomOccupation('');
    setResidentCountry('');
    setPhoneCode(getPhoneCode(passport?.nationality || ''));
    setPhoneNumber('');
    setEmail('');

    // Reset funds section
    setFunds([]);
    setFundItemModalVisible(false);
    setSelectedFundItem(null);
    setCurrentFundItem(null);
    setNewFundItemType(null);

    // Reset travel info section
    const newSmartDefaults = getSmartDefaults();
    setTravelPurpose('');
    setCustomTravelPurpose('');
    setArrivalFlightNumber('');
    setArrivalDate(newSmartDefaults.arrivalDate);
    setAccommodationType('HOTEL');
    setCustomAccommodationType('');
    setHotelAddress('');
    setStayDuration(newSmartDefaults.stayDuration);

    // Reset document photos
    setFlightTicketPhoto(null);
    setHotelReservationPhoto(null);

    // Reset UI state
    setErrors({});
    setWarnings({});
    setExpandedSection(null);
    setLastEditedField(null);
    setLastEditedAt(null);
    setScrollPosition(0);
  }, [passport]);

  /**
   * Get all form data as a single object for saving
   */
  const getFormData = useCallback(() => {
    return {
      // Passport section
      passportNo,
      fullName,
      nationality,
      dob,
      expiryDate,
      sex,

      // Personal info section
      occupation,
      customOccupation,
      residentCountry,
      phoneCode,
      phoneNumber,
      email,

      // Funds section
      funds,

      // Travel info section
      travelPurpose,
      customTravelPurpose,
      arrivalFlightNumber,
      arrivalDate,
      accommodationType,
      customAccommodationType,
      hotelAddress,
      stayDuration,

      // Document photos
      flightTicketPhoto,
      hotelReservationPhoto,

      // Entry info
      entryInfoId,
    };
  }, [
    passportNo, fullName, nationality, dob, expiryDate, sex,
    occupation, customOccupation, residentCountry, phoneCode, phoneNumber, email,
    funds,
    travelPurpose, customTravelPurpose, arrivalFlightNumber, arrivalDate,
    accommodationType, customAccommodationType, hotelAddress, stayDuration,
    flightTicketPhoto, hotelReservationPhoto,
    entryInfoId
  ]);

  /**
   * Populate form with existing data
   */
  const populateForm = useCallback((data) => {
    if (!data) return;

    // Populate passport section
    if (data.passport) {
      setPassportNo(data.passport.passportNumber || '');
      setFullName(data.passport.fullName || '');
      setNationality(data.passport.nationality || '');
      setDob(data.passport.dateOfBirth || '');
      setExpiryDate(data.passport.expiryDate || '');
      setSex(data.passport.gender || '');
    }

    // Populate personal info section
    if (data.personalInfo) {
      setOccupation(data.personalInfo.occupation || '');
      setResidentCountry(data.personalInfo.countryRegion || '');
      setPhoneCode(data.personalInfo.phoneCode || getPhoneCode(passport?.nationality || ''));
      setPhoneNumber(data.personalInfo.phoneNumber || '');
      setEmail(data.personalInfo.email || '');
    }

    // Populate travel info section
    if (data.travelInfo) {
      setTravelPurpose(data.travelInfo.travelPurpose || '');
      setArrivalFlightNumber(data.travelInfo.arrivalFlightNumber || '');
      setArrivalDate(data.travelInfo.arrivalDate || data.travelInfo.arrivalArrivalDate || smartDefaults.arrivalDate);
      setAccommodationType(data.travelInfo.accommodationType || 'HOTEL');
      setHotelAddress(data.travelInfo.hotelAddress || '');
      setStayDuration(data.travelInfo.lengthOfStay || data.travelInfo.stayDuration || smartDefaults.stayDuration);
    }

    // Populate funds
    if (data.fundItems && data.fundItems.length > 0) {
      setFunds(data.fundItems);
    }
  }, [passport, smartDefaults]);

  // ==================== RETURN ALL STATE ====================
  return {
    // Passport section
    passportNo,
    setPassportNo,
    fullName,
    setFullName,
    nationality,
    setNationality,
    dob,
    setDob,
    expiryDate,
    setExpiryDate,
    sex,
    setSex,

    // Personal info section
    occupation,
    setOccupation,
    customOccupation,
    setCustomOccupation,
    residentCountry,
    setResidentCountry,
    phoneCode,
    setPhoneCode,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,

    // Funds section
    funds,
    setFunds,
    fundItemModalVisible,
    setFundItemModalVisible,
    selectedFundItem,
    setSelectedFundItem,
    currentFundItem,
    setCurrentFundItem,
    newFundItemType,
    setNewFundItemType,

    // Travel info section
    travelPurpose,
    setTravelPurpose,
    customTravelPurpose,
    setCustomTravelPurpose,
    arrivalFlightNumber,
    setArrivalFlightNumber,
    arrivalDate,
    setArrivalDate,
    accommodationType,
    setAccommodationType,
    customAccommodationType,
    setCustomAccommodationType,
    hotelAddress,
    setHotelAddress,
    stayDuration,
    setStayDuration,

    // Document photos
    flightTicketPhoto,
    setFlightTicketPhoto,
    hotelReservationPhoto,
    setHotelReservationPhoto,

    // UI state
    errors,
    setErrors,
    warnings,
    setWarnings,
    isLoading,
    setIsLoading,
    expandedSection,
    setExpandedSection,
    saveStatus,
    setSaveStatus,
    lastEditedAt,
    setLastEditedAt,
    lastEditedField,
    setLastEditedField,
    scrollPosition,
    setScrollPosition,

    // Data models
    passportData,
    setPassportData,
    personalInfoData,
    setPersonalInfoData,
    entryData,
    setEntryData,

    // Entry info
    entryInfoId,
    setEntryInfoId,
    entryInfoInitialized,
    setEntryInfoInitialized,

    // Completion tracking
    completionMetrics,
    setCompletionMetrics,
    totalCompletionPercent,
    setTotalCompletionPercent,

    // Helper methods
    resetForm,
    getFormData,
    populateForm,
    smartDefaults,
  };
};
