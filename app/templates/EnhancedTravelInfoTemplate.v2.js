/**
 * Enhanced Travel Info Template - V2 (Thailand-Grade Features)
 *
 * V2 adds all Thailand's sophisticated features:
 * - Field state tracking (user-modified vs pre-filled)
 * - Validation engine (config-driven)
 * - Smart button (dynamic label)
 * - Fund management (CRUD with modal)
 * - Field filtering (only save user-modified)
 * - Immediate save for critical fields
 *
 * V2 Goals:
 * ✅ User interaction tracker
 * ✅ Validation with warnings/errors
 * ✅ Smart button
 * ✅ Fund modal management
 * ✅ Field state filtering on save
 * ✅ Production-grade like Thailand
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ScrollView } from 'react-native';
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

// Import Fund Modal
import FundItemDetailModal from '../components/FundItemDetailModal';

// Import V2 Hooks
import { useTemplateUserInteractionTracker } from './hooks/useTemplateUserInteractionTracker';
import { useTemplateValidation } from './hooks/useTemplateValidation';
import { useTemplateFundManagement } from './hooks/useTemplateFundManagement';
import TemplateFieldStateManager from './utils/TemplateFieldStateManager';

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
  // Early validation - config is required
  if (!config) {
    console.error('[Template V2] ERROR: config prop is required but not provided');
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <TamaguiText fontSize="$5" color="$error" textAlign="center" marginBottom="$md">
          Configuration Error
        </TamaguiText>
        <TamaguiText fontSize="$3" color="$textSecondary" textAlign="center">
          Template configuration is missing. Please check the screen implementation.
        </TamaguiText>
      </SafeAreaView>
    );
  }

  const { t } = useLocale();
  const { passport: rawPassport, destination } = route.params || {};

  // Memoize passport and userId
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo]);

  const userId = useMemo(() => {
    const id = passport?.id || 'user_001';
    console.log('[Template V2] userId resolved:', id, 'from passport:', passport);
    return id;
  }, [passport?.id]);

  // ============================================
  // LOCATION DATA (from config)
  // ============================================
  // Extract location data directly from config (no dynamic import needed)
  const locationData = useMemo(() => {
    if (config?.sections?.travel?.locationHierarchy) {
      const { provincesData, getDistrictsFunc } = config.sections.travel.locationHierarchy;
      return {
        provinces: provincesData || [],
        getDistricts: getDistrictsFunc || null,
      };
    }
    return {
      provinces: [],
      getDistricts: null,
    };
  }, [config?.sections?.travel?.locationHierarchy]);

  // ============================================
  // FORM STATE (dynamically created from config)
  // ============================================
  const [formState, setFormState] = useState({
    expandedSections: {},
    errors: {},
    warnings: {},
    isLoading: true,
  });

  // Helper to update form state
  const updateFormState = useCallback((updates) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize form state from config
  useEffect(() => {
    const initialState = {};

    // Build state object from config sections
    if (!config?.sections) {
      console.warn('[Template V2] config.sections is undefined, skipping form initialization');
      setFormState(initialState);
      return;
    }

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

        // Handle custom fields (e.g., customOccupation, customTravelPurpose)
        Object.values(sectionConfig.fields || {}).forEach(field => {
          if (field.allowCustom && field.customFieldName) {
            initialState[field.customFieldName] = '';
          }
        });

        // Handle funds section
        if (sectionConfig.sectionKey === 'funds') {
          initialState.funds = [];
        }
      }
    });

    // Pre-fill with passport data from route params if available
    if (passport) {
      console.log('[Template V2] Pre-filling from route.params passport:', passport);
      if (passport.surname) initialState.surname = passport.surname;
      if (passport.middleName) initialState.middleName = passport.middleName;
      if (passport.givenName) initialState.givenName = passport.givenName;
      if (passport.passportNumber || passport.passportNo) {
        initialState.passportNo = passport.passportNumber || passport.passportNo;
      }
      if (passport.nationality) initialState.nationality = passport.nationality;
      if (passport.dateOfBirth || passport.dob) {
        initialState.dob = passport.dateOfBirth || passport.dob;
      }
      if (passport.expiryDate) initialState.expiryDate = passport.expiryDate;
      if (passport.sex) initialState.sex = passport.sex;
      if (passport.visaNumber) initialState.visaNumber = passport.visaNumber;
    }

    // UI state
    initialState.expandedSections = {};
    initialState.errors = {};
    initialState.warnings = {};
    initialState.saveStatus = null;
    initialState.lastEditedAt = null;
    initialState.lastEditedField = null;
    initialState.isLoading = true;

    // Fund modal state
    initialState.fundItemModalVisible = false;
    initialState.currentFundItem = null;
    initialState.newFundItemType = null;

    // Scroll position state
    initialState.scrollPosition = 0;

    console.log('[Template V2] Initializing formState with fields:', Object.keys(initialState));
    setFormState(initialState);
  }, [config, passport]);

  // ============================================
  // V2 HOOK: USER INTERACTION TRACKER
  // ============================================
  const userInteractionTracker = useTemplateUserInteractionTracker(
    config.destinationId,
    config
  );

  // ============================================
  // DATA LOADING
  // ============================================
  const loadDataFromUserDataService = useCallback(async () => {
    try {
      console.log('[Template V2] Loading data from UserDataService for user:', userId);
      updateFormState({ isLoading: true });

      await UserDataService.initialize(userId);

      const [passportData, personalData, fundsData, travelData] = await Promise.all([
        UserDataService.getPassport(userId),
        UserDataService.getPersonalInfo(userId),
        UserDataService.getFundItems(userId),
        UserDataService.getTravelInfo(userId, config.destinationId),
      ]);

      console.log('[Template V2] Loaded data:', { passportData, personalData, fundsData, travelData });

      // Mark loaded fields as pre-filled
      const loadedData = {
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
        travelPurpose: travelData?.travelPurpose || '',
        customTravelPurpose: travelData?.customTravelPurpose || '',
        recentStayCountry: travelData?.recentStayCountry || '',
        boardingCountry: travelData?.boardingCountry || '',
        arrivalFlightNumber: travelData?.arrivalFlightNumber || '',
        arrivalDate: travelData?.arrivalArrivalDate || '',
        departureFlightNumber: travelData?.departureFlightNumber || '',
        departureDate: travelData?.departureDepartureDate || '',
        isTransitPassenger: travelData?.isTransitPassenger || false,
        accommodationType: travelData?.accommodationType || '',
        customAccommodationType: travelData?.customAccommodationType || '',
        province: travelData?.province || '',
        district: travelData?.district || '',
        districtId: travelData?.districtId || null,
        hotelAddress: travelData?.hotelAddress || '',
      };

      // Mark all loaded fields as pre-filled (not user-modified)
      if (userInteractionTracker.isInitialized) {
        Object.entries(loadedData).forEach(([fieldName, value]) => {
          if (value && !userInteractionTracker.isFieldUserModified(fieldName)) {
            userInteractionTracker.markFieldAsPreFilled(fieldName, value);
          }
        });
      }

      updateFormState({ ...loadedData, isLoading: false });
      console.log('[Template V2] Data loaded successfully. Fields with data:',
        Object.entries(loadedData).filter(([k, v]) => v && v !== '' && k !== 'funds').map(([k]) => k),
        'Funds count:', loadedData.funds?.length || 0
      );
    } catch (error) {
      console.error('[Template V2] Error loading data:', error);
      updateFormState({ isLoading: false });
    }
  }, [userId, config.destinationId, userInteractionTracker.isInitialized, userInteractionTracker.isFieldUserModified, userInteractionTracker.markFieldAsPreFilled, updateFormState]);

  // Load data when user ID is available and tracker is initialized
  useEffect(() => {
    if (userId && userInteractionTracker.isInitialized) {
      console.log('[Template V2] Triggering data load - userId:', userId, 'tracker initialized:', userInteractionTracker.isInitialized);
      loadDataFromUserDataService();
    }
  }, [userId, userInteractionTracker.isInitialized]);

  // ============================================
  // DATA SAVING (V2: With Field Filtering)
  // ============================================
  const saveDataToUserDataService = useCallback(async () => {
    try {
      console.log('[Template V2] Saving data to UserDataService');
      updateFormState({ saveStatus: 'saving' });

      await UserDataService.initialize(userId);

      // Get always-save fields from config
      const alwaysSaveFields = TemplateFieldStateManager.getAlwaysSaveFieldsFromConfig(config);

      // Filter options
      const filterOptions = {
        alwaysSaveFields,
        preserveExisting: true,
      };

      // Passport fields - filter based on user interaction
      const allPassportFields = {
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

      const passportUpdates = TemplateFieldStateManager.filterSaveableFields(
        allPassportFields,
        userInteractionTracker.interactionState,
        filterOptions
      );

      if (Object.keys(passportUpdates).length > 0) {
        await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
        console.log('[Template V2] Saved passport fields:', Object.keys(passportUpdates));
      }

      // Personal info - filter based on user interaction
      const allPersonalFields = {
        occupation: formState.occupation,
        provinceCity: formState.cityOfResidence,
        countryRegion: formState.countryOfResidence,
        phoneCode: formState.phoneCode,
        phoneNumber: formState.phoneNumber,
        email: formState.email,
      };

      const personalInfoUpdates = TemplateFieldStateManager.filterSaveableFields(
        allPersonalFields,
        userInteractionTracker.interactionState,
        filterOptions
      );

      if (Object.keys(personalInfoUpdates).length > 0) {
        await UserDataService.savePersonalInfo(personalInfoUpdates, userId);
        console.log('[Template V2] Saved personal info fields:', Object.keys(personalInfoUpdates));
      }

      // Travel info - filter based on user interaction
      const allTravelFields = {
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

      const travelInfoUpdates = TemplateFieldStateManager.filterSaveableFields(
        allTravelFields,
        userInteractionTracker.interactionState,
        filterOptions
      );

      if (Object.keys(travelInfoUpdates).length > 0) {
        await UserDataService.saveTravelInfo(userId, travelInfoUpdates);
        console.log('[Template V2] Saved travel info fields:', Object.keys(travelInfoUpdates));
      }

      updateFormState({
        saveStatus: 'saved',
        lastEditedAt: new Date(),
      });

      // Clear save status after 2 seconds
      setTimeout(() => {
        updateFormState({ saveStatus: null });
      }, 2000);

      console.log('[Template V2] Data saved successfully');
    } catch (error) {
      console.error('[Template V2] Error saving data:', error);
      updateFormState({ saveStatus: 'error' });
    }
  }, [userId, formState, config, userInteractionTracker.interactionState, updateFormState]);

  // Debounced save
  const saveTimerRef = useRef(null);
  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    updateFormState({ saveStatus: 'pending' });
    saveTimerRef.current = setTimeout(() => {
      saveDataToUserDataService();
    }, config.features?.autoSave?.delay || 1000);
  }, [saveDataToUserDataService, config.features, updateFormState]);

  // ============================================
  // V2 HOOK: VALIDATION
  // ============================================
  const validation = useTemplateValidation({
    config,
    formState: { ...formState, setErrors: (fn) => updateFormState({ errors: typeof fn === 'function' ? fn(formState.errors) : fn }), setWarnings: (fn) => updateFormState({ warnings: typeof fn === 'function' ? fn(formState.warnings) : fn }), setLastEditedAt: (val) => updateFormState({ lastEditedAt: val }) },
    userInteractionTracker,
    saveDataToUserDataService,
    debouncedSave,
  });

  // ============================================
  // V2 HOOK: FUND MANAGEMENT
  // ============================================
  const fundManagement = useTemplateFundManagement({
    config,
    formState,
    setFormState: updateFormState,
    debouncedSave,
    userId,
  });

  // ============================================
  // FIELD UPDATE HANDLERS
  // ============================================
  const updateField = useCallback((fieldName, value) => {
    updateFormState({ [fieldName]: value });

    // Mark as user-modified
    if (userInteractionTracker.isInitialized) {
      userInteractionTracker.markFieldAsModified(fieldName, value);
    }

    debouncedSave();
  }, [userInteractionTracker, debouncedSave, updateFormState]);

  // ============================================
  // LOCATION CASCADE HANDLERS
  // ============================================
  const handleProvinceSelect = useCallback((province) => {
    updateFormState({
      province,
      district: '',
      districtId: null,
    });

    if (userInteractionTracker.isInitialized) {
      userInteractionTracker.markFieldAsModified('province', province);
    }

    debouncedSave();
  }, [userInteractionTracker, debouncedSave, updateFormState]);

  const handleDistrictSelect = useCallback((district, districtId) => {
    updateFormState({
      district,
      districtId,
    });

    if (userInteractionTracker.isInitialized) {
      userInteractionTracker.markFieldAsModified('district', district);
      userInteractionTracker.markFieldAsModified('districtId', districtId);
    }

    debouncedSave();
  }, [userInteractionTracker, debouncedSave, updateFormState]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const handleContinue = useCallback(async () => {
    await saveDataToUserDataService();
    if (config?.navigation?.next) {
      navigation.navigate(config.navigation.next, { passport, destination });
    } else {
      console.warn('[Template V2] No next navigation route configured');
      navigation.goBack();
    }
  }, [saveDataToUserDataService, navigation, config?.navigation?.next, passport, destination]);

  const handleGoBack = useCallback(async () => {
    await saveDataToUserDataService();
    navigation.goBack();
  }, [saveDataToUserDataService, navigation]);

  // ============================================
  // SECTION COLLAPSE/EXPAND
  // ============================================
  const toggleSection = useCallback((sectionKey) => {
    updateFormState({
      expandedSections: {
        ...formState.expandedSections,
        [sectionKey]: !formState.expandedSections[sectionKey],
      },
    });
  }, [formState.expandedSections, updateFormState]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const contextValue = {
    config,
    formState,
    updateField,
    updateFormState,
    toggleSection,
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
    // V2 additions
    userInteractionTracker,
    validation,
    fundManagement,
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
        <BackButton onPress={handleGoBack} />

        <ScrollView>
          {/* Hero Section */}
          <RichHeroSection config={config} />

          {/* Save Status Indicator */}
          {config.features?.saveStatusIndicator && formState.saveStatus && (
            <SaveStatusIndicator status={formState.saveStatus} t={t} />
          )}

          {/* Last Edited Timestamp */}
          {config.features?.lastEditedTimestamp && formState.lastEditedAt && (
            <LastEditedTimestamp time={formState.lastEditedAt} t={t} />
          )}

          {/* Privacy Notice */}
          {config.features?.privacyNotice && <PrivacyNotice t={t} />}

          {/* Sections - auto-render from config */}
          {config?.sections?.passport?.enabled && (
            <PassportSection
              isExpanded={formState.expandedSections?.passport}
              onToggle={() => toggleSection('passport')}
              fieldCount={validation.getFieldCount('passport')}
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
              handleFieldBlur={validation.handleFieldBlur}
              debouncedSaveData={debouncedSave}
              labels={config?.i18n?.labelSource?.passport || {}}
              config={config?.sections?.passport || {}}
            />
          )}

          {/* Personal Info Section */}
          {config?.sections?.personal?.enabled && (
            <PersonalInfoSection
              isExpanded={formState.expandedSections.personal}
              onToggle={() => toggleSection('personal')}
              fieldCount={validation.getFieldCount('personal')}
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
              handleFieldBlur={validation.handleFieldBlur}
              debouncedSaveData={debouncedSave}
              labels={config?.i18n?.labelSource?.personalInfo || {}}
              config={config?.sections?.personal || {}}
            />
          )}

          {/* Funds Section */}
          {config?.sections?.funds?.enabled && (
            <FundsSection
              isExpanded={formState.expandedSections.funds}
              onToggle={() => toggleSection('funds')}
              fieldCount={validation.getFieldCount('funds')}
              funds={formState.funds || []}
              setFunds={(v) => updateField('funds', v)}
              addFund={fundManagement.addFund}
              onFundItemPress={fundManagement.handleFundItemPress}
              debouncedSaveData={debouncedSave}
              labels={config?.i18n?.labelSource?.funds || {}}
              config={config?.sections?.funds || {}}
            />
          )}

          {/* Travel Details Section */}
          {config?.sections?.travel?.enabled && (
            <TravelDetailsSection
              isExpanded={formState.expandedSections.travel}
              onToggle={() => toggleSection('travel')}
              fieldCount={validation.getFieldCount('travel')}
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
              handleFieldBlur={validation.handleFieldBlur}
              debouncedSaveData={debouncedSave}
              labels={config?.i18n?.labelSource?.travelDetails || {}}
              config={config?.sections?.travel || {}}
            />
          )}

          {/* Smart Submit Button */}
          <YStack paddingHorizontal="$md" paddingVertical="$lg">
            <SmartButton
              config={config}
              validation={validation}
              onPress={handleContinue}
            />
          </YStack>
        </ScrollView>

        {/* Fund Item Modal */}
        {formState.fundItemModalVisible && (
          <FundItemDetailModal
            visible={formState.fundItemModalVisible}
            fundItem={formState.currentFundItem}
            createItemType={formState.newFundItemType}
            onClose={fundManagement.handleFundItemModalClose}
            onUpdate={fundManagement.handleFundItemUpdate}
            onCreate={fundManagement.handleFundItemCreate}
            onDelete={fundManagement.handleFundItemDelete}
          />
        )}
      </SafeAreaView>
    </EnhancedTemplateContext.Provider>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Rich Hero Section (Thailand-style)
const RichHeroSection = ({ config }) => {
  if (!config?.hero || config.hero.type !== 'rich') return null;

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

// Last Edited Timestamp
const LastEditedTimestamp = ({ time, t }) => {
  if (!time) return null;

  return (
    <TamaguiText fontSize="$1" color="$textSecondary" textAlign="center" marginBottom="$sm">
      Last edited: {time.toLocaleTimeString()}
    </TamaguiText>
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

// Smart Submit Button (V2 Feature)
const SmartButton = ({ config, validation, onPress }) => {
  const buttonConfig = validation.getSmartButtonConfig();

  return (
    <BaseButton
      variant={buttonConfig.variant}
      size="lg"
      onPress={onPress}
      fullWidth
    >
      {`${buttonConfig.icon} ${buttonConfig.label}`}
    </BaseButton>
  );
};

// Export
export default EnhancedTravelInfoTemplate;
export { EnhancedTemplateContext, useEnhancedTemplate };
