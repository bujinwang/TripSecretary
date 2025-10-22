// 入境通 - Japan Travel Info Screen (日本入境信息)
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import BackButton from '../../components/BackButton';
import CollapsibleSection from '../../components/CollapsibleSection';
import PassportNameInput from '../../components/PassportNameInput';
import NationalitySelector from '../../components/NationalitySelector';
import DateTimeInput from '../../components/DateTimeInput';
import Input from '../../components/Input';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import TravelPurposeSelector from '../../components/TravelPurposeSelector';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';

// Import secure data models and services
import PassportDataService from '../../services/data/PassportDataService';
import { getPhoneCode } from '../../data/phoneCodes';
import JapanFormHelper from '../../utils/japan/JapanFormHelper';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const JapanTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const passport = PassportDataService.toSerializablePassport(rawPassport);
  const { t, language } = useLocale();
  
  // Debug: Log current language
  console.log('=== JapanTravelInfoScreen Language Debug ===');
  console.log('Current language:', language);
  console.log('Sample translation test:', t('japan.travelInfo.headerTitle'));
  console.log('Back button translation:', t('common.back'));

  // UI State - will be populated from PassportDataService
  const [passportNo, setPassportNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Personal Info State
  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');

  // Fund Information State
  const [funds, setFunds] = useState([]);

  // Default arrival date: tomorrow's date (to ensure it's always in the future for validation)
  const getDefaultArrivalDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Tomorrow's date to ensure it's always in the future for validation
    const defaultDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    console.log('📅 Default arrival date for Japan:', defaultDate);
    return defaultDate;
  };

  // Japan-specific Travel Info State
  const [travelPurpose, setTravelPurpose] = useState('Tourism');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState(getDefaultArrivalDate());
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationAddress, setAccommodationAddress] = useState('');
  const [accommodationPhone, setAccommodationPhone] = useState('');
  const [lengthOfStay, setLengthOfStay] = useState('');

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null); // 'passport', 'personal', 'funds', 'travel', or null

  // Fund Item Modal State
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
  const [newFundItemType, setNewFundItemType] = useState(null);

  // Count filled fields for each section
  const getFieldCount = (section) => {
    let filled = 0;
    let total = 0;

    switch (section) {
      case 'passport':
        const passportFields = [fullName, nationality, passportNo, dob, expiryDate];
        total = passportFields.length;
        filled = passportFields.filter(field => field && field.toString().trim() !== '').length;
        break;
      
      case 'personal':
        const personalFields = [occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email, gender];
        total = personalFields.length;
        filled = personalFields.filter(field => field && field.toString().trim() !== '').length;
        break;
      
      case 'funds':
        // For funds, count the number of fund items added
        total = 1; // At least one fund proof is expected
        filled = funds.length > 0 ? 1 : 0;
        break;
      
      case 'travel':
        // Japan-specific travel fields
        const purposeFilled = travelPurpose === 'Other' 
          ? (customTravelPurpose && customTravelPurpose.trim() !== '')
          : (travelPurpose && travelPurpose.trim() !== '');
        
        const travelFields = [
          purposeFilled,
          arrivalFlightNumber,
          arrivalDate,
          lengthOfStay
        ];
        // Only include accommodation fields if not a transit passenger
        if (!isTransitPassenger) {
          travelFields.push(accommodationAddress, accommodationPhone);
        }
        total = travelFields.length;
        filled = travelFields.filter(field => {
          if (typeof field === 'boolean') return field;
          return field && field.toString().trim() !== '';
        }).length;
        break;
    }

    return { filled, total };
  };

  // Check if all fields are filled and valid
  const isFormValid = () => {
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    return passportCount.filled === passportCount.total &&
           personalCount.filled === personalCount.total &&
           fundsCount.filled === fundsCount.total &&
           travelCount.filled === travelCount.total;
  };

  // Handle field blur - validate and save data
  const handleFieldBlur = async (fieldName, value) => {
    try {
      console.log('=== HANDLE FIELD BLUR (JAPAN) ===');
      console.log('Field:', fieldName);
      console.log('Value:', value);

      // Basic validation for the field
      let isValid = true;
      let errorMessage = '';

      // Validate the field
      const validationError = validateField(fieldName, value);
      if (validationError) {
        isValid = false;
        errorMessage = validationError;
      }

      console.log('Validation result:', isValid ? 'VALID' : 'INVALID');
      if (!isValid) {
        console.log('Error message:', errorMessage);
      }

      // Update errors state
      setErrors(prev => ({
        ...prev,
        [fieldName]: isValid ? '' : errorMessage
      }));

      // Save data if valid (matching Thailand's pattern)
      if (isValid) {
        console.log('Validation passed, saving data...');
        await saveDataToSecureStorage();
      } else {
        console.log('Skipping save due to validation error');
      }
    } catch (error) {
      console.error('Failed to validate and save field:', error);
      console.error('Error stack:', error.stack);
    }
  };

  // Validate individual fields
  const validateField = (fieldName, value) => {
    // Allow empty values for progressive data entry
    if (!value || value.toString().trim() === '') {
      return null; // No error for empty fields - they just won't count as "filled"
    }

    // Minimal validation matching Thailand's approach
    switch (fieldName) {
      case 'passportNo':
        // Passport number should be 6-12 alphanumeric characters
        if (!/^[A-Z0-9]{6,12}$/i.test(value.replace(/\s/g, ''))) {
          return 'Invalid passport number format';
        }
        break;
      
      case 'dob':
      case 'expiryDate':
        // Validate date format YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return 'Invalid date format (YYYY-MM-DD)';
        }
        break;
      
      case 'email':
        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format';
        }
        break;
      
      case 'phoneNumber':
      case 'accommodationPhone':
        // Phone number validation (basic)
        const cleanPhone = value.replace(/[^\d+\s-()]/g, '');
        if (!/^[\+]?[\d\s\-\(\)]{7,}$/.test(cleanPhone)) {
          return 'Invalid phone number format';
        }
        break;
    }

    return null;
  };

  // Load data from PassportDataService on screen mount and when screen gains focus
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const userId = passport?.id || 'user_001';
        
        console.log('JapanTravelInfoScreen: Loading data for userId:', userId);
        
        // Initialize PassportDataService if needed
        await PassportDataService.initialize(userId);
        
        // Load existing data from PassportDataService
        const [passportData, personalInfo, travelInfo, fundItems] = await Promise.all([
          PassportDataService.getPassport(userId).catch(err => {
            console.warn('Failed to load passport data:', err);
            return null;
          }),
          PassportDataService.getPersonalInfo(userId).catch(err => {
            console.warn('Failed to load personal info:', err);
            return null;
          }),
          PassportDataService.getTravelInfo(userId, 'japan').catch(err => {
            console.warn('Failed to load travel info:', err);
            return null;
          }),
          PassportDataService.getFundItems(userId).catch(err => {
            console.warn('Failed to load fund items:', err);
            return [];
          })
        ]);

        console.log('JapanTravelInfoScreen: Loaded passport data:', passportData ? 'Found' : 'Not found');
        console.log('JapanTravelInfoScreen: Loaded personal info:', personalInfo ? 'Found' : 'Not found');
        console.log('JapanTravelInfoScreen: Loaded travel info:', travelInfo ? 'Found' : 'Not found');
        console.log('JapanTravelInfoScreen: Loaded fund items:', fundItems?.length || 0);

        // Populate passport fields
        // PassportDataService returns Passport model instances with standard field names
        if (passportData) {
          const passportFields = {
            passportNumber: passportData.passportNumber,
            fullName: passportData.fullName,
            nationality: passportData.nationality,
            dateOfBirth: passportData.dateOfBirth,
            expiryDate: passportData.expiryDate
          };
          console.log('Setting passport fields:', JSON.stringify(passportFields, null, 2));
          setPassportNo(passportData.passportNumber || '');
          setFullName(passportData.fullName || '');
          setNationality(passportData.nationality || '');
          setDob(passportData.dateOfBirth || '');
          setExpiryDate(passportData.expiryDate || '');
        }

        // Populate personal info fields
        // Note: PersonalInfo model uses provinceCity and countryRegion
        if (personalInfo) {
          setOccupation(personalInfo.occupation || '');
          setCityOfResidence(personalInfo.provinceCity || '');
          setResidentCountry(personalInfo.countryRegion || '');
          // Auto-populate phone code from country if not already set
          const savedPhoneCode = personalInfo.phoneCode || '';
          const autoPhoneCode = savedPhoneCode || getPhoneCode(personalInfo.countryRegion || '');
          setPhoneCode(autoPhoneCode);
          setPhoneNumber(personalInfo.phoneNumber || '');
          setEmail(personalInfo.email || '');
          // Load gender from personal info, fallback to passport data
          setGender(personalInfo.gender || passportData?.gender || '');
        } else if (passportData?.gender) {
          // If no personal info but passport has gender, use it
          setGender(passportData.gender);
        }

        // Populate fund items
        if (fundItems && Array.isArray(fundItems)) {
          setFunds(fundItems);
        }

        // Populate Japan-specific travel info
        if (travelInfo) {
          console.log('Loading travel info:', JSON.stringify({
            travelPurpose: travelInfo.travelPurpose,
            arrivalFlightNumber: travelInfo.arrivalFlightNumber,
            arrivalArrivalDate: travelInfo.arrivalArrivalDate,
            hotelAddress: travelInfo.hotelAddress,
            accommodationPhone: travelInfo.accommodationPhone,
            lengthOfStay: travelInfo.lengthOfStay
          }, null, 2));
          
          // Check if travel purpose is a predefined option
          const predefinedPurposes = ['TOURISM', 'BUSINESS', 'VISITING_RELATIVES', 'TRANSIT'];
          const loadedPurpose = travelInfo.travelPurpose || 'TOURISM';
          if (predefinedPurposes.includes(loadedPurpose)) {
            setTravelPurpose(loadedPurpose);
            setCustomTravelPurpose('');
          } else {
            // Custom purpose - set to OTHER and store custom value
            setTravelPurpose('OTHER');
            setCustomTravelPurpose(loadedPurpose);
          }
          setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
          // Map arrivalArrivalDate back to arrivalDate
          setArrivalDate(travelInfo.arrivalArrivalDate || getDefaultArrivalDate());
          setIsTransitPassenger(travelInfo.isTransitPassenger || false);
          // Map hotelAddress back to accommodationAddress
          setAccommodationAddress(travelInfo.hotelAddress || '');
          // Use accommodationPhone column
          setAccommodationPhone(travelInfo.accommodationPhone || '');
          // Use lengthOfStay column
          setLengthOfStay(travelInfo.lengthOfStay || '');
        } else {
          console.log('No travel info found, using defaults');
          // No existing travel info - set default arrival date
          setArrivalDate(getDefaultArrivalDate());
        }

        console.log('JapanTravelInfoScreen: Data loading completed successfully');

      } catch (error) {
        console.error('Error loading Japan travel info data:', error);
        Alert.alert(
          t('japan.travelInfo.errors.loadingFailed'),
          t('japan.travelInfo.errors.loadingFailedMessage'),
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Add focus listener to reload data when screen comes back into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('JapanTravelInfoScreen: Screen gained focus, reloading data');
      loadData();
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, [passport?.id, navigation]);

  // Save data to PassportDataService
  const saveDataToSecureStorage = async () => {
    try {
      const userId = passport?.id || 'user_001';
      console.log('=== SAVING DATA TO SECURE STORAGE (JAPAN) ===');
      console.log('userId:', userId);
      console.log('Passport data:', { passportNo, fullName, nationality, dob, expiryDate });

      // Get existing passport first to ensure we're updating the right one
      const existingPassport = await PassportDataService.getPassport(userId);
      console.log('Existing passport:', existingPassport);

      // Save passport data - only include non-empty fields
      const passportUpdates = {};
      if (passportNo && passportNo.trim()) passportUpdates.passportNumber = passportNo;
      if (fullName && fullName.trim()) passportUpdates.fullName = fullName;
      if (nationality && nationality.trim()) passportUpdates.nationality = nationality;
      if (dob && dob.trim()) passportUpdates.dateOfBirth = dob;
      if (expiryDate && expiryDate.trim()) passportUpdates.expiryDate = expiryDate;
      if (gender && gender.trim()) passportUpdates.gender = gender;

      if (Object.keys(passportUpdates).length > 0) {
        console.log('Saving passport updates:', passportUpdates);
        if (existingPassport && existingPassport.id) {
          console.log('Updating existing passport with ID:', existingPassport.id);
          await PassportDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
          console.log('Passport data updated successfully');
        } else {
          console.log('Creating new passport for userId:', userId);
          await PassportDataService.savePassport(passportUpdates, userId, { skipValidation: true });
          console.log('Passport data saved successfully');
        }
      }

      // Save personal info data - only include non-empty fields
      const personalInfoUpdates = {};
      if (phoneNumber && phoneNumber.trim()) personalInfoUpdates.phoneNumber = phoneNumber;
      if (email && email.trim()) personalInfoUpdates.email = email;
      if (occupation && occupation.trim()) personalInfoUpdates.occupation = occupation;
      if (cityOfResidence && cityOfResidence.trim()) personalInfoUpdates.provinceCity = cityOfResidence;
      if (residentCountry && residentCountry.trim()) personalInfoUpdates.countryRegion = residentCountry;

      if (Object.keys(personalInfoUpdates).length > 0) {
        console.log('Saving personal info updates:', personalInfoUpdates);
        await PassportDataService.upsertPersonalInfo(userId, personalInfoUpdates);
        console.log('Personal info saved successfully');
      }

      // Save travel info data - Map to correct database field names
      console.log('Current travel info state:', {
        travelPurpose,
        customTravelPurpose,
        arrivalFlightNumber,
        arrivalDate,
        accommodationAddress,
        accommodationPhone,
        lengthOfStay
      });
      
      const travelInfoUpdates = {};
      // If "OTHER" is selected, use custom purpose; otherwise use selected purpose
      const finalTravelPurpose = travelPurpose === 'OTHER' && customTravelPurpose.trim() 
        ? customTravelPurpose.trim() 
        : travelPurpose;
      if (finalTravelPurpose && finalTravelPurpose.trim()) travelInfoUpdates.travelPurpose = finalTravelPurpose;
      if (arrivalFlightNumber && arrivalFlightNumber.trim()) travelInfoUpdates.arrivalFlightNumber = arrivalFlightNumber;
      // Map arrivalDate to arrivalArrivalDate (database field name)
      if (arrivalDate && arrivalDate.trim()) travelInfoUpdates.arrivalArrivalDate = arrivalDate;
      travelInfoUpdates.isTransitPassenger = isTransitPassenger;
      // Map accommodationAddress to hotelAddress (database field name)
      if (!isTransitPassenger && accommodationAddress && accommodationAddress.trim()) travelInfoUpdates.hotelAddress = accommodationAddress;
      // Use new accommodationPhone column
      if (!isTransitPassenger && accommodationPhone && accommodationPhone.trim()) travelInfoUpdates.accommodationPhone = accommodationPhone;
      // Use new lengthOfStay column
      if (lengthOfStay && lengthOfStay.trim()) travelInfoUpdates.lengthOfStay = lengthOfStay;

      if (Object.keys(travelInfoUpdates).length > 0) {
        console.log('Saving travel info updates:', JSON.stringify(travelInfoUpdates, null, 2));
        await PassportDataService.updateTravelInfo(userId, 'japan', travelInfoUpdates);
        console.log('Travel info saved successfully');
      } else {
        console.log('No travel info updates to save');
      }

      console.log('=== DATA SAVED SUCCESSFULLY (JAPAN) ===');
      // Fund items are saved separately when added/modified

    } catch (error) {
      console.error('Error saving Japan travel info data:', error);
      console.error('Error details:', error.message, error.stack);
      throw error;
    }
  };

  // Handle continue button press
  const handleContinue = async () => {
    if (!isFormValid()) {
      Alert.alert(t('common.error'), t('japan.travelInfo.errors.completeAllFields'));
      return;
    }

    try {
      await saveDataToSecureStorage();
      
      // Navigate to ResultScreen with Japan context
      navigation.navigate('ResultScreen', {
        userId: passport?.id || 'user_001',
        destination: 'japan',
        context: 'manual_entry_guide'
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('japan.travelInfo.errors.saveFailed'));
    }
  };

  // Handle section toggle
  const handleSectionToggle = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Fund item handlers
  const handleFundItemPress = (fundItem) => {
    // Convert FundItem instance to plain object to ensure all properties are accessible
    const fundItemData = fundItem.toJSON ? fundItem.toJSON() : fundItem;
    console.log('[JapanTravelInfoScreen] Opening fund item detail:', {
      id: fundItemData.id,
      type: fundItemData.type,
      hasPhotoUri: !!fundItemData.photoUri,
    });
    setSelectedFundItem(fundItemData);
    setFundItemModalVisible(true);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      // Refresh fund items list
      const userId = passport?.id || 'user_001';
      const items = await PassportDataService.getFundItems(userId);
      console.log('Refreshed fund items after update:', items);
      setFunds(items || []);
      setFundItemModalVisible(false);
      setSelectedFundItem(null);
    } catch (error) {
      console.error('Error refreshing fund items after update:', error);
    }
  };

  const handleFundItemDelete = async (fundItemId) => {
    try {
      // Refresh fund items list
      const userId = passport?.id || 'user_001';
      const items = await PassportDataService.getFundItems(userId);
      console.log('Refreshed fund items after delete:', items);
      setFunds(items || []);
      setFundItemModalVisible(false);
      setSelectedFundItem(null);
    } catch (error) {
      console.error('Error refreshing fund items after delete:', error);
    }
  };

  const handleFundItemModalClose = () => {
    setFundItemModalVisible(false);
    setSelectedFundItem(null);
    setIsCreatingFundItem(false);
    setNewFundItemType(null);
  };

  const handleAddFundItem = () => {
    showFundItemTypeSelector();
  };

  const showFundItemTypeSelector = () => {
    Alert.alert(
      t('profile.funding.selectType', { defaultValue: 'Select Fund Item Type' }),
      t('profile.funding.selectTypeMessage', { defaultValue: 'Choose the type of fund item to add' }),
      [
        { 
          text: t('fundItem.types.CASH', { defaultValue: 'Cash' }), 
          onPress: () => handleCreateFundItem('CASH') 
        },
        { 
          text: t('fundItem.types.BANK_CARD', { defaultValue: 'Bank Card' }), 
          onPress: () => handleCreateFundItem('BANK_CARD') 
        },
        { 
          text: t('fundItem.types.DOCUMENT', { defaultValue: 'Supporting Document' }), 
          onPress: () => handleCreateFundItem('DOCUMENT') 
        },
        { 
          text: t('common.cancel', { defaultValue: 'Cancel' }), 
          style: 'cancel' 
        }
      ]
    );
  };

  const handleCreateFundItem = (type) => {
    setNewFundItemType(type);
    setIsCreatingFundItem(true);
    setFundItemModalVisible(true);
  };

  const handleFundItemCreate = async (newItem) => {
    try {
      // Refresh fund items list
      const userId = passport?.id || 'user_001';
      const items = await PassportDataService.getFundItems(userId);
      console.log('Refreshed fund items after create:', items);
      setFunds(items || []);
      setFundItemModalVisible(false);
      setIsCreatingFundItem(false);
      setNewFundItemType(null);
    } catch (error) {
      console.error('Error refreshing fund items after create:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('japan.travelInfo.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('japan.travelInfo.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇯🇵</Text>
          <Text style={styles.title}>{t('japan.travelInfo.title')}</Text>
          <Text style={styles.subtitle}>{t('japan.travelInfo.subtitle')}</Text>
          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>{t('japan.travelInfo.privacyNote')}</Text>
          </View>
        </View>

        {/* Passport Information Section */}
        <CollapsibleSection
          title={t('japan.travelInfo.sections.passport')}
          expanded={expandedSection === 'passport'}
          onToggle={(expanded) => setExpandedSection(expanded ? 'passport' : null)}
          fieldCount={getFieldCount('passport')}
          style={styles.section}
        >
          <View style={styles.sectionContent}>
            <PassportNameInput
              label={t('japan.travelInfo.fields.passportName')}
              value={fullName}
              onChangeText={setFullName}
              onBlur={() => handleFieldBlur('fullName', fullName)}
              placeholder={t('japan.travelInfo.fields.passportNamePlaceholder')}
              error={errors.fullName}
              errorMessage={errors.fullName}
            />

            <NationalitySelector
              label={t('japan.travelInfo.fields.nationality')}
              value={nationality}
              onValueChange={(value) => {
                setNationality(value);
                handleFieldBlur('nationality', value);
              }}
              placeholder={t('japan.travelInfo.fields.nationalityPlaceholder')}
              error={errors.nationality}
              errorMessage={errors.nationality}
            />

            <Input
              label={t('japan.travelInfo.fields.passportNumber')}
              value={passportNo}
              onChangeText={setPassportNo}
              onBlur={() => handleFieldBlur('passportNo', passportNo)}
              placeholder={t('japan.travelInfo.fields.passportNumberPlaceholder')}
              autoCapitalize="characters"
              error={errors.passportNo}
              errorMessage={errors.passportNo}
              helpText={t('japan.travelInfo.fields.passportNumberHelp')}
            />

            <DateTimeInput
              label={t('japan.travelInfo.fields.dateOfBirth')}
              value={dob}
              onChangeText={setDob}
              onBlur={() => handleFieldBlur('dob', dob)}
              mode="date"
              dateType="past"
              error={errors.dob}
              errorMessage={errors.dob}
              helpText={t('japan.travelInfo.fields.dateOfBirthHelp')}
            />

            <DateTimeInput
              label={t('japan.travelInfo.fields.expiryDate')}
              value={expiryDate}
              onChangeText={setExpiryDate}
              onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
              mode="date"
              dateType="future"
              error={errors.expiryDate}
              errorMessage={errors.expiryDate}
              helpText={t('japan.travelInfo.fields.expiryDateHelp')}
            />
          </View>
        </CollapsibleSection>

        {/* Personal Information Section */}
        <CollapsibleSection
          title={t('japan.travelInfo.sections.personal')}
          expanded={expandedSection === 'personal'}
          onToggle={(expanded) => setExpandedSection(expanded ? 'personal' : null)}
          fieldCount={getFieldCount('personal')}
          style={styles.section}
        >
          <View style={styles.sectionContent}>
            <Input
              label={t('japan.travelInfo.fields.occupation')}
              value={occupation}
              onChangeText={setOccupation}
              onBlur={() => handleFieldBlur('occupation', occupation)}
              placeholder={t('japan.travelInfo.fields.occupationPlaceholder')}
              error={errors.occupation}
              errorMessage={errors.occupation}
            />

            <Input
              label={t('japan.travelInfo.fields.cityOfResidence')}
              value={cityOfResidence}
              onChangeText={setCityOfResidence}
              onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
              placeholder={t('japan.travelInfo.fields.cityOfResidencePlaceholder')}
              error={errors.cityOfResidence}
              errorMessage={errors.cityOfResidence}
            />

            <NationalitySelector
              label={t('japan.travelInfo.fields.residentCountry')}
              value={residentCountry}
              onValueChange={(value) => {
                setResidentCountry(value);
                // Auto-populate phone code based on country
                const code = getPhoneCode(value);
                if (code) {
                  setPhoneCode(code);
                }
                handleFieldBlur('residentCountry', value);
              }}
              placeholder={t('japan.travelInfo.fields.residentCountryPlaceholder')}
              error={errors.residentCountry}
              errorMessage={errors.residentCountry}
            />

            <View style={styles.phoneRow}>
              <View style={styles.phoneCodeContainer}>
                <Input
                  label={t('japan.travelInfo.fields.phoneCode')}
                  value={phoneCode}
                  onChangeText={setPhoneCode}
                  onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
                  placeholder={t('japan.travelInfo.fields.phoneCodePlaceholder')}
                  error={errors.phoneCode}
                  errorMessage={errors.phoneCode}
                  style={styles.phoneCodeInput}
                />
              </View>
              <View style={styles.phoneNumberContainer}>
                <Input
                  label={t('japan.travelInfo.fields.phoneNumber')}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
                  placeholder={t('japan.travelInfo.fields.phoneNumberPlaceholder')}
                  keyboardType="phone-pad"
                  error={errors.phoneNumber}
                  errorMessage={errors.phoneNumber}
                />
              </View>
            </View>

            <Input
              label={t('japan.travelInfo.fields.email')}
              value={email}
              onChangeText={setEmail}
              onBlur={() => handleFieldBlur('email', email)}
              placeholder={t('japan.travelInfo.fields.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              errorMessage={errors.email}
            />

            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>{t('japan.travelInfo.fields.gender')}</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'Male' && styles.genderButtonSelected
                  ]}
                  onPress={() => {
                    setGender('Male');
                    handleFieldBlur('gender', 'Male');
                  }}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'Male' && styles.genderButtonTextSelected
                  ]}>
                    {t('japan.travelInfo.fields.genderMale')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'Female' && styles.genderButtonSelected
                  ]}
                  onPress={() => {
                    setGender('Female');
                    handleFieldBlur('gender', 'Female');
                  }}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'Female' && styles.genderButtonTextSelected
                  ]}>
                    {t('japan.travelInfo.fields.genderFemale')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'Undefined' && styles.genderButtonSelected
                  ]}
                  onPress={() => {
                    setGender('Undefined');
                    handleFieldBlur('gender', 'Undefined');
                  }}
                >
                  <Text style={[
                    styles.genderButtonText,
                    gender === 'Undefined' && styles.genderButtonTextSelected
                  ]}>
                    {t('japan.travelInfo.fields.genderUndefined')}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>
          </View>
        </CollapsibleSection>

        {/* Fund Information Section */}
        <CollapsibleSection
          title={t('japan.travelInfo.sections.funds')}
          expanded={expandedSection === 'funds'}
          onToggle={(expanded) => setExpandedSection(expanded ? 'funds' : null)}
          fieldCount={getFieldCount('funds')}
          style={styles.section}
        >
          <View style={styles.sectionContent}>
            {funds.length === 0 ? (
              <Text style={styles.emptyFundsText}>
                {t('japan.travelInfo.funds.emptyMessage', { defaultValue: 'No fund items added yet. Add at least one fund item to show proof of funds.' })}
              </Text>
            ) : (
              <View style={styles.fundsList}>
                {funds.map((item, index) => {
                  const isLast = index === funds.length - 1;

                  const typeKey = (item.itemType || item.type || 'OTHER').toUpperCase();
                  const typeMeta = {
                    CASH: { icon: '💵' },
                    BANK_CARD: { icon: '💳' },
                    CREDIT_CARD: { icon: '💳' },
                    DOCUMENT: { icon: '📄' },
                    BANK_BALANCE: { icon: '🏦' },
                    INVESTMENT: { icon: '📈' },
                  };
                  const defaultIcon = '💰';
                  const typeIcon = (typeMeta[typeKey] || {}).icon || defaultIcon;

                  const defaultTypeLabels = {
                    CASH: 'Cash',
                    BANK_CARD: 'Bank Card',
                    CREDIT_CARD: 'Bank Card',
                    DOCUMENT: 'Supporting Document',
                    BANK_BALANCE: 'Bank Balance',
                    INVESTMENT: 'Investment',
                    OTHER: 'Funding',
                  };
                  const typeLabel = t(`fundItem.types.${typeKey}`, {
                    defaultValue: defaultTypeLabels[typeKey] || defaultTypeLabels.OTHER,
                  });

                  const notProvidedLabel = t('fundItem.detail.notProvided', {
                    defaultValue: 'Not provided yet',
                  });

                  const descriptionValue = item.description || item.details || '';
                  const currencyValue = item.currency ? item.currency.toUpperCase() : '';

                  const normalizeAmount = (value) => {
                    if (value === null || value === undefined || value === '') return '';
                    if (typeof value === 'number' && Number.isFinite(value)) {
                      return value.toLocaleString();
                    }
                    if (typeof value === 'string') {
                      const trimmed = value.trim();
                      if (!trimmed) return '';
                      const parsed = Number(trimmed.replace(/,/g, ''));
                      return Number.isNaN(parsed) ? trimmed : parsed.toLocaleString();
                    }
                    return `${value}`;
                  };

                  const amountValue = normalizeAmount(item.amount);

                  const isAmountType = ['CASH', 'BANK_CARD', 'CREDIT_CARD', 'BANK_BALANCE', 'INVESTMENT'].includes(typeKey);
                  let displayText;

                  if (typeKey === 'DOCUMENT') {
                    displayText = descriptionValue || notProvidedLabel;
                  } else if (typeKey === 'BANK_CARD' || typeKey === 'CREDIT_CARD') {
                    const cardLabel = descriptionValue || notProvidedLabel;
                    const amountLabel = amountValue || notProvidedLabel;
                    const currencyLabel = currencyValue || notProvidedLabel;
                    displayText = `${cardLabel} • ${amountLabel} ${currencyLabel}`.trim();
                  } else if (isAmountType) {
                    const amountLabel = amountValue || notProvidedLabel;
                    const currencyLabel = currencyValue || notProvidedLabel;
                    displayText = `${amountLabel} ${currencyLabel}`.trim();
                  } else {
                    displayText = descriptionValue || amountValue || currencyValue || notProvidedLabel;
                  }

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.fundItemRow, !isLast && styles.fundItemRowDivider]}
                      onPress={() => handleFundItemPress(item)}
                      accessibilityRole="button"
                    >
                      <View style={styles.fundItemContent}>
                        <Text style={styles.fundItemIcon}>
                          {typeIcon}
                        </Text>
                        <View style={styles.fundItemDetails}>
                          <Text style={styles.fundItemType}>
                            {typeLabel}
                          </Text>
                          <Text style={styles.fundItemValue} numberOfLines={2}>
                            {displayText}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.rowArrow}>›</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Add Fund Item Button */}
            <TouchableOpacity
              style={styles.addFundItemButton}
              onPress={handleAddFundItem}
              accessibilityRole="button"
              accessibilityLabel={t('japan.travelInfo.funds.addButton', { defaultValue: 'Add Fund Item' })}
            >
              <Text style={styles.addFundItemIcon}>➕</Text>
              <Text style={styles.addFundItemText}>
                {t('japan.travelInfo.funds.addButton', { defaultValue: 'Add Fund Item' })}
              </Text>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>

        {/* Travel Information Section */}
        <CollapsibleSection
          title={t('japan.travelInfo.sections.travel')}
          expanded={expandedSection === 'travel'}
          onToggle={(expanded) => setExpandedSection(expanded ? 'travel' : null)}
          fieldCount={getFieldCount('travel')}
          style={styles.section}
        >
          <View style={styles.sectionContent}>
            {/* Travel Purpose Selector */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t('japan.travelInfo.fields.travelPurpose')}</Text>
              <View style={styles.optionsContainer}>
                {[
                  { value: 'TOURISM', label: 'Tourism', icon: '🏖️' },
                  { value: 'BUSINESS', label: 'Business', icon: '💼' },
                  { value: 'VISITING_RELATIVES', label: 'Visiting relatives', icon: '👨‍👩‍👧‍👦' },
                  { value: 'TRANSIT', label: 'Transit', icon: '✈️' },
                  { value: 'OTHER', label: 'Other', icon: '✏️' },
                ].map((option) => {
                  const isActive = travelPurpose === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        isActive && styles.optionButtonActive,
                      ]}
                      onPress={async () => {
                        setTravelPurpose(option.value);
                        if (option.value !== 'OTHER') {
                          setCustomTravelPurpose('');
                        }
                        try {
                          await saveDataToSecureStorage();
                        } catch (error) {
                          console.error('Failed to save after purpose selection:', error);
                        }
                      }}
                    >
                      <Text style={styles.optionIcon}>{option.icon}</Text>
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
              {travelPurpose === 'OTHER' && (
                <Input
                  label={t('japan.travelInfo.fields.customTravelPurpose')}
                  value={customTravelPurpose}
                  onChangeText={setCustomTravelPurpose}
                  onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
                  placeholder={t('japan.travelInfo.fields.customTravelPurposePlaceholder')}
                  helpText="Please enter in English"
                  autoCapitalize="words"
                />
              )}
            </View>

            {/* Arrival Flight Number */}
            <Input
              label={t('japan.travelInfo.fields.arrivalFlightNumber')}
              value={arrivalFlightNumber}
              onChangeText={setArrivalFlightNumber}
              onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
              placeholder={t('japan.travelInfo.fields.arrivalFlightNumberPlaceholder')}
              autoCapitalize="characters"
              error={errors.arrivalFlightNumber}
              errorMessage={errors.arrivalFlightNumber}
            />

            {/* Arrival Date */}
            <DateTimeInput
              label={t('japan.travelInfo.fields.arrivalDate')}
              value={arrivalDate}
              onChangeText={setArrivalDate}
              onBlur={() => handleFieldBlur('arrivalDate', arrivalDate)}
              mode="date"
              dateType="future"
              error={errors.arrivalDate}
              errorMessage={errors.arrivalDate}
              helpText={t('japan.travelInfo.fields.arrivalDateHelp')}
            />

            {/* Transit Passenger Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={async () => {
                const newValue = !isTransitPassenger;
                setIsTransitPassenger(newValue);
                if (newValue) {
                  setAccommodationAddress('');
                  setAccommodationPhone('');
                }
                await saveDataToSecureStorage();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
                {isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                {t('japan.travelInfo.fields.transitPassenger', { defaultValue: '我是过境旅客，不在日本停留' })}
              </Text>
            </TouchableOpacity>

            {!isTransitPassenger && (
              <>
                {/* Accommodation Address (multiline) */}
                <Input
                  label={t('japan.travelInfo.fields.accommodationAddress')}
                  value={accommodationAddress}
                  onChangeText={setAccommodationAddress}
                  onBlur={() => handleFieldBlur('accommodationAddress', accommodationAddress)}
                  placeholder={t('japan.travelInfo.fields.accommodationAddressPlaceholder')}
                  multiline
                  numberOfLines={3}
                  error={errors.accommodationAddress}
                  errorMessage={errors.accommodationAddress}
                  helpText={t('japan.travelInfo.fields.accommodationAddressHelp')}
                />

                {/* Accommodation Phone */}
                <Input
                  label={t('japan.travelInfo.fields.accommodationPhone')}
                  value={accommodationPhone}
                  onChangeText={setAccommodationPhone}
                  onBlur={() => handleFieldBlur('accommodationPhone', accommodationPhone)}
                  placeholder={t('japan.travelInfo.fields.accommodationPhonePlaceholder')}
                  keyboardType="phone-pad"
                  error={errors.accommodationPhone}
                  errorMessage={errors.accommodationPhone}
                />
              </>
            )}

            {/* Length of Stay */}
            <Input
              label={t('japan.travelInfo.fields.lengthOfStay')}
              value={lengthOfStay}
              onChangeText={setLengthOfStay}
              onBlur={() => handleFieldBlur('lengthOfStay', lengthOfStay)}
              placeholder={t('japan.travelInfo.fields.lengthOfStayPlaceholder')}
              keyboardType="numeric"
              error={errors.lengthOfStay}
              errorMessage={errors.lengthOfStay}
            />
          </View>
        </CollapsibleSection>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              isFormValid() ? styles.continueButtonEnabled : styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!isFormValid()}
          >
            <Text style={[
              styles.continueButtonText,
              isFormValid() ? styles.continueButtonTextEnabled : styles.continueButtonTextDisabled
            ]}>
              {t('japan.travelInfo.continueButton')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Fund Item Detail Modal */}
      <FundItemDetailModal
        visible={fundItemModalVisible}
        fundItem={isCreatingFundItem ? null : selectedFundItem}
        isCreateMode={isCreatingFundItem}
        createItemType={newFundItemType}
        onClose={handleFundItemModalClose}
        onUpdate={handleFundItemUpdate}
        onCreate={handleFundItemCreate}
        onDelete={handleFundItemDelete}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  flag: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  privacyNote: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  privacyText: {
    ...typography.caption,
    color: '#2E7D32',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: spacing.md,
  },
  sectionContent: {
    paddingTop: spacing.md,
  },
  placeholderText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  continueButton: {
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: colors.primary,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueButtonText: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  continueButtonTextEnabled: {
    color: colors.white,
  },
  continueButtonTextDisabled: {
    color: colors.textSecondary,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  phoneCodeContainer: {
    flex: 1,
  },
  phoneNumberContainer: {
    flex: 2,
  },
  phoneCodeInput: {
    minWidth: 80,
  },
  genderContainer: {
    marginTop: spacing.md,
  },
  genderLabel: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    ...typography.body2,
    color: colors.text,
  },
  genderButtonTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  emptyFundsText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  fundsList: {
    marginBottom: spacing.md,
  },
  fundItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  fundItemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fundItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fundItemIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  fundItemDetails: {
    flex: 1,
  },
  fundItemType: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fundItemValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rowArrow: {
    ...typography.h3,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  addFundItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },
  addFundItemIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  addFundItemText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    margin: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  optionText: {
    ...typography.body2,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default JapanTravelInfoScreen;