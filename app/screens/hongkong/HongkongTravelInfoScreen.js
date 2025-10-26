
// 入境通 - Hong Kong Travel Info Screen (香港入境信息)
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
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../components';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';

// Import secure data models and services
import UserDataService from '../../services/data/UserDataService';
import { hongkongEntryGuide } from '../../config/entryGuide/hongkong';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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

const HongkongTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination: rawDestination } = route.params || {};
  const { t } = useLocale();

  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

  // Memoize destination to prevent unnecessary re-renders
  const destination = useMemo(() => rawDestination, [rawDestination?.id, rawDestination?.name]);

  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // Smart defaults for common scenarios
  const getSmartDefaults = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      arrivalDate: tomorrow.toISOString().split('T')[0],
      departureDate: nextWeek.toISOString().split('T')[0],
      stayDuration: '7',
    };
  };

  const smartDefaults = getSmartDefaults();

  // Data model instances
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);

  // UI State (loaded from database, not from route params)
  const [passportNo, setPassportNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Personal Info State (loaded from database)
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Travel Info State - with smart defaults
  const [travelPurpose, setTravelPurpose] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState(smartDefaults.arrivalDate);
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDate, setDepartureDate] = useState(smartDefaults.departureDate);
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [stayDuration, setStayDuration] = useState(smartDefaults.stayDuration);
  const [previousVisit, setPreviousVisit] = useState(false);
  const [lastVisitDate, setLastVisitDate] = useState('');

  // Proof of Funds State
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [currentFundItem, setCurrentFundItem] = useState(null);
  const [newFundItemType, setNewFundItemType] = useState(null);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Auto-save state tracking
  const [saveStatus, setSaveStatus] = useState(null); // 'pending', 'saving', 'saved', 'error', or null
  const [lastEditedAt, setLastEditedAt] = useState(null);

  // Completion tracking
  const [completionMetrics, setCompletionMetrics] = useState(null);
  const [totalCompletionPercent, setTotalCompletionPercent] = useState(0);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('hongkong_travel_info');

  // Session state tracking
  const scrollViewRef = useRef(null);
  const hasMigratedRef = useRef(false);

  // Migration function to mark existing data as user-modified
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !userInteractionTracker.isInitialized || hasMigratedRef.current) {
      return;
    }

    console.log('=== MIGRATING EXISTING DATA TO INTERACTION STATE (HONG KONG) ===');

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
      if (travelInfo.arrivalFlightNumber) existingDataToMigrate.arrivalFlightNumber = travelInfo.arrivalFlightNumber;
      if (travelInfo.arrivalArrivalDate) existingDataToMigrate.arrivalDate = travelInfo.arrivalArrivalDate;
      if (travelInfo.departureFlightNumber) existingDataToMigrate.departureFlightNumber = travelInfo.departureFlightNumber;
      if (travelInfo.departureDepartureDate) existingDataToMigrate.departureDate = travelInfo.departureDepartureDate;
      if (travelInfo.hotelName) existingDataToMigrate.hotelName = travelInfo.hotelName;
      if (travelInfo.hotelAddress) existingDataToMigrate.hotelAddress = travelInfo.hotelAddress;
      if (travelInfo.lengthOfStay) existingDataToMigrate.stayDuration = travelInfo.lengthOfStay;
      if (travelInfo.previousVisit !== undefined) existingDataToMigrate.previousVisit = travelInfo.previousVisit;
      if (travelInfo.lastVisitDate) existingDataToMigrate.lastVisitDate = travelInfo.lastVisitDate;
    }

    console.log('Data to migrate:', existingDataToMigrate);
    console.log('Number of fields to migrate:', Object.keys(existingDataToMigrate).length);

    if (Object.keys(existingDataToMigrate).length > 0) {
      userInteractionTracker.initializeWithExistingData(existingDataToMigrate);
      hasMigratedRef.current = true; // Mark migration as completed
      console.log('✅ Migration completed - existing data marked as user-modified');
    } else {
      console.log('⚠️ No existing data found to migrate');
    }
  }, [userInteractionTracker]);

  // Count filled fields for each section
  const getFieldCount = (section) => {
    switch (section) {
      case 'passport':
        const passportFields = {
          fullName, nationality, passportNo, dob, expiryDate
        };
        const passportFilledCount = Object.values(passportFields).filter(
          value => value !== null && value !== undefined && value !== ''
        ).length;
        return {
          filled: passportFilledCount,
          total: Object.keys(passportFields).length
        };

      case 'personal':
        const personalFields = {
          occupation, residentCountry, phoneCode, phoneNumber, email, sex
        };
        const personalFilledCount = Object.values(personalFields).filter(
          value => value !== null && value !== undefined && value !== ''
        ).length;
        return {
          filled: personalFilledCount,
          total: Object.keys(personalFields).length
        };

      case 'travel':
        const travelFields = {
          travelPurpose, arrivalFlightNumber, arrivalDate,
          departureFlightNumber, departureDate, hotelName, hotelAddress, stayDuration
        };
        // Add lastVisitDate if previousVisit is true
        if (previousVisit) {
          travelFields.lastVisitDate = lastVisitDate;
        }
        const travelFilledCount = Object.values(travelFields).filter(
          value => value !== null && value !== undefined && value !== ''
        ).length;
        return {
          filled: travelFilledCount,
          total: Object.keys(travelFields).length
        };

      case 'funds':
        const fundItemCount = funds.length;
        if (fundItemCount === 0) {
          return { filled: 0, total: 1 };
        } else {
          return { filled: fundItemCount, total: fundItemCount };
        }
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
          funds: {
            completed: fundsCount.filled,
            total: fundsCount.total,
            percentage:
              fundsCount.total > 0
                ? Math.round((fundsCount.filled / fundsCount.total) * 100)
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

  // Check if form is valid
  const isFormValid = () => {
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    const allFieldsFilled =
      passportCount.filled === passportCount.total &&
      personalCount.filled === personalCount.total &&
      fundsCount.filled === fundsCount.total &&
      travelCount.filled === travelCount.total;

    const noErrors = Object.keys(errors).length === 0;

    return allFieldsFilled && noErrors;
  };

  // Recalculate completion metrics when fields change
  useEffect(() => {
    if (!isLoading && userInteractionTracker.isInitialized) {
      calculateCompletionMetrics();
    }
  }, [
    passportNo, fullName, nationality, dob, expiryDate, sex,
    occupation, residentCountry, phoneCode, phoneNumber, email,
    funds,
    travelPurpose, arrivalFlightNumber, arrivalDate, departureFlightNumber,
    departureDate, hotelName, hotelAddress, stayDuration, previousVisit, lastVisitDate,
    isLoading, userInteractionTracker.isInitialized
  ]);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);
        await UserDataService.initialize(userId);

        const userData = await UserDataService.getAllUserData(userId);

        const passportInfo = userData?.passport;
        if (passportInfo) {
          setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');
          setFullName(passportInfo.fullName || passport?.nameEn || passport?.name || '');
          setNationality(passportInfo.nationality || passport?.nationality || '');
          setDob(passportInfo.dateOfBirth || passport?.dob || '');
          setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');
          setPassportData(passportInfo);
        } else {
          setPassportNo(passport?.passportNo || '');
          setFullName(passport?.nameEn || passport?.name || '');
          setNationality(passport?.nationality || '');
          setDob(passport?.dob || '');
          setExpiryDate(passport?.expiry || '');
        }

        const personalInfo = userData?.personalInfo;
        if (personalInfo) {
          setOccupation(personalInfo.occupation || '');
          setResidentCountry(personalInfo.countryRegion || '');
          setPhoneNumber(personalInfo.phoneNumber || '');
          setEmail(personalInfo.email || '');

          setPhoneCode(getPhoneCode(personalInfo.countryRegion || passport?.nationality || ''));

          setPersonalInfoData(personalInfo);
        } else {
          setPhoneCode(getPhoneCode(passport?.nationality || ''));
        }

        // Gender - load from passport only (single source of truth)
        const loadedSex = passportInfo?.gender || passport?.sex || passport?.gender || sex || 'Male';
        setSex(loadedSex);

        const destinationId = destination?.id || 'hongkong';
        let travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

        if (!travelInfo && destination?.name) {
          travelInfo = await UserDataService.getTravelInfo(userId, destination.name);
        }

        if (travelInfo) {
          setTravelPurpose(travelInfo.travelPurpose || '');
          setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
          setArrivalDate(travelInfo.arrivalArrivalDate || smartDefaults.arrivalDate);
          setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
          setDepartureDate(travelInfo.departureDepartureDate || smartDefaults.departureDate);
          setHotelName(travelInfo.hotelName || '');
          setHotelAddress(travelInfo.hotelAddress || '');
          setStayDuration(travelInfo.lengthOfStay || smartDefaults.stayDuration);
          setPreviousVisit(travelInfo.previousVisit || false);
          setLastVisitDate(travelInfo.lastVisitDate || '');
        }

        // Load funds
        await refreshFundItems();

        // Trigger migration (will only happen once due to hasMigratedRef check)
        if (userInteractionTracker.isInitialized && !hasMigratedRef.current) {
          // Add travelInfo to userData for migration
          if (travelInfo) {
            userData.travelInfo = travelInfo;
          }
          migrateExistingDataToInteractionState(userData);
        }

      } catch (error) {
        console.error('Failed to load saved data:', error);
        setPassportNo(passport?.passportNo || '');
        setFullName(passport?.nameEn || passport?.name || '');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFieldChange = (fieldName, value, setter) => {
    setter(value);
    userInteractionTracker.markFieldAsUserModified(fieldName, value);
    setSaveStatus('pending');
    debouncedSaveData();
  };

  const saveDataToSecureStorage = async () => {
    try {
      const existingPassport = await UserDataService.getPassport(userId);

      const passportUpdates = {};
      if (passportNo) passportUpdates.passportNumber = passportNo;
      if (fullName) passportUpdates.fullName = fullName;
      if (nationality) passportUpdates.nationality = nationality;
      if (dob) passportUpdates.dateOfBirth = dob;
      if (expiryDate) passportUpdates.expiryDate = expiryDate;
      if (sex) passportUpdates.gender = sex;

      if (Object.keys(passportUpdates).length > 0) {
        if (existingPassport && existingPassport.id) {
          await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
        } else {
          await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
        }
      }

      const personalInfoUpdates = {};
      if (phoneNumber) personalInfoUpdates.phoneNumber = phoneNumber;
      if (email) personalInfoUpdates.email = email;
      if (occupation) personalInfoUpdates.occupation = occupation;
      if (residentCountry) personalInfoUpdates.countryRegion = residentCountry;

      if (Object.keys(personalInfoUpdates).length > 0) {
        await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      }

      const travelInfoUpdates = {};
      if (travelPurpose) travelInfoUpdates.travelPurpose = travelPurpose;
      if (arrivalFlightNumber) travelInfoUpdates.arrivalFlightNumber = arrivalFlightNumber;
      if (arrivalDate) travelInfoUpdates.arrivalArrivalDate = arrivalDate;
      if (departureFlightNumber) travelInfoUpdates.departureFlightNumber = departureFlightNumber;
      if (departureDate) travelInfoUpdates.departureDepartureDate = departureDate;
      if (hotelName) travelInfoUpdates.hotelName = hotelName;
      if (hotelAddress) travelInfoUpdates.hotelAddress = hotelAddress;
      if (stayDuration) travelInfoUpdates.lengthOfStay = stayDuration;
      travelInfoUpdates.previousVisit = previousVisit;
      if (lastVisitDate) travelInfoUpdates.lastVisitDate = lastVisitDate;

      if (Object.keys(travelInfoUpdates).length > 0) {
        const destinationId = destination?.id || 'hongkong';
        await UserDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);
      }
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
      throw error;
    }
  };

  // Create debounced save function with error handling (using singleton pattern)
  const debouncedSaveData = DebouncedSave.debouncedSave(
    'hongkong_travel_info',
    async () => {
      await saveDataToSecureStorage();
      setLastEditedAt(new Date().toISOString());
    },
    1000,
    {
      maxRetries: 3,
      retryDelay: 1000,
      onError: (error, retryCount) => {
        setSaveStatus('error');
        console.error('❌ Auto-save failed:', error);
        setTimeout(() => setSaveStatus(null), 3000);
      },
      onRetry: (error, retryCount, maxRetries) => {
        console.log(`🔄 Retrying save (attempt ${retryCount}/${maxRetries})...`);
      },
    }
  );

  // Fund management functions
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
      setFunds((prev) => prev.filter((fund) => fund.id !== id));
      await refreshFundItems({ forceRefresh: true });

      console.log('💾 Triggering save after fund item deletion...');
      await DebouncedSave.flushPendingSave('hongkong_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Failed to refresh fund items after deletion:', error);
    } finally {
      handleFundItemModalClose();
    }
  };

  // Monitor save status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('hongkong_travel_info');
      if (currentStatus === 'saving') {
        setSaveStatus('saving');
        console.log('🔄 Auto-save started...');
      } else if (currentStatus === 'saved') {
        setSaveStatus('saved');
        console.log('✅ Auto-save completed');
        setTimeout(() => setSaveStatus(null), 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Add blur listener to save data when leaving the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      DebouncedSave.flushPendingSave('hongkong_travel_info');
    });

    return unsubscribe;
  }, [navigation]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      try {
        DebouncedSave.flushPendingSave('hongkong_travel_info');
      } catch (error) {
        console.error('Failed to save data on component unmount:', error);
      }
    };
  }, []);

  const handleContinue = async () => {
    if (!isFormValid()) {
      Alert.alert(
        t('hongkong.travelInfo.alerts.incompleteTitle', { defaultValue: '信息不完整' }),
        t('hongkong.travelInfo.alerts.incompleteMessage', { defaultValue: '请填写所有必填信息' })
      );
      return;
    }

    // Flush any pending saves before continuing
    try {
      await DebouncedSave.flushPendingSave('hongkong_travel_info');
    } catch (error) {
      console.error('Failed to save before continuing:', error);
    }

    navigation.navigate('Result', {
      destination: destination || { id: 'hongkong' },
    });
  };

  const handleGoBack = async () => {
    // Flush any pending saves before going back
    try {
      await DebouncedSave.flushPendingSave('hongkong_travel_info');
    } catch (error) {
      console.error('Failed to save before going back:', error);
    }
    navigation.goBack();
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
                setSex(option.value);
                await saveDataToSecureStorage();
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇭🇰</Text>
          <Text style={styles.title}>{t('hongkong.travelInfo.title', { defaultValue: '填写香港入境信息' })}</Text>
          <Text style={styles.subtitle}>{t('hongkong.travelInfo.subtitle', { defaultValue: '请提供以下信息以完成入境卡生成' })}</Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('hongkong.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        <CollapsibleSection 
          title={t('hongkong.travelInfo.sections.passport', { defaultValue: '护照信息' })} 
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
           <PassportNameInput
             value={fullName}
             onChangeText={setFullName}
             onBlur={() => handleFieldBlur('fullName', fullName)}
             helpText="请填写汉语拼音"
             error={!!errors.fullName}
             errorMessage={errors.fullName}
           />
           <NationalitySelector
             label="国籍"
             value={nationality}
             onValueChange={(code) => {
               setNationality(code);
               handleFieldBlur('nationality', code);
             }}
             helpText="请选择您的国籍"
             error={!!errors.nationality}
             errorMessage={errors.nationality}
           />
           <Input label="护照号" value={passportNo} onChangeText={setPassportNo} onBlur={() => handleFieldBlur('passportNo', passportNo)} helpText="请输入您的护照号码" error={!!errors.passportNo} errorMessage={errors.passportNo} autoCapitalize="characters" />
           <DateTimeInput
             label="出生日期"
             value={dob}
             onChangeText={setDob}
             mode="date"
             dateType="past"
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
             dateType="future"
             helpText="选择护照有效期"
             error={!!errors.expiryDate}
             errorMessage={errors.expiryDate}
             onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
           />
         </CollapsibleSection>

        <CollapsibleSection 
          title={t('hongkong.travelInfo.sections.personal', { defaultValue: '个人信息' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <Input label="职业" value={occupation} onChangeText={setOccupation} onBlur={() => handleFieldBlur('occupation', occupation)} helpText="请输入您的职业 (请使用英文)" error={!!errors.occupation} errorMessage={errors.occupation} autoCapitalize="words" />
           <NationalitySelector
             label="居住国家"
             value={residentCountry}
             onValueChange={(code) => {
               setResidentCountry(code);
               setPhoneCode(getPhoneCode(code));
               handleFieldBlur('residentCountry', code);
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
               maxLength={5}
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
           <Input label="电子邮箱" value={email} onChangeText={setEmail} onBlur={() => handleFieldBlur('email', email)} keyboardType="email-address" helpText="请输入您的电子邮箱地址" error={!!errors.email} errorMessage={errors.email} />
           <View style={styles.fieldContainer}>
             <Text style={styles.fieldLabel}>性别</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        <CollapsibleSection
          title="旅行信息"
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>旅行目的</Text>
            <View style={styles.optionsContainer}>
              {[
                { value: 'TOURISM', label: '旅游观光' },
                { value: 'BUSINESS', label: '商务' },
                { value: 'VISIT_FAMILY', label: '探亲访友' },
                { value: 'TRANSIT', label: '过境' },
                { value: 'OTHER', label: '其他' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    travelPurpose === option.value && styles.optionButtonActive,
                  ]}
                  onPress={async () => {
                    setTravelPurpose(option.value);
                    await saveDataToSecureStorage();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      travelPurpose === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.subSectionTitle}>✈️ 抵达信息</Text>
          <Input
            label="抵达航班号"
            value={arrivalFlightNumber}
            onChangeText={setArrivalFlightNumber}
            onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
            helpText="请输入您的抵达航班号 (例如 CX123)"
            error={!!errors.arrivalFlightNumber}
            errorMessage={errors.arrivalFlightNumber}
            autoCapitalize="characters"
          />
          <DateTimeInput
            label="抵达日期"
            value={arrivalDate}
            onChangeText={setArrivalDate}
            mode="date"
            dateType="future"
            helpText="选择抵达日期"
            error={!!errors.arrivalDate}
            errorMessage={errors.arrivalDate}
            onBlur={() => handleFieldBlur('arrivalDate', arrivalDate)}
          />

          <Text style={styles.subSectionTitle}>🛫 离开信息</Text>
          <Input
            label="离开航班号"
            value={departureFlightNumber}
            onChangeText={setDepartureFlightNumber}
            onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)}
            helpText="请输入您的离开航班号 (例如 CX456)"
            error={!!errors.departureFlightNumber}
            errorMessage={errors.departureFlightNumber}
            autoCapitalize="characters"
          />
          <DateTimeInput
            label="离开日期"
            value={departureDate}
            onChangeText={setDepartureDate}
            mode="date"
            dateType="future"
            helpText="选择离开日期"
            error={!!errors.departureDate}
            errorMessage={errors.departureDate}
            onBlur={() => handleFieldBlur('departureDate', departureDate)}
          />

          <Text style={styles.subSectionTitle}>🏨 住宿信息</Text>
          <Input
            label="酒店名称"
            value={hotelName}
            onChangeText={setHotelName}
            onBlur={() => handleFieldBlur('hotelName', hotelName)}
            helpText="请输入酒店名称"
            error={!!errors.hotelName}
            errorMessage={errors.hotelName}
            autoCapitalize="words"
          />
          <Input
            label="在港住址"
            value={hotelAddress}
            onChangeText={setHotelAddress}
            onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
            multiline
            helpText="请输入详细地址"
            error={!!errors.hotelAddress}
            errorMessage={errors.hotelAddress}
            autoCapitalize="words"
          />
          <Input
            label="停留天数"
            value={stayDuration}
            onChangeText={setStayDuration}
            onBlur={() => handleFieldBlur('stayDuration', stayDuration)}
            helpText="请输入停留天数"
            error={!!errors.stayDuration}
            errorMessage={errors.stayDuration}
            keyboardType="numeric"
          />

          <Text style={styles.subSectionTitle}>📅 访问历史</Text>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>是否曾访问过香港？</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  previousVisit && styles.optionButtonActive,
                ]}
                onPress={async () => {
                  setPreviousVisit(true);
                  await saveDataToSecureStorage();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    previousVisit && styles.optionTextActive,
                  ]}
                >
                  是
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  !previousVisit && styles.optionButtonActive,
                ]}
                onPress={async () => {
                  setPreviousVisit(false);
                  setLastVisitDate('');
                  await saveDataToSecureStorage();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    !previousVisit && styles.optionTextActive,
                  ]}
                >
                  否
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {previousVisit && (
            <DateTimeInput
              label="上次访问日期"
              value={lastVisitDate}
              onChangeText={setLastVisitDate}
              mode="date"
              dateType="past"
              helpText="选择上次访问日期"
              error={!!errors.lastVisitDate}
              errorMessage={errors.lastVisitDate}
              onBlur={() => handleFieldBlur('lastVisitDate', lastVisitDate)}
            />
          )}
        </CollapsibleSection>

        <View style={styles.buttonContainer}>
          <Button
            title="生成入境包"
            onPress={handleContinue}
            variant="primary"
            disabled={!isFormValid()}
          />
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
    backgroundColor: '#d4edda',
  },
  fieldCountBadgeIncomplete: {
    backgroundColor: '#fff3cd',
  },
  fieldCountText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  fieldCountTextComplete: {
    color: '#155724',
  },
  fieldCountTextIncomplete: {
    color: '#856404',
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
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
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
  subSectionTitle: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});

export default HongkongTravelInfoScreen;
