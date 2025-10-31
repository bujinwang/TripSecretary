/**
 * Enhanced Travel Info Template - V1 (Minimal Working Version)
 *
 * This is an iterative implementation - starting with core functionality
 * and building up based on real-world testing with Vietnam.
 *
 * V1 Goals:
 * - Basic auto-rendering from config
 * - Form state management (all fields)
 * - Data loading from UserDataService
 * - Data saving to UserDataService
 * - Basic validation
 * - Thailand-style hero section
 * - Save status indicator
 *
 * NOT in V1 (will add iteratively):
 * - Photo uploads
 * - Complex location cascade
 * - Advanced validation rules
 * - Performance monitoring
 * - Session state management
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import { getPhoneCode } from '../data/phoneCodes';

// Import Tamagui components
import {
  YStack,
  XStack,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../components/tamagui';

// Import shared section components
import {
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../components/shared/sections';

// Import BackButton
import BackButton from '../components/BackButton';

// ============================================
// TEMPLATE CONTEXT
// ============================================
const EnhancedTemplateContext = React.createContext(null);

const useEnhancedTemplate = () => {
  const context = React.useContext(EnhancedTemplateContext);
  if (!context) {
    throw new Error('useEnhancedTemplate must be used within EnhancedTravelInfoTemplate');
  }
  return context;
};

// ============================================
// MAIN TEMPLATE COMPONENT
// ============================================
const EnhancedTravelInfoTemplate = ({
  config,
  route,
  navigation,
  children, // Custom render mode
}) => {
  const { t } = useLocale();
  const { passport: rawPassport, destination } = route.params || {};

  const destinationId = useMemo(() => {
    if (config?.destinationId) {
      return config.destinationId;
    }
    if (!destination) {
      return null;
    }
    if (typeof destination === 'string') {
      return destination;
    }
    if (typeof destination === 'object') {
      return (
        destination.id ||
        destination.destinationId ||
        destination.code ||
        null
      );
    }
    return null;
  }, [config?.destinationId, destination]);

  // Memoize passport and userId
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo]);

  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // ============================================
  // LOCATION DATA (dynamically loaded from config)
  // ============================================
  const [locationData, setLocationData] = useState({
    provinces: [],
    getDistricts: null,
  });

  // Load location data based on config
  useEffect(() => {
    const loadLocationData = async () => {
      if (config.sections.travel?.locationHierarchy) {
        const { dataSourceModule, getLevel1Data, getLevel2Data } = config.sections.travel.locationHierarchy;

        try {
          // Dynamically import location data
          const locationModule = await import(dataSourceModule);
          setLocationData({
            provinces: locationModule[getLevel1Data] || [],
            getDistricts: locationModule[getLevel2Data] || null,
          });
        } catch (error) {
          console.error('[Template] Error loading location data:', error);
        }
      }
    };

    loadLocationData();
  }, [config]);

  // ============================================
  // FORM STATE (dynamically created from config)
  // ============================================
  const [formState, setFormState] = useState({});

  // Initialize form state from config
  useEffect(() => {
    const initialState = {};

    // Build state object from config sections
    Object.entries(config.sections).forEach(([sectionKey, sectionConfig]) => {
      if (sectionConfig.enabled && sectionConfig.fields) {
        Object.entries(sectionConfig.fields).forEach(([fieldKey, fieldConfig]) => {
          initialState[fieldConfig.fieldName] = '';

          // Set smart defaults
          if (fieldConfig.smartDefault) {
            if (fieldConfig.smartDefault === 'tomorrow') {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              initialState[fieldConfig.fieldName] = tomorrow.toISOString().split('T')[0];
            } else if (fieldConfig.smartDefault === 'nextWeek') {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              initialState[fieldConfig.fieldName] = nextWeek.toISOString().split('T')[0];
            }
          }

          // Set default values
          if (fieldConfig.default !== undefined) {
            initialState[fieldConfig.fieldName] = fieldConfig.default;
          }
        });

        // Handle custom fields
        if (sectionConfig.sectionKey === 'funds') {
          initialState.funds = [];
        }
      }
    });

    // UI state
    initialState.expandedSections = {};
    initialState.errors = {};
    initialState.warnings = {};
    initialState.saveStatus = null;
    initialState.lastEditedAt = null;
    initialState.isLoading = true;

    setFormState(initialState);
  }, [config]);

  // ============================================
  // DATA LOADING
  // ============================================
  const loadDataFromUserDataService = useCallback(async () => {
    try {
      console.log('[Template] Loading data from UserDataService for user:', userId);
      await UserDataService.initialize(userId);

      const [passportData, personalData, fundsData, travelData] = await Promise.all([
        UserDataService.getPassport(userId),
        UserDataService.getPersonalInfo(userId),
        UserDataService.getFundItems(userId),
        UserDataService.getTravelInfo(userId, destinationId),
      ]);

      let resolvedTravelData = travelData;

      if (!resolvedTravelData && destinationId) {
        const legacyTravelData = await UserDataService.getTravelInfo(userId);
        if (legacyTravelData && !legacyTravelData.destination) {
          console.log('[Template] Found legacy travel info without destination; using fallback record');
          resolvedTravelData = { ...legacyTravelData };
          try {
            await UserDataService.saveTravelInfo(userId, { destination: destinationId });
            resolvedTravelData.destination = destinationId;
            console.log('[Template] Migrated legacy travel info to destination:', destinationId);
          } catch (migrationError) {
            console.warn('[Template] Failed to migrate legacy travel info destination:', migrationError);
          }
        }
      }

      console.log('[Template] Loaded data:', { passportData, personalData, fundsData, travelData: resolvedTravelData });

      // Update form state with loaded data
      setFormState(prev => ({
        ...prev,
        // Passport fields
        surname: passportData?.surname || '',
        middleName: passportData?.middleName || '',
        givenName: passportData?.givenName || '',
        passportNo: passportData?.passportNumber || '',
        nationality: passportData?.nationality || '',
        dob: passportData?.dateOfBirth || '',
        expiryDate: passportData?.expiryDate || '',
        sex: passportData?.sex || '',
        visaNumber: passportData?.visaNumber || '',

        // Personal fields
        occupation: personalData?.occupation || '',
        cityOfResidence: personalData?.provinceCity || '',
        countryOfResidence: personalData?.countryRegion || '',
        phoneCode: personalData?.phoneCode || getPhoneCode(passportData?.nationality || ''),
        phoneNumber: personalData?.phoneNumber || '',
        email: personalData?.email || '',

        // Funds
        funds: fundsData || [],

        // Travel fields
        travelPurpose: resolvedTravelData?.travelPurpose || '',
        customTravelPurpose: resolvedTravelData?.customTravelPurpose || '',
        recentStayCountry: resolvedTravelData?.recentStayCountry || '',
        boardingCountry: resolvedTravelData?.boardingCountry || '',
        arrivalFlightNumber: resolvedTravelData?.arrivalFlightNumber || '',
        arrivalDate: resolvedTravelData?.arrivalArrivalDate || prev.arrivalDate, // Keep smart default if no data
        departureFlightNumber: resolvedTravelData?.departureFlightNumber || '',
        departureDate: resolvedTravelData?.departureDepartureDate || prev.departureDate,
        isTransitPassenger: resolvedTravelData?.isTransitPassenger || false,
        accommodationType: resolvedTravelData?.accommodationType || '',
        customAccommodationType: resolvedTravelData?.customAccommodationType || '',
        province: resolvedTravelData?.province || '',
        district: resolvedTravelData?.district || '',
        districtId: resolvedTravelData?.districtId || null,
        hotelAddress: resolvedTravelData?.hotelAddress || '',

        isLoading: false,
      }));
    } catch (error) {
      console.error('[Template] Error loading data:', error);
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId, destinationId]);

  useEffect(() => {
    if (userId) {
      loadDataFromUserDataService();
    }
  }, [userId, loadDataFromUserDataService]);

  // ============================================
  // DATA SAVING (V1: Basic implementation)
  // ============================================
  const saveDataToUserDataService = useCallback(async () => {
    try {
      console.log('[Template] Saving data to UserDataService');
      setFormState(prev => ({ ...prev, saveStatus: 'saving' }));

      await UserDataService.initialize(userId);

      // Save passport data
      const passportUpdates = {
        surname: formState.surname,
        middleName: formState.middleName,
        givenName: formState.givenName,
        passportNumber: formState.passportNo,
        nationality: formState.nationality,
        dateOfBirth: formState.dob,
        expiryDate: formState.expiryDate,
        sex: formState.sex,
        visaNumber: formState.visaNumber,
      };

      if (Object.values(passportUpdates).some(v => v)) {
        await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
      }

      // Save personal info
      const personalInfoUpdates = {
        occupation: formState.occupation,
        provinceCity: formState.cityOfResidence,
        countryRegion: formState.countryOfResidence,
        phoneCode: formState.phoneCode,
        phoneNumber: formState.phoneNumber,
        email: formState.email,
      };

      if (Object.values(personalInfoUpdates).some(v => v)) {
        await UserDataService.savePersonalInfo(personalInfoUpdates, userId);
      }

      // Save travel info
      const travelInfoUpdates = {
        travelPurpose: formState.travelPurpose,
        customTravelPurpose: formState.customTravelPurpose,
        recentStayCountry: formState.recentStayCountry,
        boardingCountry: formState.boardingCountry,
        arrivalFlightNumber: formState.arrivalFlightNumber,
        arrivalArrivalDate: formState.arrivalDate,
        departureFlightNumber: formState.departureFlightNumber,
        departureDepartureDate: formState.departureDate,
        isTransitPassenger: formState.isTransitPassenger,
        accommodationType: formState.accommodationType,
        customAccommodationType: formState.customAccommodationType,
        province: formState.province,
        district: formState.district,
        districtId: formState.districtId,
        hotelAddress: formState.hotelAddress,
      };

      const hasTravelUpdates = Object.entries(travelInfoUpdates).some(
        ([, value]) => value !== null && value !== undefined && value !== ''
      );

      if (hasTravelUpdates) {
        const travelInfoPayload = {
          ...travelInfoUpdates,
          ...(destinationId ? { destination: destinationId } : {}),
        };
        await UserDataService.saveTravelInfo(userId, travelInfoPayload);
      }

      setFormState(prev => ({
        ...prev,
        saveStatus: 'saved',
        lastEditedAt: new Date(),
      }));

      // Clear save status after 2 seconds
      setTimeout(() => {
        setFormState(prev => ({ ...prev, saveStatus: null }));
      }, 2000);

      console.log('[Template] Data saved successfully');
    } catch (error) {
      console.error('[Template] Error saving data:', error);
      setFormState(prev => ({ ...prev, saveStatus: 'error' }));
    }
  }, [userId, formState, destinationId]);

  // Debounced save
  const saveTimerRef = useRef(null);
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setFormState(prev => ({ ...prev, saveStatus: 'pending' }));
    saveTimerRef.current = setTimeout(() => {
      saveDataToUserDataService();
    }, config.features.autoSaveDelay || 1000);
  }, [saveDataToUserDataService, config.features.autoSaveDelay]);

  // ============================================
  // FIELD UPDATE HANDLERS
  // ============================================
  const updateField = useCallback((fieldName, value) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: value,
    }));
    debouncedSave();
  }, [debouncedSave]);

  // ============================================
  // LOCATION CASCADE HANDLERS
  // ============================================
  const handleProvinceSelect = useCallback((province) => {
    setFormState(prev => ({
      ...prev,
      province,
      district: '', // Reset district when province changes
      districtId: null,
    }));
    debouncedSave();
  }, [debouncedSave]);

  const handleDistrictSelect = useCallback((district, districtId) => {
    setFormState(prev => ({
      ...prev,
      district,
      districtId,
    }));
    debouncedSave();
  }, [debouncedSave]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const handleContinue = useCallback(async () => {
    await saveDataToUserDataService();
    navigation.navigate(config.navigation.next, { passport, destination });
  }, [saveDataToUserDataService, navigation, config.navigation.next, passport, destination]);

  const handleGoBack = useCallback(async () => {
    await saveDataToUserDataService();
    navigation.goBack();
  }, [saveDataToUserDataService, navigation]);

  // ============================================
  // SECTION COLLAPSE/EXPAND
  // ============================================
  const toggleSection = useCallback((sectionKey) => {
    setFormState(prev => ({
      ...prev,
      expandedSections: {
        ...prev.expandedSections,
        [sectionKey]: !prev.expandedSections[sectionKey],
      },
    }));
  }, []);

  // ============================================
  // FIELD COUNT CALCULATION
  // ============================================
  const getFieldCount = useCallback((sectionKey) => {
    const sectionConfig = config.sections[sectionKey];
    if (!sectionConfig) return { filled: 0, total: 0 };

    if (sectionKey === 'funds') {
      return { filled: formState.funds?.length || 0, total: formState.funds?.length || 1 };
    }

    const fields = Object.values(sectionConfig.fields || {});
    const total = fields.filter(f => f.required).length;
    const filled = fields.filter(f => f.required && formState[f.fieldName]).length;

    return { filled, total };
  }, [config.sections, formState]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const contextValue = {
    config,
    formState,
    updateField,
    toggleSection,
    getFieldCount,
    saveDataToUserDataService,
    debouncedSave,
    handleContinue,
    handleGoBack,
    handleProvinceSelect,
    handleDistrictSelect,
    locationData,
    t,
    navigation,
    route,
    passport,
    destination,
    userId,
  };

  // ============================================
  // RENDER
  // ============================================
  if (formState.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <TamaguiText>Loading...</TamaguiText>
      </SafeAreaView>
    );
  }

  // Custom render mode
  if (children) {
    return (
      <EnhancedTemplateContext.Provider value={contextValue}>
        {typeof children === 'function' ? children(contextValue) : children}
      </EnhancedTemplateContext.Provider>
    );
  }

  // Auto-render mode (default)
  return (
    <EnhancedTemplateContext.Provider value={contextValue}>
      <SafeAreaView style={{ flex: 1, backgroundColor: config.colors?.background || '#F9FAFB' }}>
        {/* Back Button */}
        <BackButton onPress={handleGoBack} />

        <ScrollView>
          {/* Hero Section */}
          <RichHeroSection config={config} />

          {/* Save Status Indicator */}
          {config.features.saveStatusIndicator && formState.saveStatus && (
            <SaveStatusIndicator status={formState.saveStatus} t={t} />
          )}

          {/* Privacy Notice */}
          {config.features.privacyNotice && <PrivacyNotice t={t} />}

          {/* Sections - auto-render from config */}
          {config.sections.passport?.enabled && (
            <PassportSection
              isExpanded={formState.expandedSections.passport}
              onToggle={() => toggleSection('passport')}
              fieldCount={getFieldCount('passport')}
              surname={formState.surname}
              middleName={formState.middleName}
              givenName={formState.givenName}
              nationality={formState.nationality}
              passportNo={formState.passportNo}
              visaNumber={formState.visaNumber}
              dob={formState.dob}
              expiryDate={formState.expiryDate}
              sex={formState.sex}
              setSurname={(v) => updateField('surname', v)}
              setMiddleName={(v) => updateField('middleName', v)}
              setGivenName={(v) => updateField('givenName', v)}
              setNationality={(v) => updateField('nationality', v)}
              setPassportNo={(v) => updateField('passportNo', v)}
              setVisaNumber={(v) => updateField('visaNumber', v)}
              setDob={(v) => updateField('dob', v)}
              setExpiryDate={(v) => updateField('expiryDate', v)}
              setSex={(v) => updateField('sex', v)}
              errors={formState.errors}
              warnings={formState.warnings}
              debouncedSaveData={debouncedSave}
              labels={config.i18n.labelSource.passport}
              config={config.sections.passport}
            />
          )}

          {/* Personal Info Section */}
          {config.sections.personal?.enabled && (
            <PersonalInfoSection
              isExpanded={formState.expandedSections.personal}
              onToggle={() => toggleSection('personal')}
              fieldCount={getFieldCount('personal')}
              occupation={formState.occupation}
              customOccupation={formState.customOccupation}
              cityOfResidence={formState.cityOfResidence}
              countryOfResidence={formState.countryOfResidence}
              phoneCode={formState.phoneCode}
              phoneNumber={formState.phoneNumber}
              email={formState.email}
              setOccupation={(v) => updateField('occupation', v)}
              setCustomOccupation={(v) => updateField('customOccupation', v)}
              setCityOfResidence={(v) => updateField('cityOfResidence', v)}
              setCountryOfResidence={(v) => updateField('countryOfResidence', v)}
              setPhoneCode={(v) => updateField('phoneCode', v)}
              setPhoneNumber={(v) => updateField('phoneNumber', v)}
              setEmail={(v) => updateField('email', v)}
              errors={formState.errors}
              warnings={formState.warnings}
              debouncedSaveData={debouncedSave}
              labels={config.i18n.labelSource.personalInfo}
              config={config.sections.personal}
            />
          )}

          {/* Funds Section */}
          {config.sections.funds?.enabled && (
            <FundsSection
              isExpanded={formState.expandedSections.funds}
              onToggle={() => toggleSection('funds')}
              fieldCount={getFieldCount('funds')}
              funds={formState.funds || []}
              setFunds={(v) => updateField('funds', v)}
              debouncedSaveData={debouncedSave}
              labels={config.i18n.labelSource.funds}
              config={config.sections.funds}
            />
          )}

          {/* Travel Details Section */}
          {config.sections.travel?.enabled && (
            <TravelDetailsSection
              isExpanded={formState.expandedSections.travel}
              onToggle={() => toggleSection('travel')}
              fieldCount={getFieldCount('travel')}
              travelPurpose={formState.travelPurpose}
              customTravelPurpose={formState.customTravelPurpose}
              recentStayCountry={formState.recentStayCountry}
              boardingCountry={formState.boardingCountry}
              arrivalFlightNumber={formState.arrivalFlightNumber}
              arrivalArrivalDate={formState.arrivalDate}
              departureFlightNumber={formState.departureFlightNumber}
              departureDepartureDate={formState.departureDate}
              isTransitPassenger={formState.isTransitPassenger}
              accommodationType={formState.accommodationType}
              customAccommodationType={formState.customAccommodationType}
              province={formState.province}
              district={formState.district}
              districtId={formState.districtId}
              hotelAddress={formState.hotelAddress}
              setTravelPurpose={(v) => updateField('travelPurpose', v)}
              setCustomTravelPurpose={(v) => updateField('customTravelPurpose', v)}
              setRecentStayCountry={(v) => updateField('recentStayCountry', v)}
              setBoardingCountry={(v) => updateField('boardingCountry', v)}
              setArrivalFlightNumber={(v) => updateField('arrivalFlightNumber', v)}
              setArrivalArrivalDate={(v) => updateField('arrivalDate', v)}
              setDepartureFlightNumber={(v) => updateField('departureFlightNumber', v)}
              setDepartureDepartureDate={(v) => updateField('departureDate', v)}
              setIsTransitPassenger={(v) => updateField('isTransitPassenger', v)}
              setAccommodationType={(v) => updateField('accommodationType', v)}
              setCustomAccommodationType={(v) => updateField('customAccommodationType', v)}
              setProvince={(v) => updateField('province', v)}
              setDistrict={(v) => updateField('district', v)}
              setDistrictId={(v) => updateField('districtId', v)}
              setHotelAddress={(v) => updateField('hotelAddress', v)}
              handleProvinceSelect={handleProvinceSelect}
              handleDistrictSelect={handleDistrictSelect}
              regionsData={locationData.provinces}
              getDistrictsFunc={locationData.getDistricts}
              errors={formState.errors}
              warnings={formState.warnings}
              debouncedSaveData={debouncedSave}
              labels={config.i18n.labelSource.travelDetails}
              config={config.sections.travel}
            />
          )}

          {/* Submit Button */}
          <YStack paddingHorizontal="$md" paddingVertical="$lg">
            <BaseButton variant="primary" size="lg" onPress={handleContinue} fullWidth>
              {config.navigation.submitButtonLabel.default}
            </BaseButton>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </EnhancedTemplateContext.Provider>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Rich Hero Section (Thailand-style)
const RichHeroSection = ({ config }) => {
  if (config.hero.type !== 'rich') return null;

  return (
    <YStack paddingHorizontal="$md" marginBottom="$md">
      <LinearGradient
        colors={config.hero.gradient.colors}
        start={config.hero.gradient.start}
        end={config.hero.gradient.end}
        style={{
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <YStack alignItems="center">
          <TamaguiText fontSize={36} marginBottom="$xs">{config.flag}</TamaguiText>
          <TamaguiText fontSize={20} fontWeight="700" color="white" marginBottom={4} textAlign="center">
            {config.hero.title}
          </TamaguiText>
          <TamaguiText fontSize={13} color="#E8F0FF" textAlign="center">
            {config.hero.subtitle}
          </TamaguiText>

          {/* Value Propositions */}
          <XStack justifyContent="space-around" width="100%" marginVertical="$sm" paddingVertical="$xs">
            {config.hero.valuePropositions.map((vp, idx) => (
              <YStack key={idx} alignItems="center" flex={1}>
                <TamaguiText fontSize={24} marginBottom={4}>{vp.icon}</TamaguiText>
                <TamaguiText fontSize={11} fontWeight="600" color="white" textAlign="center">
                  {vp.text}
                </TamaguiText>
              </YStack>
            ))}
          </XStack>

          {/* Beginner Tip */}
          <XStack
            backgroundColor="rgba(255, 255, 255, 0.1)"
            borderRadius={10}
            padding="$sm"
            alignItems="flex-start"
            width="100%"
          >
            <TamaguiText fontSize={20} marginRight="$xs">{config.hero.beginnerTip.icon}</TamaguiText>
            <TamaguiText fontSize={12} color="#E8F0FF" flex={1} lineHeight={18}>
              {config.hero.beginnerTip.text}
            </TamaguiText>
          </XStack>
        </YStack>
      </LinearGradient>
    </YStack>
  );
};

// Save Status Indicator
const SaveStatusIndicator = ({ status, t }) => {
  const statusConfig = {
    pending: { icon: '⏳', color: '#FFF9E6', text: '等待保存...' },
    saving: { icon: '💾', color: '#E6F2FF', text: '正在保存...' },
    saved: { icon: '✅', color: '#E6F9E6', text: '已保存' },
    error: { icon: '❌', color: '#FFE6E6', text: '保存失败' },
  };

  const config = statusConfig[status];
  if (!config) return null;

  return (
    <XStack
      paddingHorizontal="$md"
      paddingVertical="$sm"
      alignItems="center"
      gap="$sm"
      backgroundColor={config.color}
      marginHorizontal="$md"
      marginVertical="$sm"
      borderRadius="$md"
    >
      <TamaguiText fontSize={16}>{config.icon}</TamaguiText>
      <TamaguiText fontSize="$2" color="$textSecondary" flex={1}>
        {config.text}
      </TamaguiText>
    </XStack>
  );
};

// Privacy Notice
const PrivacyNotice = ({ t }) => {
  return (
    <YStack paddingHorizontal="$md" marginBottom="$md">
      <BaseCard variant="flat" padding="md">
        <XStack gap="$sm" alignItems="center">
          <TamaguiText fontSize={20}>💾</TamaguiText>
          <TamaguiText fontSize="$2" color="$textSecondary" flex={1}>
            所有信息仅保存在您的手机本地
          </TamaguiText>
        </XStack>
      </BaseCard>
    </YStack>
  );
};

// Export
export default EnhancedTravelInfoTemplate;
export { EnhancedTemplateContext, useEnhancedTemplate };
