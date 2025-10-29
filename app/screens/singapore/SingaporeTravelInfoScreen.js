/**
 * Singapore Travel Info Screen (New Simplified Version)
 * 
 * Migrated to use all 4 shared sections with Singapore-specific labels and config.
 * Single-level location hierarchy (planning areas only).
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollView, Alert, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../../components/shared';

import {
  YStack,
  XStack,
  ProgressOverviewCard,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../../components/tamagui';

import { singaporeRegions } from '../../data/singaporeRegions';
import { singaporeLabels, singaporeConfig } from '../../config/labels/singapore';
import BackButton from '../../components/BackButton';
import UserDataService from '../../services/data/UserDataService';
import { useLocale } from '../../i18n/LocaleContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SingaporeTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();
  const passport = useMemo(() => UserDataService.toSerializablePassport(rawPassport), [rawPassport?.id, rawPassport?.passportNo]);
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // Passport state
  const [surname, setSurname] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [sex, setSex] = useState('');

  // Personal info state
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Funds state
  const [funds, setFunds] = useState([]);

  // Travel details state
  const [travelPurpose, setTravelPurpose] = useState('');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [recentStayCountry, setRecentStayCountry] = useState('');
  const [boardingCountry, setBoardingCountry] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [flightTicketPhoto, setFlightTicketPhoto] = useState(null);
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureFlightTicketPhoto, setDepartureFlightTicketPhoto] = useState(null);
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationType, setAccommodationType] = useState('');
  const [customAccommodationType, setCustomAccommodationType] = useState('');
  const [planningArea, setPlanningArea] = useState(''); // Singapore uses planning areas
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelReservationPhoto, setHotelReservationPhoto] = useState(null);

  // UI state
  const [expandedSections, setExpandedSections] = useState({ passport: true, personalInfo: false, funds: false, travelDetails: false });
  const [lastEditedAt, setLastEditedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const scrollViewRef = useRef(null);
  const saveTimerRef = useRef(null);

  const toggleSection = (section) => setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const debouncedSaveData = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDataToStorage(), 1000);
  }, []);

  const saveDataToStorage = async () => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(`singapore_travel_info_${userId}`, JSON.stringify({
        surname, middleName, givenName, nationality, passportNo, visaNumber, dob, expiryDate, sex,
        occupation, customOccupation, cityOfResidence, countryOfResidence, phoneCode, phoneNumber, email,
        funds, travelPurpose, customTravelPurpose, recentStayCountry, boardingCountry,
        arrivalFlightNumber, arrivalDate, departureFlightNumber, departureDate, isTransitPassenger,
        accommodationType, customAccommodationType, planningArea, hotelAddress,
        lastEditedAt: new Date().toISOString(),
      }));
      setLastEditedAt(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadDataFromStorage = async () => {
    try {
      const saved = await AsyncStorage.getItem(`singapore_travel_info_${userId}`);
      if (saved) {
        const data = JSON.parse(saved);
        setSurname(data.surname || ''); setMiddleName(data.middleName || ''); setGivenName(data.givenName || '');
        setNationality(data.nationality || ''); setPassportNo(data.passportNo || ''); setVisaNumber(data.visaNumber || '');
        setDob(data.dob || ''); setExpiryDate(data.expiryDate || ''); setSex(data.sex || '');
        setOccupation(data.occupation || ''); setCustomOccupation(data.customOccupation || '');
        setCityOfResidence(data.cityOfResidence || ''); setCountryOfResidence(data.countryOfResidence || '');
        setPhoneCode(data.phoneCode || ''); setPhoneNumber(data.phoneNumber || ''); setEmail(data.email || '');
        setFunds(data.funds || []); setTravelPurpose(data.travelPurpose || ''); setCustomTravelPurpose(data.customTravelPurpose || '');
        setRecentStayCountry(data.recentStayCountry || ''); setBoardingCountry(data.boardingCountry || '');
        setArrivalFlightNumber(data.arrivalFlightNumber || ''); setArrivalDate(data.arrivalDate || '');
        setDepartureFlightNumber(data.departureFlightNumber || ''); setDepartureDate(data.departureDate || '');
        setIsTransitPassenger(data.isTransitPassenger || false); setAccommodationType(data.accommodationType || '');
        setCustomAccommodationType(data.customAccommodationType || ''); setPlanningArea(data.planningArea || '');
        setHotelAddress(data.hotelAddress || '');
        setLastEditedAt(data.lastEditedAt ? new Date(data.lastEditedAt) : null);
      }
    } catch (error) {
      console.error('Failed to load:', error);
    }
  };

  useEffect(() => { loadDataFromStorage(); }, [userId]);

  const handleFieldBlur = (field, value) => {
    const newErrors = { ...errors };
    if (!value && ['passportNo', 'nationality', 'dob', 'expiryDate', 'sex'].includes(field)) {
      newErrors[field] = singaporeLabels.validation.required;
    } else {
      delete newErrors[field];
    }
    setErrors(newErrors);
  };

  const getFieldCount = (section) => {
    const counts = {
      passport: { fields: [surname, givenName, nationality, passportNo, dob, expiryDate, sex], total: 7 },
      personalInfo: { fields: [occupation, cityOfResidence, countryOfResidence, phoneCode, phoneNumber, email], total: 6 },
      funds: { fields: funds, total: Math.max(funds.length, 1) },
      travelDetails: { fields: [travelPurpose, boardingCountry, arrivalFlightNumber, arrivalDate, departureFlightNumber, departureDate, accommodationType, planningArea, hotelAddress], total: 9 },
    };
    const { fields, total } = counts[section] || { fields: [], total: 1 };
    const filled = Array.isArray(fields) ? fields.filter(f => f && f.toString().trim() !== '').length : 0;
    return { filled, total };
  };

  const addFund = (fundType) => {
    const newFund = { id: Date.now().toString(), type: fundType, amount: '', currency: 'SGD', createdAt: new Date().toISOString() };
    setFunds([...funds, newFund]);
  };

  const handleFundItemPress = (fund) => {};
  const handleFlightTicketPhotoUpload = async (photo) => { setFlightTicketPhoto(photo); debouncedSaveData(); };
  const handleDepartureFlightTicketPhotoUpload = async (photo) => { setDepartureFlightTicketPhoto(photo); debouncedSaveData(); };
  const handleHotelReservationPhotoUpload = async (photo) => { setHotelReservationPhoto(photo); debouncedSaveData(); };

  const handleSubmit = async () => {
    const missing = Object.entries({ passportNo, nationality, dob, expiryDate, sex }).filter(([k, v]) => !v || v.toString().trim() === '');
    if (missing.length > 0) {
      Alert.alert('Missing Information', 'Please fill required passport fields.', [{ text: 'OK' }]);
      return;
    }
    await saveDataToStorage();
    Alert.alert('Success', 'Singapore entry information saved!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }} edges={['top']}>
      <YStack backgroundColor="$background" paddingHorizontal="$md" paddingVertical="$sm">
        <XStack alignItems="center" gap="$md">
          <BackButton onPress={() => navigation.goBack()} />
          <YStack flex={1}>
            <TamaguiText fontSize="$6" fontWeight="bold">{singaporeLabels.screenTitle}</TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary">{singaporeLabels.screenTitleEn}</TamaguiText>
          </YStack>
        </XStack>
      </YStack>

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$md">
          <ProgressOverviewCard sections={[
            { name: singaporeLabels.passport.title, ...getFieldCount('passport') },
            { name: singaporeLabels.personalInfo.title, ...getFieldCount('personalInfo') },
            { name: singaporeLabels.funds.title, ...getFieldCount('funds') },
            { name: singaporeLabels.travelDetails.title, ...getFieldCount('travelDetails') },
          ]} />

          <PassportSection {...{ isExpanded: expandedSections.passport, onToggle: () => toggleSection('passport'), fieldCount: getFieldCount('passport'),
            surname, middleName, givenName, nationality, passportNo, visaNumber, dob, expiryDate, sex,
            setSurname, setMiddleName, setGivenName, setNationality, setPassportNo, setVisaNumber, setDob, setExpiryDate, setSex,
            errors, warnings, handleFieldBlur, debouncedSaveData, setLastEditedAt, labels: singaporeLabels.passport, config: singaporeConfig.passport }} />

          <PersonalInfoSection {...{ isExpanded: expandedSections.personalInfo, onToggle: () => toggleSection('personalInfo'), fieldCount: getFieldCount('personalInfo'),
            occupation, customOccupation, cityOfResidence, countryOfResidence, phoneCode, phoneNumber, email,
            setOccupation, setCustomOccupation, setCityOfResidence, setCountryOfResidence, setPhoneCode, setPhoneNumber, setEmail,
            errors, warnings, handleFieldBlur, debouncedSaveData, labels: singaporeLabels.personalInfo, config: singaporeConfig.personalInfo }} />

          <FundsSection {...{ isExpanded: expandedSections.funds, onToggle: () => toggleSection('funds'), fieldCount: getFieldCount('funds'),
            funds, addFund, handleFundItemPress, labels: singaporeLabels.funds, config: singaporeConfig.funds }} />

          <TravelDetailsSection {...{ isExpanded: expandedSections.travelDetails, onToggle: () => toggleSection('travelDetails'), fieldCount: getFieldCount('travelDetails'),
            travelPurpose, customTravelPurpose, recentStayCountry, boardingCountry, arrivalFlightNumber, arrivalDate, flightTicketPhoto,
            departureFlightNumber, departureDate, departureFlightTicketPhoto, isTransitPassenger, accommodationType, customAccommodationType,
            province: planningArea, hotelAddress, hotelReservationPhoto,
            setTravelPurpose, setCustomTravelPurpose, setRecentStayCountry, setBoardingCountry, setArrivalFlightNumber, setArrivalDate, setFlightTicketPhoto,
            setDepartureFlightNumber, setDepartureDate, setDepartureFlightTicketPhoto, setIsTransitPassenger, setAccommodationType, setCustomAccommodationType,
            setProvince: setPlanningArea, setHotelAddress, setHotelReservationPhoto,
            errors, warnings, handleFieldBlur, debouncedSaveData,
            getProvinceData: singaporeRegions,
            handleFlightTicketPhotoUpload, handleDepartureFlightTicketPhotoUpload, handleHotelReservationPhotoUpload,
            labels: singaporeLabels.travelDetails, config: singaporeConfig.travelDetails }} />

          <BaseCard padding="$md" marginTop="$lg">
            <BaseButton onPress={handleSubmit} variant="primary" size="lg" fullWidth>{singaporeLabels.progress.submit}</BaseButton>
            {lastEditedAt && <TamaguiText fontSize="$1" color="$textSecondary" textAlign="center" marginTop="$sm">Last saved: {lastEditedAt.toLocaleString('en-SG')}</TamaguiText>}
          </BaseCard>
          <YStack height={40} />
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SingaporeTravelInfoScreen;
