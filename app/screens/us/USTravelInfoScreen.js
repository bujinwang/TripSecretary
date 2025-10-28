// 入境通 - US Travel Info Screen (美国入境信息)
import React, { useState, useEffect, useMemo } from 'react';
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
              <Text style={styles.scanText}>Scan</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const USTravelInfoScreen = ({ navigation, route }) => {
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

  // ESTA specific fields
  const [estaNumber, setEstaNumber] = useState('');
  const [hasESTA, setHasESTA] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  // Auto-save state tracking
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastEditedAt, setLastEditedAt] = useState(null);

  // Completion tracking
  const [completionMetrics, setCompletionMetrics] = useState(null);
  const [totalCompletionPercent, setTotalCompletionPercent] = useState(0);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('us_travel_info');

  // Session state tracking
  const scrollViewRef = React.useRef(null);
  const hasMigratedRef = React.useRef(false);

  // Count filled fields for each section using FieldStateManager
  const getFieldCount = (section) => {
    switch (section) {
      case 'passport':
        const passportFields = {
          fullName: fullName,
          nationality: nationality,
          passportNo: passportNo,
          dob: dob,
          expiryDate: expiryDate
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
          occupation: occupation,
          residentCountry: residentCountry,
          phoneCode: phoneCode,
          phoneNumber: phoneNumber,
          email: email,
          sex: sex
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
          arrivalFlightNumber: arrivalFlightNumber,
          arrivalDate: arrivalDate,
          hotelAddress: hotelAddress,
          stayDuration: stayDuration
        };

        const filledCount = Object.values(travelFields).filter(
          value => value !== null && value !== undefined && value !== ''
        ).length;

        return {
          filled: filledCount,
          total: Object.keys(travelFields).length
        };

      case 'esta':
        // ESTA is optional but important for US entry
        const estaFields = {
          estaNumber: estaNumber
        };

        const estaFilledCount = Object.values(estaFields).filter(
          value => value !== null && value !== undefined && value !== ''
        ).length;

        return {
          filled: estaFilledCount,
          total: Object.keys(estaFields).length
        };
    }

    return { filled: 0, total: 0 };
  };

  // Load data
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
      const destinationId = destination?.id || 'us';
      const travelInfo = await UserDataService.getTravelInfo(userId, destinationId);

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
        setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
        setArrivalDate(travelInfo.arrivalDate || smartDefaults.arrivalDate);
        setHotelAddress(travelInfo.hotelAddress || '');
        setStayDuration(travelInfo.lengthOfStay || travelInfo.stayDuration || smartDefaults.stayDuration);
        setEstaNumber(travelInfo.estaNumber || '');
        setHasESTA(!!travelInfo.estaNumber);
      }

    } catch (error) {
      console.error('Failed to load US travel info data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldName, value, setter) => {
    setter(value);
    userInteractionTracker.markFieldAsUserModified(fieldName, value);

    // Auto-save
    debouncedSave();
  };

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
      const destinationId = destination?.id || 'us';
      await UserDataService.updateTravelInfo(userId, destinationId, {
        arrivalFlightNumber: arrivalFlightNumber,
        arrivalDate: arrivalDate,
        hotelAddress: hotelAddress,
        lengthOfStay: stayDuration,
        estaNumber: estaNumber,
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save US travel info:', error);
      setSaveStatus('error');
    }
  }, 1000);

  const renderGenderOptions = () => {
    const genders = [
      { value: 'M', label: 'Male / 男性' },
      { value: 'F', label: 'Female / 女性' },
    ];

    return (
      <View style={styles.genderOptions}>
        {genders.map((gender) => (
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
              {gender.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleContinue = () => {
    navigation.navigate('USEntryFlow', {
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
        <Text style={styles.headerTitle}>US Entry Information</Text>
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
      >
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇺🇸</Text>
          <Text style={styles.title}>{t('us.travelInfo.title', { defaultValue: 'US Entry Information' })}</Text>
          <Text style={styles.subtitle}>{t('us.travelInfo.subtitle', { defaultValue: 'Please provide the following information' })}</Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('us.travelInfo.privacyNotice', { defaultValue: 'All information is stored locally on your device' })}
          </Text>
        </View>

        <CollapsibleSection
          title={t('us.travelInfo.sections.passport', { defaultValue: '📘 Passport Information' })}
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
           <PassportNameInput
             value={fullName}
             onChangeText={(value) => handleFieldChange('fullName', value, setFullName)}
             helpText="Please fill in English"
             error={!!errors.fullName}
             errorMessage={errors.fullName}
           />
           <NationalitySelector
             label="Nationality"
             value={nationality}
             onValueChange={(code) => handleFieldChange('nationality', code, setNationality)}
             helpText="Select your nationality"
             error={!!errors.nationality}
             errorMessage={errors.nationality}
           />
           <Input
             label="Passport Number"
             value={passportNo}
             onChangeText={(value) => handleFieldChange('passportNo', value, setPassportNo)}
             helpText="Enter passport number"
             error={!!errors.passportNo}
             errorMessage={errors.passportNo}
             autoCapitalize="characters"
           />
           <DateTimeInput
             label="Date of Birth"
             value={dob}
             onChangeText={(value) => handleFieldChange('dob', value, setDob)}
             mode="date"
             dateType="past"
             helpText="Select date of birth"
             error={!!errors.dob}
             errorMessage={errors.dob}
           />
           <DateTimeInput
             label="Passport Expiry Date"
             value={expiryDate}
             onChangeText={(value) => handleFieldChange('expiryDate', value, setExpiryDate)}
             mode="date"
             dateType="future"
             helpText="Select expiry date"
             error={!!errors.expiryDate}
             errorMessage={errors.expiryDate}
           />
         </CollapsibleSection>

        <CollapsibleSection
          title={t('us.travelInfo.sections.personal', { defaultValue: '👤 Personal Information' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <Input
             label="Occupation"
             value={occupation}
             onChangeText={(value) => handleFieldChange('occupation', value, setOccupation)}
             helpText="Enter your occupation (in English)"
             error={!!errors.occupation}
             errorMessage={errors.occupation}
             autoCapitalize="words"
           />
           <NationalitySelector
             label="Country of Residence"
             value={residentCountry}
             onValueChange={(code) => {
               handleFieldChange('residentCountry', code, setResidentCountry);
               setPhoneCode(getPhoneCode(code));
             }}
             helpText="Select country of residence"
             error={!!errors.residentCountry}
             errorMessage={errors.residentCountry}
           />
           <View style={styles.phoneInputContainer}>
             <Input
               label="Country Code"
               value={phoneCode}
               onChangeText={(value) => handleFieldChange('phoneCode', value, setPhoneCode)}
               keyboardType="phone-pad"
               maxLength={5}
               error={!!errors.phoneCode}
               errorMessage={errors.phoneCode}
               style={styles.phoneCodeInput}
             />
             <Input
               label="Phone Number"
               value={phoneNumber}
               onChangeText={(value) => handleFieldChange('phoneNumber', value, setPhoneNumber)}
               keyboardType="phone-pad"
               helpText="Enter phone number"
               error={!!errors.phoneNumber}
               errorMessage={errors.phoneNumber}
               style={styles.phoneInput}
             />
           </View>
           <Input
             label="Email"
             value={email}
             onChangeText={(value) => handleFieldChange('email', value, setEmail)}
             keyboardType="email-address"
             helpText="Enter email address"
             error={!!errors.email}
             errorMessage={errors.email}
           />
           <View style={styles.fieldContainer}>
             <Text style={styles.fieldLabel}>Gender</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        <CollapsibleSection
          title={t('us.travelInfo.sections.travel', { defaultValue: '✈️ Travel Information' })}
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <Input
            label="Flight Number"
            value={arrivalFlightNumber}
            onChangeText={(value) => handleFieldChange('arrivalFlightNumber', value, setArrivalFlightNumber)}
            helpText="Enter arrival flight number"
            error={!!errors.arrivalFlightNumber}
            errorMessage={errors.arrivalFlightNumber}
            autoCapitalize="characters"
          />
          <DateTimeInput
            label="Arrival Date"
            value={arrivalDate}
            onChangeText={(value) => handleFieldChange('arrivalDate', value, setArrivalDate)}
            mode="date"
            dateType="future"
            helpText="Select arrival date"
            error={!!errors.arrivalDate}
            errorMessage={errors.arrivalDate}
          />
          <Input
            label="Address in the US"
            value={hotelAddress}
            onChangeText={(value) => handleFieldChange('hotelAddress', value, setHotelAddress)}
            multiline
            helpText="Enter full address"
            error={!!errors.hotelAddress}
            errorMessage={errors.hotelAddress}
            autoCapitalize="words"
          />
          <Input
            label="Length of Stay (days)"
            value={stayDuration}
            onChangeText={(value) => handleFieldChange('stayDuration', value, setStayDuration)}
            helpText="Enter number of days"
            error={!!errors.stayDuration}
            errorMessage={errors.stayDuration}
            keyboardType="numeric"
          />
        </CollapsibleSection>

        {/* ESTA Section */}
        <CollapsibleSection
          title="🛂 ESTA Information (Optional)"
          isExpanded={expandedSection === 'esta'}
          onToggle={() => setExpandedSection(expandedSection === 'esta' ? null : 'esta')}
          fieldCount={getFieldCount('esta')}
        >
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroIcon}>ℹ️</Text>
            <Text style={styles.sectionIntroText}>
              If you're traveling under the Visa Waiver Program, you'll need an approved ESTA. Enter your ESTA approval number here for quick reference.
            </Text>
          </View>
          <Input
            label="ESTA Approval Number"
            value={estaNumber}
            onChangeText={(value) => {
              handleFieldChange('estaNumber', value, setEstaNumber);
              setHasESTA(!!value);
            }}
            helpText="Enter your ESTA approval number if available"
            placeholder="e.g., 4123456789012"
            autoCapitalize="characters"
          />
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
  sectionContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.backgroundLight,
  },
  sectionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  fieldCountBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  fieldCountBadgeComplete: {
    backgroundColor: 'rgba(11, 214, 123, 0.15)',
  },
  fieldCountBadgeIncomplete: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  fieldCountText: {
    ...typography.caption,
    fontWeight: '600',
  },
  fieldCountTextComplete: {
    color: '#0BD67B',
  },
  fieldCountTextIncomplete: {
    color: '#FF9500',
  },
  sectionIcon: {
    ...typography.body1,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  scanIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  scanText: {
    ...typography.caption,
    color: colors.text,
  },
  sectionContent: {
    padding: spacing.md,
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
  sectionIntro: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  sectionIntroIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  bottomActions: {
    padding: spacing.md,
  },
  continueButton: {
    marginBottom: spacing.sm,
  },
});

export default USTravelInfoScreen;
