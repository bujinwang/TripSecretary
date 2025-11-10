// @ts-nocheck

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
  const formStateRef = useRef(formState);
  const travelInfoFormRef = useRef(travelInfoForm);

  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  useEffect(() => {
    travelInfoFormRef.current = travelInfoForm;
  }, [travelInfoForm]);

  // ========== Session State Management ==========

  const getSessionStateKey = useCallback(() => {
    return `session_state_singapore_${userId}`;
  }, [userId]);

  const saveSessionState = useCallback(async () => {
    const currentState = formStateRef.current;
    if (!currentState) {
      return;
    }
    try {
      const sessionState = {
        expandedSection: currentState.expandedSection,
        scrollPosition: currentState.scrollPosition,
        lastEditedField: currentState.lastEditedField,
        timestamp: new Date().toISOString(),
      };

      const key = getSessionStateKey();
      await AsyncStorage.setItem(key, JSON.stringify(sessionState));
      console.log('Session state saved:', sessionState);
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }, [getSessionStateKey]);

  const loadSessionState = useCallback(async () => {
    try {
      const key = getSessionStateKey();
      const sessionStateJson = await AsyncStorage.getItem(key);

      if (sessionStateJson) {
        const sessionState = JSON.parse(sessionStateJson);
        console.log('Session state loaded:', sessionState);
        const currentState = formStateRef.current;

        if (currentState) {
          if (sessionState.expandedSection) {
            currentState.setExpandedSection(sessionState.expandedSection);
          }

          if (sessionState.scrollPosition) {
            currentState.setScrollPosition(sessionState.scrollPosition);
            shouldRestoreScrollPosition.current = true;
          }

          if (sessionState.lastEditedField) {
            currentState.setLastEditedField(sessionState.lastEditedField);
          }
        }

        return sessionState;
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
    return null;
  }, [getSessionStateKey]);

  // ========== Migration Logic ==========

  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    const currentForm = travelInfoFormRef.current;
    if (!userData || !currentForm?.isInitialized) {
      return;
    }

    console.log('=== MIGRATING EXISTING DATA TO INTERACTION STATE (SINGAPORE) ===');
    await currentForm.initializeWithExistingData(userData);
  }, []);

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
      formStateRef.current?.setFunds(normalized);
    } catch (error) {
      console.error('Failed to refresh fund items:', error);
    }
  }, [userId, normalizeFundItem]);

  const saveFundItems = useCallback(async (fundItems) => {
    try {
      await UserDataService.updateFundItems(userId, fundItems);
      formStateRef.current?.setFunds(fundItems);
      return { success: true };
    } catch (error) {
      console.error('Failed to save fund items:', error);
      return { success: false, error };
    }
  }, [userId]);

  // ========== Save Operations ==========

  const saveDataToSecureStorage = useCallback(async (fieldOverrides = {}) => {
    const state = formStateRef.current;
    const interactionForm = travelInfoFormRef.current;
    if (!state || !interactionForm) {
      console.warn('Form state not ready, aborting save');
      return { success: false, error: new Error('Form state not initialized') };
    }
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
        passportNo: getCurrentValue('passportNo', state.passportNo),
        fullName: getCurrentValue('fullName', state.fullName),
        nationality: getCurrentValue('nationality', state.nationality),
        dob: getCurrentValue('dob', state.dob),
        expiryDate: getCurrentValue('expiryDate', state.expiryDate),
        sex: getCurrentValue('sex', state.sex),
        // Personal fields
        occupation: getCurrentValue('occupation', state.occupation),
        cityOfResidence: getCurrentValue('cityOfResidence', state.cityOfResidence),
        residentCountry: getCurrentValue('residentCountry', state.residentCountry),
        phoneCode: getCurrentValue('phoneCode', state.phoneCode),
        phoneNumber: getCurrentValue('phoneNumber', state.phoneNumber),
        email: getCurrentValue('email', state.email),
        // Travel fields
        travelPurpose: getCurrentValue('travelPurpose', state.travelPurpose),
        customTravelPurpose: getCurrentValue('customTravelPurpose', state.customTravelPurpose),
        boardingCountry: getCurrentValue('boardingCountry', state.boardingCountry),
        arrivalFlightNumber: getCurrentValue('arrivalFlightNumber', state.arrivalFlightNumber),
        arrivalArrivalDate: getCurrentValue('arrivalArrivalDate', state.arrivalArrivalDate),
        departureFlightNumber: getCurrentValue('departureFlightNumber', state.departureFlightNumber),
        departureDepartureDate: getCurrentValue('departureDepartureDate', state.departureDepartureDate),
        isTransitPassenger: getCurrentValue('isTransitPassenger', state.isTransitPassenger),
        accommodationType: getCurrentValue('accommodationType', state.accommodationType),
        customAccommodationType: getCurrentValue('customAccommodationType', state.customAccommodationType),
        province: getCurrentValue('province', state.province),
        district: getCurrentValue('district', state.district),
        subDistrict: getCurrentValue('subDistrict', state.subDistrict),
        postalCode: getCurrentValue('postalCode', state.postalCode),
        hotelAddress: getCurrentValue('hotelAddress', state.hotelAddress),
        visaNumber: getCurrentValue('visaNumber', state.visaNumber)
      };

      // Filter fields based on user interaction
      const fieldsToSave = interactionForm.filterFieldsForSave(allFields);
      console.log('Fields to save after filtering:', Object.keys(fieldsToSave).length, 'fields');

      // Get existing passport first
      const existingPassport = await UserDataService.getPassport(userId);

      // Save passport data - only user-modified fields
      const passportUpdates = {};
      if (fieldsToSave.passportNo?.trim()) {
passportUpdates.passportNumber = fieldsToSave.passportNo;
}
      if (fieldsToSave.fullName?.trim()) {
passportUpdates.fullName = fieldsToSave.fullName;
}
      if (fieldsToSave.nationality?.trim()) {
passportUpdates.nationality = fieldsToSave.nationality;
}
      if (fieldsToSave.dob?.trim()) {
passportUpdates.dateOfBirth = fieldsToSave.dob;
}
      if (fieldsToSave.expiryDate?.trim()) {
passportUpdates.expiryDate = fieldsToSave.expiryDate;
}
      if (fieldsToSave.sex?.trim()) {
passportUpdates.gender = fieldsToSave.sex;
}

      if (Object.keys(passportUpdates).length > 0) {
        console.log('Saving passport updates:', Object.keys(passportUpdates));
        if (existingPassport?.id) {
          const updated = await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
          state.setPassportData(updated);
        } else {
          const saved = await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
          state.setPassportData(saved);
        }
      }

      // Save personal info data - only user-modified fields
      const personalInfoUpdates = {};
      if (fieldsToSave.phoneCode?.trim()) {
personalInfoUpdates.phoneCode = fieldsToSave.phoneCode;
}
      if (fieldsToSave.phoneNumber?.trim()) {
personalInfoUpdates.phoneNumber = fieldsToSave.phoneNumber;
}
      if (fieldsToSave.email?.trim()) {
personalInfoUpdates.email = fieldsToSave.email;
}
      if (fieldsToSave.occupation?.trim()) {
personalInfoUpdates.occupation = fieldsToSave.occupation;
}
      if (fieldsToSave.cityOfResidence?.trim()) {
personalInfoUpdates.provinceCity = fieldsToSave.cityOfResidence;
}
      if (fieldsToSave.residentCountry?.trim()) {
personalInfoUpdates.countryRegion = fieldsToSave.residentCountry;
}
      if (fieldsToSave.sex?.trim()) {
personalInfoUpdates.gender = fieldsToSave.sex;
}

      if (Object.keys(personalInfoUpdates).length > 0) {
        console.log('Saving personal info updates:', Object.keys(personalInfoUpdates));
        const savedPersonalInfo = await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
        state.setPersonalInfoData(savedPersonalInfo);
      }

      // Save travel info data - only user-modified fields
      const travelInfoUpdates = {};

      // Handle travel purpose (with custom option)
      const finalTravelPurpose = fieldsToSave.travelPurpose === 'OTHER' && fieldsToSave.customTravelPurpose?.trim()
        ? fieldsToSave.customTravelPurpose.trim()
        : fieldsToSave.travelPurpose;
      if (finalTravelPurpose?.trim()) {
travelInfoUpdates.travelPurpose = finalTravelPurpose;
}

      if (fieldsToSave.boardingCountry?.trim()) {
travelInfoUpdates.boardingCountry = fieldsToSave.boardingCountry;
}
      if (fieldsToSave.visaNumber?.trim()) {
travelInfoUpdates.visaNumber = fieldsToSave.visaNumber.trim();
}
      if (fieldsToSave.arrivalFlightNumber?.trim()) {
travelInfoUpdates.arrivalFlightNumber = fieldsToSave.arrivalFlightNumber;
}
      if (fieldsToSave.arrivalArrivalDate?.trim()) {
travelInfoUpdates.arrivalArrivalDate = fieldsToSave.arrivalArrivalDate;
}
      if (fieldsToSave.departureFlightNumber?.trim()) {
travelInfoUpdates.departureFlightNumber = fieldsToSave.departureFlightNumber;
}
      if (fieldsToSave.departureDepartureDate?.trim()) {
travelInfoUpdates.departureDepartureDate = fieldsToSave.departureDepartureDate;
}
      if (fieldsToSave.isTransitPassenger !== undefined) {
travelInfoUpdates.isTransitPassenger = fieldsToSave.isTransitPassenger;
}

      // Handle accommodation type (with custom option) - only if not transit
      if (!fieldsToSave.isTransitPassenger) {
        const finalAccommodationType = fieldsToSave.accommodationType === 'OTHER' && fieldsToSave.customAccommodationType?.trim()
          ? fieldsToSave.customAccommodationType.trim()
          : fieldsToSave.accommodationType;
        if (finalAccommodationType?.trim()) {
travelInfoUpdates.accommodationType = finalAccommodationType;
}

        if (fieldsToSave.province?.trim()) {
travelInfoUpdates.province = fieldsToSave.province;
}
        if (fieldsToSave.district?.trim()) {
travelInfoUpdates.district = fieldsToSave.district;
}
        if (fieldsToSave.subDistrict?.trim()) {
travelInfoUpdates.subDistrict = fieldsToSave.subDistrict;
}
        if (fieldsToSave.postalCode?.trim()) {
travelInfoUpdates.postalCode = fieldsToSave.postalCode;
}
        if (fieldsToSave.hotelAddress?.trim()) {
travelInfoUpdates.hotelAddress = fieldsToSave.hotelAddress;
}
      }

      if (Object.keys(travelInfoUpdates).length > 0) {
        console.log('Saving travel info updates:', Object.keys(travelInfoUpdates));
        try {
          const destinationId = destination?.id || 'singapore';
          await UserDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);

          // Handle arrival date change notifications
          if (travelInfoUpdates.arrivalArrivalDate && travelInfoUpdates.arrivalArrivalDate !== state.previousArrivalDate) {
            state.setPreviousArrivalDate(travelInfoUpdates.arrivalArrivalDate);
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
  }, [userId, destination]);

  // Debounced save function
  const debouncedSaveData = useCallback(() => {
    DebouncedSave.debouncedSave(
      'singapore_travel_info',
      async () => {
        await saveDataToSecureStorage();
        formStateRef.current?.setLastEditedAt(new Date());
      },
      300
    )();
  }, [saveDataToSecureStorage]);

  // ========== Data Loading ==========

  const loadData = useCallback(async () => {
    const state = formStateRef.current;
    const interactionForm = travelInfoFormRef.current;
    if (!state) {
      console.warn('Form state unavailable during loadData');
      return;
    }
    try {
      state.setIsLoading(true);

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
      if (interactionForm?.isInitialized) {
        await migrateExistingDataToInteractionState(userData);
      } else {
        setTimeout(async () => {
          const latestForm = travelInfoFormRef.current;
          if (latestForm?.isInitialized) {
            await migrateExistingDataToInteractionState(userData);
          }
        }, 100);
      }

      // Load passport info
      const passportInfo = userData?.passport;
      if (passportInfo) {
        console.log('Loading passport from database');
        state.setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');

        // Smart full name loading with fallbacks
        if (passportInfo.fullName?.trim()) {
          state.setFullName(passportInfo.fullName);
        } else if (passport?.nameEn?.trim()) {
          state.setFullName(passport.nameEn);
        } else if (passport?.name?.trim()) {
          state.setFullName(passport.name);
        }

        state.setNationality(passportInfo.nationality || passport?.nationality || '');
        state.setDob(passportInfo.dateOfBirth || passport?.dob || '');
        state.setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');
        state.setPassportData(passportInfo);
      } else {
        // Fallback to route params
        console.log('No passport data in database, using route params');
        state.setPassportNo(passport?.passportNo || '');
        state.setFullName(passport?.nameEn || passport?.name || '');
        state.setNationality(passport?.nationality || '');
        state.setDob(passport?.dob || '');
        state.setExpiryDate(passport?.expiry || '');
      }

      // Load personal info
      const personalInfo = userData?.personalInfo;
      if (personalInfo) {
        state.setOccupation(personalInfo.occupation || '');
        state.setCityOfResidence(personalInfo.provinceCity || '');
        state.setResidentCountry(personalInfo.countryRegion || '');
        state.setPhoneNumber(personalInfo.phoneNumber || '');
        state.setEmail(personalInfo.email || '');
        state.setPhoneCode(personalInfo.phoneCode || getPhoneCode(personalInfo.countryRegion || passport?.nationality || ''));
        state.setPersonalInfoData(personalInfo);
      } else {
        state.setPhoneCode(getPhoneCode(passport?.nationality || ''));
      }

      // Load gender (single source of truth: passport)
      const loadedSex = passportInfo?.gender || passport?.sex || passport?.gender || 'Male';
      state.setSex(loadedSex);

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
            state.setTravelPurpose(loadedPurpose);
            state.setCustomTravelPurpose('');
          } else if (loadedPurpose) {
            state.setTravelPurpose('OTHER');
            state.setCustomTravelPurpose(loadedPurpose);
          }

          state.setBoardingCountry(travelInfo.boardingCountry || '');
          state.setVisaNumber(travelInfo.visaNumber || '');
          state.setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
          state.setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
          state.setPreviousArrivalDate(travelInfo.arrivalArrivalDate || '');
          state.setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
          state.setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
          state.setIsTransitPassenger(travelInfo.isTransitPassenger || false);

          // Load accommodation type (handle predefined vs custom)
          const loadedAccommodationType = travelInfo.accommodationType || '';
          if (PREDEFINED_ACCOMMODATION_TYPES.includes(loadedAccommodationType)) {
            state.setAccommodationType(loadedAccommodationType);
            state.setCustomAccommodationType('');
          } else if (loadedAccommodationType) {
            state.setAccommodationType('OTHER');
            state.setCustomAccommodationType(loadedAccommodationType);
          }

          state.setProvince(travelInfo.province || '');
          state.setDistrict(travelInfo.district || '');
          state.setSubDistrict(travelInfo.subDistrict || '');
          state.setPostalCode(travelInfo.postalCode || '');
          state.setHotelAddress(travelInfo.hotelAddress || '');

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
      state.setPassportNo(passport?.passportNo || '');
      state.setFullName(passport?.nameEn || passport?.name || '');
      state.setNationality(passport?.nationality || '');
      state.setDob(passport?.dob || '');
      state.setExpiryDate(passport?.expiry || '');
      state.setSex(passport?.sex || 'Male');
      state.setPhoneCode(getPhoneCode(passport?.nationality || ''));
    } finally {
      state.setIsLoading(false);
    }
  }, [userId, passport, destination, migrateExistingDataToInteractionState, refreshFundItems]);

  // Setup listeners for navigation events
  useEffect(() => {
    // Focus listener: reload data when returning to screen
    const unsubscribeFocus = navigation.addListener('focus', async () => {
      try {
        const state = formStateRef.current;
        const interactionForm = travelInfoFormRef.current;
        if (!state) {
          return;
        }
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

          if (interactionForm?.isInitialized) {
            await migrateExistingDataToInteractionState(userData);
          }

          // Refresh all data
          const passportInfo = userData.passport;
          if (passportInfo) {
            state.setPassportNo(passportInfo.passportNumber || state.passportNo);
            if (passportInfo.fullName?.trim()) {
              state.setFullName(passportInfo.fullName);
            }
            state.setNationality(passportInfo.nationality || state.nationality);
            state.setDob(passportInfo.dateOfBirth || state.dob);
            state.setExpiryDate(passportInfo.expiryDate || state.expiryDate);
            state.setPassportData(passportInfo);
          }

          const personalInfo = userData.personalInfo;
          if (personalInfo) {
            state.setOccupation(personalInfo.occupation || state.occupation);
            state.setCityOfResidence(personalInfo.provinceCity || state.cityOfResidence);
            state.setResidentCountry(personalInfo.countryRegion || state.residentCountry);
            state.setPhoneNumber(personalInfo.phoneNumber || state.phoneNumber);
            state.setEmail(personalInfo.email || state.email);
            state.setPhoneCode(personalInfo.phoneCode || state.phoneCode);
            state.setPersonalInfoData(personalInfo);
          }

          state.setSex(passportInfo?.gender || passport?.sex || state.sex);
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
  }, [navigation, userId, destination, passport, migrateExistingDataToInteractionState, refreshFundItems]);

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
    saveFundItems,
    normalizeFundItem,

    // Migration
    migrateExistingDataToInteractionState,

    // Refs
    scrollViewRef,
    shouldRestoreScrollPosition,
  };
};

export default useSingaporeDataPersistence;
