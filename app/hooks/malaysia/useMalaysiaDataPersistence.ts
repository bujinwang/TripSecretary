// @ts-nocheck

// useMalaysiaDataPersistence.js
// Handles all data loading, saving, and persistence logic for Malaysia Travel Info Screen
import { useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserDataService from '../../services/data/UserDataService';
import DebouncedSave from '../../utils/DebouncedSave';

/**
 * Custom hook to manage data persistence for Malaysia Travel Info Screen
 * @param {Object} params - Hook parameters
 * @param {Object} params.passport - Passport object
 * @param {Object} params.destination - Destination object
 * @param {string} params.userId - User ID
 * @param {Object} params.formState - Form state from useMalaysiaFormState hook
 * @param {Object} params.userInteractionTracker - User interaction tracker instance
 * @param {Object} params.navigation - Navigation object
 * @returns {Object} Data persistence functions
 */
export const useMalaysiaDataPersistence = ({
  passport,
  destination,
  userId,
  formState,
  userInteractionTracker,
  navigation,
}) => {
  // Refs for managing save operations
  const saveTimeoutRef = useRef(null);
  const scrollViewRef = useRef(null);
  const shouldRestoreScrollPosition = useRef(false);

  /**
   * Migration function to mark existing data as user-modified
   */
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !userInteractionTracker.isInitialized) {
      return;
    }

    console.log('=== MIGRATING MALAYSIA EXISTING DATA TO INTERACTION STATE ===');

    const existingDataToMigrate = {};

    // Migrate passport data
    if (userData.passport) {
      const passportData = userData.passport;
      if (passportData.passportNumber) {
existingDataToMigrate.passportNo = passportData.passportNumber;
}
      if (passportData.fullName) {
existingDataToMigrate.fullName = passportData.fullName;
}
      if (passportData.nationality) {
existingDataToMigrate.nationality = passportData.nationality;
}
      if (passportData.dateOfBirth) {
existingDataToMigrate.dob = passportData.dateOfBirth;
}
      if (passportData.expiryDate) {
existingDataToMigrate.expiryDate = passportData.expiryDate;
}
      if (passportData.gender) {
existingDataToMigrate.sex = passportData.gender;
}
    }

    // Migrate personal info data
    if (userData.personalInfo) {
      const personalInfo = userData.personalInfo;
      if (personalInfo.phoneCode) {
existingDataToMigrate.phoneCode = personalInfo.phoneCode;
}
      if (personalInfo.phoneNumber) {
existingDataToMigrate.phoneNumber = personalInfo.phoneNumber;
}
      if (personalInfo.email) {
existingDataToMigrate.email = personalInfo.email;
}
      if (personalInfo.occupation) {
existingDataToMigrate.occupation = personalInfo.occupation;
}
      if (personalInfo.countryRegion) {
existingDataToMigrate.residentCountry = personalInfo.countryRegion;
}
    }

    // Migrate travel info data
    if (userData.travelInfo) {
      const travelInfo = userData.travelInfo;
      if (travelInfo.travelPurpose) {
existingDataToMigrate.travelPurpose = travelInfo.travelPurpose;
}
      if (travelInfo.accommodationType) {
existingDataToMigrate.accommodationType = travelInfo.accommodationType;
}
      if (travelInfo.arrivalFlightNumber) {
existingDataToMigrate.arrivalFlightNumber = travelInfo.arrivalFlightNumber;
}
      if (travelInfo.arrivalDate) {
existingDataToMigrate.arrivalDate = travelInfo.arrivalDate;
}
      if (travelInfo.hotelAddress) {
existingDataToMigrate.hotelAddress = travelInfo.hotelAddress;
}
      if (travelInfo.lengthOfStay) {
existingDataToMigrate.stayDuration = travelInfo.lengthOfStay;
}
    }

    console.log('Data to migrate:', existingDataToMigrate);
    console.log('Number of fields to migrate:', Object.keys(existingDataToMigrate).length);

    if (Object.keys(existingDataToMigrate).length > 0) {
      userInteractionTracker.initializeWithExistingData(existingDataToMigrate);
      console.log('✅ Migration completed - existing data marked as user-modified');
    } else {
      console.log('⚠️ No existing data found to migrate');
    }
  }, [userInteractionTracker]);

  /**
   * Load all data from UserDataService
   */
  const loadData = useCallback(async () => {
    try {
      formState.setIsLoading(true);

      // Initialize UserDataService
      await UserDataService.initialize(userId);

      // Load all user data
      const allUserData = await UserDataService.getAllUserData(userId);

      // Load travel info
      const destinationId = destination?.id || 'my';
      const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

      // Load fund items
      const fundItems = await UserDataService.getFundItems(userId);

      // Populate form using the populateForm helper
      formState.populateForm({
        passport: allUserData.passport,
        personalInfo: allUserData.personalInfo,
        travelInfo: travelInfo,
        fundItems: fundItems,
      });

      // Migrate existing data to interaction state
      const userData = {
        passport: allUserData.passport,
        personalInfo: allUserData.personalInfo,
        travelInfo: travelInfo
      };
      await migrateExistingDataToInteractionState(userData);

      // Restore session state
      await loadSessionState();

    } catch (error) {
      console.error('Failed to load Malaysia travel info data:', error);
    } finally {
      formState.setIsLoading(false);
    }
  }, [userId, destination, formState, migrateExistingDataToInteractionState]);

  /**
   * Save data to secure storage with field overrides
   */
  const saveDataToSecureStorage = useCallback(async (fieldOverrides = {}) => {
    try {
      formState.setSaveStatus('saving');

      // Save passport data
      await UserDataService.updatePassport(userId, {
        passportNumber: formState.passportNo,
        fullName: formState.fullName,
        nationality: formState.nationality,
        dateOfBirth: formState.dob,
        expiryDate: formState.expiryDate,
        gender: formState.sex,
        ...fieldOverrides,
      });

      // Save personal info
      await UserDataService.updatePersonalInfo(userId, {
        occupation: formState.occupation,
        countryRegion: formState.residentCountry,
        phoneCode: formState.phoneCode,
        phoneNumber: formState.phoneNumber,
        email: formState.email,
        ...fieldOverrides,
      });

      // Save travel info
      const destinationId = destination?.id || 'my';
      await UserDataService.updateTravelInfo(userId, destinationId, {
        travelPurpose: formState.travelPurpose,
        arrivalFlightNumber: formState.arrivalFlightNumber,
        arrivalDate: formState.arrivalDate,
        accommodationType: formState.accommodationType,
        hotelAddress: formState.hotelAddress,
        lengthOfStay: formState.stayDuration,
        ...fieldOverrides,
      });

      formState.setSaveStatus('saved');
      setTimeout(() => formState.setSaveStatus(null), 2000);

      return { success: true };
    } catch (error) {
      console.error('Failed to save Malaysia travel info:', error);
      formState.setSaveStatus('error');
      return { success: false, error };
    }
  }, [userId, destination, formState]);

  /**
   * Debounced save function for auto-save on user input
   */
  const debouncedSaveData = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      await saveDataToSecureStorage();
    }, 1000);
  }, [saveDataToSecureStorage]);

  /**
   * Refresh fund items from backend
   */
  const refreshFundItems = useCallback(async () => {
    try {
      const fundItems = await UserDataService.getFundItems(userId);
      formState.setFunds(fundItems || []);
    } catch (error) {
      console.error('Failed to refresh fund items:', error);
    }
  }, [userId, formState]);

  /**
   * Save fund items
   */
  const saveFundItems = useCallback(async (fundItems) => {
    try {
      await UserDataService.updateFundItems(userId, fundItems);
      formState.setFunds(fundItems);
      return { success: true };
    } catch (error) {
      console.error('Failed to save fund items:', error);
      return { success: false, error };
    }
  }, [userId, formState]);

  /**
   * Initialize entry info
   */
  const initializeEntryInfo = useCallback(async () => {
    try {
      // Initialize entry info if needed
      // Malaysia-specific entry info initialization
      const destinationId = destination?.id || 'my';
      const entryInfo = await UserDataService.getEntryInfo(userId, destinationId);

      if (entryInfo) {
        formState.setEntryInfoId(entryInfo.id);
        formState.setEntryInfoInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize entry info:', error);
    }
  }, [userId, destination, formState]);

  /**
   * Get session state key
   */
  const getSessionStateKey = useCallback(() => {
    return `malaysia_session_${passport?.id}_${destination?.id}`;
  }, [passport, destination]);

  /**
   * Save session state to AsyncStorage
   */
  const saveSessionState = useCallback(async () => {
    try {
      const sessionState = {
        expandedSection: formState.expandedSection,
        scrollPosition: formState.scrollPosition,
        lastEditedField: formState.lastEditedField,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        getSessionStateKey(),
        JSON.stringify(sessionState)
      );
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }, [formState, getSessionStateKey]);

  /**
   * Load session state from AsyncStorage
   */
  const loadSessionState = useCallback(async () => {
    try {
      const sessionStateJson = await AsyncStorage.getItem(getSessionStateKey());

      if (sessionStateJson) {
        const sessionState = JSON.parse(sessionStateJson);

        // Restore expanded section
        if (sessionState.expandedSection) {
          formState.setExpandedSection(sessionState.expandedSection);
        }

        // Restore scroll position
        if (sessionState.scrollPosition && scrollViewRef.current) {
          shouldRestoreScrollPosition.current = true;
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: sessionState.scrollPosition,
              animated: false,
            });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
  }, [formState, getSessionStateKey]);

  /**
   * Clear session state
   */
  const clearSessionState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(getSessionStateKey());
    } catch (error) {
      console.error('Failed to clear session state:', error);
    }
  }, [getSessionStateKey]);

  /**
   * Save photo to storage
   */
  const savePhoto = useCallback(async (photoType, photoUri) => {
    try {
      const fieldName = photoType === 'flightTicket'
        ? 'flightTicketPhoto'
        : 'hotelReservationPhoto';

      // Update formState
      if (photoType === 'flightTicket') {
        formState.setFlightTicketPhoto(photoUri);
      } else {
        formState.setHotelReservationPhoto(photoUri);
      }

      // Save to secure storage
      await saveDataToSecureStorage({ [fieldName]: photoUri });

      return { success: true };
    } catch (error) {
      console.error(`Failed to save ${photoType} photo:`, error);
      return { success: false, error };
    }
  }, [formState, saveDataToSecureStorage]);

  // Return all persistence functions
  return {
    loadData,
    saveDataToSecureStorage,
    debouncedSaveData,
    refreshFundItems,
    saveFundItems,
    initializeEntryInfo,
    saveSessionState,
    loadSessionState,
    clearSessionState,
    migrateExistingDataToInteractionState,
    savePhoto,

    // Refs
    scrollViewRef,
    shouldRestoreScrollPosition,
  };
};
