/**
 * Singapore Form State Hook
 *
 * Consolidates all useState declarations from SingaporeTravelInfoScreen
 * into a single, manageable hook. This follows the Thailand refactoring pattern
 * for consistent state management across country screens.
 *
 * Extracted from: SingaporeTravelInfoScreen.js (48 useState declarations)
 * Pattern: Same as Thailand's useThailandFormState
 */

import { useState, useCallback } from 'react';
import { getPhoneCode } from '../../data/phoneCodes';

export const useSingaporeFormState = (passport) => {
  // Data model instances
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);

  // Passport Section State
  const [passportNo, setPassportNo] = useState(passport?.passportNo || '');
  const [visaNumber, setVisaNumber] = useState('');
  const [fullName, setFullName] = useState(passport?.name || passport?.nameEn || '');
  const [nationality, setNationality] = useState(passport?.nationality || '');
  const [dob, setDob] = useState(passport?.dateOfBirth || '');
  const [expiryDate, setExpiryDate] = useState(passport?.expiryDate || '');

  // Personal Info Section State
  const [sex, setSex] = useState(passport?.gender || '');
  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Funds Section State
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // Travel Info Section State
  const [travelPurpose, setTravelPurpose] = useState('');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [boardingCountry, setBoardingCountry] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState('');
  const [previousArrivalDate, setPreviousArrivalDate] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState('');
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationType, setAccommodationType] = useState('');
  const [customAccommodationType, setCustomAccommodationType] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');

  // UI State
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Auto-save State
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastEditedAt, setLastEditedAt] = useState(null);

  // Session State
  const [lastEditedField, setLastEditedField] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Completion Tracking State
  const [completionMetrics, setCompletionMetrics] = useState(null);
  const [totalCompletionPercent, setTotalCompletionPercent] = useState(0);

  // Helper: Reset form to initial state
  const resetForm = useCallback(() => {
    // Reset passport section
    setPassportNo('');
    setVisaNumber('');
    setFullName('');
    setNationality('');
    setDob('');
    setExpiryDate('');

    // Reset personal info section
    setSex('');
    setOccupation('');
    setCityOfResidence('');
    setResidentCountry('');
    setPhoneCode('');
    setPhoneNumber('');
    setEmail('');

    // Reset funds section
    setFunds([]);
    setFundItemModalVisible(false);
    setSelectedFundItem(null);
    setIsCreatingFundItem(false);
    setNewFundItemType(null);

    // Reset travel info section
    setTravelPurpose('');
    setCustomTravelPurpose('');
    setBoardingCountry('');
    setArrivalFlightNumber('');
    setArrivalArrivalDate('');
    setPreviousArrivalDate('');
    setDepartureFlightNumber('');
    setDepartureDepartureDate('');
    setIsTransitPassenger(false);
    setAccommodationType('');
    setCustomAccommodationType('');
    setProvince('');
    setDistrict('');
    setSubDistrict('');
    setPostalCode('');
    setHotelAddress('');

    // Reset UI state
    setErrors({});
    setWarnings({});
    setExpandedSection(null);
    setLastEditedField(null);
  }, []);

  // Helper: Populate form from loaded data
  const populateForm = useCallback((data) => {
    if (!data) return;

    // Passport section
    if (data.passportNo !== undefined) setPassportNo(data.passportNo);
    if (data.visaNumber !== undefined) setVisaNumber(data.visaNumber);
    if (data.fullName !== undefined) setFullName(data.fullName);
    if (data.nationality !== undefined) setNationality(data.nationality);
    if (data.dob !== undefined) setDob(data.dob);
    if (data.expiryDate !== undefined) setExpiryDate(data.expiryDate);

    // Personal info section
    if (data.sex !== undefined) setSex(data.sex);
    if (data.occupation !== undefined) setOccupation(data.occupation);
    if (data.cityOfResidence !== undefined) setCityOfResidence(data.cityOfResidence);
    if (data.residentCountry !== undefined) setResidentCountry(data.residentCountry);
    if (data.phoneCode !== undefined) setPhoneCode(data.phoneCode);
    if (data.phoneNumber !== undefined) setPhoneNumber(data.phoneNumber);
    if (data.email !== undefined) setEmail(data.email);

    // Funds section
    if (data.funds !== undefined) setFunds(data.funds);

    // Travel info section
    if (data.travelPurpose !== undefined) setTravelPurpose(data.travelPurpose);
    if (data.customTravelPurpose !== undefined) setCustomTravelPurpose(data.customTravelPurpose);
    if (data.boardingCountry !== undefined) setBoardingCountry(data.boardingCountry);
    if (data.arrivalFlightNumber !== undefined) setArrivalFlightNumber(data.arrivalFlightNumber);
    if (data.arrivalArrivalDate !== undefined) setArrivalArrivalDate(data.arrivalArrivalDate);
    if (data.previousArrivalDate !== undefined) setPreviousArrivalDate(data.previousArrivalDate);
    if (data.departureFlightNumber !== undefined) setDepartureFlightNumber(data.departureFlightNumber);
    if (data.departureDepartureDate !== undefined) setDepartureDepartureDate(data.departureDepartureDate);
    if (data.isTransitPassenger !== undefined) setIsTransitPassenger(data.isTransitPassenger);
    if (data.accommodationType !== undefined) setAccommodationType(data.accommodationType);
    if (data.customAccommodationType !== undefined) setCustomAccommodationType(data.customAccommodationType);
    if (data.province !== undefined) setProvince(data.province);
    if (data.district !== undefined) setDistrict(data.district);
    if (data.subDistrict !== undefined) setSubDistrict(data.subDistrict);
    if (data.postalCode !== undefined) setPostalCode(data.postalCode);
    if (data.hotelAddress !== undefined) setHotelAddress(data.hotelAddress);
  }, []);

  // Return all state and setters
  return {
    // Data models
    passportData,
    setPassportData,
    personalInfoData,
    setPersonalInfoData,
    entryData,
    setEntryData,

    // Passport section
    passportNo,
    setPassportNo,
    visaNumber,
    setVisaNumber,
    fullName,
    setFullName,
    nationality,
    setNationality,
    dob,
    setDob,
    expiryDate,
    setExpiryDate,

    // Personal info section
    sex,
    setSex,
    occupation,
    setOccupation,
    cityOfResidence,
    setCityOfResidence,
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
    isCreatingFundItem,
    setIsCreatingFundItem,
    newFundItemType,
    setNewFundItemType,

    // Travel info section
    travelPurpose,
    setTravelPurpose,
    customTravelPurpose,
    setCustomTravelPurpose,
    boardingCountry,
    setBoardingCountry,
    arrivalFlightNumber,
    setArrivalFlightNumber,
    arrivalArrivalDate,
    setArrivalArrivalDate,
    previousArrivalDate,
    setPreviousArrivalDate,
    departureFlightNumber,
    setDepartureFlightNumber,
    departureDepartureDate,
    setDepartureDepartureDate,
    isTransitPassenger,
    setIsTransitPassenger,
    accommodationType,
    setAccommodationType,
    customAccommodationType,
    setCustomAccommodationType,
    province,
    setProvince,
    district,
    setDistrict,
    subDistrict,
    setSubDistrict,
    postalCode,
    setPostalCode,
    hotelAddress,
    setHotelAddress,

    // UI state
    errors,
    setErrors,
    warnings,
    setWarnings,
    isLoading,
    setIsLoading,
    expandedSection,
    setExpandedSection,

    // Auto-save state
    saveStatus,
    setSaveStatus,
    lastEditedAt,
    setLastEditedAt,

    // Session state
    lastEditedField,
    setLastEditedField,
    scrollPosition,
    setScrollPosition,

    // Completion tracking
    completionMetrics,
    setCompletionMetrics,
    totalCompletionPercent,
    setTotalCompletionPercent,

    // Helper methods
    resetForm,
    populateForm,
  };
};

export default useSingaporeFormState;
