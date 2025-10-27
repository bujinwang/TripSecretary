import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserDataService from '../../services/data/UserDataService';
import { getPhoneCode } from '../../data/phoneCodes';
import USFormHelper from '../../utils/usa/USFormHelper';
import FieldStateManager from '../../utils/FieldStateManager';

const getDefaultArrivalDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

/**
 * Custom hook for handling all data persistence operations
 * Manages loading from and saving to UserDataService
 *
 * @param {Object} params - Hook parameters
 * @param {Object} params.passport - Passport object
 * @param {Object} params.destination - Destination object
 * @param {string} params.userId - User ID
 * @param {Object} params.formState - Form state object from useUSFormState
 * @param {Object} params.userInteractionTracker - User interaction tracker instance
 * @param {Object} params.navigation - Navigation object
 * @returns {Object} Data persistence functions
 */
export const useUSDataPersistence = ({
  passport,
  destination,
  userId,
  formState,
  userInteractionTracker,
  navigation,
  t,
}) => {
  const saveTimeoutRef = useRef(null);
  const scrollViewRef = useRef(null);
  const shouldRestoreScrollPosition = useRef(false);

  // ============================================================
  // MAIN DATA LOADING FUNCTION
  // ============================================================

  /**
   * Load all data from UserDataService and populate form state
   */
  const loadData = useCallback(async () => {
    try {
      formState.setIsLoading(true);

      // Initialize UserDataService for this user
      await UserDataService.initialize(userId);

      // Load all data in parallel
      const [passportData, personalInfo, travelInfo, fundItems] = await Promise.all([
        UserDataService.getPassport(userId).catch(() => null),
        UserDataService.getPersonalInfo(userId).catch(() => null),
        UserDataService.getTravelInfo(userId, destination?.id || 'us').catch(() => null),
        UserDataService.getFundItems(userId).catch(() => [])
      ]);

      // ========== POPULATE PASSPORT DATA ==========
      if (passportData) {
        formState.setPassportNo(passportData.passportNumber || '');
        formState.setFullName(passportData.fullName || '');
        formState.setNationality(passportData.nationality || '');
        formState.setDob(passportData.dateOfBirth || '');
        formState.setExpiryDate(passportData.expiryDate || '');
        formState.setGender(passportData.gender || '');
      }

      // ========== POPULATE PERSONAL INFO ==========
      if (personalInfo) {
        formState.setOccupation(personalInfo.occupation || '');
        formState.setCityOfResidence(personalInfo.provinceCity || '');
        formState.setResidentCountry(personalInfo.countryRegion || '');

        // Phone code - use saved value or auto-detect from country
        const savedPhoneCode = personalInfo.phoneCode || '';
        const autoPhoneCode = savedPhoneCode || getPhoneCode(personalInfo.countryRegion || passportData?.nationality || '');
        formState.setPhoneCode(autoPhoneCode);

        formState.setPhoneNumber(personalInfo.phoneNumber || '');
        formState.setEmail(personalInfo.email || '');
      }

      // ========== POPULATE FUND ITEMS ==========
      if (fundItems && Array.isArray(fundItems)) {
        formState.setFunds(fundItems);
      }

      // ========== POPULATE TRAVEL INFO ==========
      if (travelInfo) {
        // Handle travel purpose (predefined or custom)
        const storedCustomPurpose = travelInfo.customTravelPurpose || '';
        const loadedPurposeRaw = travelInfo.travelPurpose || storedCustomPurpose || 'Tourism';
        const normalizedPurpose = USFormHelper.normalizeTravelPurpose(loadedPurposeRaw);

        if (normalizedPurpose === 'Other') {
          formState.setTravelPurpose('Other');
          formState.setCustomTravelPurpose(storedCustomPurpose || loadedPurposeRaw || '');
        } else {
          formState.setTravelPurpose(normalizedPurpose);
          formState.setCustomTravelPurpose('');
        }

        // Flight and accommodation info
        formState.setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
        formState.setArrivalDate(travelInfo.arrivalArrivalDate || getDefaultArrivalDate());
        formState.setIsTransitPassenger(travelInfo.isTransitPassenger || false);
        formState.setAccommodationAddress(travelInfo.hotelAddress || '');
        formState.setAccommodationPhone(travelInfo.accommodationPhone || '');
        formState.setLengthOfStay(travelInfo.lengthOfStay || '');
      } else {
        // Set default arrival date if no travel info exists
        formState.setArrivalDate(getDefaultArrivalDate());
      }

      // ========== RESTORE SESSION STATE ==========
      await loadSessionState();

      // ========== INITIALIZE ENTRY INFO ==========
      // Will be used for linking documents and creating entry packs
      await initializeEntryInfo();

    } catch (error) {
      console.error('Error loading US travel data:', error);
      Alert.alert(
        t?.('us.travelInfo.errors.loadingFailed', { defaultValue: 'Loading Failed' }),
        t?.('us.travelInfo.errors.loadingFailedMessage', { defaultValue: 'Failed to load travel information' }),
        [{ text: 'OK' }]
      );
    } finally {
      formState.setIsLoading(false);
    }
  }, [userId, destination, formState, t]);

  // ============================================================
  // SAVE DATA TO BACKEND
  // ============================================================

  /**
   * Save all form data to UserDataService
   * @param {Object} overrides - Optional field overrides to include in save
   */
  const saveDataToSecureStorage = useCallback(async (overrides = {}) => {
    try {
      formState.setSaveStatus('saving');

      // Get current form data
      const formData = formState.getFormData();

      // Merge with overrides
      const dataToSave = {
        ...formData,
        ...overrides,
      };

      // ========== SAVE PASSPORT DATA ==========
      const existingPassport = await UserDataService.getPassport(userId);

      const passportUpdates = {};
      if (dataToSave.passportNo && dataToSave.passportNo.trim()) {
        passportUpdates.passportNumber = dataToSave.passportNo;
      }
      if (dataToSave.fullName && dataToSave.fullName.trim()) {
        passportUpdates.fullName = dataToSave.fullName;
      }
      if (dataToSave.nationality && dataToSave.nationality.trim()) {
        passportUpdates.nationality = dataToSave.nationality;
      }
      if (dataToSave.dob && dataToSave.dob.trim()) {
        passportUpdates.dateOfBirth = dataToSave.dob;
      }
      if (dataToSave.expiryDate && dataToSave.expiryDate.trim()) {
        passportUpdates.expiryDate = dataToSave.expiryDate;
      }
      if (dataToSave.gender && dataToSave.gender.trim()) {
        passportUpdates.gender = dataToSave.gender;
      }

      if (Object.keys(passportUpdates).length > 0) {
        if (existingPassport && existingPassport.id) {
          await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
        } else {
          await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
        }
      }

      // ========== SAVE PERSONAL INFO ==========
      const personalInfoUpdates = {};
      if (dataToSave.phoneNumber && dataToSave.phoneNumber.trim()) {
        personalInfoUpdates.phoneNumber = dataToSave.phoneNumber;
      }
      if (dataToSave.email && dataToSave.email.trim()) {
        personalInfoUpdates.email = dataToSave.email;
      }
      if (dataToSave.occupation && dataToSave.occupation.trim()) {
        personalInfoUpdates.occupation = dataToSave.occupation;
      }
      if (dataToSave.cityOfResidence && dataToSave.cityOfResidence.trim()) {
        personalInfoUpdates.provinceCity = dataToSave.cityOfResidence;
      }
      if (dataToSave.residentCountry && dataToSave.residentCountry.trim()) {
        personalInfoUpdates.countryRegion = dataToSave.residentCountry;
      }
      if (dataToSave.phoneCode && dataToSave.phoneCode.trim()) {
        personalInfoUpdates.phoneCode = dataToSave.phoneCode;
      }

      if (Object.keys(personalInfoUpdates).length > 0) {
        await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      }

      // ========== SAVE TRAVEL INFO ==========
      const travelInfoUpdates = {};

      // Travel purpose handling
      if (dataToSave.travelPurpose === 'Other') {
        const customValue = dataToSave.customTravelPurpose?.trim() || '';
        if (customValue) {
          travelInfoUpdates.travelPurpose = 'Other';
          travelInfoUpdates.customTravelPurpose = customValue;
        }
      } else if (dataToSave.travelPurpose && dataToSave.travelPurpose.trim()) {
        travelInfoUpdates.travelPurpose = dataToSave.travelPurpose;
        travelInfoUpdates.customTravelPurpose = '';
      }

      // Flight information
      if (dataToSave.arrivalFlightNumber && dataToSave.arrivalFlightNumber.trim()) {
        travelInfoUpdates.arrivalFlightNumber = dataToSave.arrivalFlightNumber;
      }
      if (dataToSave.arrivalDate && dataToSave.arrivalDate.trim()) {
        travelInfoUpdates.arrivalArrivalDate = dataToSave.arrivalDate;
      }

      // Transit and accommodation
      travelInfoUpdates.isTransitPassenger = dataToSave.isTransitPassenger;
      if (!dataToSave.isTransitPassenger) {
        if (dataToSave.accommodationAddress && dataToSave.accommodationAddress.trim()) {
          travelInfoUpdates.hotelAddress = dataToSave.accommodationAddress;
        }
        if (dataToSave.accommodationPhone && dataToSave.accommodationPhone.trim()) {
          travelInfoUpdates.accommodationPhone = dataToSave.accommodationPhone;
        }
      }

      // Length of stay
      if (dataToSave.lengthOfStay && dataToSave.lengthOfStay.trim()) {
        travelInfoUpdates.lengthOfStay = dataToSave.lengthOfStay;
      }

      if (Object.keys(travelInfoUpdates).length > 0) {
        await UserDataService.updateTravelInfo(userId, destination?.id || 'us', travelInfoUpdates);
      }

      formState.setSaveStatus('saved');

      // Auto-clear saved status after 2 seconds
      setTimeout(() => {
        formState.setSaveStatus(null);
      }, 2000);

      return { success: true };

    } catch (error) {
      console.error('Error saving US travel data:', error);
      formState.setSaveStatus('error');

      return { success: false, error };
    }
  }, [userId, destination, formState]);

  // ============================================================
  // DEBOUNCED SAVE
  // ============================================================

  /**
   * Debounced save - waits 1 second after last change before saving
   */
  const debouncedSaveData = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    formState.setSaveStatus('pending');

    saveTimeoutRef.current = setTimeout(() => {
      saveDataToSecureStorage();
    }, 1000); // 1 second debounce
  }, [saveDataToSecureStorage, formState]);

  // ============================================================
  // REFRESH FUND ITEMS
  // ============================================================

  /**
   * Refresh fund items from backend
   */
  const refreshFundItems = useCallback(async ({ forceRefresh = false } = {}) => {
    try {
      const fundItems = await UserDataService.getFundItems(userId);
      formState.setFunds(fundItems || []);
    } catch (error) {
      console.error('Error refreshing fund items:', error);
    }
  }, [userId, formState]);

  // ============================================================
  // INITIALIZE ENTRY INFO
  // ============================================================

  /**
   * Initialize entry_info record for this passport and destination
   * This is needed for creating entry packs and linking documents
   */
  const initializeEntryInfo = useCallback(async () => {
    try {
      const destinationId = destination?.id || 'us';

      // Check if entry_info already exists
      const existingEntryInfo = await UserDataService.getEntryInfoByPassportAndDestination(
        passport?.id || userId,
        destinationId
      );

      if (!existingEntryInfo) {
        // Create new entry_info
        await UserDataService.createEntryInfo({
          passportId: passport?.id || userId,
          destinationId: destinationId,
          status: 'draft',
        });
      }
    } catch (error) {
      console.error('Error initializing entry info:', error);
      // Don't throw - entry info creation is not critical for form functionality
    }
  }, [passport, destination, userId]);

  // ============================================================
  // SESSION STATE MANAGEMENT
  // ============================================================

  /**
   * Get the session state key for AsyncStorage
   */
  const getSessionStateKey = useCallback(() => {
    const passportId = passport?.id || userId;
    const destinationId = destination?.id || 'us';
    return `us_session_${passportId}_${destinationId}`;
  }, [passport, destination, userId]);

  /**
   * Save session state to AsyncStorage
   * Preserves UI state like expanded sections and scroll position
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
      console.error('Error saving session state:', error);
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

        // Restore UI state
        if (sessionState.expandedSection) {
          formState.setExpandedSection(sessionState.expandedSection);
        }

        if (sessionState.scrollPosition) {
          formState.setScrollPosition(sessionState.scrollPosition);
          shouldRestoreScrollPosition.current = true;
        }
      }
    } catch (error) {
      console.error('Error loading session state:', error);
    }
  }, [formState, getSessionStateKey]);

  // ============================================================
  // RETURN PUBLIC API
  // ============================================================

  return {
    loadData,
    saveDataToSecureStorage,
    debouncedSaveData,
    refreshFundItems,
    initializeEntryInfo,
    saveSessionState,
    loadSessionState,

    // Refs for scroll management
    scrollViewRef,
    shouldRestoreScrollPosition,
  };
};
