
// 入境通 - HongKong Travel Info Screen (香港入境信息)
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
import HongKongDistrictSelector from '../../components/HongKongDistrictSelector';
import SecureStorageService from '../../services/security/SecureStorageService';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import styles from './styles';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import { findChinaProvince } from '../../utils/validation/chinaProvinceValidator';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import SuggestionProviders from '../../utils/SuggestionProviders';
import FieldStateManager from '../../utils/FieldStateManager';
import { getDistrictsByProvince, getSubDistrictsByDistrictId } from '../../data/hongkongLocations';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../../services/data/UserDataService';

// Import HongKong custom hooks
import {
  useHongKongFormState,
  useHongKongDataPersistence,
  useHongKongValidation
} from '../../hooks/hongkong';

// Import HongKong section components
import {
  HeroSection,
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection
} from '../../components/hongkong/sections';

// Import HongKong-specific utilities
import { validateField } from '../../utils/thailand/ThailandValidationRules';
import { FieldWarningIcon, InputWithValidation, CollapsibleSection } from '../../components/thailand/ThailandTravelComponents';
import { parsePassportName } from '../../utils/NameParser';
import { normalizeLocationValue, findDistrictOption, findSubDistrictOption } from '../../utils/thailand/LocationHelpers';
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES, OCCUPATION_OPTIONS } from './constants';
import OptionSelector from '../../components/thailand/OptionSelector';
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const HongKongTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();
  
  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);
  
  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // Initialize form state hook - consolidates all useState declarations
  const formState = useHongKongFormState(passport);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('hongkong_travel_info');

  // Initialize persistence hook - handles data loading and saving
  const persistence = useHongKongDataPersistence({
    passport,
    destination,
    userId,
    formState,
    userInteractionTracker,
    navigation
  });

  // Initialize validation hook - handles field validation and completion tracking
  const validation = useHongKongValidation({
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
    migrateExistingDataToInteractionState,
    savePhoto,
    scrollViewRef,
    shouldRestoreScrollPosition
  } = persistence;

  // Computed values for city of residence
  const isChineseResidence = formState.residentCountry === 'CHN';
  const cityOfResidenceLabel = isChineseResidence ? '居住省份' : '居住省份 / 城市';
  const cityOfResidenceHelpText = isChineseResidence
    ? '中国地址请填写所在省份（请使用英文，例如 Anhui）'
    : '请输入您居住的省份或城市 (请使用英文)';
  const cityOfResidencePlaceholder = isChineseResidence
    ? '例如 Anhui, Guangdong'
    : '例如 Anhui, Shanghai';

  // Handle district/subdistrict ID updates (cascade logic)
  useEffect(() => {
    if (!formState.province || !formState.district) {
      if (formState.districtId !== null) {
        formState.formState.setDistrictId(null);
      }
      return;
    }

    const match = findDistrictOption(formState.province, formState.district);
    if (match && match.id !== formState.districtId) {
      formState.formState.setDistrictId(match.id);
    }
  }, [formState.province, formState.district, formState.districtId, formState]);

  useEffect(() => {
    if (!formState.districtId || !formState.subDistrict) {
      if (formState.subDistrictId !== null) {
        formState.formState.setSubDistrictId(null);
      }
      return;
    }

    const match = findSubDistrictOption(formState.districtId, formState.subDistrict);
    if (match && match.id !== formState.subDistrictId) {
      formState.formState.setSubDistrictId(match.id);
      if (!formState.postalCode && match.postalCode) {
        formState.formState.setPostalCode(String(match.postalCode));
      }
    }
  }, [formState.districtId, formState.subDistrict, formState.subDistrictId, formState.postalCode, formState]);


  // Debug function to clear user data
  const clearUserData = async () => {
    try {
      const userId = passport?.id || 'user_001';
      console.log('Clearing user data for userId:', userId);
      await SecureStorageService.clearUserData(userId);
      console.log('User data cleared successfully');
      
      // Clear local state
      formState.setDob('');
      formState.setPassportNo('');
      formState.setSurname('');
      formState.setMiddleName('');
      formState.setGivenName('');
      formState.setNationality('');
      formState.setExpiryDate('');
      formState.setSex('Male');
      
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
              const destinationId = destination?.id || 'hongkong';
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
              formState.setPassportNo(prev => passportInfo.passportNumber || prev);
              const nameToParse = passportInfo?.fullName || '';
              if (nameToParse) {
                const { surname, middleName, givenName } = parsePassportName(nameToParse);
                formState.setSurname(surname);
                formState.setMiddleName(middleName);
                formState.setGivenName(givenName);
              }
              formState.setNationality(prev => passportInfo.nationality || prev);
              formState.setDob(prev => passportInfo.dateOfBirth || prev);
              formState.setExpiryDate(prev => passportInfo.expiryDate || prev);
            }

            // Update personal info if available
            const personalInfo = userData.personalInfo;
            if (personalInfo) {
              // Handle occupation - check if it's in predefined list
              const savedOccupation = personalInfo.occupation || formState.occupation;
              const isPredefined = OCCUPATION_OPTIONS.some(opt => opt.value === savedOccupation);
              if (isPredefined) {
                formState.setOccupation(savedOccupation);
                formState.setCustomOccupation('');
              } else if (savedOccupation) {
                // Custom occupation - set to OTHER and populate custom field
                formState.setOccupation('OTHER');
                formState.setCustomOccupation(savedOccupation);
              }
              formState.setCityOfResidence(personalInfo.provinceCity || formState.cityOfResidence);
              formState.setResidentCountry(personalInfo.countryRegion || formState.residentCountry);
              formState.setPhoneNumber(personalInfo.phoneNumber || formState.phoneNumber);
              formState.setEmail(personalInfo.email || formState.email);
              formState.setPhoneCode(personalInfo.phoneCode || formState.phoneCode || getPhoneCode(personalInfo.countryRegion || passportInfo?.nationality || passport?.nationality || ''));
            }

            // Gender - load from passport only (single source of truth)
            formState.setSex(passportInfo?.gender || passport?.sex || passport?.gender || formState.sex);

            await refreshFundItems({ forceRefresh: true });

            // Reload travel info data as well
            try {
              const destinationId = destination?.id || 'hongkong';
              const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
              
              if (travelInfo) {
                console.log('=== RELOADING TRAVEL INFO ON FOCUS ===');
                console.log('travelInfo.departureDepartureDate:', travelInfo.departureDepartureDate);
                
                // Update travel info state
                const predefinedPurposes = PREDEFINED_TRAVEL_PURPOSES;
                const loadedPurpose = travelInfo.travelPurpose || 'HOLIDAY';
                if (predefinedPurposes.includes(loadedPurpose)) {
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
                formState.setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
                formState.setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
                formState.setIsTransitPassenger(travelInfo.isTransitPassenger || false);
                
                // Load accommodation type
                const predefinedAccommodationTypes = PREDEFINED_ACCOMMODATION_TYPES;
                const loadedAccommodationType = travelInfo.accommodationType || 'HOTEL';
                if (predefinedAccommodationTypes.includes(loadedAccommodationType)) {
                  formState.setAccommodationType(loadedAccommodationType);
                  formState.setCustomAccommodationType('');
                } else {
                  formState.setAccommodationType('OTHER');
                  formState.setCustomAccommodationType(loadedAccommodationType);
                }
                formState.setProvince(travelInfo.province || '');
                formState.setDistrict(travelInfo.district || '');
                formState.setSubDistrict(travelInfo.subDistrict || '');
                formState.setPostalCode(travelInfo.postalCode || '');
                formState.setHotelAddress(travelInfo.hotelAddress || '');

                // Load document photos
                formState.setFlightTicketPhoto(travelInfo.flightTicketPhoto || null);
                formState.setHotelReservationPhoto(travelInfo.hotelReservationPhoto || null);
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
      DebouncedSave.flushPendingSave('hongkong_travel_info');
    });

    return unsubscribe;
  }, [navigation]);

  // Cleanup effect (equivalent to componentWillUnmount)
  useEffect(() => {
    return () => {
      // Save data and session state when component is unmounted
      try {
        DebouncedSave.flushPendingSave('hongkong_travel_info');
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
      const currentStatus = DebouncedSave.getSaveState('hongkong_travel_info');
      formState.setSaveStatus(currentStatus);
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
    return `session_state_hongkong_${userId}`;
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
      await DebouncedSave.flushPendingSave('hongkong_travel_info');
      
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
  const debouncedSaveData = DebouncedSave.debouncedSave(
    'hongkong_travel_info',
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
              onPress: () => DebouncedSave.retrySave('hongkong_travel_info').catch(console.error)
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
  }, [userInteractionTracker, debouncedSaveData]);

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
        arrivalArrivalDate,
        residentCountry,
        travelPurpose,
        accommodationType,
        isTransitPassenger
      };

      const { isValid, isWarning, errorMessage } = validateField(fieldName, fieldValue, validationContext);

      // Handle province auto-correction for China
      if (fieldName === 'cityOfResidence' && residentCountry === 'CHN' && fieldValue) {
        const provinceMatch = findChinaProvince(fieldValue.trim());
        if (provinceMatch && provinceMatch.displayName.toUpperCase() !== cityOfResidence) {
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
  }, []);

  const handleProvinceSelect = useCallback((code) => {
    formState.setProvince(code);
    resetDistrictSelection();

    handleFieldBlur('province', code);

    if (district) {
      handleFieldBlur('district', '');
    }
    if (subDistrict) {
      handleFieldBlur('subDistrict', '');
    }
    if (postalCode) {
      handleFieldBlur('postalCode', '');
    }
  }, [handleFieldBlur, resetDistrictSelection, district, subDistrict, postalCode]);

  const handleDistrictSelect = useCallback((selection) => {
    if (!selection) return;

    formState.setDistrict(selection.nameEn);
    formState.setDistrictId(selection.id);
    handleFieldBlur('district', selection.nameEn);

    if (subDistrict) {
      formState.setSubDistrict('');
      formState.setSubDistrictId(null);
      handleFieldBlur('subDistrict', '');
    }

    if (postalCode) {
      formState.setPostalCode('');
      handleFieldBlur('postalCode', '');
    }
  }, [handleFieldBlur, subDistrict, postalCode]);

  const handleSubDistrictSelect = useCallback((selection) => {
    if (!selection) return;

    formState.setSubDistrict(selection.nameEn);
    formState.setSubDistrictId(selection.id);
    handleFieldBlur('subDistrict', selection.nameEn);

    const newPostalCode = selection.postalCode ? String(selection.postalCode) : '';
    if (newPostalCode || postalCode) {
      formState.setPostalCode(newPostalCode);
      handleFieldBlur('postalCode', newPostalCode);
    }
  }, [handleFieldBlur, postalCode]);

  // Handler for Hong Kong district selector (region + district combined)
  const handleHongKongDistrictSelect = useCallback((selection) => {
    if (!selection) return;

    // Set region (stored in province field for compatibility)
    formState.setProvince(selection.region);
    handleFieldBlur('province', selection.region);

    // Set district
    formState.setDistrict(selection.district);
    formState.setDistrictId(selection.districtId);
    handleFieldBlur('district', selection.district);

    // Clear sub-district (Hong Kong doesn't have sub-districts)
    if (subDistrict) {
      formState.setSubDistrict('');
      formState.setSubDistrictId(null);
      handleFieldBlur('subDistrict', '');
    }

    // Clear postal code (Hong Kong doesn't use postal codes the same way)
    if (postalCode) {
      formState.setPostalCode('');
      handleFieldBlur('postalCode', '');
    }
  }, [handleFieldBlur, subDistrict, postalCode]);

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
          setPassportData(updated);
          saveResults.passport.success = true;
        } else {
          console.log('Creating new passport for userId:', userId);
          const saved = await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
          console.log('Passport data saved successfully');

          // Update passportData state to track the new passport ID
          setPassportData(saved);
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
        setPersonalInfoData(savedPersonalInfo);
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
    const destinationId = destination?.id || 'hongkong';

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
        const destinationId = destination?.id || 'hongkong';
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
          fundItemIds: formState.funds.map(f => f.id), // Link all current fund items
          lastUpdatedAt: new Date().toISOString()
        };

        console.log('Entry info update data:', {
          entryInfoId,
          passportId: latestPassport?.id || 'NULL',
          personalInfoId: latestPersonalInfo?.id || 'NULL',
          travelInfoId: travelInfo?.id || 'NULL',
          fundItemCount: formState.funds.length,
          fundItemIds: formState.funds.map(f => f.id)
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
    console.log('- phoneCode:', phoneCode);
    console.log('- phoneNumber:', phoneNumber);
    console.log('- email:', email);
    console.log('- occupation:', occupation);
    console.log('- cityOfResidence:', cityOfResidence);
    console.log('- residentCountry:', residentCountry);
    console.log('- sex:', sex);

    // Get existing passport first to ensure we're updating the right one
    const existingPassport = await UserDataService.getPassport(userId);
    console.log('Existing passport:', existingPassport);

    // Prepare current state for the save operation
    // For occupation, use custom value if "OTHER" is selected
    const finalOccupation = formState.occupation === 'OTHER' ? formState.customOccupation : formState.occupation;

    const currentState = {
      passportNo: formState.passportNo, surname: formState.surname, middleName: formState.middleName,
      givenName: formState.givenName, nationality: formState.nationality, dob: formState.dob,
      expiryDate: formState.expiryDate, sex: formState.sex,
      phoneCode: formState.phoneCode, phoneNumber: formState.phoneNumber, email: formState.email,
      occupation: finalOccupation, cityOfResidence: formState.cityOfResidence, residentCountry: formState.residentCountry,
      travelPurpose: formState.travelPurpose, customTravelPurpose: formState.customTravelPurpose,
      boardingCountry: formState.boardingCountry, recentStayCountry: formState.recentStayCountry,
      visaNumber: formState.visaNumber,
      arrivalFlightNumber: formState.arrivalFlightNumber, arrivalArrivalDate: formState.arrivalArrivalDate,
      departureFlightNumber: formState.departureFlightNumber, departureDepartureDate: formState.departureDepartureDate,
      isTransitPassenger: formState.isTransitPassenger, accommodationType: formState.accommodationType,
      customAccommodationType: formState.customAccommodationType, province: formState.province,
      district: formState.district, subDistrict: formState.subDistrict, postalCode: formState.postalCode,
      hotelAddress: formState.hotelAddress,
      existingPassport, interactionState, destination,
      flightTicketPhoto: formState.flightTicketPhoto, hotelReservationPhoto: formState.hotelReservationPhoto,
      // Entry info tracking
      entryInfoId: formState.entryInfoId, funds: formState.funds
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
                 await UserDataService.clearTravelInfo(userId, destination?.id || 'hongkong');
                 console.log('Cleared travel info. Retrying save...');
  
                 // Prepare current state for retry
                 // For occupation, use custom value if "OTHER" is selected
                 const finalOccupation = formState.occupation === 'OTHER' ? formState.customOccupation : formState.occupation;

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
  }, [userId, normalizeFundItem]);

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

       const destinationId = destination?.id || 'hongkong';
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
            t('hongkong.travelInfo.uploadSuccess', { defaultValue: '上传成功' }),
            t('hongkong.travelInfo.flightTicketUploaded', { defaultValue: '机票照片已上传' })
          );
        } catch (error) {
          console.error('Failed to save flight ticket photo:', error);
          Alert.alert(
            t('hongkong.travelInfo.uploadError', { defaultValue: '上传失败' }),
            t('hongkong.travelInfo.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
          );
        }
      }
    } catch (error) {
      console.error('Error picking flight ticket photo:', error);
      Alert.alert(
        t('hongkong.travelInfo.uploadError', { defaultValue: '上传失败' }),
        t('hongkong.travelInfo.uploadErrorMessage', { defaultValue: '选择照片失败，请重试' })
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
            t('hongkong.travelInfo.uploadSuccess', { defaultValue: '上传成功' }),
            t('hongkong.travelInfo.hotelReservationUploaded', { defaultValue: '酒店预订照片已上传' })
          );
        } catch (error) {
          console.error('Failed to save hotel reservation photo:', error);
          Alert.alert(
            t('hongkong.travelInfo.uploadError', { defaultValue: '上传失败' }),
            t('hongkong.travelInfo.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
          );
        }
      }
    } catch (error) {
      console.error('Error picking hotel reservation photo:', error);
      Alert.alert(
        t('hongkong.travelInfo.uploadError', { defaultValue: '上传失败' }),
        t('hongkong.travelInfo.uploadErrorMessage', { defaultValue: '选择照片失败，请重试' })
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
      await DebouncedSave.flushPendingSave('hongkong_travel_info');
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
      await DebouncedSave.flushPendingSave('hongkong_travel_info');
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
      await DebouncedSave.flushPendingSave('hongkong_travel_info');
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
      () => navigation.navigate('HongKongEntryFlow', {
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
      { value: 'Female', label: t('hongkong.travelInfo.fields.sex.options.female', { defaultValue: '女性' }) },
      { value: 'Male', label: t('hongkong.travelInfo.fields.sex.options.male', { defaultValue: '男性' }) },
      { value: 'Undefined', label: t('hongkong.travelInfo.fields.sex.options.undefined', { defaultValue: '未定义' }) }
    ];

    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isActive = sex === option.value;
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
        <Text style={styles.headerTitle}>{t('hongkong.travelInfo.headerTitle', { defaultValue: '香港入境信息' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('hongkong.travelInfo.loading', { defaultValue: '正在加载数据...' })}</Text>
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
        {/* Hero Section */}
        <HeroSection t={t} styles={styles} />

        {/* Progress Overview Card */}
        <View style={styles.progressOverviewCard}>
          <Text style={styles.progressTitle}>准备进度</Text>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, formState.totalCompletionPercent >= 25 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>👤</Text>
              <Text style={[styles.stepText, formState.totalCompletionPercent >= 25 && styles.stepTextActive]}>
                护照信息 {formState.totalCompletionPercent >= 25 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.progressStep, formState.totalCompletionPercent >= 50 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>✈️</Text>
              <Text style={[styles.stepText, formState.totalCompletionPercent >= 50 && styles.stepTextActive]}>
                旅行信息 {formState.totalCompletionPercent >= 50 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.progressStep, formState.totalCompletionPercent >= 75 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>🏨</Text>
              <Text style={[styles.stepText, formState.totalCompletionPercent >= 75 && styles.stepTextActive]}>
                住宿信息 {formState.totalCompletionPercent >= 75 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.progressStep, formState.totalCompletionPercent >= 100 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>💰</Text>
              <Text style={[styles.stepText, formState.totalCompletionPercent >= 100 && styles.stepTextActive]}>
                资金证明 {formState.totalCompletionPercent >= 100 ? '✓' : ''}
              </Text>
            </View>
          </View>
        </View>
          
          {/* Enhanced Save Status Indicator */}
          {formState.saveStatus && (
            <View style={[styles.saveStatusBar, styles[`saveStatus${formState.saveStatus.charAt(0).toUpperCase() + formState.saveStatus.slice(1)}`]]}>
              <Text style={styles.saveStatusIcon}>
                {formState.saveStatus === 'pending' && '⏳'}
                {formState.saveStatus === 'saving' && '💾'}
                {formState.saveStatus === 'saved' && '✅'}
                {formState.saveStatus === 'error' && '❌'}
              </Text>
              <Text style={styles.saveStatusText}>
                {formState.saveStatus === 'pending' && t('hongkong.travelInfo.saveStatus.pending', { defaultValue: '等待保存...' })}
                {formState.saveStatus === 'saving' && t('hongkong.travelInfo.saveStatus.saving', { defaultValue: '正在保存...' })}
                {formState.saveStatus === 'saved' && t('hongkong.travelInfo.saveStatus.saved', { defaultValue: '已保存' })}
                {formState.saveStatus === 'error' && t('hongkong.travelInfo.saveStatus.error', { defaultValue: '保存失败' })}
              </Text>
              {formState.saveStatus === 'error' && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    formState.setSaveStatus('saving');
                    debouncedSaveData();
                  }}
                >
                  <Text style={styles.retryButtonText}>
                    {t('hongkong.travelInfo.formState.saveStatus.retry', { defaultValue: '重试' })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {/* Last Edited Timestamp */}
          {formState.lastEditedAt && (
            <Text style={styles.lastEditedText}>
              {t('hongkong.travelInfo.lastEdited', { 
                defaultValue: 'Last edited: {{time}}',
                time: formState.lastEditedAt.toLocaleTimeString()
              })}
            </Text>
          )}

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('hongkong.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
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
          cityOfResidenceLabel={cityOfResidenceLabel}
          cityOfResidenceHelpText={cityOfResidenceHelpText}
          cityOfResidencePlaceholder={cityOfResidencePlaceholder}
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
          saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
          setLastEditedAt={formState.setLastEditedAt}
          // Styles
        {/* Funds Section */}
        <FundsSection
          t={t}
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
          // Form state
          funds={formState.funds}
          fundItemModalVisible={formState.fundItemModalVisible}
          currentFundItem={formState.currentFundItem}
          newFundItemType={formState.newFundItemType}
          // Setters
          setFunds={formState.setFunds}
          setFundItemModalVisible={formState.setFundItemModalVisible}
          setCurrentFundItem={formState.setCurrentFundItem}
          setNewFundItemType={formState.setNewFundItemType}
          // Actions
          handleAddFundItem={handleAddFundItem}
          handleEditFundItem={handleEditFundItem}
          handleSaveFundItem={handleSaveFundItem}
          handleDeleteFundItem={handleDeleteFundItem}
          // Styles
          styles={styles}
        />

        {/* Travel Details Section */}
        <TravelDetailsSection
          t={t}
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
          // Form state
          travelPurpose={formState.travelPurpose}
          customTravelPurpose={formState.customTravelPurpose}
          boardingCountry={formState.boardingCountry}
          recentStayCountry={formState.recentStayCountry}
          arrivalFlightNumber={formState.arrivalFlightNumber}
          arrivalArrivalDate={formState.arrivalArrivalDate}
          flightTicketPhoto={formState.flightTicketPhoto}
          departureFlightNumber={formState.departureFlightNumber}
          departureDepartureDate={formState.departureDepartureDate}
          isTransitPassenger={formState.isTransitPassenger}
          accommodationType={formState.accommodationType}
          customAccommodationType={formState.customAccommodationType}
          province={formState.province}
          district={formState.district}
          hotelAddress={formState.hotelAddress}
          hotelReservationPhoto={formState.hotelReservationPhoto}
          // Setters
          setTravelPurpose={formState.setTravelPurpose}
          setCustomTravelPurpose={formState.setCustomTravelPurpose}
          setBoardingCountry={formState.setBoardingCountry}
          setRecentStayCountry={formState.setRecentStayCountry}
          setArrivalFlightNumber={formState.setArrivalFlightNumber}
          setArrivalArrivalDate={formState.setArrivalArrivalDate}
          setDepartureFlightNumber={formState.setDepartureFlightNumber}
          setDepartureDepartureDate={formState.setDepartureDepartureDate}
          setIsTransitPassenger={formState.setIsTransitPassenger}
          setAccommodationType={formState.setAccommodationType}
          setCustomAccommodationType={formState.setCustomAccommodationType}
          setProvince={formState.setProvince}
          setDistrict={formState.setDistrict}
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
          handleFlightTicketPhotoUpload={handleFlightTicketPhotoUpload}
          handleHotelReservationPhotoUpload={handleHotelReservationPhotoUpload}
          handleUserInteraction={handleUserInteraction}
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
                {formState.totalCompletionPercent >= 100 && (
                  <View style={styles.completionBadge}>
                    <Text style={styles.completionBadgeText}>香港准备就绪！🌴</Text>
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
          {formState.totalCompletionPercent < 100 && (
            <Text style={styles.encouragingHint}>
              {formState.totalCompletionPercent < 20
                ? '🌟 第一步，从介绍自己开始吧！'
                : totalCompletionPercent < 40
                ? '好的开始！香港欢迎你 🌺'
                : totalCompletionPercent < 60
                ? '继续我的香港准备之旅 🏖️'
                : '🚀 快要完成了，你的香港之旅近在咫尺！'
              }
            </Text>
          )}

          {/* Travel-Focused Next Steps */}
          {formState.totalCompletionPercent < 100 && (
            <Text style={styles.nextStepHint}>
              {formState.totalCompletionPercent < 25
                ? '💡 从护照信息开始，告诉香港你是谁'
                : totalCompletionPercent < 50
                ? '👤 填写个人信息，让香港更了解你'
                : totalCompletionPercent < 75
                ? '💰 展示你的资金证明，香港想确保你玩得开心'
                : totalCompletionPercent < 100
                ? '✈️ 最后一步，分享你的旅行计划吧！'
                : ''
              }
            </Text>
          )}

          {/* Cultural Tips for Border Crossing Beginners */}
          {formState.formState.totalCompletionPercent >= 80 && (
            <View style={styles.culturalTipsCard}>
              <Text style={styles.culturalTipsTitle}>🧡 通关小贴士</Text>
              <Text style={styles.culturalTipsText}>
                • 海关官员可能会问你来香港的目的，保持微笑礼貌回答{'\n'}
                • 准备好返程机票证明你不会逾期停留{'\n'}
                • 保持冷静，海关检查是正常程序{'\n'}
                • 如果听不懂，可以礼貌地说"Can you speak English?"
              </Text>
            </View>
          )}


        </View>
      </ScrollView>

      <FundItemDetailModal
        visible={formState.fundItemModalVisible}
        fundItem={formState.currentFundItem}
        createItemType={newFundItemType}
        onClose={handleFundItemModalClose}
        onUpdate={handleFundItemUpdate}
        onCreate={handleFundItemCreate}
        onDelete={handleFundItemDelete}
      />
    </SafeAreaView>
  );
};

export default HongKongTravelInfoScreen;
