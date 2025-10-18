
// 入境通 - Thailand Travel Info Screen (泰国入境信息)
import React, { useState, useEffect, useRef } from 'react';
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
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { NationalitySelector, PassportNameInput, DateTimeInput, ProvinceSelector } from '../../components';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import NotificationCoordinator from '../../services/notification/NotificationCoordinator';
import EntryPackService from '../../services/entryPack/EntryPackService';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
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
  ...props 
}) => {
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
          {t('thailand.travelInfo.lastEdited', { defaultValue: '最近编辑' })}
        </Text>
      )}
    </View>
  );
};

const CollapsibleSection = ({ title, children, onScan, isExpanded, onToggle, fieldCount }) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const isComplete = fieldCount && fieldCount.filled === fieldCount.total;

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={handleToggle} activeOpacity={0.8}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {fieldCount && (
            <View style={[
              styles.fieldCountBadge,
              isComplete ? styles.fieldCountBadgeComplete : styles.fieldCountBadgeIncomplete
            ]}>
              <Text style={[
                styles.fieldCountText,
                isComplete ? styles.fieldCountTextComplete : styles.fieldCountTextIncomplete
              ]}>
                {fieldCount.filled}/{fieldCount.total}
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
  const { passport, destination } = route.params || {};
  const { t } = useLocale();

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

  // Travel Info State
  const [travelPurpose, setTravelPurpose] = useState('HOLIDAY');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [boardingCountry, setBoardingCountry] = useState(''); // 登机国家或地区
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState('');
  const [previousArrivalDate, setPreviousArrivalDate] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState('');
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationType, setAccommodationType] = useState('HOTEL'); // 住宿类型
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

  // Count filled fields for each section
  const getFieldCount = (section) => {
    let filled = 0;
    let total = 0;

    switch (section) {
      case 'passport':
        const passportFields = [fullName, nationality, passportNo, dob, expiryDate];
        total = passportFields.length;
        filled = passportFields.filter(field => field && field.toString().trim() !== '').length;
        break;
      
      case 'personal':
        const personalFields = [occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email, sex];
        total = personalFields.length;
        filled = personalFields.filter(field => field && field.toString().trim() !== '').length;
        break;
      
      case 'funds':
        // For funds, count the number of fund items added
        total = 1; // At least one fund proof is expected
        filled = funds.length > 0 ? 1 : 0;
        break;
      
      case 'travel':
        // Thailand requires both arrival and departure flight info
        // For travel purpose, if "OTHER" is selected, check if custom purpose is filled
        const purposeFilled = travelPurpose === 'OTHER' 
          ? (customTravelPurpose && customTravelPurpose.trim() !== '')
          : (travelPurpose && travelPurpose.trim() !== '');
        
        const travelFields = [
          purposeFilled,
          boardingCountry,
          arrivalFlightNumber, arrivalArrivalDate,
          departureFlightNumber, departureDepartureDate
        ];
        
        // Only include accommodation fields if not a transit passenger
        if (!isTransitPassenger) {
          // For accommodation type, if "OTHER" is selected, check if custom type is filled
          const accommodationTypeFilled = accommodationType === 'OTHER'
            ? (customAccommodationType && customAccommodationType.trim() !== '')
            : (accommodationType && accommodationType.trim() !== '');
          
          // Different fields based on accommodation type
          const isHotelType = accommodationType === 'HOTEL';
          const accommodationFields = isHotelType
            ? [accommodationTypeFilled, province, hotelAddress]
            : [accommodationTypeFilled, province, district, subDistrict, postalCode, hotelAddress];
          
          travelFields.push(...accommodationFields);
        }
        
        total = travelFields.length;
        filled = travelFields.filter(field => {
          if (typeof field === 'boolean') return field;
          return field && field.toString().trim() !== '';
        }).length;
        break;
    }

    return { filled, total };
  };

  // Calculate completion metrics using EntryCompletionCalculator
  const calculateCompletionMetrics = () => {
    try {
      const entryInfo = {
        passport: {
          passportNumber: passportNo,
          fullName: fullName,
          nationality: nationality,
          dateOfBirth: dob,
          expiryDate: expiryDate,
          gender: sex
        },
        personalInfo: {
          occupation: occupation,
          provinceCity: cityOfResidence,
          countryRegion: residentCountry,
          phoneNumber: phoneNumber,
          email: email,
          gender: sex,
          phoneCode: phoneCode
        },
        funds: funds,
        travel: {
          travelPurpose: travelPurpose === 'OTHER' ? customTravelPurpose : travelPurpose,
          arrivalDate: arrivalArrivalDate,
          departureDate: departureDepartureDate,
          arrivalFlightNumber: arrivalFlightNumber,
          departureFlightNumber: departureFlightNumber,
          boardingCountry: boardingCountry,
          accommodation: hotelAddress,
          accommodationType: accommodationType === 'OTHER' ? customAccommodationType : accommodationType,
          province: province,
          district: district,
          subDistrict: subDistrict,
          postalCode: postalCode,
          hotelAddress: hotelAddress,
          isTransitPassenger: isTransitPassenger
        }
      };

      const summary = EntryCompletionCalculator.getCompletionSummary(entryInfo);
      setCompletionMetrics(summary.metrics);
      setTotalCompletionPercent(summary.totalPercent);
      
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

  // Get smart button label based on completion
  const getSmartButtonLabel = () => {
    if (totalCompletionPercent >= 100) {
      return t('thailand.travelInfo.submitEntry');
    } else {
      return t('thailand.travelInfo.viewStatus');
    }
  };

  // Get progress indicator text
  const getProgressText = () => {
    if (totalCompletionPercent >= 100) {
      return t('thailand.travelInfo.readyToSubmit');
    } else {
      return t('thailand.travelInfo.completionProgress', {
        percent: totalCompletionPercent
      });
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

  // Load saved data on component mount and when screen gains focus
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);
        const userId = passport?.id || 'default_user';
        
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
        console.log('userData.personalInfo:', userData?.personalInfo);

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
          // Gender field mapping
          const loadedSex = personalInfo.gender || passportInfo?.gender || passport?.sex || sex || 'Male';
          setSex(loadedSex);
          
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
          // Fallback to passport data for gender
          setSex(passport?.sex || 'Male');
          setPhoneCode(getPhoneCode(passport?.nationality || ''));
        }

        // Load fund items from database
        try {
          const fundItems = await PassportDataService.getFundItems(userId);
          console.log('Loaded fund items:', fundItems.length);
          
          // Convert FundItem instances to plain objects for state
          const fundsArray = fundItems.map(item => ({
            id: item.id,
            type: item.type,
            amount: item.amount,
            currency: item.currency,
            details: item.details,
            photo: item.photoUri
          }));
          
          setFunds(fundsArray);
        } catch (error) {
          console.error('Failed to load fund items:', error);
          setFunds([]);
        }

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
            setVisaNumber(travelInfo.visaNumber || '');
            setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
            setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
            setPreviousArrivalDate(travelInfo.arrivalArrivalDate || '');
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
  }, [passport]);

  // Add focus listener to reload data when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const reloadData = async () => {
        try {
          const userId = passport?.id || 'default_user';
          
          // Reload data from PassportDataService
          const userData = await PassportDataService.getAllUserData(userId);

          if (userData) {
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
              setSex(personalInfo.gender || passportInfo?.gender || passport?.sex || sex);
              setOccupation(personalInfo.occupation || occupation);
              setCityOfResidence(personalInfo.provinceCity || cityOfResidence);
              setResidentCountry(personalInfo.countryRegion || residentCountry);
              setPhoneNumber(personalInfo.phoneNumber || phoneNumber);
              setEmail(personalInfo.email || email);
              setPhoneCode(personalInfo.phoneCode || phoneCode || getPhoneCode(personalInfo.countryRegion || passportInfo?.nationality || passport?.nationality || ''));
              setPersonalInfoData(personalInfo);
            }
          }
        } catch (error) {
          // Failed to reload data on focus
        }
      };

      reloadData();
    });

    return unsubscribe;
  }, [navigation, passport]);

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
    const userId = passport?.id || 'default_user';
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
    arrivalFlightNumber, departureFlightNumber, boardingCountry, hotelAddress,
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





  // Create debounced save function
  const debouncedSaveData = DebouncedSave.debouncedSave(
    'thailand_travel_info',
    async () => {
      await saveDataToSecureStorage();
      setLastEditedAt(new Date());
    },
    300
  );

  // Function to validate and save field data on blur
  const handleFieldBlur = async (fieldName, fieldValue) => {
    try {
      console.log('=== HANDLE FIELD BLUR ===');
      console.log('Field:', fieldName);
      console.log('Value:', fieldValue);
      
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
          debouncedSaveData();
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

  // Handle arrival date change and schedule notifications
  const handleArrivalDateChange = async (newArrivalDate, oldArrivalDate) => {
    try {
      console.log('Handling arrival date change:', { newArrivalDate, oldArrivalDate });
      
      // Initialize notification coordinator
      await NotificationCoordinator.initialize();
      
      const userId = passport?.id || 'default_user';
      const destinationId = destination?.id || 'thailand';
      
      // Get or create entry pack for this destination
      let entryPack = await EntryPackService.getByEntryInfoId(`${userId}_${destinationId}`);
      if (!entryPack) {
        // Create entry pack if it doesn't exist
        entryPack = await EntryPackService.createOrUpdatePack(`${userId}_${destinationId}`);
      }
      
      if (entryPack) {
        // Handle arrival date change in notification coordinator
        await NotificationCoordinator.handleArrivalDateChange(
          userId,
          entryPack.id,
          newArrivalDate ? new Date(newArrivalDate) : null,
          oldArrivalDate ? new Date(oldArrivalDate) : null,
          'Thailand'
        );
        
        console.log('Notifications updated for arrival date change');
      }
    } catch (error) {
      console.error('Failed to handle arrival date change:', error);
      // Don't throw - this is a secondary operation that shouldn't break the main flow
    }
  };

  // Save all data to secure storage
  const saveDataToSecureStorage = async () => {
    try {
      const userId = passport?.id || 'default_user';
      console.log('=== SAVING DATA TO SECURE STORAGE ===');
      console.log('userId:', userId);

      // Get existing passport first to ensure we're updating the right one
      const existingPassport = await PassportDataService.getPassport(userId);
      console.log('Existing passport:', existingPassport);

      // Save passport data - only include non-empty fields
      const passportUpdates = {};
      if (passportNo && passportNo.trim()) passportUpdates.passportNumber = passportNo;
      if (fullName && fullName.trim()) passportUpdates.fullName = fullName;
      if (nationality && nationality.trim()) passportUpdates.nationality = nationality;
      if (dob && dob.trim()) passportUpdates.dateOfBirth = dob;
      if (expiryDate && expiryDate.trim()) passportUpdates.expiryDate = expiryDate;
      if (sex && sex.trim()) passportUpdates.gender = sex;

      if (Object.keys(passportUpdates).length > 0) {
        console.log('Saving passport updates:', passportUpdates);
        if (existingPassport && existingPassport.id) {
          console.log('Updating existing passport with ID:', existingPassport.id);
          const updated = await PassportDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
          console.log('Passport data updated successfully');
          
          // Update passportData state to track the correct passport ID
          setPassportData(updated);
        } else {
          console.log('Creating new passport for userId:', userId);
          const saved = await PassportDataService.savePassport(passportUpdates, userId, { skipValidation: true });
          console.log('Passport data saved successfully');
          
          // Update passportData state to track the new passport ID
          setPassportData(saved);
        }
      }

      // Save personal info data - only include non-empty fields
      const personalInfoUpdates = {};
      if (phoneCode && phoneCode.trim()) personalInfoUpdates.phoneCode = phoneCode;
      if (phoneNumber && phoneNumber.trim()) personalInfoUpdates.phoneNumber = phoneNumber;
      if (email && email.trim()) personalInfoUpdates.email = email;
      if (occupation && occupation.trim()) personalInfoUpdates.occupation = occupation;
      if (cityOfResidence && cityOfResidence.trim()) personalInfoUpdates.provinceCity = cityOfResidence;
      if (residentCountry && residentCountry.trim()) personalInfoUpdates.countryRegion = residentCountry;
      if (sex && sex.trim()) personalInfoUpdates.gender = sex;

      if (Object.keys(personalInfoUpdates).length > 0) {
        console.log('Saving personal info updates:', personalInfoUpdates);
        const savedPersonalInfo = await PassportDataService.upsertPersonalInfo(userId, personalInfoUpdates);
        console.log('Personal info saved successfully');
        
        // Update personalInfoData state
        setPersonalInfoData(savedPersonalInfo);
      }

      // Save travel info data - only include non-empty fields
      const travelInfoUpdates = {};
      // If "OTHER" is selected, use custom purpose; otherwise use selected purpose
      const finalTravelPurpose = travelPurpose === 'OTHER' && customTravelPurpose.trim() 
        ? customTravelPurpose.trim() 
        : travelPurpose;
      if (finalTravelPurpose && finalTravelPurpose.trim()) travelInfoUpdates.travelPurpose = finalTravelPurpose;
      if (boardingCountry && boardingCountry.trim()) travelInfoUpdates.boardingCountry = boardingCountry;
      if (visaNumber && visaNumber.trim()) travelInfoUpdates.visaNumber = visaNumber.trim();
      if (arrivalFlightNumber && arrivalFlightNumber.trim()) travelInfoUpdates.arrivalFlightNumber = arrivalFlightNumber;
      if (arrivalArrivalDate && arrivalArrivalDate.trim()) travelInfoUpdates.arrivalArrivalDate = arrivalArrivalDate;
      if (departureFlightNumber && departureFlightNumber.trim()) travelInfoUpdates.departureFlightNumber = departureFlightNumber;
      if (departureDepartureDate && departureDepartureDate.trim()) travelInfoUpdates.departureDepartureDate = departureDepartureDate;
      travelInfoUpdates.isTransitPassenger = isTransitPassenger;
      // Save accommodation type - if "OTHER" is selected, use custom type
      if (!isTransitPassenger) {
        const finalAccommodationType = accommodationType === 'OTHER' && customAccommodationType.trim()
          ? customAccommodationType.trim()
          : accommodationType;
        if (finalAccommodationType && finalAccommodationType.trim()) travelInfoUpdates.accommodationType = finalAccommodationType;
        if (province && province.trim()) travelInfoUpdates.province = province;
        if (district && district.trim()) travelInfoUpdates.district = district;
        if (subDistrict && subDistrict.trim()) travelInfoUpdates.subDistrict = subDistrict;
        if (postalCode && postalCode.trim()) travelInfoUpdates.postalCode = postalCode;
        if (hotelAddress && hotelAddress.trim()) travelInfoUpdates.hotelAddress = hotelAddress;
      }

      if (Object.keys(travelInfoUpdates).length > 0) {
        console.log('Saving travel info updates:', travelInfoUpdates);
        try {
          // Use destination.id for consistent lookup (not affected by localization)
          const destinationId = destination?.id || 'thailand';
          console.log('Calling PassportDataService.updateTravelInfo with:', { userId, destinationId });
          const savedTravelInfo = await PassportDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);
          console.log('Travel info saved successfully:', savedTravelInfo);
          
          // Check if arrival date changed and handle notifications
          if (travelInfoUpdates.arrivalArrivalDate && travelInfoUpdates.arrivalArrivalDate !== previousArrivalDate) {
            console.log('Arrival date changed, updating notifications');
            await handleArrivalDateChange(travelInfoUpdates.arrivalArrivalDate, previousArrivalDate);
            setPreviousArrivalDate(travelInfoUpdates.arrivalArrivalDate);
          }
        } catch (travelInfoError) {
          console.error('Failed to save travel info:', travelInfoError);
          console.error('Travel info error stack:', travelInfoError.stack);
        }
      }

      console.log('=== DATA SAVED SUCCESSFULLY ===');
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
      console.error('Error details:', error.message, error.stack);
    }
  };

  const addFund = async (type) => {
    try {
      const userId = passport?.id || 'default_user';
      // Create new fund item in database
      const fundItem = await PassportDataService.saveFundItem({
        type,
        amount: '',
        currency: 'THB',
        details: '',
        photoUri: null,
      }, userId);
      
      console.log('Fund item created:', fundItem.id);
      
      // Add to local state
      const newFund = {
        id: fundItem.id,
        type: fundItem.type,
        amount: fundItem.amount,
        currency: fundItem.currency,
        details: fundItem.details,
        photo: fundItem.photoUri
      };
      
      setFunds([...funds, newFund]);
    } catch (error) {
      console.error('Failed to add fund item:', error);
      Alert.alert('Error', 'Failed to add fund item');
    }
  };

  const removeFund = async (id) => {
    try {
      const userId = passport?.id || 'default_user';
      // Delete from database
      const success = await PassportDataService.deleteFundItem(id, userId);
      
      if (success) {
        console.log('Fund item deleted:', id);
        
        // Remove from local state
        setFunds(funds.filter((fund) => fund.id !== id));
      } else {
        console.warn('Fund item not found:', id);
      }
    } catch (error) {
      console.error('Failed to delete fund item:', error);
      Alert.alert('Error', 'Failed to delete fund item');
    }
  };

  const updateFundField = async (id, key, value) => {
    try {
      const userId = passport?.id || 'default_user';
      // Update local state immediately for responsive UI
      const updatedFunds = funds.map((fund) =>
        (fund.id === id ? { ...fund, [key]: value } : fund)
      );
      setFunds(updatedFunds);
      
      // Find the updated fund
      const updatedFund = updatedFunds.find(f => f.id === id);
      if (!updatedFund) return;
      
      // Save to database
      // Map 'photo' key to 'photoUri' for the model
      const fundData = {
        type: updatedFund.type,
        amount: updatedFund.amount,
        currency: updatedFund.currency,
        details: updatedFund.details,
        photoUri: updatedFund.photo
      };
      
      await PassportDataService.saveFundItem({
        id: id,
        ...fundData
      }, userId);
      
      console.log('Fund item updated:', id, key);
    } catch (error) {
      console.error('Failed to update fund item:', error);
      // Optionally show error to user
    }
  };


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

  const handleTakePhoto = () => {
    // TODO: Implement take photo
  };

  // Function to copy image to permanent storage
  const copyImageToPermanentStorage = async (uri) => {
    try {
      // Create a permanent directory for fund photos if it doesn't exist
      const fundsDir = `${FileSystem.documentDirectory}funds/`;
      const dirInfo = await FileSystem.getInfoAsync(fundsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(fundsDir, { intermediates: true });
      }

      // Generate a unique filename
      const filename = `fund_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const permanentUri = fundsDir + filename;

      // Copy the image to permanent storage
      await FileSystem.copyAsync({
        from: uri,
        to: permanentUri
      });

      console.log('Image copied to permanent storage:', permanentUri);
      return permanentUri;
    } catch (error) {
      console.error('Failed to copy image to permanent storage:', error);
      // Return original URI as fallback
      return uri;
    }
  };

  const handleChoosePhoto = (id) => {
    Alert.alert(t('thailand.travelInfo.photo.choose', { defaultValue: '选择照片' }), '', [
      {
        text: t('thailand.travelInfo.photo.takePhoto', { defaultValue: '拍照' }),
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                t('thailand.travelInfo.photo.cameraPermission', { defaultValue: '需要相机权限' }), 
                t('thailand.travelInfo.photo.cameraPermissionMessage', { defaultValue: '请在设置中允许访问相机' })
              );
              return;
            }
              const permanentUri = await copyImageToPermanentStorage(result.assets[0].uri);
              updateFundField(id, 'photo', permanentUri);
          } catch (error) {
            console.error('Camera error:', error);
            Alert.alert(
              t('thailand.travelInfo.photo.cameraError', { defaultValue: '相机错误' }), 
              t('thailand.travelInfo.photo.cameraErrorMessage', { defaultValue: '模拟器不支持相机功能，请使用真机测试或选择相册照片' })
            );
          }
        },
      },
      {
        text: t('thailand.travelInfo.photo.fromLibrary', { defaultValue: '从相册选择' }),
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                t('thailand.travelInfo.photo.libraryPermission', { defaultValue: '需要相册权限' }), 
                t('thailand.travelInfo.photo.libraryPermissionMessage', { defaultValue: '请在设置中允许访问相册' })
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled) {
              const permanentUri = await copyImageToPermanentStorage(result.assets[0].uri);
              updateFundField(id, 'photo', permanentUri);
            }
          } catch (error) {
            console.error('Photo library error:', error);
            Alert.alert(
              t('thailand.travelInfo.photo.chooseFailed', { defaultValue: '选择照片失败' }), 
              t('thailand.travelInfo.photo.chooseFailedMessage', { defaultValue: '请重试' })
            );
          }
        },
      },
      { text: t('thailand.travelInfo.photo.cancel', { defaultValue: '取消' }), style: 'cancel' },
    ]);
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
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇹🇭</Text>
          <Text style={styles.title}>{t('thailand.travelInfo.title', { defaultValue: '填写泰国入境信息' })}</Text>
          <Text style={styles.subtitle}>{t('thailand.travelInfo.subtitle', { defaultValue: '请提供以下信息以完成入境卡生成' })}</Text>
          
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
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('thailand.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        <CollapsibleSection 
          title={t('thailand.travelInfo.sections.passport', { defaultValue: '护照信息' })} 
          onScan={handleScanPassport}
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
             onChangeText={setDob}
             mode="date"
             helpText="选择出生日期"
             error={!!errors.dob}
             errorMessage={errors.dob}
             onBlur={() => handleFieldBlur('dob', dob)}
           />
           <DateTimeInput
             label="护照有效期"
             value={expiryDate}
             onChangeText={setExpiryDate}
             mode="date"
             helpText="选择护照有效期"
             error={!!errors.expiryDate}
             errorMessage={errors.expiryDate}
             onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
           />
         </CollapsibleSection>

        <CollapsibleSection 
          title={t('thailand.travelInfo.sections.personal', { defaultValue: '个人信息' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <InputWithValidation 
             label="职业" 
             value={occupation} 
             onChangeText={setOccupation} 
             onBlur={() => handleFieldBlur('occupation', occupation)} 
             helpText="请输入您的职业 (请使用英文)" 
             error={!!errors.occupation} 
             errorMessage={errors.occupation}
             warning={!!warnings.occupation}
             warningMessage={warnings.occupation}
             fieldName="occupation"
             lastEditedField={lastEditedField}
             autoCapitalize="words" 
           />
           <Input label="居住城市" value={cityOfResidence} onChangeText={setCityOfResidence} onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)} helpText="请输入您居住的城市 (请使用英文)" error={!!errors.cityOfResidence} errorMessage={errors.cityOfResidence} autoCapitalize="words" />
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
          title={t('thailand.travelInfo.sections.funds', { defaultValue: 'Proof of Funds' })}
          isExpanded={expandedSection === 'funds'}
          onToggle={() => setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
        >
          <View style={styles.fundActions}>
            <Button title="添加现金" onPress={() => addFund('cash')} variant="secondary" style={styles.fundButton} />
            <Button title="添加信用卡照片" onPress={() => addFund('credit_card')} variant="secondary" style={styles.fundButton} />
            <Button title="添加银行账户余额" onPress={() => addFund('bank_balance')} variant="secondary" style={styles.fundButton} />
          </View>

          {funds.map((fund, index) => (
            <View key={fund.id} style={styles.fundItem}>
              <Text style={styles.fundType}>{{
                'cash': '现金',
                'credit_card': '信用卡照片',
                'bank_balance': '银行账户余额',
              }[fund.type]}</Text>
              {fund.type === 'cash' ? (
                <>
                  <Input
                    label="Amount"
                    value={fund.amount}
                    onChangeText={(text) => updateFundField(fund.id, 'amount', text)}
                    keyboardType="numeric"
                    testID="cash-amount-input"
                  />
                  <Input
                    label="Details"
                    value={fund.details}
                    onChangeText={(text) => updateFundField(fund.id, 'details', text)}
                  />
                </>
              ) : (
                <View>
                  <TouchableOpacity style={styles.photoButton} onPress={() => handleChoosePhoto(fund.id)}>
                    <Text style={styles.photoButtonText}>{fund.photo ? '更换照片' : '添加照片'}</Text>
                  </TouchableOpacity>
                  {fund.photo && (
                    <View>
                      <Text style={styles.photoDebug}>Photo URI: {fund.photo.substring(0, 50)}...</Text>
                      <Image 
                        source={{ uri: fund.photo }} 
                        style={styles.fundImage}
                        onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
                        onLoad={() => console.log('Image loaded successfully:', fund.photo)}
                      />
                    </View>
                  )}
                </View>
              )}
              <Button title="删除" onPress={() => removeFund(fund.id)} variant="danger" />
            </View>
          ))}
        </CollapsibleSection>

        <CollapsibleSection 
          title={t('thailand.travelInfo.sections.travel', { defaultValue: 'Travel Information' })}
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>旅行目的</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'HOLIDAY', label: '度假旅游', icon: '🏖️' },
                { value: 'MEETING', label: '会议', icon: '👔' },
                { value: 'SPORTS', label: '体育活动', icon: '⚽' },
                { value: 'BUSINESS', label: '商务', icon: '💼' },
                { value: 'INCENTIVE', label: '奖励旅游', icon: '🎁' },
                { value: 'CONVENTION', label: '会展', icon: '🎪' },
                { value: 'EDUCATION', label: '教育', icon: '📚' },
                { value: 'EMPLOYMENT', label: '就业', icon: '💻' },
                { value: 'EXHIBITION', label: '展览', icon: '🎨' },
                { value: 'MEDICAL', label: '医疗', icon: '🏥' },
                { value: 'OTHER', label: '其他', icon: '✏️' },
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

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>来程机票（入境泰国）</Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTickets}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
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
            onChangeText={setArrivalArrivalDate} 
            mode="date"
            helpText="格式: YYYY-MM-DD"
            error={!!errors.arrivalArrivalDate} 
            errorMessage={errors.arrivalArrivalDate}
            onBlur={() => handleFieldBlur('arrivalArrivalDate', arrivalArrivalDate)}
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
            onChangeText={setDepartureDepartureDate} 
            mode="date"
            helpText="格式: YYYY-MM-DD"
            error={!!errors.departureDepartureDate} 
            errorMessage={errors.departureDepartureDate}
            onBlur={() => handleFieldBlur('departureDepartureDate', departureDepartureDate)}
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
            onPress={() => {
              const newValue = !isTransitPassenger;
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
              // Trigger debounced save after transit passenger selection
              debouncedSaveData();
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
            <Text style={styles.fieldLabel}>住宿类型</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'HOTEL', label: '酒店', icon: '🏨' },
                { value: 'YOUTH_HOSTEL', label: '青年旅舍', icon: '🏠' },
                { value: 'GUEST_HOUSE', label: '民宿', icon: '🏡' },
                { value: 'FRIEND_HOUSE', label: '朋友家', icon: '👥' },
                { value: 'APARTMENT', label: '公寓', icon: '🏢' },
                { value: 'OTHER', label: '其他', icon: '✏️' },
              ].map((option) => {
                const isActive = accommodationType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      isActive && styles.optionButtonActive,
                    ]}
                    onPress={() => {
                      setAccommodationType(option.value);
                      if (option.value !== 'OTHER') {
                        setCustomAccommodationType('');
                      }
                      // Trigger debounced save after accommodation type selection
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
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${totalCompletionPercent}%`,
                    backgroundColor: getProgressColor()
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: getProgressColor() }]}>
              {getProgressText()}
            </Text>
          </View>

          {/* Smart Button with Dynamic Label */}
          <Button
            title={getSmartButtonLabel()}
            onPress={handleContinue}
            variant="primary"
            disabled={false}
          />
          
          {/* Completion Status Hint */}
          {totalCompletionPercent < 100 && (
            <Text style={styles.completionHint}>
              {t('thailand.travelInfo.completionHint')}
            </Text>
          )}
        </View>
      </ScrollView>
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
  fundItem: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  fundType: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  photoButton: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  fundImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: spacing.md,
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
});

export default ThailandTravelInfoScreen;
