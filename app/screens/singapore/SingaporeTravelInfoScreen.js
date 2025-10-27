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
import { NationalitySelector, PassportNameInput, DateTimeInput, SingaporeDistrictSelector } from '../../components';
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
// Import custom hooks for state management
import {
  useSingaporeFormState,
  useSingaporeDataPersistence,
  useSingaporeValidation,
} from '../../hooks/singapore';

// Import section components (for future integration)
// import {
//   PassportSectionContent,
//   PersonalInfoSectionContent,
//   FundsSectionContent,
// } from '../../components/singapore/sections';

// Import styles
import { styles } from './SingaporeTravelInfoScreen.styles';

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
  const [formState.isLoading, setIsLoading] = useState(true);
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


  // ===================================================================
  // CUSTOM HOOKS INTEGRATION - Replaces 49+ useState declarations
  // ===================================================================

  // Initialize form state hook - manages all form state
  const formState = useSingaporeFormState(passport);

  // Initialize data persistence hook - handles loading, saving, session management
  const persistence = useSingaporeDataPersistence({
    passport,
    destination,
    userId,
    formState,
    travelInfoForm,
    navigation,
  });

  // Initialize validation hook - handles validation, completion tracking
  const validation = useSingaporeValidation({
    formState,
    travelInfoForm,
    saveDataToSecureStorage: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData,
  });

  // Extract commonly used functions from hooks
  const {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  } = validation;

  const {
    loadData,
    saveDataToSecureStorage,
    debouncedSaveData,
    refreshFundItems,
    normalizeFundItem,
    scrollViewRef,
    shouldRestoreScrollPosition,
  } = persistence;

  // ===================================================================
  // END CUSTOM HOOKS INTEGRATION
  // ===================================================================
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !travelInfoForm.isInitialized) {
      return;
    }

    console.log('=== MIGRATING EXISTING DATA TO INTERACTION STATE (SINGAPORE) ===');
    await travelInfoForm.initializeWithExistingData(userData);
  }, [travelInfoForm]);

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

  // ===================================================================
  // DATA LOADING - Using persistence hook (replaces 200+ lines)
  // ===================================================================
  useEffect(() => {
    loadData();
  }, [loadData]); // Only depend on userId, not the entire passport object or refreshFundItems

 // Only depend on userId, not the entire passport object or refreshFundItems





  // Monitor save status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('singapore_travel_info');
      formState.setSaveStatus(currentStatus);
    }, 100);

    return () => clearInterval(interval);
  }, [formState]);

  // Recalculate completion metrics when data changes
  useEffect(() => {
    if (!formState.formState.isLoading) {
      calculateCompletionMetrics();
    }
  }, [formState.formState.isLoading, calculateCompletionMetrics]);

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


      setLastEditedAt(new Date());
    },
    300
  );

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
    formState.setNewFundItemType(type);
    formState.setIsCreatingFundItem(true);
    formState.setSelectedFundItem(null);
    formState.setFundItemModalVisible(true);
  };

  const handleFundItemPress = (fund) => {
    formState.setSelectedFundItem(fund);
    formState.setIsCreatingFundItem(false);
    formState.setNewFundItemType(null);
    formState.setFundItemModalVisible(true);
  };

  const handleFundItemModalClose = () => {
    formState.setFundItemModalVisible(false);
    formState.setSelectedFundItem(null);
    formState.setIsCreatingFundItem(false);
    formState.setNewFundItemType(null);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      if (updatedItem) {
        formState.setSelectedFundItem(normalizeFundItem(updatedItem));
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
      formState.setFunds((prev) => prev.filter((fund) => fund.id !== id));
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

      {formState.formState.isLoading && (
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
          {formState.saveStatus && (
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
          {formState.lastEditedAt && (
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
          title="👤 About Yourself / 关于我自己"
          subtitle="Let's get to know you / 让我们认识一下你"
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={() => formState.setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
           <View style={styles.inputWithValidationContainer}>
             <View style={styles.inputLabelContainer}>
               <Text style={styles.inputLabel}>Full Name</Text>
               <FieldWarningIcon hasWarning={!!formState.warnings.fullName} hasError={!!formState.errors.fullName} />
             </View>
             <PassportNameInput
               value={formState.fullName}
               onChangeText={formState.setFullName}
               onBlur={() => handleFieldBlur('fullName', fullName)}
               helpText="请填写汉语拼音（例如：LI, MAO）- 不要输入中文字符"
               error={!!formState.errors.fullName}
               errorMessage={formState.errors.fullName}
             />
             {formState.warnings.fullName && !formState.errors.fullName && (
               <Text style={styles.warningText}>{formState.warnings.fullName}</Text>
             )}
           </View>
           <NationalitySelector
             label="国籍"
             value={formState.nationality}
             onValueChange={(code) => {
               setNationality(code);
               debouncedSaveData(); // Trigger debounced save when nationality changes
             }}
             helpText="请选择您的国籍"
             error={!!formState.errors.nationality}
             errorMessage={formState.errors.nationality}
           />
           <InputWithValidation 
             label="护照号" 
             value={formState.passportNo} 
             onChangeText={formState.setPassportNo} 
             onBlur={() => handleFieldBlur('passportNo', passportNo)} 
             helpText="请输入您的护照号码" 
             error={!!formState.errors.passportNo} 
             errorMessage={formState.errors.passportNo}
             warning={!!formState.warnings.passportNo}
             warningMessage={formState.warnings.passportNo}
             autoCapitalize="characters" 
             testID="passport-number-input" 
           />
           <InputWithValidation 
             label="签证号（如有）" 
             value={formState.visaNumber} 
             onChangeText={(text) => setVisaNumber(text.toUpperCase())} 
             onBlur={() => handleFieldBlur('visaNumber', visaNumber)} 
             helpText="如有签证，请填写签证号码（仅限字母或数字）" 
             error={!!formState.errors.visaNumber} 
             errorMessage={formState.errors.visaNumber}
             warning={!!formState.warnings.visaNumber}
             warningMessage={formState.warnings.visaNumber}
             autoCapitalize="characters" 
             autoCorrect={false} 
             autoComplete="off" 
             spellCheck={false} 
             keyboardType="ascii-capable" 
           />
           <DateTimeInput
             label="出生日期"
             value={formState.dob}
             onChangeText={(newValue) => {
               setDob(newValue);
               // Trigger validation and save immediately when value changes
               handleFieldBlur('dob', newValue);
             }}
             mode="date"
             dateType="past"
             helpText="选择出生日期"
             error={!!formState.errors.dob}
             errorMessage={formState.errors.dob}
           />
           <DateTimeInput
             label="护照有效期"
             value={formState.expiryDate}
             onChangeText={(newValue) => {
               setExpiryDate(newValue);
               // Trigger validation and save immediately when value changes
               handleFieldBlur('expiryDate', newValue);
             }}
             mode="date"
             dateType="future"
             helpText="选择护照有效期"
             error={!!formState.errors.expiryDate}
             errorMessage={formState.errors.expiryDate}
           />
         </CollapsibleSection>

        <CollapsibleSection
          title="ℹ️ Personal Information / 个人信息"
          subtitle="Singapore needs your basic information / 新加坡需要了解你的基本信息"
          isExpanded={formState.expandedSection === 'personal'}
          onToggle={() => formState.setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <InputWithValidation 
             label="职业" 
             value={formState.occupation} 
             onChangeText={(text) => setOccupation(text.toUpperCase())} 
             onBlur={() => handleFieldBlur('occupation', occupation)} 
             helpText="请输入您的职业 (请使用英文)" 
             error={!!formState.errors.occupation} 
             errorMessage={formState.errors.occupation}
             warning={!!formState.warnings.occupation}
             warningMessage={formState.warnings.occupation}
             fieldName="occupation"
             lastEditedField={lastEditedField}
             autoCapitalize="characters" 
           />
           <Input label="居住城市" value={formState.cityOfResidence} onChangeText={(text) => setCityOfResidence(text.toUpperCase())} onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)} helpText="请输入您居住的城市 (请使用英文)" error={!!formState.errors.cityOfResidence} errorMessage={formState.errors.cityOfResidence} autoCapitalize="characters" />
           <NationalitySelector
             label="居住国家"
             value={formState.residentCountry}
             onValueChange={(code) => {
               setResidentCountry(code);
               setPhoneCode(getPhoneCode(code));
               debouncedSaveData(); // Trigger debounced save when country changes
             }}
             helpText="请选择您居住的国家"
             error={!!formState.errors.residentCountry}
             errorMessage={formState.errors.residentCountry}
           />
           <View style={styles.phoneInputContainer}>
             <Input
               label="国家代码"
               value={formState.phoneCode}
               onChangeText={formState.setPhoneCode}
               onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
               keyboardType="phone-pad"
               maxLength={5} // e.g., +886
               error={!!formState.errors.phoneCode}
               errorMessage={formState.errors.phoneCode}
               style={styles.phoneCodeInput}
             />
             <Input
               label="电话号码"
               value={formState.phoneNumber}
               onChangeText={formState.setPhoneNumber}
               onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
               keyboardType="phone-pad"
               helpText="请输入您的电话号码"
               error={!!formState.errors.phoneNumber}
               errorMessage={formState.errors.phoneNumber}
               style={styles.phoneInput}
             />
           </View>
           <InputWithValidation 
             label="电子邮箱" 
             value={formState.email} 
             onChangeText={formState.setEmail} 
             onBlur={() => handleFieldBlur('email', email)} 
             keyboardType="email-address" 
             helpText="请输入您的电子邮箱地址" 
             error={!!formState.errors.email} 
             errorMessage={formState.errors.email}
             warning={!!formState.warnings.email}
             warningMessage={formState.warnings.email}
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
          title="💰 Funds Proof / 资金证明"
          subtitle="Show Singapore you have enough funds for your trip / 告诉新加坡你有足够的旅行资金"
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={() => formState.setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
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
          title="✈️ Travel Plans / 旅行计划"
          subtitle="Your Singapore adventure / 你的新加坡冒险之旅"
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={() => formState.setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>旅行目的</Text>
            <OptionSelector
              options={TRAVEL_PURPOSE_OPTIONS}
              value={formState.travelPurpose}
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
            value={formState.boardingCountry}
            onValueChange={(code) => {
              setBoardingCountry(code);
              debouncedSaveData(); // Trigger debounced save when boarding country changes
            }}
            helpText="请选择您登机的国家或地区"
            error={!!formState.errors.boardingCountry}
            errorMessage={formState.errors.boardingCountry}
          />
          <InputWithValidation 
            label="航班号" 
            value={formState.arrivalFlightNumber} 
            onChangeText={formState.setArrivalFlightNumber} 
            onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)} 
            helpText="请输入您的抵达航班号" 
            error={!!formState.errors.arrivalFlightNumber} 
            errorMessage={formState.errors.arrivalFlightNumber}
            warning={!!formState.warnings.arrivalFlightNumber}
            warningMessage={formState.warnings.arrivalFlightNumber}
            fieldName="arrivalFlightNumber"
            lastEditedField={lastEditedField}
            autoCapitalize="characters" 
          />
          <DateTimeInput 
            label="抵达日期" 
            value={formState.arrivalArrivalDate} 
            onChangeText={(newValue) => {
              setArrivalArrivalDate(newValue);
              // Trigger validation and save immediately when value changes
              handleFieldBlur('arrivalArrivalDate', newValue);
            }}
            mode="date"
            dateType="future"
            helpText="格式: YYYY-MM-DD"
            error={!!formState.errors.arrivalArrivalDate} 
            errorMessage={formState.errors.arrivalArrivalDate}
          />

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>去程机票（离开新加坡）</Text>
          </View>
          <Input label="航班号" value={formState.departureFlightNumber} onChangeText={formState.setDepartureFlightNumber} onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)} helpText="请输入您的离开航班号" error={!!formState.errors.departureFlightNumber} errorMessage={formState.errors.departureFlightNumber} autoCapitalize="characters" />
          <DateTimeInput 
            label="出发日期" 
            value={formState.departureDepartureDate} 
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
            error={!!formState.errors.departureDepartureDate} 
            errorMessage={formState.errors.departureDepartureDate}
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
              {formState.isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
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
              value={formState.accommodationType}
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
                label="Hotel/Hostel Name / 酒店/旅舍名称"
                value={formState.customAccommodationType}
                onChangeText={formState.setCustomAccommodationType}
                onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                helpText="Enter hotel, guesthouse or hostel name / 请输入酒店、宾馆或青旅名称"
                error={!!formState.errors.customAccommodationType}
                errorMessage={formState.errors.customAccommodationType}
                autoCapitalize="words"
              />
              <Input
                label="Hotel Address / 酒店地址"
                value={formState.hotelAddress}
                onChangeText={formState.setHotelAddress}
                onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
                multiline
                helpText="Enter complete hotel address / 请输入酒店完整地址"
                error={!!formState.errors.hotelAddress}
                errorMessage={formState.errors.hotelAddress}
                autoCapitalize="words"
              />
            </>
          )}

          {!isTransitPassenger && accommodationType === 'RESIDENTIAL' && (
            <>
              <SingaporeDistrictSelector
                label="Planning Area / 规划区"
                value={formState.province}
                onSelect={(selection) => {
                  if (!selection) return;
                  setProvince(selection.name);
                  handleFieldBlur('province', selection.name);
                }}
                helpText="Select your planning area in Singapore / 选择您在新加坡的规划区"
                error={!!formState.errors.province}
                errorMessage={formState.errors.province}
              />
              <Input
                label="Postal Code / 邮政编码"
                value={formState.postalCode}
                onChangeText={formState.setPostalCode}
                onBlur={() => handleFieldBlur('postalCode', postalCode)}
                helpText="Singapore postal code (6 digits) / 新加坡邮政编码（6位数字）"
                error={!!formState.errors.postalCode}
                errorMessage={formState.errors.postalCode}
                keyboardType="numeric"
                maxLength={6}
              />
              <Input
                label="Block Number / 楼栋号"
                value={formState.district}
                onChangeText={formState.setDistrict}
                onBlur={() => handleFieldBlur('district', district)}
                helpText="e.g., 123 / 例如：123"
                error={!!formState.errors.district}
                errorMessage={formState.errors.district}
                autoCapitalize="words"
              />
              <Input
                label="Street Name / 街道名称"
                value={formState.subDistrict}
                onChangeText={formState.setSubDistrict}
                onBlur={() => handleFieldBlur('subDistrict', subDistrict)}
                helpText="e.g., Orchard Road / 例如：Orchard Road"
                error={!!formState.errors.subDistrict}
                errorMessage={formState.errors.subDistrict}
                autoCapitalize="words"
              />
              <Input
                label="Building Name / 建筑名称"
                value={formState.customAccommodationType}
                onChangeText={formState.setCustomAccommodationType}
                onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                helpText="e.g., Marina Bay Residences / 例如：Marina Bay Residences"
                error={!!formState.errors.customAccommodationType}
                errorMessage={formState.errors.customAccommodationType}
                autoCapitalize="words"
              />
              <Input
                label="Unit Number / 单元号"
                value={formState.hotelAddress}
                onChangeText={formState.setHotelAddress}
                onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
                helpText="e.g., #12-34 / 例如：#12-34"
                error={!!formState.errors.hotelAddress}
                errorMessage={formState.errors.hotelAddress}
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

export default SingaporeTravelInfoScreen;
