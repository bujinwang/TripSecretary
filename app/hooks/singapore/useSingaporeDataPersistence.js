/**
 * Singapore Data Persistence Hook
 *
 * Handles all data loading and saving operations for Singapore Travel Info Screen.
 * Extracted from SingaporeTravelInfoScreen.js following Thailand pattern.
 *
 * Responsibilities:
 * - Load data from UserDataService on mount
 * - Save data to backend with debouncing
 * - Handle fund items refresh
 * - Manage auto-save functionality
 */

import { useCallback, useRef } from 'react';
import UserDataService from '../../services/data/UserDataService';
import { getPhoneCode } from '../../data/phoneCodes';

// Constants
const PREDEFINED_TRAVEL_PURPOSES = ['HOLIDAY', 'BUSINESS', 'MEETING', 'EDUCATION', 'MEDICAL', 'SPORTS', 'EMPLOYMENT', 'VISIT_FAMILY', 'TRANSIT'];
const PREDEFINED_ACCOMMODATION_TYPES = ['HOTEL', 'HOSTEL', 'APARTMENT', 'FRIEND_FAMILY', 'AIRBNB', 'GUESTHOUSE'];

export const useSingaporeDataPersistence = ({
  passport,
  destination,
  userId,
  formState,
  travelInfoForm,
  migrateExistingDataToInteractionState,
}) => {
  const saveTimeoutRef = useRef(null);

  /**
   * Main data loading function
   * Loads passport, personal info, funds, and travel info from UserDataService
   */
  const loadData = useCallback(async () => {
    try {
      formState.setIsLoading(true);

      // Initialize UserDataService
      await UserDataService.initialize(userId);

      // Load all user data
      const userData = await UserDataService.getAllUserData(userId);

      // Load travel info for migration
      try {
        const destinationId = destination?.id || 'singapore';
        const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
        if (travelInfo) {
          userData.travelInfo = travelInfo;
        }
      } catch (error) {
        console.log('Failed to load travel info for migration:', error);
      }

      // Migrate existing data to interaction state
      if (travelInfoForm.isInitialized) {
        await migrateExistingDataToInteractionState(userData);
      } else {
        // Wait for initialization
        setTimeout(async () => {
          if (travelInfoForm.isInitialized) {
            await migrateExistingDataToInteractionState(userData);
          }
        }, 100);
      }

      // Load passport info
      const passportInfo = userData?.passport;
      if (passportInfo) {
        formState.setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');
        formState.setFullName(
          passportInfo.fullName ||
          formState.fullName ||
          passport?.nameEn ||
          passport?.name ||
          ''
        );
        formState.setNationality(passportInfo.nationality || passport?.nationality || '');
        formState.setDob(passportInfo.dateOfBirth || passport?.dob || '');
        formState.setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');
        formState.setPassportData(passportInfo);
      } else {
        // Fallback to route params
        formState.setPassportNo(passport?.passportNo || '');
        formState.setFullName(formState.fullName || passport?.nameEn || passport?.name || '');
        formState.setNationality(passport?.nationality || '');
        formState.setDob(passport?.dob || '');
        formState.setExpiryDate(passport?.expiry || '');
      }

      // Load personal info
      const personalInfo = userData?.personalInfo;
      if (personalInfo) {
        formState.setOccupation(personalInfo.occupation || '');
        formState.setCityOfResidence(personalInfo.provinceCity || '');
        formState.setResidentCountry(personalInfo.countryRegion || '');
        formState.setPhoneNumber(personalInfo.phoneNumber || '');
        formState.setEmail(personalInfo.email || '');
        formState.setPhoneCode(
          personalInfo.phoneCode ||
          getPhoneCode(personalInfo.countryRegion || passport?.nationality || '')
        );
        formState.setPersonalInfoData(personalInfo);
      } else {
        formState.setPhoneCode(getPhoneCode(passport?.nationality || ''));
      }

      // Load gender
      const loadedSex = passportInfo?.gender || passport?.sex || passport?.gender || formState.sex || 'Male';
      formState.setSex(loadedSex);

      // Load funds
      await refreshFundItems();

      // Load travel info
      try {
        const destinationId = destination?.id || 'singapore';
        let travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

        // Fallback for legacy data
        if (!travelInfo && destination?.name) {
          travelInfo = await UserDataService.getTravelInfo(userId, destination.name);
        }

        if (travelInfo) {
          // Travel purpose
          const loadedPurpose = travelInfo.travelPurpose || 'HOLIDAY';
          if (PREDEFINED_TRAVEL_PURPOSES.includes(loadedPurpose)) {
            formState.setTravelPurpose(loadedPurpose);
            formState.setCustomTravelPurpose('');
          } else {
            formState.setTravelPurpose('OTHER');
            formState.setCustomTravelPurpose(loadedPurpose);
          }

          // Other travel fields
          formState.setBoardingCountry(travelInfo.boardingCountry || '');
          formState.setVisaNumber(travelInfo.visaNumber || '');
          formState.setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
          formState.setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
          formState.setPreviousArrivalDate(travelInfo.arrivalArrivalDate || '');
          formState.setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
          formState.setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
          formState.setIsTransitPassenger(travelInfo.isTransitPassenger || false);

          // Accommodation type
          const loadedAccommodationType = travelInfo.accommodationType || 'HOTEL';
          if (PREDEFINED_ACCOMMODATION_TYPES.includes(loadedAccommodationType)) {
            formState.setAccommodationType(loadedAccommodationType);
            formState.setCustomAccommodationType('');
          } else {
            formState.setAccommodationType('OTHER');
            formState.setCustomAccommodationType(loadedAccommodationType);
          }

          // Address fields
          formState.setProvince(travelInfo.province || '');
          formState.setDistrict(travelInfo.district || '');
          formState.setSubDistrict(travelInfo.subDistrict || '');
          formState.setPostalCode(travelInfo.postalCode || '');
          formState.setHotelAddress(travelInfo.hotelAddress || '');
        }
      } catch (error) {
        console.log('Failed to load travel info:', error);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to passport params
      formState.setPassportNo(passport?.passportNo || '');
      formState.setFullName(formState.fullName || passport?.nameEn || passport?.name || '');
      formState.setNationality(passport?.nationality || '');
      formState.setDob(passport?.dob || '');
      formState.setExpiryDate(passport?.expiry || '');
    } finally {
      formState.setIsLoading(false);
    }
  }, [passport, destination, userId, formState, travelInfoForm, migrateExistingDataToInteractionState]);

  /**
   * Refresh fund items from UserDataService
   */
  const refreshFundItems = useCallback(async () => {
    try {
      const loadedFunds = await UserDataService.getFundsByUser(userId);
      const fundsArray = Array.isArray(loadedFunds) ? loadedFunds : [];
      formState.setFunds(fundsArray);
    } catch (error) {
      console.log('Failed to load funds:', error);
      formState.setFunds([]);
    }
  }, [userId, formState]);

  /**
   * Save data to UserDataService
   */
  const saveDataToSecureStorage = useCallback(async (overrides = {}) => {
    try {
      formState.setSaveStatus('saving');

      const destinationId = destination?.id || 'singapore';

      // Prepare travel info data
      const travelData = {
        travelPurpose: formState.travelPurpose === 'OTHER'
          ? formState.customTravelPurpose
          : formState.travelPurpose,
        boardingCountry: formState.boardingCountry,
        visaNumber: formState.visaNumber,
        arrivalFlightNumber: formState.arrivalFlightNumber,
        arrivalArrivalDate: formState.arrivalArrivalDate,
        departureFlightNumber: formState.departureFlightNumber,
        departureDepartureDate: formState.departureDepartureDate,
        isTransitPassenger: formState.isTransitPassenger,
        accommodationType: formState.accommodationType === 'OTHER'
          ? formState.customAccommodationType
          : formState.accommodationType,
        province: formState.province,
        district: formState.district,
        subDistrict: formState.subDistrict,
        postalCode: formState.postalCode,
        hotelAddress: formState.hotelAddress,
        ...overrides,
      };

      // Save to UserDataService
      await UserDataService.saveTravelInfo(userId, destinationId, travelData);

      formState.setSaveStatus('saved');
      formState.setLastEditedAt(Date.now());

      // Clear save status after 2 seconds
      setTimeout(() => formState.setSaveStatus(null), 2000);

      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      formState.setSaveStatus('error');
      setTimeout(() => formState.setSaveStatus(null), 3000);
      return false;
    }
  }, [userId, destination, formState]);

  /**
   * Debounced save data (auto-save after 1 second of inactivity)
   */
  const debouncedSaveData = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    formState.setSaveStatus('pending');

    saveTimeoutRef.current = setTimeout(() => {
      saveDataToSecureStorage();
    }, 1000);
  }, [saveDataToSecureStorage, formState]);

  return {
    loadData,
    refreshFundItems,
    saveDataToSecureStorage,
    debouncedSaveData,
  };
};

export default useSingaporeDataPersistence;
