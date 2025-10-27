// 入境通 - Malaysia Travel Info Screen (马来西亚入境信息)
// Comprehensive version matching Thailand's structure
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
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../components';
import SecureStorageService from '../../services/security/SecureStorageService';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import FieldStateManager from '../../utils/FieldStateManager';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../../services/data/UserDataService';

// Import Malaysia-specific utilities and constants
import { FieldWarningIcon, InputWithValidation, CollapsibleSection } from '../../components/thailand/ThailandTravelComponents';
import { parsePassportName } from '../../utils/NameParser';
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES, GENDER_OPTIONS, FUND_REQUIREMENTS } from './constants';
import OptionSelector from '../../components/thailand/OptionSelector';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const MalaysiaTravelInfoScreen = ({ navigation, route }) => {
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
      travelPurpose: 'TOURISM', // Most common purpose for Malaysia
      accommodationType: 'HOTEL', // Most common accommodation
      arrivalDate: tomorrow.toISOString().split('T')[0], // Default to tomorrow
      stayDuration: '7', // Default 1 week stay
      boardingCountry: passport?.nationality || 'CHN', // Default to passport nationality
    };
  };

  // Auto-complete suggestions for common scenarios
  const getAutoCompleteSuggestions = (fieldType, currentValue) => {
    const suggestions = {
      flightNumber: [
        'MH123', 'MH370', 'AK123', 'AK456', 'CX123', 'CX456',
        'SQ123', 'SQ456', 'MU123', 'MU456', 'CA123', 'CA456'
      ],
      hotelName: [
        'Kuala Lumpur Hilton', 'Penang Shangri-La',
        'Langkawi Marriott', 'Malacca Holiday Inn',
        'Petronas Towers Hotel', 'Grand Hyatt KL',
        'The Ritz-Carlton', 'Mandarin Oriental'
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
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Personal Info State (loaded from database)
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

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
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState(smartDefaults.arrivalDate);
  const [accommodationType, setAccommodationType] = useState('HOTEL');
  const [customAccommodationType, setCustomAccommodationType] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [stayDuration, setStayDuration] = useState(smartDefaults.stayDuration);

  // Document photos
  const [flightTicketPhoto, setFlightTicketPhoto] = useState(null);
  const [hotelReservationPhoto, setHotelReservationPhoto] = useState(null);

  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Auto-save state tracking
  const [saveStatus, setSaveStatus] = useState(null);
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
  const userInteractionTracker = useUserInteractionTracker('malaysia_travel_info');

  // Migration function to mark existing data as user-modified
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !userInteractionTracker.isInitialized) {
      return;
    }

    console.log('=== MIGRATING MALAYSIA EXISTING DATA TO INTERACTION STATE ===');

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
      if (personalInfo.countryRegion) existingDataToMigrate.residentCountry = personalInfo.countryRegion;
    }

    // Migrate travel info data
    if (userData.travelInfo) {
      const travelInfo = userData.travelInfo;
      if (travelInfo.travelPurpose) existingDataToMigrate.travelPurpose = travelInfo.travelPurpose;
      if (travelInfo.accommodationType) existingDataToMigrate.accommodationType = travelInfo.accommodationType;
      if (travelInfo.arrivalFlightNumber) existingDataToMigrate.arrivalFlightNumber = travelInfo.arrivalFlightNumber;
      if (travelInfo.arrivalDate) existingDataToMigrate.arrivalDate = travelInfo.arrivalDate;
      if (travelInfo.hotelAddress) existingDataToMigrate.hotelAddress = travelInfo.hotelAddress;
      if (travelInfo.lengthOfStay) existingDataToMigrate.stayDuration = travelInfo.lengthOfStay;
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
      'phoneCode', 'phoneNumber', 'email', 'occupation', 'residentCountry',
      'travelPurpose', 'customTravelPurpose', 'arrivalFlightNumber', 'arrivalDate',
      'accommodationType', 'customAccommodationType', 'hotelAddress', 'stayDuration'
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
          arrivalFlightNumber: arrivalFlightNumber,
          arrivalDate: arrivalDate,
          accommodationType: accommodationTypeFilled ? (accommodationType === 'OTHER' ? customAccommodationType : accommodationType) : '',
          hotelAddress: hotelAddress,
          stayDuration: stayDuration
        };

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

  // Calculate completion metrics
  const calculateCompletionMetrics = () => {
    try {
      const passportCount = getFieldCount('passport');
      const personalCount = getFieldCount('personal');
      const fundsCount = getFieldCount('funds');
      const travelCount = getFieldCount('travel');

      const totalFields = passportCount.total + personalCount.total + fundsCount.total + travelCount.total;
      const filledFields = passportCount.filled + personalCount.filled + fundsCount.filled + travelCount.filled;

      const percent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

      setTotalCompletionPercent(percent);
      setCompletionMetrics({
        passport: passportCount,
        personal: personalCount,
        funds: fundsCount,
        travel: travelCount,
        total: { filled: filledFields, total: totalFields },
        percent: percent
      });
    } catch (error) {
      console.error('Error calculating completion metrics:', error);
    }
  };

  // Recalculate completion whenever form data changes
  useEffect(() => {
    calculateCompletionMetrics();
  }, [
    passportNo, fullName, nationality, dob, expiryDate, sex,
    occupation, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, arrivalFlightNumber, arrivalDate,
    accommodationType, customAccommodationType, hotelAddress, stayDuration,
    funds
  ]);

  // Load data from UserDataService
  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      await UserDataService.initialize(userId);

      // Load all user data
      const allUserData = await UserDataService.getAllUserData(userId);

      // Load travel info
      const destinationId = destination?.id || 'malaysia';
      const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

      // Load fund items
      const fundItems = await UserDataService.getFundItems(userId);

      // Populate form fields
      if (allUserData.passport) {
        setPassportNo(allUserData.passport.passportNumber || '');
        setFullName(allUserData.passport.fullName || '');
        setNationality(allUserData.passport.nationality || '');
        setDob(allUserData.passport.dateOfBirth || '');
        setExpiryDate(allUserData.passport.expiryDate || '');
        setSex(allUserData.passport.gender || '');
      }

      if (allUserData.personalInfo) {
        setOccupation(allUserData.personalInfo.occupation || '');
        setResidentCountry(allUserData.personalInfo.countryRegion || '');
        setPhoneCode(allUserData.personalInfo.phoneCode || getPhoneCode(passport?.nationality || ''));
        setPhoneNumber(allUserData.personalInfo.phoneNumber || '');
        setEmail(allUserData.personalInfo.email || '');
      }

      if (travelInfo) {
        setTravelPurpose(travelInfo.travelPurpose || '');
        setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
        setArrivalDate(travelInfo.arrivalDate || travelInfo.arrivalArrivalDate || smartDefaults.arrivalDate);
        setAccommodationType(travelInfo.accommodationType || 'HOTEL');
        setHotelAddress(travelInfo.hotelAddress || '');
        setStayDuration(travelInfo.lengthOfStay || travelInfo.stayDuration || smartDefaults.stayDuration);
      }

      if (fundItems && fundItems.length > 0) {
        setFunds(fundItems);
      }

      // Migrate existing data to interaction state
      const userData = {
        passport: allUserData.passport,
        personalInfo: allUserData.personalInfo,
        travelInfo: travelInfo
      };
      await migrateExistingDataToInteractionState(userData);

    } catch (error) {
      console.error('Failed to load Malaysia travel info data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle field changes with user tracking
  const handleFieldChange = useCallback((fieldName, value, setter) => {
    setter(value);
    userInteractionTracker.markFieldAsUserModified(fieldName, value);
    setLastEditedField(fieldName);
    setLastEditedAt(new Date().toISOString());

    // Trigger auto-save
    debouncedSave();
  }, [userInteractionTracker]);

  // Debounced save function
  const debouncedSave = DebouncedSave.create(async () => {
    try {
      setSaveStatus('saving');

      // Save passport data
      await UserDataService.updatePassport(userId, {
        passportNumber: passportNo,
        fullName: fullName,
        nationality: nationality,
        dateOfBirth: dob,
        expiryDate: expiryDate,
        gender: sex,
      });

      // Save personal info
      await UserDataService.updatePersonalInfo(userId, {
        occupation: occupation,
        countryRegion: residentCountry,
        phoneCode: phoneCode,
        phoneNumber: phoneNumber,
        email: email,
      });

      // Save travel info
      const destinationId = destination?.id || 'malaysia';
      await UserDataService.updateTravelInfo(userId, destinationId, {
        travelPurpose: travelPurpose,
        arrivalFlightNumber: arrivalFlightNumber,
        arrivalDate: arrivalDate,
        accommodationType: accommodationType,
        hotelAddress: hotelAddress,
        lengthOfStay: stayDuration,
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save Malaysia travel info:', error);
      setSaveStatus('error');
    }
  }, 1000);

  // Handle photo upload
  const handlePhotoUpload = async (photoType) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload documents.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        if (photoType === 'flight') {
          setFlightTicketPhoto(result.assets[0].uri);
        } else if (photoType === 'hotel') {
          setHotelReservationPhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  // Fund management functions
  const addFund = (type) => {
    const newFund = {
      id: `fund_${Date.now()}`,
      type: type,
      amount: '',
      currency: 'MYR',
      description: '',
    };
    setCurrentFundItem(newFund);
    setNewFundItemType(type);
    setFundItemModalVisible(true);
  };

  const editFund = (fund) => {
    setSelectedFundItem(fund);
    setCurrentFundItem(fund);
    setFundItemModalVisible(true);
  };

  const saveFundItem = async (fundItem) => {
    try {
      if (selectedFundItem) {
        // Update existing fund
        const updatedFunds = funds.map(f => f.id === fundItem.id ? fundItem : f);
        setFunds(updatedFunds);
        await UserDataService.updateFundItems(userId, updatedFunds);
      } else {
        // Add new fund
        const updatedFunds = [...funds, fundItem];
        setFunds(updatedFunds);
        await UserDataService.updateFundItems(userId, updatedFunds);
      }
      setFundItemModalVisible(false);
      setSelectedFundItem(null);
      setCurrentFundItem(null);
      setNewFundItemType(null);
    } catch (error) {
      console.error('Error saving fund item:', error);
      Alert.alert('Error', 'Failed to save fund item. Please try again.');
    }
  };

  const deleteFundItem = async (fundId) => {
    try {
      const updatedFunds = funds.filter(f => f.id !== fundId);
      setFunds(updatedFunds);
      await UserDataService.updateFundItems(userId, updatedFunds);
      setFundItemModalVisible(false);
      setSelectedFundItem(null);
      setCurrentFundItem(null);
    } catch (error) {
      console.error('Error deleting fund item:', error);
      Alert.alert('Error', 'Failed to delete fund item. Please try again.');
    }
  };

  // Render functions
  const renderProgressHeader = () => {
    if (!completionMetrics) return null;

    const { percent } = completionMetrics;
    const progressColor = percent >= 100 ? '#34C759' : percent >= 50 ? '#FF9500' : colors.primary;
    const progressText = percent >= 100 ? '✅ 完成!' : percent >= 50 ? '进展不错 💪' : '继续加油 🌺';

    return (
      <View style={styles.progressHeader}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressLabel}>完成度</Text>
          <Text style={[styles.progressText, { color: progressColor }]}>{progressText}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: progressColor }]} />
          </View>
          <Text style={styles.progressPercent}>{percent}%</Text>
        </View>
        <Text style={styles.progressStats}>
          {completionMetrics.total.filled} / {completionMetrics.total.total} 项已填写
        </Text>
      </View>
    );
  };

  const renderGenderOptions = () => {
    return (
      <View style={styles.genderOptions}>
        {GENDER_OPTIONS.map((gender) => (
          <TouchableOpacity
            key={gender.value}
            style={[
              styles.genderOption,
              sex === gender.value && styles.genderOptionSelected
            ]}
            onPress={() => handleFieldChange('sex', gender.value, setSex)}
          >
            <View style={[
              styles.genderRadio,
              sex === gender.value && styles.genderRadioSelected
            ]}>
              {sex === gender.value && <View style={styles.genderRadioInner} />}
            </View>
            <Text style={[
              styles.genderLabel,
              sex === gender.value && styles.genderLabelSelected
            ]}>
              {gender.labelEn} / {gender.labelMs}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleContinue = () => {
    navigation.navigate('MalaysiaEntryFlow', {
      passport: passport,
      destination: destination,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>Malaysia Entry Info</Text>
        <View style={styles.headerRight}>
          {saveStatus && (
            <Text style={[
              styles.saveStatus,
              saveStatus === 'saved' && styles.saveStatusSuccess,
              saveStatus === 'error' && styles.saveStatusError
            ]}>
              {saveStatus === 'saving' && '💾'}
              {saveStatus === 'saved' && '✅'}
              {saveStatus === 'error' && '❌'}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={(e) => setScrollPosition(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇲🇾</Text>
          <Text style={styles.title}>
            {t('malaysia.travelInfo.title', { defaultValue: 'Malaysia Entry Information / Maklumat Kemasukan Malaysia' })}
          </Text>
          <Text style={styles.subtitle}>
            {t('malaysia.travelInfo.subtitle', { defaultValue: 'Please provide the following information / Sila berikan maklumat berikut' })}
          </Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('malaysia.travelInfo.privacyNotice', { defaultValue: 'All information is stored locally on your device / Semua maklumat disimpan secara tempatan di peranti anda' })}
          </Text>
        </View>

        {renderProgressHeader()}

        {/* Passport Section */}
        <CollapsibleSection
          title={t('malaysia.travelInfo.sections.passport', { defaultValue: '📘 Passport Info / Maklumat Pasport' })}
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
          <PassportNameInput
            value={fullName}
            onChangeText={(value) => handleFieldChange('fullName', value, setFullName)}
            helpText="Please fill in English / Sila isi dalam Bahasa Inggeris"
            error={!!errors.fullName}
            errorMessage={errors.fullName}
          />
          <NationalitySelector
            label="Nationality / Warganegara"
            value={nationality}
            onValueChange={(code) => handleFieldChange('nationality', code, setNationality)}
            helpText="Select your nationality / Pilih kewarganegaraan anda"
            error={!!errors.nationality}
            errorMessage={errors.nationality}
          />
          <InputWithUserTracking
            label="Passport No / No Pasport"
            value={passportNo}
            onChangeText={(value) => handleFieldChange('passportNo', value, setPassportNo)}
            helpText="Enter passport number / Masukkan nombor pasport"
            error={!!errors.passportNo}
            errorMessage={errors.passportNo}
            autoCapitalize="characters"
            fieldName="passportNo"
            userInteractionTracker={userInteractionTracker}
            lastEditedField={lastEditedField}
          />
          <DateTimeInput
            label="Date of Birth / Tarikh Lahir"
            value={dob}
            onChangeText={(value) => handleFieldChange('dob', value, setDob)}
            mode="date"
            dateType="past"
            helpText="Select date of birth / Pilih tarikh lahir"
            error={!!errors.dob}
            errorMessage={errors.dob}
          />
          <DateTimeInput
            label="Passport Expiry / Tamat Pasport"
            value={expiryDate}
            onChangeText={(value) => handleFieldChange('expiryDate', value, setExpiryDate)}
            mode="date"
            dateType="future"
            helpText="Select expiry date / Pilih tarikh tamat"
            error={!!errors.expiryDate}
            errorMessage={errors.expiryDate}
          />
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Gender / Jantina</Text>
            {renderGenderOptions()}
          </View>
        </CollapsibleSection>

        {/* Personal Info Section */}
        <CollapsibleSection
          title={t('malaysia.travelInfo.sections.personal', { defaultValue: '👤 Personal Info / Maklumat Peribadi' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
          <InputWithUserTracking
            label="Occupation / Pekerjaan"
            value={occupation}
            onChangeText={(value) => handleFieldChange('occupation', value, setOccupation)}
            helpText="Enter your occupation (in English) / Masukkan pekerjaan anda (dalam Bahasa Inggeris)"
            error={!!errors.occupation}
            errorMessage={errors.occupation}
            autoCapitalize="words"
            fieldName="occupation"
            userInteractionTracker={userInteractionTracker}
            lastEditedField={lastEditedField}
          />
          <NationalitySelector
            label="Resident Country / Negara Kediaman"
            value={residentCountry}
            onValueChange={(code) => {
              handleFieldChange('residentCountry', code, setResidentCountry);
              setPhoneCode(getPhoneCode(code));
            }}
            helpText="Select resident country / Pilih negara kediaman"
            error={!!errors.residentCountry}
            errorMessage={errors.residentCountry}
          />
          <View style={styles.phoneInputContainer}>
            <InputWithUserTracking
              label="Country Code / Kod Negara"
              value={phoneCode}
              onChangeText={(value) => handleFieldChange('phoneCode', value, setPhoneCode)}
              keyboardType="phone-pad"
              maxLength={5}
              error={!!errors.phoneCode}
              errorMessage={errors.phoneCode}
              style={styles.phoneCodeInput}
              fieldName="phoneCode"
              userInteractionTracker={userInteractionTracker}
              lastEditedField={lastEditedField}
            />
            <InputWithUserTracking
              label="Phone Number / Nombor Telefon"
              value={phoneNumber}
              onChangeText={(value) => handleFieldChange('phoneNumber', value, setPhoneNumber)}
              keyboardType="phone-pad"
              helpText="Enter phone number / Masukkan nombor telefon"
              error={!!errors.phoneNumber}
              errorMessage={errors.phoneNumber}
              style={styles.phoneInput}
              fieldName="phoneNumber"
              userInteractionTracker={userInteractionTracker}
              lastEditedField={lastEditedField}
            />
          </View>
          <InputWithUserTracking
            label="Email / E-mel"
            value={email}
            onChangeText={(value) => handleFieldChange('email', value, setEmail)}
            keyboardType="email-address"
            helpText="Enter email address / Masukkan alamat e-mel"
            error={!!errors.email}
            errorMessage={errors.email}
            fieldName="email"
            userInteractionTracker={userInteractionTracker}
            lastEditedField={lastEditedField}
          />
        </CollapsibleSection>

        {/* Travel Info Section */}
        <CollapsibleSection
          title={t('malaysia.travelInfo.sections.travel', { defaultValue: '✈️ Travel Info / Maklumat Perjalanan' })}
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <OptionSelector
            label="Travel Purpose / Tujuan Perjalanan"
            options={PREDEFINED_TRAVEL_PURPOSES}
            selectedValue={travelPurpose}
            onSelect={(value) => handleFieldChange('travelPurpose', value, setTravelPurpose)}
            customValue={customTravelPurpose}
            onCustomChange={(value) => handleFieldChange('customTravelPurpose', value, setCustomTravelPurpose)}
            customPlaceholder="Enter custom purpose / Masukkan tujuan lain"
          />

          <InputWithUserTracking
            label="Flight Number / Nombor Penerbangan"
            value={arrivalFlightNumber}
            onChangeText={(value) => handleFieldChange('arrivalFlightNumber', value, setArrivalFlightNumber)}
            helpText="Enter arrival flight number / Masukkan nombor penerbangan ketibaan"
            error={!!errors.arrivalFlightNumber}
            errorMessage={errors.arrivalFlightNumber}
            autoCapitalize="characters"
            fieldName="arrivalFlightNumber"
            userInteractionTracker={userInteractionTracker}
            lastEditedField={lastEditedField}
          />

          <DateTimeInput
            label="Arrival Date / Tarikh Ketibaan"
            value={arrivalDate}
            onChangeText={(value) => handleFieldChange('arrivalDate', value, setArrivalDate)}
            mode="date"
            dateType="future"
            helpText="Select date / Pilih tarikh"
            error={!!errors.arrivalDate}
            errorMessage={errors.arrivalDate}
          />

          <OptionSelector
            label="Accommodation Type / Jenis Penginapan"
            options={PREDEFINED_ACCOMMODATION_TYPES}
            selectedValue={accommodationType}
            onSelect={(value) => handleFieldChange('accommodationType', value, setAccommodationType)}
            customValue={customAccommodationType}
            onCustomChange={(value) => handleFieldChange('customAccommodationType', value, setCustomAccommodationType)}
            customPlaceholder="Enter custom accommodation / Masukkan jenis penginapan lain"
          />

          <InputWithUserTracking
            label="Address in Malaysia / Alamat di Malaysia"
            value={hotelAddress}
            onChangeText={(value) => handleFieldChange('hotelAddress', value, setHotelAddress)}
            multiline
            helpText="Enter full address / Masukkan alamat lengkap"
            error={!!errors.hotelAddress}
            errorMessage={errors.hotelAddress}
            autoCapitalize="words"
            fieldName="hotelAddress"
            userInteractionTracker={userInteractionTracker}
            lastEditedField={lastEditedField}
          />

          <InputWithUserTracking
            label="Length of Stay (days) / Tempoh Penginapan (hari)"
            value={stayDuration}
            onChangeText={(value) => handleFieldChange('stayDuration', value, setStayDuration)}
            helpText="Enter number of days / Masukkan bilangan hari"
            error={!!errors.stayDuration}
            errorMessage={errors.stayDuration}
            keyboardType="numeric"
            fieldName="stayDuration"
            userInteractionTracker={userInteractionTracker}
            lastEditedField={lastEditedField}
          />

          {/* Document Photos */}
          <View style={styles.documentSection}>
            <Text style={styles.documentSectionTitle}>Supporting Documents (Optional)</Text>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handlePhotoUpload('flight')}
            >
              <Text style={styles.uploadButtonIcon}>✈️</Text>
              <View style={styles.uploadButtonContent}>
                <Text style={styles.uploadButtonTitle}>Flight Ticket</Text>
                <Text style={styles.uploadButtonSubtitle}>
                  {flightTicketPhoto ? 'Uploaded ✓' : 'Tap to upload'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => handlePhotoUpload('hotel')}
            >
              <Text style={styles.uploadButtonIcon}>🏨</Text>
              <View style={styles.uploadButtonContent}>
                <Text style={styles.uploadButtonTitle}>Hotel Reservation</Text>
                <Text style={styles.uploadButtonSubtitle}>
                  {hotelReservationPhoto ? 'Uploaded ✓' : 'Tap to upload'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>

        {/* Funds Section */}
        <CollapsibleSection
          title="💰 Funds Proof / Bukti Kewangan"
          isExpanded={expandedSection === 'funds'}
          onToggle={() => setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
        >
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroIcon}>💳</Text>
            <Text style={styles.sectionIntroText}>
              Malaysia immigration requires proof of sufficient funds for your stay. The minimum requirement is approximately MYR {FUND_REQUIREMENTS.MINIMUM_PER_DAY_MYR} (~{FUND_REQUIREMENTS.MINIMUM_PER_DAY_THB} THB or ~${FUND_REQUIREMENTS.MINIMUM_PER_DAY_USD} USD) per day.
            </Text>
            <Text style={styles.sectionIntroTextSecondary}>
              Imigresen Malaysia memerlukan bukti dana yang mencukupi untuk penginapan anda. Keperluan minimum adalah kira-kira MYR {FUND_REQUIREMENTS.MINIMUM_PER_DAY_MYR} sehari.
            </Text>
          </View>

          <View style={styles.fundActions}>
            <Button
              title="Add Cash / Tambah Tunai"
              onPress={() => addFund('cash')}
              variant="secondary"
              style={styles.fundButton}
            />
            <Button
              title="Add Credit Card / Tambah Kad Kredit"
              onPress={() => addFund('credit_card')}
              variant="secondary"
              style={styles.fundButton}
            />
            <Button
              title="Add Bank Balance / Tambah Baki Bank"
              onPress={() => addFund('bank_balance')}
              variant="secondary"
              style={styles.fundButton}
            />
          </View>

          {funds.length === 0 ? (
            <View style={styles.fundEmptyState}>
              <Text style={styles.fundEmptyText}>
                No funds added yet. Please add at least one fund proof.
              </Text>
              <Text style={styles.fundEmptyTextSecondary}>
                Tiada dana ditambah lagi. Sila tambah sekurang-kurangnya satu bukti dana.
              </Text>
            </View>
          ) : (
            <View style={styles.fundList}>
              {funds.map((fund) => (
                <TouchableOpacity
                  key={fund.id}
                  style={styles.fundItem}
                  onPress={() => editFund(fund)}
                >
                  <Text style={styles.fundItemIcon}>
                    {fund.type === 'cash' ? '💵' : fund.type === 'credit_card' ? '💳' : '🏦'}
                  </Text>
                  <View style={styles.fundItemContent}>
                    <Text style={styles.fundItemType}>
                      {fund.type === 'cash' ? 'Cash / Tunai' :
                       fund.type === 'credit_card' ? 'Credit Card / Kad Kredit' :
                       'Bank Balance / Baki Bank'}
                    </Text>
                    <Text style={styles.fundItemAmount}>
                      {fund.currency} {fund.amount || 'Not specified'}
                    </Text>
                  </View>
                  <Text style={styles.fundItemArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </CollapsibleSection>

        <View style={styles.bottomActions}>
          <Button
            title="Continue to Entry Flow →"
            onPress={handleContinue}
            variant="primary"
            style={styles.continueButton}
          />
        </View>
      </ScrollView>

      {/* Fund Item Modal */}
      <FundItemDetailModal
        visible={fundItemModalVisible}
        fundItem={currentFundItem}
        onSave={saveFundItem}
        onDelete={selectedFundItem ? () => deleteFundItem(selectedFundItem.id) : null}
        onCancel={() => {
          setFundItemModalVisible(false);
          setSelectedFundItem(null);
          setCurrentFundItem(null);
          setNewFundItemType(null);
        }}
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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  saveStatus: {
    fontSize: 16,
  },
  saveStatusSuccess: {
    color: colors.success,
  },
  saveStatusError: {
    color: colors.error,
  },
  scrollContainer: {
    paddingBottom: spacing.xl,
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
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  privacyText: {
    ...typography.body2,
    color: colors.primary,
    flex: 1,
  },
  progressHeader: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  progressText: {
    ...typography.body1,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
  progressStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneCodeInput: {
    flex: 0.3,
  },
  phoneInput: {
    flex: 0.7,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  genderRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderRadioSelected: {
    borderColor: colors.primary,
  },
  genderRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  genderLabel: {
    ...typography.body2,
    color: colors.text,
  },
  genderLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  documentSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  documentSectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  uploadButtonIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  uploadButtonContent: {
    flex: 1,
  },
  uploadButtonTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  uploadButtonSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionIntro: {
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  sectionIntroText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  sectionIntroTextSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  fundActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fundButton: {
    flex: 1,
    minWidth: 100,
  },
  fundEmptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  fundEmptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  fundEmptyTextSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fundList: {
    gap: spacing.sm,
  },
  fundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fundItemIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  fundItemContent: {
    flex: 1,
  },
  fundItemType: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  fundItemAmount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fundItemArrow: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  bottomActions: {
    padding: spacing.md,
  },
  continueButton: {
    marginBottom: spacing.sm,
  },
});

export default MalaysiaTravelInfoScreen;
