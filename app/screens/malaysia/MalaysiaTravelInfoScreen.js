
// 入境通 - Malaysia Travel Info Screen (马来西亚入境信息)
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
import FieldStateManager from '../../utils/FieldStateManager';

// Import secure data models and services
import UserDataService from '../../services/data/UserDataService';

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
              <Text style={styles.scanText}>Scan / Imbas</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const MalaysiaTravelInfoScreen = ({ navigation, route }) => {
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
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState(smartDefaults.arrivalDate);
  const [hotelAddress, setHotelAddress] = useState('');
  const [stayDuration, setStayDuration] = useState(smartDefaults.stayDuration);

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
  const userInteractionTracker = useUserInteractionTracker('malaysia_travel_info');

  // Session state tracking
  const scrollViewRef = useRef(null);
  const hasMigratedRef = useRef(false);

  // Migration function to mark existing data as user-modified
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !userInteractionTracker.isInitialized || hasMigratedRef.current) {
      return;
    }

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
      if (travelInfo.arrivalFlightNumber) existingDataToMigrate.arrivalFlightNumber = travelInfo.arrivalFlightNumber;
      if (travelInfo.arrivalArrivalDate) existingDataToMigrate.arrivalDate = travelInfo.arrivalArrivalDate;
      if (travelInfo.hotelAddress) existingDataToMigrate.hotelAddress = travelInfo.hotelAddress;
      if (travelInfo.lengthOfStay) existingDataToMigrate.stayDuration = travelInfo.lengthOfStay;
    }

    if (Object.keys(existingDataToMigrate).length > 0) {
      userInteractionTracker.initializeWithExistingData(existingDataToMigrate);
      hasMigratedRef.current = true; // Mark migration as completed
    }
  }, [userInteractionTracker]);

  // Count filled fields for each section using FieldStateManager
  const getFieldCount = (section) => {
    // Build interaction state for FieldStateManager
    const interactionState = {};
    const allFieldNames = [
      'passportNo', 'fullName', 'nationality', 'dob', 'expiryDate', 'sex',
      'phoneCode', 'phoneNumber', 'email', 'occupation', 'residentCountry',
      'arrivalFlightNumber', 'arrivalDate', 'hotelAddress', 'stayDuration'
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
          expiryDate: expiryDate
        };

        // Count fields that have values (not just user-modified)
        const passportFilledCount = Object.values(passportFields).filter(
          value => value !== null && value !== undefined && value !== ''
        ).length;

        return {
          filled: passportFilledCount,
          total: Object.keys(passportFields).length
        };

      case 'personal':
        const personalFields = {
          occupation: occupation,
          residentCountry: residentCountry,
          phoneCode: phoneCode,
          phoneNumber: phoneNumber,
          email: email,
          sex: sex
        };

        // Count fields that have values (not just user-modified)
        const personalFilledCount = Object.values(personalFields).filter(
          value => value !== null && value !== undefined && value !== ''
        ).length;

        return {
          filled: personalFilledCount,
          total: Object.keys(personalFields).length
        };

      case 'travel':
        const travelFields = {
          arrivalFlightNumber: arrivalFlightNumber,
          arrivalDate: arrivalDate,
          hotelAddress: hotelAddress,
          stayDuration: stayDuration
        };

        // Count fields that have values (not just user-modified)
        const filledCount = Object.values(travelFields).filter(
          value => value !== null && value !== undefined && value !== ''
        ).length;

        return {
          filled: filledCount,
          total: Object.keys(travelFields).length
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
    arrivalFlightNumber, arrivalDate, hotelAddress, stayDuration,
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
          const loadedSex = passportInfo?.gender || passport?.sex || 'Male';
          setSex(loadedSex);

          setOccupation(personalInfo.occupation || '');
          setResidentCountry(personalInfo.countryRegion || '');
          setPhoneNumber(personalInfo.phoneNumber || '');
          setEmail(personalInfo.email || '');

          setPhoneCode(getPhoneCode(personalInfo.countryRegion || passport?.nationality || ''));

          setPersonalInfoData(personalInfo);
        } else {
          setSex(passport?.sex || 'Male');
          setPhoneCode(getPhoneCode(passport?.nationality || ''));
        }

        const destinationId = destination?.id || 'malaysia';
        let travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

        if (!travelInfo && destination?.name) {
          travelInfo = await UserDataService.getTravelInfo(userId, destination.name);
        }

        if (travelInfo) {
          setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
          setArrivalDate(travelInfo.arrivalArrivalDate || smartDefaults.arrivalDate);
          setHotelAddress(travelInfo.hotelAddress || '');
          setStayDuration(travelInfo.lengthOfStay || smartDefaults.stayDuration);
        }

        // Load funds
        await refreshFundItems();

        // Trigger migration (will only happen once due to hasMigratedRef check)
        if (userInteractionTracker.isInitialized && !hasMigratedRef.current) {
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
      if (arrivalFlightNumber) travelInfoUpdates.arrivalFlightNumber = arrivalFlightNumber;
      if (arrivalDate) travelInfoUpdates.arrivalArrivalDate = arrivalDate;
      if (hotelAddress) travelInfoUpdates.hotelAddress = hotelAddress;
      if (stayDuration) travelInfoUpdates.lengthOfStay = stayDuration;

      if (Object.keys(travelInfoUpdates).length > 0) {
        const destinationId = destination?.id || 'malaysia';
        await UserDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);
      }
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
      throw error;
    }
  };

  // Create debounced save function with error handling (using singleton pattern)
  const debouncedSaveData = DebouncedSave.debouncedSave(
    'malaysia_travel_info',
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
        console.error('Auto-save failed:', error);
        setTimeout(() => setSaveStatus(null), 3000);
      },
      onRetry: (error, retryCount, maxRetries) => {
        // Retry in progress
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

      // Trigger save to update entry_info with new fund item associations
      await DebouncedSave.flushPendingSave('malaysia_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Failed to update fund item state:', error);
    }
  };

  const handleFundItemCreate = async () => {
    try {
      await refreshFundItems({ forceRefresh: true });

      // Trigger save to update entry_info with new fund item
      await DebouncedSave.flushPendingSave('malaysia_travel_info');
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
      await DebouncedSave.flushPendingSave('malaysia_travel_info');
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
      const currentStatus = DebouncedSave.getSaveState('malaysia_travel_info');
      if (currentStatus === 'saving') {
        setSaveStatus('saving');
      } else if (currentStatus === 'saved') {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Add blur listener to save data when leaving the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      DebouncedSave.flushPendingSave('malaysia_travel_info');
    });

    return unsubscribe;
  }, [navigation]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      try {
        DebouncedSave.flushPendingSave('malaysia_travel_info');
      } catch (error) {
        console.error('Failed to save data on component unmount:', error);
      }
    };
  }, []);

  const handleContinue = async () => {
    if (!isFormValid()) {
      Alert.alert(
        t('malaysia.travelInfo.alerts.incompleteTitle', { defaultValue: 'Incomplete Information / Maklumat Tidak Lengkap' }),
        t('malaysia.travelInfo.alerts.incompleteMessage', { defaultValue: 'Please fill in all required information / Sila lengkapkan semua maklumat yang diperlukan' })
      );
      return;
    }

    // Save before navigating
    await DebouncedSave.flushPendingSave('malaysia_travel_info');

    navigation.navigate('MalaysiaEntryFlow', {
      destination: destination || { id: 'my', name: 'Malaysia' },
      passport: passport,
    });
  };

  const handleGoBack = async () => {
    // Save immediately before going back
    await DebouncedSave.flushPendingSave('malaysia_travel_info');
    navigation.goBack();
  };

  const renderGenderOptions = () => {
    const options = [
      { value: 'Female', label: t('malaysia.travelInfo.fields.sex.options.female', { defaultValue: 'Female / Perempuan' }) },
      { value: 'Male', label: t('malaysia.travelInfo.fields.sex.options.male', { defaultValue: 'Male / Lelaki' }) },
      { value: 'Undefined', label: t('malaysia.travelInfo.fields.sex.options.undefined', { defaultValue: 'Not Specified / Tidak Dinyatakan' }) }
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
              onPress={() => handleFieldChange('sex', option.value, setSex)}
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

  const renderProgressHeader = () => {
    if (isLoading || !completionMetrics) {
      return null;
    }

    const progressColor = totalCompletionPercent === 100
      ? '#34C759'
      : totalCompletionPercent >= 60
        ? '#FF9500'
        : colors.primary;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            {t('malaysia.travelInfo.progress.title', { defaultValue: 'Completion / Kemajuan' })}
          </Text>
          <Text style={[styles.progressPercent, { color: progressColor }]}>
            {totalCompletionPercent}%
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${totalCompletionPercent}%`,
                backgroundColor: progressColor
              }
            ]}
          />
        </View>
        {saveStatus && (
          <View style={styles.saveStatusContainer}>
            <Text style={styles.saveStatusText}>
              {saveStatus === 'saving' && '💾 Saving / Menyimpan...'}
              {saveStatus === 'saved' && '✅ Saved / Disimpan'}
              {saveStatus === 'error' && '❌ Save Failed / Gagal Disimpan'}
            </Text>
          </View>
        )}
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
        <Text style={styles.headerTitle}>{t('malaysia.travelInfo.headerTitle', { defaultValue: 'Malaysia Entry Info / Maklumat Kemasukan' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('malaysia.travelInfo.loading', { defaultValue: 'Loading data / Memuatkan data...' })}</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇲🇾</Text>
          <Text style={styles.title}>{t('malaysia.travelInfo.title', { defaultValue: 'Malaysia Entry Information / Maklumat Kemasukan Malaysia' })}</Text>
          <Text style={styles.subtitle}>{t('malaysia.travelInfo.subtitle', { defaultValue: 'Please provide the following information / Sila berikan maklumat berikut' })}</Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('malaysia.travelInfo.privacyNotice', { defaultValue: 'All information is stored locally on your device / Semua maklumat disimpan secara tempatan di peranti anda' })}
          </Text>
        </View>

        {renderProgressHeader()}

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
           <Input
             label="Passport No / No Pasport"
             value={passportNo}
             onChangeText={(value) => handleFieldChange('passportNo', value, setPassportNo)}
             helpText="Enter passport number / Masukkan nombor pasport"
             error={!!errors.passportNo}
             errorMessage={errors.passportNo}
             autoCapitalize="characters"
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
         </CollapsibleSection>

        <CollapsibleSection
          title={t('malaysia.travelInfo.sections.personal', { defaultValue: '👤 Personal Info / Maklumat Peribadi' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <Input
             label="Occupation / Pekerjaan"
             value={occupation}
             onChangeText={(value) => handleFieldChange('occupation', value, setOccupation)}
             helpText="Enter your occupation (in English) / Masukkan pekerjaan anda (dalam Bahasa Inggeris)"
             error={!!errors.occupation}
             errorMessage={errors.occupation}
             autoCapitalize="words"
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
             <Input
               label="Country Code / Kod Negara"
               value={phoneCode}
               onChangeText={(value) => handleFieldChange('phoneCode', value, setPhoneCode)}
               keyboardType="phone-pad"
               maxLength={5}
               error={!!errors.phoneCode}
               errorMessage={errors.phoneCode}
               style={styles.phoneCodeInput}
             />
             <Input
               label="Phone Number / Nombor Telefon"
               value={phoneNumber}
               onChangeText={(value) => handleFieldChange('phoneNumber', value, setPhoneNumber)}
               keyboardType="phone-pad"
               helpText="Enter phone number / Masukkan nombor telefon"
               error={!!errors.phoneNumber}
               errorMessage={errors.phoneNumber}
               style={styles.phoneInput}
             />
           </View>
           <Input
             label="Email / E-mel"
             value={email}
             onChangeText={(value) => handleFieldChange('email', value, setEmail)}
             keyboardType="email-address"
             helpText="Enter email address / Masukkan alamat e-mel"
             error={!!errors.email}
             errorMessage={errors.email}
           />
           <View style={styles.fieldContainer}>
             <Text style={styles.fieldLabel}>Gender / Jantina</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        <CollapsibleSection
          title={t('malaysia.travelInfo.sections.travel', { defaultValue: '✈️ Travel Info / Maklumat Perjalanan' })}
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <Input
            label="Flight Number / Nombor Penerbangan"
            value={arrivalFlightNumber}
            onChangeText={(value) => handleFieldChange('arrivalFlightNumber', value, setArrivalFlightNumber)}
            helpText="Enter arrival flight number / Masukkan nombor penerbangan ketibaan"
            error={!!errors.arrivalFlightNumber}
            errorMessage={errors.arrivalFlightNumber}
            autoCapitalize="characters"
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
          <Input
            label="Address in Malaysia / Alamat di Malaysia"
            value={hotelAddress}
            onChangeText={(value) => handleFieldChange('hotelAddress', value, setHotelAddress)}
            multiline
            helpText="Enter full address / Masukkan alamat lengkap"
            error={!!errors.hotelAddress}
            errorMessage={errors.hotelAddress}
            autoCapitalize="words"
          />
          <Input
            label="Length of Stay (days) / Tempoh Penginapan (hari)"
            value={stayDuration}
            onChangeText={(value) => handleFieldChange('stayDuration', value, setStayDuration)}
            helpText="Enter number of days / Masukkan bilangan hari"
            error={!!errors.stayDuration}
            errorMessage={errors.stayDuration}
            keyboardType="numeric"
          />
        </CollapsibleSection>

        {/* Funds Section */}
        <CollapsibleSection
          title="💰 Funds Proof / Bukti Kewangan"
          isExpanded={expandedSection === 'funds'}
          onToggle={() => setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
        >
          {/* Malaysia Funds Context */}
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroIcon}>💳</Text>
            <Text style={styles.sectionIntroText}>
              Malaysia immigration requires proof of sufficient funds for your stay. The minimum requirement is approximately MYR 350 (~500 THB or ~$100 USD) per day.
            </Text>
            <Text style={styles.sectionIntroTextSecondary}>
              Imigresen Malaysia memerlukan bukti dana yang mencukupi untuk penginapan anda. Keperluan minimum adalah kira-kira MYR 350 sehari.
            </Text>
          </View>
          <View style={styles.fundActions}>
            <Button title="Add Cash / Tambah Tunai" onPress={() => addFund('cash')} variant="secondary" style={styles.fundButton} />
            <Button title="Add Credit Card / Tambah Kad Kredit" onPress={() => addFund('credit_card')} variant="secondary" style={styles.fundButton} />
            <Button title="Add Bank Balance / Tambah Baki Bank" onPress={() => addFund('bank_balance')} variant="secondary" style={styles.fundButton} />
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
                  CASH: 'Cash / Tunai',
                  BANK_CARD: 'Bank Card / Kad Bank',
                  CREDIT_CARD: 'Credit Card / Kad Kredit',
                  BANK_BALANCE: 'Bank Balance / Baki Bank',
                  DOCUMENT: 'Supporting Document / Dokumen Sokongan',
                  INVESTMENT: 'Investment / Pelaburan',
                  OTHER: 'Funding / Dana',
                };
                const typeIcon = (typeMeta[typeKey] || typeMeta.OTHER).icon;
                const typeLabel = defaultTypeLabels[typeKey] || defaultTypeLabels.OTHER;
                const notProvidedLabel = 'Not provided yet / Belum diberikan';

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
                  const photoLabel = 'Photo attached / Foto dilampirkan';
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

        <View style={styles.buttonContainer}>
          <Button
            title={t('malaysia.travelInfo.buttons.continue', { defaultValue: 'Generate Entry Pack / Jana Pakej Kemasukan' })}
            onPress={handleContinue}
            variant="primary"
            disabled={!isFormValid()}
          />
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
  progressContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercent: {
    ...typography.h3,
    fontWeight: '700',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  saveStatusContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  saveStatusText: {
    ...typography.caption,
    color: colors.textSecondary,
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
  // Funds Section Styles
  sectionIntro: {
    backgroundColor: 'rgba(52, 199, 89, 0.05)',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.1)',
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  sectionIntroText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  sectionIntroTextSecondary: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  fundActions: {
    marginBottom: spacing.md,
  },
  fundButton: {
    marginBottom: spacing.sm,
  },
  fundEmptyState: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  fundEmptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  fundEmptyTextSecondary: {
    ...typography.body2,
    color: colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    fontSize: 13,
  },
  fundList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fundListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  fundListItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fundListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fundItemIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  fundItemDetails: {
    flex: 1,
  },
  fundItemTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  fundItemSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  fundListItemArrow: {
    fontSize: 20,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
});

export default MalaysiaTravelInfoScreen;
