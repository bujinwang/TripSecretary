// 入境通 - Travel Info Screen (补充旅行信息)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import BackButton from '../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../theme';
import { checkDuplicate, getTimeUntilArrival } from '../utils/generationHistory';
import api from '../services/api';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';

const YES_VALUE = '是';
const NO_VALUE = '否';
const ARRIVING_FROM_US = '美国';
const ARRIVING_FROM_OTHER = '其他国家';

const PURPOSE_OPTIONS = [
  { value: '旅游', key: 'tourism' },
  { value: '商务', key: 'business' },
  { value: '探亲', key: 'visiting' },
  { value: '学习', key: 'study' },
  { value: '工作', key: 'work' },
];

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const parseDateOnly = (value) => {
  if (!value || typeof value !== 'string') return null;
  const parts = value.split('-').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

const SUPPORTED_72H_DESTINATIONS = new Set(['th', 'my', 'sg']);

const TravelInfoScreen = ({ navigation, route }) => {
  const { t, language } = useLocale();
  console.log('Current language:', language);
  const {
    passport: rawPassport,
    destination,
    travelInfo: initialTravelInfo = {},
    editing = false,
    generationId: editingGenerationId,
    fromHistory = false,
  } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const normalizeYesNo = (value, fallback = NO_VALUE) => {
    if (value === YES_VALUE || value === NO_VALUE) return value;
    if (value === true) return YES_VALUE;
    if (value === false) return NO_VALUE;
    return fallback;
  };

  const normalizePurpose = (value) => {
    const map = {
      HOLIDAY: '旅游',
      holiday: '旅游',
      TOURISM: '旅游',
      tourism: '旅游',
      'tourism/leisure': '旅游',
      BUSINESS: '商务',
      business: '商务',
      VISITING: '探亲',
      visiting: '探亲',
      FAMILY: '探亲',
      family: '探亲',
      STUDY: '学习',
      study: '学习',
      WORK: '工作',
      work: '工作',
    };
    if (!value) return '旅游';
    return map[value] || value;
  };

  const normalizeArrivingFrom = (value) => {
    if (!value) return ARRIVING_FROM_OTHER;
    if (['美国', 'USA', 'U.S.A.', 'us', 'United States'].includes(value)) {
      return ARRIVING_FROM_US;
    }
    if ([ARRIVING_FROM_OTHER, 'Other', 'OTHER'].includes(value)) {
      return ARRIVING_FROM_OTHER;
    }
    return value;
  };

  // Default arrival date: tomorrow's date (to ensure it's always in the future for validation)
  const getDefaultArrivalDate = () => {
    if (initialTravelInfo?.arrivalDate) {
      return initialTravelInfo.arrivalDate;
    }
    const date = new Date();
    date.setDate(date.getDate() + 1); // Tomorrow's date to ensure it's always in the future
    const defaultDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    console.log('📅 Default arrival date:', defaultDate);
    return defaultDate;
  };

  // Form state
  const [flightNumber, setFlightNumber] = useState(initialTravelInfo?.flightNumber || '');
  const [arrivalDate, setArrivalDate] = useState(initialTravelInfo?.arrivalDate || getDefaultArrivalDate());
  const [hotelName, setHotelName] = useState(initialTravelInfo?.hotelName || '');
  const [hotelAddress, setHotelAddress] = useState(initialTravelInfo?.hotelAddress || '');
  const [contactPhone, setContactPhone] = useState(initialTravelInfo?.contactPhone || '');
  const [stayDuration, setStayDuration] = useState(
    initialTravelInfo?.stayDuration !== undefined && initialTravelInfo?.stayDuration !== null
      ? String(initialTravelInfo.stayDuration)
      : ''
  );
  const [travelPurpose, setTravelPurpose] = useState(normalizePurpose(initialTravelInfo?.travelPurpose));

  // For US customs
  const [cashAmount, setCashAmount] = useState(normalizeYesNo(initialTravelInfo?.cashAmount));
  const [carryingFood, setCarryingFood] = useState(normalizeYesNo(initialTravelInfo?.carryingFood));
  
  // For Canada customs (E311)
  const [exceedsDutyFree, setExceedsDutyFree] = useState(normalizeYesNo(initialTravelInfo?.exceedsDutyFree));
  const [hasFirearms, setHasFirearms] = useState(normalizeYesNo(initialTravelInfo?.hasFirearms));
  const [hasCommercialGoods, setHasCommercialGoods] = useState(normalizeYesNo(initialTravelInfo?.hasCommercialGoods));
  const [visitedFarm, setVisitedFarm] = useState(normalizeYesNo(initialTravelInfo?.visitedFarm));
  const [hasHighCurrency, setHasHighCurrency] = useState(normalizeYesNo(initialTravelInfo?.hasHighCurrency));
  const [arrivingFrom, setArrivingFrom] = useState(normalizeArrivingFrom(initialTravelInfo?.arrivingFrom)); // '美国' or '其他国家'
  
  // For Thailand health declaration
  const [hasFever, setHasFever] = useState(normalizeYesNo(initialTravelInfo?.hasFever));
  
  // Duplicate check state
  const [duplicateRecord, setDuplicateRecord] = useState(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Get required fields based on destination
  const getRequiredFields = () => {
    const destId = destination?.id;

    switch (destId) {
      case 'hk':
        return [];
      case 'tw':
        return ['flightNumber', 'arrivalDate', 'hotelName', 'hotelAddress', 'contactPhone', 'stayDuration', 'travelPurpose'];
      case 'th':
        return ['flightNumber', 'arrivalDate', 'hotelName', 'hotelAddress', 'contactPhone', 'stayDuration', 'hasFever'];
      case 'my':
      case 'sg':
        return ['flightNumber', 'arrivalDate', 'hotelName', 'hotelAddress', 'contactPhone', 'stayDuration', 'travelPurpose'];
      case 'us':
        return ['flightNumber', 'hotelAddress', 'travelPurpose', 'cashAmount', 'carryingFood'];
      case 'ca':
        return ['flightNumber', 'hotelAddress', 'contactPhone', 'stayDuration', 'travelPurpose', 'hasHighCurrency'];
      default:
        return ['flightNumber', 'hotelAddress', 'contactPhone', 'stayDuration', 'travelPurpose'];
    }
  };

  const requiredFields = getRequiredFields();
  const needsHealthDeclaration = destination?.id === 'th';
  const needsUSCustoms = destination?.id === 'us';
  const needsCanadaCustoms = destination?.id === 'ca';

  const destinationName = t(`home.destinationNames.${destination?.id}`, {
    defaultValue: destination?.name || '',
  });

  const yesLabel = t('common.yes');
  const noLabel = t('common.no');

  const handleScanTicket = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('travelInfo.alerts.permissionPhotoTitle'),
          t('travelInfo.alerts.permissionPhotoBody'),
          [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
      
      if (!result.canceled) {
        try {
          const ocrResult = await api.recognizeTicket(result.assets[0].uri);
          if (ocrResult.flightNumber) setFlightNumber(ocrResult.flightNumber);
          if (ocrResult.arrivalDate) setArrivalDate(ocrResult.arrivalDate);
          Alert.alert(
            t('travelInfo.alerts.ocrSuccessFlight'),
            '',
            [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
          );
        } catch (error) {
          if (error.message.includes('未授权')) {
            Alert.alert(
              t('travelInfo.alerts.loginRequiredTitle'),
              t('travelInfo.alerts.loginRequiredBody'),
              [
                { text: t('travelInfo.alerts.manualEntryButton'), style: 'cancel' },
                { text: t('travelInfo.alerts.loginButton'), onPress: () => navigation.navigate('Login') },
              ]
            );
          } else {
            Alert.alert(
              t('travelInfo.alerts.ocrFailTitle'),
              error.message || t('travelInfo.alerts.ocrFailBody'),
              [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
            );
          }
        }
      }
    } catch (error) {
      Alert.alert(
        t('travelInfo.alerts.genericErrorTitle'),
        t('travelInfo.alerts.galleryError'),
        [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
      );
    }
  };

  const handleScanHotel = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('travelInfo.alerts.permissionPhotoTitle'),
          t('travelInfo.alerts.permissionPhotoBody'),
          [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });
      
      if (!result.canceled) {
        try {
          const ocrResult = await api.recognizeHotel(result.assets[0].uri);
          if (ocrResult.hotelName) setHotelName(ocrResult.hotelName);
          if (ocrResult.address) setHotelAddress(ocrResult.address);
          if (ocrResult.phone) setContactPhone(ocrResult.phone);
          Alert.alert(
            t('travelInfo.alerts.ocrSuccessHotel'),
            '',
            [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
          );
        } catch (error) {
          if (error.message.includes('未授权')) {
            Alert.alert(
              t('travelInfo.alerts.loginRequiredTitle'),
              t('travelInfo.alerts.loginRequiredBody'),
              [
                { text: t('travelInfo.alerts.manualEntryButton'), style: 'cancel' },
                { text: t('travelInfo.alerts.loginButton'), onPress: () => navigation.navigate('Login') },
              ]
            );
          } else {
            Alert.alert(
              t('travelInfo.alerts.ocrFailTitle'),
              error.message || t('travelInfo.alerts.ocrFailBody'),
              [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
            );
          }
        }
      }
    } catch (error) {
      Alert.alert(
        t('travelInfo.alerts.genericErrorTitle'),
        t('travelInfo.alerts.galleryError'),
        [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
      );
    }
  };

  const handleGenerate = () => {
    // Validate arrival date for destinations with 72-hour submission windows (Thailand, Malaysia)
    if (SUPPORTED_72H_DESTINATIONS.has(destination?.id) && arrivalDate) {
      const arrivalDateObj = parseDateOnly(arrivalDate);
      if (arrivalDateObj) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayDiff = (arrivalDateObj.getTime() - today.getTime()) / ONE_DAY_MS;

        if (dayDiff < 0) {
          Alert.alert(
            t('travelInfo.alerts.datePastTitle'),
            t('travelInfo.alerts.datePastBody'),
            [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
          );
          return;
        }

        if (dayDiff > 3) {
          Alert.alert(
            t('travelInfo.alerts.dateTooFarTitle'),
            t('travelInfo.alerts.dateTooFarBody', { days: Math.round(dayDiff) }),
            [{ text: t('travelInfo.alerts.permissionDeniedAction') }]
          );
          return;
        }
      }
    }
    
    const travelInfo = {
      flightNumber,
      arrivalDate,
      hotelName,
      hotelAddress,
      contactPhone,
      stayDuration,
      travelPurpose,
      // US customs
      cashAmount,
      carryingFood,
      // Canada customs (E311)
      exceedsDutyFree,
      hasFirearms,
      hasCommercialGoods,
      visitedFarm,
      hasHighCurrency,
      arrivingFrom,
      // Thailand health
      hasFever,
    };

    if (!editing) {
      // Mock history data - 实际应该从 AsyncStorage 或 API 获取
      const historyList = [
        {
          id: 'existing-1',
          passport: { passportNo: 'E12345678' },
          destination: { id: 'th', name: t('home.destinationNames.th', { defaultValue: 'Thailand' }), flag: '🇹🇭' },
          travelInfo: {
            flightNumber: 'CA981',
            arrivalDate: '2025-01-15',
          },
          createdAt: '2025-01-10T10:00:00Z',
        },
      ];

      // 检查是否有重复记录
      const duplicate = checkDuplicate(
        { passport, destination, travelInfo },
        historyList
      );

      if (duplicate) {
        setDuplicateRecord(duplicate);
        setShowDuplicateWarning(true);
        return;
      }
    }

    // 没有重复，继续生成
    navigation.navigate('Generating', {
      passport,
      destination,
      travelInfo,
      fromHistory: editing || fromHistory,
      generationId: editingGenerationId,
    });
  };

  const handleUseDuplicate = () => {
    // 使用已有的记录
    navigation.navigate('Result', {
      passport,
      destination,
      travelInfo: duplicateRecord.travelInfo,
      fromHistory: true,
    });
  };

  const handleGenerateAnyway = () => {
    // 强制重新生成
    const travelInfo = {
      flightNumber,
      arrivalDate,
      hotelName,
      hotelAddress,
      contactPhone,
      stayDuration,
      travelPurpose,
      // US customs
      cashAmount,
      carryingFood,
      // Canada customs (E311)
      exceedsDutyFree,
      hasFirearms,
      hasCommercialGoods,
      visitedFarm,
      hasHighCurrency,
      arrivingFrom,
      // Thailand health
      hasFever,
    };

    setShowDuplicateWarning(false);
    navigation.navigate('Generating', {
      passport,
      destination,
      travelInfo,
      fromHistory: editing || fromHistory,
      generationId: editingGenerationId,
      forceRegenerate: true,
    });
  };

  const renderPurposeOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        {PURPOSE_OPTIONS.map(({ value, key }) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.optionButton,
              travelPurpose === value && styles.optionButtonActive,
            ]}
            onPress={() => setTravelPurpose(value)}
          >
            <Text
              style={[
                styles.optionText,
                travelPurpose === value && styles.optionTextActive,
              ]}
            >
              {t(`travelInfo.purposes.${key}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderYesNoOptions = (value, setValue) => {
    return (
      <View style={styles.yesNoContainer}>
        <TouchableOpacity
          style={[
            styles.yesNoButton,
            value === YES_VALUE && styles.yesNoButtonActive,
          ]}
          onPress={() => setValue(YES_VALUE)}
        >
          <Text
            style={[
              styles.yesNoText,
              value === YES_VALUE && styles.yesNoTextActive,
            ]}
          >
            {yesLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.yesNoButton,
            value === NO_VALUE && styles.yesNoButtonActive,
          ]}
          onPress={() => setValue(NO_VALUE)}
        >
          <Text
            style={[
              styles.yesNoText,
              value === NO_VALUE && styles.yesNoTextActive,
            ]}
          >
            {noLabel}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>⚠️</Text>
            <Text style={styles.modalTitle}>{t('travelInfo.duplicateModal.title')}</Text>
            <Text style={styles.modalMessage}>
              {t('travelInfo.duplicateModal.message')}
            </Text>
            
            <Card style={styles.duplicateInfoCard}>
              <Text style={styles.duplicateLabel}>{t('travelInfo.duplicateModal.labels.destination')}</Text>
              <Text style={styles.duplicateValue}>
                {duplicateRecord?.destination?.flag}{' '}
                {t(`home.destinationNames.${duplicateRecord?.destination?.id}`, {
                  defaultValue: duplicateRecord?.destination?.name || '',
                })}
              </Text>
              
              <Text style={styles.duplicateLabel}>{t('travelInfo.duplicateModal.labels.flight')}</Text>
              <Text style={styles.duplicateValue}>
                {duplicateRecord?.travelInfo?.flightNumber}
              </Text>
              
              {duplicateRecord?.travelInfo?.arrivalDate && (
                <>
                  <Text style={styles.duplicateLabel}>{t('travelInfo.duplicateModal.labels.arrival')}</Text>
                  <Text style={styles.duplicateValue}>
                    {duplicateRecord?.travelInfo?.arrivalDate}{' '}
                    {t('travelInfo.duplicateModal.arrivalSuffix', {
                      relative: getTimeUntilArrival(
                        duplicateRecord?.travelInfo?.arrivalDate,
                        t
                      ),
                    })}
                  </Text>
                </>
              )}
              
              <Text style={styles.duplicateLabel}>{t('travelInfo.duplicateModal.labels.generated')}</Text>
              <Text style={styles.duplicateValue}>
                {duplicateRecord?.createdAt
                  ? new Date(duplicateRecord?.createdAt).toLocaleString(language)
                  : ''}
              </Text>
            </Card>

            <Text style={styles.modalHint}>{t('travelInfo.duplicateModal.hint')}</Text>

            <View style={styles.modalButtons}>
              <Button
                title={t('travelInfo.duplicateModal.useExisting')}
                onPress={handleUseDuplicate}
                variant="primary"
                style={styles.modalButton}
              />
              <Button
                title={t('travelInfo.duplicateModal.regenerate')}
                onPress={handleGenerateAnyway}
                variant="secondary"
                style={styles.modalButton}
              />
            </View>
            
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDuplicateWarning(false)}
            >
              <Text style={styles.modalCloseText}>{t('travelInfo.duplicateModal.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            label={t('common.back')}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>{t('travelInfo.header.title')}</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Destination Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>{destination?.flag || '🌍'}</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>
                {t('travelInfo.infoCard.title', { destination: destinationName })}
              </Text>
              <Text style={styles.infoSubtitle}>
                {t('travelInfo.infoCard.subtitle')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Flight Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('travelInfo.sections.flight')}</Text>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={handleScanTicket}
              >
                <Text style={styles.scanIcon}>📸</Text>
                <Text style={styles.scanText}>{t('travelInfo.scanButtons.ticket')}</Text>
              </TouchableOpacity>
            </View>
            
            <Input
              label={t('travelInfo.fields.flightNumber.label')}
              placeholder={t('travelInfo.fields.flightNumber.placeholder')}
              value={flightNumber}
              onChangeText={setFlightNumber}
              required={requiredFields.includes('flightNumber')}
            />

            {requiredFields.includes('arrivalDate') && (
              <>
                <Input
                  label={t('travelInfo.fields.arrivalDate.label')}
                  placeholder={t('travelInfo.fields.arrivalDate.placeholder')}
                  value={arrivalDate}
                  onChangeText={setArrivalDate}
                  required
                />
                <Text style={styles.helpText}>
                  ⚠️ {t('travelInfo.fields.arrivalDate.help')}
                </Text>
              </>
            )}
          </View>


          {/* Accommodation Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('travelInfo.sections.accommodation')}</Text>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={handleScanHotel}
              >
                <Text style={styles.scanIcon}>📸</Text>
                <Text style={styles.scanText}>{t('travelInfo.scanButtons.hotel')}</Text>
              </TouchableOpacity>
            </View>
            
            {requiredFields.includes('hotelName') && (
              <Input
                label={t('travelInfo.fields.hotelName.label')}
                placeholder={t('travelInfo.fields.hotelName.placeholder')}
                value={hotelName}
                onChangeText={setHotelName}
                required
              />
            )}

            <Input
              label={t('travelInfo.fields.hotelAddress.label')}
              placeholder={t('travelInfo.fields.hotelAddress.placeholder')}
              value={hotelAddress}
              onChangeText={setHotelAddress}
              multiline
              required={requiredFields.includes('hotelAddress')}
            />

            {requiredFields.includes('contactPhone') && (
              <Input
                label={t('travelInfo.fields.contactPhone.label')}
                placeholder={t('travelInfo.fields.contactPhone.placeholder')}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                required
              />
            )}
          </View>

          {/* Trip Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('travelInfo.sections.trip')}</Text>
            
            {requiredFields.includes('stayDuration') && (
              <Input
                label={t('travelInfo.fields.stayDuration.label')}
                placeholder={t('travelInfo.fields.stayDuration.placeholder')}
                value={stayDuration}
                onChangeText={setStayDuration}
                keyboardType="numeric"
                required
              />
            )}

            {requiredFields.includes('travelPurpose') && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.fields.purpose')} <Text style={styles.required}>*</Text>
                </Text>
                {renderPurposeOptions()}
              </View>
            )}
          </View>

          {/* Health Declaration (Thailand) */}
          {needsHealthDeclaration && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('travelInfo.sections.health')}</Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.yesNoQuestion.fever')} <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(hasFever, setHasFever)}
              </View>
            </View>
          )}

          {/* US Customs Declaration */}
          {needsUSCustoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('travelInfo.sections.usCustoms')}</Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.yesNoQuestion.usCash')} <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(cashAmount, setCashAmount)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.yesNoQuestion.usFood')} <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(carryingFood, setCarryingFood)}
              </View>
            </View>
          )}

          {/* Canada Customs Declaration (E311) */}
          {needsCanadaCustoms && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('travelInfo.sections.caCustoms')}</Text>
              
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.arrivingFrom.label')} <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      arrivingFrom === ARRIVING_FROM_US && styles.optionButtonActive,
                    ]}
                    onPress={() => setArrivingFrom(ARRIVING_FROM_US)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        arrivingFrom === ARRIVING_FROM_US && styles.optionTextActive,
                      ]}
                    >
                      {t('travelInfo.arrivingFrom.us')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      arrivingFrom === ARRIVING_FROM_OTHER && styles.optionButtonActive,
                    ]}
                    onPress={() => setArrivingFrom(ARRIVING_FROM_OTHER)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        arrivingFrom === ARRIVING_FROM_OTHER && styles.optionTextActive,
                      ]}
                    >
                      {t('travelInfo.arrivingFrom.other')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.yesNoQuestion.caCurrency')} <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(hasHighCurrency, setHasHighCurrency)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.yesNoQuestion.caDuty')} <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.fieldHint}>{t('travelInfo.hints.caDuty')}</Text>
                {renderYesNoOptions(exceedsDutyFree, setExceedsDutyFree)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.yesNoQuestion.caFirearms')} <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(hasFirearms, setHasFirearms)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.yesNoQuestion.caCommercial')} <Text style={styles.required}>*</Text>
                </Text>
                {renderYesNoOptions(hasCommercialGoods, setHasCommercialGoods)}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {t('travelInfo.yesNoQuestion.caFood')} <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.fieldHint}>{t('travelInfo.hints.caFood')}</Text>
                {renderYesNoOptions(visitedFarm, setVisitedFarm)}
              </View>
            </View>
          )}
        </View>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsIcon}>💡</Text>
          <Text style={styles.tipsTitle}>{t('travelInfo.tips.title')}</Text>
          {t('travelInfo.tips.body')
            .split('\n')
            .map((line, index) => (
              <Text key={index} style={styles.tipsText}>
                {line}
              </Text>
            ))}
        </Card>

        {/* Generate Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('travelInfo.generateButton')}
            onPress={handleGenerate}
            variant="primary"
            icon={<Text style={styles.buttonIcon}>✨</Text>}
          />
        </View>

        <View style={{ height: spacing.xxl }} />
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
  infoCard: {
    margin: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  form: {
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scanIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  scanText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  required: {
    color: colors.error,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
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
    ...typography.body1,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  yesNoButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  yesNoText: {
    ...typography.body2,
    color: colors.text,
  },
  yesNoTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tipsCard: {
    margin: spacing.md,
    backgroundColor: colors.white,
  },
  tipsIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tipsText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
  },
  buttonIcon: {
    fontSize: 24,
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.xl,
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  duplicateInfoCard: {
    width: '100%',
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  duplicateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  duplicateValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  modalHint: {
    ...typography.body1,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'column',
    width: '100%',
    gap: spacing.sm,
  },
  modalButton: {
    width: '100%',
  },
  modalClose: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  modalCloseText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  helpText: {
    ...typography.caption,
    color: colors.warning || '#f59e0b',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
  },
});

export default TravelInfoScreen;
