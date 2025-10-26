
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
} from 'react-native';
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
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES } from './constants';
import OptionSelector from '../../components/thailand/OptionSelector';
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

  // Data model instances
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);

  // Smart defaults for common scenarios
  const getSmartDefaults = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      travelPurpose: 'HOLIDAY', // Most common purpose
      accommodationType: 'HOTEL', // Most common accommodation
      arrivalDate: tomorrow.toISOString().split('T')[0], // Default to tomorrow
      departureDate: nextWeek.toISOString().split('T')[0], // Default to 1 week later
      boardingCountry: passport?.nationality || 'CHN', // Default to passport nationality
    };
  };

  // Auto-complete suggestions for common scenarios
  const getAutoCompleteSuggestions = (fieldType, currentValue) => {
    const suggestions = {
      flightNumber: [
        'TG123', 'TG456', 'CX123', 'CX456', 'MU123', 'MU456',
        'CA123', 'CA456', 'ZH123', 'ZH456', 'MF123', 'MF456'
      ],
      hotelName: [
        'Bangkok Marriott Hotel', 'Chiang Mai Night Bazaar Hotel',
        'Phuket Patong Beach Hotel', 'Hua Hin Hilton Resort',
        'Centara Grand', 'Anantara', 'Mandarin Oriental',
        'Shangri-La Hotel', 'JW Marriott', 'Hilton'
      ],
      occupation: [
        '软件工程师', '学生', '教师', '医生', '律师', '会计师',
        '销售经理', '退休人员', '家庭主妇', '自由职业者'
      ]
    };

    if (!currentValue || currentValue.length < 2) return [];

    return suggestions[fieldType]?.filter(item =>
      item.toLowerCase().includes(currentValue.toLowerCase())
    ).slice(0, 5) || [];
  };

  // UI State (loaded from database, not from route params)
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [surname, setSurname] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [givenName, setGivenName] = useState('');
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

  const isChineseResidence = residentCountry === 'CHN';
  const cityOfResidenceLabel = isChineseResidence ? '居住省份' : '居住省份 / 城市';
  const cityOfResidenceHelpText = isChineseResidence
    ? '中国地址请填写所在省份（请使用英文，例如 Anhui）'
    : '请输入您居住的省份或城市 (请使用英文)';
  const cityOfResidencePlaceholder = isChineseResidence
    ? '例如 Anhui, Guangdong'
    : '例如 Anhui, Shanghai';

  // Proof of Funds State
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [currentFundItem, setCurrentFundItem] = useState(null);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // Entry Info State - for tracking the entry pack
  const [entryInfoId, setEntryInfoId] = useState(null);
  const [entryInfoInitialized, setEntryInfoInitialized] = useState(false);

  // Travel Info State - with smart defaults
  const smartDefaults = getSmartDefaults();
  const [travelPurpose, setTravelPurpose] = useState('');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [recentStayCountry, setRecentStayCountry] = useState('');
  const [boardingCountry, setBoardingCountry] = useState(''); // 登机国家或地区
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState(smartDefaults.arrivalDate);
  const [previousArrivalDate, setPreviousArrivalDate] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState(smartDefaults.departureDate);
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationType, setAccommodationType] = useState('HOTEL'); // 住宿类型
  const [customAccommodationType, setCustomAccommodationType] = useState(''); // 自定义住宿类型
  const [province, setProvince] = useState(''); // 省
  const [district, setDistrict] = useState(''); // 区（地区）
  const [districtId, setDistrictId] = useState(null); // 区ID
  const [subDistrict, setSubDistrict] = useState(''); // 乡（子地区）
  const [subDistrictId, setSubDistrictId] = useState(null); // 乡ID
  const [postalCode, setPostalCode] = useState(''); // 邮政编码
  const [hotelAddress, setHotelAddress] = useState('');

  useEffect(() => {
    if (!province || !district) {
      if (districtId !== null) {
        setDistrictId(null);
      }
      return;
    }

    const match = findDistrictOption(province, district);
    if (match && match.id !== districtId) {
      setDistrictId(match.id);
    }
  }, [province, district, districtId]);

  useEffect(() => {
    if (!districtId || !subDistrict) {
      if (subDistrictId !== null) {
        setSubDistrictId(null);
      }
      return;
    }

    const match = findSubDistrictOption(districtId, subDistrict);
    if (match && match.id !== subDistrictId) {
      setSubDistrictId(match.id);
      if (!postalCode && match.postalCode) {
        setPostalCode(String(match.postalCode));
      }
    }
  }, [districtId, subDistrict, subDistrictId, postalCode]);

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

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('thailand_travel_info');

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

      setCompletionMetrics(summary.metrics);
      setTotalCompletionPercent(summary.totalPercent);

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
          const destinationId = destination?.id || 'thailand';
          const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
          if (travelInfo) {
            userData.travelInfo = travelInfo;
          }
        } catch (travelInfoError) {
          console.log('Failed to load travel info for migration:', travelInfoError);
        }

        // Wait for interaction tracker to be initialized before migration
        if (userInteractionTracker.isInitialized) {
          await migrateExistingDataToInteractionState(userData);
        } else {
          // If not initialized yet, wait a bit and try again
          setTimeout(async () => {
            if (userInteractionTracker.isInitialized) {
              await migrateExistingDataToInteractionState(userData);
            }
          }, 100);
        }

        // Passport Info - prioritize centralized data, fallback to route params
        const passportInfo = userData?.passport;
        if (passportInfo) {
          console.log('Loading passport from database:', passportInfo);
          setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');
          const nameToParse = passportInfo?.fullName || passport?.nameEn || passport?.name || '';
          if (nameToParse) {
            const { surname, middleName, givenName } = parsePassportName(nameToParse);
            setSurname(surname);
            setMiddleName(middleName);
            setGivenName(givenName);
          }
          setNationality(passportInfo.nationality || passport?.nationality || '');
          setDob(passportInfo.dateOfBirth || passport?.dob || '');
          setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');

          // Store passport data model instance
          setPassportData(passportInfo);
        } else {
          console.log('No passport data in database, using route params');
          // Fallback to route params if no centralized data
          setPassportNo(passport?.passportNo || '');
          const nameToParse = passport?.nameEn || passport?.name || '';
          if (nameToParse) {
            const { surname, middleName, givenName } = parsePassportName(nameToParse);
            setSurname(surname);
            setMiddleName(middleName);
            setGivenName(givenName);
          }
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
          const destinationId = destination?.id || 'thailand';
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
            const predefinedPurposes = PREDEFINED_TRAVEL_PURPOSES;
            const loadedPurpose = travelInfo.travelPurpose || 'HOLIDAY';
            if (predefinedPurposes.includes(loadedPurpose)) {
              setTravelPurpose(loadedPurpose);
              setCustomTravelPurpose('');
            } else {
              // Custom purpose - set to OTHER and store custom value
              setTravelPurpose('OTHER');
              setCustomTravelPurpose(loadedPurpose);
            }
            setBoardingCountry(travelInfo.boardingCountry || '');
            setRecentStayCountry(travelInfo.recentStayCountry || '');
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
            const predefinedAccommodationTypes = PREDEFINED_ACCOMMODATION_TYPES;
            const loadedAccommodationType = travelInfo.accommodationType || 'HOTEL';
            if (predefinedAccommodationTypes.includes(loadedAccommodationType)) {
            setAccommodationType(loadedAccommodationType);
            setCustomAccommodationType('');
          } else {
            // Custom accommodation type - set to OTHER and store custom value
            setAccommodationType('OTHER');
            setCustomAccommodationType(loadedAccommodationType);
          }
          setProvince(travelInfo.province || '');
          setDistrict(travelInfo.district || '');
          const matchedDistrict = findDistrictOption(travelInfo.province || province, travelInfo.district || '');
          setDistrictId(matchedDistrict?.id || null);
          setSubDistrict(travelInfo.subDistrict || '');
          const matchedSubDistrict = findSubDistrictOption(
            matchedDistrict?.id || travelInfo.districtId || null,
            travelInfo.subDistrict || ''
          );
          setSubDistrictId(matchedSubDistrict?.id || null);
          setPostalCode(travelInfo.postalCode || '');
          setHotelAddress(travelInfo.hotelAddress || '');
            
            console.log('Travel info loaded and state updated');
            
            // Initialize user interaction tracker with loaded travel info
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
              customTravelPurpose: travelInfo.travelPurpose && !predefinedPurposes.includes(travelInfo.travelPurpose) ? travelInfo.travelPurpose : '',
              customAccommodationType: travelInfo.accommodationType && !predefinedAccommodationTypes.includes(travelInfo.accommodationType) ? travelInfo.accommodationType : ''
            });
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
        const nameToParse = passport?.nameEn || passport?.name || '';
        if (nameToParse) {
          const { surname, middleName, givenName } = parsePassportName(nameToParse);
          setSurname(surname);
          setMiddleName(middleName);
          setGivenName(givenName);
        }
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
      setSaveStatus(currentStatus);
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
      setSaveStatus('saving');
      
      // Flush any pending saves before navigation
      await DebouncedSave.flushPendingSave('thailand_travel_info');
      
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





  // Create debounced save function with error handling
  const debouncedSaveData = DebouncedSave.debouncedSave(
    'thailand_travel_info',
    async () => {
      await saveDataToSecureStorage();
      setLastEditedAt(new Date());
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
  }, [userInteractionTracker, debouncedSaveData]);

  const handleFieldBlur = async (fieldName, fieldValue) => {
    try {
      // Mark field as user-modified for interaction tracking
      userInteractionTracker.markFieldAsModified(fieldName, fieldValue);

      // Track last edited field for session state
      setLastEditedField(fieldName);

      // Brief highlight animation for last edited field
      if (fieldName) {
        if (window.highlightTimeout) {
          clearTimeout(window.highlightTimeout);
        }
        window.highlightTimeout = setTimeout(() => {
          setLastEditedField(null);
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
          setCityOfResidence(provinceMatch.displayName.toUpperCase());
        }
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

      // Save data if valid (including warnings)
      if (isValid) {
        try {
          const immediateSaveFields = ['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate', 'recentStayCountry'];
          if (immediateSaveFields.includes(fieldName)) {
            await saveDataToSecureStorageWithOverride({ [fieldName]: fieldValue });
            setLastEditedAt(new Date());
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
    setDistrict('');
    setDistrictId(null);
    setSubDistrict('');
    setSubDistrictId(null);
    setPostalCode('');
  }, []);

  const handleProvinceSelect = useCallback((code) => {
    setProvince(code);
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

    setDistrict(selection.nameEn);
    setDistrictId(selection.id);
    handleFieldBlur('district', selection.nameEn);

    if (subDistrict) {
      setSubDistrict('');
      setSubDistrictId(null);
      handleFieldBlur('subDistrict', '');
    }

    if (postalCode) {
      setPostalCode('');
      handleFieldBlur('postalCode', '');
    }
  }, [handleFieldBlur, subDistrict, postalCode]);

  const handleSubDistrictSelect = useCallback((selection) => {
    if (!selection) return;

    setSubDistrict(selection.nameEn);
    setSubDistrictId(selection.id);
    handleFieldBlur('subDistrict', selection.nameEn);

    const newPostalCode = selection.postalCode ? String(selection.postalCode) : '';
    if (newPostalCode || postalCode) {
      setPostalCode(newPostalCode);
      handleFieldBlur('postalCode', newPostalCode);
    }
  }, [handleFieldBlur, postalCode]);

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
      hotelAddress: currentHotelAddress
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
    const currentState = {
      passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
      phoneCode, phoneNumber, email, occupation, cityOfResidence, residentCountry,
      travelPurpose, customTravelPurpose, boardingCountry, recentStayCountry, visaNumber,
      arrivalFlightNumber, arrivalArrivalDate, departureFlightNumber, departureDepartureDate,
      isTransitPassenger, accommodationType, customAccommodationType, province, district,
      subDistrict, postalCode, hotelAddress, existingPassport, interactionState, destination,
      // Entry info tracking
      entryInfoId, passportData, personalInfoData, funds
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
                 const currentState = {
                   passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
                   phoneCode, phoneNumber, email, occupation, cityOfResidence, residentCountry,
                   travelPurpose, customTravelPurpose, boardingCountry, recentStayCountry, visaNumber,
                   arrivalFlightNumber, arrivalArrivalDate, departureFlightNumber, departureDepartureDate,
                   isTransitPassenger, accommodationType, customAccommodationType, province, district,
                   subDistrict, postalCode, hotelAddress, existingPassport, interactionState, destination,
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
      setFunds(normalized);
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

       const destinationId = destination?.id || 'thailand';
       console.log('🔍 Initializing entry info for destination:', destinationId);

       // Try to find existing entry_info for this user and destination
       const existingEntryInfos = await UserDataService.getAllEntryInfosForUser(userId);
       const existingEntryInfo = existingEntryInfos?.find(
         entry => entry.destinationId === destinationId
       );

       if (existingEntryInfo) {
         console.log('✅ Found existing entry info:', existingEntryInfo.id);
         setEntryInfoId(existingEntryInfo.id);
         setEntryInfoInitialized(true);
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

       setEntryInfoId(savedEntryInfo.id);
       setEntryInfoInitialized(true);
       return savedEntryInfo.id;
     } catch (error) {
       console.error('❌ Failed to initialize entry info:', error);
       console.error('Error details:', error.message, error.stack);
       // Don't throw - allow the app to continue even if entry_info creation fails
       return null;
     }
   }, [userId, destination, entryInfoInitialized]);

  const addFund = (type) => {
    setCurrentFundItem(null);
    setNewFundItemType(type);
    setFundItemModalVisible(true);
  };

  const handleFundItemPress = (fund) => {
    setCurrentFundItem(fund);
    setFundItemModalVisible(true);
  };

  const handleFundItemModalClose = () => {
    setFundItemModalVisible(false);
    setCurrentFundItem(null);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      if (updatedItem) {
        setSelectedFundItem(normalizeFundItem(updatedItem));
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
      setFunds((prev) => prev.filter((fund) => fund.id !== id));
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
    setErrors({});
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
                setSex(newSex);
                // Save immediately to ensure gender is saved without requiring other field interaction
                try {
                  await saveDataToSecureStorageWithOverride({ sex: newSex });
                  setLastEditedAt(new Date());
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
          setScrollPosition(currentScrollPosition);
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
                    setSaveStatus('saving');
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

        {/* Enhanced Personal Information Section */}
        <CollapsibleSection
          title="👤 护照信息"
          subtitle="泰国海关需要核实你的身份"
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
          {/* Border Crossing Context for Personal Info */}
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroIcon}>🛂</Text>
            <Text style={styles.sectionIntroText}>
              海关官员会核对你的护照信息，请确保与护照完全一致。别担心，我们会帮你格式化！
            </Text>
          </View>
           <View style={styles.inputWithValidationContainer}>
             <View style={styles.inputLabelContainer}>
               <Text style={styles.inputLabel}>护照上的姓名</Text>
               <FieldWarningIcon hasWarning={!!warnings.fullName} hasError={!!errors.fullName} />
             </View>
             <PassportNameInput
               surname={surname}
               middleName={middleName}
               givenName={givenName}
               onSurnameChange={setSurname}
               onMiddleNameChange={setMiddleName}
               onGivenNameChange={setGivenName}
               onBlur={() => handleFieldBlur('fullName', [surname, middleName, givenName].filter(Boolean).join(', '))}
               helpText="填写护照上显示的英文姓名，例如：LI, MAO（姓在前，名在后）"
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
             label="护照号码"
             value={passportNo}
             onChangeText={setPassportNo}
             onBlur={() => handleFieldBlur('passportNo', passportNo)}
             helpText="护照号码通常是8-9位字母和数字的组合，输入时会自动转大写"
             error={!!errors.passportNo}
             errorMessage={errors.passportNo}
             warning={!!warnings.passportNo}
             warningMessage={warnings.passportNo}
             required={true}
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
             optional={true}
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
           <View style={styles.fieldContainer}>
             <Text style={styles.fieldLabel}>性别</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        {/* Enhanced Personal Information Section */}
        <CollapsibleSection
          title="👤 个人信息"
          subtitle="泰国需要了解你的基本信息"
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
          {/* Border Crossing Context for Personal Info */}
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroIcon}>📱</Text>
            <Text style={styles.sectionIntroText}>
              提供你的基本个人信息，包括职业、居住地和联系方式，以便泰国海关了解你的情况。
            </Text>
          </View>
           <InputWithValidation
             label="职业"
             value={occupation}
             onChangeText={(text) => {
               setOccupation(text.toUpperCase());
             }}
             onBlur={() => handleFieldBlur('occupation', occupation)}
             helpText="填写你的工作职位，例如：软件工程师、学生、退休人员等（用英文）"
             error={!!errors.occupation}
             errorMessage={errors.occupation}
             warning={!!warnings.occupation}
             warningMessage={warnings.occupation}
             fieldName="occupation"
             lastEditedField={lastEditedField}
             autoCapitalize="characters"
           />
           <InputWithValidation
             label={cityOfResidenceLabel}
             value={cityOfResidence}
             onChangeText={(text) => {
               setCityOfResidence(text.toUpperCase());
             }}
             onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
             helpText={cityOfResidenceHelpText}
             error={!!errors.cityOfResidence}
             errorMessage={errors.cityOfResidence}
             warning={!!warnings.cityOfResidence}
             warningMessage={warnings.cityOfResidence}
             fieldName="cityOfResidence"
             lastEditedField={lastEditedField}
             autoCapitalize="characters"
             placeholder={cityOfResidencePlaceholder}
           />
           <NationalitySelector
             label="居住国家"
             value={residentCountry}
             onValueChange={(code) => {
               setResidentCountry(code);
               setPhoneCode(getPhoneCode(code));
               debouncedSaveData();
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
         </CollapsibleSection>

        {/* Enhanced Funds Section */}
        <CollapsibleSection
          title="💰 资金证明"
          subtitle="证明你有足够资金在泰国旅行"
          isExpanded={expandedSection === 'funds'}
          onToggle={() => setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
        >
          {/* Border Crossing Context for Funds */}
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroIcon}>💳</Text>
            <Text style={styles.sectionIntroText}>
              泰国海关想确保你不会成为负担。只需证明你有足够钱支付旅行费用，通常是每天至少500泰铢。
            </Text>
          </View>
          <View style={styles.fundActions}>
            <Button title="添加现金" onPress={() => addFund('cash')} variant="secondary" style={styles.fundButton} />
            <Button title="添加信用卡照片" onPress={() => addFund('credit_card')} variant="secondary" style={styles.fundButton} />
            <Button title="添加银行账户余额" onPress={() => addFund('bank_balance')} variant="secondary" style={styles.fundButton} />
          </View>

          {funds.length === 0 ? (
            <View style={styles.fundEmptyState}>
              <Text style={styles.fundEmptyText}>
                {t('thailand.travelInfo.funds.empty', { defaultValue: '尚未添加资金证明，请先新建条目。' })}
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

                if ((fund.photoUri || fund.photo) && typeKey !== 'CASH') {
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

        {/* Enhanced Travel Information Section */}
        <CollapsibleSection
          title="✈️ 旅行计划"
          subtitle="告诉泰国你的旅行安排"
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          {/* Border Crossing Context for Travel Info */}
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroIcon}>✈️</Text>
            <Text style={styles.sectionIntroText}>
              海关想知道你为什么来泰国、何时来、何时走、在哪里住。这有助于他们确认你是合法游客。
            </Text>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>为什么来泰国？</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'HOLIDAY', label: '度假旅游', icon: '🏖️', tip: '最受欢迎的选择！' },
                { value: 'MEETING', label: '会议', icon: '👔', tip: '商务会议或活动' },
                { value: 'SPORTS', label: '体育活动', icon: '⚽', tip: '运动或比赛' },
                { value: 'BUSINESS', label: '商务', icon: '💼', tip: '商务考察或工作' },
                { value: 'INCENTIVE', label: '奖励旅游', icon: '🎁', tip: '公司奖励旅行' },
                { value: 'CONVENTION', label: '会展', icon: '🎪', tip: '参加会议或展览' },
                { value: 'EDUCATION', label: '教育', icon: '📚', tip: '学习或培训' },
                { value: 'EMPLOYMENT', label: '就业', icon: '💻', tip: '工作签证' },
                { value: 'EXHIBITION', label: '展览', icon: '🎨', tip: '参观展览或展会' },
                { value: 'MEDICAL', label: '医疗', icon: '🏥', tip: '医疗旅游或治疗' },
                { value: 'OTHER', label: '其他', icon: '✏️', tip: '请详细说明' },
              ].map((option) => {
                const isActive = travelPurpose === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      isActive && styles.optionButtonActive,
                    ]}
                    onPress={() => {
                      setTravelPurpose(option.value);
                      if (option.value !== 'OTHER') {
                        setCustomTravelPurpose('');
                      }
                      // Trigger debounced save after purpose selection
                      debouncedSaveData();
                    }}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
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
            {travelPurpose === 'OTHER' && (
              <Input
                label="请输入旅行目的"
                value={customTravelPurpose}
                onChangeText={setCustomTravelPurpose}
                onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
                placeholder="请输入您的旅行目的"
                helpText="请用英文填写"
                autoCapitalize="words"
              />
            )}
          </View>

          <NationalitySelector
            label="过去14天停留国家或地区"
            value={recentStayCountry}
            onValueChange={(code) => {
              setRecentStayCountry(code);
              handleFieldBlur('recentStayCountry', code);
            }}
            placeholder="请选择最近停留的国家或地区"
            helpText="用于健康申报，通常为您最后停留的国家或地区"
          />

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>来程机票（入境泰国）</Text>
          </View>
          <NationalitySelector
            label="登机国家或地区"
            value={boardingCountry}
            onValueChange={(code) => {
              setBoardingCountry(code);
              handleFieldBlur('boardingCountry', code);
            }}
            placeholder="请选择登机国家或地区"
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
              <Text style={styles.subSectionTitle}>去程机票（离开泰国）</Text>
          </View>
          <Input label="航班号" value={departureFlightNumber} onChangeText={setDepartureFlightNumber} onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)} helpText="请输入您的离开航班号" error={!!errors.departureFlightNumber} errorMessage={errors.departureFlightNumber} autoCapitalize="characters" />
          <DateTimeInput
            label="出发日期"
            value={departureDepartureDate}
            onChangeText={(newValue) => {
              setDepartureDepartureDate(newValue);
              setTimeout(() => {
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
              setIsTransitPassenger(newValue);
              if (newValue) {
                setAccommodationType('HOTEL');
                setCustomAccommodationType('');
                setProvince('');
                setDistrict('');
                setDistrictId(null);
                setSubDistrict('');
                setSubDistrictId(null);
                setPostalCode('');
                setHotelAddress('');
              }

              // Save immediately with the new value
              try {
                const overrides = { isTransitPassenger: newValue };
                if (newValue) {
                  // If becoming transit passenger, reset accommodation fields
                  overrides.accommodationType = 'HOTEL';
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
              我是过境旅客，不在泰国停留
            </Text>
          </TouchableOpacity>

          {!isTransitPassenger && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>住在哪里？</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'HOTEL', label: '酒店', icon: '🏨', tip: '最常见的选择' },
                { value: 'YOUTH_HOSTEL', label: '青年旅舍', icon: '🏠', tip: '经济实惠，交朋友' },
                { value: 'GUEST_HOUSE', label: '民宿', icon: '🏡', tip: '体验当地生活' },
                { value: 'FRIEND_HOUSE', label: '朋友家', icon: '👥', tip: '住在朋友家' },
                { value: 'APARTMENT', label: '公寓', icon: '🏢', tip: '短期租住民宿' },
                { value: 'OTHER', label: '其他', icon: '✏️', tip: '请详细说明' },
              ].map((option) => {
                const isActive = accommodationType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      isActive && styles.optionButtonActive,
                    ]}
                    onPress={async () => {
                      console.log('=== ACCOMMODATION TYPE SELECTED ===');
                      console.log('Selected option:', option.value);
                      console.log('Previous accommodationType:', accommodationType);
                      
                      setAccommodationType(option.value);
                      if (option.value !== 'OTHER') {
                        setCustomAccommodationType('');
                      }
                      
                      console.log('Saving immediately with new accommodation type...');
                      // Save immediately with the new value to avoid React state delay
                      try {
                        await saveDataToSecureStorageWithOverride({ 
                          accommodationType: option.value,
                          customAccommodationType: option.value !== 'OTHER' ? '' : customAccommodationType
                        });
                        setLastEditedAt(new Date());
                      } catch (error) {
                        console.error('Failed to save accommodation type:', error);
                      }
                    }}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
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
            {accommodationType === 'OTHER' && (
              <Input
                label="请输入住宿类型"
                value={customAccommodationType}
                onChangeText={setCustomAccommodationType}
                onBlur={() => handleFieldBlur('customAccommodationType', customAccommodationType)}
                placeholder="请输入您的住宿类型"
                helpText="请用英文填写"
                autoCapitalize="words"
              />
            )}
          </View>
          )}
          
          {!isTransitPassenger && (
            accommodationType === 'HOTEL' ? (
              <>
                <ProvinceSelector
                  label="省"
                  value={province}
                  onValueChange={handleProvinceSelect}
                  helpText="请选择泰国的省份"
                  error={!!errors.province}
                  errorMessage={errors.province}
                />
                <Input 
                  label="地址" 
                  value={hotelAddress} 
                  onChangeText={setHotelAddress} 
                  onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)} 
                  multiline 
                  helpText="请输入详细地址" 
                  error={!!errors.hotelAddress} 
                  errorMessage={errors.hotelAddress} 
                  autoCapitalize="words" 
                />
              </>
            ) : (
              <>
                <ProvinceSelector
                  label="省"
                  value={province}
                  onValueChange={handleProvinceSelect}
                  helpText="请选择泰国的省份"
                  error={!!errors.province}
                  errorMessage={errors.province}
                />
                <DistrictSelector
                  label="区（地区）"
                  provinceCode={province}
                  value={district}
                  selectedDistrictId={districtId}
                  onSelect={handleDistrictSelect}
                  helpText="请选择区或地区（支持中英文搜索）"
                  error={!!errors.district}
                  errorMessage={errors.district}
                />
                <SubDistrictSelector
                  label="乡（子地区）"
                  districtId={districtId}
                  value={subDistrict}
                  selectedSubDistrictId={subDistrictId}
                  onSelect={handleSubDistrictSelect}
                  helpText="选择后我们会自动匹配邮政编码"
                  error={!!errors.subDistrict}
                  errorMessage={errors.subDistrict}
                />
                <Input
                  label="邮政编码"
                  value={postalCode}
                  onChangeText={(value) => {
                    setPostalCode(value);
                  }}
                  onBlur={() => handleFieldBlur('postalCode', postalCode)}
                  helpText="选择乡 / 街道后会自动填写，可手动修正"
                  error={!!errors.postalCode}
                  errorMessage={errors.postalCode}
                  keyboardType="numeric"
                />
                <Input 
                  label="详细地址" 
                  value={hotelAddress} 
                  onChangeText={setHotelAddress} 
                  onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)} 
                  multiline 
                  helpText="请输入详细地址（例如：ABC COMPLEX (BUILDING A, SOUTH ZONE), 120 MOO 3, CHAENG WATTANA ROAD）" 
                  error={!!errors.hotelAddress} 
                  errorMessage={errors.hotelAddress} 
                  autoCapitalize="words" 
                />
              </>
            )
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


 });

export default ThailandTravelInfoScreen;
