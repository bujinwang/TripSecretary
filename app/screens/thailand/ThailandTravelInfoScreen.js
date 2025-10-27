
// 入境通 - Thailand Travel Info Screen (泰国入境信息)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import InputWithUserTracking from '../../components/InputWithUserTracking';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import { NationalitySelector, PassportNameInput, DateTimeInput, ProvinceSelector, DistrictSelector, SubDistrictSelector } from '../../components';
import SecureStorageService from '../../services/security/SecureStorageService';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import { findChinaProvince } from '../../utils/validation/chinaProvinceValidator';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import SuggestionProviders from '../../utils/SuggestionProviders';
import FieldStateManager from '../../utils/FieldStateManager';
import { getDistrictsByProvince, getSubDistrictsByDistrictId } from '../../data/thailandLocations';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../../services/data/UserDataService';

// Import Thailand-specific utilities
import { validateField } from '../../utils/thailand/ThailandValidationRules';
import { FieldWarningIcon, InputWithValidation, CollapsibleSection } from '../../components/thailand/ThailandTravelComponents';
import { parsePassportName } from '../../utils/NameParser';
import { normalizeLocationValue, findDistrictOption, findSubDistrictOption } from '../../utils/thailand/LocationHelpers';
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES, OCCUPATION_OPTIONS } from './constants';
import OptionSelector from '../../components/thailand/OptionSelector';

// Import custom hooks for state, persistence, and validation
import {
  useThailandFormState,
  useThailandDataPersistence,
  useThailandValidation
} from '../../hooks/thailand';

// Import section components
import {
  HeroSection,
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection
} from '../../components/thailand/sections';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ThailandTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();
  
  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);
  
  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // Initialize form state hook - consolidates all 57 useState declarations
  const formState = useThailandFormState(passport);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('thailand_travel_info');

  // Initialize persistence hook - handles data loading and saving
  const persistence = useThailandDataPersistence({
    passport,
    destination,
    userId,
    formState,
    userInteractionTracker,
    navigation
  });

  // Initialize validation hook - handles field validation and completion tracking
  const validation = useThailandValidation({
    formState,
    userInteractionTracker,
    saveDataToSecureStorageWithOverride: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData
  });

  // Extract commonly used functions from hooks for easier access
  const {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor
  } = validation;

  const {
    loadData,
    saveDataToSecureStorage: saveDataToSecureStorageWithOverride,
    debouncedSaveData,
    refreshFundItems,
    initializeEntryInfo,
    saveSessionState,
    loadSessionState,
    scrollViewRef,
    shouldRestoreScrollPosition
  } = persistence;

  // Handle district/subdistrict ID updates (cascade logic)
  useEffect(() => {
    if (!formState.province || !formState.district) {
      if (formState.districtId !== null) {
        formState.setDistrictId(null);
      }
      return;
    }

    const match = findDistrictOption(formState.province, formState.district);
    if (match && match.id !== formState.districtId) {
      formState.setDistrictId(match.id);
    }
  }, [formState.province, formState.district, formState.districtId, formState]);

  useEffect(() => {
    if (!formState.districtId || !formState.subDistrict) {
      if (formState.subDistrictId !== null) {
        formState.setSubDistrictId(null);
      }
      return;
    }

    const match = findSubDistrictOption(formState.districtId, formState.subDistrict);
    if (match && match.id !== formState.subDistrictId) {
      formState.setSubDistrictId(match.id);
      if (!formState.postalCode && match.postalCode) {
        formState.setPostalCode(String(match.postalCode));
      }
    }
  }, [formState.districtId, formState.subDistrict, formState.subDistrictId, formState.postalCode, formState]);

  // Refs for scroll management
  const scrollViewRef = useRef(null);
  const shouldRestoreScrollPosition = useRef(false);

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

  // Count filled fields for each section using FieldStateManager
  const getFieldCount = (section) => {
    // Build interaction state for FieldStateManager
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

    switch (section) {
      case 'passport':
        const passportFields = {
          fullName: [surname, middleName, givenName].filter(Boolean).join(', '),
          nationality: nationality,
          passportNo: passportNo,
          dob: dob,
          expiryDate: expiryDate,
          sex: sex
        };
        
        const passportFieldCount = FieldStateManager.getFieldCount(
          passportFields,
          interactionState,
          Object.keys(passportFields)
        );
        
        return {
          filled: passportFieldCount.totalWithValues,
          total: passportFieldCount.totalUserModified || Object.keys(passportFields).length
        };
      
      case 'personal':
        const personalFields = {
          occupation: occupation,
          cityOfResidence: cityOfResidence,
          residentCountry: residentCountry,
          phoneCode: phoneCode,
          phoneNumber: phoneNumber,
          email: email
        };
        
        const personalFieldCount = FieldStateManager.getFieldCount(
          personalFields,
          interactionState,
          Object.keys(personalFields)
        );
        
        return {
          filled: personalFieldCount.totalWithValues,
          total: personalFieldCount.totalUserModified || Object.keys(personalFields).length
        };
      
      case 'funds':
        // For funds, show actual count with minimum requirement of 1
        // Funds are not tracked by interaction state, so use existing logic
        const fundItemCount = funds.length;
        if (fundItemCount === 0) {
          return { filled: 0, total: 1 };
        } else {
          return { filled: fundItemCount, total: fundItemCount };
        }
      
      case 'travel':
        // Build travel fields with proper handling of custom values
        const purposeFilled = travelPurpose === 'OTHER' 
          ? (customTravelPurpose && customTravelPurpose.trim() !== '')
          : (travelPurpose && travelPurpose.trim() !== '');
        
        const accommodationTypeFilled = accommodationType === 'OTHER'
          ? (customAccommodationType && customAccommodationType.trim() !== '')
          : (accommodationType && accommodationType.trim() !== '');

        const travelFields = {
          travelPurpose: purposeFilled ? (travelPurpose === 'OTHER' ? customTravelPurpose : travelPurpose) : '',
          recentStayCountry: recentStayCountry,
          boardingCountry: boardingCountry,
          arrivalFlightNumber: arrivalFlightNumber,
          arrivalArrivalDate: arrivalArrivalDate,
          departureFlightNumber: departureFlightNumber,
          departureDepartureDate: departureDepartureDate
        };

        // Only include accommodation fields if not a transit passenger
        if (!isTransitPassenger) {
          travelFields.accommodationType = accommodationTypeFilled ? (accommodationType === 'OTHER' ? customAccommodationType : accommodationType) : '';
          travelFields.province = province;
          travelFields.hotelAddress = hotelAddress;
          
          // Different fields based on accommodation type
          const isHotelType = accommodationType === 'HOTEL';
          if (!isHotelType) {
            travelFields.district = district;
            travelFields.subDistrict = subDistrict;
            travelFields.postalCode = postalCode;
          }
        }
        
        const travelFieldCount = FieldStateManager.getFieldCount(
          travelFields,
          interactionState,
          Object.keys(travelFields)
        );
        
        return {
          filled: travelFieldCount.totalWithValues,
          total: travelFieldCount.totalUserModified || Object.keys(travelFields).length
        };
    }

    return { filled: 0, total: 0 };
  };

  // Calculate completion metrics using FieldStateManager
  const calculateCompletionMetrics = () => {
    try {
      const passportCount = getFieldCount('passport');
      const personalCount = getFieldCount('personal');
      const fundsCount = getFieldCount('funds');
      const travelCount = getFieldCount('travel');

      const passportComplete = passportCount.filled >= passportCount.total;
      const personalComplete = personalCount.filled >= personalCount.total;
      const fundsComplete = fundsCount.filled >= fundsCount.total;
      const travelComplete = travelCount.filled >= travelCount.total;

      const completedSections = [
        passportComplete,
        personalComplete,
        fundsComplete,
        travelComplete,
      ].filter(Boolean).length;

      const totalSections = 4;
      const totalPercent =
        totalSections > 0
          ? Math.round((completedSections / totalSections) * 100)
          : 0;

      const summary = {
        totalPercent: totalPercent,
        metrics: {
          passport: {
            completed: passportCount.filled,
            total: passportCount.total,
            percentage:
              passportCount.total > 0
                ? Math.round((passportCount.filled / passportCount.total) * 100)
                : 0,
          },
          personal: {
            completed: personalCount.filled,
            total: personalCount.total,
            percentage:
              personalCount.total > 0
                ? Math.round((personalCount.filled / personalCount.total) * 100)
                : 0,
          },
          travel: {
            completed: travelCount.filled,
            total: travelCount.total,
            percentage:
              travelCount.total > 0
                ? Math.round((travelCount.filled / travelCount.total) * 100)
                : 0,
          },
          funds: {
            completed: fundsCount.filled,
            total: fundsCount.total,
            percentage:
              fundsCount.total > 0
                ? Math.round((fundsCount.filled / fundsCount.total) * 100)
                : 0,
          },
        },
        isReady: totalPercent === 100,
      };

      formState.setCompletionMetrics(summary.metrics);
      formState.setTotalCompletionPercent(summary.totalPercent);

      console.log('=== COMPLETION METRICS RECALCULATED ===');
      console.log('Total completion:', summary.totalPercent + '%');
      console.log('Metrics:', summary.metrics);

      return summary;
    } catch (error) {
      console.error('Failed to calculate completion metrics:', error);
      return { totalPercent: 0, metrics: null, isReady: false };
    }
  };

  // Check if all fields are filled and valid
  const isFormValid = () => {
    // Check all sections are complete
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    const allFieldsFilled = 
      passportCount.filled === passportCount.total &&
      personalCount.filled === personalCount.total &&
      fundsCount.filled === fundsCount.total &&
      travelCount.filled === travelCount.total;

    // Check no validation errors exist
    const noErrors = Object.keys(errors).length === 0;

    return allFieldsFilled && noErrors;
  };

  // Get smart button configuration based on journey progress
  const getSmartButtonConfig = () => {
    if (totalCompletionPercent >= 100) {
      return {
        label: '准备入境包',
        variant: 'primary',
        style: styles.primaryButton,
        icon: '🚀',
        action: 'submit'
      };
    } else if (totalCompletionPercent >= 80) {
      return {
        label: '继续填写，即将完成！✨',
        variant: 'secondary',
        style: styles.secondaryButton,
        icon: '🌺',
        action: 'edit'
      };
    } else if (totalCompletionPercent >= 40) {
      return {
        label: '继续我的泰国准备之旅 💪',
        variant: 'secondary',
        style: styles.secondaryButton,
        icon: '🏖️',
        action: 'edit'
      };
    } else {
      return {
        label: '开始准备泰国之旅吧！🇹🇭',
        variant: 'outline',
        style: styles.outlineButton,
        icon: '🌸',
        action: 'start'
      };
    }
  };

  // Get progress indicator text - traveler-friendly messaging
  const getProgressText = () => {
    if (totalCompletionPercent >= 100) {
      return '准备好迎接泰国之旅了！🌴';
    } else if (totalCompletionPercent >= 80) {
      return '快完成了！泰国在向你招手 ✨';
    } else if (totalCompletionPercent >= 60) {
      return '进展不错！继续加油 💪';
    } else if (totalCompletionPercent >= 40) {
      return '继续我的泰国准备之旅 🏖️';
    } else if (totalCompletionPercent >= 20) {
      return '好的开始！泰国欢迎你 🌺';
    } else {
      return '让我们开始准备泰国之旅吧！🇹🇭';
    }
  };

  // Get progress color based on completion
  const getProgressColor = () => {
    if (totalCompletionPercent >= 100) {
      return '#34C759'; // Green
    } else if (totalCompletionPercent >= 50) {
      return '#FF9500'; // Orange
    } else {
      return '#FF3B30'; // Red
    }
  };

  // Debug function to clear user data
  const clearUserData = async () => {
    try {
      const userId = passport?.id || 'user_001';
      console.log('Clearing user data for userId:', userId);
      await SecureStorageService.clearUserData(userId);
      console.log('User data cleared successfully');
      
      // Clear local state
      setDob('');
      setPassportNo('');
      setFullName('');
      setNationality('');
      setExpiryDate('');
      setSex('Male');
      
      // Clear cache
      UserDataService.clearCache();
      
      alert('User data cleared successfully');
    } catch (error) {
      console.error('Failed to clear user data:', error);
      alert('Failed to clear user data: ' + error.message);
    }
  };

  // Load saved data on component mount - delegated to persistence hook
  useEffect(() => {
    loadData();
  }, [loadData]);


  // Add focus listener to reload data when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const reloadData = async () => {
        try {
          
          // Reload data from UserDataService
          const userData = await UserDataService.getAllUserData(userId);

          if (userData) {
            // Load travel info and add to userData for migration
            try {
              const destinationId = destination?.id || 'thailand';
              const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
              if (travelInfo) {
                userData.travelInfo = travelInfo;
              }
            } catch (travelInfoError) {
              console.log('Failed to load travel info for migration on focus:', travelInfoError);
            }

            // Perform backward compatibility migration on focus reload
            if (userInteractionTracker.isInitialized) {
              await migrateExistingDataToInteractionState(userData);
            }
            // Update passport data if available
            const passportInfo = userData.passport;
            if (passportInfo) {
              setPassportNo(prev => passportInfo.passportNumber || prev);
              const nameToParse = passportInfo?.fullName || '';
              if (nameToParse) {
                const { surname, middleName, givenName } = parsePassportName(nameToParse);
                setSurname(surname);
                setMiddleName(middleName);
                setGivenName(givenName);
              }
              setNationality(prev => passportInfo.nationality || prev);
              setDob(prev => passportInfo.dateOfBirth || prev);
              setExpiryDate(prev => passportInfo.expiryDate || prev);
              setPassportData(passportInfo);
            }

            // Update personal info if available
            const personalInfo = userData.personalInfo;
            if (personalInfo) {
              // Handle occupation - check if it's in predefined list
              const savedOccupation = personalInfo.occupation || occupation;
              const isPredefined = OCCUPATION_OPTIONS.some(opt => opt.value === savedOccupation);
              if (isPredefined) {
                setOccupation(savedOccupation);
                setCustomOccupation('');
              } else if (savedOccupation) {
                // Custom occupation - set to OTHER and populate custom field
                setOccupation('OTHER');
                setCustomOccupation(savedOccupation);
              }
              setCityOfResidence(personalInfo.provinceCity || cityOfResidence);
              setResidentCountry(personalInfo.countryRegion || residentCountry);
              setPhoneNumber(personalInfo.phoneNumber || phoneNumber);
              setEmail(personalInfo.email || email);
              setPhoneCode(personalInfo.phoneCode || phoneCode || getPhoneCode(personalInfo.countryRegion || passportInfo?.nationality || passport?.nationality || ''));
              setPersonalInfoData(personalInfo);
            }
            
            // Gender - load from passport only (single source of truth)
            setSex(passportInfo?.gender || passport?.sex || passport?.gender || sex);

            await refreshFundItems({ forceRefresh: true });

            // Reload travel info data as well
            try {
              const destinationId = destination?.id || 'thailand';
              const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
              
              if (travelInfo) {
                console.log('=== RELOADING TRAVEL INFO ON FOCUS ===');
                console.log('travelInfo.departureDepartureDate:', travelInfo.departureDepartureDate);
                
                // Update travel info state
                const predefinedPurposes = PREDEFINED_TRAVEL_PURPOSES;
                const loadedPurpose = travelInfo.travelPurpose || 'HOLIDAY';
                if (predefinedPurposes.includes(loadedPurpose)) {
                  setTravelPurpose(loadedPurpose);
                  setCustomTravelPurpose('');
                } else {
                  setTravelPurpose('OTHER');
                  setCustomTravelPurpose(loadedPurpose);
                }
                setBoardingCountry(travelInfo.boardingCountry || '');
                setRecentStayCountry(travelInfo.recentStayCountry || '');
                setVisaNumber(travelInfo.visaNumber || '');
                setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
                setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
                setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
                setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
                setIsTransitPassenger(travelInfo.isTransitPassenger || false);
                
                // Load accommodation type
                const predefinedAccommodationTypes = PREDEFINED_ACCOMMODATION_TYPES;
                const loadedAccommodationType = travelInfo.accommodationType || 'HOTEL';
                if (predefinedAccommodationTypes.includes(loadedAccommodationType)) {
                  setAccommodationType(loadedAccommodationType);
                  setCustomAccommodationType('');
                } else {
                  setAccommodationType('OTHER');
                  setCustomAccommodationType(loadedAccommodationType);
                }
                setProvince(travelInfo.province || '');
                setDistrict(travelInfo.district || '');
                setSubDistrict(travelInfo.subDistrict || '');
                setPostalCode(travelInfo.postalCode || '');
                setHotelAddress(travelInfo.hotelAddress || '');

                // Load document photos
                setFlightTicketPhoto(travelInfo.flightTicketPhoto || null);
                setHotelReservationPhoto(travelInfo.hotelReservationPhoto || null);
              }
            } catch (travelInfoError) {
              console.log('Failed to reload travel info on focus:', travelInfoError);
            }
          }
        } catch (error) {
          // Failed to reload data on focus
        }
      };

      reloadData();
    });

    return unsubscribe;
  }, [navigation, passport, refreshFundItems]);

  // Add blur listener to save data when leaving the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Flush any pending saves when leaving the screen
      DebouncedSave.flushPendingSave('thailand_travel_info');
    });

    return unsubscribe;
  }, [navigation]);

  // Cleanup effect (equivalent to componentWillUnmount)
  useEffect(() => {
    return () => {
      // Save data and session state when component is unmounted
      try {
        DebouncedSave.flushPendingSave('thailand_travel_info');
        saveSessionState();
      } catch (error) {
        console.error('Failed to save data on component unmount:', error);
        // Log error but don't block unmounting
      }
    };
  }, []);

  // Monitor save status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('thailand_travel_info');
      formState.setSaveStatus(currentStatus);
    }, 100);

    return () => clearInterval(interval);
  }, [formState]);

  // Initialize entry_info when screen loads and data is ready
  useEffect(() => {
    if (!isLoading && !entryInfoInitialized) {
      // Initialize entry_info even if passport data doesn't exist yet
      // The entry_info will be updated with passport/personal info IDs when data is saved
      initializeEntryInfo();
    }
  }, [isLoading, entryInfoInitialized, initializeEntryInfo]);

  // Session state management functions
  const getSessionStateKey = () => {
    const userId = passport?.id || 'user_001';
    return `session_state_thailand_${userId}`;
  };

  const saveSessionState = async () => {
    try {
      const sessionState = {
        expandedSection,
        scrollPosition,
        lastEditedField,
        timestamp: new Date().toISOString(),
      };
      
      const key = getSessionStateKey();
      await AsyncStorage.setItem(key, JSON.stringify(sessionState));
      console.log('Session state saved:', sessionState);
    } catch (error) {
      console.error('Failed to save session state:', error);
      // Don't show error to user as this is non-critical
    }
  };

  const loadSessionState = async () => {
    try {
      const key = getSessionStateKey();
      const sessionStateJson = await AsyncStorage.getItem(key);
      
      if (sessionStateJson) {
        const sessionState = JSON.parse(sessionStateJson);
        console.log('Session state loaded:', sessionState);
        
        // Restore expanded section
        if (sessionState.expandedSection) {
          formState.setExpandedSection(sessionState.expandedSection);
        }

        // Restore scroll position (will be applied after data loads)
        if (sessionState.scrollPosition) {
          formState.setScrollPosition(sessionState.scrollPosition);
          shouldRestoreScrollPosition.current = true;
        }

        // Restore last edited field
        if (sessionState.lastEditedField) {
          formState.setLastEditedField(sessionState.lastEditedField);
        }
        
        return sessionState;
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
      // Continue without session state
    }
    return null;
  };

  // Save session state when expandedSection changes
  useEffect(() => {
    if (!isLoading) {
      saveSessionState();
    }
  }, [expandedSection, lastEditedField]);

  // Load session state on component mount
  useEffect(() => {
    loadSessionState();
  }, []);

  // Restore scroll position after data loads
  useEffect(() => {
    if (
      !isLoading &&
      shouldRestoreScrollPosition.current &&
      scrollPosition > 0 &&
      scrollViewRef.current
    ) {
      const targetScrollPosition = scrollPosition;
      shouldRestoreScrollPosition.current = false;

      // Use a small delay to ensure the ScrollView is fully rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: targetScrollPosition,
          animated: false,
        });
      }, 100);
    }
  }, [isLoading, scrollPosition]);

  // Recalculate completion metrics when data changes
  useEffect(() => {
    if (!isLoading) {
      calculateCompletionMetrics();
    }
  }, [
    passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneNumber, email, phoneCode,
    funds,
    travelPurpose, customTravelPurpose, arrivalArrivalDate, departureDepartureDate,
    arrivalFlightNumber, departureFlightNumber, recentStayCountry, boardingCountry, hotelAddress,
    accommodationType, customAccommodationType, province, district, subDistrict,
    postalCode, isTransitPassenger, isLoading
  ]);

  // Helper function to handle navigation with save error handling
  const handleNavigationWithSave = async (navigationAction, actionName = 'navigate') => {
    try {
      // Set saving state to show user that save is in progress
      formState.setSaveStatus('saving');

      // Flush any pending saves before navigation
      await DebouncedSave.flushPendingSave('thailand_travel_info');

      // Execute the navigation action
      navigationAction();
    } catch (error) {
      console.error(`Failed to save data before ${actionName}:`, error);
      formState.setSaveStatus('error');

      // Show error alert and ask user if they want to continue without saving
      Alert.alert(
        'Save Error',
        `Failed to save your data. Do you want to ${actionName} without saving?`,
        [
          {
            text: 'Retry Save',
            onPress: () => handleNavigationWithSave(navigationAction, actionName), // Retry
          },
          {
            text: `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} Anyway`,
            onPress: () => {
              // Execute navigation without saving
              navigationAction();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => formState.setSaveStatus(null),
          },
        ]
      );
    }
  };





  // Create debounced save function with error handling
  const debouncedSaveDataLocal = DebouncedSave.debouncedSave(
    'thailand_travel_info',
    async () => {
      await saveDataToSecureStorage();
      formState.setLastEditedAt(new Date());
    },
    300,
    {
      maxRetries: 3,
      retryDelay: 1000,
      onError: (error, retryCount) => {
        console.error(`Save failed after ${retryCount} retries:`, error);
        // Could show user notification here
        Alert.alert(
          '保存失败',
          `数据保存失败，已重试 ${retryCount} 次。请检查网络连接或稍后再试。`,
          [
            { text: '稍后重试', style: 'cancel' },
            { 
              text: '立即重试', 
              onPress: () => DebouncedSave.retrySave('thailand_travel_info').catch(console.error)
            }
          ]
        );
      },
      onRetry: (error, retryCount, maxRetries) => {
        console.warn(`Save retry ${retryCount}/${maxRetries}:`, error.message);
        // Could show retry indicator in UI
      }
    }
  );

  // Handle user interaction with tracking-enabled inputs
  const handleUserInteraction = useCallback((fieldName, value) => {
    // Mark field as user-modified
    userInteractionTracker.markFieldAsModified(fieldName, value);

    // Update the appropriate state based on field name
    switch (fieldName) {
      case 'travelPurpose':
        formState.setTravelPurpose(value);
        if (value !== 'OTHER') {
          formState.setCustomTravelPurpose('');
        }
        break;
      case 'accommodationType':
        formState.setAccommodationType(value);
        if (value !== 'OTHER') {
          formState.setCustomAccommodationType('');
        }
        break;
      case 'boardingCountry':
        formState.setBoardingCountry(value);
        break;
      default:
        console.warn(`Unknown field for user interaction: ${fieldName}`);
    }

    // Trigger debounced save
    debouncedSaveData();
  }, [userInteractionTracker, debouncedSaveData, formState]);

  const handleFieldBlur = async (fieldName, fieldValue) => {
    try {
      // Mark field as user-modified for interaction tracking
      userInteractionTracker.markFieldAsModified(fieldName, fieldValue);

      // Track last edited field for session state
      formState.setLastEditedField(fieldName);

      // Brief highlight animation for last edited field
      if (fieldName) {
        if (window.highlightTimeout) {
          clearTimeout(window.highlightTimeout);
        }
        window.highlightTimeout = setTimeout(() => {
          formState.setLastEditedField(null);
        }, 2000);
      }

      // Use centralized validation
      const validationContext = {
        arrivalArrivalDate: formState.arrivalArrivalDate,
        residentCountry: formState.residentCountry,
        travelPurpose: formState.travelPurpose,
        accommodationType: formState.accommodationType,
        isTransitPassenger: formState.isTransitPassenger
      };

      const { isValid, isWarning, errorMessage } = validateField(fieldName, fieldValue, validationContext);

      // Handle province auto-correction for China
      if (fieldName === 'cityOfResidence' && formState.residentCountry === 'CHN' && fieldValue) {
        const provinceMatch = findChinaProvince(fieldValue.trim());
        if (provinceMatch && provinceMatch.displayName.toUpperCase() !== formState.cityOfResidence) {
          formState.setCityOfResidence(provinceMatch.displayName.toUpperCase());
        }
      }

      // Update errors and warnings state
      formState.setErrors(prev => ({
        ...prev,
        [fieldName]: isValid ? '' : (isWarning ? '' : errorMessage)
      }));

      formState.setWarnings(prev => ({
        ...prev,
        [fieldName]: isWarning ? errorMessage : ''
      }));

      // Save data if valid (including warnings)
      if (isValid) {
        try {
          const immediateSaveFields = ['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate', 'recentStayCountry'];
          if (immediateSaveFields.includes(fieldName)) {
            await saveDataToSecureStorageWithOverride({ [fieldName]: fieldValue });
            formState.setLastEditedAt(new Date());
          } else {
            debouncedSaveData();
          }
        } catch (saveError) {
          console.error('Failed to trigger save:', saveError);
        }
      }
    } catch (error) {
      console.error('Failed to validate and save field:', error);
    }
  };

  // Re-validate residence field whenever the selected country changes
  useEffect(() => {
    if (!residentCountry) return;
    handleFieldBlur('cityOfResidence', cityOfResidence);
  }, [residentCountry]);

  const resetDistrictSelection = useCallback(() => {
    formState.setDistrict('');
    formState.setDistrictId(null);
    formState.setSubDistrict('');
    formState.setSubDistrictId(null);
    formState.setPostalCode('');
  }, [formState]);

  const handleProvinceSelect = useCallback((code) => {
    formState.setProvince(code);
    resetDistrictSelection();

    handleFieldBlur('province', code);

    if (formState.district) {
      handleFieldBlur('district', '');
    }
    if (formState.subDistrict) {
      handleFieldBlur('subDistrict', '');
    }
    if (formState.postalCode) {
      handleFieldBlur('postalCode', '');
    }
  }, [handleFieldBlur, resetDistrictSelection, formState]);

  const handleDistrictSelect = useCallback((selection) => {
    if (!selection) return;

    formState.setDistrict(selection.nameEn);
    formState.setDistrictId(selection.id);
    handleFieldBlur('district', selection.nameEn);

    if (formState.subDistrict) {
      formState.setSubDistrict('');
      formState.setSubDistrictId(null);
      handleFieldBlur('subDistrict', '');
    }

    if (formState.postalCode) {
      formState.setPostalCode('');
      handleFieldBlur('postalCode', '');
    }
  }, [handleFieldBlur, formState]);

  const handleSubDistrictSelect = useCallback((selection) => {
    if (!selection) return;

    formState.setSubDistrict(selection.nameEn);
    formState.setSubDistrictId(selection.id);
    handleFieldBlur('subDistrict', selection.nameEn);

    const newPostalCode = selection.postalCode ? String(selection.postalCode) : '';
    if (newPostalCode || formState.postalCode) {
      formState.setPostalCode(newPostalCode);
      handleFieldBlur('postalCode', newPostalCode);
    }
  }, [handleFieldBlur, formState]);

// Helper method to perform the actual save operation
const performSaveOperation = async (userId, fieldOverrides, saveResults, saveErrors, currentState) => {
  try {
    const {
      passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
      phoneCode, phoneNumber, email, occupation, cityOfResidence, residentCountry,
      travelPurpose, customTravelPurpose, boardingCountry, recentStayCountry, visaNumber,
      arrivalFlightNumber, arrivalArrivalDate, departureFlightNumber, departureDepartureDate,
      isTransitPassenger, accommodationType, customAccommodationType, province, district,
      subDistrict, postalCode, hotelAddress, existingPassport, interactionState, destination,
      flightTicketPhoto, hotelReservationPhoto,
      // Entry info tracking
      entryInfoId, passportData, personalInfoData, funds
    } = currentState;

    // Helper function to get current value with overrides
    const getCurrentValue = (fieldName, currentValue) => {
      return fieldOverrides[fieldName] !== undefined ? fieldOverrides[fieldName] : currentValue;
    };

    // Save passport data - filter based on user interaction
    const allPassportFields = {
      passportNumber: getCurrentValue('passportNo', passportNo),
      fullName: [getCurrentValue('surname', surname), getCurrentValue('middleName', middleName), getCurrentValue('givenName', givenName)].filter(Boolean).join(', '),
      nationality: getCurrentValue('nationality', nationality),
      dateOfBirth: getCurrentValue('dob', dob),
      expiryDate: getCurrentValue('expiryDate', expiryDate),
      gender: getCurrentValue('sex', sex)
    };

    // Use FieldStateManager to filter only user-modified fields
    const passportUpdates = FieldStateManager.filterSaveableFields(
      allPassportFields,
      interactionState,
      {
        preserveExisting: true, // Preserve existing data for backward compatibility
        alwaysSaveFields: [] // No fields are always saved for passport
      }
    );

    if (Object.keys(passportUpdates).length > 0) {
      try {
        console.log('Saving passport updates:', passportUpdates);
        if (existingPassport && existingPassport.id) {
          console.log('Updating existing passport with ID:', existingPassport.id);
          const updated = await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
          console.log('Passport data updated successfully');

          // Update passportData state to track the correct passport ID
          formState.setPassportData(updated);
          saveResults.passport.success = true;
        } else {
          console.log('Creating new passport for userId:', userId);
          const saved = await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
          console.log('Passport data saved successfully');

          // Update passportData state to track the new passport ID
          formState.setPassportData(saved);
          saveResults.passport.success = true;
        }
      } catch (passportError) {
        console.error('Failed to save passport data:', passportError);
        saveResults.passport.error = passportError;
        saveErrors.push({ section: 'passport', error: passportError });

        // Don't throw immediately - try to save other sections
      }
    } else {
      saveResults.passport.success = true; // No data to save counts as success
    }

    // Save personal info data - filter based on user interaction
    const allPersonalInfoFields = {
      phoneCode: getCurrentValue('phoneCode', phoneCode),
      phoneNumber: getCurrentValue('phoneNumber', phoneNumber),
      email: getCurrentValue('email', email),
      occupation: getCurrentValue('occupation', occupation),
      provinceCity: getCurrentValue('cityOfResidence', cityOfResidence),
      countryRegion: getCurrentValue('residentCountry', residentCountry)
      // NOTE: gender removed from personalInfo - stored in passport only
    };

    // Use FieldStateManager to filter only user-modified fields
    const personalInfoUpdates = FieldStateManager.filterSaveableFields(
      allPersonalInfoFields,
      interactionState,
      {
        preserveExisting: true, // Preserve existing data for backward compatibility
        alwaysSaveFields: [] // No fields are always saved for personal info
      }
    );

    // Enhanced validation - check if there are user-modified fields to save
    const hasValidData = Object.keys(personalInfoUpdates).length > 0;

    if (hasValidData) {
      try {
        console.log('Saving personal info updates:', personalInfoUpdates);
        const savedPersonalInfo = await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
        console.log('✅ Personal info saved successfully');

        // Update personalInfoData state
        formState.setPersonalInfoData(savedPersonalInfo);
        saveResults.personalInfo.success = true;

        // Verify the save worked
        console.log('=== 🔍 SAVE VERIFICATION ===');
        const verifyData = await UserDataService.getPersonalInfo(userId);
        console.log('Verification - loaded from database:', verifyData);

        if (verifyData) {
          console.log('✅ Save verification successful');
        } else {
          console.error('❌ Save verification failed - no data returned');
          // This is a warning, not a failure
        }

      } catch (saveError) {
        console.error('❌ Failed to save personal info:', saveError);
        console.error('Error details:', saveError.message, saveError.stack);
        saveResults.personalInfo.error = saveError;
        saveErrors.push({ section: 'personalInfo', error: saveError });

        // Don't throw immediately - try to save other sections
      }
    } else {
      console.log('⚠️ No personal info fields to save - all fields are empty or invalid');
      saveResults.personalInfo.success = true; // No data to save counts as success

      // Log which fields are empty for debugging
      console.log('Empty field analysis:');
      console.log('- phoneCode:', phoneCode, 'Valid:', !!(phoneCode && phoneCode.trim()));
      console.log('- phoneNumber:', phoneNumber, 'Valid:', !!(phoneNumber && phoneNumber.trim()));
      console.log('- email:', email, 'Valid:', !!(email && email.trim()));
      console.log('- occupation:', occupation, 'Valid:', !!(occupation && occupation.trim()));
      console.log('- cityOfResidence:', cityOfResidence, 'Valid:', !!(cityOfResidence && cityOfResidence.trim()));
      console.log('- residentCountry:', residentCountry, 'Valid:', !!(residentCountry && residentCountry.trim()));
      console.log('- sex:', sex, 'Valid:', !!(sex && sex.trim()));
    }

    // Save travel info data - filter based on user interaction
    const destinationId = destination?.id || 'thailand';

    // Get current values with overrides applied for travel info
    const currentTravelPurpose = getCurrentValue('travelPurpose', travelPurpose);
    const currentCustomTravelPurpose = getCurrentValue('customTravelPurpose', customTravelPurpose);
    const currentBoardingCountry = getCurrentValue('boardingCountry', boardingCountry);
    const currentRecentStayCountry = getCurrentValue('recentStayCountry', recentStayCountry);
    const currentVisaNumber = getCurrentValue('visaNumber', visaNumber);
    const currentArrivalFlightNumber = getCurrentValue('arrivalFlightNumber', arrivalFlightNumber);
    const currentArrivalArrivalDate = getCurrentValue('arrivalArrivalDate', arrivalArrivalDate);
    const currentDepartureFlightNumber = getCurrentValue('departureFlightNumber', departureFlightNumber);
    const currentDepartureDepartureDate = getCurrentValue('departureDepartureDate', departureDepartureDate);
    const currentIsTransitPassenger = getCurrentValue('isTransitPassenger', isTransitPassenger);
    const currentAccommodationType = getCurrentValue('accommodationType', accommodationType);
    const currentCustomAccommodationType = getCurrentValue('customAccommodationType', customAccommodationType);
    const currentProvince = getCurrentValue('province', province);
    const currentDistrict = getCurrentValue('district', district);
    const currentSubDistrict = getCurrentValue('subDistrict', subDistrict);
    const currentPostalCode = getCurrentValue('postalCode', postalCode);
    const currentHotelAddress = getCurrentValue('hotelAddress', hotelAddress);

    // Build travel purpose (handle custom purpose)
    const finalTravelPurpose = currentTravelPurpose === 'OTHER' ? currentCustomTravelPurpose : currentTravelPurpose;

    // Build accommodation type (handle custom type)
    const finalAccommodationType = currentAccommodationType === 'OTHER' ? currentCustomAccommodationType : currentAccommodationType;

    const allTravelInfoFields = {
      travelPurpose: finalTravelPurpose,
      boardingCountry: currentBoardingCountry,
      recentStayCountry: currentRecentStayCountry,
      visaNumber: currentVisaNumber,
      arrivalFlightNumber: currentArrivalFlightNumber,
      arrivalArrivalDate: currentArrivalArrivalDate,
      departureFlightNumber: currentDepartureFlightNumber,
      departureDepartureDate: currentDepartureDepartureDate,
      isTransitPassenger: currentIsTransitPassenger,
      accommodationType: finalAccommodationType,
      province: currentProvince,
      district: currentDistrict,
      subDistrict: currentSubDistrict,
      postalCode: currentPostalCode,
      hotelAddress: currentHotelAddress,
      flightTicketPhoto: getCurrentValue('flightTicketPhoto', flightTicketPhoto),
      hotelReservationPhoto: getCurrentValue('hotelReservationPhoto', hotelReservationPhoto)
    };

    // Use FieldStateManager to filter only user-modified fields
    const travelInfoUpdates = FieldStateManager.filterSaveableFields(
      allTravelInfoFields,
      interactionState,
      {
        preserveExisting: true, // Preserve existing data for backward compatibility
        alwaysSaveFields: [] // No fields are always saved for travel info
      }
    );

    // Save travel info if there are fields to update
    if (Object.keys(travelInfoUpdates).length > 0) {
      try {
        console.log('Saving travel info updates:', travelInfoUpdates);
        // Add destination to the travel data object
        const travelDataWithDestination = {
          ...travelInfoUpdates,
          destination: destinationId
        };

        const savedTravelInfo = await UserDataService.saveTravelInfo(userId, travelDataWithDestination);
        console.log('✅ Travel info saved successfully');
        saveResults.travelInfo.success = true;

        // Verify the save worked
        console.log('=== 🔍 TRAVEL INFO SAVE VERIFICATION ===');
        const verifyTravelData = await UserDataService.getTravelInfo(userId, destinationId);
        console.log('Verification - loaded travel info from database:', verifyTravelData);

        if (verifyTravelData) {
          console.log('✅ Travel info save verification successful');
        } else {
          console.error('❌ Travel info save verification failed - no data returned');
          // This is a warning, not a failure
        }

      } catch (travelSaveError) {
        console.error('❌ Failed to save travel info:', travelSaveError);
        console.error('Error details:', travelSaveError.message, travelSaveError.stack);
        saveResults.travelInfo.error = travelSaveError;
        saveErrors.push({ section: 'travelInfo', error: travelSaveError });

        // Don't throw immediately - continue to error handling
      }
    } else {
      console.log('⚠️ No travel info fields to save - all fields are empty or invalid');
      saveResults.travelInfo.success = true; // No data to save counts as success
    }

    // Save entry_info with linked fund items if entry_info is initialized
    if (entryInfoId) {
      try {
        console.log('📦 Updating entry info with fund items...');

        // Get the latest passport and personal info from database
        // This ensures we have the correct IDs even if they were just created
        const latestPassport = await UserDataService.getPassport(userId);
        const latestPersonalInfo = await UserDataService.getPersonalInfo(userId);

        // Get travel_info_id if it was just saved
        const destinationId = destination?.id || 'thailand';
        const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

        // Allow entry_info update even without passport (passport can be added later)
        console.log('Passport lookup result:', latestPassport ? `Found passport ${latestPassport.id}` : 'No passport found - proceeding with null passport_id');

        const entryInfoUpdateData = {
          id: entryInfoId,
          userId,
          passportId: latestPassport?.id || null, // Nullable - can be null initially
          personalInfoId: latestPersonalInfo?.id || null,
          travelInfoId: travelInfo?.id || null,
          destinationId,
          status: 'incomplete', // Will be updated to 'ready' when all fields are complete
          fundItemIds: funds.map(f => f.id), // Link all current fund items
          lastUpdatedAt: new Date().toISOString()
        };

        console.log('Entry info update data:', {
          entryInfoId,
          passportId: latestPassport?.id || 'NULL',
          personalInfoId: latestPersonalInfo?.id || 'NULL',
          travelInfoId: travelInfo?.id || 'NULL',
          fundItemCount: funds.length,
          fundItemIds: funds.map(f => f.id)
        });

        await UserDataService.saveEntryInfo(entryInfoUpdateData, userId);
        console.log('✅ Entry info updated successfully with fund items');
        saveResults.entryInfo = { success: true, error: null };
      } catch (entryInfoError) {
        console.error('❌ Failed to save entry info:', entryInfoError);
        console.error('Error details:', entryInfoError.message, entryInfoError.stack);
        saveResults.entryInfo = { success: false, error: entryInfoError };
        saveErrors.push({ section: 'entryInfo', error: entryInfoError });
        // Don't fail the entire save operation if entry_info update fails
      }
    } else {
      console.log('⚠️ Skipping entry info save - entry info not initialized');
      console.log('  - entryInfoId:', entryInfoId);
    }

    return { success: true };
  } catch (error) {
    console.error('Save operation failed:', error);
    return { success: false, error };
  }
};

// Enhanced debug logging for personal info saving with user interaction filtering
const saveDataToSecureStorageWithOverride = async (fieldOverrides = {}) => {
  const saveErrors = [];
  const saveResults = {
    passport: { success: false, error: null },
    personalInfo: { success: false, error: null },
    travelInfo: { success: false, error: null }
  };

  try {
    const userId = passport?.id || 'user_001';
    console.log('=== 🔍 PERSONAL INFO SAVE DEBUG WITH INTERACTION FILTERING ===');
    console.log('userId:', userId);
    console.log('fieldOverrides:', fieldOverrides);

    // Get current interaction state
    const interactionState = {};
    const allFieldNames = [
      'passportNo', 'fullName', 'nationality', 'dob', 'expiryDate', 'sex',
      'phoneCode', 'phoneNumber', 'email', 'occupation', 'cityOfResidence', 'residentCountry',
      'travelPurpose', 'customTravelPurpose', 'boardingCountry', 'recentStayCountry', 'visaNumber',
      'arrivalFlightNumber', 'arrivalArrivalDate', 'departureFlightNumber', 'departureDepartureDate',
      'isTransitPassenger', 'accommodationType', 'customAccommodationType', 'province', 'district',
      'subDistrict', 'postalCode', 'hotelAddress'
    ];

    // Build interaction state for FieldStateManager
    allFieldNames.forEach(fieldName => {
      interactionState[fieldName] = {
        isUserModified: userInteractionTracker.isFieldUserModified(fieldName),
        lastModified: userInteractionTracker.getFieldInteractionDetails(fieldName)?.lastModified || null,
        initialValue: userInteractionTracker.getFieldInteractionDetails(fieldName)?.initialValue || null
      };
    });

    console.log('User interaction state:', interactionState);
    console.log('Modified fields:', userInteractionTracker.getModifiedFields());

    // Log current UI state values
    console.log('Current UI state:');
    console.log('- phoneCode:', formState.phoneCode);
    console.log('- phoneNumber:', formState.phoneNumber);
    console.log('- email:', formState.email);
    console.log('- occupation:', formState.occupation);
    console.log('- cityOfResidence:', formState.cityOfResidence);
    console.log('- residentCountry:', formState.residentCountry);
    console.log('- sex:', formState.sex);

    // Get existing passport first to ensure we're updating the right one
    const existingPassport = await UserDataService.getPassport(userId);
    console.log('Existing passport:', existingPassport);

    // Prepare current state for the save operation
    // For occupation, use custom value if "OTHER" is selected
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
      // Entry info tracking
      entryInfoId: formState.entryInfoId,
      passportData: formState.passportData,
      personalInfoData: formState.personalInfoData,
      funds: formState.funds
    };

    // Perform the save operation using the helper method
    await performSaveOperation(userId, fieldOverrides, saveResults, saveErrors, currentState);

    // Handle partial save failures
    if (saveErrors.length > 0) {
       console.error('=== SAVE OPERATION COMPLETED WITH ERRORS ===');
       console.error('Save results:', saveResults);
       console.error('Errors encountered:', saveErrors);

       // Determine if this is a complete failure or partial success
       const successfulSaves = Object.values(saveResults).filter(result => result.success).length;
       const totalSaves = Object.keys(saveResults).length;

       if (successfulSaves === 0) {
         // Complete failure - check for SQLite errors and provide recovery
         const firstError = saveErrors[0];
         const isSQLiteError = firstError.error.code === 'ERR_INTERNAL_SQLITE_ERROR' ||
                              firstError.error.message.includes('SQLite') ||
                              firstError.error.message.includes('database');

         if (isSQLiteError) {
           console.error('SQLite error detected. Attempting recovery...');

           // For SQLite errors, try to recover by clearing problematic data
             if (firstError.section === 'travelInfo') {
               console.log('Attempting to clear travel info and retry...');
               try {
                 // Clear travel info for this user and destination
                 await UserDataService.clearTravelInfo(userId, destination?.id || 'thailand');
                 console.log('Cleared travel info. Retrying save...');
  
                 // Prepare current state for retry
                 // For occupation, use custom value if "OTHER" is selected
                 const finalOccupation = occupation === 'OTHER' ? customOccupation : occupation;

                 const currentState = {
                   passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
                   phoneCode, phoneNumber, email, occupation: finalOccupation, cityOfResidence, residentCountry,
                   travelPurpose, customTravelPurpose, boardingCountry, recentStayCountry, visaNumber,
                   arrivalFlightNumber, arrivalArrivalDate, departureFlightNumber, departureDepartureDate,
                   isTransitPassenger, accommodationType, customAccommodationType, province, district,
                   subDistrict, postalCode, hotelAddress, existingPassport, interactionState, destination,
                   flightTicketPhoto, hotelReservationPhoto,
                   // Entry info tracking
                   entryInfoId, passportData, personalInfoData, funds
                 };
  
                 // Retry the save operation once
                 const retryResult = await performSaveOperation(userId, fieldOverrides, saveResults, saveErrors, currentState);
                 if (retryResult.success) {
                   console.log('✅ Recovery successful: Save completed after clearing data');
                   return;
                 }
               } catch (recoveryError) {
                 console.error('❌ Recovery failed:', recoveryError);
               }
             }

           // If recovery failed or not applicable, throw with helpful message
           throw new Error(`Database error: ${firstError.error.message}. Please try restarting the app or clearing data.`);
         } else {
           throw new Error(`Complete save failure: ${firstError.error.message}`);
         }
       } else {
         // Partial success - log warning but don't throw
         console.warn(`Partial save success: ${successfulSaves}/${totalSaves} sections saved successfully`);

         // Preserve interaction state for failed sections to prevent data loss
         saveErrors.forEach(({ section, error }) => {
           console.warn(`Failed to save ${section}, interaction state preserved:`, error.message);
         });
       }
     } else {
       console.log('✅ All save operations completed successfully');
     }

  } catch (error) {
    console.error('Failed to save data to secure storage:', error);
    
    // Preserve interaction state on complete failure
    console.warn('Preserving interaction state due to save failure');
    
    throw error; // Re-throw to allow caller to handle
  }
};


  // Save all data to secure storage
  const saveDataToSecureStorage = async () => {
    return saveDataToSecureStorageWithOverride();
  };

const normalizeFundItem = useCallback((item) => ({
    id: item.id,
    type: item.type || item.itemType || 'cash',
    amount: item.amount,
    currency: item.currency,
    details: item.details || item.description || '',
    photoUri: item.photoUri || item.photo || null,
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

  /**
    * Initialize or load entry_info for this user and destination
    * Creates entry_info on first visit to ensure data is properly tracked
    * Now allows creation without passport (passport can be added later)
    */
   const initializeEntryInfo = useCallback(async () => {
     try {
       if (entryInfoInitialized) {
         console.log('Entry info already initialized');
         return;
       }

       const destinationId = destination?.id || 'thailand';
       console.log('🔍 Initializing entry info for destination:', destinationId);

       // Try to find existing entry_info for this user and destination
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
       const passport = await UserDataService.getPassport(userId);
       console.log('Passport lookup result:', passport ? `Found passport ${passport.id}` : 'No passport found');

       // Create new entry_info even without passport (passport can be added later)
       console.log('📝 Creating new entry info for user:', userId, '(passport optional)');
       const entryInfoData = {
         userId,
         passportId: passport?.id || null, // Nullable - can be null initially
         destinationId,
         status: 'incomplete',
         completionMetrics: {
           passport: { complete: 0, total: 5, state: 'missing' },
           personalInfo: { complete: 0, total: 6, state: 'missing' },
           funds: { complete: 0, total: 1, state: 'missing' },
           travel: { complete: 0, total: 6, state: 'missing' }
         },
         fundItemIds: [], // Will be updated when saving
         lastUpdatedAt: new Date().toISOString()
       };

       const savedEntryInfo = await UserDataService.saveEntryInfo(entryInfoData, userId);
       console.log('✅ Created new entry info:', savedEntryInfo.id, '(passport_id:', savedEntryInfo.passportId || 'NULL', ')');

       formState.setEntryInfoId(savedEntryInfo.id);
       formState.setEntryInfoInitialized(true);
       return savedEntryInfo.id;
     } catch (error) {
       console.error('❌ Failed to initialize entry info:', error);
       console.error('Error details:', error.message, error.stack);
       // Don't throw - allow the app to continue even if entry_info creation fails
       return null;
     }
   }, [userId, destination, entryInfoInitialized]);

  // Handle flight ticket photo upload
  const handleFlightTicketPhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        formState.setFlightTicketPhoto(photoUri);

        // Save to secure storage
        try {
          await saveDataToSecureStorageWithOverride({
            flightTicketPhoto: photoUri
          });
          Alert.alert(
            t('thailand.travelInfo.uploadSuccess', { defaultValue: '上传成功' }),
            t('thailand.travelInfo.flightTicketUploaded', { defaultValue: '机票照片已上传' })
          );
        } catch (error) {
          console.error('Failed to save flight ticket photo:', error);
          Alert.alert(
            t('thailand.travelInfo.uploadError', { defaultValue: '上传失败' }),
            t('thailand.travelInfo.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
          );
        }
      }
    } catch (error) {
      console.error('Error picking flight ticket photo:', error);
      Alert.alert(
        t('thailand.travelInfo.uploadError', { defaultValue: '上传失败' }),
        t('thailand.travelInfo.uploadErrorMessage', { defaultValue: '选择照片失败，请重试' })
      );
    }
  };

  // Handle hotel reservation photo upload
  const handleHotelReservationPhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        formState.setHotelReservationPhoto(photoUri);

        // Save to secure storage
        try {
          await saveDataToSecureStorageWithOverride({
            hotelReservationPhoto: photoUri
          });
          Alert.alert(
            t('thailand.travelInfo.uploadSuccess', { defaultValue: '上传成功' }),
            t('thailand.travelInfo.hotelReservationUploaded', { defaultValue: '酒店预订照片已上传' })
          );
        } catch (error) {
          console.error('Failed to save hotel reservation photo:', error);
          Alert.alert(
            t('thailand.travelInfo.uploadError', { defaultValue: '上传失败' }),
            t('thailand.travelInfo.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
          );
        }
      }
    } catch (error) {
      console.error('Error picking hotel reservation photo:', error);
      Alert.alert(
        t('thailand.travelInfo.uploadError', { defaultValue: '上传失败' }),
        t('thailand.travelInfo.uploadErrorMessage', { defaultValue: '选择照片失败，请重试' })
      );
    }
  };

  const addFund = (type) => {
    formState.setCurrentFundItem(null);
    formState.setNewFundItemType(type);
    formState.setFundItemModalVisible(true);
  };

  const handleFundItemPress = (fund) => {
    formState.setCurrentFundItem(fund);
    formState.setFundItemModalVisible(true);
  };

  const handleFundItemModalClose = () => {
    formState.setFundItemModalVisible(false);
    formState.setCurrentFundItem(null);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      if (updatedItem) {
        formState.setSelectedFundItem(normalizeFundItem(updatedItem));
      }
      await refreshFundItems({ forceRefresh: true });

      // Trigger save to update entry_info with new fund item associations
      console.log('💾 Triggering save after fund item update...');
      await DebouncedSave.flushPendingSave('thailand_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Failed to update fund item state:', error);
    }
  };

  const handleFundItemCreate = async () => {
    try {
      await refreshFundItems({ forceRefresh: true });

      // Trigger save to update entry_info with new fund item
      console.log('💾 Triggering save after fund item creation...');
      await DebouncedSave.flushPendingSave('thailand_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Failed to refresh fund items after creation:', error);
    } finally {
      handleFundItemModalClose();
    }
  };

  const handleFundItemDelete = async (id) => {
    try {
      formState.setFunds((prev) => prev.filter((fund) => fund.id !== id));
      await refreshFundItems({ forceRefresh: true });

      // Trigger save to update entry_info after fund item deletion
      console.log('💾 Triggering save after fund item deletion...');
      await DebouncedSave.flushPendingSave('thailand_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Failed to refresh fund items after deletion:', error);
    } finally {
      handleFundItemModalClose();
    }
  };


  const validate = () => {
    // Disable all required checks to support progressive entry info filling
    formState.setErrors({});
    return true;
  };

  const handleContinue = async () => {
    await handleNavigationWithSave(
      () => navigation.navigate('ThailandEntryFlow', {
        passport,
        destination,
        entryInfoId: entryInfoId // Pass entryInfoId for viewing entry pack details
      }),
      'continue'
    );
  };

  const handleGoBack = async () => {
    await handleNavigationWithSave(
      () => navigation.goBack(),
      'go back'
    );
  };

  



  const renderGenderOptions = () => {
    const options = [
      { value: 'Female', label: t('thailand.travelInfo.fields.sex.options.female', { defaultValue: '女性' }) },
      { value: 'Male', label: t('thailand.travelInfo.fields.sex.options.male', { defaultValue: '男性' }) },
      { value: 'Undefined', label: t('thailand.travelInfo.fields.sex.options.undefined', { defaultValue: '未定义' }) }
    ];

    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isActive = formState.sex === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                isActive && styles.optionButtonActive,
              ]}
              onPress={async () => {
                const newSex = option.value;
                formState.setSex(newSex);
                // Save immediately to ensure gender is saved without requiring other field interaction
                try {
                  await saveDataToSecureStorageWithOverride({ sex: newSex });
                  formState.setLastEditedAt(new Date());
                } catch (error) {
                  console.error('Failed to save gender:', error);
                }
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  isActive && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('thailand.travelInfo.headerTitle', { defaultValue: '泰国入境信息' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('thailand.travelInfo.loading', { defaultValue: '正在加载数据...' })}</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={(event) => {
          const currentScrollPosition = event.nativeEvent.contentOffset.y;
          formState.setScrollPosition(currentScrollPosition);
        }}
        scrollEventThrottle={100}
      >
        {/* Enhanced Hero Section for Border Crossing Beginners */}
        <LinearGradient
          colors={['#1a3568', '#102347']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroFlag}>🇹🇭</Text>
            <View style={styles.heroHeading}>
              <Text style={styles.heroTitle}>泰国入境准备指南</Text>
              <Text style={styles.heroSubtitle}>别担心，我们来帮你！</Text>
            </View>

            {/* Beginner-Friendly Value Proposition */}
            <View style={styles.valueProposition}>
              <View style={styles.valueItem}>
                <Text style={styles.valueIcon}>⏱️</Text>
                <Text style={styles.valueText}>3分钟完成</Text>
              </View>
              <View style={styles.valueItem}>
                <Text style={styles.valueIcon}>🔒</Text>
                <Text style={styles.valueText}>100%隐私保护</Text>
              </View>
              <View style={styles.valueItem}>
                <Text style={styles.valueIcon}>🎯</Text>
                <Text style={styles.valueText}>避免通关延误</Text>
              </View>
            </View>

            <View style={styles.beginnerTip}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                第一次过泰国海关？我们会一步步教你准备所有必需文件，确保顺利通关！
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Progress Overview Card */}
        <View style={styles.progressOverviewCard}>
          <Text style={styles.progressTitle}>准备进度</Text>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, totalCompletionPercent >= 25 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>👤</Text>
              <Text style={[styles.stepText, totalCompletionPercent >= 25 && styles.stepTextActive]}>
                护照信息 {totalCompletionPercent >= 25 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.progressStep, totalCompletionPercent >= 50 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>✈️</Text>
              <Text style={[styles.stepText, totalCompletionPercent >= 50 && styles.stepTextActive]}>
                旅行信息 {totalCompletionPercent >= 50 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.progressStep, totalCompletionPercent >= 75 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>🏨</Text>
              <Text style={[styles.stepText, totalCompletionPercent >= 75 && styles.stepTextActive]}>
                住宿信息 {totalCompletionPercent >= 75 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.progressStep, totalCompletionPercent >= 100 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>💰</Text>
              <Text style={[styles.stepText, totalCompletionPercent >= 100 && styles.stepTextActive]}>
                资金证明 {totalCompletionPercent >= 100 ? '✓' : ''}
              </Text>
            </View>
          </View>
        </View>
          
          {/* Enhanced Save Status Indicator */}
          {saveStatus && (
            <View style={[styles.saveStatusBar, styles[`saveStatus${saveStatus.charAt(0).toUpperCase() + saveStatus.slice(1)}`]]}>
              <Text style={styles.saveStatusIcon}>
                {saveStatus === 'pending' && '⏳'}
                {saveStatus === 'saving' && '💾'}
                {saveStatus === 'saved' && '✅'}
                {saveStatus === 'error' && '❌'}
              </Text>
              <Text style={styles.saveStatusText}>
                {saveStatus === 'pending' && t('thailand.travelInfo.saveStatus.pending', { defaultValue: '等待保存...' })}
                {saveStatus === 'saving' && t('thailand.travelInfo.saveStatus.saving', { defaultValue: '正在保存...' })}
                {saveStatus === 'saved' && t('thailand.travelInfo.saveStatus.saved', { defaultValue: '已保存' })}
                {saveStatus === 'error' && t('thailand.travelInfo.saveStatus.error', { defaultValue: '保存失败' })}
              </Text>
              {saveStatus === 'error' && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    formState.setSaveStatus('saving');
                    debouncedSaveData();
                  }}
                >
                  <Text style={styles.retryButtonText}>
                    {t('thailand.travelInfo.saveStatus.retry', { defaultValue: '重试' })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {/* Last Edited Timestamp */}
          {lastEditedAt && (
            <Text style={styles.lastEditedText}>
              {t('thailand.travelInfo.lastEdited', { 
                defaultValue: 'Last edited: {{time}}',
                time: lastEditedAt.toLocaleTimeString()
              })}
            </Text>
          )}

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('thailand.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        {/* Passport Information Section */}
        <PassportSection
          t={t}
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
          // Form state
          surname={formState.surname}
          middleName={formState.middleName}
          givenName={formState.givenName}
          nationality={formState.nationality}
          passportNo={formState.passportNo}
          visaNumber={formState.visaNumber}
          dob={formState.dob}
          expiryDate={formState.expiryDate}
          sex={formState.sex}
          // Setters
          setSurname={formState.setSurname}
          setMiddleName={formState.setMiddleName}
          setGivenName={formState.setGivenName}
          setNationality={formState.setNationality}
          setPassportNo={formState.setPassportNo}
          setVisaNumber={formState.setVisaNumber}
          setDob={formState.setDob}
          setExpiryDate={formState.setExpiryDate}
          setSex={formState.setSex}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
          setLastEditedAt={formState.setLastEditedAt}
          // Styles
          styles={styles}
        />

        {/* Personal Information Section */}
        <PersonalInfoSection
          t={t}
          isExpanded={formState.expandedSection === 'personal'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
          // Form state
          occupation={formState.occupation}
          customOccupation={formState.customOccupation}
          cityOfResidence={formState.cityOfResidence}
          residentCountry={formState.residentCountry}
          phoneCode={formState.phoneCode}
          phoneNumber={formState.phoneNumber}
          email={formState.email}
          // Computed values
          cityOfResidenceLabel={formState.residentCountry === 'CHN' ? '省份' : '居住城市'}
          cityOfResidenceHelpText={formState.residentCountry === 'CHN' ? '请选择您居住的省份' : '请输入您居住的城市'}
          cityOfResidencePlaceholder={formState.residentCountry === 'CHN' ? '例如：BEIJING, SHANGHAI' : '例如：NEW YORK, LONDON'}
          // Setters
          setOccupation={formState.setOccupation}
          setCustomOccupation={formState.setCustomOccupation}
          setCityOfResidence={formState.setCityOfResidence}
          setResidentCountry={formState.setResidentCountry}
          setPhoneCode={formState.setPhoneCode}
          setPhoneNumber={formState.setPhoneNumber}
          setEmail={formState.setEmail}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          // Styles
          styles={styles}
        />

        {/* Funds Section */}
        <FundsSection
          t={t}
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
          // Form state
          funds={formState.funds}
          // Actions
          addFund={addFund}
          handleFundItemPress={handleFundItemPress}
          // Styles
          styles={styles}
        />

        {/* Travel Details Section */}
        <TravelDetailsSection
          t={t}
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
          // Form state - Travel purpose
          travelPurpose={formState.travelPurpose}
          customTravelPurpose={formState.customTravelPurpose}
          recentStayCountry={formState.recentStayCountry}
          boardingCountry={formState.boardingCountry}
          // Form state - Arrival
          arrivalFlightNumber={formState.arrivalFlightNumber}
          arrivalArrivalDate={formState.arrivalArrivalDate}
          flightTicketPhoto={formState.flightTicketPhoto}
          // Form state - Departure
          departureFlightNumber={formState.departureFlightNumber}
          departureDepartureDate={formState.departureDepartureDate}
          // Form state - Accommodation
          isTransitPassenger={formState.isTransitPassenger}
          accommodationType={formState.accommodationType}
          customAccommodationType={formState.customAccommodationType}
          province={formState.province}
          district={formState.district}
          districtId={formState.districtId}
          subDistrict={formState.subDistrict}
          subDistrictId={formState.subDistrictId}
          postalCode={formState.postalCode}
          hotelAddress={formState.hotelAddress}
          hotelReservationPhoto={formState.hotelReservationPhoto}
          // Setters
          setTravelPurpose={formState.setTravelPurpose}
          setCustomTravelPurpose={formState.setCustomTravelPurpose}
          setRecentStayCountry={formState.setRecentStayCountry}
          setBoardingCountry={formState.setBoardingCountry}
          setArrivalFlightNumber={formState.setArrivalFlightNumber}
          setArrivalArrivalDate={formState.setArrivalArrivalDate}
          setDepartureFlightNumber={formState.setDepartureFlightNumber}
          setDepartureDepartureDate={formState.setDepartureDepartureDate}
          setIsTransitPassenger={formState.setIsTransitPassenger}
          setAccommodationType={formState.setAccommodationType}
          setCustomAccommodationType={formState.setCustomAccommodationType}
          setProvince={formState.setProvince}
          setDistrict={formState.setDistrict}
          setDistrictId={formState.setDistrictId}
          setSubDistrict={formState.setSubDistrict}
          setSubDistrictId={formState.setSubDistrictId}
          setPostalCode={formState.setPostalCode}
          setHotelAddress={formState.setHotelAddress}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
          setLastEditedAt={formState.setLastEditedAt}
          handleProvinceSelect={handleProvinceSelect}
          handleDistrictSelect={handleDistrictSelect}
          handleSubDistrictSelect={handleSubDistrictSelect}
          handleFlightTicketPhotoUpload={handleFlightTicketPhotoUpload}
          handleHotelReservationPhotoUpload={handleHotelReservationPhotoUpload}
          // Styles
          styles={styles}
        />


        <View style={styles.buttonContainer}>
          {/* Enhanced Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarEnhanced}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${totalCompletionPercent}%`,
                      backgroundColor: getProgressColor()
                    }
                  ]}
                />
                {/* Completion Badge */}
                {totalCompletionPercent >= 100 && (
                  <View style={styles.completionBadge}>
                    <Text style={styles.completionBadgeText}>泰国准备就绪！🌴</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={[styles.progressText, { color: getProgressColor() }]}>
              {getProgressText()}
            </Text>
          </View>

          {/* Smart Button with Dynamic Configuration */}
          {(() => {
            const buttonConfig = getSmartButtonConfig();
            return (
              <Button
                title={`${buttonConfig.icon} ${buttonConfig.label}`}
                onPress={handleContinue}
                variant={buttonConfig.variant}
                disabled={false}
                style={buttonConfig.style}
              />
            );
          })()}
          
          {/* Encouraging Progress Messages */}
          {totalCompletionPercent < 100 && (
            <Text style={styles.encouragingHint}>
              {totalCompletionPercent < 20
                ? '🌟 第一步，从介绍自己开始吧！'
                : totalCompletionPercent < 40
                ? '好的开始！泰国欢迎你 🌺'
                : totalCompletionPercent < 60
                ? '继续我的泰国准备之旅 🏖️'
                : '🚀 快要完成了，你的泰国之旅近在咫尺！'
              }
            </Text>
          )}

          {/* Travel-Focused Next Steps */}
          {totalCompletionPercent < 100 && (
            <Text style={styles.nextStepHint}>
              {totalCompletionPercent < 25
                ? '💡 从护照信息开始，告诉泰国你是谁'
                : totalCompletionPercent < 50
                ? '👤 填写个人信息，让泰国更了解你'
                : totalCompletionPercent < 75
                ? '💰 展示你的资金证明，泰国想确保你玩得开心'
                : totalCompletionPercent < 100
                ? '✈️ 最后一步，分享你的旅行计划吧！'
                : ''
              }
            </Text>
          )}

          {/* Cultural Tips for Border Crossing Beginners */}
          {totalCompletionPercent >= 80 && (
            <View style={styles.culturalTipsCard}>
              <Text style={styles.culturalTipsTitle}>🧡 通关小贴士</Text>
              <Text style={styles.culturalTipsText}>
                • 海关官员可能会问你来泰国的目的，保持微笑礼貌回答{'\n'}
                • 准备好返程机票证明你不会逾期停留{'\n'}
                • 保持冷静，海关检查是正常程序{'\n'}
                • 如果听不懂，可以礼貌地说"Can you speak English?"
              </Text>
            </View>
          )}


        </View>
      </ScrollView>

      <FundItemDetailModal
        visible={fundItemModalVisible}
        fundItem={currentFundItem}
        createItemType={newFundItemType}
        onClose={handleFundItemModalClose}
        onUpdate={handleFundItemUpdate}
        onCreate={handleFundItemCreate}
        onDelete={handleFundItemDelete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingBottom: spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  flag: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    // Enhanced visual feedback
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  fieldCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  fieldCountBadgeComplete: {
    backgroundColor: '#d4edda', // Light green
  },
  fieldCountBadgeIncomplete: {
    backgroundColor: '#fff3cd', // Light yellow
  },
  fieldCountText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  fieldCountTextComplete: {
    color: '#155724', // Dark green
  },
  fieldCountTextIncomplete: {
    color: '#856404', // Dark yellow/orange
  },
  sectionIcon: {
    ...typography.h3,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  sectionContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 0,
  },
  dateTimeField: {
    flex: 1,
  },
  placeholderText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  progressText: {
    ...typography.body2,
    fontWeight: '600',
    textAlign: 'center',
  },
  completionHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  encouragingHint: {
    ...typography.body2,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '600',
    fontSize: 14,
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  subSectionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    margin: spacing.xs,
  },
  optionButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    ...typography.body2,
    color: colors.text,
    fontSize: 12,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  fundActions: {
    flexDirection: 'column',
    marginBottom: spacing.sm,
  },
  fundButton: {
    marginVertical: spacing.xs,
  },
  fundEmptyState: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  fundEmptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
  fundList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  fundListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fundListItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fundListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  fundItemIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  fundItemDetails: {
    flex: 1,
  },
  fundItemTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  fundItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  fundListItemArrow: {
    ...typography.body1,
    color: colors.textSecondary,
    fontSize: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  privacyText: {
    fontSize: 12,
    color: '#34C759',
    flex: 1,
    lineHeight: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  phoneCodeInput: {
    width: '30%',
    marginRight: spacing.sm,
  },
  phoneInput: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  saveStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  saveStatusPending: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  saveStatusSaving: {
    backgroundColor: '#d1ecf1',
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  saveStatusSaved: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  saveStatusError: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  saveStatusIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  saveStatusText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  retryButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
  },
  retryButtonText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: '#e74c3c',
  },
  lastEditedText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: 11,
  },
  // New validation styles
  inputWithValidationContainer: {
    marginBottom: spacing.sm,
  },
  inputLabelContainer: {
    marginBottom: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  requirementIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },
  fieldWarningIcon: {
    fontSize: 16,
    color: '#f39c12', // Orange warning color
  },
  fieldErrorIcon: {
    fontSize: 16,
    color: '#e74c3c', // Red error color
  },
  warningText: {
    ...typography.caption,
    color: '#f39c12', // Orange warning color
    marginTop: spacing.xs,
    fontSize: 12,
    fontStyle: 'italic',
  },
  lastEditedField: {
    backgroundColor: 'rgba(52, 199, 89, 0.05)', // Very light green background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    padding: spacing.xs,
  },
  lastEditedLabel: {
    color: '#34C759', // Green color for last edited label
    fontWeight: '600',
  },
  lastEditedIndicator: {
    ...typography.caption,
    color: '#34C759',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  // New button styles for state-based buttons
  primaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  // Enhanced visual feedback styles
  sectionContainerActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBarEnhanced: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.backgroundLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    transition: 'width 0.5s ease-in-out',
  },
  completionBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completionBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  nextStepHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // New styles for beginner-friendly UX improvements
  heroSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    shadowColor: 'rgba(16, 35, 71, 0.6)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroFlag: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroHeading: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroTitle: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  valueProposition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  valueItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  valueIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  valueText: {
    ...typography.caption,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  beginnerTip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tipText: {
    ...typography.body2,
    color: colors.white,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    lineHeight: 20,
  },
  progressOverviewCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    opacity: 0.4,
  },
  progressStepActive: {
    opacity: 1,
  },
  stepIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  stepText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
  },
  stepTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  sectionIntro: {
    flexDirection: 'row',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  sectionIntroIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  sectionIntroText: {
    ...typography.body2,
    color: colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  culturalTipsCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  culturalTipsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: '#856404',
    marginBottom: spacing.sm,
  },
  culturalTipsText: {
    ...typography.caption,
    color: '#856404',
    lineHeight: 20,
  },
  requiredText: {
    ...typography.caption,
    color: '#e74c3c',
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  optionalText: {
    ...typography.caption,
    color: '#27ae60',
    fontWeight: '400',
    marginLeft: spacing.xs,
  },
  documentUploadSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  documentUploadLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  documentUploadNote: {
    ...typography.caption,
    color: '#6c757d',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  uploadButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  photoPreview: {
    marginTop: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  photoPreviewImage: {
    width: '100%',
    height: 200,
  },


 });

export default ThailandTravelInfoScreen;
