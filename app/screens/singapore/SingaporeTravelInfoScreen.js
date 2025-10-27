// 入境通 - Singapore Travel Info Screen (新加坡入境信息)
// Refactored to align with Malaysia's modular travel info architecture
import React, { useEffect, useMemo } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  Platform,
  UIManager,
  Alert,
  Text,
} from 'react-native';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import FundItemDetailModal from '../../components/FundItemDetailModal';

import { useLocale } from '../../i18n/LocaleContext';
import { useTravelInfoForm } from '../../utils/TravelInfoFormUtils';
import DebouncedSave from '../../utils/DebouncedSave';
import UserDataService from '../../services/data/UserDataService';

import {
  useSingaporeFormState,
  useSingaporeDataPersistence,
  useSingaporeValidation,
} from '../../hooks/singapore';

import {
  HeroSection,
  PassportSection,
  PersonalInfoSection,
  TravelDetailsSection,
  FundsSection,
} from '../../components/singapore/sections';

import { styles } from './SingaporeTravelInfoScreen.styles';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const SingaporeTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  // Memoized passport + user id
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // Shared travel info utilities
  const travelInfoForm = useTravelInfoForm('singapore');

  // Screen state & services
  const formState = useSingaporeFormState(passport);
  const persistence = useSingaporeDataPersistence({
    passport,
    destination,
    userId,
    formState,
    travelInfoForm,
    navigation,
  });
  const validation = useSingaporeValidation({
    formState,
    travelInfoForm,
    saveDataToSecureStorage: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData,
  });

  const {
    handleFieldBlur,
    handleFieldChange,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  } = validation;

  const {
    loadData,
    refreshFundItems,
    normalizeFundItem,
    saveSessionState,
    scrollViewRef,
    shouldRestoreScrollPosition,
  } = persistence;

  // ===== Effects ============================================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Destructure stable setters and values for useEffect
  const { setCompletionMetrics, setTotalCompletionPercent } = formState;
  const {
    passportNo, visaNumber, fullName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, boardingCountry,
    arrivalFlightNumber, arrivalArrivalDate, departureFlightNumber, departureDepartureDate,
    isTransitPassenger, accommodationType, customAccommodationType,
    province, district, subDistrict, postalCode, hotelAddress, funds
  } = formState;

  useEffect(() => {
    const metrics = calculateCompletionMetrics();
    setCompletionMetrics(metrics?.metrics || null);
    setTotalCompletionPercent(metrics?.totalPercent || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    passportNo, visaNumber, fullName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, boardingCountry,
    arrivalFlightNumber, arrivalArrivalDate, departureFlightNumber, departureDepartureDate,
    isTransitPassenger, accommodationType, customAccommodationType,
    province, district, subDistrict, postalCode, hotelAddress, funds,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('singapore_travel_info');
      // Only update if status actually changed to prevent infinite loops
      formState.setSaveStatus(prevStatus => {
        if (prevStatus !== currentStatus) {
          return currentStatus;
        }
        return prevStatus;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [formState.setSaveStatus]);

  useEffect(() => {
    if (shouldRestoreScrollPosition.current && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: formState.scrollPosition || 0,
        animated: false,
      });
      shouldRestoreScrollPosition.current = false;
    }
  }, [shouldRestoreScrollPosition, scrollViewRef, formState.scrollPosition]);

  useEffect(() => {
    return () => {
      saveSessionState();
    };
  }, [saveSessionState]);

  // ===== Fund helpers =======================================================

  const resetFundModalState = () => {
    formState.setFundItemModalVisible(false);
    formState.setSelectedFundItem(null);
    formState.setCurrentFundItem(null);
    formState.setNewFundItemType(null);
    formState.setIsCreatingFundItem(false);
  };

  const addFund = (type) => {
    const newFund = {
      id: `fund_${Date.now()}`,
      type,
      amount: '',
      currency: 'SGD',
      details: '',
    };

    formState.setCurrentFundItem(newFund);
    formState.setNewFundItemType(type);
    formState.setIsCreatingFundItem(true);
    formState.setFundItemModalVisible(true);
  };

  const editFund = (fund) => {
    if (!fund) return;
    formState.setSelectedFundItem(fund);
    formState.setCurrentFundItem(fund);
    formState.setIsCreatingFundItem(false);
    formState.setFundItemModalVisible(true);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      if (updatedItem) {
        const normalized = normalizeFundItem(updatedItem);
        formState.setFunds((prev) => {
          const exists = prev.some((item) => item.id === normalized.id);
          if (exists) {
            return prev.map((item) => (item.id === normalized.id ? normalized : item));
          }
          return [...prev, normalized];
        });
      }
      await refreshFundItems({ forceRefresh: true });
      resetFundModalState();
    } catch (error) {
      console.error('Failed to update fund item:', error);
      Alert.alert(
        t('singapore.travelInfo.errors.fundUpdateTitle', { defaultValue: '保存失败' }),
        t('singapore.travelInfo.errors.fundUpdateMessage', { defaultValue: '更新资金信息时出现问题，请稍后再试。' })
      );
    }
  };

  const handleFundItemCreate = async (createdItem) => {
    try {
      if (createdItem) {
        const normalized = normalizeFundItem(createdItem);
        formState.setFunds((prev) => [...prev, normalized]);
      }
      await refreshFundItems({ forceRefresh: true });
    } catch (error) {
      console.error('Failed to refresh funds after creation:', error);
    } finally {
      resetFundModalState();
    }
  };

  const handleFundItemDelete = async (id) => {
    try {
      formState.setFunds((prev) => prev.filter((fund) => fund.id !== id));
      await refreshFundItems({ forceRefresh: true });
    } catch (error) {
      console.error('Failed to refresh funds after deletion:', error);
    } finally {
      resetFundModalState();
    }
  };

  // ===== Navigation helpers =================================================

  const handleNavigationWithSave = async (action, actionName) => {
    try {
      formState.setSaveStatus('saving');
      await DebouncedSave.flushPendingSave('singapore_travel_info');
      action();
    } catch (error) {
      console.error(`Failed to save data before ${actionName}:`, error);
      formState.setSaveStatus('error');

      Alert.alert(
        t('singapore.travelInfo.saveError.title', { defaultValue: '保存失败' }),
        t('singapore.travelInfo.saveError.message', { defaultValue: '数据保存遇到问题，是否继续操作？' }),
        [
          {
            text: t('singapore.travelInfo.saveError.retry', { defaultValue: '重试' }),
            onPress: () => handleNavigationWithSave(action, actionName),
          },
          {
            text: t('singapore.travelInfo.saveError.continue', { defaultValue: '继续' }),
            onPress: action,
          },
          {
            text: t('common.cancel', { defaultValue: '取消' }),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleContinue = () => {
    handleNavigationWithSave(
      () => navigation.navigate('SingaporeEntryFlow', { passport, destination }),
      'continue'
    );
  };

  const handleGoBack = () => {
    handleNavigationWithSave(() => navigation.goBack(), 'go back');
  };

  // ===== Derived UI state ===================================================

  const progressText = getProgressText();
  const progressColor = getProgressColor();
  const smartButtonConfig =
    getSmartButtonConfig() || {
      label: t('singapore.travelInfo.actions.continue', { defaultValue: '继续前往下一步' }),
      variant: 'primary',
    };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back', { defaultValue: '返回' })}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          {t('singapore.travelInfo.headerTitle', { defaultValue: 'Singapore Entry Info' })}
        </Text>
        <View style={styles.headerRight}>
          {formState.saveStatus && (
            <View
              style={[
                styles.saveStatus,
                formState.saveStatus === 'saved' && styles.saveStatusSuccess,
                formState.saveStatus === 'error' && styles.saveStatusError,
              ]}
            >
              {formState.saveStatus === 'saving' && '💾'}
              {formState.saveStatus === 'saved' && '✅'}
              {formState.saveStatus === 'error' && '❌'}
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={(event) => formState.setScrollPosition(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <HeroSection
          t={t}
          completionMetrics={formState.completionMetrics}
          totalCompletionPercent={formState.totalCompletionPercent}
          progressText={progressText}
          progressColor={progressColor}
          styles={styles}
        />

        <PassportSection
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={() =>
            formState.setExpandedSection(formState.expandedSection === 'passport' ? null : 'passport')
          }
          fieldCount={getFieldCount('passport')}
          passportNo={formState.passportNo}
          visaNumber={formState.visaNumber}
          fullName={formState.fullName}
          nationality={formState.nationality}
          dob={formState.dob}
          expiryDate={formState.expiryDate}
          sex={formState.sex}
          setPassportNo={formState.setPassportNo}
          setVisaNumber={formState.setVisaNumber}
          setFullName={formState.setFullName}
          setNationality={formState.setNationality}
          setDob={formState.setDob}
          setExpiryDate={formState.setExpiryDate}
          setSex={formState.setSex}
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldChange={handleFieldChange}
          handleUserInteraction={handleUserInteraction}
          handleFieldBlur={handleFieldBlur}
          t={t}
          styles={styles}
        />

        <PersonalInfoSection
          isExpanded={formState.expandedSection === 'personal'}
          onToggle={() =>
            formState.setExpandedSection(formState.expandedSection === 'personal' ? null : 'personal')
          }
          fieldCount={getFieldCount('personal')}
          occupation={formState.occupation}
          cityOfResidence={formState.cityOfResidence}
          residentCountry={formState.residentCountry}
          phoneCode={formState.phoneCode}
          phoneNumber={formState.phoneNumber}
          email={formState.email}
          setOccupation={formState.setOccupation}
          setCityOfResidence={formState.setCityOfResidence}
          setResidentCountry={formState.setResidentCountry}
          setPhoneCode={formState.setPhoneCode}
          setPhoneNumber={formState.setPhoneNumber}
          setEmail={formState.setEmail}
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldChange={handleFieldChange}
          handleFieldBlur={handleFieldBlur}
          t={t}
          styles={styles}
        />

        <TravelDetailsSection
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={() =>
            formState.setExpandedSection(formState.expandedSection === 'travel' ? null : 'travel')
          }
          fieldCount={getFieldCount('travel')}
          travelPurpose={formState.travelPurpose}
          customTravelPurpose={formState.customTravelPurpose}
          boardingCountry={formState.boardingCountry}
          arrivalFlightNumber={formState.arrivalFlightNumber}
          arrivalArrivalDate={formState.arrivalArrivalDate}
          departureFlightNumber={formState.departureFlightNumber}
          departureDepartureDate={formState.departureDepartureDate}
          isTransitPassenger={formState.isTransitPassenger}
          accommodationType={formState.accommodationType}
          customAccommodationType={formState.customAccommodationType}
          province={formState.province}
          district={formState.district}
          subDistrict={formState.subDistrict}
          postalCode={formState.postalCode}
          hotelAddress={formState.hotelAddress}
          setTravelPurpose={formState.setTravelPurpose}
          setCustomTravelPurpose={formState.setCustomTravelPurpose}
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
          setSubDistrict={formState.setSubDistrict}
          setPostalCode={formState.setPostalCode}
          setHotelAddress={formState.setHotelAddress}
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldChange={handleFieldChange}
          handleFieldBlur={handleFieldBlur}
          handleUserInteraction={handleUserInteraction}
          t={t}
          styles={styles}
        />

        <FundsSection
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={() =>
            formState.setExpandedSection(formState.expandedSection === 'funds' ? null : 'funds')
          }
          fieldCount={getFieldCount('funds')}
          funds={formState.funds}
          onAddFund={addFund}
          onFundItemPress={editFund}
          t={t}
          styles={styles}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={smartButtonConfig.label}
            onPress={handleContinue}
            variant={smartButtonConfig.variant || 'primary'}
            style={styles.continueButton}
          />
        </View>
      </ScrollView>

      <FundItemDetailModal
        visible={formState.fundItemModalVisible}
        fundItem={formState.isCreatingFundItem ? formState.currentFundItem : formState.selectedFundItem}
        isCreateMode={formState.isCreatingFundItem}
        createItemType={formState.newFundItemType}
        onClose={resetFundModalState}
        onUpdate={handleFundItemUpdate}
        onCreate={handleFundItemCreate}
        onDelete={handleFundItemDelete}
      />
    </SafeAreaView>
  );
};

export default SingaporeTravelInfoScreen;
