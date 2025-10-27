/**
 * useThailandDataPersistence Hook
 *
 * Manages data loading, saving, and persistence for Thailand Travel Info Screen
 * Handles interaction with UserDataService, session state, and debounced saves
 */

import { useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DebouncedSave from '../../utils/DebouncedSave';
import UserDataService from '../../services/data/UserDataService';
import { parsePassportName } from '../../utils/NameParser';
import { getPhoneCode } from '../../data/phoneCodes';
import { findDistrictOption, findSubDistrictOption } from '../../utils/thailand/LocationHelpers';
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES, OCCUPATION_OPTIONS } from '../../screens/thailand/constants';
import FieldStateManager from '../../utils/FieldStateManager';

/**
 * Custom hook to manage Thailand travel form data persistence
 * @param {Object} params - Hook parameters
 * @param {Object} params.passport - Passport information
 * @param {Object} params.destination - Destination information
 * @param {string} params.userId - User ID
 * @param {Object} params.formState - Form state from useThailandFormState
 * @param {Object} params.userInteractionTracker - User interaction tracker instance
 * @param {Object} params.navigation - React Navigation object
 * @returns {Object} Data persistence functions and state
 */
export const useThailandDataPersistence = ({
  passport,
  destination,
  userId,
  formState,
  userInteractionTracker,
  navigation,
}) => {
  const scrollViewRef = useRef(null);
  const shouldRestoreScrollPosition = useRef(false);

  // Normalize fund item
  const normalizeFundItem = useCallback((item) => ({
    id: item.id,
    type: item.type || item.itemType || 'cash',
    amount: item.amount,
    currency: item.currency,
    details: item.details || item.description || '',
    photoUri: item.photoUri || item.photo || null,
    userId: item.userId || userId,
  }), [userId]);

  // Refresh fund items from database
  const refreshFundItems = useCallback(async (options = {}) => {
    try {
      const fundItems = await UserDataService.getFundItems(userId, options);
      const normalized = fundItems.map(normalizeFundItem);
      formState.setFunds(normalized);
    } catch (error) {
      console.error('Failed to refresh fund items:', error);
    }
  }, [userId, normalizeFundItem, formState]);

  // Initialize entry_info for this user and destination
  const initializeEntryInfo = useCallback(async () => {
    try {
      if (formState.entryInfoInitialized) {
        console.log('Entry info already initialized');
        return;
      }

      const destinationId = destination?.id || 'thailand';
      console.log('🔍 Initializing entry info for destination:', destinationId);

      // Try to find existing entry_info
      const existingEntryInfos = await UserDataService.getAllEntryInfosForUser(userId);
      const existingEntryInfo = existingEntryInfos?.find(
        entry => entry.destinationId === destinationId
      );

      if (existingEntryInfo) {
        console.log('✅ Found existing entry info:', existingEntryInfo.id);
        formState.setEntryInfoId(existingEntryInfo.id);
        formState.setEntryInfoInitialized(true);
        return existingEntryInfo.id;
      }

      // Try to get passport, but don't require it for entry_info creation
      const passportData = await UserDataService.getPassport(userId);
      console.log('Passport lookup result:', passportData ? `Found passport ${passportData.id}` : 'No passport found');

      // Create new entry_info
      console.log('📝 Creating new entry info for user:', userId);
      const entryInfoData = {
        userId,
        passportId: passportData?.id || null,
        destinationId,
        status: 'incomplete',
        completionMetrics: {
          passport: { complete: 0, total: 5, state: 'missing' },
          personalInfo: { complete: 0, total: 6, state: 'missing' },
          funds: { complete: 0, total: 1, state: 'missing' },
          travel: { complete: 0, total: 6, state: 'missing' }
        },
        fundItemIds: [],
        lastUpdatedAt: new Date().toISOString()
      };

      const newEntryInfo = await UserDataService.createEntryInfo(entryInfoData);
      console.log('✅ Created new entry info:', newEntryInfo.id);
      formState.setEntryInfoId(newEntryInfo.id);
      formState.setEntryInfoInitialized(true);
      return newEntryInfo.id;
    } catch (error) {
      console.error('Failed to initialize entry info:', error);
      throw error;
    }
  }, [userId, destination, formState]);

  // Session state management
  const getSessionStateKey = useCallback(() => {
    return `session_state_thailand_${userId}`;
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

  // Migration function to mark existing data as user-modified
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !userInteractionTracker.isInitialized) {
      return;
    }

    console.log('=== MIGRATING EXISTING DATA TO INTERACTION STATE ===');

    const existingDataToMigrate = {};

    // Migrate passport data
    if (userData.passport) {
      const passport = userData.passport;
      if (passport.passportNumber) existingDataToMigrate.passportNo = passport.passportNumber;
      if (passport.fullName) existingDataToMigrate.fullName = passport.fullName;
      if (passport.nationality) existingDataToMigrate.nationality = passport.nationality;
      if (passport.dateOfBirth) existingDataToMigrate.dob = passport.dateOfBirth;
      if (passport.expiryDate) existingDataToMigrate.expiryDate = passport.expiryDate;
      if (passport.gender) existingDataToMigrate.sex = passport.gender;
    }

    // Migrate personal info data
    if (userData.personalInfo) {
      const personalInfo = userData.personalInfo;
      if (personalInfo.phoneCode) existingDataToMigrate.phoneCode = personalInfo.phoneCode;
      if (personalInfo.phoneNumber) existingDataToMigrate.phoneNumber = personalInfo.phoneNumber;
      if (personalInfo.email) existingDataToMigrate.email = personalInfo.email;
      if (personalInfo.occupation) existingDataToMigrate.occupation = personalInfo.occupation;
      if (personalInfo.provinceCity) existingDataToMigrate.cityOfResidence = personalInfo.provinceCity;
      if (personalInfo.countryRegion) existingDataToMigrate.residentCountry = personalInfo.countryRegion;
    }

    // Migrate travel info data
    if (userData.travelInfo) {
      const travelInfo = userData.travelInfo;
      if (travelInfo.travelPurpose) existingDataToMigrate.travelPurpose = travelInfo.travelPurpose;
      if (travelInfo.boardingCountry) existingDataToMigrate.boardingCountry = travelInfo.boardingCountry;
      if (travelInfo.accommodationType) existingDataToMigrate.accommodationType = travelInfo.accommodationType;
      if (travelInfo.recentStayCountry) existingDataToMigrate.recentStayCountry = travelInfo.recentStayCountry;
      if (travelInfo.arrivalFlightNumber) existingDataToMigrate.arrivalFlightNumber = travelInfo.arrivalFlightNumber;
      if (travelInfo.arrivalArrivalDate) existingDataToMigrate.arrivalArrivalDate = travelInfo.arrivalArrivalDate;
      if (travelInfo.departureFlightNumber) existingDataToMigrate.departureFlightNumber = travelInfo.departureFlightNumber;
      if (travelInfo.departureDepartureDate) existingDataToMigrate.departureDepartureDate = travelInfo.departureDepartureDate;
      if (travelInfo.province) existingDataToMigrate.province = travelInfo.province;
      if (travelInfo.district) existingDataToMigrate.district = travelInfo.district;
      if (travelInfo.subDistrict) existingDataToMigrate.subDistrict = travelInfo.subDistrict;
      if (travelInfo.postalCode) existingDataToMigrate.postalCode = travelInfo.postalCode;
      if (travelInfo.hotelAddress) existingDataToMigrate.hotelAddress = travelInfo.hotelAddress;
      if (travelInfo.visaNumber) existingDataToMigrate.visaNumber = travelInfo.visaNumber;
      if (travelInfo.isTransitPassenger !== undefined) existingDataToMigrate.isTransitPassenger = travelInfo.isTransitPassenger;
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

  // Save photo to travel info
  const savePhoto = useCallback(async (photoType, photoUri) => {
    try {
      const fieldName = photoType === 'flightTicket' ? 'flightTicketPhoto' : 'hotelReservationPhoto';

      // Update formState
      if (photoType === 'flightTicket') {
        formState.setFlightTicketPhoto(photoUri);
      } else {
        formState.setHotelReservationPhoto(photoUri);
      }

      // Save to secure storage with override
      await saveDataToSecureStorage({
        [fieldName]: photoUri
      });

      return { success: true };
    } catch (error) {
      console.error(`Failed to save ${photoType} photo:`, error);
      return { success: false, error };
    }
  }, [formState, saveDataToSecureStorage]);

  // Load data from database
  const loadData = useCallback(async () => {
    try {
      console.log('=== LOADING DATA FROM DATABASE ===');
      formState.setIsLoading(true);

      // Load passport data
      const passportInfo = await UserDataService.getPassport(userId);
      if (passportInfo) {
        console.log('Passport info loaded:', passportInfo);
        formState.setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');

        // Parse full name from passportInfo
        if (passportInfo.fullName) {
          const { surname, middleName, givenName } = parsePassportName(passportInfo.fullName);
          formState.setSurname(surname);
          formState.setMiddleName(middleName);
          formState.setGivenName(givenName);
        }

        formState.setNationality(passportInfo.nationality || passport?.nationality || '');
        formState.setDob(passportInfo.dateOfBirth || passport?.dob || '');
        formState.setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');
        formState.setPassportData(passportInfo);
      } else {
        // Fallback to route params
        formState.setPassportNo(passport?.passportNo || '');
        const nameToParse = passport?.nameEn || passport?.name || '';
        if (nameToParse) {
          const { surname, middleName, givenName } = parsePassportName(nameToParse);
          formState.setSurname(surname);
          formState.setMiddleName(middleName);
          formState.setGivenName(givenName);
        }
        formState.setNationality(passport?.nationality || '');
        formState.setDob(passport?.dob || '');
        formState.setExpiryDate(passport?.expiry || '');
      }

      // Load personal info
      const personalInfo = await UserDataService.getPersonalInfo(userId);
      if (personalInfo) {
        console.log('Personal info loaded:', personalInfo);

        // Handle occupation
        const savedOccupation = personalInfo.occupation || '';
        const isPredefined = OCCUPATION_OPTIONS.some(opt => opt.value === savedOccupation);
        if (isPredefined) {
          formState.setOccupation(savedOccupation);
          formState.setCustomOccupation('');
        } else if (savedOccupation) {
          formState.setOccupation('OTHER');
          formState.setCustomOccupation(savedOccupation);
        }

        formState.setCityOfResidence(personalInfo.provinceCity || '');
        formState.setResidentCountry(personalInfo.countryRegion || '');
        formState.setPhoneNumber(personalInfo.phoneNumber || '');
        formState.setEmail(personalInfo.email || '');
        formState.setPhoneCode(personalInfo.phoneCode || getPhoneCode(personalInfo.countryRegion || passport?.nationality || ''));
        formState.setPersonalInfoData(personalInfo);
      } else {
        formState.setPhoneCode(getPhoneCode(passport?.nationality || ''));
      }

      // Load gender from passport
      const loadedSex = passportInfo?.gender || passport?.sex || passport?.gender || 'Male';
      formState.setSex(loadedSex);

      // Load fund items
      await refreshFundItems();

      // Load travel info
      try {
        const destinationId = destination?.id || 'thailand';
        console.log('Loading travel info for destination:', destinationId);
        let travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

        // Fallback: try loading with localized name
        if (!travelInfo && destination?.name) {
          console.log('Trying fallback with destination name:', destination.name);
          travelInfo = await UserDataService.getTravelInfo(userId, destination.name);
        }

        if (travelInfo) {
          console.log('=== LOADING SAVED TRAVEL INFO ===');
          console.log('Travel info data:', JSON.stringify(travelInfo, null, 2));

          // Handle travel purpose
          const loadedPurpose = travelInfo.travelPurpose || 'HOLIDAY';
          if (PREDEFINED_TRAVEL_PURPOSES.includes(loadedPurpose)) {
            formState.setTravelPurpose(loadedPurpose);
            formState.setCustomTravelPurpose('');
          } else {
            formState.setTravelPurpose('OTHER');
            formState.setCustomTravelPurpose(loadedPurpose);
          }

          formState.setBoardingCountry(travelInfo.boardingCountry || '');
          formState.setRecentStayCountry(travelInfo.recentStayCountry || '');
          formState.setVisaNumber(travelInfo.visaNumber || '');
          formState.setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
          formState.setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
          formState.setPreviousArrivalDate(travelInfo.arrivalArrivalDate || '');
          formState.setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
          formState.setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
          formState.setIsTransitPassenger(travelInfo.isTransitPassenger || false);

          // Handle accommodation type
          const loadedAccommodationType = travelInfo.accommodationType || 'HOTEL';
          if (PREDEFINED_ACCOMMODATION_TYPES.includes(loadedAccommodationType)) {
            formState.setAccommodationType(loadedAccommodationType);
            formState.setCustomAccommodationType('');
          } else {
            formState.setAccommodationType('OTHER');
            formState.setCustomAccommodationType(loadedAccommodationType);
          }

          formState.setProvince(travelInfo.province || '');
          formState.setDistrict(travelInfo.district || '');
          const matchedDistrict = findDistrictOption(travelInfo.province || '', travelInfo.district || '');
          formState.setDistrictId(matchedDistrict?.id || null);
          formState.setSubDistrict(travelInfo.subDistrict || '');
          const matchedSubDistrict = findSubDistrictOption(
            matchedDistrict?.id || travelInfo.districtId || null,
            travelInfo.subDistrict || ''
          );
          formState.setSubDistrictId(matchedSubDistrict?.id || null);
          formState.setPostalCode(travelInfo.postalCode || '');
          formState.setHotelAddress(travelInfo.hotelAddress || '');

          // Load document photos
          formState.setFlightTicketPhoto(travelInfo.flightTicketPhoto || null);
          formState.setHotelReservationPhoto(travelInfo.hotelReservationPhoto || null);

          // Initialize user interaction tracker
          userInteractionTracker.initializeWithExistingData({
            travelPurpose: travelInfo.travelPurpose,
            boardingCountry: travelInfo.boardingCountry,
            accommodationType: travelInfo.accommodationType,
            recentStayCountry: travelInfo.recentStayCountry,
            arrivalFlightNumber: travelInfo.arrivalFlightNumber,
            arrivalArrivalDate: travelInfo.arrivalArrivalDate,
            departureFlightNumber: travelInfo.departureFlightNumber,
            departureDepartureDate: travelInfo.departureDepartureDate,
            province: travelInfo.province,
            district: travelInfo.district,
            subDistrict: travelInfo.subDistrict,
            postalCode: travelInfo.postalCode,
            hotelAddress: travelInfo.hotelAddress,
            customTravelPurpose: travelInfo.travelPurpose && !PREDEFINED_TRAVEL_PURPOSES.includes(travelInfo.travelPurpose) ? travelInfo.travelPurpose : '',
            customAccommodationType: travelInfo.accommodationType && !PREDEFINED_ACCOMMODATION_TYPES.includes(travelInfo.accommodationType) ? travelInfo.accommodationType : ''
          });
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
      const nameToParse = passport?.nameEn || passport?.name || '';
      if (nameToParse) {
        const { surname, middleName, givenName } = parsePassportName(nameToParse);
        formState.setSurname(surname);
        formState.setMiddleName(middleName);
        formState.setGivenName(givenName);
      }
      formState.setNationality(passport?.nationality || '');
      formState.setDob(passport?.dob || '');
      formState.setExpiryDate(passport?.expiry || '');
      formState.setSex(passport?.sex || 'Male');
      formState.setPhoneCode(getPhoneCode(passport?.nationality || ''));
    } finally {
      formState.setIsLoading(false);
    }
  }, [userId, passport, destination, formState, userInteractionTracker, refreshFundItems]);

  // Helper function to perform the actual save operation
  const performSaveOperation = useCallback(async (userId, fieldOverrides, saveResults, saveErrors, currentState) => {
    try {
      const {
        passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
        phoneCode, phoneNumber, email, occupation, cityOfResidence, residentCountry,
        travelPurpose, customTravelPurpose, boardingCountry, recentStayCountry, visaNumber,
        arrivalFlightNumber, arrivalArrivalDate, departureFlightNumber, departureDepartureDate,
        isTransitPassenger, accommodationType, customAccommodationType, province, district,
        subDistrict, postalCode, hotelAddress, existingPassport, interactionState, destination,
        flightTicketPhoto, hotelReservationPhoto,
        entryInfoId, passportData, personalInfoData, funds
      } = currentState;

      const getCurrentValue = (fieldName, currentValue) => {
        return fieldOverrides[fieldName] !== undefined ? fieldOverrides[fieldName] : currentValue;
      };

      // Save passport data
      const allPassportFields = {
        passportNumber: getCurrentValue('passportNo', passportNo),
        fullName: [getCurrentValue('surname', surname), getCurrentValue('middleName', middleName), getCurrentValue('givenName', givenName)].filter(Boolean).join(', '),
        nationality: getCurrentValue('nationality', nationality),
        dateOfBirth: getCurrentValue('dob', dob),
        expiryDate: getCurrentValue('expiryDate', expiryDate),
        gender: getCurrentValue('sex', sex)
      };

      const passportUpdates = FieldStateManager.filterSaveableFields(
        allPassportFields,
        interactionState,
        { preserveExisting: true, alwaysSaveFields: [] }
      );

      if (Object.keys(passportUpdates).length > 0) {
        try {
          if (existingPassport && existingPassport.id) {
            const updated = await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
            formState.setPassportData(updated);
            saveResults.passport.success = true;
          } else {
            const saved = await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
            formState.setPassportData(saved);
            saveResults.passport.success = true;
          }
        } catch (passportError) {
          console.error('Failed to save passport data:', passportError);
          saveResults.passport.error = passportError;
          saveErrors.push({ section: 'passport', error: passportError });
        }
      } else {
        saveResults.passport.success = true;
      }

      // Save personal info data
      const allPersonalInfoFields = {
        phoneCode: getCurrentValue('phoneCode', phoneCode),
        phoneNumber: getCurrentValue('phoneNumber', phoneNumber),
        email: getCurrentValue('email', email),
        occupation: getCurrentValue('occupation', occupation),
        provinceCity: getCurrentValue('cityOfResidence', cityOfResidence),
        countryRegion: getCurrentValue('residentCountry', residentCountry)
      };

      const personalInfoUpdates = FieldStateManager.filterSaveableFields(
        allPersonalInfoFields,
        interactionState,
        { preserveExisting: true, alwaysSaveFields: [] }
      );

      if (Object.keys(personalInfoUpdates).length > 0) {
        try {
          const savedPersonalInfo = await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
          formState.setPersonalInfoData(savedPersonalInfo);
          saveResults.personalInfo.success = true;
        } catch (saveError) {
          console.error('Failed to save personal info:', saveError);
          saveResults.personalInfo.error = saveError;
          saveErrors.push({ section: 'personalInfo', error: saveError });
        }
      } else {
        saveResults.personalInfo.success = true;
      }

      // Save travel info data
      const destinationId = destination?.id || 'thailand';
      const finalTravelPurpose = getCurrentValue('travelPurpose', travelPurpose) === 'OTHER'
        ? getCurrentValue('customTravelPurpose', customTravelPurpose)
        : getCurrentValue('travelPurpose', travelPurpose);
      const finalAccommodationType = getCurrentValue('accommodationType', accommodationType) === 'OTHER'
        ? getCurrentValue('customAccommodationType', customAccommodationType)
        : getCurrentValue('accommodationType', accommodationType);

      const allTravelInfoFields = {
        travelPurpose: finalTravelPurpose,
        boardingCountry: getCurrentValue('boardingCountry', boardingCountry),
        recentStayCountry: getCurrentValue('recentStayCountry', recentStayCountry),
        visaNumber: getCurrentValue('visaNumber', visaNumber),
        arrivalFlightNumber: getCurrentValue('arrivalFlightNumber', arrivalFlightNumber),
        arrivalArrivalDate: getCurrentValue('arrivalArrivalDate', arrivalArrivalDate),
        departureFlightNumber: getCurrentValue('departureFlightNumber', departureFlightNumber),
        departureDepartureDate: getCurrentValue('departureDepartureDate', departureDepartureDate),
        isTransitPassenger: getCurrentValue('isTransitPassenger', isTransitPassenger),
        accommodationType: finalAccommodationType,
        province: getCurrentValue('province', province),
        district: getCurrentValue('district', district),
        subDistrict: getCurrentValue('subDistrict', subDistrict),
        postalCode: getCurrentValue('postalCode', postalCode),
        hotelAddress: getCurrentValue('hotelAddress', hotelAddress),
        flightTicketPhoto: getCurrentValue('flightTicketPhoto', flightTicketPhoto),
        hotelReservationPhoto: getCurrentValue('hotelReservationPhoto', hotelReservationPhoto)
      };

      const travelInfoUpdates = FieldStateManager.filterSaveableFields(
        allTravelInfoFields,
        interactionState,
        { preserveExisting: true, alwaysSaveFields: [] }
      );

      if (Object.keys(travelInfoUpdates).length > 0) {
        try {
          const travelDataWithDestination = { ...travelInfoUpdates, destination: destinationId };
          await UserDataService.saveTravelInfo(userId, travelDataWithDestination);
          saveResults.travelInfo.success = true;
        } catch (travelSaveError) {
          console.error('Failed to save travel info:', travelSaveError);
          saveResults.travelInfo.error = travelSaveError;
          saveErrors.push({ section: 'travelInfo', error: travelSaveError });
        }
      } else {
        saveResults.travelInfo.success = true;
      }

      // Save entry_info with linked fund items
      if (entryInfoId) {
        try {
          const latestPassport = await UserDataService.getPassport(userId);
          const latestPersonalInfo = await UserDataService.getPersonalInfo(userId);
          const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

          const entryInfoUpdateData = {
            id: entryInfoId,
            userId,
            passportId: latestPassport?.id || null,
            personalInfoId: latestPersonalInfo?.id || null,
            travelInfoId: travelInfo?.id || null,
            destinationId,
            status: 'incomplete',
            fundItemIds: funds.map(f => f.id),
            lastUpdatedAt: new Date().toISOString()
          };

          await UserDataService.saveEntryInfo(entryInfoUpdateData, userId);
          saveResults.entryInfo = { success: true, error: null };
        } catch (entryInfoError) {
          console.error('Failed to save entry info:', entryInfoError);
          saveResults.entryInfo = { success: false, error: entryInfoError };
          saveErrors.push({ section: 'entryInfo', error: entryInfoError });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Save operation failed:', error);
      return { success: false, error };
    }
  }, [formState]);

  // Save data to secure storage with field overrides
  const saveDataToSecureStorage = useCallback(async (fieldOverrides = {}) => {
    const saveErrors = [];
    const saveResults = {
      passport: { success: false, error: null },
      personalInfo: { success: false, error: null },
      travelInfo: { success: false, error: null }
    };

    try {
      // Build interaction state
      const interactionState = {};
      const allFieldNames = [
        'passportNo', 'fullName', 'nationality', 'dob', 'expiryDate', 'sex',
        'phoneCode', 'phoneNumber', 'email', 'occupation', 'cityOfResidence', 'residentCountry',
        'travelPurpose', 'customTravelPurpose', 'boardingCountry', 'recentStayCountry', 'visaNumber',
        'arrivalFlightNumber', 'arrivalArrivalDate', 'departureFlightNumber', 'departureDepartureDate',
        'isTransitPassenger', 'accommodationType', 'customAccommodationType', 'province', 'district',
        'subDistrict', 'postalCode', 'hotelAddress'
      ];

      allFieldNames.forEach(fieldName => {
        interactionState[fieldName] = {
          isUserModified: userInteractionTracker.isFieldUserModified(fieldName),
          lastModified: userInteractionTracker.getFieldInteractionDetails(fieldName)?.lastModified || null,
          initialValue: userInteractionTracker.getFieldInteractionDetails(fieldName)?.initialValue || null
        };
      });

      const existingPassport = await UserDataService.getPassport(userId);
      const finalOccupation = formState.occupation === 'OTHER' ? formState.customOccupation : formState.occupation;

      const currentState = {
        passportNo: formState.passportNo,
        surname: formState.surname,
        middleName: formState.middleName,
        givenName: formState.givenName,
        nationality: formState.nationality,
        dob: formState.dob,
        expiryDate: formState.expiryDate,
        sex: formState.sex,
        phoneCode: formState.phoneCode,
        phoneNumber: formState.phoneNumber,
        email: formState.email,
        occupation: finalOccupation,
        cityOfResidence: formState.cityOfResidence,
        residentCountry: formState.residentCountry,
        travelPurpose: formState.travelPurpose,
        customTravelPurpose: formState.customTravelPurpose,
        boardingCountry: formState.boardingCountry,
        recentStayCountry: formState.recentStayCountry,
        visaNumber: formState.visaNumber,
        arrivalFlightNumber: formState.arrivalFlightNumber,
        arrivalArrivalDate: formState.arrivalArrivalDate,
        departureFlightNumber: formState.departureFlightNumber,
        departureDepartureDate: formState.departureDepartureDate,
        isTransitPassenger: formState.isTransitPassenger,
        accommodationType: formState.accommodationType,
        customAccommodationType: formState.customAccommodationType,
        province: formState.province,
        district: formState.district,
        subDistrict: formState.subDistrict,
        postalCode: formState.postalCode,
        hotelAddress: formState.hotelAddress,
        existingPassport,
        interactionState,
        destination,
        flightTicketPhoto: formState.flightTicketPhoto,
        hotelReservationPhoto: formState.hotelReservationPhoto,
        entryInfoId: formState.entryInfoId,
        passportData: formState.passportData,
        personalInfoData: formState.personalInfoData,
        funds: formState.funds
      };

      await performSaveOperation(userId, fieldOverrides, saveResults, saveErrors, currentState);

      if (saveErrors.length > 0) {
        console.error('Save operation completed with errors:', saveErrors);
        const successfulSaves = Object.values(saveResults).filter(result => result.success).length;
        if (successfulSaves === 0) {
          throw new Error(`Complete save failure: ${saveErrors[0].error.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
      throw error;
    }
  }, [userId, destination, formState, userInteractionTracker, performSaveOperation]);

  // Debounced save function
  const debouncedSaveData = useCallback(() => {
    DebouncedSave.saveWithDebounce(
      'thailand_travel_info',
      async () => {
        try {
          formState.setLastEditedAt(new Date());
          await saveDataToSecureStorage();
          console.log('✅ Debounced save completed successfully');
        } catch (error) {
          console.error('❌ Debounced save failed:', error);
          throw error;
        }
      },
      2000
    );
  }, [saveDataToSecureStorage, formState]);

  // Setup navigation listeners
  useEffect(() => {
    // Focus listener - reload data when screen comes into focus
    const unsubscribeFocus = navigation.addListener('focus', async () => {
      try {
        // Reload passport and personal info
        const passportInfo = await UserDataService.getPassport(userId);
        const personalInfo = await UserDataService.getPersonalInfo(userId);

        if (passportInfo) {
          formState.setPassportData(passportInfo);
          // Update relevant state...
        }

        if (personalInfo) {
          formState.setPersonalInfoData(personalInfo);
          // Update relevant state...
        }

        await refreshFundItems({ forceRefresh: true });

        // Reload travel info
        try {
          const destinationId = destination?.id || 'thailand';
          const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
          if (travelInfo) {
            // Update travel info state...
          }
        } catch (travelInfoError) {
          console.log('Failed to reload travel info on focus:', travelInfoError);
        }
      } catch (error) {
        console.error('Failed to reload data on focus:', error);
      }
    });

    // Blur listener - save data when leaving screen
    const unsubscribeBlur = navigation.addListener('blur', () => {
      DebouncedSave.flushPendingSave('thailand_travel_info');
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, userId, destination, formState, refreshFundItems]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        DebouncedSave.flushPendingSave('thailand_travel_info');
        saveSessionState();
      } catch (error) {
        console.error('Failed to save data on component unmount:', error);
      }
    };
  }, [saveSessionState]);

  // Monitor save status
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('thailand_travel_info');
      formState.setSaveStatus(currentStatus);
    }, 100);

    return () => clearInterval(interval);
  }, [formState]);

  // Initialize entry info when data is loaded
  useEffect(() => {
    if (!formState.isLoading && !formState.entryInfoInitialized) {
      initializeEntryInfo();
    }
  }, [formState.isLoading, formState.entryInfoInitialized, initializeEntryInfo]);

  return {
    loadData,
    saveDataToSecureStorage,
    debouncedSaveData,
    refreshFundItems,
    initializeEntryInfo,
    saveSessionState,
    loadSessionState,
    migrateExistingDataToInteractionState,
    savePhoto,
    scrollViewRef,
    shouldRestoreScrollPosition,
  };
};

export default useThailandDataPersistence;
