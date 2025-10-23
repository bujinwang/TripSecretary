
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
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import InputWithUserTracking from '../../components/InputWithUserTracking';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import { NationalitySelector, PassportNameInput, DateTimeInput, ProvinceSelector } from '../../components';
import SecureStorageService from '../../services/security/SecureStorageService';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import { findChinaProvince } from '../../utils/validation/chinaProvinceValidator';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import SuggestionProviders from '../../utils/SuggestionProviders';
import FieldStateManager from '../../utils/FieldStateManager';
import apiClient from '../../services/api';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import PassportDataService from '../../services/data/PassportDataService';
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
  required = false,
  optional = false,
  ...props
}) => {
  const { t } = useLocale();
  const hasError = error && errorMessage;
  const hasWarning = warning && warningMessage && !hasError;
  const isLastEdited = fieldName && lastEditedField === fieldName;

  // Determine if field is required or optional
  const getFieldRequirementText = () => {
    if (required) return <Text style={styles.requiredText}>*</Text>;
    if (optional) return <Text style={styles.optionalText}>（可选）</Text>;
    return null;
  };
  
  return (
    <View style={[
      styles.inputWithValidationContainer,
      isLastEdited && styles.lastEditedField
    ]}>
      <View style={styles.inputLabelContainer}>
        <View style={styles.labelRow}>
          <Text style={[
            styles.inputLabel,
            isLastEdited && styles.lastEditedLabel
          ]}>
            {label}
            {isLastEdited && ' ✨'}
          </Text>
          <View style={styles.requirementIndicator}>
            {getFieldRequirementText()}
          </View>
        </View>
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
          {t('thailand.travelInfo.lastEdited', { defaultValue: '最近编辑' })}
        </Text>
      )}
    </View>
  );
};

const CollapsibleSection = ({ title, subtitle, children, onScan, isExpanded, onToggle, fieldCount }) => {
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
          {onScan && (
            <TouchableOpacity style={styles.scanButton} onPress={onScan}>
              <Text style={styles.scanIcon}>📸</Text>
              <Text style={styles.scanText}>扫描</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const ThailandTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();
  
  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return PassportDataService.toSerializablePassport(rawPassport);
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
  const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
  const [newFundItemType, setNewFundItemType] = useState(null);

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
  const [accommodationType, setAccommodationType] = useState(''); // 住宿类型
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
          fullName: fullName,
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

      // Build all fields object for FieldStateManager
      const allFields = {
        // Passport fields
        passportNo: passportNo,
        fullName: fullName,
        nationality: nationality,
        dob: dob,
        expiryDate: expiryDate,
        sex: sex,
        // Personal info fields
        phoneCode: phoneCode,
        phoneNumber: phoneNumber,
        email: email,
        occupation: occupation,
        cityOfResidence: cityOfResidence,
        residentCountry: residentCountry,
        // Travel info fields
        travelPurpose: travelPurpose === 'OTHER' ? customTravelPurpose : travelPurpose,
        boardingCountry: boardingCountry,
        recentStayCountry: recentStayCountry,
        visaNumber: visaNumber,
        arrivalFlightNumber: arrivalFlightNumber,
        arrivalArrivalDate: arrivalArrivalDate,
        departureFlightNumber: departureFlightNumber,
        departureDepartureDate: departureDepartureDate,
        isTransitPassenger: isTransitPassenger,
        accommodationType: accommodationType === 'OTHER' ? customAccommodationType : accommodationType,
        province: province,
        district: district,
        subDistrict: subDistrict,
        postalCode: postalCode,
        hotelAddress: hotelAddress
      };

      // Define field configuration for Thailand travel info
      const fieldConfig = {
        requiredFields: [
          'fullName', 'nationality', 'passportNo', 'dob', 'expiryDate', 'sex',
          'occupation', 'cityOfResidence', 'residentCountry', 'phoneNumber', 'email',
          'travelPurpose', 'boardingCountry', 'arrivalFlightNumber', 'arrivalArrivalDate',
          'departureFlightNumber', 'departureDepartureDate'
        ],
        optionalFields: [
          'phoneCode', 'recentStayCountry', 'visaNumber', 'accommodationType', 
          'province', 'district', 'subDistrict', 'postalCode', 'hotelAddress'
        ],
        fieldWeights: {
          // Passport fields have higher weight
          fullName: 2, nationality: 2, passportNo: 2, dob: 2, expiryDate: 2, sex: 2,
          // Personal info fields
          occupation: 1, cityOfResidence: 1, residentCountry: 1, phoneNumber: 1, email: 1,
          // Travel info fields
          travelPurpose: 2, boardingCountry: 2, arrivalFlightNumber: 2, arrivalArrivalDate: 2,
          departureFlightNumber: 2, departureDepartureDate: 2
        }
      };

      // Use FieldStateManager to get completion metrics
      const metrics = FieldStateManager.getCompletionMetrics(allFields, interactionState, fieldConfig);
      
      // Add funds completion (not tracked by interaction state)
      const fundItemCount = funds.length;
      const fundsComplete = fundItemCount > 0;
      
      // Calculate overall completion including funds
      const totalSections = 4; // passport, personal, travel, funds
      const completedSections = [
        metrics.requiredCompletionPercentage >= 80, // passport + personal + travel required fields
        fundsComplete
      ].filter(Boolean).length;
      
      const totalPercent = Math.round((completedSections / totalSections) * 100);

      // Create summary object compatible with existing code
      const summary = {
        totalPercent: totalPercent,
        metrics: {
          passport: {
            completed: metrics.requiredFieldsCompleted,
            total: metrics.requiredFields,
            percentage: metrics.requiredCompletionPercentage
          },
          personal: {
            completed: metrics.requiredFieldsCompleted,
            total: metrics.requiredFields,
            percentage: metrics.requiredCompletionPercentage
          },
          travel: {
            completed: metrics.requiredFieldsCompleted,
            total: metrics.requiredFields,
            percentage: metrics.requiredCompletionPercentage
          },
          funds: {
            completed: fundItemCount,
            total: Math.max(1, fundItemCount),
            percentage: fundsComplete ? 100 : 0
          },
          userModifiedFields: metrics.userModifiedFields
        },
        isReady: totalPercent >= 80
      };

      setCompletionMetrics(summary.metrics);
      setTotalCompletionPercent(summary.totalPercent);
      
      console.log('=== COMPLETION METRICS WITH INTERACTION TRACKING ===');
      console.log('User modified fields:', metrics.userModifiedFields);
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
      return '已经完成一半了！🏖️';
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
      PassportDataService.clearCache();
      
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
        
        // Initialize PassportDataService and trigger migration if needed
        try {
          await PassportDataService.initialize(userId);
        } catch (initError) {
          // Initialization failed, continue with route params
        }
        
        // Load all user data from centralized service
        const userData = await PassportDataService.getAllUserData(userId);
        console.log('=== LOADED USER DATA ===');
        console.log('userData:', userData);
        console.log('userData.passport:', userData?.passport);
        console.log('userData.passport.dateOfBirth:', userData?.passport?.dateOfBirth);
        console.log('userData.personalInfo:', userData?.personalInfo);

        // Load travel info and add to userData for migration
        try {
          const destinationId = destination?.id || 'thailand';
          const travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);
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
          const destinationId = destination?.id || 'thailand';
          console.log('Loading travel info for destination:', destinationId);
          let travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);
          
          // Fallback: try loading with localized name if id lookup fails
          // This handles data saved before the fix
          if (!travelInfo && destination?.name) {
            console.log('Trying fallback with destination name:', destination.name);
            travelInfo = await PassportDataService.getTravelInfo(userId, destination.name);
          }
          
          if (travelInfo) {
            console.log('=== LOADING SAVED TRAVEL INFO ===');
            console.log('Travel info data:', JSON.stringify(travelInfo, null, 2));
            console.log('Hotel name from DB:', travelInfo.hotelName);
            console.log('Hotel address from DB:', travelInfo.hotelAddress);
            console.log('Flight number from DB:', travelInfo.arrivalFlightNumber);
            
            // Check if travel purpose is a predefined option
            const predefinedPurposes = ['HOLIDAY', 'MEETING', 'SPORTS', 'BUSINESS', 'INCENTIVE', 'CONVENTION', 'EDUCATION', 'EMPLOYMENT', 'EXHIBITION', 'MEDICAL'];
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
            const predefinedAccommodationTypes = ['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE', 'FRIEND_HOUSE', 'APARTMENT'];
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
            setSubDistrict(travelInfo.subDistrict || '');
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
          
          // Reload data from PassportDataService
          const userData = await PassportDataService.getAllUserData(userId);

          if (userData) {
            // Load travel info and add to userData for migration
            try {
              const destinationId = destination?.id || 'thailand';
              const travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);
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
              const destinationId = destination?.id || 'thailand';
              const travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);
              
              if (travelInfo) {
                console.log('=== RELOADING TRAVEL INFO ON FOCUS ===');
                console.log('travelInfo.departureDepartureDate:', travelInfo.departureDepartureDate);
                
                // Update travel info state
                const predefinedPurposes = ['HOLIDAY', 'MEETING', 'SPORTS', 'BUSINESS', 'INCENTIVE', 'CONVENTION', 'EDUCATION', 'EMPLOYMENT', 'EXHIBITION', 'MEDICAL'];
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
                const predefinedAccommodationTypes = ['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE', 'FRIEND_HOUSE', 'APARTMENT'];
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
    passportNo, fullName, nationality, dob, expiryDate, sex,
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
      console.log('=== HANDLE FIELD BLUR ===');
      console.log('Field:', fieldName);
      console.log('Value:', fieldValue);
      
      // Mark field as user-modified for interaction tracking
      userInteractionTracker.markFieldAsModified(fieldName, fieldValue);
      
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
            } else if (!/^[\+]?[\d\s\-()]{7,}$/.test(fieldValue)) {
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
          if (fieldValue && fieldValue.trim()) {
            // Check for English characters only
            if (!/^[A-Za-z\s\-.]+$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Please use English letters only';
            } else if (fieldValue.trim().length < 2) {
              isValid = false;
              errorMessage = 'Must be at least 2 characters long';
            }
          } else {
            isWarning = true;
            errorMessage = 'Occupation is required';
          }
          break;

        case 'cityOfResidence':
          if (fieldValue && fieldValue.trim()) {
            const trimmedValue = fieldValue.trim();
            
            if (!/^[A-Za-z\s\-.]+$/.test(trimmedValue)) {
              isValid = false;
              errorMessage = 'Please use English letters only';
            } else if (trimmedValue.length < 2) {
              isValid = false;
              errorMessage = 'Must be at least 2 characters long';
            } else if (residentCountry === 'CHN') {
              const provinceMatch = findChinaProvince(trimmedValue);
              if (!provinceMatch) {
                isValid = false;
                errorMessage = 'For China, please enter a province name (e.g., Anhui, Guangdong)';
              } else if (provinceMatch.displayName.toUpperCase() !== cityOfResidence) {
                setCityOfResidence(provinceMatch.displayName.toUpperCase());
              }
            }
          } else {
            isWarning = true;
            errorMessage = residentCountry === 'CHN'
              ? 'Province is required for China'
              : 'Province or city is required';
          }
          break;

        case 'recentStayCountry':
          if (fieldValue && fieldValue.trim()) {
            // Ensure ISO code format
            if (!/^[A-Za-z]{3}$/.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Please select a valid country or territory';
            }
          } else {
            isWarning = true;
            errorMessage = '过去14天停留国家或地区是必填信息';
          }
          break;

        case 'arrivalFlightNumber':
        case 'departureFlightNumber':
          if (fieldValue && fieldValue.trim()) {
            // Flight number format validation (e.g., TG123, CX456)
            if (!/^[A-Z]{2,3}\d{1,4}[A-Z]?$/i.test(fieldValue.trim())) {
              isValid = false;
              errorMessage = 'Flight number format: 2-3 letters + 1-4 digits (e.g., TG123)';
            }
          } else {
            isWarning = true;
            errorMessage = `${fieldName === 'arrivalFlightNumber' ? 'Arrival' : 'Departure'} flight number is required`;
          }
          break;

        case 'customTravelPurpose':
          if (travelPurpose === 'OTHER') {
            if (fieldValue && fieldValue.trim()) {
              if (!/^[A-Za-z\s\-.]+$/.test(fieldValue.trim())) {
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
              if (!/^[A-Za-z\s\-.]+$/.test(fieldValue.trim())) {
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
              if (!/^[A-Za-z\s\-.]+$/.test(fieldValue.trim())) {
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
              if (!/^\d{5}$/.test(fieldValue.trim())) {
                isValid = false;
                errorMessage = 'Postal code must be 5 digits';
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
          const immediateSaveFields = ['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate', 'recentStayCountry'];
          if (immediateSaveFields.includes(fieldName)) {
            console.log('Immediate-save field detected, saving with new value:', fieldValue);
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

  // Re-validate residence field whenever the selected country changes
  useEffect(() => {
    if (!residentCountry) return;
    handleFieldBlur('cityOfResidence', cityOfResidence);
  }, [residentCountry]);

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

  // Get current values with overrides applied
  const getCurrentValue = (fieldName, currentValue) => {
    return fieldOverrides[fieldName] !== undefined ? fieldOverrides[fieldName] : currentValue;
  };

  // Get existing passport first to ensure we're updating the right one
  const existingPassport = await PassportDataService.getPassport(userId);
  console.log('Existing passport:', existingPassport);

  // Save passport data - filter based on user interaction
  const allPassportFields = {
    passportNumber: getCurrentValue('passportNo', passportNo),
    fullName: getCurrentValue('fullName', fullName),
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

  console.log('=== PASSPORT FIELD FILTERING ===');
  console.log('All passport fields:', allPassportFields);
  console.log('Filtered passport updates:', passportUpdates);
  console.log('Fields that will be saved:', Object.keys(passportUpdates));

  if (Object.keys(passportUpdates).length > 0) {
    try {
      console.log('Saving passport updates:', passportUpdates);
      if (existingPassport && existingPassport.id) {
        console.log('Updating existing passport with ID:', existingPassport.id);
        const updated = await PassportDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
        console.log('Passport data updated successfully');

        // Update passportData state to track the correct passport ID
        setPassportData(updated);
        saveResults.passport.success = true;
      } else {
        console.log('Creating new passport for userId:', userId);
        const saved = await PassportDataService.savePassport(passportUpdates, userId, { skipValidation: true });
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

  console.log('=== PERSONAL INFO FIELD FILTERING ===');
  console.log('All personal info fields:', allPersonalInfoFields);
  console.log('Filtered personal info updates:', personalInfoUpdates);
  console.log('Fields that will be saved:', Object.keys(personalInfoUpdates));

  console.log('=== 🔍 PERSONAL INFO UPDATES DEBUG ===');
  console.log('personalInfoUpdates object:', personalInfoUpdates);
  console.log('Number of fields to update:', Object.keys(personalInfoUpdates).length);

  // Enhanced validation - check if there are user-modified fields to save
  const hasValidData = Object.keys(personalInfoUpdates).length > 0;

  if (hasValidData) {
    try {
      console.log('Saving personal info updates:', personalInfoUpdates);
      const savedPersonalInfo = await PassportDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      console.log('✅ Personal info saved successfully');

      // Update personalInfoData state
      setPersonalInfoData(savedPersonalInfo);
      saveResults.personalInfo.success = true;

      // Verify the save worked
      console.log('=== 🔍 SAVE VERIFICATION ===');
      const verifyData = await PassportDataService.getPersonalInfo(userId);
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

  console.log('=== TRAVEL INFO FIELD FILTERING ===');
  console.log('All travel info fields:', allTravelInfoFields);
  console.log('Filtered travel info updates:', travelInfoUpdates);
  console.log('Fields that will be saved:', Object.keys(travelInfoUpdates));

  console.log('=== 🔍 TRAVEL INFO UPDATES DEBUG ===');
  console.log('destinationId:', destinationId);
  console.log('travelInfoUpdates object:', travelInfoUpdates);
  console.log('Number of fields to update:', Object.keys(travelInfoUpdates).length);

  // Save travel info if there are fields to update
  if (Object.keys(travelInfoUpdates).length > 0) {
    try {
      console.log('Saving travel info updates:', travelInfoUpdates);
      // Add destination to the travel data object
      const travelDataWithDestination = {
        ...travelInfoUpdates,
        destination: destinationId
      };
      
      const savedTravelInfo = await PassportDataService.saveTravelInfo(userId, travelDataWithDestination);
      console.log('✅ Travel info saved successfully');
      saveResults.travelInfo.success = true;

      // Verify the save worked
      console.log('=== 🔍 TRAVEL INFO SAVE VERIFICATION ===');
      const verifyTravelData = await PassportDataService.getTravelInfo(userId, destinationId);
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

    // Handle partial save failures
    if (saveErrors.length > 0) {
      console.error('=== SAVE OPERATION COMPLETED WITH ERRORS ===');
      console.error('Save results:', saveResults);
      console.error('Errors encountered:', saveErrors);
      
      // Determine if this is a complete failure or partial success
      const successfulSaves = Object.values(saveResults).filter(result => result.success).length;
      const totalSaves = Object.keys(saveResults).length;
      
      if (successfulSaves === 0) {
        // Complete failure - throw error to trigger retry
        const firstError = saveErrors[0];
        throw new Error(`Complete save failure: ${firstError.error.message}`);
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
      const fundItems = await PassportDataService.getFundItems(userId, options);
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

// Test function to verify personal info data flow
const testPersonalInfoDataFlow = async () => {
  console.log('=== 🧪 TESTING PERSONAL INFO DATA FLOW ===');

  // Test current UI state
  console.log('Current UI state:');
  console.log('- phoneCode:', phoneCode, 'Length:', phoneCode?.length);
  console.log('- phoneNumber:', phoneNumber, 'Length:', phoneNumber?.length);
  console.log('- email:', email, 'Length:', email?.length);
  console.log('- occupation:', occupation, 'Length:', occupation?.length);
  console.log('- cityOfResidence:', cityOfResidence, 'Length:', cityOfResidence?.length);
  console.log('- residentCountry:', residentCountry, 'Length:', residentCountry?.length);
  console.log('- sex:', sex, 'Length:', sex?.length);

  // Test data preparation
  const personalInfoUpdates = {};
  if (phoneCode && phoneCode.trim()) personalInfoUpdates.phoneCode = phoneCode;
  if (phoneNumber && phoneNumber.trim()) personalInfoUpdates.phoneNumber = phoneNumber;
  if (email && email.trim()) personalInfoUpdates.email = email;
  if (occupation && occupation.trim()) personalInfoUpdates.occupation = occupation;
  if (cityOfResidence && cityOfResidence.trim()) personalInfoUpdates.provinceCity = cityOfResidence;
  if (residentCountry && residentCountry.trim()) personalInfoUpdates.countryRegion = residentCountry;
  // NOTE: gender removed from personalInfo - stored in passport only

  console.log('Prepared personalInfoUpdates:', personalInfoUpdates);
  console.log('Number of fields that would be saved:', Object.keys(personalInfoUpdates).length);

  // Test the save process
  if (Object.keys(personalInfoUpdates).length > 0) {
    try {
      console.log('Attempting to save personal info...');
      const userId = passport?.id || 'user_001';
      const savedPersonalInfo = await PassportDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      console.log('✅ Personal info saved successfully:', savedPersonalInfo);

      // Verify in database
      const verifyData = await PassportDataService.getPersonalInfo(userId);
      console.log('✅ Verification - loaded from database:', verifyData);

    } catch (error) {
      console.error('❌ Failed to save personal info:', error);
      console.error('Error details:', error.message, error.stack);
    }
  } else {
    console.log('⚠️ No fields to save - all fields are empty or invalid');
  }
};

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  window.testPersonalInfoDataFlow = testPersonalInfoDataFlow;
}

  const validate = () => {
    // Disable all required checks to support progressive entry info filling
    setErrors({});
    return true;
  };

  const handleContinue = async () => {
    await handleNavigationWithSave(
      () => navigation.navigate('ThailandEntryFlow', { passport, destination }),
      'continue'
    );
  };

  const handleGoBack = async () => {
    await handleNavigationWithSave(
      () => navigation.goBack(),
      'go back'
    );
  };

  const handleScanPassport = () => {
    // navigation.navigate('ScanPassport');
  };

  const handleScanTickets = () => {
    Alert.alert(
      t('thailand.travelInfo.scan.ticketTitle', { defaultValue: '扫描机票' }),
      t('thailand.travelInfo.scan.ticketMessage', { defaultValue: '请选择机票图片来源' }),
      [
        {
          text: t('thailand.travelInfo.scan.takePhoto', { defaultValue: '拍照' }),
          onPress: () => scanDocument('ticket', 'camera')
        },
        {
          text: t('thailand.travelInfo.scan.fromLibrary', { defaultValue: '从相册选择' }),
          onPress: () => scanDocument('ticket', 'library')
        },
        {
          text: t('common.cancel', { defaultValue: '取消' }),
          style: 'cancel'
        }
      ]
    );
  };

  const handleScanHotel = () => {
    Alert.alert(
      t('thailand.travelInfo.scan.hotelTitle', { defaultValue: '扫描酒店预订' }),
      t('thailand.travelInfo.scan.hotelMessage', { defaultValue: '请选择酒店预订确认单图片来源' }),
      [
        {
          text: t('thailand.travelInfo.scan.takePhoto', { defaultValue: '拍照' }),
          onPress: () => scanDocument('hotel', 'camera')
        },
        {
          text: t('thailand.travelInfo.scan.fromLibrary', { defaultValue: '从相册选择' }),
          onPress: () => scanDocument('hotel', 'library')
        },
        {
          text: t('common.cancel', { defaultValue: '取消' }),
          style: 'cancel'
        }
      ]
    );
  };
  
  const scanDocument = async (documentType, source) => {
    try {
      // Request permissions
      let permissionResult;
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          t('thailand.travelInfo.scan.permissionTitle', { defaultValue: '需要权限' }),
          source === 'camera' 
            ? t('thailand.travelInfo.scan.cameraPermissionMessage', { defaultValue: '需要相机权限来拍照扫描文档' })
            : t('thailand.travelInfo.scan.libraryPermissionMessage', { defaultValue: '需要相册权限来选择图片' })
        );
        return;
      }

      // Launch image picker
      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
          aspect: [4, 3],
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.8,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
      }

      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0].uri;
      
      // Show loading indicator
      setSaveStatus('saving');
      
      try {
        // Process OCR
        let ocrResult;
        if (documentType === 'ticket') {
          ocrResult = await apiClient.recognizeTicket(imageUri);
          await processTicketOCRResult(ocrResult);
        } else if (documentType === 'hotel') {
          ocrResult = await apiClient.recognizeHotel(imageUri);
          await processHotelOCRResult(ocrResult);
        }

        // Show success message
        Alert.alert(
          t('thailand.travelInfo.scan.successTitle', { defaultValue: '扫描成功' }),
          documentType === 'ticket' 
            ? t('thailand.travelInfo.scan.ticketSuccess', { defaultValue: '机票信息已提取并填入表单' })
            : t('thailand.travelInfo.scan.hotelSuccess', { defaultValue: '酒店信息已提取并填入表单' })
        );

        setSaveStatus('saved');
        
        // Auto-save the extracted data
        debouncedSaveData();

      } catch (ocrError) {
        console.error('OCR processing failed:', ocrError);
        
        // Show error with option to enter manually
        Alert.alert(
          t('thailand.travelInfo.scan.ocrFailTitle', { defaultValue: '识别失败' }),
          t('thailand.travelInfo.scan.ocrFailMessage', { defaultValue: '无法从图片中提取信息，请检查图片清晰度或手动输入' }),
          [
            {
              text: t('thailand.travelInfo.scan.retryButton', { defaultValue: '重试' }),
              onPress: () => scanDocument(documentType, source)
            },
            {
              text: t('thailand.travelInfo.scan.manualButton', { defaultValue: '手动输入' }),
              style: 'cancel'
            }
          ]
        );
        
        setSaveStatus('error');
      }

    } catch (error) {
      console.error('Document scanning failed:', error);
      Alert.alert(
        t('thailand.travelInfo.scan.errorTitle', { defaultValue: '扫描失败' }),
        t('thailand.travelInfo.scan.errorMessage', { defaultValue: '扫描过程中出现错误，请重试' })
      );
      setSaveStatus('error');
    }
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
          t('thailand.travelInfo.scan.flightChoiceTitle', { defaultValue: '选择航班' }),
          t('thailand.travelInfo.scan.flightChoiceMessage', { 
            defaultValue: '检测到航班号 {flightNumber}，请选择要更新的航班信息',
            flightNumber: ocrResult.flightNumber 
          }),
          [
            {
              text: t('thailand.travelInfo.scan.arrivalFlight', { defaultValue: '入境航班' }),
              onPress: () => {
                setArrivalFlightNumber(ocrResult.flightNumber);
                setLastEditedField('arrivalFlightNumber');
              }
            },
            {
              text: t('thailand.travelInfo.scan.departureFlight', { defaultValue: '离境航班' }),
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

  // Helper function to extract province from address
  const extractProvinceFromAddress = (address) => {
    if (!address) return null;
    
    const thaiProvinces = [
      'Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Koh Samui',
      'Hua Hin', 'Ayutthaya', 'Sukhothai', 'Chiang Rai', 'Kanchanaburi',
      'Nakhon Ratchasima', 'Udon Thani', 'Khon Kaen', 'Surat Thani',
      '曼谷', '清迈', '普吉', '芭提雅', '甲米', '苏梅岛'
    ];

    for (const province of thaiProvinces) {
      if (address.includes(province)) {
        return province;
      }
    }

    // If no specific province found, try to extract from common patterns
    const provincePatterns = [
      /(\w+)\s+Province/i,
      /(\w+)府/,
      /(\w+)\s+จังหวัด/
    ];

    for (const pattern of provincePatterns) {
      const match = address.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
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
          onScan={handleScanPassport}
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
               value={fullName}
               onChangeText={setFullName}
               onBlur={() => handleFieldBlur('fullName', fullName)}
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
               console.log('=== 🔍 OCCUPATION INPUT CHANGE ===');
               console.log('New occupation value:', text);
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
               console.log('=== 🔍 CITY OF RESIDENCE INPUT CHANGE ===');
               console.log('New city of residence value:', text);
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
               console.log('=== 🔍 RESIDENT COUNTRY CHANGE ===');
               console.log('New resident country code:', code);
               console.log('Previous resident country code:', residentCountry);
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
               onChangeText={(text) => {
                 console.log('=== 🔍 PHONE NUMBER INPUT CHANGE ===');
                 console.log('New phone number value:', text);
                 setPhoneNumber(text);
               }}
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
             onChangeText={(text) => {
               console.log('=== 🔍 EMAIL INPUT CHANGE ===');
               console.log('New email value:', text);
               setEmail(text);
             }}
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
          <InputWithUserTracking
            fieldName="travelPurpose"
            label="为什么来泰国？"
            value={travelPurpose === 'OTHER' ? customTravelPurpose : travelPurpose}
            onChangeText={(text) => {
              if (text === 'OTHER' || !['HOLIDAY', 'MEETING', 'SPORTS', 'BUSINESS', 'INCENTIVE', 'CONVENTION', 'EDUCATION', 'EMPLOYMENT', 'EXHIBITION', 'MEDICAL'].includes(text)) {
                setTravelPurpose('OTHER');
                setCustomTravelPurpose(text);
              } else {
                setTravelPurpose(text);
                setCustomTravelPurpose('');
              }
            }}
            onUserInteraction={handleUserInteraction}
            onBlur={() => handleFieldBlur('travelPurpose', travelPurpose === 'OTHER' ? customTravelPurpose : travelPurpose)}
            showSuggestions={true}
            suggestions={SuggestionProviders.getTravelPurposeSuggestions({
              destination: 'TH',
              nationality: passport?.nationality,
              previousPurposes: userInteractionTracker.getModifiedFields().includes('travelPurpose') ? [travelPurpose] : []
            })}
            placeholder="请选择或输入旅行目的"
            suggestionPlaceholder={SuggestionProviders.getSuggestionPlaceholder('travelPurpose', {
              destination: 'TH',
              nationality: passport?.nationality
            })}
            helpText="选择最符合您此次旅行的目的"
            error={!!errors.travelPurpose}
            errorMessage={errors.travelPurpose}
          />

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
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTickets}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
          </View>
          <InputWithUserTracking
            fieldName="boardingCountry"
            label="登机国家或地区"
            value={boardingCountry}
            onChangeText={setBoardingCountry}
            onUserInteraction={handleUserInteraction}
            onBlur={() => handleFieldBlur('boardingCountry', boardingCountry)}
            showSuggestions={true}
            suggestions={SuggestionProviders.getBoardingCountrySuggestions({
              passportNationality: passport?.nationality,
              destination: 'TH',
              previousBoardingCountries: userInteractionTracker.getModifiedFields().includes('boardingCountry') ? [boardingCountry] : []
            })}
            placeholder="请选择或输入登机国家"
            suggestionPlaceholder={SuggestionProviders.getSuggestionPlaceholder('boardingCountry', {
              passportNationality: passport?.nationality,
              destination: 'TH'
            })}
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
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTickets}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
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
              <TouchableOpacity style={styles.scanButton} onPress={handleScanHotel}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
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
                setAccommodationType('HOTEL');
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
          <InputWithUserTracking
            fieldName="accommodationType"
            label="住在哪里？"
            value={accommodationType === 'OTHER' ? customAccommodationType : accommodationType}
            onChangeText={(text) => {
              if (text === 'OTHER' || !['HOTEL', 'YOUTH_HOSTEL', 'GUEST_HOUSE', 'FRIEND_HOUSE', 'APARTMENT'].includes(text)) {
                setAccommodationType('OTHER');
                setCustomAccommodationType(text);
              } else {
                setAccommodationType(text);
                setCustomAccommodationType('');
              }
            }}
            onUserInteraction={handleUserInteraction}
            onBlur={() => handleFieldBlur('accommodationType', accommodationType === 'OTHER' ? customAccommodationType : accommodationType)}
            showSuggestions={true}
            suggestions={SuggestionProviders.getAccommodationTypeSuggestions({
              destination: 'TH',
              travelPurpose: travelPurpose,
              previousAccommodations: userInteractionTracker.getModifiedFields().includes('accommodationType') ? [accommodationType] : []
            })}
            placeholder="请选择或输入住宿类型"
            suggestionPlaceholder={SuggestionProviders.getSuggestionPlaceholder('accommodationType', {
              destination: 'TH',
              travelPurpose: travelPurpose
            })}
            helpText="选择您在泰国的住宿类型"
            error={!!errors.accommodationType}
            errorMessage={errors.accommodationType}
          />
          )}
          
          {!isTransitPassenger && (
            accommodationType === 'HOTEL' ? (
              <>
                <ProvinceSelector
                  label="省"
                  value={province}
                  onValueChange={(code) => {
                    setProvince(code);
                    debouncedSaveData(); // Trigger debounced save when province changes
                  }}
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
                  onValueChange={(code) => {
                    setProvince(code);
                    debouncedSaveData(); // Trigger debounced save when province changes
                  }}
                  helpText="请选择泰国的省份"
                  error={!!errors.province}
                  errorMessage={errors.province}
                />
                <Input 
                  label="区（地区）" 
                  value={district} 
                  onChangeText={setDistrict} 
                  onBlur={() => handleFieldBlur('district', district)} 
                  helpText="请输入区或地区" 
                  error={!!errors.district} 
                  errorMessage={errors.district} 
                  autoCapitalize="words" 
                />
                <Input 
                  label="乡（子地区）" 
                  value={subDistrict} 
                  onChangeText={setSubDistrict} 
                  onBlur={() => handleFieldBlur('subDistrict', subDistrict)} 
                  helpText="请输入乡或子地区" 
                  error={!!errors.subDistrict} 
                  errorMessage={errors.subDistrict} 
                  autoCapitalize="words" 
                />
                <Input 
                  label="邮政编码" 
                  value={postalCode} 
                  onChangeText={setPostalCode} 
                  onBlur={() => handleFieldBlur('postalCode', postalCode)} 
                  helpText="请输入邮政编码" 
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
              {totalCompletionPercent < 30
                ? '🌟 第一步，从介绍自己开始吧！'
                : totalCompletionPercent < 60
                ? '🎉 太棒了！继续保持这个节奏'
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
                : '✈️ 最后一步，分享你的旅行计划吧！'
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scanIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  scanText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
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
