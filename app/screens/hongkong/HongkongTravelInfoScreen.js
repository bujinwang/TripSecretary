// 入境通 - Hong Kong Travel Info Screen (香港入境信息)
// Refactored to align with the modular Malaysia/Singapore travel info architecture
import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  Platform,
  UIManager,
  Alert,
  Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import FundItemDetailModal from '../../components/FundItemDetailModal';

import { useLocale } from '../../i18n/LocaleContext';
import DebouncedSave from '../../utils/DebouncedSave';
import UserDataService from '../../services/data/UserDataService';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import { findDistrictOption, findSubDistrictOption } from '../../utils/thailand/LocationHelpers';

import {
  useHongKongFormState,
  useHongKongDataPersistence,
  useHongKongValidation,
} from '../../hooks/hongkong';

import {
  HeroSection,
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../../components/hongkong/sections';

import { styles } from './HongKongTravelInfoScreen.styles';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const HongKongTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  const userInteractionTracker = useUserInteractionTracker('hongkong_travel_info');

  const formState = useHongKongFormState(passport);
  const persistence = useHongKongDataPersistence({
    passport,
    destination,
    userId,
    formState,
    userInteractionTracker,
    navigation,
  });

  const {
    loadData,
    refreshFundItems,
    normalizeFundItem,
    initializeEntryInfo,
    saveSessionState,
    loadSessionState,
    savePhoto,
    scrollViewRef,
    shouldRestoreScrollPosition,
    debouncedSaveData,
    saveDataToSecureStorage,
  } = persistence;

  const validation = useHongKongValidation({
    formState,
    userInteractionTracker,
    saveDataToSecureStorageWithOverride: saveDataToSecureStorage,
    debouncedSaveData,
  });

  const {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  } = validation;

  // Data loading + initialization
  useEffect(() => {
    loadData();
    loadSessionState();
  }, [loadData, loadSessionState]);

  useEffect(() => {
    if (!formState.isLoading && !formState.entryInfoInitialized) {
      initializeEntryInfo();
    }
  }, [formState.isLoading, formState.entryInfoInitialized, initializeEntryInfo]);

  // Destructure stable setters and values for useEffect
  const { setCompletionMetrics, setTotalCompletionPercent } = formState;
  const {
    passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneNumber, email, phoneCode,
    travelPurpose, customTravelPurpose, arrivalArrivalDate, departureDepartureDate,
    arrivalFlightNumber, departureFlightNumber, recentStayCountry, boardingCountry,
    hotelAddress, accommodationType, customAccommodationType, province, district,
    subDistrict, postalCode, isTransitPassenger, funds, visaNumber
  } = formState;

  // Completion metrics
  useEffect(() => {
    const metrics = calculateCompletionMetrics();
    setCompletionMetrics(metrics);
    setTotalCompletionPercent(metrics?.percent || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    passportNo, surname, middleName, givenName, nationality, dob, expiryDate, sex,
    occupation, cityOfResidence, residentCountry, phoneNumber, email, phoneCode,
    travelPurpose, customTravelPurpose, arrivalArrivalDate, departureDepartureDate,
    arrivalFlightNumber, departureFlightNumber, recentStayCountry, boardingCountry,
    hotelAddress, accommodationType, customAccommodationType, province, district,
    subDistrict, postalCode, isTransitPassenger, funds, visaNumber,
  ]);

  // Session persistence
  useEffect(() => {
    return () => {
      saveSessionState();
    };
  }, [saveSessionState]);

  // Restore scroll position after load
  useEffect(() => {
    if (shouldRestoreScrollPosition.current && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: formState.scrollPosition || 0,
        animated: false,
      });
      shouldRestoreScrollPosition.current = false;
    }
  }, [shouldRestoreScrollPosition, scrollViewRef, formState.scrollPosition]);

  // Residence helpers
  const isChineseResidence = formState.residentCountry === 'CHN';
  const cityOfResidenceLabel = isChineseResidence ? '居住省份' : '居住省份 / 城市';
  const cityOfResidenceHelpText = isChineseResidence
    ? '中国地址请填写所在省份（请使用英文，例如 Anhui）'
    : '请输入您居住的省份或城市 (请使用英文)';
  const cityOfResidencePlaceholder = isChineseResidence
    ? '例如 Anhui, Guangdong'
    : '例如 Anhui, Shanghai';

  useEffect(() => {
    if (!formState.residentCountry) return;
    handleFieldBlur('cityOfResidence', formState.cityOfResidence);
  }, [formState.residentCountry, formState.cityOfResidence, handleFieldBlur]);

  // Location cascade
  useEffect(() => {
    if (!formState.province || !formState.district) {
      if (formState.districtId !== null) {
        formState.setDistrictId(null);
      }
      return;
    }

    const match = findDistrictOption(formState.province, formState.district);
    if (match && match.id !== formState.districtId) {
      formState.setDistrictId(match.id);
    }
  }, [formState.province, formState.district, formState.districtId]);

  useEffect(() => {
    if (!formState.districtId || !formState.subDistrict) {
      if (formState.subDistrictId !== null) {
        formState.setSubDistrictId(null);
      }
      return;
    }

    const match = findSubDistrictOption(formState.districtId, formState.subDistrict);
    if (match && match.id !== formState.subDistrictId) {
      formState.setSubDistrictId(match.id);
      if (!formState.postalCode && match.postalCode) {
        formState.setPostalCode(String(match.postalCode));
      }
    }
  }, [formState.districtId, formState.subDistrict, formState.subDistrictId, formState.postalCode]);

  // Location handlers
  const resetDistrictSelection = useCallback(() => {
    formState.setDistrict('');
    formState.setDistrictId(null);
    formState.setSubDistrict('');
    formState.setSubDistrictId(null);
    formState.setPostalCode('');
  }, [formState]);

  const handleProvinceSelect = useCallback(
    (value) => {
      formState.setProvince(value);
      resetDistrictSelection();
      handleFieldBlur('province', value);
    },
    [formState, resetDistrictSelection, handleFieldBlur]
  );

  const handleDistrictSelect = useCallback(
    (selection) => {
      if (!selection) return;
      formState.setDistrict(selection.nameEn);
      formState.setDistrictId(selection.id);
      handleFieldBlur('district', selection.nameEn);

      formState.setSubDistrict('');
      formState.setSubDistrictId(null);
      formState.setPostalCode('');
      handleFieldBlur('subDistrict', '');
      handleFieldBlur('postalCode', '');
    },
    [formState, handleFieldBlur]
  );

  const handleSubDistrictSelect = useCallback(
    (selection) => {
      if (!selection) return;
      formState.setSubDistrict(selection.nameEn);
      formState.setSubDistrictId(selection.id);
      handleFieldBlur('subDistrict', selection.nameEn);

      const postal = selection.postalCode ? String(selection.postalCode) : '';
      formState.setPostalCode(postal);
      handleFieldBlur('postalCode', postal);
    },
    [formState, handleFieldBlur]
  );

  // Photo handlers
  const handleFlightTicketPhotoUpload = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const saveResult = await savePhoto('flightTicket', uri);
        if (saveResult.success) {
          Alert.alert(
            t('hongkong.travelInfo.uploadSuccess', { defaultValue: '上传成功' }),
            t('hongkong.travelInfo.flightTicketUploaded', { defaultValue: '机票照片已上传' })
          );
        } else {
          throw new Error('save_failed');
        }
      }
    } catch (error) {
      console.error('Flight ticket photo upload failed:', error);
      Alert.alert(
        t('hongkong.travelInfo.uploadError', { defaultValue: '上传失败' }),
        t('hongkong.travelInfo.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
      );
    }
  }, [savePhoto, t]);

  const handleHotelReservationPhotoUpload = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const saveResult = await savePhoto('hotelReservation', uri);
        if (saveResult.success) {
          Alert.alert(
            t('hongkong.travelInfo.uploadSuccess', { defaultValue: '上传成功' }),
            t('hongkong.travelInfo.hotelReservationUploaded', { defaultValue: '酒店预订照片已上传' })
          );
        } else {
          throw new Error('save_failed');
        }
      }
    } catch (error) {
      console.error('Hotel reservation photo upload failed:', error);
      Alert.alert(
        t('hongkong.travelInfo.uploadError', { defaultValue: '上传失败' }),
        t('hongkong.travelInfo.uploadErrorMessage', { defaultValue: '保存失败，请重试' })
      );
    }
  }, [savePhoto, t]);

  // Fund helpers
  const closeFundModal = useCallback(() => {
    formState.setFundItemModalVisible(false);
    formState.setCurrentFundItem(null);
    formState.setNewFundItemType(null);
  }, [formState]);

  const addFund = useCallback(
    (type) => {
      formState.setCurrentFundItem(null);
      formState.setNewFundItemType(type);
      formState.setFundItemModalVisible(true);
    },
    [formState]
  );

  const editFund = useCallback(
    (fund) => {
      formState.setCurrentFundItem(fund);
      formState.setFundItemModalVisible(true);
    },
    [formState]
  );

  const handleFundItemUpdate = useCallback(
    async (updatedItem) => {
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
        closeFundModal();
      } catch (error) {
        console.error('Failed to update fund item:', error);
      }
    },
    [normalizeFundItem, formState, refreshFundItems, closeFundModal]
  );

  const handleFundItemCreate = useCallback(
    async (createdItem) => {
      try {
        if (createdItem) {
          const normalized = normalizeFundItem(createdItem);
          formState.setFunds((prev) => [...prev, normalized]);
        }
        await refreshFundItems({ forceRefresh: true });
      } catch (error) {
        console.error('Failed to refresh fund items after creation:', error);
      } finally {
        closeFundModal();
      }
    },
    [normalizeFundItem, formState, refreshFundItems, closeFundModal]
  );

  const handleFundItemDelete = useCallback(
    async (id) => {
      try {
        formState.setFunds((prev) => prev.filter((fund) => fund.id !== id));
        await refreshFundItems({ forceRefresh: true });
      } catch (error) {
        console.error('Failed to refresh fund items after deletion:', error);
      } finally {
        closeFundModal();
      }
    },
    [formState, refreshFundItems, closeFundModal]
  );

  // Navigation helpers
  const handleNavigationWithSave = useCallback(
    async (navigationAction, actionName = 'navigate') => {
      try {
        formState.setSaveStatus('saving');
        await DebouncedSave.flushPendingSave('hongkong_travel_info');
        navigationAction();
      } catch (error) {
        console.error(`Failed to save data before ${actionName}:`, error);
        formState.setSaveStatus('error');

        Alert.alert(
          t('hongkong.travelInfo.saveError.title', { defaultValue: '保存失败' }),
          t('hongkong.travelInfo.saveError.message', { defaultValue: '数据保存遇到问题，是否继续？' }),
          [
            {
              text: t('hongkong.travelInfo.saveError.retry', { defaultValue: '重试' }),
              onPress: () => handleNavigationWithSave(navigationAction, actionName),
            },
            {
              text: t('hongkong.travelInfo.saveError.continue', { defaultValue: '继续' }),
              onPress: navigationAction,
            },
            {
              text: t('common.cancel', { defaultValue: '取消' }),
              style: 'cancel',
            },
          ]
        );
      }
    },
    [formState, t]
  );

  const handleContinue = useCallback(() => {
    handleNavigationWithSave(
      () =>
        navigation.navigate('HongKongEntryFlow', {
          passport,
          destination,
          entryInfoId: formState.entryInfoId,
        }),
      'continue'
    );
  }, [handleNavigationWithSave, navigation, passport, destination, formState.entryInfoId]);

  const handleGoBack = useCallback(() => {
    handleNavigationWithSave(() => navigation.goBack(), 'go back');
  }, [handleNavigationWithSave, navigation]);

  // Derived UI helpers
  const progressText = getProgressText();
  const progressColor = getProgressColor();
  const smartButtonConfig =
    getSmartButtonConfig() || {
      label: t('hongkong.travelInfo.actions.continue', { defaultValue: '继续前往下一步' }),
      variant: 'primary',
    };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back', { defaultValue: '返回' })}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          {t('hongkong.travelInfo.headerTitle', { defaultValue: '香港入境信息' })}
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

      {formState.isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {t('hongkong.travelInfo.loading', { defaultValue: '正在加载数据…' })}
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          onScroll={(event) => formState.setScrollPosition(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          <HeroSection t={t} />

          <PassportSection
            t={t}
            isExpanded={formState.expandedSection === 'passport'}
            onToggle={() =>
              formState.setExpandedSection(
                formState.expandedSection === 'passport' ? null : 'passport'
              )
            }
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
            setSurname={formState.setSurname}
            setMiddleName={formState.setMiddleName}
            setGivenName={formState.setGivenName}
            setNationality={formState.setNationality}
            setPassportNo={formState.setPassportNo}
            setVisaNumber={formState.setVisaNumber}
            setDob={formState.setDob}
            setExpiryDate={formState.setExpiryDate}
            setSex={formState.setSex}
            errors={formState.errors}
            warnings={formState.warnings}
            handleFieldBlur={handleFieldBlur}
            lastEditedField={formState.lastEditedField}
            debouncedSaveData={debouncedSaveData}
            saveDataToSecureStorageWithOverride={saveDataToSecureStorage}
            setLastEditedAt={formState.setLastEditedAt}
          />

          <PersonalInfoSection
            t={t}
            isExpanded={formState.expandedSection === 'personal'}
            onToggle={() =>
              formState.setExpandedSection(
                formState.expandedSection === 'personal' ? null : 'personal'
              )
            }
            fieldCount={getFieldCount('personal')}
            occupation={formState.occupation}
            customOccupation={formState.customOccupation}
            cityOfResidence={formState.cityOfResidence}
            residentCountry={formState.residentCountry}
            phoneCode={formState.phoneCode}
            phoneNumber={formState.phoneNumber}
            email={formState.email}
            cityOfResidenceLabel={cityOfResidenceLabel}
            cityOfResidenceHelpText={cityOfResidenceHelpText}
            cityOfResidencePlaceholder={cityOfResidencePlaceholder}
            setOccupation={formState.setOccupation}
            setCustomOccupation={formState.setCustomOccupation}
            setCityOfResidence={formState.setCityOfResidence}
            setResidentCountry={formState.setResidentCountry}
            setPhoneCode={formState.setPhoneCode}
            setPhoneNumber={formState.setPhoneNumber}
            setEmail={formState.setEmail}
            errors={formState.errors}
            warnings={formState.warnings}
            handleFieldBlur={handleFieldBlur}
            lastEditedField={formState.lastEditedField}
            debouncedSaveData={debouncedSaveData}
          />

          <FundsSection
            t={t}
            isExpanded={formState.expandedSection === 'funds'}
            onToggle={() =>
              formState.setExpandedSection(formState.expandedSection === 'funds' ? null : 'funds')
            }
            fieldCount={getFieldCount('funds')}
            funds={formState.funds}
            addFund={addFund}
            handleFundItemPress={editFund}
          />

          <TravelDetailsSection
            t={t}
            isExpanded={formState.expandedSection === 'travel'}
            onToggle={() =>
              formState.setExpandedSection(
                formState.expandedSection === 'travel' ? null : 'travel'
              )
            }
            fieldCount={getFieldCount('travel')}
            travelPurpose={formState.travelPurpose}
            customTravelPurpose={formState.customTravelPurpose}
            recentStayCountry={formState.recentStayCountry}
            boardingCountry={formState.boardingCountry}
            arrivalFlightNumber={formState.arrivalFlightNumber}
            arrivalArrivalDate={formState.arrivalArrivalDate}
            flightTicketPhoto={formState.flightTicketPhoto}
            departureFlightNumber={formState.departureFlightNumber}
            departureDepartureDate={formState.departureDepartureDate}
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
            errors={formState.errors}
            warnings={formState.warnings}
            handleFieldBlur={handleFieldBlur}
            lastEditedField={formState.lastEditedField}
            debouncedSaveData={debouncedSaveData}
            saveDataToSecureStorageWithOverride={saveDataToSecureStorage}
            setLastEditedAt={formState.setLastEditedAt}
            handleProvinceSelect={handleProvinceSelect}
            handleDistrictSelect={handleDistrictSelect}
            handleSubDistrictSelect={handleSubDistrictSelect}
            handleFlightTicketPhotoUpload={handleFlightTicketPhotoUpload}
            handleHotelReservationPhotoUpload={handleHotelReservationPhotoUpload}
            handleUserInteraction={handleUserInteraction}
          />

          <View style={styles.buttonContainer}>
            <Button
              title={smartButtonConfig.label}
              onPress={handleContinue}
              variant={smartButtonConfig.variant || 'primary'}
            />
          </View>
        </ScrollView>
      )}

      <FundItemDetailModal
        visible={formState.fundItemModalVisible}
        fundItem={formState.currentFundItem}
        isCreateMode={!formState.currentFundItem && !!formState.newFundItemType}
        createItemType={formState.newFundItemType}
        onClose={closeFundModal}
        onUpdate={handleFundItemUpdate}
        onCreate={handleFundItemCreate}
        onDelete={handleFundItemDelete}
      />
    </SafeAreaView>
  );
};

export default HongKongTravelInfoScreen;
