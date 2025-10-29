// 入境通 - Korea Travel Info Screen (韩国入境信息)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import InputWithUserTracking from '../../components/InputWithUserTracking';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../components';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import FieldStateManager from '../../utils/FieldStateManager';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../../services/data/UserDataService';

// Import Thailand-specific utilities (can be reused for Korea)
import { CollapsibleSection } from '../../components/thailand/ThailandTravelComponents';
import { parsePassportName } from '../../utils/NameParser';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const KoreaTravelInfoScreen = ({ navigation, route }) => {
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
      travelPurpose: 'TOURISM', // Most common purpose for Korea
      arrivalDate: tomorrow.toISOString().split('T')[0],
      departureDate: nextWeek.toISOString().split('T')[0],
      boardingCountry: passport?.nationality || 'CHN',
    };
  };

  // UI State (loaded from database, not from route params)
  const [passportNo, setPassportNo] = useState('');
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

  // Travel Info State - Korea-specific
  const smartDefaults = getSmartDefaults();
  const [travelPurpose, setTravelPurpose] = useState('');
  const [boardingCountry, setBoardingCountry] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState(smartDefaults.arrivalDate);
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState(smartDefaults.departureDate);
  const [accommodationAddress, setAccommodationAddress] = useState('');
  const [accommodationPhone, setAccommodationPhone] = useState('');

  // K-ETA specific fields
  const [ketaNumber, setKetaNumber] = useState('');
  const [hasKeta, setHasKeta] = useState(false);

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
  const userInteractionTracker = useUserInteractionTracker('korea_travel_info');

  // Track if migration has been completed to prevent re-migration
  const migrationCompletedRef = useRef(false);

  // Migration function to mark existing data as user-modified
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    // Skip if already migrated or tracker not ready
    if (migrationCompletedRef.current || !userData || !userInteractionTracker.isInitialized) {
      return;
    }

    console.log('=== MIGRATING EXISTING DATA TO INTERACTION STATE (KOREA) ===');

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
      if (travelInfo.arrivalFlightNumber) existingDataToMigrate.arrivalFlightNumber = travelInfo.arrivalFlightNumber;
      if (travelInfo.arrivalArrivalDate) existingDataToMigrate.arrivalArrivalDate = travelInfo.arrivalArrivalDate;
      if (travelInfo.departureFlightNumber) existingDataToMigrate.departureFlightNumber = travelInfo.departureFlightNumber;
      if (travelInfo.departureDepartureDate) existingDataToMigrate.departureDepartureDate = travelInfo.departureDepartureDate;
      if (travelInfo.accommodationAddress) existingDataToMigrate.accommodationAddress = travelInfo.accommodationAddress;
      if (travelInfo.accommodationPhone) existingDataToMigrate.accommodationPhone = travelInfo.accommodationPhone;
      if (travelInfo.ketaNumber) existingDataToMigrate.ketaNumber = travelInfo.ketaNumber;
    }

    console.log('Data to migrate:', existingDataToMigrate);
    console.log('Number of fields to migrate:', Object.keys(existingDataToMigrate).length);

    if (Object.keys(existingDataToMigrate).length > 0) {
      userInteractionTracker.initializeWithExistingData(existingDataToMigrate);
      migrationCompletedRef.current = true;
      console.log('✅ Migration completed - existing data marked as user-modified');
    } else {
      console.log('⚠️ No existing data found to migrate');
    }
  }, [userInteractionTracker.isInitialized, userInteractionTracker.initializeWithExistingData]);

  // Count filled fields for each section
  const getFieldCount = (section) => {
    const interactionState = {};
    const allFieldNames = [
      'passportNo', 'fullName', 'nationality', 'dob', 'expiryDate', 'sex',
      'phoneCode', 'phoneNumber', 'email', 'occupation', 'cityOfResidence', 'residentCountry',
      'travelPurpose', 'boardingCountry', 'arrivalFlightNumber', 'arrivalArrivalDate',
      'departureFlightNumber', 'departureDepartureDate', 'accommodationAddress', 'accommodationPhone',
      'ketaNumber'
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
        const fundItemCount = funds.length;
        if (fundItemCount === 0) {
          return { filled: 0, total: 1 };
        } else {
          return { filled: fundItemCount, total: fundItemCount };
        }

      case 'travel':
        const travelFields = {
          travelPurpose: travelPurpose,
          boardingCountry: boardingCountry,
          arrivalFlightNumber: arrivalFlightNumber,
          arrivalArrivalDate: arrivalArrivalDate,
          departureFlightNumber: departureFlightNumber,
          departureDepartureDate: departureDepartureDate,
          accommodationAddress: accommodationAddress,
          accommodationPhone: accommodationPhone
        };

        if (hasKeta) {
          travelFields.ketaNumber = ketaNumber;
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

      return summary;
    } catch (error) {
      console.error('Failed to calculate completion metrics:', error);
      return { totalPercent: 0, metrics: null, isReady: false };
    }
  };

  // Load data on mount
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await UserDataService.initialize(userId);

      const allUserData = await UserDataService.getAllUserData(userId);

      // Load travel info for migration
      const destinationId = route.params?.destination?.id || 'korea';
      const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
      if (travelInfo) {
        allUserData.travelInfo = travelInfo;
      }

      // Migrate existing data to interaction state (only runs once)
      await migrateExistingDataToInteractionState(allUserData);

      // Load passport data
      if (allUserData.passport) {
        const parsedName = parsePassportName(allUserData.passport.fullName || '');
        setPassportNo(allUserData.passport.passportNumber || '');
        setSurname(parsedName.surname || '');
        setMiddleName(parsedName.middleName || '');
        setGivenName(parsedName.givenName || '');
        setNationality(allUserData.passport.nationality || '');
        setDob(allUserData.passport.dateOfBirth || '');
        setExpiryDate(allUserData.passport.expiryDate || '');
        setSex(allUserData.passport.gender || '');
      }

      // Load personal info
      if (allUserData.personalInfo) {
        setOccupation(allUserData.personalInfo.occupation || '');
        setCityOfResidence(allUserData.personalInfo.provinceCity || '');
        setResidentCountry(allUserData.personalInfo.countryRegion || '');
        setPhoneCode(allUserData.personalInfo.phoneCode || getPhoneCode(passport?.nationality || ''));
        setPhoneNumber(allUserData.personalInfo.phoneNumber || '');
        setEmail(allUserData.personalInfo.email || '');
      }

      // Load funds
      const fundItems = await UserDataService.getFundItems(userId);
      setFunds(fundItems || []);

      // Load Korea travel info (already loaded above for migration)
      if (travelInfo) {
        setTravelPurpose(travelInfo.travelPurpose || '');
        setBoardingCountry(travelInfo.boardingCountry || '');
        setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
        setArrivalArrivalDate(travelInfo.arrivalArrivalDate || smartDefaults.arrivalDate);
        setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
        setDepartureDepartureDate(travelInfo.departureDepartureDate || smartDefaults.departureDate);
        setAccommodationAddress(travelInfo.accommodationAddress || '');
        setAccommodationPhone(travelInfo.accommodationPhone || '');
        setKetaNumber(travelInfo.ketaNumber || '');
        setHasKeta(!!travelInfo.ketaNumber);
      }

      // Note: calculateCompletionMetrics() is called in separate useEffect
    } catch (error) {
      console.error('Failed to load Korea travel data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, migrateExistingDataToInteractionState, route.params?.destination?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate completion metrics when data changes
  useEffect(() => {
    if (!isLoading) {
      calculateCompletionMetrics();
    }
  }, [
    passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneNumber, email, phoneCode,
    funds,
    travelPurpose, boardingCountry, arrivalFlightNumber, arrivalArrivalDate,
    departureFlightNumber, departureDepartureDate, accommodationAddress, accommodationPhone,
    ketaNumber, hasKeta, isLoading
  ]);

  const handleSave = async () => {
    try {
      setSaveStatus('saving');

      // Save passport data
      const passportModel = new Passport({
        id: userId,
        passportNumber: passportNo,
        fullName: [surname, middleName, givenName].filter(Boolean).join(' '),
        nationality: nationality,
        dateOfBirth: dob,
        expiryDate: expiryDate,
        gender: sex
      });
      await UserDataService.savePassport(passportModel);

      // Save personal info
      const personalInfoModel = new PersonalInfo({
        userId: userId,
        occupation: occupation,
        provinceCity: cityOfResidence,
        countryRegion: residentCountry,
        phoneCode: phoneCode,
        phoneNumber: phoneNumber,
        email: email
      });
      await UserDataService.savePersonalInfo(personalInfoModel);

      // Save travel info for Korea
      const destinationId = route.params?.destination?.id || 'korea';
      await UserDataService.saveTravelInfo(userId, destinationId, {
        travelPurpose,
        boardingCountry,
        arrivalFlightNumber,
        arrivalArrivalDate,
        departureFlightNumber,
        departureDepartureDate,
        accommodationAddress,
        accommodationPhone,
        ketaNumber: hasKeta ? ketaNumber : ''
      });

      setSaveStatus('saved');
      // Note: calculateCompletionMetrics() is called automatically by useEffect

      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save Korea travel data:', error);
      setSaveStatus('error');
    }
  };

  const handleContinue = () => {
    handleSave();
    navigation.navigate('KoreaEntryFlow', {
      passport: passport,
      destination: route.params?.destination,
    });
  };

  const toggleSection = (section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSaveStatus = () => {
    if (!saveStatus) return null;

    const statusConfig = {
      saving: { icon: '💾', text: '保存中...', color: colors.textSecondary },
      saved: { icon: '✅', text: '已保存', color: colors.success },
      error: { icon: '❌', text: '保存失败', color: colors.error },
    };

    const config = statusConfig[saveStatus];
    if (!config) return null;

    return (
      <View style={styles.saveStatusContainer}>
        <Text style={[styles.saveStatusText, { color: config.color }]}>
          {config.icon} {config.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>韩国旅行信息 🇰🇷</Text>
        <View style={styles.headerRight}>
          {renderSaveStatus()}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Enhanced Hero Section for Border Crossing Beginners */}
        <LinearGradient
          colors={['#1a3568', '#102347']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroFlag}>🇰🇷</Text>
            <View style={styles.heroHeading}>
              <Text style={styles.heroTitle}>韩国入境准备指南</Text>
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
                第一次过韩国海关？我们会一步步教你准备所有必需文件，确保顺利通关！
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Progress Overview Card */}
        <View style={styles.progressOverviewCard}>
          <Text style={styles.progressTitle}>准备进度</Text>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, totalCompletionPercent >= 25 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>📘</Text>
              <Text style={[styles.stepText, totalCompletionPercent >= 25 && styles.stepTextActive]}>
                护照信息 {totalCompletionPercent >= 25 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.progressStep, totalCompletionPercent >= 50 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>👤</Text>
              <Text style={[styles.stepText, totalCompletionPercent >= 50 && styles.stepTextActive]}>
                个人信息 {totalCompletionPercent >= 50 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.progressStep, totalCompletionPercent >= 75 && styles.progressStepActive]}>
              <Text style={styles.stepIcon}>✈️</Text>
              <Text style={[styles.stepText, totalCompletionPercent >= 75 && styles.stepTextActive]}>
                旅行信息 {totalCompletionPercent >= 75 ? '✓' : ''}
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

        {/* Passport Section */}
        <CollapsibleSection
          title="护照信息 📘"
          isExpanded={expandedSection === 'passport'}
          onToggle={() => toggleSection('passport')}
          fieldCount={getFieldCount('passport')}
        >
          <View style={styles.sectionContent}>
            <Input
              label="护照号码"
              value={passportNo}
              onChangeText={setPassportNo}
              placeholder="请输入护照号码"
            />
            <PassportNameInput
              surname={surname}
              middleName={middleName}
              givenName={givenName}
              onSurnameChange={setSurname}
              onMiddleNameChange={setMiddleName}
              onGivenNameChange={setGivenName}
            />
            <NationalitySelector
              value={nationality}
              onChange={setNationality}
              label="国籍"
            />
            <DateTimeInput
              label="出生日期"
              value={dob}
              onChange={setDob}
              mode="date"
            />
            <DateTimeInput
              label="护照有效期"
              value={expiryDate}
              onChange={setExpiryDate}
              mode="date"
            />
            <Input
              label="性别"
              value={sex}
              onChangeText={setSex}
              placeholder="M / F"
            />
          </View>
        </CollapsibleSection>

        {/* Personal Info Section */}
        <CollapsibleSection
          title="个人信息 👤"
          isExpanded={expandedSection === 'personal'}
          onToggle={() => toggleSection('personal')}
          fieldCount={getFieldCount('personal')}
        >
          <View style={styles.sectionContent}>
            <Input
              label="职业"
              value={occupation}
              onChangeText={setOccupation}
              placeholder="请输入职业"
            />
            <Input
              label="居住城市"
              value={cityOfResidence}
              onChangeText={setCityOfResidence}
              placeholder="请输入居住城市"
            />
            <NationalitySelector
              value={residentCountry}
              onChange={setResidentCountry}
              label="居住国家"
            />
            <View style={styles.phoneContainer}>
              <Input
                label="电话区号"
                value={phoneCode}
                onChangeText={setPhoneCode}
                placeholder="+86"
                style={styles.phoneCodeInput}
              />
              <Input
                label="电话号码"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="请输入电话号码"
                style={styles.phoneNumberInput}
              />
            </View>
            <Input
              label="电子邮箱"
              value={email}
              onChangeText={setEmail}
              placeholder="请输入邮箱"
              keyboardType="email-address"
            />
          </View>
        </CollapsibleSection>

        {/* Travel Info Section */}
        <CollapsibleSection
          title="旅行信息 ✈️"
          isExpanded={expandedSection === 'travel'}
          onToggle={() => toggleSection('travel')}
          fieldCount={getFieldCount('travel')}
        >
          <View style={styles.sectionContent}>
            <Input
              label="旅行目的"
              value={travelPurpose}
              onChangeText={setTravelPurpose}
              placeholder="例如：旅游、商务、探亲"
            />
            <NationalitySelector
              value={boardingCountry}
              onChange={setBoardingCountry}
              label="登机国家"
            />
            <Input
              label="抵达航班号"
              value={arrivalFlightNumber}
              onChangeText={setArrivalFlightNumber}
              placeholder="例如：KE123"
            />
            <DateTimeInput
              label="抵达日期"
              value={arrivalArrivalDate}
              onChange={setArrivalArrivalDate}
              mode="date"
            />
            <Input
              label="离境航班号"
              value={departureFlightNumber}
              onChangeText={setDepartureFlightNumber}
              placeholder="例如：KE456"
            />
            <DateTimeInput
              label="离境日期"
              value={departureDepartureDate}
              onChange={setDepartureDepartureDate}
              mode="date"
            />
            <Input
              label="住宿地址"
              value={accommodationAddress}
              onChangeText={setAccommodationAddress}
              placeholder="请输入酒店或住宿地址"
              multiline
            />
            <Input
              label="住宿电话"
              value={accommodationPhone}
              onChangeText={setAccommodationPhone}
              placeholder="请输入酒店电话"
            />

            {/* K-ETA Section */}
            <View style={styles.ketaSection}>
              <TouchableOpacity
                style={styles.ketaToggle}
                onPress={() => setHasKeta(!hasKeta)}
              >
                <Text style={styles.ketaToggleText}>
                  {hasKeta ? '✅' : '☐'} 我已有 K-ETA
                </Text>
              </TouchableOpacity>
              {hasKeta && (
                <Input
                  label="K-ETA 编号"
                  value={ketaNumber}
                  onChangeText={setKetaNumber}
                  placeholder="请输入K-ETA编号"
                />
              )}
            </View>
          </View>
        </CollapsibleSection>

        {/* Funds Section */}
        <CollapsibleSection
          title="资金证明 💰"
          isExpanded={expandedSection === 'funds'}
          onToggle={() => toggleSection('funds')}
          fieldCount={getFieldCount('funds')}
        >
          <View style={styles.sectionContent}>
            <Text style={styles.fundsHint}>
              韩国入境建议准备资金证明，如银行卡、现金等
            </Text>
            <Button
              title="+ 添加资金证明"
              onPress={() => {
                setNewFundItemType('CREDIT_CARD');
                setFundItemModalVisible(true);
              }}
              variant="secondary"
            />
            {funds.length > 0 && (
              <View style={styles.fundsList}>
                {funds.map((fund, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.fundItem}
                    onPress={() => {
                      setSelectedFundItem(fund);
                      setFundItemModalVisible(true);
                    }}
                  >
                    <Text style={styles.fundItemText}>
                      {fund.type}: {fund.amount || '未填写金额'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </CollapsibleSection>

        <View style={styles.bottomActions}>
          <Button
            title="保存并继续"
            onPress={handleContinue}
            variant="primary"
            style={styles.continueButton}
          />
        </View>
      </ScrollView>

      {/* Fund Item Modal */}
      {fundItemModalVisible && (
        <FundItemDetailModal
          visible={fundItemModalVisible}
          fundItem={selectedFundItem || currentFundItem}
          fundItemType={newFundItemType}
          onClose={() => {
            setFundItemModalVisible(false);
            setSelectedFundItem(null);
            setCurrentFundItem(null);
            setNewFundItemType(null);
          }}
          onSave={async (fundItem) => {
            const updatedFunds = selectedFundItem
              ? funds.map(f => f.id === fundItem.id ? fundItem : f)
              : [...funds, fundItem];
            setFunds(updatedFunds);
            await UserDataService.saveFundItems(userId, updatedFunds);
            setFundItemModalVisible(false);
            setSelectedFundItem(null);
            setCurrentFundItem(null);
            setNewFundItemType(null);
            // Note: calculateCompletionMetrics() is called automatically by useEffect
          }}
          onDelete={async (fundItemId) => {
            const updatedFunds = funds.filter(f => f.id !== fundItemId);
            setFunds(updatedFunds);
            await UserDataService.saveFundItems(userId, updatedFunds);
            setFundItemModalVisible(false);
            setSelectedFundItem(null);
            // Note: calculateCompletionMetrics() is called automatically by useEffect
          }}
        />
      )}
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
    width: 80,
  },
  saveStatusContainer: {
    alignItems: 'flex-end',
  },
  saveStatusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  scrollContainer: {
    paddingBottom: spacing.xl,
  },
  // Enhanced Hero Section Styles
  heroSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
  // Progress Overview Card Styles
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
  sectionContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneCodeInput: {
    flex: 1,
  },
  phoneNumberInput: {
    flex: 2,
  },
  ketaSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
  },
  ketaToggle: {
    paddingVertical: spacing.sm,
  },
  ketaToggleText: {
    ...typography.body1,
    color: colors.text,
  },
  fundsHint: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fundsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  fundItem: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fundItemText: {
    ...typography.body1,
    color: colors.text,
  },
  bottomActions: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  continueButton: {
    width: '100%',
  },
});

export default KoreaTravelInfoScreen;
