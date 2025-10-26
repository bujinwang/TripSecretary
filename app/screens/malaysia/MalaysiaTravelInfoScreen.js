
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

const MalaysiaTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

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
  const debouncedSaveRef = useRef(null);

  // Initialize DebouncedSave
  useEffect(() => {
    debouncedSaveRef.current = new DebouncedSave(saveDataToSecureStorage, {
      delay: 1000,
      onSaveStart: () => {
        setSaveStatus('saving');
        console.log('🔄 Auto-save started...');
      },
      onSaveSuccess: () => {
        setSaveStatus('saved');
        setLastEditedAt(new Date().toISOString());
        console.log('✅ Auto-save completed');
        // Clear saved status after 2 seconds
        setTimeout(() => setSaveStatus(null), 2000);
      },
      onSaveError: (error) => {
        setSaveStatus('error');
        console.error('❌ Auto-save failed:', error);
        setTimeout(() => setSaveStatus(null), 3000);
      },
    });

    return () => {
      debouncedSaveRef.current?.cleanup();
    };
  }, []);

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
          email: email,
          sex: sex
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

      case 'travel':
        const travelFields = {
          arrivalFlightNumber: arrivalFlightNumber,
          arrivalDate: arrivalDate,
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
      const travelCount = getFieldCount('travel');

      const passportComplete = passportCount.filled >= passportCount.total;
      const personalComplete = personalCount.filled >= personalCount.total;
      const travelComplete = travelCount.filled >= travelCount.total;

      const completedSections = [
        passportComplete,
        personalComplete,
        travelComplete,
      ].filter(Boolean).length;

      const totalSections = 3;
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
    const travelCount = getFieldCount('travel');

    const allFieldsFilled =
      passportCount.filled === passportCount.total &&
      personalCount.filled === personalCount.total &&
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

        // Wait for interaction tracker to initialize, then migrate data
        const checkInteractionTrackerAndMigrate = async () => {
          let attempts = 0;
          const maxAttempts = 50;

          const checkInterval = setInterval(() => {
            attempts++;
            console.log(`Checking interaction tracker initialization (attempt ${attempts}/${maxAttempts})...`);

            if (userInteractionTracker.isInitialized) {
              console.log('✅ Interaction tracker initialized, migrating data...');
              clearInterval(checkInterval);
              migrateExistingDataToInteractionState(userData);
            } else if (attempts >= maxAttempts) {
              console.warn('⚠️ Interaction tracker initialization timeout, skipping migration');
              clearInterval(checkInterval);
            }
          }, 100);
        };

        await checkInteractionTrackerAndMigrate();

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
  }, [userId, passport, destination?.id, destination?.name, migrateExistingDataToInteractionState]);

  const handleFieldChange = (fieldName, value, setter) => {
    setter(value);
    userInteractionTracker.markFieldAsUserModified(fieldName, value);
    setSaveStatus('pending');
    debouncedSaveRef.current?.scheduleSave();
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

  const handleContinue = () => {
    if (!isFormValid()) {
      Alert.alert(
        t('malaysia.travelInfo.alerts.incompleteTitle', { defaultValue: '信息不完整' }),
        t('malaysia.travelInfo.alerts.incompleteMessage', { defaultValue: '请填写所有必填信息' })
      );
      return;
    }

    // Save before navigating
    debouncedSaveRef.current?.saveImmediately();

    navigation.navigate('Result', {
      destination: destination || { id: 'my', name: 'Malaysia' },
      passport: passport,
    });
  };

  const handleGoBack = async () => {
    // Save immediately before going back
    await debouncedSaveRef.current?.saveImmediately();
    navigation.goBack();
  };

  const renderGenderOptions = () => {
    const options = [
      { value: 'Female', label: t('malaysia.travelInfo.fields.sex.options.female', { defaultValue: '女性' }) },
      { value: 'Male', label: t('malaysia.travelInfo.fields.sex.options.male', { defaultValue: '男性' }) },
      { value: 'Undefined', label: t('malaysia.travelInfo.fields.sex.options.undefined', { defaultValue: '未定义' }) }
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
            {t('malaysia.travelInfo.progress.title', { defaultValue: '完成进度' })}
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
              {saveStatus === 'saving' && '💾 保存中...'}
              {saveStatus === 'saved' && '✅ 已保存'}
              {saveStatus === 'error' && '❌ 保存失败'}
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
        <Text style={styles.headerTitle}>{t('malaysia.travelInfo.headerTitle', { defaultValue: '马来西亚入境信息' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('malaysia.travelInfo.loading', { defaultValue: '正在加载数据...' })}</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇲🇾</Text>
          <Text style={styles.title}>{t('malaysia.travelInfo.title', { defaultValue: '填写马来西亚入境信息' })}</Text>
          <Text style={styles.subtitle}>{t('malaysia.travelInfo.subtitle', { defaultValue: '请提供以下信息以完成入境卡生成' })}</Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('malaysia.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        {renderProgressHeader()}

        <CollapsibleSection
          title={t('malaysia.travelInfo.sections.passport', { defaultValue: '护照信息' })}
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
           <PassportNameInput
             value={fullName}
             onChangeText={(value) => handleFieldChange('fullName', value, setFullName)}
             helpText="请填写汉语拼音"
             error={!!errors.fullName}
             errorMessage={errors.fullName}
           />
           <NationalitySelector
             label="国籍"
             value={nationality}
             onValueChange={(code) => handleFieldChange('nationality', code, setNationality)}
             helpText="请选择您的国籍"
             error={!!errors.nationality}
             errorMessage={errors.nationality}
           />
           <Input
             label="护照号"
             value={passportNo}
             onChangeText={(value) => handleFieldChange('passportNo', value, setPassportNo)}
             helpText="请输入您的护照号码"
             error={!!errors.passportNo}
             errorMessage={errors.passportNo}
             autoCapitalize="characters"
           />
           <DateTimeInput
             label="出生日期"
             value={dob}
             onChangeText={(value) => handleFieldChange('dob', value, setDob)}
             mode="date"
             dateType="past"
             helpText="选择出生日期"
             error={!!errors.dob}
             errorMessage={errors.dob}
           />
           <DateTimeInput
             label="护照有效期"
             value={expiryDate}
             onChangeText={(value) => handleFieldChange('expiryDate', value, setExpiryDate)}
             mode="date"
             dateType="future"
             helpText="选择护照有效期"
             error={!!errors.expiryDate}
             errorMessage={errors.expiryDate}
           />
         </CollapsibleSection>

        <CollapsibleSection
          title={t('malaysia.travelInfo.sections.personal', { defaultValue: '个人信息' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <Input
             label="职业"
             value={occupation}
             onChangeText={(value) => handleFieldChange('occupation', value, setOccupation)}
             helpText="请输入您的职业 (请使用英文)"
             error={!!errors.occupation}
             errorMessage={errors.occupation}
             autoCapitalize="words"
           />
           <NationalitySelector
             label="居住国家"
             value={residentCountry}
             onValueChange={(code) => {
               handleFieldChange('residentCountry', code, setResidentCountry);
               setPhoneCode(getPhoneCode(code));
             }}
             helpText="请选择您居住的国家"
             error={!!errors.residentCountry}
             errorMessage={errors.residentCountry}
           />
           <View style={styles.phoneInputContainer}>
             <Input
               label="国家代码"
               value={phoneCode}
               onChangeText={(value) => handleFieldChange('phoneCode', value, setPhoneCode)}
               keyboardType="phone-pad"
               maxLength={5}
               error={!!errors.phoneCode}
               errorMessage={errors.phoneCode}
               style={styles.phoneCodeInput}
             />
             <Input
               label="电话号码"
               value={phoneNumber}
               onChangeText={(value) => handleFieldChange('phoneNumber', value, setPhoneNumber)}
               keyboardType="phone-pad"
               helpText="请输入您的电话号码"
               error={!!errors.phoneNumber}
               errorMessage={errors.phoneNumber}
               style={styles.phoneInput}
             />
           </View>
           <Input
             label="电子邮箱"
             value={email}
             onChangeText={(value) => handleFieldChange('email', value, setEmail)}
             keyboardType="email-address"
             helpText="请输入您的电子邮箱地址"
             error={!!errors.email}
             errorMessage={errors.email}
           />
           <View style={styles.fieldContainer}>
             <Text style={styles.fieldLabel}>性别</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        <CollapsibleSection
          title={t('malaysia.travelInfo.sections.travel', { defaultValue: '旅行信息' })}
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <Input
            label="航班号"
            value={arrivalFlightNumber}
            onChangeText={(value) => handleFieldChange('arrivalFlightNumber', value, setArrivalFlightNumber)}
            helpText="请输入您的抵达航班号"
            error={!!errors.arrivalFlightNumber}
            errorMessage={errors.arrivalFlightNumber}
            autoCapitalize="characters"
          />
          <DateTimeInput
            label="抵达日期"
            value={arrivalDate}
            onChangeText={(value) => handleFieldChange('arrivalDate', value, setArrivalDate)}
            mode="date"
            dateType="future"
            helpText="选择日期"
            error={!!errors.arrivalDate}
            errorMessage={errors.arrivalDate}
          />
          <Input
            label="在马住址"
            value={hotelAddress}
            onChangeText={(value) => handleFieldChange('hotelAddress', value, setHotelAddress)}
            multiline
            helpText="请输入详细地址"
            error={!!errors.hotelAddress}
            errorMessage={errors.hotelAddress}
            autoCapitalize="words"
          />
          <Input
            label="停留天数"
            value={stayDuration}
            onChangeText={(value) => handleFieldChange('stayDuration', value, setStayDuration)}
            helpText="请输入停留天数"
            error={!!errors.stayDuration}
            errorMessage={errors.stayDuration}
            keyboardType="numeric"
          />
        </CollapsibleSection>

        <View style={styles.buttonContainer}>
          <Button
            title={t('malaysia.travelInfo.buttons.continue', { defaultValue: '生成入境包' })}
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
});

export default MalaysiaTravelInfoScreen;
