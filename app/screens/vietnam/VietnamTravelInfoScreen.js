/**
 * Vietnam Travel Info Screen
 *
 * Complete reference implementation using all shared section components:
 * - PassportSection (shared)
 * - PersonalInfoSection (shared)
 * - FundsSection (shared)
 * - TravelDetailsSection (shared)
 * - LocationHierarchySelector (shared)
 *
 * This serves as a template for other countries (Singapore, Malaysia, Hong Kong, etc.)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScrollView, Alert, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import shared section components
import {
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../../components/shared';

// Import Tamagui components
import {
  YStack,
  XStack,
  ProgressOverviewCard,
  BaseCard,
  BaseButton,
  Text as TamaguiText,
} from '../../components/tamagui';

// Import Vietnam-specific data and labels
import {
  vietnamProvinces,
  getDistrictsByProvince,
  getProvinceDisplayName,
  getDistrictDisplayName,
} from '../../data/vietnamLocations';
import { vietnamLabels, vietnamConfig } from '../../config/labels/vietnam';

// Import utilities
import BackButton from '../../components/BackButton';
import UserDataService from '../../services/data/UserDataService';
import { useLocale } from '../../i18n/LocaleContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const VietnamTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo]);

  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // ============================================================================
  // FORM STATE - Passport Section
  // ============================================================================
  const [surname, setSurname] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [sex, setSex] = useState('');

  // ============================================================================
  // FORM STATE - Personal Info Section
  // ============================================================================
  const [occupation, setOccupation] = useState('');
  const [customOccupation, setCustomOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // ============================================================================
  // FORM STATE - Funds Section
  // ============================================================================
  const [funds, setFunds] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [fundModalVisible, setFundModalVisible] = useState(false);

  // ============================================================================
  // FORM STATE - Travel Details Section
  // ============================================================================
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
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelReservationPhoto, setHotelReservationPhoto] = useState(null);

  // ============================================================================
  // UI STATE
  // ============================================================================
  const [expandedSections, setExpandedSections] = useState({
    passport: true,
    personalInfo: false,
    funds: false,
    travelDetails: false,
  });
  const [lastEditedAt, setLastEditedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================================================
  // VALIDATION STATE
  // ============================================================================
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});

  // ============================================================================
  // REFS
  // ============================================================================
  const scrollViewRef = useRef(null);
  const saveTimerRef = useRef(null);

  // ============================================================================
  // SECTION TOGGLE HANDLERS
  // ============================================================================
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ============================================================================
  // DATA PERSISTENCE
  // ============================================================================

  // Debounced save function
  const debouncedSaveData = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveDataToStorage();
    }, 1000);
  }, []);

  // Save data to AsyncStorage
  const saveDataToStorage = async () => {
    try {
      setIsSaving(true);
      const dataToSave = {
        // Passport
        surname,
        middleName,
        givenName,
        nationality,
        passportNo,
        visaNumber,
        dob,
        expiryDate,
        sex,
        // Personal Info
        occupation,
        customOccupation,
        cityOfResidence,
        countryOfResidence,
        phoneCode,
        phoneNumber,
        email,
        // Funds
        funds,
        // Travel Details
        travelPurpose,
        customTravelPurpose,
        recentStayCountry,
        boardingCountry,
        arrivalFlightNumber,
        arrivalDate,
        departureFlightNumber,
        departureDate,
        isTransitPassenger,
        accommodationType,
        customAccommodationType,
        province,
        district,
        districtId,
        hotelAddress,
        // Metadata
        lastEditedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        `vietnam_travel_info_${userId}`,
        JSON.stringify(dataToSave)
      );
      setLastEditedAt(new Date());
    } catch (error) {
      console.error('Failed to save data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load data from AsyncStorage
  const loadDataFromStorage = async () => {
    try {
      const savedData = await AsyncStorage.getItem(`vietnam_travel_info_${userId}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        // Restore passport data
        setSurname(data.surname || '');
        setMiddleName(data.middleName || '');
        setGivenName(data.givenName || '');
        setNationality(data.nationality || '');
        setPassportNo(data.passportNo || '');
        setVisaNumber(data.visaNumber || '');
        setDob(data.dob || '');
        setExpiryDate(data.expiryDate || '');
        setSex(data.sex || '');
        // Restore personal info
        setOccupation(data.occupation || '');
        setCustomOccupation(data.customOccupation || '');
        setCityOfResidence(data.cityOfResidence || '');
        setCountryOfResidence(data.countryOfResidence || '');
        setPhoneCode(data.phoneCode || '');
        setPhoneNumber(data.phoneNumber || '');
        setEmail(data.email || '');
        // Restore funds
        setFunds(data.funds || []);
        // Restore travel details
        setTravelPurpose(data.travelPurpose || '');
        setCustomTravelPurpose(data.customTravelPurpose || '');
        setRecentStayCountry(data.recentStayCountry || '');
        setBoardingCountry(data.boardingCountry || '');
        setArrivalFlightNumber(data.arrivalFlightNumber || '');
        setArrivalDate(data.arrivalDate || '');
        setDepartureFlightNumber(data.departureFlightNumber || '');
        setDepartureDate(data.departureDate || '');
        setIsTransitPassenger(data.isTransitPassenger || false);
        setAccommodationType(data.accommodationType || '');
        setCustomAccommodationType(data.customAccommodationType || '');
        setProvince(data.province || '');
        setDistrict(data.district || '');
        setDistrictId(data.districtId || '');
        setHotelAddress(data.hotelAddress || '');

        setLastEditedAt(data.lastEditedAt ? new Date(data.lastEditedAt) : null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDataFromStorage();
  }, [userId]);

  // ============================================================================
  // VALIDATION
  // ============================================================================
  const handleFieldBlur = (fieldName, value) => {
    // Simple validation - can be expanded
    const newErrors = { ...errors };

    if (!value && ['passportNo', 'nationality', 'dob', 'expiryDate', 'sex'].includes(fieldName)) {
      newErrors[fieldName] = vietnamLabels.validation.required;
    } else {
      delete newErrors[fieldName];
    }

    setErrors(newErrors);
  };

  // ============================================================================
  // FIELD COUNT CALCULATION
  // ============================================================================
  const getFieldCount = (section) => {
    switch (section) {
      case 'passport': {
        const fields = [surname, givenName, nationality, passportNo, dob, expiryDate, sex];
        const filled = fields.filter((f) => f && f.toString().trim() !== '').length;
        return { filled, total: 7 };
      }
      case 'personalInfo': {
        const fields = [occupation, cityOfResidence, countryOfResidence, phoneCode, phoneNumber, email];
        const filled = fields.filter((f) => f && f.toString().trim() !== '').length;
        return { filled, total: 6 };
      }
      case 'funds': {
        return { filled: funds.length, total: funds.length || 1 };
      }
      case 'travelDetails': {
        const fields = [
          travelPurpose,
          boardingCountry,
          arrivalFlightNumber,
          arrivalDate,
          departureFlightNumber,
          departureDate,
          accommodationType,
          province,
          district,
          hotelAddress,
        ];
        const filled = fields.filter((f) => f && f.toString().trim() !== '').length;
        return { filled, total: 10 };
      }
      default:
        return { filled: 0, total: 1 };
    }
  };

  // ============================================================================
  // FUND MANAGEMENT
  // ============================================================================
  const addFund = (fundType) => {
    const newFund = {
      id: Date.now().toString(),
      type: fundType,
      amount: '',
      currency: 'USD',
      createdAt: new Date().toISOString(),
    };
    setFunds([...funds, newFund]);
    setSelectedFund(newFund);
    setFundModalVisible(true);
  };

  const handleFundItemPress = (fund) => {
    setSelectedFund(fund);
    setFundModalVisible(true);
  };

  const handleFundUpdate = (updatedFund) => {
    setFunds(funds.map((f) => (f.id === updatedFund.id ? updatedFund : f)));
    debouncedSaveData();
  };

  const handleFundDelete = (fundId) => {
    setFunds(funds.filter((f) => f.id !== fundId));
    debouncedSaveData();
  };

  // ============================================================================
  // PHOTO UPLOAD HANDLERS (Placeholder implementations)
  // ============================================================================
  const handleFlightTicketPhotoUpload = async (photo) => {
    setFlightTicketPhoto(photo);
    debouncedSaveData();
  };

  const handleDepartureFlightTicketPhotoUpload = async (photo) => {
    setDepartureFlightTicketPhoto(photo);
    debouncedSaveData();
  };

  const handleHotelReservationPhotoUpload = async (photo) => {
    setHotelReservationPhoto(photo);
    debouncedSaveData();
  };

  // ============================================================================
  // SUBMIT HANDLER
  // ============================================================================
  const handleSubmit = async () => {
    // Validate all required fields
    const requiredFields = {
      passportNo,
      nationality,
      dob,
      expiryDate,
      sex,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || value.toString().trim() === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Information',
        'Please fill in all required passport fields before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Save one final time
    await saveDataToStorage();

    Alert.alert(
      'Success',
      'Your Vietnam entry information has been saved successfully!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }} edges={['top']}>
      {/* Header */}
      <YStack backgroundColor="$background" paddingHorizontal="$md" paddingVertical="$sm">
        <XStack alignItems="center" gap="$md">
          <BackButton onPress={() => navigation.goBack()} />
          <YStack flex={1}>
            <TamaguiText fontSize="$6" fontWeight="bold" color="$text">
              {vietnamLabels.screenTitle}
            </TamaguiText>
            <TamaguiText fontSize="$2" color="$textSecondary">
              {vietnamLabels.screenTitleEn}
            </TamaguiText>
          </YStack>
        </XStack>
      </YStack>

      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$md">
          {/* Progress Overview */}
          <ProgressOverviewCard
            sections={[
              {
                name: vietnamLabels.passport.title,
                ...getFieldCount('passport'),
              },
              {
                name: vietnamLabels.personalInfo.title,
                ...getFieldCount('personalInfo'),
              },
              {
                name: vietnamLabels.funds.title,
                ...getFieldCount('funds'),
              },
              {
                name: vietnamLabels.travelDetails.title,
                ...getFieldCount('travelDetails'),
              },
            ]}
          />

          {/* Passport Section */}
          <PassportSection
            isExpanded={expandedSections.passport}
            onToggle={() => toggleSection('passport')}
            fieldCount={getFieldCount('passport')}
            surname={surname}
            middleName={middleName}
            givenName={givenName}
            nationality={nationality}
            passportNo={passportNo}
            visaNumber={visaNumber}
            dob={dob}
            expiryDate={expiryDate}
            sex={sex}
            setSurname={setSurname}
            setMiddleName={setMiddleName}
            setGivenName={setGivenName}
            setNationality={setNationality}
            setPassportNo={setPassportNo}
            setVisaNumber={setVisaNumber}
            setDob={setDob}
            setExpiryDate={setExpiryDate}
            setSex={setSex}
            errors={errors}
            warnings={warnings}
            handleFieldBlur={handleFieldBlur}
            debouncedSaveData={debouncedSaveData}
            setLastEditedAt={setLastEditedAt}
            labels={vietnamLabels.passport}
            config={vietnamConfig.passport}
          />

          {/* Personal Info Section */}
          <PersonalInfoSection
            isExpanded={expandedSections.personalInfo}
            onToggle={() => toggleSection('personalInfo')}
            fieldCount={getFieldCount('personalInfo')}
            occupation={occupation}
            customOccupation={customOccupation}
            cityOfResidence={cityOfResidence}
            countryOfResidence={countryOfResidence}
            phoneCode={phoneCode}
            phoneNumber={phoneNumber}
            email={email}
            setOccupation={setOccupation}
            setCustomOccupation={setCustomOccupation}
            setCityOfResidence={setCityOfResidence}
            setCountryOfResidence={setCountryOfResidence}
            setPhoneCode={setPhoneCode}
            setPhoneNumber={setPhoneNumber}
            setEmail={setEmail}
            errors={errors}
            warnings={warnings}
            handleFieldBlur={handleFieldBlur}
            debouncedSaveData={debouncedSaveData}
            labels={vietnamLabels.personalInfo}
            config={vietnamConfig.personalInfo}
          />

          {/* Funds Section */}
          <FundsSection
            isExpanded={expandedSections.funds}
            onToggle={() => toggleSection('funds')}
            fieldCount={getFieldCount('funds')}
            funds={funds}
            addFund={addFund}
            handleFundItemPress={handleFundItemPress}
            labels={vietnamLabels.funds}
            config={vietnamConfig.funds}
          />

          {/* Travel Details Section */}
          <TravelDetailsSection
            isExpanded={expandedSections.travelDetails}
            onToggle={() => toggleSection('travelDetails')}
            fieldCount={getFieldCount('travelDetails')}
            travelPurpose={travelPurpose}
            customTravelPurpose={customTravelPurpose}
            recentStayCountry={recentStayCountry}
            boardingCountry={boardingCountry}
            arrivalFlightNumber={arrivalFlightNumber}
            arrivalDate={arrivalDate}
            flightTicketPhoto={flightTicketPhoto}
            departureFlightNumber={departureFlightNumber}
            departureDate={departureDate}
            departureFlightTicketPhoto={departureFlightTicketPhoto}
            isTransitPassenger={isTransitPassenger}
            accommodationType={accommodationType}
            customAccommodationType={customAccommodationType}
            province={province}
            district={district}
            districtId={districtId}
            hotelAddress={hotelAddress}
            hotelReservationPhoto={hotelReservationPhoto}
            setTravelPurpose={setTravelPurpose}
            setCustomTravelPurpose={setCustomTravelPurpose}
            setRecentStayCountry={setRecentStayCountry}
            setBoardingCountry={setBoardingCountry}
            setArrivalFlightNumber={setArrivalFlightNumber}
            setArrivalDate={setArrivalDate}
            setFlightTicketPhoto={setFlightTicketPhoto}
            setDepartureFlightNumber={setDepartureFlightNumber}
            setDepartureDate={setDepartureDate}
            setDepartureFlightTicketPhoto={setDepartureFlightTicketPhoto}
            setIsTransitPassenger={setIsTransitPassenger}
            setAccommodationType={setAccommodationType}
            setCustomAccommodationType={setCustomAccommodationType}
            setProvince={setProvince}
            setDistrict={setDistrict}
            setDistrictId={setDistrictId}
            setHotelAddress={setHotelAddress}
            setHotelReservationPhoto={setHotelReservationPhoto}
            errors={errors}
            warnings={warnings}
            handleFieldBlur={handleFieldBlur}
            debouncedSaveData={debouncedSaveData}
            getProvinceData={vietnamProvinces}
            getDistrictData={getDistrictsByProvince}
            handleFlightTicketPhotoUpload={handleFlightTicketPhotoUpload}
            handleDepartureFlightTicketPhotoUpload={handleDepartureFlightTicketPhotoUpload}
            handleHotelReservationPhotoUpload={handleHotelReservationPhotoUpload}
            labels={vietnamLabels.travelDetails}
            config={vietnamConfig.travelDetails}
          />

          {/* Submit Button */}
          <BaseCard padding="$md" marginTop="$lg">
            <BaseButton
              onPress={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
            >
              {vietnamLabels.progress.submit}
            </BaseButton>

            {lastEditedAt && (
              <TamaguiText
                fontSize="$1"
                color="$textSecondary"
                textAlign="center"
                marginTop="$sm"
              >
                Last saved: {lastEditedAt.toLocaleString('zh-CN')}
              </TamaguiText>
            )}
          </BaseCard>

          {/* Bottom Padding */}
          <YStack height={40} />
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VietnamTravelInfoScreen;
