
// 入境通 - Thailand Travel Info Screen (泰国入境信息)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import Input from '../../components/Input';
import InputWithUserTracking from '../../components/InputWithUserTracking';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import GenderSelector from '../../components/GenderSelector';
import { NationalitySelector, PassportNameInput, DateTimeInput, ProvinceSelector, DistrictSelector, SubDistrictSelector } from '../../components';

import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import { findChinaProvince } from '../../utils/validation/chinaProvinceValidator';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import SuggestionProviders from '../../utils/SuggestionProviders';
import FieldStateManager from '../../utils/FieldStateManager';
import { getLocationLoaders } from '../../utils/locationDataLoader';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../../services/data/UserDataService';

// Import Thailand-specific utilities
import { validateField } from '../../utils/thailand/ThailandValidationRules';
import { FieldWarningIcon, InputWithValidation } from '../../components/thailand/ThailandTravelComponents';
import { parsePassportName } from '../../utils/NameParser';
import { normalizeLocationValue, findDistrictOption, findSubDistrictOption } from '../../utils/thailand/LocationHelpers';
import { GENDER_OPTIONS } from './constants';
import OptionSelector from '../../components/thailand/OptionSelector';
import ErrorHandler, { ErrorType, ErrorSeverity } from '../../utils/ErrorHandler';

// Import custom hooks for state, persistence, and validation
import {
  useThailandFormState,
  useThailandDataPersistence,
  useThailandValidation,
  useThailandLocationCascade,
  useThailandFundManagement
} from '../../hooks/thailand';

// Import section components
import {
  HeroSection,
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection
} from '../../components/thailand/sections';

// Import Tamagui shared components
import {
  YStack,
  XStack,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../../components/tamagui';

const ThailandTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();
  
  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);
  
  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // Initialize form state hook - consolidates all 57 useState declarations
  const formState = useThailandFormState(passport);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('thailand_travel_info');

  // Load location data for Thailand
  const { provinces: thailandProvinces, getDistricts, getSubDistricts } = useMemo(
    () => getLocationLoaders('th'),
    []
  );

  // Initialize persistence hook - handles data loading and saving
  const persistence = useThailandDataPersistence({
    passport,
    destination,
    userId,
    formState,
    userInteractionTracker,
    navigation
  });

  // Initialize validation hook - handles field validation and completion tracking
  const validation = useThailandValidation({
    formState,
    userInteractionTracker,
    saveDataToSecureStorageWithOverride: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData
  });

  // Extract commonly used functions from hooks for easier access
  const {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig
  } = validation;

  const {
    loadData,
    saveDataToSecureStorage: saveDataToSecureStorageWithOverride,
    debouncedSaveData,
    refreshFundItems,
    initializeEntryInfo,
    saveSessionState,
    loadSessionState,
    migrateExistingDataToInteractionState,
    savePhoto,
    handleFlightTicketPhotoUpload,
    handleDepartureFlightTicketPhotoUpload,
    handleHotelReservationPhotoUpload,
    handleNavigationWithSave,
    scrollViewRef,
    shouldRestoreScrollPosition
  } = persistence;

  // Initialize location cascade hook
  const {
    handleProvinceSelect,
    handleDistrictSelect,
    handleSubDistrictSelect
  } = useThailandLocationCascade({
    formState,
    handleFieldBlur,
    saveDataToSecureStorage: persistence.saveDataToSecureStorage
  });

  // Initialize fund management hook
  const {
    addFund,
    handleFundItemPress,
    handleFundItemModalClose,
    handleFundItemUpdate,
    handleFundItemCreate,
    handleFundItemDelete
  } = useThailandFundManagement({
    formState,
    refreshFundItems,
    debouncedSaveData
  });

  // Load saved data on component mount - delegated to persistence hook
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Note: Completion metrics calculation is now handled automatically
  // by the useThailandValidation hook to prevent excessive re-renders
  // from 20+ dependencies. See useThailandValidation.js:359-381








  // Photo upload handler wrappers (to pass t parameter)
  const wrappedHandleFlightTicketPhotoUpload = () => handleFlightTicketPhotoUpload(t);
  const wrappedHandleDepartureFlightTicketPhotoUpload = () => handleDepartureFlightTicketPhotoUpload(t);
  const wrappedHandleHotelReservationPhotoUpload = () => handleHotelReservationPhotoUpload(t);

  const handleContinue = async () => {
    await handleNavigationWithSave(
      () => navigation.navigate('ThailandEntryFlow', {
        passport,
        destination
      }),
      'continue'
    );
  };

  const handleGoBack = async () => {
    await handleNavigationWithSave(
      () => navigation.goBack(),
      'go back'
    );
  };

  



  const handleGenderChange = async (newSex) => {
    formState.setSex(newSex);
    // Save immediately to ensure gender is saved without requiring other field interaction
    try {
      await saveDataToSecureStorageWithOverride({ sex: newSex });
      formState.setLastEditedAt(new Date());
    } catch (error) {
      ErrorHandler.handleDataSaveError(error, 'ThailandTravelInfoScreen.handleGenderChange', {
        severity: ErrorSeverity.WARNING,
        customMessage: '保存性别信息失败，请重试。',
        onRetry: () => handleGenderChange(newSex),
      });
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <XStack
        paddingHorizontal="$md"
        paddingVertical="$sm"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton
          onPress={handleGoBack}
          label={t('common.back')}
        />
        <TamaguiText fontSize="$5" fontWeight="600" color="$textPrimary" flex={1} textAlign="center">
          {t('thailand.travelInfo.headerTitle', { defaultValue: '泰国入境信息' })}
        </TamaguiText>
        <YStack width={60} />
      </XStack>

      {formState.isLoading && (
        <YStack padding="$md" alignItems="center">
          <TamaguiText fontSize="$3" color="$textSecondary">
            {t('thailand.travelInfo.loading', { defaultValue: '正在加载数据...' })}
          </TamaguiText>
        </YStack>
      )}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={(event) => {
          const currentScrollPosition = event.nativeEvent.contentOffset.y;
          formState.setScrollPosition(currentScrollPosition);
        }}
        scrollEventThrottle={100}
      >
        {/* Hero Section */}
        <HeroSection t={t} />


        {/* Enhanced Save Status Indicator */}
        {formState.saveStatus && (
          <XStack
            paddingHorizontal="$md"
            paddingVertical="$sm"
            alignItems="center"
            gap="$sm"
            backgroundColor={
              formState.saveStatus === 'pending' ? '#FFF9E6' :
              formState.saveStatus === 'saving' ? '#E6F2FF' :
              formState.saveStatus === 'saved' ? '#E6F9E6' :
              '#FFE6E6'
            }
            marginHorizontal="$md"
            marginVertical="$sm"
            borderRadius="$md"
          >
            <TamaguiText fontSize={16}>
              {formState.saveStatus === 'pending' && '⏳'}
              {formState.saveStatus === 'saving' && '💾'}
              {formState.saveStatus === 'saved' && '✅'}
              {formState.saveStatus === 'error' && '❌'}
            </TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary" flex={1}>
              {formState.saveStatus === 'pending' && t('thailand.travelInfo.saveStatus.pending', { defaultValue: '等待保存...' })}
              {formState.saveStatus === 'saving' && t('thailand.travelInfo.saveStatus.saving', { defaultValue: '正在保存...' })}
              {formState.saveStatus === 'saved' && t('thailand.travelInfo.saveStatus.saved', { defaultValue: '已保存' })}
              {formState.saveStatus === 'error' && t('thailand.travelInfo.saveStatus.error', { defaultValue: '保存失败' })}
            </TamaguiText>
            {formState.saveStatus === 'error' && (
              <BaseButton
                variant="outline"
                size="sm"
                onPress={() => {
                  formState.setSaveStatus('saving');
                  debouncedSaveData();
                }}
              >
                {t('thailand.travelInfo.saveStatus.retry', { defaultValue: '重试' })}
              </BaseButton>
            )}
          </XStack>
        )}

        {/* Last Edited Timestamp */}
        {formState.lastEditedAt && (
          <TamaguiText fontSize="$1" color="$textSecondary" textAlign="center" marginBottom="$sm">
            {t('thailand.travelInfo.lastEdited', {
              defaultValue: 'Last edited: {{time}}',
              time: formState.lastEditedAt.toLocaleTimeString()
            })}
          </TamaguiText>
        )}

        {/* Privacy Notice - Using Tamagui BaseCard */}
        <YStack paddingHorizontal="$md" marginBottom="$md">
          <BaseCard variant="flat" padding="md">
            <XStack gap="$sm" alignItems="center">
              <TamaguiText fontSize={20}>💾</TamaguiText>
              <TamaguiText fontSize="$2" color="$textSecondary" flex={1}>
                {t('thailand.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
              </TamaguiText>
            </XStack>
          </BaseCard>
        </YStack>

        {/* Passport Information Section */}
        <PassportSection
          t={t}
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={(expanded) => {
            const willExpand = typeof expanded === 'boolean'
              ? expanded
              : formState.expandedSection !== 'passport';
            console.log('[ThailandTravelInfoScreen] PassportSection toggle', {
              received: expanded,
              current: formState.expandedSection,
              willExpand,
            });
            formState.setExpandedSection(willExpand ? 'passport' : null);
          }}
          fieldCount={getFieldCount('passport')}
          // Form state
          surname={formState.surname}
          middleName={formState.middleName}
          givenName={formState.givenName}
          nationality={formState.nationality}
          passportNo={formState.passportNo}
          visaNumber={formState.visaNumber}
          dob={formState.dob}
          expiryDate={formState.expiryDate}
          sex={formState.sex}
          // Setters
          setSurname={formState.setSurname}
          setMiddleName={formState.setMiddleName}
          setGivenName={formState.setGivenName}
          setNationality={formState.setNationality}
          setPassportNo={formState.setPassportNo}
          setVisaNumber={formState.setVisaNumber}
          setDob={formState.setDob}
          setExpiryDate={formState.setExpiryDate}
          setSex={formState.setSex}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
          setLastEditedAt={formState.setLastEditedAt}
        />

        {/* Personal Information Section */}
        <PersonalInfoSection
          t={t}
          isExpanded={formState.expandedSection === 'personal'}
          onToggle={(expanded) => {
            const willExpand = typeof expanded === 'boolean'
              ? expanded
              : formState.expandedSection !== 'personal';
            console.log('[ThailandTravelInfoScreen] PersonalInfoSection toggle', {
              received: expanded,
              current: formState.expandedSection,
              willExpand,
            });
            formState.setExpandedSection(willExpand ? 'personal' : null);
          }}
          fieldCount={getFieldCount('personal')}
          // Form state
          occupation={formState.occupation}
          customOccupation={formState.customOccupation}
          cityOfResidence={formState.cityOfResidence}
          residentCountry={formState.residentCountry}
          phoneCode={formState.phoneCode}
          phoneNumber={formState.phoneNumber}
          email={formState.email}
          // Computed values
          cityOfResidenceLabel={formState.residentCountry === 'CHN' ? '省份' : '居住城市'}
          cityOfResidenceHelpText={formState.residentCountry === 'CHN' ? '请选择您居住的省份' : '请输入您居住的城市'}
          cityOfResidencePlaceholder={formState.residentCountry === 'CHN' ? '例如：BEIJING, SHANGHAI' : '例如：NEW YORK, LONDON'}
          // Setters
          setOccupation={formState.setOccupation}
          setCustomOccupation={formState.setCustomOccupation}
          setCityOfResidence={formState.setCityOfResidence}
          setResidentCountry={formState.setResidentCountry}
          setPhoneCode={formState.setPhoneCode}
          setPhoneNumber={formState.setPhoneNumber}
          setEmail={formState.setEmail}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
          setLastEditedAt={formState.setLastEditedAt}
        />

        {/* Funds Section */}
        <FundsSection
          t={t}
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={(expanded) => {
            const willExpand = typeof expanded === 'boolean'
              ? expanded
              : formState.expandedSection !== 'funds';
            console.log('[ThailandTravelInfoScreen] FundsSection toggle', {
              received: expanded,
              current: formState.expandedSection,
              willExpand,
            });
            formState.setExpandedSection(willExpand ? 'funds' : null);
          }}
          fieldCount={getFieldCount('funds')}
          // Form state
          funds={formState.funds}
          // Actions
          addFund={addFund}
          handleFundItemPress={handleFundItemPress}
        />

        {/* Travel Details Section */}
        <TravelDetailsSection
          t={t}
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={(expanded) => {
            const willExpand = typeof expanded === 'boolean'
              ? expanded
              : formState.expandedSection !== 'travel';
            console.log('[ThailandTravelInfoScreen] TravelDetailsSection toggle', {
              received: expanded,
              current: formState.expandedSection,
              willExpand,
            });
            formState.setExpandedSection(willExpand ? 'travel' : null);
          }}
          fieldCount={getFieldCount('travel')}
          // Form state - Travel purpose
          travelPurpose={formState.travelPurpose}
          customTravelPurpose={formState.customTravelPurpose}
          recentStayCountry={formState.recentStayCountry}
          boardingCountry={formState.boardingCountry}
          // Form state - Arrival
          arrivalFlightNumber={formState.arrivalFlightNumber}
          arrivalArrivalDate={formState.arrivalArrivalDate}
          flightTicketPhoto={formState.flightTicketPhoto}
          // Form state - Departure
          departureFlightNumber={formState.departureFlightNumber}
          departureDepartureDate={formState.departureDepartureDate}
          departureFlightTicketPhoto={formState.departureFlightTicketPhoto}
          // Form state - Accommodation
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
          // Setters
          setTravelPurpose={formState.setTravelPurpose}
          setCustomTravelPurpose={formState.setCustomTravelPurpose}
          setRecentStayCountry={formState.setRecentStayCountry}
          setBoardingCountry={formState.setBoardingCountry}
          setArrivalFlightNumber={formState.setArrivalFlightNumber}
          setArrivalArrivalDate={formState.setArrivalArrivalDate}
          setDepartureFlightNumber={formState.setDepartureFlightNumber}
          setDepartureDepartureDate={formState.setDepartureDepartureDate}
          setIsTransitPassenger={formState.setIsTransitPassenger}
          setAccommodationType={formState.setAccommodationType}
          setCustomAccommodationType={formState.setCustomAccommodationType}
          setProvince={formState.setProvince}
          setDistrict={formState.setDistrict}
          setDistrictId={formState.setDistrictId}
          setSubDistrict={formState.setSubDistrict}
          setSubDistrictId={formState.setSubDistrictId}
          setPostalCode={formState.setPostalCode}
          setHotelAddress={formState.setHotelAddress}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
          setLastEditedAt={formState.setLastEditedAt}
          handleProvinceSelect={handleProvinceSelect}
          handleDistrictSelect={handleDistrictSelect}
          handleSubDistrictSelect={handleSubDistrictSelect}
          handleFlightTicketPhotoUpload={wrappedHandleFlightTicketPhotoUpload}
          handleDepartureFlightTicketPhotoUpload={wrappedHandleDepartureFlightTicketPhotoUpload}
          handleHotelReservationPhotoUpload={wrappedHandleHotelReservationPhotoUpload}
          // Location data loaders
          regionsData={thailandProvinces}
          getDistrictsFunc={getDistricts}
          getSubDistrictsFunc={getSubDistricts}
        />


        <YStack paddingHorizontal="$md" paddingVertical="$lg">
          {/* Smart Button with Dynamic Configuration */}
          {(() => {
            const buttonConfig = getSmartButtonConfig();
            return (
              <BaseButton
                variant={buttonConfig.variant === 'primary' ? 'primary' : 'secondary'}
                size="lg"
                onPress={handleContinue}
                fullWidth
              >
                {`${buttonConfig.icon} ${buttonConfig.label}`}
              </BaseButton>
            );
          })()}
        </YStack>
      </ScrollView>

      {formState.fundItemModalVisible && (
        <FundItemDetailModal
          visible={formState.fundItemModalVisible}
          fundItem={formState.currentFundItem}
          isCreateMode={!formState.currentFundItem && !!formState.newFundItemType}
          createItemType={formState.newFundItemType}
          onClose={handleFundItemModalClose}
          onUpdate={handleFundItemUpdate}
          onCreate={handleFundItemCreate}
          onDelete={handleFundItemDelete}
        />
      )}
    </SafeAreaView>
  );
};


export default ThailandTravelInfoScreen;
