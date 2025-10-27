// 入境通 - Singapore Travel Info Screen (新加坡入境信息)
// 基于SGAC新加坡数字入境卡系统

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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import { NationalitySelector, PassportNameInput, DateTimeInput, ProvinceSelector } from '../../components';
import SecureStorageService from '../../services/security/SecureStorageService';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import { singaporeRegions, getRegionDisplayNameBilingual } from '../../data/singaporeRegions';
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import { useTravelInfoForm } from '../../utils/TravelInfoFormUtils';
import InputWithUserTracking from '../../components/InputWithUserTracking';
import TravelInfoFormSection from '../../components/TravelInfoFormSection';
import apiClient from '../../services/api';

// Import reusable components and utilities
import OptionSelector from '../../components/thailand/OptionSelector';
import { parsePassportName } from '../../utils/NameParser';

// Import constants
import {
  PREDEFINED_TRAVEL_PURPOSES,
  TRAVEL_PURPOSE_OPTIONS,
  PREDEFINED_ACCOMMODATION_TYPES,
  ACCOMMODATION_TYPE_OPTIONS,
  GENDER_OPTIONS,
  STORAGE_KEYS,
  SECTIONS,
  FIELD_NAMES,
  DEFAULT_VALUES,
} from './constants';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import UserDataService from '../../services/data/UserDataService';
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Helper component to show warning icon for empty required fields
const FieldWarningIcon = ({ hasWarning, hasError }) => {
  if (hasError) {
    return <Text style={styles.fieldErrorIcon}>❌</Text>;
  }
  if (hasWarning) {
    return <Text style={styles.fieldWarningIcon}>⚠️</Text>;
  }
  return null;
};

// Enhanced Input wrapper that shows warning icons and highlights last edited field
const InputWithValidation = ({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  errorMessage,
  warning,
  warningMessage,
  fieldName,
  lastEditedField,
  ...props
}) => {
  const { t } = useLocale();
  const hasError = error && errorMessage;
  const hasWarning = warning && warningMessage && !hasError;
  const isLastEdited = fieldName && lastEditedField === fieldName;

  return (
    <View style={[
      styles.inputWithValidationContainer,
      isLastEdited && styles.lastEditedField
    ]}>
      <View style={styles.inputLabelContainer}>
        <Text style={[
          styles.inputLabel,
          isLastEdited && styles.lastEditedLabel
        ]}>
          {label}
          {isLastEdited && ' ✨'}
        </Text>
        <FieldWarningIcon hasWarning={hasWarning} hasError={hasError} />
      </View>
      <Input
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        error={hasError}
        errorMessage={errorMessage}
        {...props}
      />
      {hasWarning && !hasError && (
        <Text style={styles.warningText}>{warningMessage}</Text>
      )}
      {isLastEdited && (
        <Text style={styles.lastEditedIndicator}>
          {t('singapore.travelInfo.lastEdited', { defaultValue: '最近编辑' })}
        </Text>
      )}
    </View>
  );
};

const CollapsibleSection = ({ title, subtitle, onScan, isExpanded, onToggle, fieldCount, children }) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const isComplete = fieldCount && fieldCount.filled === fieldCount.total;

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={handleToggle} activeOpacity={0.8}>
        <View style={styles.sectionTitleContainer}>
          <View>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
          </View>
          {fieldCount && (
            <View style={[
              styles.fieldCountBadge,
              isComplete ? styles.fieldCountBadgeComplete : styles.fieldCountBadgeIncomplete
            ]}>
              <Text style={[
                styles.fieldCountText,
                isComplete ? styles.fieldCountTextComplete : styles.fieldCountTextIncomplete
              ]}>
                {`${fieldCount.filled}/${fieldCount.total}`}
              </Text>
            </View>
          )}
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={styles.sectionIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const SingaporeTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();
  
  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);
  
  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // Data model instances
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);

  // UI State (loaded from database, not from route params)
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Personal Info State (loaded from database)
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || '')); // Initialize phone code based on passport nationality or empty
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Proof of Funds State
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // Travel Info State - Initialize with empty values (no hard-coded defaults)
  const [travelPurpose, setTravelPurpose] = useState('');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [boardingCountry, setBoardingCountry] = useState(''); // 登机国家或地区
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState('');
  const [previousArrivalDate, setPreviousArrivalDate] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState('');
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationType, setAccommodationType] = useState(''); // 住宿类型 - no default
  const [customAccommodationType, setCustomAccommodationType] = useState(''); // 自定义住宿类型
  const [province, setProvince] = useState(''); // 省
  const [district, setDistrict] = useState(''); // 区（地区）
  const [subDistrict, setSubDistrict] = useState(''); // 乡（子地区）
  const [postalCode, setPostalCode] = useState(''); // 邮政编码
  const [hotelAddress, setHotelAddress] = useState('');

  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null); // 'passport', 'personal', 'funds', 'travel', or null

  // Auto-save state tracking
  const [saveStatus, setSaveStatus] = useState(null); // 'pending', 'saving', 'saved', 'error', or null
  const [lastEditedAt, setLastEditedAt] = useState(null);

  // Session state tracking
  const [lastEditedField, setLastEditedField] = useState(null);
  const scrollViewRef = useRef(null);
  const shouldRestoreScrollPosition = useRef(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Completion tracking
  const [completionMetrics, setCompletionMetrics] = useState(null);
  const [totalCompletionPercent, setTotalCompletionPercent] = useState(0);

  // Travel info form utilities with user interaction tracking
  const travelInfoForm = useTravelInfoForm('singapore');

  // Migration function to mark existing data as user-modified
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !travelInfoForm.isInitialized) {
      return;
    }

    console.log('=== MIGRATING EXISTING DATA TO INTERACTION STATE (SINGAPORE) ===');
    await travelInfoForm.initializeWithExistingData(userData);
  }, [travelInfoForm]);

  // Handle user interaction with tracking-enabled inputs
  const handleUserInteraction = useCallback((fieldName, value) => {
    // Use the travel info form utility to handle user interaction
    travelInfoForm.handleUserInteraction(fieldName, value);

    // Update the appropriate state based on field name
    switch (fieldName) {
      case 'travelPurpose':
        setTravelPurpose(value);
        if (value !== 'OTHER') {
          setCustomTravelPurpose('');
        }
        break;
      case 'accommodationType':
        setAccommodationType(value);
        if (value !== 'OTHER') {
          setCustomAccommodationType('');
        }
        break;
      case 'boardingCountry':
        setBoardingCountry(value);
        break;
      default:
        console.warn(`Unknown field for user interaction: ${fieldName}`);
    }

    // Trigger debounced save
    debouncedSaveData();
  }, [travelInfoForm.handleUserInteraction]);

  // Count filled fields for each section using TravelInfoFormUtils
  const getFieldCount = (section) => {
    // Build all fields object for the utility
    const allFields = {
      // Passport fields
      fullName, nationality, passportNo, dob, expiryDate, sex,
      // Personal fields
      occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email,
      // Travel fields
      travelPurpose, customTravelPurpose, boardingCountry, arrivalFlightNumber, arrivalArrivalDate,
      departureFlightNumber, departureDepartureDate, isTransitPassenger, accommodationType,
      customAccommodationType, province, district, subDistrict, postalCode, hotelAddress,
      // Funds
      funds
    };

    return travelInfoForm.getFieldCount(section, allFields);
  };

  // Calculate completion metrics using TravelInfoFormUtils
  const calculateCompletionMetrics = useCallback(() => {
    try {
      // Build all fields object for the utility
      const allFields = {
        // Passport fields
        passportNo, fullName, nationality, dob, expiryDate, sex,
        // Personal fields
        occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email,
        // Travel fields
        travelPurpose, customTravelPurpose, boardingCountry, arrivalFlightNumber, arrivalArrivalDate,
        departureFlightNumber, departureDepartureDate, isTransitPassenger, accommodationType,
        customAccommodationType, province, district, subDistrict, postalCode, hotelAddress,
        // Funds
        funds
      };

      const summary = travelInfoForm.calculateCompletionMetrics(allFields);
      setCompletionMetrics(summary.metrics);
      setTotalCompletionPercent(summary.totalPercent);

      return summary;
    } catch (error) {
      console.error('Failed to calculate completion metrics:', error);
      return { totalPercent: 0, metrics: null, isReady: false };
    }
  }, [
    passportNo, fullName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, boardingCountry, arrivalFlightNumber, arrivalArrivalDate,
    departureFlightNumber, departureDepartureDate, isTransitPassenger, accommodationType,
    customAccommodationType, province, district, subDistrict, postalCode, hotelAddress,
    funds,
    travelInfoForm
  ]);

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
        label: '开始新加坡之旅！🌴',
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
        label: '继续我的新加坡准备之旅 💪',
        variant: 'secondary',
        style: styles.secondaryButton,
        icon: '🏖️',
        action: 'edit'
      };
    } else {
      return {
        label: '开始准备新加坡之旅吧！🇸🇬',
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
      return '准备好迎接新加坡之旅了！🌴';
    } else if (totalCompletionPercent >= 80) {
      return '快完成了！新加坡在向你招手 ✨';
    } else if (totalCompletionPercent >= 60) {
      return '进展不错！继续加油 💪';
    } else if (totalCompletionPercent >= 40) {
      return '已经完成一半了！🏖️';
    } else if (totalCompletionPercent >= 20) {
      return '好的开始！新加坡欢迎你 🌺';
    } else {
      return '让我们开始准备新加坡之旅吧！🇸🇬';
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

  // Load saved data on component mount and when screen gains focus
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);

        // Initialize UserDataService and trigger migration if needed
        try {
          await UserDataService.initialize(userId);
        } catch (initError) {
          console.error('Failed to initialize UserDataService:', initError);
          console.error('Error details:', initError.message, initError.stack);
          // Log the error but re-throw it to prevent further operations
          throw initError;
        }

        // Load all user data from centralized service
        const userData = await UserDataService.getAllUserData(userId);
        console.log('=== LOADED USER DATA ===');
        console.log('userData:', userData);
        console.log('userData.passport:', userData?.passport);
        console.log('userData.passport.dateOfBirth:', userData?.passport?.dateOfBirth);
        console.log('userData.personalInfo:', userData?.personalInfo);

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

        // Wait for interaction tracker to be initialized before migration
        if (travelInfoForm.isInitialized) {
          await migrateExistingDataToInteractionState(userData);
        } else {
          // If not initialized yet, wait a bit and try again
          setTimeout(async () => {
            if (travelInfoForm.isInitialized) {
              await migrateExistingDataToInteractionState(userData);
            }
          }, 100);
        }

        // Passport Info - prioritize centralized data, fallback to route params
        const passportInfo = userData?.passport;
        if (passportInfo) {
          console.log('Loading passport from database:', passportInfo);
          setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');
          setFullName(prev => {
            if (passportInfo.fullName && passportInfo.fullName.trim()) {
              return passportInfo.fullName;
            }
            if (prev && prev.trim()) {
              return prev;
            }
            if (passport?.nameEn && passport?.nameEn.trim()) {
              return passport.nameEn;
            }
            if (passport?.name && passport?.name.trim()) {
              return passport.name;
            }
            return '';
          });
          setNationality(passportInfo.nationality || passport?.nationality || '');
          setDob(passportInfo.dateOfBirth || passport?.dob || '');
          setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');

          // Store passport data model instance
          setPassportData(passportInfo);
        } else {
          console.log('No passport data in database, using route params');
          // Fallback to route params if no centralized data
          setPassportNo(passport?.passportNo || '');
          setFullName(prev => {
            if (prev && prev.trim()) {
              return prev;
            }
            if (passport?.nameEn && passport?.nameEn.trim()) {
              return passport.nameEn;
            }
            if (passport?.name && passport?.name.trim()) {
              return passport.name;
            }
            return '';
          });
          setNationality(passport?.nationality || '');
          setDob(passport?.dob || '');
          setExpiryDate(passport?.expiry || '');
        }

        // Personal Info - load from centralized data
        const personalInfo = userData?.personalInfo;
        if (personalInfo) {
          setOccupation(personalInfo.occupation || '');
          setCityOfResidence(personalInfo.provinceCity || '');
          setResidentCountry(personalInfo.countryRegion || '');
          setPhoneNumber(personalInfo.phoneNumber || '');
          setEmail(personalInfo.email || '');

          // Set phone code based on resident country or nationality
          setPhoneCode(personalInfo.phoneCode || getPhoneCode(personalInfo.countryRegion || passport?.nationality || ''));

          // Store personal info data model instance
          setPersonalInfoData(personalInfo);
        } else {
          setPhoneCode(getPhoneCode(passport?.nationality || ''));
        }

        // Gender - load from passport only (single source of truth)
        const loadedSex = passportInfo?.gender || passport?.sex || passport?.gender || sex || 'Male';
        setSex(loadedSex);

        await refreshFundItems();

        // Travel Info - load from centralized data
        try {
          // Use destination.id for consistent lookup (not affected by localization)
          const destinationId = destination?.id || 'singapore';
          console.log('Loading travel info for destination:', destinationId);
          let travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

          // Fallback: try loading with localized name if id lookup fails
          // This handles data saved before the fix
          if (!travelInfo && destination?.name) {
            console.log('Trying fallback with destination name:', destination.name);
            travelInfo = await UserDataService.getTravelInfo(userId, destination.name);
          }

          if (travelInfo) {
            console.log('=== LOADING SAVED TRAVEL INFO ===');
            console.log('Travel info data:', JSON.stringify(travelInfo, null, 2));
            console.log('Hotel name from DB:', travelInfo.hotelName);
            console.log('Hotel address from DB:', travelInfo.hotelAddress);
            console.log('Flight number from DB:', travelInfo.arrivalFlightNumber);

            // Check if travel purpose is a predefined option
            const loadedPurpose = travelInfo.travelPurpose || 'HOLIDAY';
            if (PREDEFINED_TRAVEL_PURPOSES.includes(loadedPurpose)) {
              setTravelPurpose(loadedPurpose);
              setCustomTravelPurpose('');
            } else {
              // Custom purpose - set to OTHER and store custom value
              setTravelPurpose('OTHER');
              setCustomTravelPurpose(loadedPurpose);
            }
            setBoardingCountry(travelInfo.boardingCountry || '');
            setVisaNumber(travelInfo.visaNumber || '');
            setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
            setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
            setPreviousArrivalDate(travelInfo.arrivalArrivalDate || '');
            setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
            console.log('=== LOADING DEPARTURE DATE FROM DB ===');
            console.log('travelInfo.departureDepartureDate:', travelInfo.departureDepartureDate);
            console.log('travelInfo object keys:', Object.keys(travelInfo));
            setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
            setIsTransitPassenger(travelInfo.isTransitPassenger || false);
            // Load accommodation type
            const loadedAccommodationType = travelInfo.accommodationType || 'HOTEL';
            if (PREDEFINED_ACCOMMODATION_TYPES.includes(loadedAccommodationType)) {
              setAccommodationType(loadedAccommodationType);
              setCustomAccommodationType('');
            } else {
              // Custom accommodation type - set to OTHER and store custom value
              setAccommodationType('OTHER');
              setCustomAccommodationType(loadedAccommodationType);
            }
            setProvince(travelInfo.province || '');
            setDistrict(travelInfo.district || '');
            setSubDistrict(travelInfo.subDistrict || '');
            setPostalCode(travelInfo.postalCode || '');
            setHotelAddress(travelInfo.hotelAddress || '');

            console.log('Travel info loaded and state updated');
          } else {
            console.log('No saved travel info found');
          }
        } catch (travelInfoError) {
          console.log('Failed to load travel info:', travelInfoError);
          // Continue without travel info
        }

      } catch (error) {
        // Fallback to route params on error
        setPassportNo(passport?.passportNo || '');
        setFullName(prev => {
          if (prev && prev.trim()) {
            return prev;
          }
          if (passport?.nameEn && passport?.nameEn.trim()) {
            return passport.nameEn;
          }
          if (passport?.name && passport?.name.trim()) {
            return passport.name;
          }
          return '';
        });
        setNationality(passport?.nationality || '');
        setDob(passport?.dob || '');
        setExpiryDate(passport?.expiry || '');
        setSex(passport?.sex || 'Male');
        setPhoneCode(getPhoneCode(passport?.nationality || ''));
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedData();
  }, [userId]); // Only depend on userId, not the entire passport object or refreshFundItems

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
              const destinationId = destination?.id || 'singapore';
              const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
              if (travelInfo) {
                userData.travelInfo = travelInfo;
              }
            } catch (travelInfoError) {
              console.log('Failed to load travel info for migration on focus:', travelInfoError);
            }

            // Perform backward compatibility migration on focus reload
            if (travelInfoForm.isInitialized) {
              await migrateExistingDataToInteractionState(userData);
            }
            // Update passport data if available
            const passportInfo = userData.passport;
            if (passportInfo) {
              setPassportNo(prev => passportInfo.passportNumber || prev);
              setFullName(prev => {
                if (passportInfo.fullName && passportInfo.fullName.trim()) {
                  return passportInfo.fullName;
                }
                return prev;
              });
              setNationality(prev => passportInfo.nationality || prev);
              setDob(prev => passportInfo.dateOfBirth || prev);
              setExpiryDate(prev => passportInfo.expiryDate || prev);
              setPassportData(passportInfo);
            }

            // Update personal info if available
            const personalInfo = userData.personalInfo;
            if (personalInfo) {
              setOccupation(personalInfo.occupation || occupation);
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
              const destinationId = destination?.id || 'singapore';
              const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

              if (travelInfo) {
                console.log('=== RELOADING TRAVEL INFO ON FOCUS ===');
                console.log('travelInfo.departureDepartureDate:', travelInfo.departureDepartureDate);

                // Update travel info state
                const loadedPurpose = travelInfo.travelPurpose || 'HOLIDAY';
                if (PREDEFINED_TRAVEL_PURPOSES.includes(loadedPurpose)) {
                  setTravelPurpose(loadedPurpose);
                  setCustomTravelPurpose('');
                } else {
                  setTravelPurpose('OTHER');
                  setCustomTravelPurpose(loadedPurpose);
                }
                setBoardingCountry(travelInfo.boardingCountry || '');
                setVisaNumber(travelInfo.visaNumber || '');
                setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
                setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
                setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
                setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
                setIsTransitPassenger(travelInfo.isTransitPassenger || false);

                // Load accommodation type
                const loadedAccommodationType = travelInfo.accommodationType || 'HOTEL';
                if (PREDEFINED_ACCOMMODATION_TYPES.includes(loadedAccommodationType)) {
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
  }, [navigation, userId]); // Only depend on userId, not the entire passport object or refreshFundItems

  // Add blur listener to save data when leaving the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Flush any pending saves when leaving the screen
      DebouncedSave.flushPendingSave('singapore_travel_info');
    });

    return unsubscribe;
  }, [navigation]);

  // Cleanup effect (equivalent to componentWillUnmount)
  useEffect(() => {
    return () => {
      // Save data and session state when component is unmounted
      try {
        DebouncedSave.flushPendingSave('singapore_travel_info');
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
      const currentStatus = DebouncedSave.getSaveState('singapore_travel_info');
      setSaveStatus(currentStatus);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Session state management functions
  const getSessionStateKey = () => {
    return `session_state_singapore_${userId}`;
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
          setExpandedSection(sessionState.expandedSection);
        }

        // Restore scroll position (will be applied after data loads)
        if (sessionState.scrollPosition) {
          setScrollPosition(sessionState.scrollPosition);
          shouldRestoreScrollPosition.current = true;
        }

        // Restore last edited field
        if (sessionState.lastEditedField) {
          setLastEditedField(sessionState.lastEditedField);
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
  }, [isLoading, calculateCompletionMetrics]);

  // Helper function to handle navigation with save error handling
  const handleNavigationWithSave = async (navigationAction, actionName = 'navigate') => {
    try {
      // Set saving state to show user that save is in progress
      setSaveStatus('saving');

      // Flush any pending saves before navigation
      await DebouncedSave.flushPendingSave('singapore_travel_info');

      // Execute the navigation action
      navigationAction();
    } catch (error) {
      console.error(`Failed to save data before ${actionName}:`, error);
      setSaveStatus('error');

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
            onPress: () => setSaveStatus(null),
          },
        ]
      );
    }
  };

  // Create debounced save function
  const debouncedSaveData = DebouncedSave.debouncedSave(
    'singapore_travel_info',
    async () => {
      await saveDataToSecureStorage();
      setLastEditedAt(new Date());
    },
    300
  );

  // Function to validate and save field data on blur
  const handleFieldBlur = async (fieldName, fieldValue) => {
    try {
      console.log('=== HANDLE FIELD BLUR (SINGAPORE) ===');
      console.log('Field:', fieldName);
      console.log('Value:', fieldValue);
      
      // Mark field as user-modified for interaction tracking
      travelInfoForm.handleUserInteraction(fieldName, fieldValue);

      // Track last edited field for session state
      setLastEditedField(fieldName);

      // Brief highlight animation for last edited field
      if (fieldName) {
        // Clear any existing highlight timeout
        if (window.highlightTimeout) {
          clearTimeout(window.highlightTimeout);
        }

        // Set highlight timeout to clear after 2 seconds
        window.highlightTimeout = setTimeout(() => {
          setLastEditedField(null);
        }, 2000);
      }

      // Enhanced validation using SoftValidation utility
      let isValid = true;
      let errorMessage = '';
      let isWarning = false;
      let helpMessage = '';

      // Comprehensive validation rules for each field
      switch (fieldName) {
        case 'fullName':
          if (fieldValue && fieldValue.trim()) {
            // Check for Chinese characters (not allowed in passport names)
            if (/[\u4e00-\u9fff]/.test(fieldValue)) {
              isValid = false;
              errorMessage = 'Please use English letters only (no Chinese characters)';
            }
            // Check for proper format (Last, First or LAST, FIRST)
            else if (!/^[A-Za-z\s,.-]+$/.test(fieldValue)) {
              isValid = false;
              errorMessage = 'Name should contain only letters, spaces, commas, periods, and hyphens';
            }
            // Check minimum length
            else if (fieldValue.trim().length < 2) {
              isValid = false;
              errorMessage = 'Name must be at least 2 characters long';
            }
          } else {
            isWarning = true;
            errorMessage = 'Full name is required';
          }
          break;

        case 'passportNo':
          if (fieldValue && fieldValue.trim()) {
            // Remove spaces and validate format
            const cleanPassport = fieldValue.replace(/\s/g, '');
            if (!/^[A-Z0-9]{6,12}$/i.test(cleanPassport)) {
              isValid = false;
              errorMessage = 'Passport number must be 6-12 letters and numbers';
            }
          } else {
            isWarning = true;
            errorMessage = 'Passport number is required';
          }
          break;

        case 'visaNumber':
          if (fieldValue && fieldValue.trim()) {
            if (!/^[A-Za-z0-9]{5,15}$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Visa number must be 5-15 letters or numbers';
            }
          }
          // Visa number is optional, so no warning for empty value
          break;

        case 'dob':
        case 'expiryDate':
        case 'arrivalArrivalDate':
        case 'departureDepartureDate':
          if (fieldValue && fieldValue.trim()) {
            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) {
              isValid = false;
              errorMessage = 'Date must be in YYYY-MM-DD format';
            } else {
              // Validate actual date
              const date = new Date(fieldValue);
              if (isNaN(date.getTime())) {
                isValid = false;
                errorMessage = 'Please enter a valid date';
              } else {
                // Additional date-specific validations
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (fieldName === 'dob') {
                  // Birth date should be in the past and reasonable
                  if (date >= today) {
                    isValid = false;
                    errorMessage = 'Birth date must be in the past';
                  } else if (date < new Date('1900-01-01')) {
                    isValid = false;
                    errorMessage = 'Please enter a valid birth date';
                  }
                } else if (fieldName === 'expiryDate') {
                  // Passport expiry should be in the future
                  if (date <= today) {
                    isValid = false;
                    errorMessage = 'Passport expiry date must be in the future';
                  }
                } else if (fieldName === 'arrivalArrivalDate') {
                  // Arrival date should be in the future (or today)
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  if (date < yesterday) {
                    isValid = false;
                    errorMessage = 'Arrival date should not be in the past';
                  }
                } else if (fieldName === 'departureDepartureDate') {
                  // Departure date should be after arrival date
                  if (arrivalArrivalDate && date <= new Date(arrivalArrivalDate)) {
                    isValid = false;
                    errorMessage = 'Departure date must be after arrival date';
                  }
                }
              }
            }
          } else if (['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate'].includes(fieldName)) {
            isWarning = true;
            errorMessage = `${fieldName === 'dob' ? 'Birth date' :
                            fieldName === 'expiryDate' ? 'Passport expiry date' :
                            fieldName === 'arrivalArrivalDate' ? 'Arrival date' : 'Departure date'} is required`;
          }
          break;

        case 'email':
          if (fieldValue && fieldValue.trim()) {
            // Enhanced email validation
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!emailRegex.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Please enter a valid email address';
            }
          } else {
            isWarning = true;
            errorMessage = 'Email address is required';
          }
          break;

        case 'phoneNumber':
          if (fieldValue && fieldValue.trim()) {
            // Remove all non-digit characters except + for validation
            const cleanPhone = fieldValue.replace(/[^\d+]/g, '');
            if (cleanPhone.length < 7) {
              isValid = false;
              errorMessage = 'Phone number must be at least 7 digits';
            } else if (cleanPhone.length > 15) {
              isValid = false;
              errorMessage = 'Phone number must be no more than 15 digits';
            } else if (!/^[\+]?[\d\s\-\(\)]{7,}$/.test(fieldValue)) {
              isValid = false;
              errorMessage = 'Phone number contains invalid characters';
            }
          } else {
            isWarning = true;
            errorMessage = 'Phone number is required';
          }
          break;

        case 'phoneCode':
          if (fieldValue && fieldValue.trim()) {
            if (!/^\+\d{1,4}$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Country code must start with + followed by 1-4 digits';
            }
          } else {
            isWarning = true;
            errorMessage = 'Country code is required';
          }
          break;

        case 'occupation':
        case 'cityOfResidence':
          if (fieldValue && fieldValue.trim()) {
            // Check for English characters only
            if (!/^[A-Za-z\s\-\.]+$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Please use English letters only';
            } else if (fieldValue.trim().length < 2) {
              isValid = false;
              errorMessage = 'Must be at least 2 characters long';
            }
          } else {
            isWarning = true;
            errorMessage = `${fieldName === 'occupation' ? 'Occupation' : 'City of residence'} is required`;
          }
          break;

        case 'arrivalFlightNumber':
        case 'departureFlightNumber':
          if (fieldValue && fieldValue.trim()) {
            // Flight number format validation (e.g., SQ123, CX456)
            if (!/^[A-Z]{2,3}\d{1,4}[A-Z]?$/i.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Flight number format: 2-3 letters + 1-4 digits (e.g., SQ123)';
            }
          } else {
            isWarning = true;
            errorMessage = `${fieldName === 'arrivalFlightNumber' ? 'Arrival' : 'Departure'} flight number is required`;
          }
          break;

        case 'customTravelPurpose':
          if (travelPurpose === 'OTHER') {
            if (fieldValue && fieldValue.trim()) {
              if (!/^[A-Za-z\s\-\.]+$/.test(fieldValue.trim())) {
                isValid = false;
                errorMessage = 'Please use English letters only';
              } else if (fieldValue.trim().length < 3) {
                isValid = false;
                errorMessage = 'Travel purpose must be at least 3 characters';
              }
            } else {
              isWarning = true;
              errorMessage = 'Please specify your travel purpose';
            }
          }
          break;

        case 'customAccommodationType':
          if (accommodationType === 'OTHER') {
            if (fieldValue && fieldValue.trim()) {
              if (!/^[A-Za-z\s\-\.]+$/.test(fieldValue.trim())) {
                isValid = false;
                errorMessage = 'Please use English letters only';
              } else if (fieldValue.trim().length < 3) {
                isValid = false;
                errorMessage = 'Accommodation type must be at least 3 characters';
              }
            } else {
              isWarning = true;
              errorMessage = 'Please specify your accommodation type';
            }
          }
          break;

        case 'hotelAddress':
          if (!isTransitPassenger) {
            if (fieldValue && fieldValue.trim()) {
              if (fieldValue.trim().length < 10) {
                isValid = false;
                errorMessage = 'Address must be at least 10 characters long';
              }
            } else {
              isWarning = true;
              errorMessage = 'Address is required';
            }
          }
          break;

        case 'district':
        case 'subDistrict':
          if (!isTransitPassenger && accommodationType !== 'HOTEL') {
            if (fieldValue && fieldValue.trim()) {
              if (!/^[A-Za-z\s\-\.]+$/.test(fieldValue.trim())) {
                isValid = false;
                errorMessage = 'Please use English letters only';
              }
            } else {
              isWarning = true;
              errorMessage = `${fieldName === 'district' ? 'District' : 'Sub-district'} is required`;
            }
          }
          break;
        case 'postalCode':
          if (!isTransitPassenger && accommodationType !== 'HOTEL') {
            if (fieldValue && fieldValue.trim()) {
              if (!/^\d{6}$/.test(fieldValue.trim())) {
                isValid = false;
                errorMessage = 'Postal code must be 6 digits';
              }
            } else {
              isWarning = true;
              errorMessage = 'Postal code is required';
            }
          }
          break;

        default:
          // For any other fields, just check if they're not empty when required
          if (!fieldValue || !fieldValue.toString().trim()) {
            isWarning = true;
            errorMessage = 'This field is required';
          }
          break;
      }

      console.log('Validation result:', isValid ? (isWarning ? 'WARNING' : 'VALID') : 'ERROR');
      if (!isValid || isWarning) {
        console.log('Message:', errorMessage);
      }

      // Update errors and warnings state
      setErrors(prev => ({
        ...prev,
        [fieldName]: isValid ? '' : (isWarning ? '' : errorMessage)
      }));
      
      setWarnings(prev => ({
        ...prev,
        [fieldName]: isWarning ? errorMessage : ''
      }));

      // Save data if valid (including warnings) using debounced save
      if (isValid) {
        console.log('Validation passed, triggering debounced save...');
        try {
          // For date fields, we need to pass the new value directly to avoid React state delay
          if (['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate'].includes(fieldName)) {
            console.log('Date field detected, saving immediately with new value:', fieldValue);
            // Save immediately with the new value to avoid React state delay
            await saveDataToSecureStorageWithOverride({ [fieldName]: fieldValue });
            setLastEditedAt(new Date());
          } else {
            debouncedSaveData();
          }
        } catch (saveError) {
          console.error('Failed to trigger debounced save:', saveError);
          // Don't show error to user for debounced saves, as they will retry automatically
        }
      } else {
        console.log('Skipping save due to validation error');
      }

    } catch (error) {
      console.error('Failed to validate and save field:', error);
      console.error('Error stack:', error.stack);
      // Don't show error to user for field validation, as it's non-critical
    }
  };

  // Save all data to secure storage with optional field overrides
  const saveDataToSecureStorageWithOverride = async (fieldOverrides = {}) => {
    try {
      console.log('=== SAVING DATA TO SECURE STORAGE WITH OVERRIDES (SINGAPORE) ===');
      console.log('userId:', userId);
      console.log('fieldOverrides:', fieldOverrides);

      // Get current values with overrides applied
      const getCurrentValue = (fieldName, currentValue) => {
        return fieldOverrides[fieldName] !== undefined ? fieldOverrides[fieldName] : currentValue;
      };

      // Build all fields object for filtering
      const allFields = {
        // Passport fields
        passportNo: getCurrentValue('passportNo', passportNo),
        fullName: getCurrentValue('fullName', fullName),
        nationality: getCurrentValue('nationality', nationality),
        dob: getCurrentValue('dob', dob),
        expiryDate: getCurrentValue('expiryDate', expiryDate),
        sex: getCurrentValue('sex', sex),
        // Personal fields
        occupation: getCurrentValue('occupation', occupation),
        cityOfResidence: getCurrentValue('cityOfResidence', cityOfResidence),
        residentCountry: getCurrentValue('residentCountry', residentCountry),
        phoneCode: getCurrentValue('phoneCode', phoneCode),
        phoneNumber: getCurrentValue('phoneNumber', phoneNumber),
        email: getCurrentValue('email', email),
        // Travel fields
        travelPurpose: getCurrentValue('travelPurpose', travelPurpose),
        customTravelPurpose: getCurrentValue('customTravelPurpose', customTravelPurpose),
        boardingCountry: getCurrentValue('boardingCountry', boardingCountry),
        arrivalFlightNumber: getCurrentValue('arrivalFlightNumber', arrivalFlightNumber),
        arrivalArrivalDate: getCurrentValue('arrivalArrivalDate', arrivalArrivalDate),
        departureFlightNumber: getCurrentValue('departureFlightNumber', departureFlightNumber),
        departureDepartureDate: getCurrentValue('departureDepartureDate', departureDepartureDate),
        isTransitPassenger: getCurrentValue('isTransitPassenger', isTransitPassenger),
        accommodationType: getCurrentValue('accommodationType', accommodationType),
        customAccommodationType: getCurrentValue('customAccommodationType', customAccommodationType),
        province: getCurrentValue('province', province),
        district: getCurrentValue('district', district),
        subDistrict: getCurrentValue('subDistrict', subDistrict),
        postalCode: getCurrentValue('postalCode', postalCode),
        hotelAddress: getCurrentValue('hotelAddress', hotelAddress),
        visaNumber: getCurrentValue('visaNumber', visaNumber)
      };

      // Filter fields based on user interaction
      const fieldsToSave = travelInfoForm.filterFieldsForSave(allFields);
      console.log('Fields to save after filtering:', fieldsToSave);
      console.log('Total fields to save:', Object.keys(fieldsToSave).length);

      // Get existing passport first to ensure we're updating the right one
      const existingPassport = await UserDataService.getPassport(userId);
      console.log('Existing passport:', existingPassport);

      // Save passport data - only include user-modified fields
      const passportUpdates = {};
      if (fieldsToSave.passportNo && fieldsToSave.passportNo.trim()) passportUpdates.passportNumber = fieldsToSave.passportNo;
      if (fieldsToSave.fullName && fieldsToSave.fullName.trim()) passportUpdates.fullName = fieldsToSave.fullName;
      if (fieldsToSave.nationality && fieldsToSave.nationality.trim()) passportUpdates.nationality = fieldsToSave.nationality;
      
      if (fieldsToSave.dob && fieldsToSave.dob.trim()) {
        console.log('=== DOB SAVING DEBUG WITH FILTERING ===');
        console.log('dob value being saved:', fieldsToSave.dob);
        passportUpdates.dateOfBirth = fieldsToSave.dob;
      }
      
      if (fieldsToSave.expiryDate && fieldsToSave.expiryDate.trim()) passportUpdates.expiryDate = fieldsToSave.expiryDate;
      if (fieldsToSave.sex && fieldsToSave.sex.trim()) passportUpdates.gender = fieldsToSave.sex;

      if (Object.keys(passportUpdates).length > 0) {
        console.log('Saving passport updates:', passportUpdates);
        if (existingPassport && existingPassport.id) {
          console.log('Updating existing passport with ID:', existingPassport.id);
          const updated = await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
          console.log('Passport data updated successfully');
          
          // Update passportData state to track the correct passport ID
          setPassportData(updated);
        } else {
          console.log('Creating new passport for userId:', userId);
          const saved = await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
          console.log('Passport data saved successfully');
          
          // Update passportData state to track the new passport ID
          setPassportData(saved);
        }
      }

      // Save personal info data - only include user-modified fields
      const personalInfoUpdates = {};
      if (fieldsToSave.phoneCode && fieldsToSave.phoneCode.trim()) personalInfoUpdates.phoneCode = fieldsToSave.phoneCode;
      if (fieldsToSave.phoneNumber && fieldsToSave.phoneNumber.trim()) personalInfoUpdates.phoneNumber = fieldsToSave.phoneNumber;
      if (fieldsToSave.email && fieldsToSave.email.trim()) personalInfoUpdates.email = fieldsToSave.email;
      if (fieldsToSave.occupation && fieldsToSave.occupation.trim()) personalInfoUpdates.occupation = fieldsToSave.occupation;
      if (fieldsToSave.cityOfResidence && fieldsToSave.cityOfResidence.trim()) personalInfoUpdates.provinceCity = fieldsToSave.cityOfResidence;
      if (fieldsToSave.residentCountry && fieldsToSave.residentCountry.trim()) personalInfoUpdates.countryRegion = fieldsToSave.residentCountry;
      if (fieldsToSave.sex && fieldsToSave.sex.trim()) personalInfoUpdates.gender = fieldsToSave.sex;

      if (Object.keys(personalInfoUpdates).length > 0) {
        console.log('Saving personal info updates:', personalInfoUpdates);
        const savedPersonalInfo = await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
        console.log('Personal info saved successfully');
        
        // Update personalInfoData state
        setPersonalInfoData(savedPersonalInfo);
      }

      // Save travel info data - only include user-modified fields
      const travelInfoUpdates = {};
      // If "OTHER" is selected, use custom purpose; otherwise use selected purpose
      const finalTravelPurpose = fieldsToSave.travelPurpose === 'OTHER' && fieldsToSave.customTravelPurpose && fieldsToSave.customTravelPurpose.trim() 
        ? fieldsToSave.customTravelPurpose.trim() 
        : fieldsToSave.travelPurpose;
      if (finalTravelPurpose && finalTravelPurpose.trim()) travelInfoUpdates.travelPurpose = finalTravelPurpose;
      if (fieldsToSave.boardingCountry && fieldsToSave.boardingCountry.trim()) travelInfoUpdates.boardingCountry = fieldsToSave.boardingCountry;
      if (fieldsToSave.visaNumber && fieldsToSave.visaNumber.trim()) travelInfoUpdates.visaNumber = fieldsToSave.visaNumber.trim();
      if (fieldsToSave.arrivalFlightNumber && fieldsToSave.arrivalFlightNumber.trim()) travelInfoUpdates.arrivalFlightNumber = fieldsToSave.arrivalFlightNumber;
      
      if (fieldsToSave.arrivalArrivalDate && fieldsToSave.arrivalArrivalDate.trim()) travelInfoUpdates.arrivalArrivalDate = fieldsToSave.arrivalArrivalDate;
      
      if (fieldsToSave.departureFlightNumber && fieldsToSave.departureFlightNumber.trim()) travelInfoUpdates.departureFlightNumber = fieldsToSave.departureFlightNumber;
      
      if (fieldsToSave.departureDepartureDate && fieldsToSave.departureDepartureDate.trim()) {
        console.log('=== ADDING DEPARTURE DATE TO UPDATES WITH FILTERING ===');
        console.log('departureDepartureDate value:', fieldsToSave.departureDepartureDate);
        travelInfoUpdates.departureDepartureDate = fieldsToSave.departureDepartureDate;
      } else {
        console.log('=== DEPARTURE DATE NOT ADDED WITH FILTERING ===');
        console.log('departureDepartureDate value:', fieldsToSave.departureDepartureDate);
        console.log('departureDepartureDate type:', typeof fieldsToSave.departureDepartureDate);
      }
      
      console.log('=== TRANSIT PASSENGER SAVE DEBUG WITH FILTERING ===');
      console.log('isTransitPassenger (filtered):', fieldsToSave.isTransitPassenger);
      
      if (fieldsToSave.isTransitPassenger !== undefined) travelInfoUpdates.isTransitPassenger = fieldsToSave.isTransitPassenger;
      // Save accommodation type - if "OTHER" is selected, use custom type (only user-modified fields)
      if (!fieldsToSave.isTransitPassenger) {
        const finalAccommodationType = fieldsToSave.accommodationType === 'OTHER' && fieldsToSave.customAccommodationType && fieldsToSave.customAccommodationType.trim()
          ? fieldsToSave.customAccommodationType.trim()
          : fieldsToSave.accommodationType;
          
        console.log('=== ACCOMMODATION TYPE SAVE DEBUG WITH FILTERING ===');
        console.log('accommodationType (filtered):', fieldsToSave.accommodationType);
        console.log('customAccommodationType (filtered):', fieldsToSave.customAccommodationType);
        console.log('finalAccommodationType:', finalAccommodationType);
        console.log('isTransitPassenger (filtered):', fieldsToSave.isTransitPassenger);
        
        if (finalAccommodationType && finalAccommodationType.trim()) {
          console.log('Adding accommodation type to updates:', finalAccommodationType);
          travelInfoUpdates.accommodationType = finalAccommodationType;
        } else {
          console.log('Accommodation type not added - not user-modified or empty');
        }
        
        if (fieldsToSave.province && fieldsToSave.province.trim()) travelInfoUpdates.province = fieldsToSave.province;
        if (fieldsToSave.district && fieldsToSave.district.trim()) travelInfoUpdates.district = fieldsToSave.district;
        if (fieldsToSave.subDistrict && fieldsToSave.subDistrict.trim()) travelInfoUpdates.subDistrict = fieldsToSave.subDistrict;
        if (fieldsToSave.postalCode && fieldsToSave.postalCode.trim()) travelInfoUpdates.postalCode = fieldsToSave.postalCode;
        if (fieldsToSave.hotelAddress && fieldsToSave.hotelAddress.trim()) travelInfoUpdates.hotelAddress = fieldsToSave.hotelAddress;
      }

      if (Object.keys(travelInfoUpdates).length > 0) {
        console.log('Saving travel info updates:', travelInfoUpdates);
        try {
          // Use destination.id for consistent lookup (not affected by localization)
          const destinationId = destination?.id || 'singapore';
          console.log('Calling UserDataService.updateTravelInfo with:', { userId, destinationId });
          const savedTravelInfo = await UserDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);
          console.log('Travel info saved successfully:', savedTravelInfo);
          
          // Check if arrival date changed and handle notifications
          if (travelInfoUpdates.arrivalArrivalDate && travelInfoUpdates.arrivalArrivalDate !== previousArrivalDate) {
            console.log('Arrival date changed; UserDataService will handle notification updates');
            setPreviousArrivalDate(travelInfoUpdates.arrivalArrivalDate);
          }
        } catch (travelInfoError) {
          console.error('Failed to save travel info:', travelInfoError);
          console.error('Travel info error stack:', travelInfoError.stack);
        }
      }

      console.log('=== DATA SAVED SUCCESSFULLY WITH OVERRIDES ===');
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
      console.error('Error details:', error.message, error.stack);
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
    photo: item.photoUri || item.photo || null,
    userId: item.userId || userId,
  }), [userId]);

  const refreshFundItems = useCallback(async (options = {}) => {
    try {
      const fundItems = await UserDataService.getFundItems(userId, options);
      const normalized = fundItems.map(normalizeFundItem);
      setFunds(normalized);
    } catch (error) {
      console.error('Failed to refresh fund items:', error);
    }
  }, [userId, normalizeFundItem]);

  const addFund = (type) => {
    setNewFundItemType(type);
    setIsCreatingFundItem(true);
    setSelectedFundItem(null);
    setFundItemModalVisible(true);
  };

  const handleFundItemPress = (fund) => {
    setSelectedFundItem(fund);
    setIsCreatingFundItem(false);
    setNewFundItemType(null);
    setFundItemModalVisible(true);
  };

  const handleFundItemModalClose = () => {
    setFundItemModalVisible(false);
    setSelectedFundItem(null);
    setIsCreatingFundItem(false);
    setNewFundItemType(null);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      if (updatedItem) {
        setSelectedFundItem(normalizeFundItem(updatedItem));
      }
      await refreshFundItems({ forceRefresh: true });
    } catch (error) {
      console.error('Failed to update fund item state:', error);
    }
  };

  const handleFundItemCreate = async () => {
    try {
      await refreshFundItems({ forceRefresh: true });
    } catch (error) {
      console.error('Failed to refresh fund items after creation:', error);
    } finally {
      handleFundItemModalClose();
    }
  };

  const handleFundItemDelete = async (id) => {
    try {
      setFunds((prev) => prev.filter((fund) => fund.id !== id));
      await refreshFundItems({ forceRefresh: true });
    } catch (error) {
      console.error('Failed to refresh fund items after deletion:', error);
    } finally {
      handleFundItemModalClose();
    }
  };


  const validate = () => {
    // Disable all required checks to support progressive entry info filling
    setErrors({});
    return true;
  };

  const handleContinue = async () => {
    await handleNavigationWithSave(
      () => navigation.navigate('SingaporeEntryFlow', { passport, destination }),
      'continue'
    );
  };

  const handleGoBack = async () => {
    await handleNavigationWithSave(
      () => navigation.goBack(),
      'go back'
    );
  };

  

  const processTicketOCRResult = async (ocrResult) => {
    console.log('Processing ticket OCR result:', ocrResult);
    
    // Extract and set flight information
    if (ocrResult.flightNumber) {
      // Determine if this is arrival or departure flight based on current context
      // If arrival flight is empty, assume this is arrival flight
      if (!arrivalFlightNumber || arrivalFlightNumber.trim() === '') {
        setArrivalFlightNumber(ocrResult.flightNumber);
        setLastEditedField('arrivalFlightNumber');
      } else if (!departureFlightNumber || departureFlightNumber.trim() === '') {
        // If arrival is filled but departure is empty, assume this is departure
        setDepartureFlightNumber(ocrResult.flightNumber);
        setLastEditedField('departureFlightNumber');
      } else {
        // Both are filled, ask user which one to update
        Alert.alert(
          t('singapore.travelInfo.scan.flightChoiceTitle', { defaultValue: '选择航班' }),
          t('singapore.travelInfo.scan.flightChoiceMessage', { 
            defaultValue: '检测到航班号 {flightNumber}，请选择要更新的航班信息',
            flightNumber: ocrResult.flightNumber 
          }),
          [
            {
              text: t('singapore.travelInfo.scan.arrivalFlight', { defaultValue: '入境航班' }),
              onPress: () => {
                setArrivalFlightNumber(ocrResult.flightNumber);
                setLastEditedField('arrivalFlightNumber');
              }
            },
            {
              text: t('singapore.travelInfo.scan.departureFlight', { defaultValue: '离境航班' }),
              onPress: () => {
                setDepartureFlightNumber(ocrResult.flightNumber);
                setLastEditedField('departureFlight');
              }
            },
            {
              text: t('common.cancel', { defaultValue: '取消' }),
              style: 'cancel'
            }
          ]
        );
        return; // Don't process dates if user needs to choose
      }
    }

    // Set arrival date if detected and arrival flight was updated
    if (ocrResult.arrivalDate && (ocrResult.flightNumber === arrivalFlightNumber || !departureFlightNumber)) {
      const formattedDate = formatDateForInput(ocrResult.arrivalDate);
      if (formattedDate) {
        setArrivalArrivalDate(formattedDate);
        setLastEditedField('arrivalArrivalDate');
      }
    }

    // Set departure city as boarding country if available
    if (ocrResult.departureCity) {
      // Try to map city to country code
      const countryCode = mapCityToCountryCode(ocrResult.departureCity);
      if (countryCode) {
        setBoardingCountry(countryCode);
        setLastEditedField('boardingCountry');
      }
    }
  };

  const processHotelOCRResult = async (ocrResult) => {
    console.log('Processing hotel OCR result:', ocrResult);
    
    // Set hotel address
    if (ocrResult.address) {
      setHotelAddress(ocrResult.address);
      setLastEditedField('hotelAddress');
    } else if (ocrResult.hotelName) {
      // If no address but hotel name is available, use hotel name as address
      setHotelAddress(ocrResult.hotelName);
      setLastEditedField('hotelAddress');
    }

    // Set check-in date as arrival date if not already set
    if (ocrResult.checkIn && (!arrivalArrivalDate || arrivalArrivalDate.trim() === '')) {
      const formattedDate = formatDateForInput(ocrResult.checkIn);
      if (formattedDate) {
        setArrivalArrivalDate(formattedDate);
        setLastEditedField('arrivalArrivalDate');
      }
    }

    // Set check-out date as departure date if not already set
    if (ocrResult.checkOut && (!departureDepartureDate || departureDepartureDate.trim() === '')) {
      const formattedDate = formatDateForInput(ocrResult.checkOut);
      if (formattedDate) {
        setDepartureDepartureDate(formattedDate);
        setLastEditedField('departureDepartureDate');
      }
    }

    // Extract province from address if possible
    if (ocrResult.address && (!province || province.trim() === '')) {
      const extractedProvince = extractProvinceFromAddress(ocrResult.address);
      if (extractedProvince) {
        setProvince(extractedProvince);
        setLastEditedField('province');
      }
    }
  };

  // Helper function to format date from OCR result to YYYY-MM-DD format
  const formatDateForInput = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Try different date formats that might come from OCR
      const dateFormats = [
        /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY or DD-MM-YYYY
        /(\d{4})年(\d{1,2})月(\d{1,2})日/, // Chinese format
        /(\d{1,2})月(\d{1,2})日/, // Chinese format without year
      ];

      for (const format of dateFormats) {
        const match = dateString.match(format);
        if (match) {
          let year, month, day;
          
          if (format.source.includes('年')) {
            // Chinese format
            if (match.length === 4) {
              [, year, month, day] = match;
            } else {
              // No year, use current year
              year = new Date().getFullYear().toString();
              [, month, day] = match;
            }
          } else if (match[1].length === 4) {
            // YYYY-MM-DD format
            [, year, month, day] = match;
          } else {
            // Assume DD/MM/YYYY for international documents
            [, day, month, year] = match;
          }

          // Validate and format
          const y = parseInt(year);
          const m = parseInt(month);
          const d = parseInt(day);

          if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
          }
        }
      }
    } catch (error) {
      console.error('Date formatting error:', error);
    }
    
    return null;
  };

  // Helper function to map city names to country codes
  const mapCityToCountryCode = (cityName) => {
    if (!cityName) return null;
    
    const cityToCountry = {
      // Major Chinese cities
      '北京': 'CHN', '上海': 'CHN', '广州': 'CHN', '深圳': 'CHN', '成都': 'CHN',
      '杭州': 'CHN', '南京': 'CHN', '武汉': 'CHN', '西安': 'CHN', '重庆': 'CHN',
      'Beijing': 'CHN', 'Shanghai': 'CHN', 'Guangzhou': 'CHN', 'Shenzhen': 'CHN',
      'Chengdu': 'CHN', 'Hangzhou': 'CHN', 'Nanjing': 'CHN', 'Wuhan': 'CHN',
      
      // Major international cities
      'Bangkok': 'THA', '曼谷': 'THA',
      'Singapore': 'SGP', '新加坡': 'SGP',
      'Tokyo': 'JPN', '东京': 'JPN', 'Osaka': 'JPN', '大阪': 'JPN',
      'Seoul': 'KOR', '首尔': 'KOR',
      'Hong Kong': 'HKG', '香港': 'HKG',
      'Taipei': 'TWN', '台北': 'TWN',
      'Kuala Lumpur': 'MYS', '吉隆坡': 'MYS',
      'New York': 'USA', '纽约': 'USA', 'Los Angeles': 'USA', '洛杉矶': 'USA',
      'London': 'GBR', '伦敦': 'GBR',
      'Paris': 'FRA', '巴黎': 'FRA',
      'Sydney': 'AUS', '悉尼': 'AUS',
      'Vancouver': 'CAN', '温哥华': 'CAN', 'Toronto': 'CAN', '多伦多': 'CAN',
    };

    // Direct match
    if (cityToCountry[cityName]) {
      return cityToCountry[cityName];
    }

    // Partial match (case insensitive)
    const cityLower = cityName.toLowerCase();
    for (const [city, country] of Object.entries(cityToCountry)) {
      if (city.toLowerCase().includes(cityLower) || cityLower.includes(city.toLowerCase())) {
        return country;
      }
    }

    return null;
  };

  // Helper function to extract region from address
  const extractProvinceFromAddress = (address) => {
    if (!address) return null;

    // Common Singapore region/area names (English and Chinese)
    const commonRegions = [
      'Orchard', 'Marina Bay', 'Sentosa', 'Changi', 'Jurong', 'Woodlands',
      'Tampines', 'Bedok', 'Hougang', 'Punggol', 'Sengkang', 'Yishun',
      'Ang Mo Kio', 'Bishan', 'Clementi', 'Bukit Timah', 'Geylang',
      '乌节', '滨海湾', '圣淘沙', '樟宜', '裕廊', '兀兰',
      '淡滨尼', '勿洛', '后港', '榜鹅', '盛港', '义顺',
      '宏茂桥', '碧山', '金文泰', '武吉知马', '芽笼'
    ];

    // Try to match Singapore regions from address
    for (const region of commonRegions) {
      if (address.toLowerCase().includes(region.toLowerCase())) {
        // Find the matching region code from singaporeRegions
        const matchedRegion = singaporeRegions.find(r =>
          r.name.toLowerCase() === region.toLowerCase() ||
          r.nameZh === region
        );
        return matchedRegion ? matchedRegion.code : null;
      }
    }

    return null;
  };

  const renderGenderOptions = () => {
    const options = GENDER_OPTIONS.map(option => ({
      value: option.value,
      label: t(option.translationKey, { defaultValue: option.defaultLabel })
    }));

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
              onPress={() => {
                setSex(option.value);
                // Trigger debounced save after gender selection
                debouncedSaveData();
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
        <Text style={styles.headerTitle}>{t('singapore.travelInfo.headerTitle', { defaultValue: '新加坡入境信息' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('singapore.travelInfo.loading', { defaultValue: '正在加载数据...' })}</Text>
        </View>
      )}

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContainer}
        onScroll={(event) => {
          const currentScrollPosition = event.nativeEvent.contentOffset.y;
          setScrollPosition(currentScrollPosition);
        }}
        scrollEventThrottle={100}
      >
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇸🇬</Text>
          <Text style={styles.title}>欢迎来到新加坡！🌺</Text>
          <Text style={styles.subtitle}>让我们准备好你的新加坡冒险之旅</Text>
          
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
                {saveStatus === 'pending' && t('singapore.travelInfo.saveStatus.pending', { defaultValue: '等待保存...' })}
                {saveStatus === 'saving' && t('singapore.travelInfo.saveStatus.saving', { defaultValue: '正在保存...' })}
                {saveStatus === 'saved' && t('singapore.travelInfo.saveStatus.saved', { defaultValue: '已保存' })}
                {saveStatus === 'error' && t('singapore.travelInfo.saveStatus.error', { defaultValue: '保存失败' })}
              </Text>
              {saveStatus === 'error' && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setSaveStatus('saving');
                    debouncedSaveData();
                  }}
                >
                  <Text style={styles.retryButtonText}>
                    {t('singapore.travelInfo.saveStatus.retry', { defaultValue: '重试' })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {/* Last Edited Timestamp */}
          {lastEditedAt && (
            <Text style={styles.lastEditedText}>
              {t('singapore.travelInfo.lastEdited', { 
                defaultValue: 'Last edited: {{time}}',
                time: lastEditedAt.toLocaleTimeString()
              })}
            </Text>
          )}
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('singapore.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        <CollapsibleSection
          title="👤 关于我自己"
          subtitle="让我们认识一下你"
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
           <View style={styles.inputWithValidationContainer}>
             <View style={styles.inputLabelContainer}>
               <Text style={styles.inputLabel}>Full Name</Text>
               <FieldWarningIcon hasWarning={!!warnings.fullName} hasError={!!errors.fullName} />
             </View>
             <PassportNameInput
               value={fullName}
               onChangeText={setFullName}
               onBlur={() => handleFieldBlur('fullName', fullName)}
               helpText="请填写汉语拼音（例如：LI, MAO）- 不要输入中文字符"
               error={!!errors.fullName}
               errorMessage={errors.fullName}
             />
             {warnings.fullName && !errors.fullName && (
               <Text style={styles.warningText}>{warnings.fullName}</Text>
             )}
           </View>
           <NationalitySelector
             label="国籍"
             value={nationality}
             onValueChange={(code) => {
               setNationality(code);
               debouncedSaveData(); // Trigger debounced save when nationality changes
             }}
             helpText="请选择您的国籍"
             error={!!errors.nationality}
             errorMessage={errors.nationality}
           />
           <InputWithValidation 
             label="护照号" 
             value={passportNo} 
             onChangeText={setPassportNo} 
             onBlur={() => handleFieldBlur('passportNo', passportNo)} 
             helpText="请输入您的护照号码" 
             error={!!errors.passportNo} 
             errorMessage={errors.passportNo}
             warning={!!warnings.passportNo}
             warningMessage={warnings.passportNo}
             autoCapitalize="characters" 
             testID="passport-number-input" 
           />
           <InputWithValidation 
             label="签证号（如有）" 
             value={visaNumber} 
             onChangeText={(text) => setVisaNumber(text.toUpperCase())} 
             onBlur={() => handleFieldBlur('visaNumber', visaNumber)} 
             helpText="如有签证，请填写签证号码（仅限字母或数字）" 
             error={!!errors.visaNumber} 
             errorMessage={errors.visaNumber}
             warning={!!warnings.visaNumber}
             warningMessage={warnings.visaNumber}
             autoCapitalize="characters" 
             autoCorrect={false} 
             autoComplete="off" 
             spellCheck={false} 
             keyboardType="ascii-capable" 
           />
           <DateTimeInput
             label="出生日期"
             value={dob}
             onChangeText={(newValue) => {
               setDob(newValue);
               // Trigger validation and save immediately when value changes
               handleFieldBlur('dob', newValue);
             }}
             mode="date"
             dateType="past"
             helpText="选择出生日期"
             error={!!errors.dob}
             errorMessage={errors.dob}
           />
           <DateTimeInput
             label="护照有效期"
             value={expiryDate}
             onChangeText={(newValue) => {
               setExpiryDate(newValue);
               // Trigger validation and save immediately when value changes
               handleFieldBlur('expiryDate', newValue);
             }}
             mode="date"
             dateType="future"
             helpText="选择护照有效期"
             error={!!errors.expiryDate}
             errorMessage={errors.expiryDate}
           />
         </CollapsibleSection>

        <CollapsibleSection
          title="� 个人信息"
          subtitle="新加坡需要了解你的基本信息"
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <InputWithValidation 
             label="职业" 
             value={occupation} 
             onChangeText={(text) => setOccupation(text.toUpperCase())} 
             onBlur={() => handleFieldBlur('occupation', occupation)} 
             helpText="请输入您的职业 (请使用英文)" 
             error={!!errors.occupation} 
             errorMessage={errors.occupation}
             warning={!!warnings.occupation}
             warningMessage={warnings.occupation}
             fieldName="occupation"
             lastEditedField={lastEditedField}
             autoCapitalize="characters" 
           />
           <Input label="居住城市" value={cityOfResidence} onChangeText={(text) => setCityOfResidence(text.toUpperCase())} onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)} helpText="请输入您居住的城市 (请使用英文)" error={!!errors.cityOfResidence} errorMessage={errors.cityOfResidence} autoCapitalize="characters" />
           <NationalitySelector
             label="居住国家"
             value={residentCountry}
             onValueChange={(code) => {
               setResidentCountry(code);
               setPhoneCode(getPhoneCode(code));
               debouncedSaveData(); // Trigger debounced save when country changes
             }}
             helpText="请选择您居住的国家"
             error={!!errors.residentCountry}
             errorMessage={errors.residentCountry}
           />
           <View style={styles.phoneInputContainer}>
             <Input
               label="国家代码"
               value={phoneCode}
               onChangeText={setPhoneCode}
               onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
               keyboardType="phone-pad"
               maxLength={5} // e.g., +886
               error={!!errors.phoneCode}
               errorMessage={errors.phoneCode}
               style={styles.phoneCodeInput}
             />
             <Input
               label="电话号码"
               value={phoneNumber}
               onChangeText={setPhoneNumber}
               onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
               keyboardType="phone-pad"
               helpText="请输入您的电话号码"
               error={!!errors.phoneNumber}
               errorMessage={errors.phoneNumber}
               style={styles.phoneInput}
             />
           </View>
           <InputWithValidation 
             label="电子邮箱" 
             value={email} 
             onChangeText={setEmail} 
             onBlur={() => handleFieldBlur('email', email)} 
             keyboardType="email-address" 
             helpText="请输入您的电子邮箱地址" 
             error={!!errors.email} 
             errorMessage={errors.email}
             warning={!!warnings.email}
             warningMessage={warnings.email}
             fieldName="email"
             lastEditedField={lastEditedField}
             testID="email-input" 
           />
           <View style={styles.fieldContainer}>
             <Text style={styles.fieldLabel}>性别</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        <CollapsibleSection
          title="💰 资金证明"
          subtitle="告诉新加坡你有足够的旅行资金"
          isExpanded={expandedSection === 'funds'}
          onToggle={() => setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
        >
          <View style={styles.fundActions}>
            <Button title="添加现金" onPress={() => addFund('cash')} variant="secondary" style={styles.fundButton} />
            <Button title="添加信用卡照片" onPress={() => addFund('credit_card')} variant="secondary" style={styles.fundButton} />
            <Button title="添加银行账户余额" onPress={() => addFund('bank_balance')} variant="secondary" style={styles.fundButton} />
          </View>

          {funds.length === 0 ? (
            <View style={styles.fundEmptyState}>
              <Text style={styles.fundEmptyText}>
                {t('singapore.travelInfo.funds.empty', { defaultValue: '尚未添加资金证明，请先新建条目。' })}
              </Text>
            </View>
          ) : (
            <View style={styles.fundList}>
              {funds.map((fund, index) => {
                const isLast = index === funds.length - 1;
                const typeKey = (fund.type || 'OTHER').toUpperCase();
                const typeMeta = {
                  CASH: { icon: '💵' },
                  BANK_CARD: { icon: '💳' },
                  CREDIT_CARD: { icon: '💳' },
                  BANK_BALANCE: { icon: '🏦' },
                  DOCUMENT: { icon: '📄' },
                  INVESTMENT: { icon: '📈' },
                  OTHER: { icon: '💰' },
                };
                const defaultTypeLabels = {
                  CASH: 'Cash',
                  BANK_CARD: 'Bank Card',
                  CREDIT_CARD: 'Bank Card',
                  BANK_BALANCE: 'Bank Balance',
                  DOCUMENT: 'Supporting Document',
                  INVESTMENT: 'Investment',
                  OTHER: 'Funding',
                };
                const typeIcon = (typeMeta[typeKey] || typeMeta.OTHER).icon;
                const typeLabel = t(`fundItem.types.${typeKey}`, {
                  defaultValue: defaultTypeLabels[typeKey] || defaultTypeLabels.OTHER,
                });
                const notProvidedLabel = t('fundItem.detail.notProvided', {
                  defaultValue: 'Not provided yet',
                });

                const normalizeAmount = (value) => {
                  if (value === null || value === undefined || value === '') return '';
                  if (typeof value === 'number' && Number.isFinite(value)) {
                    return value.toLocaleString();
                  }
                  if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (!trimmed) return '';
                    const parsed = Number(trimmed.replace(/,/g, ''));
                    return Number.isNaN(parsed) ? trimmed : parsed.toLocaleString();
                  }
                  return `${value}`;
                };

                const amountValue = normalizeAmount(fund.amount);
                const currencyValue = fund.currency ? fund.currency.toUpperCase() : '';
                const detailsValue = fund.details || '';

                let displayText;
                if (typeKey === 'DOCUMENT') {
                  displayText = detailsValue || notProvidedLabel;
                } else if (typeKey === 'BANK_CARD' || typeKey === 'CREDIT_CARD') {
                  const cardLabel = detailsValue || notProvidedLabel;
                  const amountLabel = amountValue || notProvidedLabel;
                  const currencyLabel = currencyValue || notProvidedLabel;
                  displayText = `${cardLabel} • ${amountLabel} ${currencyLabel}`.trim();
                } else if (['CASH', 'BANK_BALANCE', 'INVESTMENT'].includes(typeKey)) {
                  const amountLabel = amountValue || notProvidedLabel;
                  const currencyLabel = currencyValue || notProvidedLabel;
                  displayText = `${amountLabel} ${currencyLabel}`.trim();
                } else {
                  displayText = detailsValue || amountValue || currencyValue || notProvidedLabel;
                }

                if (fund.photo && typeKey !== 'CASH') {
                  const photoLabel = t('fundItem.detail.photoAttached', { defaultValue: 'Photo attached' });
                  displayText = `${displayText} • ${photoLabel}`;
                }

                return (
                  <TouchableOpacity
                    key={fund.id}
                    style={[styles.fundListItem, !isLast && styles.fundListItemDivider]}
                    onPress={() => handleFundItemPress(fund)}
                    accessibilityRole="button"
                  >
                    <View style={styles.fundListItemContent}>
                      <Text style={styles.fundItemIcon}>{typeIcon}</Text>
                      <View style={styles.fundItemDetails}>
                        <Text style={styles.fundItemTitle}>{typeLabel}</Text>
                        <Text style={styles.fundItemSubtitle} numberOfLines={2}>
                          {displayText}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.fundListItemArrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="✈️ 旅行计划"
          subtitle="你的新加坡冒险之旅"
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>旅行目的</Text>
            <OptionSelector
              options={TRAVEL_PURPOSE_OPTIONS}
              value={travelPurpose}
              onSelect={(value) => {
                setTravelPurpose(value);
                if (value !== 'OTHER') {
                  setCustomTravelPurpose('');
                }
                // Trigger debounced save after purpose selection
                debouncedSaveData();
              }}
              customValue={customTravelPurpose}
              onCustomChange={setCustomTravelPurpose}
              onCustomBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
              customLabel="请输入旅行目的"
              customPlaceholder="请输入您的旅行目的"
              customHelpText="请用英文填写"
            />
          </View>

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>来程机票（入境新加坡）</Text>
          </View>
          <NationalitySelector
            label="登机国家或地区"
            value={boardingCountry}
            onValueChange={(code) => {
              setBoardingCountry(code);
              debouncedSaveData(); // Trigger debounced save when boarding country changes
            }}
            helpText="请选择您登机的国家或地区"
            error={!!errors.boardingCountry}
            errorMessage={errors.boardingCountry}
          />
          <InputWithValidation 
            label="航班号" 
            value={arrivalFlightNumber} 
            onChangeText={setArrivalFlightNumber} 
            onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)} 
            helpText="请输入您的抵达航班号" 
            error={!!errors.arrivalFlightNumber} 
            errorMessage={errors.arrivalFlightNumber}
            warning={!!warnings.arrivalFlightNumber}
            warningMessage={warnings.arrivalFlightNumber}
            fieldName="arrivalFlightNumber"
            lastEditedField={lastEditedField}
            autoCapitalize="characters" 
          />
          <DateTimeInput 
            label="抵达日期" 
            value={arrivalArrivalDate} 
            onChangeText={(newValue) => {
              setArrivalArrivalDate(newValue);
              // Trigger validation and save immediately when value changes
              handleFieldBlur('arrivalArrivalDate', newValue);
            }}
            mode="date"
            dateType="future"
            helpText="格式: YYYY-MM-DD"
            error={!!errors.arrivalArrivalDate} 
            errorMessage={errors.arrivalArrivalDate}
          />

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>去程机票（离开新加坡）</Text>
          </View>
          <Input label="航班号" value={departureFlightNumber} onChangeText={setDepartureFlightNumber} onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)} helpText="请输入您的离开航班号" error={!!errors.departureFlightNumber} errorMessage={errors.departureFlightNumber} autoCapitalize="characters" />
          <DateTimeInput 
            label="出发日期" 
            value={departureDepartureDate} 
            onChangeText={(newValue) => {
              console.log('=== DEPARTURE DATE CHANGE ===');
              console.log('New departure date value:', newValue);
              console.log('Previous departure date value:', departureDepartureDate);
              console.log('Setting state and triggering save...');
              
              setDepartureDepartureDate(newValue);
              
              // Use setTimeout to ensure state has updated before saving
              setTimeout(() => {
                console.log('State after update:', newValue);
                handleFieldBlur('departureDepartureDate', newValue);
              }, 0);
            }}
            mode="date"
            dateType="future"
            helpText="格式: YYYY-MM-DD"
            error={!!errors.departureDepartureDate} 
            errorMessage={errors.departureDepartureDate}
          />

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>住宿信息</Text>
          </View>

          {/* Transit Passenger Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={async () => {
              const newValue = !isTransitPassenger;
              console.log('=== TRANSIT PASSENGER SELECTED ===');
              console.log('New isTransitPassenger value:', newValue);
              console.log('Previous isTransitPassenger value:', isTransitPassenger);
              
              setIsTransitPassenger(newValue);
              if (newValue) {
                // If transit passenger, set accommodation type to TRANSIT
                setAccommodationType('TRANSIT');
                setCustomAccommodationType('');
                setProvince('');
                setDistrict('');
                setSubDistrict('');
                setPostalCode('');
                setHotelAddress('');
              }

              console.log('Saving immediately with new transit passenger status...');
              // Save immediately with the new value to avoid React state delay
              try {
                const overrides = { isTransitPassenger: newValue };
                if (newValue) {
                  // If becoming transit passenger, set to TRANSIT accommodation
                  overrides.accommodationType = 'TRANSIT';
                  overrides.customAccommodationType = '';
                  overrides.province = '';
                  overrides.district = '';
                  overrides.subDistrict = '';
                  overrides.postalCode = '';
                  overrides.hotelAddress = '';
                }

                await saveDataToSecureStorageWithOverride(overrides);
                setLastEditedAt(new Date());
              } catch (error) {
                console.error('Failed to save transit passenger status:', error);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
              {isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              我是过境旅客，不在新加坡停留
            </Text>
          </TouchableOpacity>

          {!isTransitPassenger && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>住宿类型</Text>
            <OptionSelector
              options={ACCOMMODATION_TYPE_OPTIONS}
              value={accommodationType}
              onSelect={async (value) => {
                console.log('=== ACCOMMODATION TYPE SELECTED ===');
                console.log('Selected option:', value);
                console.log('Previous accommodationType:', accommodationType);

                setAccommodationType(value);

                // Clear all accommodation fields when switching types
                // Fields will be reused differently based on type
                setCustomAccommodationType('');
                setHotelAddress('');
                setPostalCode('');
                setDistrict('');
                setSubDistrict('');

                console.log('Saving immediately with new accommodation type...');
                // Save immediately with the new value to avoid React state delay
                try {
                  await saveDataToSecureStorageWithOverride({
                    accommodationType: value,
                    customAccommodationType: '',
                    hotelAddress: '',
                    postalCode: '',
                    district: '',
                    subDistrict: ''
                  });
                  setLastEditedAt(new Date());
                } catch (error) {
                  console.error('Failed to save accommodation type:', error);
                }
              }}
            />
          </View>
          )}
          
          {/* Accommodation fields based on type - matching SGAC requirements */}
          {!isTransitPassenger && accommodationType === 'HOTEL' && (
            <>
              <Input
                label="酒店/旅舍名称"
                value={customAccommodationType}
                onChangeText={setCustomAccommodationType}
                onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                helpText="请输入酒店、宾馆或青旅名称"
                error={!!errors.customAccommodationType}
                errorMessage={errors.customAccommodationType}
                autoCapitalize="words"
              />
              <Input
                label="酒店地址"
                value={hotelAddress}
                onChangeText={setHotelAddress}
                onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
                multiline
                helpText="请输入酒店完整地址"
                error={!!errors.hotelAddress}
                errorMessage={errors.hotelAddress}
                autoCapitalize="words"
              />
            </>
          )}

          {!isTransitPassenger && accommodationType === 'RESIDENTIAL' && (
            <>
              <Input
                label="邮政编码"
                value={postalCode}
                onChangeText={setPostalCode}
                onBlur={() => handleFieldBlur('postalCode', postalCode)}
                helpText="新加坡邮政编码（6位数字）"
                error={!!errors.postalCode}
                errorMessage={errors.postalCode}
                keyboardType="numeric"
                maxLength={6}
              />
              <Input
                label="楼栋号"
                value={district}
                onChangeText={setDistrict}
                onBlur={() => handleFieldBlur('district', district)}
                helpText="Block Number（例如：123）"
                error={!!errors.district}
                errorMessage={errors.district}
                autoCapitalize="words"
              />
              <Input
                label="街道名称"
                value={subDistrict}
                onChangeText={setSubDistrict}
                onBlur={() => handleFieldBlur('subDistrict', subDistrict)}
                helpText="Street Name（例如：Orchard Road）"
                error={!!errors.subDistrict}
                errorMessage={errors.subDistrict}
                autoCapitalize="words"
              />
              <Input
                label="建筑名称"
                value={customAccommodationType}
                onChangeText={setCustomAccommodationType}
                onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                helpText="Building Name（例如：Marina Bay Residences）"
                error={!!errors.customAccommodationType}
                errorMessage={errors.customAccommodationType}
                autoCapitalize="words"
              />
              <Input
                label="单元号"
                value={hotelAddress}
                onChangeText={setHotelAddress}
                onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
                helpText="Unit Number（例如：#12-34）"
                error={!!errors.hotelAddress}
                errorMessage={errors.hotelAddress}
                autoCapitalize="words"
              />
            </>
          )}
        </CollapsibleSection>

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
                    <Text style={styles.completionBadgeText}>新加坡准备就绪！🌴</Text>
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
              {totalCompletionPercent < 30
                ? '🌟 第一步，从介绍自己开始吧！'
                : totalCompletionPercent < 60
                ? '🎉 太棒了！继续保持这个节奏'
                : '🚀 快要完成了，你的新加坡之旅近在咫尺！'
              }
            </Text>
          )}

          {/* Travel-Focused Next Steps */}
          {totalCompletionPercent < 100 && (
            <Text style={styles.nextStepHint}>
              {totalCompletionPercent < 25
                ? '💡 从护照信息开始，告诉新加坡你是谁'
                : totalCompletionPercent < 50
                ? '� 填加写个人信息，让新加坡更了解你'
                : totalCompletionPercent < 75
                ? '💰 展示你的资金证明，新加坡想确保你玩得开心'
                : '✈️ 最后一步，分享你的旅行计划吧！'
              }
            </Text>
          )}
        </View>
      </ScrollView>

      <FundItemDetailModal
        visible={fundItemModalVisible}
        fundItem={isCreatingFundItem ? null : selectedFundItem}
        isCreateMode={isCreatingFundItem}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
  nextStepHint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
    fontSize: 12,
    paddingHorizontal: spacing.md,
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
});

export default SingaporeTravelInfoScreen;
