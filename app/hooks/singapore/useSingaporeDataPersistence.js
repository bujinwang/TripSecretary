/**
 * useSingaporeDataPersistence Hook
 *
 * Handles all data loading, saving, and persistence logic for Singapore Travel Info Screen
 * Includes: data loading, auto-save, session state, and fund items management
 */

import { useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserDataService from '../../services/data/UserDataService';
import DebouncedSave from '../../utils/DebouncedSave';
import { getPhoneCode } from '../../data/phoneCodes';
import {
  PREDEFINED_TRAVEL_PURPOSES,
  PREDEFINED_ACCOMMODATION_TYPES,
} from '../../screens/singapore/constants';

/**
 * Custom hook to handle Singapore travel info data persistence
 * @param {Object} params - Hook parameters
 * @returns {Object} Data persistence functions
 */
export const useSingaporeDataPersistence = ({
  passport,
  destination,
  userId,
  formState,
  travelInfoForm,
  navigation,
}) => {
  // Refs for scroll position management
  const scrollViewRef = useRef(null);
  const shouldRestoreScrollPosition = useRef(false);

  // ========== Session State Management ==========

  const getSessionStateKey = useCallback(() => {
    return `session_state_singapore_${userId}`;
  }, [userId]);

  const saveSessionState = useCallback(async () => {
    try {
      const sessionState = {
        expandedSection: formState.expandedSection,
        scrollPosition: formState.scrollPosition,
        lastEditedField: formState.lastEditedField,
        timestamp: new Date().toISOString(),
      };

      const key = getSessionStateKey();
      await AsyncStorage.setItem(key, JSON.stringify(sessionState));
      console.log('Session state saved:', sessionState);
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }, [formState.expandedSection, formState.scrollPosition, formState.lastEditedField, getSessionStateKey]);

  const loadSessionState = useCallback(async () => {
    try {
      const key = getSessionStateKey();
      const sessionStateJson = await AsyncStorage.getItem(key);

      if (sessionStateJson) {
        const sessionState = JSON.parse(sessionStateJson);
        console.log('Session state loaded:', sessionState);

        if (sessionState.expandedSection) {
          formState.setExpandedSection(sessionState.expandedSection);
        }

        if (sessionState.scrollPosition) {
          formState.setScrollPosition(sessionState.scrollPosition);
          shouldRestoreScrollPosition.current = true;
        }

        if (sessionState.lastEditedField) {
          formState.setLastEditedField(sessionState.lastEditedField);
        }

        return sessionState;
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
    return null;
  }, [getSessionStateKey, formState]);

  // ========== Migration Logic ==========

  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !travelInfoForm.isInitialized) {
      return;
    }

    console.log('=== MIGRATING EXISTING DATA TO INTERACTION STATE (SINGAPORE) ===');
    await travelInfoForm.initializeWithExistingData(userData);
  }, [travelInfoForm]);

  // ========== Fund Items Management ==========

  const normalizeFundItem = useCallback((item) => ({
    id: item.id,
    type: item.type || item.itemType || 'cash',
    amount: item.amount,
    currency: item.currency,
    details: item.details || item.description || '',
    photo: item.photoUri || item.photo || null,
    userId: item.userId || userId,
  }), [userId]);

  const refreshFundItems = useCallback(async (options = {}) => {
    try {
      const fundItems = await UserDataService.getFundItems(userId, options);
      const normalized = fundItems.map(normalizeFundItem);
      formState.setFunds(normalized);
    } catch (error) {
      console.error('Failed to refresh fund items:', error);
    }
  }, [userId, normalizeFundItem, formState]);

  // ========== Save Operations ==========

  const saveDataToSecureStorage = useCallback(async (fieldOverrides = {}) => {
    try {
      console.log('=== SAVING DATA TO SECURE STORAGE (SINGAPORE) ===');
      console.log('userId:', userId);
      console.log('fieldOverrides:', fieldOverrides);

      // Get current values with overrides applied
      const getCurrentValue = (fieldName, currentValue) => {
        return fieldOverrides[fieldName] !== undefined ? fieldOverrides[fieldName] : currentValue;
      };

      // Build all fields object for filtering
      const allFields = {
        // Passport fields
        passportNo: getCurrentValue('passportNo', formState.passportNo),
        fullName: getCurrentValue('fullName', formState.fullName),
        nationality: getCurrentValue('nationality', formState.nationality),
        dob: getCurrentValue('dob', formState.dob),
        expiryDate: getCurrentValue('expiryDate', formState.expiryDate),
        sex: getCurrentValue('sex', formState.sex),
        // Personal fields
        occupation: getCurrentValue('occupation', formState.occupation),
        cityOfResidence: getCurrentValue('cityOfResidence', formState.cityOfResidence),
        residentCountry: getCurrentValue('residentCountry', formState.residentCountry),
        phoneCode: getCurrentValue('phoneCode', formState.phoneCode),
        phoneNumber: getCurrentValue('phoneNumber', formState.phoneNumber),
        email: getCurrentValue('email', formState.email),
        // Travel fields
        travelPurpose: getCurrentValue('travelPurpose', formState.travelPurpose),
        customTravelPurpose: getCurrentValue('customTravelPurpose', formState.customTravelPurpose),
        boardingCountry: getCurrentValue('boardingCountry', formState.boardingCountry),
        arrivalFlightNumber: getCurrentValue('arrivalFlightNumber', formState.arrivalFlightNumber),
        arrivalArrivalDate: getCurrentValue('arrivalArrivalDate', formState.arrivalArrivalDate),
        departureFlightNumber: getCurrentValue('departureFlightNumber', formState.departureFlightNumber),
        departureDepartureDate: getCurrentValue('departureDepartureDate', formState.departureDepartureDate),
        isTransitPassenger: getCurrentValue('isTransitPassenger', formState.isTransitPassenger),
        accommodationType: getCurrentValue('accommodationType', formState.accommodationType),
        customAccommodationType: getCurrentValue('customAccommodationType', formState.customAccommodationType),
        province: getCurrentValue('province', formState.province),
        district: getCurrentValue('district', formState.district),
        subDistrict: getCurrentValue('subDistrict', formState.subDistrict),
        postalCode: getCurrentValue('postalCode', formState.postalCode),
        hotelAddress: getCurrentValue('hotelAddress', formState.hotelAddress),
        visaNumber: getCurrentValue('visaNumber', formState.visaNumber)
      };

      // Filter fields based on user interaction
      const fieldsToSave = travelInfoForm.filterFieldsForSave(allFields);
      console.log('Fields to save after filtering:', Object.keys(fieldsToSave).length, 'fields');

      // Get existing passport first
      const existingPassport = await UserDataService.getPassport(userId);

      // Save passport data - only user-modified fields
      const passportUpdates = {};
      if (fieldsToSave.passportNo?.trim()) passportUpdates.passportNumber = fieldsToSave.passportNo;
      if (fieldsToSave.fullName?.trim()) passportUpdates.fullName = fieldsToSave.fullName;
      if (fieldsToSave.nationality?.trim()) passportUpdates.nationality = fieldsToSave.nationality;
      if (fieldsToSave.dob?.trim()) passportUpdates.dateOfBirth = fieldsToSave.dob;
      if (fieldsToSave.expiryDate?.trim()) passportUpdates.expiryDate = fieldsToSave.expiryDate;
      if (fieldsToSave.sex?.trim()) passportUpdates.gender = fieldsToSave.sex;

      if (Object.keys(passportUpdates).length > 0) {
        console.log('Saving passport updates:', Object.keys(passportUpdates));
        if (existingPassport?.id) {
          const updated = await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
          formState.setPassportData(updated);
        } else {
          const saved = await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
          formState.setPassportData(saved);
        }
      }

      // Save personal info data - only user-modified fields
      const personalInfoUpdates = {};
      if (fieldsToSave.phoneCode?.trim()) personalInfoUpdates.phoneCode = fieldsToSave.phoneCode;
      if (fieldsToSave.phoneNumber?.trim()) personalInfoUpdates.phoneNumber = fieldsToSave.phoneNumber;
      if (fieldsToSave.email?.trim()) personalInfoUpdates.email = fieldsToSave.email;
      if (fieldsToSave.occupation?.trim()) personalInfoUpdates.occupation = fieldsToSave.occupation;
      if (fieldsToSave.cityOfResidence?.trim()) personalInfoUpdates.provinceCity = fieldsToSave.cityOfResidence;
      if (fieldsToSave.residentCountry?.trim()) personalInfoUpdates.countryRegion = fieldsToSave.residentCountry;
      if (fieldsToSave.sex?.trim()) personalInfoUpdates.gender = fieldsToSave.sex;

      if (Object.keys(personalInfoUpdates).length > 0) {
        console.log('Saving personal info updates:', Object.keys(personalInfoUpdates));
        const savedPersonalInfo = await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
        formState.setPersonalInfoData(savedPersonalInfo);
      }

      // Save travel info data - only user-modified fields
      const travelInfoUpdates = {};

      // Handle travel purpose (with custom option)
      const finalTravelPurpose = fieldsToSave.travelPurpose === 'OTHER' && fieldsToSave.customTravelPurpose?.trim()
        ? fieldsToSave.customTravelPurpose.trim()
        : fieldsToSave.travelPurpose;
      if (finalTravelPurpose?.trim()) travelInfoUpdates.travelPurpose = finalTravelPurpose;

      if (fieldsToSave.boardingCountry?.trim()) travelInfoUpdates.boardingCountry = fieldsToSave.boardingCountry;
      if (fieldsToSave.visaNumber?.trim()) travelInfoUpdates.visaNumber = fieldsToSave.visaNumber.trim();
      if (fieldsToSave.arrivalFlightNumber?.trim()) travelInfoUpdates.arrivalFlightNumber = fieldsToSave.arrivalFlightNumber;
      if (fieldsToSave.arrivalArrivalDate?.trim()) travelInfoUpdates.arrivalArrivalDate = fieldsToSave.arrivalArrivalDate;
      if (fieldsToSave.departureFlightNumber?.trim()) travelInfoUpdates.departureFlightNumber = fieldsToSave.departureFlightNumber;
      if (fieldsToSave.departureDepartureDate?.trim()) travelInfoUpdates.departureDepartureDate = fieldsToSave.departureDepartureDate;
      if (fieldsToSave.isTransitPassenger !== undefined) travelInfoUpdates.isTransitPassenger = fieldsToSave.isTransitPassenger;

      // Handle accommodation type (with custom option) - only if not transit
      if (!fieldsToSave.isTransitPassenger) {
        const finalAccommodationType = fieldsToSave.accommodationType === 'OTHER' && fieldsToSave.customAccommodationType?.trim()
          ? fieldsToSave.customAccommodationType.trim()
          : fieldsToSave.accommodationType;
        if (finalAccommodationType?.trim()) travelInfoUpdates.accommodationType = finalAccommodationType;

        if (fieldsToSave.province?.trim()) travelInfoUpdates.province = fieldsToSave.province;
        if (fieldsToSave.district?.trim()) travelInfoUpdates.district = fieldsToSave.district;
        if (fieldsToSave.subDistrict?.trim()) travelInfoUpdates.subDistrict = fieldsToSave.subDistrict;
        if (fieldsToSave.postalCode?.trim()) travelInfoUpdates.postalCode = fieldsToSave.postalCode;
        if (fieldsToSave.hotelAddress?.trim()) travelInfoUpdates.hotelAddress = fieldsToSave.hotelAddress;
      }

      if (Object.keys(travelInfoUpdates).length > 0) {
        console.log('Saving travel info updates:', Object.keys(travelInfoUpdates));
        try {
          const destinationId = destination?.id || 'singapore';
          await UserDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);

          // Handle arrival date change notifications
          if (travelInfoUpdates.arrivalArrivalDate && travelInfoUpdates.arrivalArrivalDate !== formState.previousArrivalDate) {
            formState.setPreviousArrivalDate(travelInfoUpdates.arrivalArrivalDate);
          }
        } catch (travelInfoError) {
          console.error('Failed to save travel info:', travelInfoError);
        }
      }

      console.log('=== DATA SAVED SUCCESSFULLY ===');
      return { success: true };
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
      return { success: false, error };
    }
  }, [userId, destination, formState, travelInfoForm]);

  // Debounced save function
  const debouncedSaveData = useCallback(() => {
    DebouncedSave.debouncedSave(
      'singapore_travel_info',
      async () => {
        await saveDataToSecureStorage();
        formState.setLastEditedAt(new Date());
      },
      300
    )();
  }, [saveDataToSecureStorage, formState]);

  // ========== Data Loading ==========

  const loadData = useCallback(async () => {
    try {
      formState.setIsLoading(true);

      // Initialize UserDataService
      await UserDataService.initialize(userId);

      // Load all user data
      const userData = await UserDataService.getAllUserData(userId);
      console.log('=== LOADED USER DATA (SINGAPORE) ===');

      // Load travel info and add to userData for migration
      try {
        const destinationId = destination?.id || 'singapore';
        const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
        if (travelInfo) {
          userData.travelInfo = travelInfo;
        }
      } catch (travelInfoError) {
        console.log('Failed to load travel info for migration:', travelInfoError);
      }

      // Perform migration if interaction tracker is initialized
      if (travelInfoForm.isInitialized) {
        await migrateExistingDataToInteractionState(userData);
      } else {
        setTimeout(async () => {
          if (travelInfoForm.isInitialized) {
            await migrateExistingDataToInteractionState(userData);
          }
        }, 100);
      }

      // Load passport info
      const passportInfo = userData?.passport;
      if (passportInfo) {
        console.log('Loading passport from database');
        formState.setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');

        // Smart full name loading with fallbacks
        if (passportInfo.fullName?.trim()) {
          formState.setFullName(passportInfo.fullName);
        } else if (passport?.nameEn?.trim()) {
          formState.setFullName(passport.nameEn);
        } else if (passport?.name?.trim()) {
          formState.setFullName(passport.name);
        }

        formState.setNationality(passportInfo.nationality || passport?.nationality || '');
        formState.setDob(passportInfo.dateOfBirth || passport?.dob || '');
        formState.setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');
        formState.setPassportData(passportInfo);
      } else {
        // Fallback to route params
        console.log('No passport data in database, using route params');
        formState.setPassportNo(passport?.passportNo || '');
        formState.setFullName(passport?.nameEn || passport?.name || '');
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
        formState.setPhoneCode(personalInfo.phoneCode || getPhoneCode(personalInfo.countryRegion || passport?.nationality || ''));
        formState.setPersonalInfoData(personalInfo);
      } else {
        formState.setPhoneCode(getPhoneCode(passport?.nationality || ''));
      }

      // Load gender (single source of truth: passport)
      const loadedSex = passportInfo?.gender || passport?.sex || passport?.gender || 'Male';
      formState.setSex(loadedSex);

      // Load fund items
      await refreshFundItems();

      // Load travel info
      try {
        const destinationId = destination?.id || 'singapore';
        console.log('Loading travel info for destination:', destinationId);
        let travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

        // Fallback for legacy data
        if (!travelInfo && destination?.name) {
          travelInfo = await UserDataService.getTravelInfo(userId, destination.name);
        }

        if (travelInfo) {
          console.log('=== LOADING SAVED TRAVEL INFO ===');

          // Load travel purpose (handle predefined vs custom)
          const loadedPurpose = travelInfo.travelPurpose || '';
          if (PREDEFINED_TRAVEL_PURPOSES.includes(loadedPurpose)) {
            formState.setTravelPurpose(loadedPurpose);
            formState.setCustomTravelPurpose('');
          } else if (loadedPurpose) {
            formState.setTravelPurpose('OTHER');
            formState.setCustomTravelPurpose(loadedPurpose);
          }

          formState.setBoardingCountry(travelInfo.boardingCountry || '');
          formState.setVisaNumber(travelInfo.visaNumber || '');
          formState.setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
          formState.setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
          formState.setPreviousArrivalDate(travelInfo.arrivalArrivalDate || '');
          formState.setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
          formState.setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
          formState.setIsTransitPassenger(travelInfo.isTransitPassenger || false);

          // Load accommodation type (handle predefined vs custom)
          const loadedAccommodationType = travelInfo.accommodationType || '';
          if (PREDEFINED_ACCOMMODATION_TYPES.includes(loadedAccommodationType)) {
            formState.setAccommodationType(loadedAccommodationType);
            formState.setCustomAccommodationType('');
          } else if (loadedAccommodationType) {
            formState.setAccommodationType('OTHER');
            formState.setCustomAccommodationType(loadedAccommodationType);
          }

          formState.setProvince(travelInfo.province || '');
          formState.setDistrict(travelInfo.district || '');
          formState.setSubDistrict(travelInfo.subDistrict || '');
          formState.setPostalCode(travelInfo.postalCode || '');
          formState.setHotelAddress(travelInfo.hotelAddress || '');

          console.log('Travel info loaded successfully');
        } else {
          console.log('No saved travel info found');
        }
      } catch (travelInfoError) {
        console.log('Failed to load travel info:', travelInfoError);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback to route params on error
      formState.setPassportNo(passport?.passportNo || '');
      formState.setFullName(passport?.nameEn || passport?.name || '');
      formState.setNationality(passport?.nationality || '');
      formState.setDob(passport?.dob || '');
      formState.setExpiryDate(passport?.expiry || '');
      formState.setSex(passport?.sex || 'Male');
      formState.setPhoneCode(getPhoneCode(passport?.nationality || ''));
    } finally {
      formState.setIsLoading(false);
    }
  }, [userId, passport, destination, formState, travelInfoForm, migrateExistingDataToInteractionState, refreshFundItems]);

  // Setup listeners for navigation events
  useEffect(() => {
    // Focus listener: reload data when returning to screen
    const unsubscribeFocus = navigation.addListener('focus', async () => {
      try {
        const userData = await UserDataService.getAllUserData(userId);
        if (userData) {
          // Reload and migrate data
          try {
            const destinationId = destination?.id || 'singapore';
            const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
            if (travelInfo) {
              userData.travelInfo = travelInfo;
            }
          } catch (err) {
            console.log('Failed to load travel info on focus:', err);
          }

          if (travelInfoForm.isInitialized) {
            await migrateExistingDataToInteractionState(userData);
          }

          // Refresh all data
          const passportInfo = userData.passport;
          if (passportInfo) {
            formState.setPassportNo(passportInfo.passportNumber || formState.passportNo);
            if (passportInfo.fullName?.trim()) {
              formState.setFullName(passportInfo.fullName);
            }
            formState.setNationality(passportInfo.nationality || formState.nationality);
            formState.setDob(passportInfo.dateOfBirth || formState.dob);
            formState.setExpiryDate(passportInfo.expiryDate || formState.expiryDate);
            formState.setPassportData(passportInfo);
          }

          const personalInfo = userData.personalInfo;
          if (personalInfo) {
            formState.setOccupation(personalInfo.occupation || formState.occupation);
            formState.setCityOfResidence(personalInfo.provinceCity || formState.cityOfResidence);
            formState.setResidentCountry(personalInfo.countryRegion || formState.residentCountry);
            formState.setPhoneNumber(personalInfo.phoneNumber || formState.phoneNumber);
            formState.setEmail(personalInfo.email || formState.email);
            formState.setPhoneCode(personalInfo.phoneCode || formState.phoneCode);
            formState.setPersonalInfoData(personalInfo);
          }

          formState.setSex(passportInfo?.gender || passport?.sex || formState.sex);
          await refreshFundItems({ forceRefresh: true });
        }
      } catch (error) {
        console.error('Failed to reload data on focus:', error);
      }
    });

    // Blur listener: flush pending saves when leaving screen
    const unsubscribeBlur = navigation.addListener('blur', () => {
      DebouncedSave.flushPendingSave('singapore_travel_info');
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, userId, destination, formState, passport, travelInfoForm, migrateExistingDataToInteractionState, refreshFundItems]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        DebouncedSave.flushPendingSave('singapore_travel_info');
        saveSessionState();
      } catch (error) {
        console.error('Failed to save on unmount:', error);
      }
    };
  }, [saveSessionState]);

  return {
    // Data loading
    loadData,

    // Save operations
    saveDataToSecureStorage,
    debouncedSaveData,

    // Session state
    saveSessionState,
    loadSessionState,
    getSessionStateKey,

    // Fund items
    refreshFundItems,
    normalizeFundItem,

    // Migration
    migrateExistingDataToInteractionState,

    // Refs
    scrollViewRef,
    shouldRestoreScrollPosition,
  };
};

export default useSingaporeDataPersistence;
