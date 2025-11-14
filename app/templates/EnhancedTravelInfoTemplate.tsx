// @ts-nocheck

/**
 * Enhanced Travel Info Template
 *
 * Production-grade template with Thailand-level features:
 * - Field state tracking (user-modified vs pre-filled)
 * - Validation engine (config-driven)
 * - Smart button (dynamic label)
 * - Fund management (CRUD with modal)
 * - Field filtering (only save user-modified)
 * - Immediate save for critical fields
 *
 * Features:
 * ✅ User interaction tracker
 * ✅ Validation with warnings/errors
 * ✅ Smart button
 * ✅ Fund modal management
 * ✅ Field state filtering on save
 * ✅ Production-grade implementation
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import { getPhoneCode } from '../data/phoneCodes';
import { getDefaultArrivalDate, getDefaultDepartureDate } from '../utils/defaultTravelDates';

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

// Import Template Hooks
import { useTemplateUserInteractionTracker } from './hooks/useTemplateUserInteractionTracker';
import { useTemplateValidation } from './hooks/useTemplateValidation';
import { useTemplateFundManagement } from './hooks/useTemplateFundManagement';
import { useTemplatePhotoManagement } from './hooks/useTemplatePhotoManagement';
import TemplateFieldStateManager from './utils/TemplateFieldStateManager';

type EnhancedTravelInfoTemplateProps = {
  config: any;
  route: any;
  navigation: any;
  children?: React.ReactNode;
};

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
const EnhancedTravelInfoTemplate: React.FC<EnhancedTravelInfoTemplateProps> = ({
  config,
  route,
  navigation,
  children, // Custom render mode
}) => {
  // ✅ CRITICAL FIX: All hooks must be called BEFORE any conditional returns
  // This ensures hooks are always called in the same order (Rules of Hooks)
  const { t } = useLocale();
  const {
    passport: rawPassport,
    destination,
    userId: routeUserId,
    entryInfo: routeEntryInfo,
    travelInfo: routeTravelInfo,
    personalInfo: routePersonalInfo,
    user: routeUser,
    userData: routeUserData,
  } = route.params || {};

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

  // Helper function to resolve section labels using i18n
  const resolveSectionLabels = useCallback((sectionKey, sectionConfig, labelSource = {}) => {
    const resolvedLabels = { ...labelSource };
    const destId = config?.destinationId || destinationId || 'hongkong';
    
    // Resolve title using titleKey if available
    if (sectionConfig?.titleKey) {
      resolvedLabels.title = t(sectionConfig.titleKey, { 
        defaultValue: sectionConfig.defaultTitle || labelSource.title || sectionKey 
      });
    } else if (labelSource.title) {
      // If labelSource has a title, try to resolve it as a translation key
      const titleKey = `${destId}.travelInfo.sections.${sectionKey}.title`;
      resolvedLabels.title = t(titleKey, { defaultValue: labelSource.title });
    }
    
    // Resolve subtitle if there's a subtitleKey
    if (sectionConfig?.subtitleKey) {
      resolvedLabels.subtitle = t(sectionConfig.subtitleKey, {
        defaultValue: sectionConfig.defaultSubtitle || labelSource.subtitle || ''
      });
    } else if (labelSource.subtitle) {
      // If labelSource has a subtitle, try to resolve it as a translation key
      const subtitleKey = `${destId}.travelInfo.sections.${sectionKey}.subtitle`;
      resolvedLabels.subtitle = t(subtitleKey, { defaultValue: labelSource.subtitle });
    }
    
    // Resolve field labels from config
    if (sectionConfig?.fields) {
      Object.entries(sectionConfig.fields).forEach(([fieldKey, fieldConfig]) => {
        if (fieldConfig?.labelKey) {
          // Map field keys to component label keys
          const labelKeyMap = {
            // Passport fields
            surname: ['surname', 'surnameLabel'],
            middleName: ['middleName', 'middleNameLabel'],
            givenName: ['givenName', 'givenNameLabel'],
            passportNo: 'passportNo',
            nationality: 'nationality',
            dob: 'dob',
            expiryDate: 'expiryDate',
            sex: 'sex',
            visaNumber: 'visaNumber',
            // Personal fields
            occupation: 'occupation',
            cityOfResidence: 'cityOfResidence',
            countryOfResidence: 'countryOfResidence',
            residentCountry: 'countryOfResidence', // Alias
            phoneCode: 'phoneCode',
            phoneNumber: 'phoneNumber',
            email: 'email',
            // Travel fields
            travelPurpose: 'travelPurpose',
            recentStayCountry: 'recentStayCountry',
            boardingCountry: 'boardingCountry',
            arrivalFlightNumber: 'arrivalFlightNumber',
            arrivalDate: 'arrivalDate',
            departureFlightNumber: 'departureFlightNumber',
            departureDate: 'departureDate',
            isTransitPassenger: 'isTransitPassenger',
            accommodationType: 'accommodationType',
            province: 'province',
            district: 'district',
            subDistrict: 'subDistrict',
            postalCode: 'postalCode',
            hotelAddress: 'hotelAddress',
            accommodationAddress: 'hotelAddress', // Alias
            accommodationPhone: 'accommodationPhone',
            ketaNumber: 'ketaNumber',
            hasKeta: 'hasKeta',
            stayDuration: 'stayDuration',
            city: 'city',
            contactNumber: 'contactNumber',
          };
          
          const componentLabelKeys = labelKeyMap[fieldKey];
          const translatedLabel = t(fieldConfig.labelKey, {
            defaultValue: fieldConfig.defaultLabel || ''
          });
          
          // Handle multiple label keys (e.g., surname -> surnameLabel for PassportNameInput)
          if (Array.isArray(componentLabelKeys)) {
            componentLabelKeys.forEach(key => {
              resolvedLabels[key] = translatedLabel;
            });
          } else {
            const componentLabelKey = componentLabelKeys || fieldKey;
            resolvedLabels[componentLabelKey] = translatedLabel;
          }
          
          // Also resolve help text - try fieldHelp key first, then nested .help, then config helpText
          const baseKey = Array.isArray(componentLabelKeys) ? componentLabelKeys[0] : (componentLabelKeys || fieldKey);
          
          // Try fieldHelp structure first (e.g., kr.travelInfo.fieldHelp.nationality)
          const fieldHelpKey = `${destId}.travelInfo.fieldHelp.${fieldKey}`;
          let translatedHelpText = t(fieldHelpKey, { defaultValue: null });
          
          // If not found, try nested structure (e.g., kr.travelInfo.fields.nationality.help)
          if (!translatedHelpText) {
            const nestedHelpKey = `${destId}.travelInfo.fields.${fieldKey}.help`;
            translatedHelpText = t(nestedHelpKey, { defaultValue: null });
          }
          
          // Use config helpText as fallback
          if (!translatedHelpText && fieldConfig.helpText) {
            translatedHelpText = fieldConfig.helpText;
          }
          
          if (translatedHelpText) {
            resolvedLabels[`${baseKey}Help`] = translatedHelpText;
          }
          
          // Resolve placeholders
          if (fieldConfig.placeholder) {
            const placeholderKey = `${destId}.travelInfo.fields.${fieldKey}.placeholder`;
            const translatedPlaceholder = t(placeholderKey, { defaultValue: fieldConfig.placeholder });
            resolvedLabels[`${baseKey}Placeholder`] = translatedPlaceholder;
          }
        }
      });
    }
    
    // Resolve additional travel section labels that aren't in fields config
    if (sectionKey === 'travel') {
      const additionalLabels = {
        isTransitPassenger: 'isTransitPassenger',
        transitYes: 'transitYes',
        transitNo: 'transitNo',
        hotelAddressPlaceholder: 'hotelAddressPlaceholder',
        provincePlaceholder: 'provincePlaceholder',
        districtPlaceholder: 'districtPlaceholder',
        subDistrictPlaceholder: 'subDistrictPlaceholder',
        accommodationTypePlaceholder: 'accommodationTypePlaceholder',
        accommodationTypeModalTitle: 'accommodationTypeModalTitle',
        introText: 'introText',
        introIcon: 'introIcon',
      };
      
      Object.entries(additionalLabels).forEach(([labelKey, fieldKey]) => {
        // Try to resolve from i18n
        const translationKey = `${destId}.travelInfo.sections.travel.${labelKey}`;
        const translated = t(translationKey, { defaultValue: null });
        if (translated) {
          resolvedLabels[labelKey] = translated;
        } else {
          // Try field-level resolution for some labels
          if (['isTransitPassenger', 'transitYes', 'transitNo'].includes(labelKey)) {
            const fieldTranslationKey = `${destId}.travelInfo.fields.${fieldKey}`;
            const fieldTranslated = t(fieldTranslationKey, { defaultValue: null });
            if (fieldTranslated) {
              resolvedLabels[labelKey] = fieldTranslated;
            }
          }
          // For placeholders, try fieldHelp structure
          if (labelKey.includes('Placeholder')) {
            const baseFieldKey = labelKey.replace('Placeholder', '');
            const placeholderKey = `${destId}.travelInfo.fields.${baseFieldKey}.placeholder`;
            const placeholderTranslated = t(placeholderKey, { defaultValue: null });
            if (placeholderTranslated) {
              resolvedLabels[labelKey] = placeholderTranslated;
            }
          }
          // For modal titles, try sections.travel structure
          if (labelKey.includes('ModalTitle')) {
            const modalTitleKey = `${destId}.travelInfo.sections.travel.${labelKey}`;
            const modalTitleTranslated = t(modalTitleKey, { defaultValue: null });
            if (modalTitleTranslated) {
              resolvedLabels[labelKey] = modalTitleTranslated;
            }
          }
        }
      });
    }
    
    // Special handling for personal section labels - ensure help texts are resolved
    if (sectionKey === 'personal') {
      const personalHelpFields = [
        { fieldKey: 'occupation', labelKey: 'occupationHelp' },
        { fieldKey: 'cityOfResidence', labelKey: 'cityOfResidenceHelp' },
        { fieldKey: 'countryOfResidence', labelKey: 'countryOfResidenceHelp' },
        { fieldKey: 'residentCountry', labelKey: 'residentCountryHelp' },
        { fieldKey: 'phoneNumber', labelKey: 'phoneNumberHelp' },
        { fieldKey: 'email', labelKey: 'emailHelp' },
      ];
      
      personalHelpFields.forEach(({ fieldKey, labelKey }) => {
        // Only set if not already resolved
        if (!resolvedLabels[labelKey]) {
          // Try fieldHelp structure first (destination-specific)
          const fieldHelpKey = `${destId}.travelInfo.fieldHelp.${fieldKey}`;
          let translatedHelpText = t(fieldHelpKey, { defaultValue: null });
          
          // If not found, try nested structure
          if (!translatedHelpText) {
            const nestedHelpKey = `${destId}.travelInfo.fields.${fieldKey}.help`;
            translatedHelpText = t(nestedHelpKey, { defaultValue: null });
          }
          
          // Fallback: try common translations if destination-specific not found
          if (!translatedHelpText) {
            // Try common.fieldHelp structure as fallback
            const commonHelpKey = `common.fieldHelp.${fieldKey}`;
            translatedHelpText = t(commonHelpKey, { defaultValue: null });
          }
          
          if (translatedHelpText) {
            resolvedLabels[labelKey] = translatedHelpText;
            // Handle aliases - countryOfResidence and residentCountry should share the same help text
            if (fieldKey === 'countryOfResidence' && !resolvedLabels.residentCountryHelp) {
              resolvedLabels.residentCountryHelp = translatedHelpText;
            } else if (fieldKey === 'residentCountry' && !resolvedLabels.countryOfResidenceHelp) {
              resolvedLabels.countryOfResidenceHelp = translatedHelpText;
            }
          }
        }
      });
    }
    
    // Special handling for funds section labels
    if (sectionKey === 'funds') {
      // Resolve funds-specific labels
      const fundsLabels = [
        'introText',
        'addCash',
        'addCreditCard',
        'addBankBalance',
        'addBankCard',
        'addDocument',
        'empty',
        'notProvided',
        'photoAttached',
      ];
      
      fundsLabels.forEach(labelKey => {
        const translationKey = `${destId}.travelInfo.sections.funds.${labelKey}`;
        const translated = t(translationKey, { defaultValue: null });
        if (translated) {
          resolvedLabels[labelKey] = translated;
        }
      });
      
      // Resolve fund types
      const fundTypeKeys = ['cash', 'credit_card', 'bank_card', 'bank_balance', 'document', 'other'];
      if (!resolvedLabels.fundTypes) {
        resolvedLabels.fundTypes = {};
      }
      
      fundTypeKeys.forEach(typeKey => {
        const translationKey = `${destId}.travelInfo.sections.funds.fundTypes.${typeKey}`;
        const translated = t(translationKey, { defaultValue: null });
        if (translated) {
          resolvedLabels.fundTypes[typeKey] = translated;
        }
      });
    }
    
    return resolvedLabels;
  }, [t, config?.destinationId, destinationId]);

  // Memoize passport and userId
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo]);

  const userId = useMemo(() => {
    const candidateIds = [
      typeof routeUserId === 'string' ? routeUserId : null,
      typeof routeUserData?.userId === 'string' ? routeUserData.userId : null,
      typeof routeUser?.id === 'string' ? routeUser.id : null,
      typeof routeUser?.userId === 'string' ? routeUser.userId : null,
      typeof routeEntryInfo?.userId === 'string' ? routeEntryInfo.userId : null,
      typeof routeEntryInfo?.user_id === 'string' ? routeEntryInfo.user_id : null,
      typeof routeTravelInfo?.userId === 'string' ? routeTravelInfo.userId : null,
      typeof routePersonalInfo?.userId === 'string' ? routePersonalInfo.userId : null,
      typeof passport?.userId === 'string' ? passport.userId : null,
      typeof passport?.id === 'string' ? passport.id : null,
      typeof rawPassport?.userId === 'string' ? rawPassport.userId : null,
      typeof rawPassport?.id === 'string' ? rawPassport.id : null,
    ];

    const resolvedId =
      candidateIds.find((value) => value && value.trim().length > 0) || 'user_001';

    if (!resolvedId || resolvedId === 'user_001') {
      console.log('[Template] userId fallback applied:', resolvedId, {
        routeUserId,
        routeUserDataUserId: routeUserData?.userId,
        routeUserIdField: routeUser?.id,
        routeUserUserId: routeUser?.userId,
        entryInfoUserId: routeEntryInfo?.userId ?? routeEntryInfo?.user_id,
        travelInfoUserId: routeTravelInfo?.userId,
        personalInfoUserId: routePersonalInfo?.userId,
        passportId: passport?.id,
        passportUserId: passport?.userId,
        rawPassportId: rawPassport?.id,
        rawPassportUserId: rawPassport?.userId,
      });
    } else {
      console.log('[Template] userId resolved:', resolvedId);
    }

    return resolvedId;
  }, [
    routeUserId,
    routeUserData?.userId,
    routeUser?.id,
    routeUser?.userId,
    routeEntryInfo?.userId,
    routeEntryInfo?.user_id,
    routeTravelInfo?.userId,
    routePersonalInfo?.userId,
    passport?.id,
    passport?.userId,
    rawPassport?.id,
    rawPassport?.userId,
  ]);

  // ============================================
  // LOCATION DATA (from config)
  // ============================================
  // Extract location data directly from config (no dynamic import needed)
  const locationData = useMemo(() => {
    if (config?.sections?.travel?.locationHierarchy) {
      const {
        provincesData,
        getDistrictsFunc,
        getSubDistrictsFunc,
        levels,
      } = config.sections.travel.locationHierarchy;

      return {
        provinces: provincesData || [],
        getDistricts: typeof getDistrictsFunc === 'function' ? getDistrictsFunc : null,
        getSubDistricts: typeof getSubDistrictsFunc === 'function' ? getSubDistrictsFunc : null,
        levels: typeof levels === 'number' ? levels : null,
      };
    }

    return {
      provinces: [],
      getDistricts: null,
      getSubDistricts: null,
      levels: null,
    };
  }, [config?.sections?.travel?.locationHierarchy]);

  // Travel section config (inject location depth if provided in hierarchy)
  const travelSectionConfig = useMemo(() => {
    const section = config?.sections?.travel || {};
    const hierarchyLevels =
      section?.locationHierarchy?.levels ?? locationData.levels;

    if (hierarchyLevels && section.locationDepth !== hierarchyLevels) {
      return { ...section, locationDepth: hierarchyLevels };
    }

    return section;
  }, [config?.sections?.travel, locationData.levels]);

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
    const arrivalFieldNames = ['arrivalDate', 'arrivalArrivalDate'];
    const departureFieldNames = ['departureDate', 'departureDepartureDate'];
    const defaultArrivalDate = getDefaultArrivalDate();
    const defaultDepartureDate = getDefaultDepartureDate(defaultArrivalDate);

    // Build state object from config sections
    if (!config?.sections) {
      console.warn('[Template] config.sections is undefined, skipping form initialization');
      setFormState(initialState);
      return;
    }

    Object.entries(config.sections).forEach(([sectionKey, sectionConfig]) => {
      if (sectionConfig.enabled && sectionConfig.fields) {
        Object.entries(sectionConfig.fields).forEach(([fieldKey, fieldConfig]) => {
          const fieldName = fieldConfig.fieldName;
          const isArrivalField = arrivalFieldNames.includes(fieldName);
          const isDepartureField = departureFieldNames.includes(fieldName);
          initialState[fieldName] = '';

          // Set smart defaults
          if (fieldConfig.smartDefault && !isArrivalField && !isDepartureField) {
            if (fieldConfig.smartDefault === 'tomorrow') {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              initialState[fieldName] = tomorrow.toISOString().split('T')[0];
            } else if (fieldConfig.smartDefault === 'nextWeek') {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              initialState[fieldName] = nextWeek.toISOString().split('T')[0];
            }
          }

          // Set default values
          if (fieldConfig.default !== undefined && !isArrivalField && !isDepartureField) {
            initialState[fieldName] = fieldConfig.default;
          }

          if (isArrivalField) {
            initialState[fieldName] = defaultArrivalDate;
          } else if (isDepartureField) {
            initialState[fieldName] = defaultDepartureDate;
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
      console.log('[Template] Pre-filling from route.params passport:', passport);
      if (passport.surname) {
initialState.surname = passport.surname;
}
      if (passport.middleName) {
initialState.middleName = passport.middleName;
}
      if (passport.givenName) {
initialState.givenName = passport.givenName;
}
      if (passport.passportNumber || passport.passportNo) {
        initialState.passportNo = passport.passportNumber || passport.passportNo;
      }
      if (passport.nationality) {
initialState.nationality = passport.nationality;
}
      if (passport.dateOfBirth || passport.dob) {
        initialState.dob = passport.dateOfBirth || passport.dob;
      }
      if (passport.expiryDate) {
initialState.expiryDate = passport.expiryDate;
}
      if (passport.sex) {
initialState.sex = passport.sex;
}
      if (passport.visaNumber) {
initialState.visaNumber = passport.visaNumber;
}
    }

    // UI state
    initialState.expandedSections = {};
    initialState.errors = {};
    initialState.warnings = {};
    initialState.saveStatus = null;
    initialState.lastEditedAt = null;
    initialState.lastEditedField = null;
    initialState.isLoading = true;
    initialState.travelInfoId = null;

    // Entry info tracking
    initialState.entryInfoId = null;
    initialState.entryInfoInitialized = false;
    initialState.lastEntryInfoUpdate = null;

    // Fund modal state
    initialState.fundItemModalVisible = false;
    initialState.currentFundItem = null;
    initialState.newFundItemType = null;

    // Scroll position state
    initialState.scrollPosition = 0;

    console.log('[Template] Initializing formState with fields:', Object.keys(initialState));
    setFormState(initialState);
  }, [config, passport]);

  // ============================================
  // HOOK: USER INTERACTION TRACKER
  // ============================================
  const userInteractionTracker = useTemplateUserInteractionTracker(
    config.destinationId,
    config
  );

  // Track in-flight entry info creation to prevent duplicate records when
  // multiple ensure calls run in parallel (e.g., StrictMode double renders)
  const entryInfoCreationPromiseRef = useRef(null);

  // ============================================
  // ENTRY INFO MANAGEMENT
  // ============================================
  const ensureEntryInfoRecord = useCallback(async (overrides = {}) => {
    if (!destinationId) {
      console.warn('[Template] Entry info sync skipped: destinationId is missing');
      return null;
    }

    try {
      await UserDataService.initialize(userId);

      const hasPassportOverride = Object.prototype.hasOwnProperty.call(overrides, 'passport');
      const hasPersonalOverride = Object.prototype.hasOwnProperty.call(overrides, 'personalInfo');
      const hasTravelOverride = Object.prototype.hasOwnProperty.call(overrides, 'travelInfo');
      const hasFundsOverride = Object.prototype.hasOwnProperty.call(overrides, 'funds');

      const [
        entryInfos,
        passportRaw,
        personalInfoRaw,
        fundsRaw,
        travelRaw,
      ] = await Promise.all([
        UserDataService.getAllEntryInfosForUser(userId),
        hasPassportOverride ? Promise.resolve(overrides.passport) : UserDataService.getPassport(userId),
        hasPersonalOverride ? Promise.resolve(overrides.personalInfo) : UserDataService.getPersonalInfo(userId),
        hasFundsOverride ? Promise.resolve(overrides.funds) : UserDataService.getFundItems(userId),
        hasTravelOverride ? Promise.resolve(overrides.travelInfo) : UserDataService.getTravelInfo(userId, destinationId),
      ]);

      const normalizeRecord = (record) => {
        if (!record) {
          return record;
        }

        if (typeof record.toJSON === 'function') {
          try {
            return record.toJSON();
          } catch (jsonError) {
            console.warn('[Template] Failed to normalize record via toJSON:', jsonError);
          }
        }

        if (typeof record === 'object') {
          return { ...record };
        }

        return record;
      };

      const passportData = normalizeRecord(passportRaw) || {};
      const personalInfoData = normalizeRecord(personalInfoRaw) || {};
      const travelInfoData = normalizeRecord(travelRaw) || {};
      const fundsData = Array.isArray(fundsRaw)
        ? fundsRaw.map((item) => normalizeRecord(item)).filter(Boolean)
        : [];

      // Filter entries for this destination
      const destinationEntries = (entryInfos || []).filter((info) => info.destinationId === destinationId);
      console.log(`[Template] Found ${destinationEntries.length} entry(ies) for destination ${destinationId}:`, 
        destinationEntries.map(e => ({ id: e.id, created_at: e.createdAt, last_updated_at: e.lastUpdatedAt })));

      let entryInfo = null;
      
      // Strategy 1: Use entryInfoId from formState if it exists and matches an entry
      if (formState.entryInfoId) {
        entryInfo = destinationEntries.find((info) => info.id === formState.entryInfoId);
        if (entryInfo) {
          console.log(`[Template] Using entry from formState.entryInfoId: ${entryInfo.id}`);
        } else {
          console.log(`[Template] formState.entryInfoId (${formState.entryInfoId}) not found in destination entries, will use most recent`);
        }
      }
      
      // Strategy 2: If no match from formState, use the most recent entry (by last_updated_at, then created_at)
      if (!entryInfo && destinationEntries.length > 0) {
        entryInfo = destinationEntries.sort((a, b) => {
          const aTime = new Date(a.lastUpdatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.lastUpdatedAt || b.createdAt || 0).getTime();
          return bTime - aTime; // Most recent first
        })[0];
        console.log(`[Template] Using most recent entry: ${entryInfo.id} (last_updated: ${entryInfo.lastUpdatedAt || entryInfo.createdAt})`);
      }
      
      // Strategy 3: Fallback to first entry (legacy behavior)
      if (!entryInfo && destinationEntries.length > 0) {
        entryInfo = destinationEntries[0];
        console.log(`[Template] Using first entry (fallback): ${entryInfo.id}`);
      }
      
      const timestamp = new Date().toISOString();
      const fundIds = fundsData.map((item) => item.id).filter(Boolean);

      if (!entryInfo) {
        const entryInfoPayload = {
          userId,
          passportId: passportRaw?.id || null,
          personalInfoId: personalInfoRaw?.id || null,
          travelInfoId: travelRaw?.id || null,
          destinationId,
          status: 'incomplete',
          fundItemIds: fundIds,
          lastUpdatedAt: timestamp,
          createdAt: timestamp,
        };

        if (entryInfoCreationPromiseRef.current) {
          console.log('[Template] Awaiting in-flight entry info creation for destination:', destinationId);
          entryInfo = await entryInfoCreationPromiseRef.current;
        } else {
          entryInfoCreationPromiseRef.current = (async () => {
            try {
              return await UserDataService.createEntryInfo(entryInfoPayload);
            } finally {
              entryInfoCreationPromiseRef.current = null;
            }
          })();
          entryInfo = await entryInfoCreationPromiseRef.current;
        }
      } else {
        // Legacy records (or ones created outside the template) might not have userId set.
        // Always align the entry record with the active user to satisfy EntryInfo.save validation.
        if (userId && entryInfo.userId !== userId) {
          entryInfo.userId = userId;
        }

        if (passportRaw?.id && entryInfo.passportId !== passportRaw.id) {
          entryInfo.passportId = passportRaw.id;
        }
        if (personalInfoRaw?.id && entryInfo.personalInfoId !== personalInfoRaw.id) {
          entryInfo.personalInfoId = personalInfoRaw.id;
        }
        if (travelRaw?.id && entryInfo.travelInfoId !== travelRaw.id) {
          entryInfo.travelInfoId = travelRaw.id;
        }
        entryInfo.destinationId = destinationId;
      }

      entryInfo.fundItemIds = Array.from(fundIds);

      entryInfo.updateCompletionMetrics(
        passportData,
        personalInfoData,
        fundsData,
        travelInfoData
      );

      if (['incomplete', 'ready'].includes(entryInfo.status)) {
        entryInfo.status = entryInfo.isReadyForSubmission() ? 'ready' : 'incomplete';
      }

      entryInfo.lastUpdatedAt = timestamp;
      await entryInfo.save({ skipValidation: true });

      updateFormState({
        entryInfoId: entryInfo.id,
        entryInfoInitialized: true,
        lastEntryInfoUpdate: timestamp,
      });

      return entryInfo;
    } catch (error) {
      console.error('[Template] Failed to ensure entry info record:', error);
      updateFormState({ entryInfoInitialized: false });
      return null;
    }
  }, [destinationId, userId, updateFormState]);

  // ============================================
  // DATA LOADING
  // ============================================
  const loadDataFromUserDataService = useCallback(async () => {
    try {
      console.log('[Template] Loading data from UserDataService for user:', userId);
      updateFormState({ isLoading: true });

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

      // Parse fullName into individual name parts
      let surname = '', middleName = '', givenName = '';
      if (passportData?.fullName) {
        const fullName = passportData.fullName.trim();
        // Check for comma-separated format (SURNAME, MIDDLENAME, GIVENNAME or SURNAME, GIVENNAME)
        if (fullName.includes(',')) {
          const parts = fullName.split(',').map(p => p.trim()).filter(Boolean);
          if (parts.length === 3) {
            surname = parts[0];
            middleName = parts[1];
            givenName = parts[2];
          } else if (parts.length === 2) {
            surname = parts[0];
            givenName = parts[1];
          } else if (parts.length === 1) {
            surname = parts[0];
          }
        } else {
          // Space-separated format (SURNAME MIDDLENAME GIVENNAME or SURNAME GIVENNAME)
          const parts = fullName.split(/\s+/).filter(Boolean);
          if (parts.length >= 3) {
            surname = parts[0];
            middleName = parts.slice(1, -1).join(' ');
            givenName = parts[parts.length - 1];
          } else if (parts.length === 2) {
            surname = parts[0];
            givenName = parts[1];
          } else if (parts.length === 1) {
            surname = parts[0];
          }
        }
      }

      // Mark loaded fields as pre-filled
      const loadedData = {
        // Store record IDs (CRITICAL for updates)
        passportId: passportData?.id || null,
        personalInfoId: personalData?.id || null,
        travelInfoId: resolvedTravelData?.id || null,

        // Passport fields
        surname: surname || '',
        middleName: middleName || '',
        givenName: givenName || '',
        passportNo: passportData?.passportNumber || '',
        nationality: passportData?.nationality || '',
        dob: passportData?.dateOfBirth || '',
        expiryDate: passportData?.expiryDate || '',
        sex: passportData?.gender || '', // Map gender to sex
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
        arrivalDate: resolvedTravelData?.arrivalDate || resolvedTravelData?.arrivalArrivalDate || '',
        arrivalArrivalDate: resolvedTravelData?.arrivalArrivalDate || resolvedTravelData?.arrivalDate || '',
        departureFlightNumber: resolvedTravelData?.departureFlightNumber || '',
        departureDate: resolvedTravelData?.departureDate || resolvedTravelData?.departureDepartureDate || '',
        departureDepartureDate: resolvedTravelData?.departureDepartureDate || resolvedTravelData?.departureDate || '',
        isTransitPassenger: resolvedTravelData?.isTransitPassenger || false,
        accommodationType: resolvedTravelData?.accommodationType || '',
        customAccommodationType: resolvedTravelData?.customAccommodationType || '',
        province: resolvedTravelData?.province || '',
        district: resolvedTravelData?.district || '',
        districtId: resolvedTravelData?.districtId || null,
        subDistrict: resolvedTravelData?.subDistrict || '',
        subDistrictId: resolvedTravelData?.subDistrictId || null,
        postalCode: resolvedTravelData?.postalCode || '',
        hotelAddress: resolvedTravelData?.hotelAddress || resolvedTravelData?.accommodationAddress || '',
        // Photo uploads (Thailand-specific)
        flightTicketPhoto: resolvedTravelData?.flightTicketPhoto || '',
        departureFlightTicketPhoto: resolvedTravelData?.departureFlightTicketPhoto || '',
        hotelReservationPhoto: resolvedTravelData?.hotelReservationPhoto || '',
        // Korea-specific fields
        accommodationAddress: resolvedTravelData?.accommodationAddress || resolvedTravelData?.hotelAddress || '',
        accommodationPhone: resolvedTravelData?.accommodationPhone || '',
        ketaNumber: resolvedTravelData?.ketaNumber || '',
        hasKeta: !!resolvedTravelData?.ketaNumber,
      };

      // Mark all loaded fields as pre-filled (not user-modified)
      if (userInteractionTracker.isInitialized) {
        Object.entries(loadedData).forEach(([fieldName, value]) => {
          if (value && !userInteractionTracker.isFieldUserModified(fieldName)) {
            userInteractionTracker.markFieldAsPreFilled(fieldName, value);
          }
        });
      }

      if (!loadedData.arrivalDate) {
        loadedData.arrivalDate = getDefaultArrivalDate();
      }
      if (!loadedData.arrivalArrivalDate) {
        loadedData.arrivalArrivalDate = loadedData.arrivalDate;
      }
      const fallbackDeparture = getDefaultDepartureDate(loadedData.arrivalDate);
      if (!loadedData.departureDate) {
        loadedData.departureDate = fallbackDeparture;
      }
      if (!loadedData.departureDepartureDate) {
        loadedData.departureDepartureDate = loadedData.departureDate || fallbackDeparture;
      }

      updateFormState({ ...loadedData, isLoading: false });

      await ensureEntryInfoRecord({
        passport: passportData,
        personalInfo: personalData,
        travelInfo: resolvedTravelData,
        funds: fundsData,
      });
      console.log('[Template] Data loaded successfully. Fields with data:',
        Object.entries(loadedData).filter(([k, v]) => v && v !== '' && k !== 'funds').map(([k]) => k),
        'Funds count:', loadedData.funds?.length || 0
      );
    } catch (error) {
      console.error('[Template] Error loading data:', error);
      updateFormState({ isLoading: false });
    }
  }, [userId, destinationId, userInteractionTracker.isInitialized, userInteractionTracker.isFieldUserModified, userInteractionTracker.markFieldAsPreFilled, updateFormState, ensureEntryInfoRecord]);

  // Load data when user ID is available and tracker is initialized
  useEffect(() => {
    if (userId && userInteractionTracker.isInitialized) {
      console.log('[Template] Triggering data load - userId:', userId, 'tracker initialized:', userInteractionTracker.isInitialized);
      loadDataFromUserDataService();
    }
  }, [userId, userInteractionTracker.isInitialized]);

  // ============================================
  // DATA SAVING (With Field Filtering)
  // ============================================
  const saveDataToUserDataService = useCallback(async () => {
    try {
      console.log('[Template] Saving data to UserDataService');
      updateFormState({ saveStatus: 'saving' });

      await UserDataService.initialize(userId);

      let savedPassport = null;
      let savedPersonalInfo = null;
      let savedTravelInfo = null;

      // Get always-save fields from config
      const alwaysSaveFields = TemplateFieldStateManager.getAlwaysSaveFieldsFromConfig(config);

      // Filter options
      const filterOptions = {
        alwaysSaveFields,
        preserveExisting: true,
      };

      // Combine name parts into fullName for database
      const nameParts = [formState.surname, formState.middleName, formState.givenName]
        .filter(Boolean)
        .map(part => part.trim())
        .filter(part => part.length > 0);
      const fullName = nameParts.length > 0 ? nameParts.join(', ') : '';

      // Passport fields - filter based on user interaction
      const allPassportFields = {
        id: formState.passportId, // CRITICAL: Pass ID to update existing record
        fullName: fullName, // Combine name parts into fullName
        passportNumber: formState.passportNo,
        nationality: formState.nationality,
        dateOfBirth: formState.dob,
        expiryDate: formState.expiryDate,
        gender: formState.sex, // Map sex to gender
        visaNumber: formState.visaNumber,
      };

      const passportUpdates = TemplateFieldStateManager.filterSaveableFields(
        allPassportFields,
        userInteractionTracker.interactionState,
        filterOptions
      );

      if (Object.keys(passportUpdates).length > 0) {
        const passportResult = await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
        savedPassport = passportResult;
        updateFormState({
          passportId: passportResult?.id || formState.passportId || null,
        });
        console.log('[Template] Saved passport fields:', Object.keys(passportUpdates));
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
        // Use upsert to avoid creating duplicate personal_info rows when progressively saving
        const personalInfoResult = await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
        savedPersonalInfo = personalInfoResult;
        updateFormState({
          personalInfoId: personalInfoResult?.id || formState.personalInfoId || null,
        });
        console.log('[Template] Saved personal info fields:', Object.keys(personalInfoUpdates));
      }

      // Travel info - filter based on user interaction
      const allTravelFields = {
        travelPurpose: formState.travelPurpose,
        customTravelPurpose: formState.customTravelPurpose,
        recentStayCountry: formState.recentStayCountry,
        boardingCountry: formState.boardingCountry,
        arrivalFlightNumber: formState.arrivalFlightNumber,
        arrivalDate: formState.arrivalDate,
        arrivalArrivalDate: formState.arrivalDate,
        departureFlightNumber: formState.departureFlightNumber,
        departureDate: formState.departureDate,
        departureDepartureDate: formState.departureDate,
        isTransitPassenger: formState.isTransitPassenger,
        accommodationType: formState.accommodationType,
        customAccommodationType: formState.customAccommodationType,
        province: formState.province,
        district: formState.district,
        districtId: formState.districtId,
        subDistrict: formState.subDistrict,
        subDistrictId: formState.subDistrictId,
        postalCode: formState.postalCode,
        hotelAddress: formState.hotelAddress,
        // Photo uploads (Thailand-specific)
        flightTicketPhoto: formState.flightTicketPhoto,
        departureFlightTicketPhoto: formState.departureFlightTicketPhoto,
        hotelReservationPhoto: formState.hotelReservationPhoto,
        // Korea-specific fields
        accommodationAddress: formState.accommodationAddress || formState.hotelAddress,
        accommodationPhone: formState.accommodationPhone,
        ketaNumber: formState.ketaNumber,
        hasKeta: formState.hasKeta,
      };

      const travelInfoUpdates = TemplateFieldStateManager.filterSaveableFields(
        allTravelFields,
        userInteractionTracker.interactionState,
        filterOptions
      );

      if (Object.keys(travelInfoUpdates).length > 0) {
        const travelInfoPayload = {
          ...travelInfoUpdates,
          ...(destinationId ? { destination: destinationId } : {}),
        };

        const travelInfoResult = await UserDataService.saveTravelInfo(userId, travelInfoPayload);
        savedTravelInfo = travelInfoResult;
        updateFormState({
          travelInfoId: travelInfoResult?.id || formState.travelInfoId || null,
        });
        console.log('[Template] Saved travel info fields:', Object.keys(travelInfoUpdates));
      }

      const ensureOverrides = {};
      if (savedPassport) {
        ensureOverrides.passport = savedPassport;
      }
      if (savedPersonalInfo) {
        ensureOverrides.personalInfo = savedPersonalInfo;
      }
      if (savedTravelInfo) {
        ensureOverrides.travelInfo = savedTravelInfo;
      }

      await ensureEntryInfoRecord(ensureOverrides);

      updateFormState({
        saveStatus: 'saved',
        lastEditedAt: new Date(),
      });

      // Clear save status after 2 seconds
      setTimeout(() => {
        try {
          updateFormState({ saveStatus: null });
        } catch (error) {
          if (error?.message?.includes('useEntryFlowTemplate')) {
            console.error('[Template] CRITICAL: useEntryFlowTemplate error in setTimeout callback');
            console.error('[Template] Stack trace:', error.stack);
          }
          throw error; // Re-throw to see original error
        }
      }, 2000);

      console.log('[Template] Data saved successfully');
    } catch (error) {
      console.error('[Template] Error saving data:', error);
      // Check if this is the useEntryFlowTemplate error
      if (error?.message?.includes('useEntryFlowTemplate')) {
        console.error('[Template] CRITICAL: useEntryFlowTemplate called outside EntryFlowScreenTemplate context');
        console.error('[Template] Stack trace:', error.stack);
      }
      updateFormState({ saveStatus: 'error' });
    }
  }, [userId, formState, config, userInteractionTracker.interactionState, updateFormState, destinationId, ensureEntryInfoRecord]);

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
  // HOOK: VALIDATION
  // ============================================
  const validation = useTemplateValidation({
    config,
    formState: { ...formState, setErrors: (fn) => updateFormState({ errors: typeof fn === 'function' ? fn(formState.errors) : fn }), setWarnings: (fn) => updateFormState({ warnings: typeof fn === 'function' ? fn(formState.warnings) : fn }), setLastEditedAt: (val) => updateFormState({ lastEditedAt: val }) },
    userInteractionTracker,
    saveDataToUserDataService,
    debouncedSave,
    t,
    destinationId,
  });

  // ============================================
  // HOOK: FUND MANAGEMENT
  // ============================================
  const fundManagement = useTemplateFundManagement({
    config,
    formState,
    setFormState: updateFormState,
    debouncedSave,
    userId,
  });

  // ============================================
  // HOOK: PHOTO MANAGEMENT
  // ============================================
  const photoManagement = useTemplatePhotoManagement({
    config,
    formState,
    updateField,
    debouncedSave,
    t,
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
      subDistrict: '',
      subDistrictId: null,
      postalCode: '',
    });

    if (userInteractionTracker.isInitialized) {
      userInteractionTracker.markFieldAsModified('district', district);
      userInteractionTracker.markFieldAsModified('districtId', districtId);
    }

    debouncedSave();
  }, [userInteractionTracker, debouncedSave, updateFormState]);

  const handleSubDistrictSelect = useCallback((subDistrict, subDistrictId, postalCode) => {
    updateFormState({
      subDistrict,
      subDistrictId,
      postalCode: postalCode || '',
    });

    if (userInteractionTracker.isInitialized) {
      userInteractionTracker.markFieldAsModified('subDistrict', subDistrict);
      userInteractionTracker.markFieldAsModified('subDistrictId', subDistrictId);
      if (postalCode) {
        userInteractionTracker.markFieldAsModified('postalCode', postalCode);
      }
    }

    debouncedSave();
  }, [userInteractionTracker, debouncedSave, updateFormState]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const nextRouteName = useMemo(() => {
    if (!config) {
      return null;
    }

    return (
      config?.navigation?.next ||
      config?.navigation?.nextScreen ||
      config?.screens?.next ||
      config?.screens?.entryFlow ||
      null
    );
  }, [
    config?.navigation?.next,
    config?.navigation?.nextScreen,
    config?.screens?.next,
    config?.screens?.entryFlow,
  ]);

  const handleContinue = useCallback(async () => {
    await saveDataToUserDataService();

    if (nextRouteName) {
      const nextParams = {
        ...(route?.params || {}),
        passport,
        destination,
      };

      navigation.navigate(nextRouteName, nextParams);
    } else {
      console.warn('[Template] No next navigation route configured');
      navigation.goBack();
    }
  }, [
    saveDataToUserDataService,
    navigation,
    nextRouteName,
    passport,
    destination,
    route,
  ]);

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
    handleSubDistrictSelect,
    locationData,
    t,
    navigation,
    route,
    passport,
    destination,
    userId,
    // Template features
    userInteractionTracker,
    validation,
    fundManagement,
    photoManagement,
    entryInfoId: formState.entryInfoId,
    entryInfoInitialized: formState.entryInfoInitialized,
  };

  // ============================================
  // EARLY VALIDATION & RENDER
  // ============================================
  // Early validation - config is required (AFTER hooks)
  if (!config) {
    console.error('[Template] ERROR: config prop is required but not provided');
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
        <BackButton onPress={handleGoBack} label={t('common.back', { defaultValue: 'Back' })} />

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
              labels={resolveSectionLabels('passport', config?.sections?.passport, config?.i18n?.labelSource?.passport || {})}
              config={{
                ...config?.sections?.passport,
                genderOptions: (() => {
                  const sexFieldConfig = config?.sections?.passport?.fields?.sex;
                  if (sexFieldConfig?.options) {
                    // Translate gender options if they have labelKey
                    return sexFieldConfig.options.map(option => {
                      if (option.labelKey) {
                        return {
                          ...option,
                          label: t(option.labelKey, { defaultValue: option.label || option.value })
                        };
                      }
                      return option;
                    });
                  }
                  // Default fallback
                  return [
                    { label: t('common.gender.male', { defaultValue: 'Male' }), value: 'M' },
                    { label: t('common.gender.female', { defaultValue: 'Female' }), value: 'F' },
                  ];
                })(),
              }}
            />
          )}

          {/* Personal Info Section */}
          {config?.sections?.personal?.enabled && (() => {
            // Compute cityOfResidence labels based on country (China vs others)
            const isChineseResidence = formState.countryOfResidence === 'CHN' || formState.residentCountry === 'CHN';
            
            // Get destId (same logic as in resolveSectionLabels)
            const destId = config?.destinationId || destinationId || 'hongkong';
            
            // Get base labels from resolveSectionLabels
            const baseLabels = resolveSectionLabels('personal', config?.sections?.personal, config?.i18n?.labelSource?.personal || {});
            
            // Resolve cityOfResidence labels with proper destId and ensure strings
            const cityOfResidenceLabelKey = isChineseResidence
              ? `${destId}.travelInfo.fields.cityOfResidence.label.china`
              : `${destId}.travelInfo.fields.cityOfResidence.label`;
            const cityOfResidenceHelpKey = isChineseResidence
              ? `${destId}.travelInfo.fields.cityOfResidence.help.china`
              : `${destId}.travelInfo.fields.cityOfResidence.help`;
            const cityOfResidencePlaceholderKey = isChineseResidence
              ? `${destId}.travelInfo.fields.cityOfResidence.placeholder.china`
              : `${destId}.travelInfo.fields.cityOfResidence.placeholder`;
            
            // Get translations and ensure they are strings (not objects)
            const getTranslationString = (key, defaultValue) => {
              const translation = t(key, { defaultValue });
              // If translation is an object, return the defaultValue or key
              if (typeof translation === 'object' && translation !== null) {
                return defaultValue || key;
              }
              return typeof translation === 'string' ? translation : (defaultValue || key);
            };
            
            const cityOfResidenceLabel = getTranslationString(
              cityOfResidenceLabelKey,
              isChineseResidence ? '居住省份' : '居住城市'
            );
            const cityOfResidenceHelpText = getTranslationString(
              cityOfResidenceHelpKey,
              'City where you currently live'
            );
            const cityOfResidencePlaceholder = getTranslationString(
              cityOfResidencePlaceholderKey,
              isChineseResidence ? 'e.g., Anhui, Guangdong' : 'e.g., Anhui, Shanghai'
            );
            
            // Merge cityOfResidence labels into base labels
            const mergedLabels = {
              ...baseLabels,
              cityOfResidence: cityOfResidenceLabel,
              cityOfResidenceHelp: cityOfResidenceHelpText,
              cityOfResidencePlaceholder,
            };

            return (
              <PersonalInfoSection
                isExpanded={formState.expandedSections.personal}
                onToggle={() => toggleSection('personal')}
                fieldCount={validation.getFieldCount('personal')}
                occupation={formState.occupation}
                customOccupation={formState.customOccupation}
                cityOfResidence={formState.cityOfResidence}
                residentCountry={formState.countryOfResidence || formState.residentCountry}
                phoneCode={formState.phoneCode}
                phoneNumber={formState.phoneNumber}
                email={formState.email}
                setOccupation={(v) => updateField('occupation', v)}
                setCustomOccupation={(v) => updateField('customOccupation', v)}
                setCityOfResidence={(v) => updateField('cityOfResidence', v)}
                setResidentCountry={(v) => {
                  updateField('countryOfResidence', v);
                  updateField('residentCountry', v);
                }}
                setPhoneCode={(v) => updateField('phoneCode', v)}
                setPhoneNumber={(v) => updateField('phoneNumber', v)}
                setEmail={(v) => updateField('email', v)}
                errors={formState.errors}
                warnings={formState.warnings}
                handleFieldBlur={validation.handleFieldBlur}
                debouncedSaveData={debouncedSave}
                saveDataToSecureStorageWithOverride={async (overrideData) => {
                  // Temporarily update form state with override data, save, then restore
                  const previousState = { ...formState };
                  updateFormState(overrideData);
                  try {
                    await saveDataToUserDataService();
                  } finally {
                    // Restore previous state after save
                    updateFormState(previousState);
                  }
                }}
                setLastEditedAt={(val) => updateFormState({ lastEditedAt: val })}
                t={t}
                labels={mergedLabels}
                config={config?.sections?.personal || {}}
              />
            );
          })()}

          {/* Funds Section */}
          {config?.sections?.funds?.enabled && (
            <FundsSection
              isExpanded={formState.expandedSections.funds}
              onToggle={() => toggleSection('funds')}
              fieldCount={validation.getFieldCount('funds')}
              funds={formState.funds || []}
              setFunds={(v) => updateField('funds', v)}
              addFund={fundManagement.addFund}
              handleFundItemPress={fundManagement.handleFundItemPress}
              debouncedSaveData={debouncedSave}
              labels={resolveSectionLabels('funds', config?.sections?.funds, config?.i18n?.labelSource?.funds || {})}
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
              arrivalDate={formState.arrivalDate}
              flightTicketPhoto={formState.flightTicketPhoto}
              departureFlightNumber={formState.departureFlightNumber}
              departureDate={formState.departureDate}
              departureFlightTicketPhoto={formState.departureFlightTicketPhoto}
              isTransitPassenger={formState.isTransitPassenger}
              accommodationType={formState.accommodationType}
              customAccommodationType={formState.customAccommodationType}
              province={formState.province}
              district={formState.district}
              districtId={formState.districtId}
              subDistrict={formState.subDistrict}
              subDistrictId={formState.subDistrictId}
              postalCode={formState.postalCode}
              hotelAddress={formState.hotelAddress}
              hotelReservationPhoto={formState.hotelReservationPhoto}
              setTravelPurpose={(v) => updateField('travelPurpose', v)}
              setCustomTravelPurpose={(v) => updateField('customTravelPurpose', v)}
              setRecentStayCountry={(v) => updateField('recentStayCountry', v)}
              setBoardingCountry={(v) => updateField('boardingCountry', v)}
              setArrivalFlightNumber={(v) => updateField('arrivalFlightNumber', v)}
              setArrivalDate={(v) => updateField('arrivalDate', v)}
              setFlightTicketPhoto={(v) => updateField('flightTicketPhoto', v)}
              setDepartureFlightNumber={(v) => updateField('departureFlightNumber', v)}
              setDepartureDate={(v) => updateField('departureDate', v)}
              setDepartureFlightTicketPhoto={(v) => updateField('departureFlightTicketPhoto', v)}
              setIsTransitPassenger={(v) => updateField('isTransitPassenger', v)}
              setAccommodationType={(v) => updateField('accommodationType', v)}
              setCustomAccommodationType={(v) => updateField('customAccommodationType', v)}
              setProvince={(v) => updateField('province', v)}
              setDistrict={(v) => updateField('district', v)}
              setDistrictId={(v) => updateField('districtId', v)}
              setSubDistrict={(v) => updateField('subDistrict', v)}
              setSubDistrictId={(v) => updateField('subDistrictId', v)}
              setPostalCode={(v) => updateField('postalCode', v)}
              setHotelAddress={(v) => updateField('hotelAddress', v)}
              setHotelReservationPhoto={(v) => updateField('hotelReservationPhoto', v)}
              handleProvinceSelect={handleProvinceSelect}
              handleDistrictSelect={handleDistrictSelect}
              handleSubDistrictSelect={handleSubDistrictSelect}
              getProvinceData={locationData.provinces}
              getDistrictData={locationData.getDistricts}
              getSubDistrictData={locationData.getSubDistricts}
              handleFlightTicketPhotoUpload={config?.sections?.travel?.photoUploads?.flightTicket?.enabled ? photoManagement.handleFlightTicketPhotoUpload : undefined}
              handleDepartureFlightTicketPhotoUpload={config?.sections?.travel?.photoUploads?.departureTicket?.enabled ? photoManagement.handleDepartureFlightTicketPhotoUpload : undefined}
              handleHotelReservationPhotoUpload={config?.sections?.travel?.photoUploads?.hotelReservation?.enabled ? photoManagement.handleHotelReservationPhotoUpload : undefined}
              errors={formState.errors}
              warnings={formState.warnings}
              handleFieldBlur={validation.handleFieldBlur}
              debouncedSaveData={debouncedSave}
              labels={resolveSectionLabels('travel', config?.sections?.travel, config?.i18n?.labelSource?.travel || {})}
              config={{
                ...travelSectionConfig,
                accommodationOptions: (() => {
                  // Get accommodation options from multiple possible sources
                  let options = travelSectionConfig?.accommodationOptions 
                    || config?.sections?.travel?.accommodationOptions 
                    || config?.sections?.travel?.fields?.accommodationType?.options
                    || [];
                  
                  // If still no options, use default accommodation types
                  if (!options || options.length === 0) {
                    const destId = config?.destinationId || destinationId || 'hongkong';
                    // Default accommodation types that most destinations use
                    const defaultTypes = ['HOTEL', 'HOSTEL', 'AIRBNB', 'FRIEND_FAMILY', 'OTHER'];
                    options = defaultTypes.map(value => ({
                      value,
                      label: t(`${destId}.travelInfo.accommodationTypes.${value}`, { 
                        defaultValue: value.replace(/_/g, ' ')
                      }),
                      defaultLabel: value.replace(/_/g, ' ')
                    }));
                  }
                  
                  // Translate accommodation options
                  return options.map(option => {
                    if (option.labelKey) {
                      // If option has a labelKey, translate it
                      const translatedLabel = t(option.labelKey, { defaultValue: option.defaultLabel || option.label || option.value });
                      return { ...option, label: translatedLabel };
                    } else if (option.label) {
                      // Try to resolve from accommodationTypes i18n structure
                      const accommodationTypeKey = `${config?.destinationId || destinationId || 'hongkong'}.travelInfo.accommodationTypes.${option.value}`;
                      const translatedLabel = t(accommodationTypeKey, { defaultValue: option.label });
                      return { ...option, label: translatedLabel };
                    } else if (option.value) {
                      // If only value is provided, try to translate it
                      const accommodationTypeKey = `${config?.destinationId || destinationId || 'hongkong'}.travelInfo.accommodationTypes.${option.value}`;
                      const translatedLabel = t(accommodationTypeKey, { defaultValue: option.defaultLabel || option.value.replace(/_/g, ' ') });
                      return { ...option, label: translatedLabel };
                    }
                    return option;
                  });
                })(),
              }}
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
        {(() => {
          const isCreateMode = !formState.currentFundItem && !!formState.newFundItemType;
          console.log('[Template] Fund Modal Render Check:', {
            fundItemModalVisible: formState.fundItemModalVisible,
            hasCurrentFundItem: !!formState.currentFundItem,
            newFundItemType: formState.newFundItemType,
            isCreateMode,
            willRender: formState.fundItemModalVisible,
          });
          
          return formState.fundItemModalVisible ? (
            <FundItemDetailModal
              visible={formState.fundItemModalVisible}
              fundItem={formState.currentFundItem}
              isCreateMode={isCreateMode}
              createItemType={formState.newFundItemType}
              onClose={fundManagement.handleFundItemModalClose}
              onUpdate={fundManagement.handleFundItemUpdate}
              onCreate={fundManagement.handleFundItemCreate}
              onDelete={fundManagement.handleFundItemDelete}
            />
          ) : null;
        })()}
      </SafeAreaView>
    </EnhancedTemplateContext.Provider>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Rich Hero Section (Thailand-style)
const RichHeroSection = ({ config }) => {
  const { t } = useLocale();
  if (!config?.hero || config.hero.type !== 'rich') {
    return null;
  }
  
  // Use i18n keys if available, fallback to direct text
  const title = config.hero.titleKey 
    ? t(config.hero.titleKey, { defaultValue: config.hero.defaultTitle || config.hero.title })
    : config.hero.title;
  const subtitle = config.hero.subtitleKey
    ? t(config.hero.subtitleKey, { defaultValue: config.hero.defaultSubtitle || config.hero.subtitle })
    : config.hero.subtitle;
  const beginnerTipText = config.hero.beginnerTip?.textKey
    ? t(config.hero.beginnerTip.textKey, { defaultValue: config.hero.beginnerTip.defaultText || config.hero.beginnerTip.text })
    : config.hero.beginnerTip?.text;

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
            {title}
          </TamaguiText>
          <TamaguiText fontSize={13} color="#E8F0FF" textAlign="center">
            {subtitle}
          </TamaguiText>

          {/* Value Propositions */}
          <XStack justifyContent="space-around" width="100%" marginVertical="$sm" paddingVertical="$xs">
            {config.hero.valuePropositions.map((vp, idx) => {
              // Support both textKey (i18n) and text (direct) properties
              const text = vp.textKey
                ? t(vp.textKey, { defaultValue: vp.defaultText || vp.text || '' })
                : (vp.text || vp.defaultText || '');
              return (
                <YStack key={idx} alignItems="center" flex={1}>
                  <TamaguiText fontSize={24} marginBottom={4}>{vp.icon}</TamaguiText>
                  <TamaguiText fontSize={11} fontWeight="600" color="white" textAlign="center">
                    {text}
                  </TamaguiText>
                </YStack>
              );
            })}
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
              {beginnerTipText}
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
    pending: { 
      icon: '⏳', 
      color: '#FFF9E6', 
      text: t('common.saving.pending', { defaultValue: '等待保存...' })
    },
    saving: { 
      icon: '💾', 
      color: '#E6F2FF', 
      text: t('common.saving.saving', { defaultValue: '正在保存...' })
    },
    saved: { 
      icon: '✅', 
      color: '#E6F9E6', 
      text: t('common.saving.saved', { defaultValue: '已保存' })
    },
    error: { 
      icon: '❌', 
      color: '#FFE6E6', 
      text: t('common.saving.error', { defaultValue: '保存失败' })
    },
  };

  const config = statusConfig[status];
  if (!config) {
    return null;
  }

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
const LastEditedTimestamp = ({ time }) => {
  if (!time) {
    return null;
  }

  const { language } = useLocale();
  return (
    <TamaguiText fontSize="$1" color="$textSecondary" textAlign="center" marginBottom="$sm">
      {language && language.startsWith('zh') ? '最后编辑：' : 'Last edited: '} {time.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
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
            {t('common.privacy.localStorage', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </TamaguiText>
        </XStack>
      </BaseCard>
    </YStack>
  );
};

// Smart Submit Button
const SmartButton = ({ config, validation, onPress }) => {
  const buttonConfig = validation.getSmartButtonConfig();
  
  // Label is already translated by the validation hook
  const label = buttonConfig.label;

  return (
    <BaseButton
      variant={buttonConfig.variant}
      size="lg"
      onPress={onPress}
      fullWidth
    >
      {`${buttonConfig.icon} ${label}`}
    </BaseButton>
  );
};

EnhancedTravelInfoTemplate.propTypes = {
  config: PropTypes.shape({
    country: PropTypes.string.isRequired,
    fields: PropTypes.object,
    validation: PropTypes.object,
    colors: PropTypes.shape({
      background: PropTypes.string,
      primary: PropTypes.string,
    }),
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      passport: PropTypes.object,
      destination: PropTypes.string,
    }),
  }).isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }).isRequired,
  children: PropTypes.node,
};

// Export
export default EnhancedTravelInfoTemplate;
export { EnhancedTemplateContext, useEnhancedTemplate };
