/**
 * Malaysia Travel Info Screen (New Simplified Version)
 * Migrated to use all 4 shared sections. 2-level location hierarchy (State → District).
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollView, Alert, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PassportSection, PersonalInfoSection, FundsSection, TravelDetailsSection } from '../../components/shared';
import { YStack, XStack, ProgressOverviewCard, BaseCard, BaseButton, Text as TamaguiText } from '../../components/tamagui';
import { malaysiaStates, getDistrictsByState } from '../../data/malaysiaLocations';
import { malaysiaLabels, malaysiaConfig } from '../../config/labels/malaysia';
import BackButton from '../../components/BackButton';
import UserDataService from '../../services/data/UserDataService';
import { useLocale } from '../../i18n/LocaleContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MalaysiaTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport } = route.params || {};
  const { t } = useLocale();
  const passport = useMemo(() => UserDataService.toSerializablePassport(rawPassport), [rawPassport?.id]);
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  const [surname, setSurname] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [funds, setFunds] = useState([]);
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
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelReservationPhoto, setHotelReservationPhoto] = useState(null);

  const [expandedSections, setExpandedSections] = useState({ passport: true, personalInfo: false, funds: false, travelDetails: false });
  const [lastEditedAt, setLastEditedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const scrollViewRef = useRef(null);
  const saveTimerRef = useRef(null);

  const toggleSection = (s) => setExpandedSections(p => ({ ...p, [s]: !p[s] }));
  const debouncedSaveData = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDataToStorage(), 1000);
  }, []);

  const saveDataToStorage = async () => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem(`malaysia_travel_info_${userId}`, JSON.stringify({
        surname, middleName, givenName, nationality, passportNo, visaNumber, dob, expiryDate, sex,
        occupation, customOccupation, cityOfResidence, countryOfResidence, phoneCode, phoneNumber, email, funds,
        travelPurpose, customTravelPurpose, recentStayCountry, boardingCountry, arrivalFlightNumber, arrivalDate,
        departureFlightNumber, departureDate, isTransitPassenger, accommodationType, customAccommodationType,
        state, district, districtId, hotelAddress, lastEditedAt: new Date().toISOString(),
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
      const saved = await AsyncStorage.getItem(`malaysia_travel_info_${userId}`);
      if (saved) {
        const d = JSON.parse(saved);
        setSurname(d.surname || ''); setMiddleName(d.middleName || ''); setGivenName(d.givenName || '');
        setNationality(d.nationality || ''); setPassportNo(d.passportNo || ''); setVisaNumber(d.visaNumber || '');
        setDob(d.dob || ''); setExpiryDate(d.expiryDate || ''); setSex(d.sex || '');
        setOccupation(d.occupation || ''); setCustomOccupation(d.customOccupation || '');
        setCityOfResidence(d.cityOfResidence || ''); setCountryOfResidence(d.countryOfResidence || '');
        setPhoneCode(d.phoneCode || ''); setPhoneNumber(d.phoneNumber || ''); setEmail(d.email || '');
        setFunds(d.funds || []); setTravelPurpose(d.travelPurpose || ''); setCustomTravelPurpose(d.customTravelPurpose || '');
        setRecentStayCountry(d.recentStayCountry || ''); setBoardingCountry(d.boardingCountry || '');
        setArrivalFlightNumber(d.arrivalFlightNumber || ''); setArrivalDate(d.arrivalDate || '');
        setDepartureFlightNumber(d.departureFlightNumber || ''); setDepartureDate(d.departureDate || '');
        setIsTransitPassenger(d.isTransitPassenger || false); setAccommodationType(d.accommodationType || '');
        setCustomAccommodationType(d.customAccommodationType || ''); setState(d.state || '');
        setDistrict(d.district || ''); setDistrictId(d.districtId || ''); setHotelAddress(d.hotelAddress || '');
        setLastEditedAt(d.lastEditedAt ? new Date(d.lastEditedAt) : null);
      }
    } catch (error) {
      console.error('Failed to load:', error);
    }
  };

  useEffect(() => { loadDataFromStorage(); }, [userId]);

  const handleFieldBlur = (f, v) => {
    const e = { ...errors };
    if (!v && ['passportNo', 'nationality', 'dob', 'expiryDate', 'sex'].includes(f)) {
      e[f] = malaysiaLabels.validation.required;
    } else {
      delete e[f];
    }
    setErrors(e);
  };

  const getFieldCount = (s) => {
    const c = {
      passport: { fields: [surname, givenName, nationality, passportNo, dob, expiryDate, sex], total: 7 },
      personalInfo: { fields: [occupation, cityOfResidence, countryOfResidence, phoneCode, phoneNumber, email], total: 6 },
      funds: { fields: funds, total: Math.max(funds.length, 1) },
      travelDetails: { fields: [travelPurpose, boardingCountry, arrivalFlightNumber, arrivalDate, departureFlightNumber, departureDate, accommodationType, state, district, hotelAddress], total: 10 },
    };
    const { fields, total } = c[s] || { fields: [], total: 1 };
    const filled = Array.isArray(fields) ? fields.filter(f => f && f.toString().trim()).length : 0;
    return { filled, total };
  };

  const addFund = (t) => {
    const f = { id: Date.now().toString(), type: t, amount: '', currency: 'MYR', createdAt: new Date().toISOString() };
    setFunds([...funds, f]);
  };

  const handleFundItemPress = () => {};
  const handleFlightTicketPhotoUpload = async (p) => { setFlightTicketPhoto(p); debouncedSaveData(); };
  const handleDepartureFlightTicketPhotoUpload = async (p) => { setDepartureFlightTicketPhoto(p); debouncedSaveData(); };
  const handleHotelReservationPhotoUpload = async (p) => { setHotelReservationPhoto(p); debouncedSaveData(); };

  const handleSubmit = async () => {
    const req = { passportNo, nationality, dob, expiryDate, sex };
    const missing = Object.entries(req).filter(([k, v]) => !v || v.toString().trim() === '');
    if (missing.length > 0) {
      Alert.alert('Missing', 'Please fill required passport fields.', [{ text: 'OK' }]);
      return;
    }
    await saveDataToStorage();
    Alert.alert('Success', 'Malaysia entry information saved!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }} edges={['top']}>
      <YStack backgroundColor="$background" paddingHorizontal="$md" paddingVertical="$sm">
        <XStack alignItems="center" gap="$md">
          <BackButton onPress={() => navigation.goBack()} />
          <YStack flex={1}>
            <TamaguiText fontSize="$6" fontWeight="bold">{malaysiaLabels.screenTitle}</TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary">{malaysiaLabels.screenTitleEn}</TamaguiText>
          </YStack>
        </XStack>
      </YStack>

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <YStack gap="$md">
          <ProgressOverviewCard sections={[
            { name: malaysiaLabels.passport.title, ...getFieldCount('passport') },
            { name: malaysiaLabels.personalInfo.title, ...getFieldCount('personalInfo') },
            { name: malaysiaLabels.funds.title, ...getFieldCount('funds') },
            { name: malaysiaLabels.travelDetails.title, ...getFieldCount('travelDetails') },
          ]} />

          <PassportSection {...{ isExpanded: expandedSections.passport, onToggle: () => toggleSection('passport'), fieldCount: getFieldCount('passport'),
            surname, middleName, givenName, nationality, passportNo, visaNumber, dob, expiryDate, sex,
            setSurname, setMiddleName, setGivenName, setNationality, setPassportNo, setVisaNumber, setDob, setExpiryDate, setSex,
            errors, warnings, handleFieldBlur, debouncedSaveData, setLastEditedAt, labels: malaysiaLabels.passport, config: malaysiaConfig.passport }} />

          <PersonalInfoSection {...{ isExpanded: expandedSections.personalInfo, onToggle: () => toggleSection('personalInfo'), fieldCount: getFieldCount('personalInfo'),
            occupation, customOccupation, cityOfResidence, countryOfResidence, phoneCode, phoneNumber, email,
            setOccupation, setCustomOccupation, setCityOfResidence, setCountryOfResidence, setPhoneCode, setPhoneNumber, setEmail,
            errors, warnings, handleFieldBlur, debouncedSaveData, labels: malaysiaLabels.personalInfo, config: malaysiaConfig.personalInfo }} />

          <FundsSection {...{ isExpanded: expandedSections.funds, onToggle: () => toggleSection('funds'), fieldCount: getFieldCount('funds'),
            funds, addFund, handleFundItemPress, labels: malaysiaLabels.funds, config: malaysiaConfig.funds }} />

          <TravelDetailsSection {...{ isExpanded: expandedSections.travelDetails, onToggle: () => toggleSection('travelDetails'), fieldCount: getFieldCount('travelDetails'),
            travelPurpose, customTravelPurpose, recentStayCountry, boardingCountry, arrivalFlightNumber, arrivalDate, flightTicketPhoto,
            departureFlightNumber, departureDate, departureFlightTicketPhoto, isTransitPassenger, accommodationType, customAccommodationType,
            province: state, district, districtId, hotelAddress, hotelReservationPhoto,
            setTravelPurpose, setCustomTravelPurpose, setRecentStayCountry, setBoardingCountry, setArrivalFlightNumber, setArrivalDate, setFlightTicketPhoto,
            setDepartureFlightNumber, setDepartureDate, setDepartureFlightTicketPhoto, setIsTransitPassenger, setAccommodationType, setCustomAccommodationType,
            setProvince: setState, setDistrict, setDistrictId, setHotelAddress, setHotelReservationPhoto,
            errors, warnings, handleFieldBlur, debouncedSaveData,
            getProvinceData: malaysiaStates, getDistrictData: getDistrictsByState,
            handleFlightTicketPhotoUpload, handleDepartureFlightTicketPhotoUpload, handleHotelReservationPhotoUpload,
            labels: malaysiaLabels.travelDetails, config: malaysiaConfig.travelDetails }} />

          <BaseCard padding="$md" marginTop="$lg">
            <BaseButton onPress={handleSubmit} variant="primary" size="lg" fullWidth>{malaysiaLabels.progress.submit}</BaseButton>
            {lastEditedAt && <TamaguiText fontSize="$1" color="$textSecondary" textAlign="center" marginTop="$sm">Last saved: {lastEditedAt.toLocaleString('en-MY')}</TamaguiText>}
          </BaseCard>
          <YStack height={40} />
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MalaysiaTravelInfoScreen;
