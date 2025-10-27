
// 入境通 - Thailand Travel Info Screen (泰国入境信息)
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
import { NationalitySelector, PassportNameInput, DateTimeInput, ProvinceSelector, DistrictSelector, SubDistrictSelector } from '../../components';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import { findChinaProvince } from '../../utils/validation/chinaProvinceValidator';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import SuggestionProviders from '../../utils/SuggestionProviders';
import FieldStateManager from '../../utils/FieldStateManager';
import { getDistrictsByProvince, getSubDistrictsByDistrictId } from '../../data/thailandLocations';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import EntryInfo from '../../models/EntryInfo';
import UserDataService from '../../services/data/UserDataService';

// Import Thailand-specific utilities
import { validateField } from '../../utils/thailand/ThailandValidationRules';
import { FieldWarningIcon, InputWithValidation, CollapsibleSection } from '../../components/thailand/ThailandTravelComponents';
import { parsePassportName } from '../../utils/NameParser';
import { normalizeLocationValue, findDistrictOption, findSubDistrictOption } from '../../utils/thailand/LocationHelpers';
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES, OCCUPATION_OPTIONS } from './constants';
import OptionSelector from '../../components/thailand/OptionSelector';

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
import ProgressOverviewCard from '../../components/thailand/ProgressOverviewCard';

// Import styles
import styles from './ThailandTravelInfoScreen.styles';

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
    getSmartButtonConfig,
    getProgressText,
    getProgressColor
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
    handleFieldBlur
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

  // Destructure stable setters and values for useEffect
  const { setCompletionMetrics, setTotalCompletionPercent } = formState;
  const {
    passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneNumber, email, phoneCode,
    funds, travelPurpose, customTravelPurpose, arrivalArrivalDate, departureDepartureDate,
    arrivalFlightNumber, departureFlightNumber, recentStayCountry, boardingCountry,
    hotelAddress, accommodationType, customAccommodationType, province, district,
    subDistrict, postalCode, isTransitPassenger
  } = formState;

  // Load saved data on component mount - delegated to persistence hook
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate completion metrics whenever form data changes
  useEffect(() => {
    const metrics = calculateCompletionMetrics();
    setCompletionMetrics(metrics);
    setTotalCompletionPercent(metrics?.percent || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneNumber, email, phoneCode,
    funds, travelPurpose, customTravelPurpose, arrivalArrivalDate, departureDepartureDate,
    arrivalFlightNumber, departureFlightNumber, recentStayCountry, boardingCountry,
    hotelAddress, accommodationType, customAccommodationType, province, district,
    subDistrict, postalCode, isTransitPassenger,
  ]);








  // Photo upload handler wrappers (to pass t parameter)
  const wrappedHandleFlightTicketPhotoUpload = () => handleFlightTicketPhotoUpload(t);
  const wrappedHandleHotelReservationPhotoUpload = () => handleHotelReservationPhotoUpload(t);


  const validate = () => {
    // Disable all required checks to support progressive entry info filling
    formState.setErrors({});
    return true;
  };

  const handleContinue = async () => {
    await handleNavigationWithSave(
      () => navigation.navigate('ThailandEntryFlow', {
        passport,
        destination,
        entryInfoId: entryInfoId // Pass entryInfoId for viewing entry pack details
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

  



  const renderGenderOptions = () => {
    const options = [
      { value: 'Female', label: t('thailand.travelInfo.fields.sex.options.female', { defaultValue: '女性' }) },
      { value: 'Male', label: t('thailand.travelInfo.fields.sex.options.male', { defaultValue: '男性' }) },
      { value: 'Undefined', label: t('thailand.travelInfo.fields.sex.options.undefined', { defaultValue: '未定义' }) }
    ];

    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isActive = formState.sex === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                isActive && styles.optionButtonActive,
              ]}
              onPress={async () => {
                const newSex = option.value;
                formState.setSex(newSex);
                // Save immediately to ensure gender is saved without requiring other field interaction
                try {
                  await saveDataToSecureStorageWithOverride({ sex: newSex });
                  formState.setLastEditedAt(new Date());
                } catch (error) {
                  console.error('Failed to save gender:', error);
                }
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
        <Text style={styles.headerTitle}>{t('thailand.travelInfo.headerTitle', { defaultValue: '泰国入境信息' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {formState.isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('thailand.travelInfo.loading', { defaultValue: '正在加载数据...' })}</Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={(event) => {
          const currentScrollPosition = event.nativeEvent.contentOffset.y;
          formState.setScrollPosition(currentScrollPosition);
        }}
        scrollEventThrottle={100}
      >
        {/* Hero Section */}
        <HeroSection t={t} />

        {/* Progress Overview Card */}
        <ProgressOverviewCard
          totalCompletionPercent={formState.totalCompletionPercent}
          styles={styles}
        />
          
          {/* Enhanced Save Status Indicator */}
          {formState.saveStatus && (
            <View style={[styles.saveStatusBar, styles[`saveStatus${formState.saveStatus.charAt(0).toUpperCase() + formState.saveStatus.slice(1)}`]]}>
              <Text style={styles.saveStatusIcon}>
                {formState.saveStatus === 'pending' && '⏳'}
                {formState.saveStatus === 'saving' && '💾'}
                {formState.saveStatus === 'saved' && '✅'}
                {formState.saveStatus === 'error' && '❌'}
              </Text>
              <Text style={styles.saveStatusText}>
                {formState.saveStatus === 'pending' && t('thailand.travelInfo.saveStatus.pending', { defaultValue: '等待保存...' })}
                {formState.saveStatus === 'saving' && t('thailand.travelInfo.saveStatus.saving', { defaultValue: '正在保存...' })}
                {formState.saveStatus === 'saved' && t('thailand.travelInfo.saveStatus.saved', { defaultValue: '已保存' })}
                {formState.saveStatus === 'error' && t('thailand.travelInfo.saveStatus.error', { defaultValue: '保存失败' })}
              </Text>
              {formState.saveStatus === 'error' && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    formState.setSaveStatus('saving');
                    debouncedSaveData();
                  }}
                >
                  <Text style={styles.retryButtonText}>
                    {t('thailand.travelInfo.saveStatus.retry', { defaultValue: '重试' })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {/* Last Edited Timestamp */}
          {formState.lastEditedAt && (
            <Text style={styles.lastEditedText}>
              {t('thailand.travelInfo.lastEdited', {
                defaultValue: 'Last edited: {{time}}',
                time: formState.lastEditedAt.toLocaleTimeString()
              })}
            </Text>
          )}

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('thailand.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        {/* Passport Information Section */}
        <PassportSection
          t={t}
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'passport' ? null : 'passport')}
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
          // Styles
          styles={styles}
        />

        {/* Personal Information Section */}
        <PersonalInfoSection
          t={t}
          isExpanded={formState.expandedSection === 'personal'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'personal' ? null : 'personal')}
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
          // Styles
          styles={styles}
        />

        {/* Funds Section */}
        <FundsSection
          t={t}
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
          // Form state
          funds={formState.funds}
          // Actions
          addFund={addFund}
          handleFundItemPress={handleFundItemPress}
          // Styles
          styles={styles}
        />

        {/* Travel Details Section */}
        <TravelDetailsSection
          t={t}
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'travel' ? null : 'travel')}
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
          handleHotelReservationPhotoUpload={wrappedHandleHotelReservationPhotoUpload}
          // Styles
          styles={styles}
        />


        <View style={styles.buttonContainer}>
          {/* Enhanced Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarEnhanced}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${formState.totalCompletionPercent}%`,
                      backgroundColor: getProgressColor()
                    }
                  ]}
                />
                {/* Completion Badge */}
                {formState.totalCompletionPercent >= 100 && (
                  <View style={styles.completionBadge}>
                    <Text style={styles.completionBadgeText}>泰国准备就绪！🌴</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={[styles.progressText, { color: getProgressColor() }]}>
              {getProgressText()}
            </Text>
          </View>

          {/* Smart Button with Dynamic Configuration */}
          {(() => {
            const buttonConfig = getSmartButtonConfig();
            return (
              <Button
                title={`${buttonConfig.icon} ${buttonConfig.label}`}
                onPress={handleContinue}
                variant={buttonConfig.variant}
                disabled={false}
                style={buttonConfig.style}
              />
            );
          })()}
          
          {/* Encouraging Progress Messages */}
          {formState.totalCompletionPercent < 100 && (
            <Text style={styles.encouragingHint}>
              {formState.totalCompletionPercent < 20
                ? '🌟 第一步，从介绍自己开始吧！'
                : formState.totalCompletionPercent < 40
                ? '好的开始！泰国欢迎你 🌺'
                : formState.totalCompletionPercent < 60
                ? '继续我的泰国准备之旅 🏖️'
                : '🚀 快要完成了，你的泰国之旅近在咫尺！'
              }
            </Text>
          )}

          {/* Travel-Focused Next Steps */}
          {formState.totalCompletionPercent < 100 && (
            <Text style={styles.nextStepHint}>
              {formState.totalCompletionPercent < 25
                ? '💡 从护照信息开始，告诉泰国你是谁'
                : formState.totalCompletionPercent < 50
                ? '👤 填写个人信息，让泰国更了解你'
                : formState.totalCompletionPercent < 75
                ? '💰 展示你的资金证明，泰国想确保你玩得开心'
                : formState.totalCompletionPercent < 100
                ? '✈️ 最后一步，分享你的旅行计划吧！'
                : ''
              }
            </Text>
          )}

          {/* Cultural Tips for Border Crossing Beginners */}
          {formState.totalCompletionPercent >= 80 && (
            <View style={styles.culturalTipsCard}>
              <Text style={styles.culturalTipsTitle}>🧡 通关小贴士</Text>
              <Text style={styles.culturalTipsText}>
                • 海关官员可能会问你来泰国的目的，保持微笑礼貌回答{'\n'}
                • 准备好返程机票证明你不会逾期停留{'\n'}
                • 保持冷静，海关检查是正常程序{'\n'}
                • 如果听不懂，可以礼貌地说"Can you speak English?"
              </Text>
            </View>
          )}


        </View>
      </ScrollView>

      <FundItemDetailModal
        visible={formState.fundItemModalVisible}
        fundItem={formState.currentFundItem}
        createItemType={formState.newFundItemType}
        onClose={handleFundItemModalClose}
        onUpdate={handleFundItemUpdate}
        onCreate={handleFundItemCreate}
        onDelete={handleFundItemDelete}
      />
    </SafeAreaView>
  );
};


export default ThailandTravelInfoScreen;
