
// 入境通 - Thailand Travel Info Screen (泰国入境信息)
import React, { useState, useEffect } from 'react';
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
import * as FileSystem from 'expo-file-system';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../components';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';

// Import secure data models and services
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import PassportDataService from '../../services/data/PassportDataService';
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const CollapsibleSection = ({ title, children, onScan, isExpanded, onToggle, fieldCount }) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const isComplete = fieldCount && fieldCount.filled === fieldCount.total;

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={handleToggle} activeOpacity={0.8}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {fieldCount && (
            <View style={[
              styles.fieldCountBadge,
              isComplete ? styles.fieldCountBadgeComplete : styles.fieldCountBadgeIncomplete
            ]}>
              <Text style={[
                styles.fieldCountText,
                isComplete ? styles.fieldCountTextComplete : styles.fieldCountTextIncomplete
              ]}>
                {fieldCount.filled}/{fieldCount.total}
              </Text>
            </View>
          )}
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {onScan && (
            <TouchableOpacity style={styles.scanButton} onPress={onScan}>
              <Text style={styles.scanIcon}>📸</Text>
              <Text style={styles.scanText}>扫描</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.sectionIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const ThailandTravelInfoScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};
  const { t } = useLocale();

  // Data model instances
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);

  // UI State (loaded from database, not from route params)
  const [passportNo, setPassportNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Personal Info State (loaded from database)
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || '')); // Initialize phone code based on passport nationality or empty
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Proof of Funds State
  const [funds, setFunds] = useState([]);

  // Travel Info State - Separate date and time fields
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDepartureAirport, setArrivalDepartureAirport] = useState('');
  const [arrivalDepartureDate, setArrivalDepartureDate] = useState('');
  const [arrivalDepartureTime, setArrivalDepartureTime] = useState('');
  const [arrivalArrivalAirport, setArrivalArrivalAirport] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState('');
  const [arrivalArrivalTime, setArrivalArrivalTime] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureAirport, setDepartureDepartureAirport] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState('');
  const [departureDepartureTime, setDepartureDepartureTime] = useState('');
  const [departureArrivalAirport, setDepartureArrivalAirport] = useState('');
  const [departureArrivalDate, setDepartureArrivalDate] = useState('');
  const [departureArrivalTime, setDepartureArrivalTime] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('passport'); // 'passport', 'personal', 'funds', 'travel', or null

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
        const personalFields = [occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email, sex];
        total = personalFields.length;
        filled = personalFields.filter(field => field && field.toString().trim() !== '').length;
        break;
      
      case 'funds':
        // For funds, count the number of fund items added
        total = 1; // At least one fund proof is expected
        filled = funds.length > 0 ? 1 : 0;
        break;
      
      case 'travel':
        // Thailand requires both arrival and departure flight info
        const travelFields = [
          arrivalFlightNumber, arrivalDepartureAirport, arrivalDepartureDate, arrivalDepartureTime,
          arrivalArrivalAirport, arrivalArrivalDate, arrivalArrivalTime,
          departureFlightNumber, departureDepartureAirport, departureDepartureDate, departureDepartureTime,
          departureArrivalAirport, departureArrivalDate, departureArrivalTime,
          hotelName, hotelAddress
        ];
        total = travelFields.length;
        filled = travelFields.filter(field => field && field.toString().trim() !== '').length;
        break;
    }

    return { filled, total };
  };

  // Check if all fields are filled and valid
  const isFormValid = () => {
    // Check all sections are complete
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    const allFieldsFilled = 
      passportCount.filled === passportCount.total &&
      personalCount.filled === personalCount.total &&
      fundsCount.filled === fundsCount.total &&
      travelCount.filled === travelCount.total;

    // Check no validation errors exist
    const noErrors = Object.keys(errors).length === 0;

    return allFieldsFilled && noErrors;
  };

  // Load saved data on component mount and when screen gains focus
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);
        const userId = passport?.id || 'default_user';
        
        // Initialize PassportDataService and trigger migration if needed
        try {
          await PassportDataService.initialize(userId);
        } catch (initError) {
          // Initialization failed, continue with route params
        }
        
        // Load all user data from centralized service
        const userData = await PassportDataService.getAllUserData(userId);
        console.log('=== LOADED USER DATA ===');
        console.log('userData:', userData);
        console.log('userData.passport:', userData?.passport);
        console.log('userData.personalInfo:', userData?.personalInfo);

        // Passport Info - prioritize centralized data, fallback to route params
        const passportInfo = userData?.passport;
        if (passportInfo) {
          console.log('Loading passport from database:', passportInfo);
          setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');
          setFullName(prev => {
            if (passportInfo.fullName && passportInfo.fullName.trim()) {
              return passportInfo.fullName;
            }
            if (prev && prev.trim()) {
              return prev;
            }
            if (passport?.nameEn && passport?.nameEn.trim()) {
              return passport.nameEn;
            }
            if (passport?.name && passport?.name.trim()) {
              return passport.name;
            }
            return '';
          });
          setNationality(passportInfo.nationality || passport?.nationality || '');
          setDob(passportInfo.dateOfBirth || passport?.dob || '');
          setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');
          
          // Store passport data model instance
          setPassportData(passportInfo);
        } else {
          console.log('No passport data in database, using route params');
          // Fallback to route params if no centralized data
          setPassportNo(passport?.passportNo || '');
          setFullName(prev => {
            if (prev && prev.trim()) {
              return prev;
            }
            if (passport?.nameEn && passport?.nameEn.trim()) {
              return passport.nameEn;
            }
            if (passport?.name && passport?.name.trim()) {
              return passport.name;
            }
            return '';
          });
          setNationality(passport?.nationality || '');
          setDob(passport?.dob || '');
          setExpiryDate(passport?.expiry || '');
        }

        // Personal Info - load from centralized data
        const personalInfo = userData?.personalInfo;
        if (personalInfo) {
          // Gender field mapping
          const loadedSex = passportInfo?.gender || passport?.sex || 'Male';
          setSex(loadedSex);
          
          setOccupation(personalInfo.occupation || '');
          setCityOfResidence(personalInfo.provinceCity || '');
          setResidentCountry(personalInfo.countryRegion || '');
          setPhoneNumber(personalInfo.phoneNumber || '');
          setEmail(personalInfo.email || '');
          
          // Set phone code based on resident country or nationality
          setPhoneCode(getPhoneCode(personalInfo.countryRegion || passport?.nationality || ''));
          
          // Store personal info data model instance
          setPersonalInfoData(personalInfo);
        } else {
          // Fallback to passport data for gender
          setSex(passport?.sex || 'Male');
          setPhoneCode(getPhoneCode(passport?.nationality || ''));
        }

        // Load fund items from database
        try {
          const fundItems = await PassportDataService.getFundItems(userId);
          console.log('Loaded fund items:', fundItems.length);
          
          // Convert FundItem instances to plain objects for state
          const fundsArray = fundItems.map(item => ({
            id: item.id,
            type: item.type,
            amount: item.amount,
            currency: item.currency,
            details: item.details,
            photo: item.photoUri
          }));
          
          setFunds(fundsArray);
        } catch (error) {
          console.error('Failed to load fund items:', error);
          setFunds([]);
        }

        // Travel Info - load from centralized data
        try {
          // Use destination.id for consistent lookup (not affected by localization)
          const destinationId = destination?.id || 'thailand';
          console.log('Loading travel info for destination:', destinationId);
          let travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);
          
          // Fallback: try loading with localized name if id lookup fails
          // This handles data saved before the fix
          if (!travelInfo && destination?.name) {
            console.log('Trying fallback with destination name:', destination.name);
            travelInfo = await PassportDataService.getTravelInfo(userId, destination.name);
          }
          
          if (travelInfo) {
            console.log('=== LOADING SAVED TRAVEL INFO ===');
            console.log('Travel info data:', JSON.stringify(travelInfo, null, 2));
            console.log('Hotel name from DB:', travelInfo.hotelName);
            console.log('Hotel address from DB:', travelInfo.hotelAddress);
            console.log('Flight number from DB:', travelInfo.arrivalFlightNumber);
            
            setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
            setArrivalDepartureAirport(travelInfo.arrivalDepartureAirport || '');
            setArrivalDepartureDate(travelInfo.arrivalDepartureDate || '');
            setArrivalDepartureTime(travelInfo.arrivalDepartureTime || '');
            setArrivalArrivalAirport(travelInfo.arrivalArrivalAirport || '');
            setArrivalArrivalDate(travelInfo.arrivalArrivalDate || '');
            setArrivalArrivalTime(travelInfo.arrivalArrivalTime || '');
            setDepartureFlightNumber(travelInfo.departureFlightNumber || '');
            setDepartureDepartureAirport(travelInfo.departureDepartureAirport || '');
            setDepartureDepartureDate(travelInfo.departureDepartureDate || '');
            setDepartureDepartureTime(travelInfo.departureDepartureTime || '');
            setDepartureArrivalAirport(travelInfo.departureArrivalAirport || '');
            setDepartureArrivalDate(travelInfo.departureArrivalDate || '');
            setDepartureArrivalTime(travelInfo.departureArrivalTime || '');
            setHotelName(travelInfo.hotelName || '');
            setHotelAddress(travelInfo.hotelAddress || '');
            
            console.log('Travel info loaded and state updated');
          } else {
            console.log('No saved travel info found');
          }
        } catch (travelInfoError) {
          console.log('Failed to load travel info:', travelInfoError);
          // Continue without travel info
        }
        
      } catch (error) {
        // Fallback to route params on error
        setPassportNo(passport?.passportNo || '');
        setFullName(prev => {
          if (prev && prev.trim()) {
            return prev;
          }
          if (passport?.nameEn && passport?.nameEn.trim()) {
            return passport.nameEn;
          }
          if (passport?.name && passport?.name.trim()) {
            return passport.name;
          }
          return '';
        });
        setNationality(passport?.nationality || '');
        setDob(passport?.dob || '');
        setExpiryDate(passport?.expiry || '');
        setSex(passport?.sex || 'Male');
        setPhoneCode(getPhoneCode(passport?.nationality || ''));
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedData();
  }, [passport]);

  // Add focus listener to reload data when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const reloadData = async () => {
        try {
          const userId = passport?.id || 'default_user';
          
          // Reload data from PassportDataService
          const userData = await PassportDataService.getAllUserData(userId);

          if (userData) {
            // Update passport data if available
            const passportInfo = userData.passport;
            if (passportInfo) {
              setPassportNo(prev => passportInfo.passportNumber || prev);
              setFullName(prev => {
                if (passportInfo.fullName && passportInfo.fullName.trim()) {
                  return passportInfo.fullName;
                }
                return prev;
              });
              setNationality(prev => passportInfo.nationality || prev);
              setDob(prev => passportInfo.dateOfBirth || prev);
              setExpiryDate(prev => passportInfo.expiryDate || prev);
              setPassportData(passportInfo);
            }

            // Update personal info if available
            const personalInfo = userData.personalInfo;
            if (personalInfo) {
              setSex(passportInfo?.gender || sex);
              setOccupation(personalInfo.occupation || occupation);
              setCityOfResidence(personalInfo.provinceCity || cityOfResidence);
              setResidentCountry(personalInfo.countryRegion || residentCountry);
              setPhoneNumber(personalInfo.phoneNumber || phoneNumber);
              setEmail(personalInfo.email || email);
              setPersonalInfoData(personalInfo);
            }
          }
        } catch (error) {
          // Failed to reload data on focus
        }
      };

      reloadData();
    });

    return unsubscribe;
  }, [navigation, passport]);

  // Add blur listener to save data when leaving the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Save all data when leaving the screen
      saveDataToSecureStorage();
    });

    return unsubscribe;
  }, [navigation]);





  // Function to validate and save field data on blur
  const handleFieldBlur = async (fieldName, fieldValue) => {
    try {
      console.log('=== HANDLE FIELD BLUR ===');
      console.log('Field:', fieldName);
      console.log('Value:', fieldValue);
      
      // Basic validation for the field
      let isValid = true;
      let errorMessage = '';

      switch (fieldName) {
        case 'passportNo':
          if (fieldValue && !/^[A-Z0-9]{6,12}$/i.test(fieldValue.replace(/\s/g, ''))) {
            isValid = false;
            errorMessage = 'Invalid passport number format';
          }
          break;
        case 'dob':
        case 'expiryDate':
          if (fieldValue && !/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Invalid date format (YYYY-MM-DD)';
          }
          break;
        case 'email':
          if (fieldValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Invalid email format';
          }
          break;
        case 'phoneNumber':
          if (fieldValue && !/^[\+]?[\d\s\-\(\)]{7,}$/.test(fieldValue.replace(/[^\d+\s-()]/g, ''))) {
            isValid = false;
            errorMessage = 'Invalid phone number format';
          }
          break;
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

      // Save data if valid
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

  // Save all data to secure storage
  const saveDataToSecureStorage = async () => {
    try {
      const userId = passport?.id || 'default_user';
      console.log('=== SAVING DATA TO SECURE STORAGE ===');
      console.log('userId:', userId);

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
      if (sex && sex.trim()) passportUpdates.gender = sex;

      if (Object.keys(passportUpdates).length > 0) {
        console.log('Saving passport updates:', passportUpdates);
        if (existingPassport && existingPassport.id) {
          console.log('Updating existing passport with ID:', existingPassport.id);
          const updated = await PassportDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
          console.log('Passport data updated successfully');
          
          // Update passportData state to track the correct passport ID
          setPassportData(updated);
        } else {
          console.log('Creating new passport for userId:', userId);
          const saved = await PassportDataService.savePassport(passportUpdates, userId, { skipValidation: true });
          console.log('Passport data saved successfully');
          
          // Update passportData state to track the new passport ID
          setPassportData(saved);
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
        const savedPersonalInfo = await PassportDataService.upsertPersonalInfo(userId, personalInfoUpdates);
        console.log('Personal info saved successfully');
        
        // Update personalInfoData state
        setPersonalInfoData(savedPersonalInfo);
      }

      // Save travel info data - only include non-empty fields
      const travelInfoUpdates = {};
      if (arrivalFlightNumber && arrivalFlightNumber.trim()) travelInfoUpdates.arrivalFlightNumber = arrivalFlightNumber;
      if (arrivalDepartureAirport && arrivalDepartureAirport.trim()) travelInfoUpdates.arrivalDepartureAirport = arrivalDepartureAirport;
      if (arrivalDepartureDate && arrivalDepartureDate.trim()) travelInfoUpdates.arrivalDepartureDate = arrivalDepartureDate;
      if (arrivalDepartureTime && arrivalDepartureTime.trim()) travelInfoUpdates.arrivalDepartureTime = arrivalDepartureTime;
      if (arrivalArrivalAirport && arrivalArrivalAirport.trim()) travelInfoUpdates.arrivalArrivalAirport = arrivalArrivalAirport;
      if (arrivalArrivalDate && arrivalArrivalDate.trim()) travelInfoUpdates.arrivalArrivalDate = arrivalArrivalDate;
      if (arrivalArrivalTime && arrivalArrivalTime.trim()) travelInfoUpdates.arrivalArrivalTime = arrivalArrivalTime;
      if (departureFlightNumber && departureFlightNumber.trim()) travelInfoUpdates.departureFlightNumber = departureFlightNumber;
      if (departureDepartureAirport && departureDepartureAirport.trim()) travelInfoUpdates.departureDepartureAirport = departureDepartureAirport;
      if (departureDepartureDate && departureDepartureDate.trim()) travelInfoUpdates.departureDepartureDate = departureDepartureDate;
      if (departureDepartureTime && departureDepartureTime.trim()) travelInfoUpdates.departureDepartureTime = departureDepartureTime;
      if (departureArrivalAirport && departureArrivalAirport.trim()) travelInfoUpdates.departureArrivalAirport = departureArrivalAirport;
      if (departureArrivalDate && departureArrivalDate.trim()) travelInfoUpdates.departureArrivalDate = departureArrivalDate;
      if (departureArrivalTime && departureArrivalTime.trim()) travelInfoUpdates.departureArrivalTime = departureArrivalTime;
      if (hotelName && hotelName.trim()) travelInfoUpdates.hotelName = hotelName;
      if (hotelAddress && hotelAddress.trim()) travelInfoUpdates.hotelAddress = hotelAddress;

      if (Object.keys(travelInfoUpdates).length > 0) {
        console.log('Saving travel info updates:', travelInfoUpdates);
        try {
          // Use destination.id for consistent lookup (not affected by localization)
          const destinationId = destination?.id || 'thailand';
          console.log('Calling PassportDataService.updateTravelInfo with:', { userId, destinationId });
          const savedTravelInfo = await PassportDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);
          console.log('Travel info saved successfully:', savedTravelInfo);
        } catch (travelInfoError) {
          console.error('Failed to save travel info:', travelInfoError);
          console.error('Travel info error stack:', travelInfoError.stack);
        }
      }

      console.log('=== DATA SAVED SUCCESSFULLY ===');
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
      console.error('Error details:', error.message, error.stack);
    }
  };

  const addFund = async (type) => {
    try {
      const userId = passport?.id || 'default_user';
      // Create new fund item in database
      const fundItem = await PassportDataService.saveFundItem({
        type,
        amount: '',
        currency: 'THB',
        details: '',
        photoUri: null,
      }, userId);
      
      console.log('Fund item created:', fundItem.id);
      
      // Add to local state
      const newFund = {
        id: fundItem.id,
        type: fundItem.type,
        amount: fundItem.amount,
        currency: fundItem.currency,
        details: fundItem.details,
        photo: fundItem.photoUri
      };
      
      setFunds([...funds, newFund]);
    } catch (error) {
      console.error('Failed to add fund item:', error);
      Alert.alert('Error', 'Failed to add fund item');
    }
  };

  const removeFund = async (id) => {
    try {
      const userId = passport?.id || 'default_user';
      // Delete from database
      const success = await PassportDataService.deleteFundItem(id, userId);
      
      if (success) {
        console.log('Fund item deleted:', id);
        
        // Remove from local state
        setFunds(funds.filter((fund) => fund.id !== id));
      } else {
        console.warn('Fund item not found:', id);
      }
    } catch (error) {
      console.error('Failed to delete fund item:', error);
      Alert.alert('Error', 'Failed to delete fund item');
    }
  };

  const updateFundField = async (id, key, value) => {
    try {
      const userId = passport?.id || 'default_user';
      // Update local state immediately for responsive UI
      const updatedFunds = funds.map((fund) =>
        (fund.id === id ? { ...fund, [key]: value } : fund)
      );
      setFunds(updatedFunds);
      
      // Find the updated fund
      const updatedFund = updatedFunds.find(f => f.id === id);
      if (!updatedFund) return;
      
      // Save to database
      // Map 'photo' key to 'photoUri' for the model
      const fundData = {
        type: updatedFund.type,
        amount: updatedFund.amount,
        currency: updatedFund.currency,
        details: updatedFund.details,
        photoUri: updatedFund.photo
      };
      
      await PassportDataService.saveFundItem({
        id: id,
        ...fundData
      }, userId);
      
      console.log('Fund item updated:', id, key);
    } catch (error) {
      console.error('Failed to update fund item:', error);
      // Optionally show error to user
    }
  };


  const validate = () => {
    // Disable all required checks to support progressive entry info filling
    setErrors({});
    return true;
  };

  const handleContinue = () => {
    if (!validate()) {
      return;
    }
  };

  const handleGoBack = async () => {
    // Save all data before going back
    await saveDataToSecureStorage();
    navigation.goBack();
  };

  const handleScanPassport = () => {
    // navigation.navigate('ScanPassport');
  };

  const handleScanTickets = () => {
    // TODO: Implement scan tickets
  };

  const handleScanHotel = () => {
    // TODO: Implement scan hotel
  };
  
  const handleTakePhoto = () => {
    // TODO: Implement take photo
  };

  // Function to copy image to permanent storage
  const copyImageToPermanentStorage = async (uri) => {
    try {
      // Create a permanent directory for fund photos if it doesn't exist
      const fundsDir = `${FileSystem.documentDirectory}funds/`;
      const dirInfo = await FileSystem.getInfoAsync(fundsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(fundsDir, { intermediates: true });
      }

      // Generate a unique filename
      const filename = `fund_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const permanentUri = fundsDir + filename;

      // Copy the image to permanent storage
      await FileSystem.copyAsync({
        from: uri,
        to: permanentUri
      });

      console.log('Image copied to permanent storage:', permanentUri);
      return permanentUri;
    } catch (error) {
      console.error('Failed to copy image to permanent storage:', error);
      // Return original URI as fallback
      return uri;
    }
  };

  const handleChoosePhoto = (id) => {
    Alert.alert(t('thailand.travelInfo.photo.choose', { defaultValue: '选择照片' }), '', [
      {
        text: t('thailand.travelInfo.photo.takePhoto', { defaultValue: '拍照' }),
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                t('thailand.travelInfo.photo.cameraPermission', { defaultValue: '需要相机权限' }), 
                t('thailand.travelInfo.photo.cameraPermissionMessage', { defaultValue: '请在设置中允许访问相机' })
              );
              return;
            }
              const permanentUri = await copyImageToPermanentStorage(result.assets[0].uri);
              updateFundField(id, 'photo', permanentUri);
          } catch (error) {
            console.error('Camera error:', error);
            Alert.alert(
              t('thailand.travelInfo.photo.cameraError', { defaultValue: '相机错误' }), 
              t('thailand.travelInfo.photo.cameraErrorMessage', { defaultValue: '模拟器不支持相机功能，请使用真机测试或选择相册照片' })
            );
          }
        },
      },
      {
        text: t('thailand.travelInfo.photo.fromLibrary', { defaultValue: '从相册选择' }),
        onPress: async () => {
          try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                t('thailand.travelInfo.photo.libraryPermission', { defaultValue: '需要相册权限' }), 
                t('thailand.travelInfo.photo.libraryPermissionMessage', { defaultValue: '请在设置中允许访问相册' })
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled) {
              const permanentUri = await copyImageToPermanentStorage(result.assets[0].uri);
              updateFundField(id, 'photo', permanentUri);
            }
          } catch (error) {
            console.error('Photo library error:', error);
            Alert.alert(
              t('thailand.travelInfo.photo.chooseFailed', { defaultValue: '选择照片失败' }), 
              t('thailand.travelInfo.photo.chooseFailedMessage', { defaultValue: '请重试' })
            );
          }
        },
      },
      { text: t('thailand.travelInfo.photo.cancel', { defaultValue: '取消' }), style: 'cancel' },
    ]);
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
          const isActive = sex === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                isActive && styles.optionButtonActive,
              ]}
              onPress={async () => {
                setSex(option.value);
                // Save data after gender selection
                try {
                  await saveDataToSecureStorage();
                } catch (error) {
                  console.error('Failed to save after gender selection:', error);
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

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('thailand.travelInfo.loading', { defaultValue: '正在加载数据...' })}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇹🇭</Text>
          <Text style={styles.title}>{t('thailand.travelInfo.title', { defaultValue: '填写泰国入境信息' })}</Text>
          <Text style={styles.subtitle}>{t('thailand.travelInfo.subtitle', { defaultValue: '请提供以下信息以完成入境卡生成' })}</Text>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('thailand.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        <CollapsibleSection 
          title={t('thailand.travelInfo.sections.passport', { defaultValue: '护照信息' })} 
          onScan={handleScanPassport}
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
           <PassportNameInput
             value={fullName}
             onChangeText={setFullName}
             onBlur={() => handleFieldBlur('fullName', fullName)}
             helpText="请填写汉语拼音（例如：LI, MAO）- 不要输入中文字符"
             error={!!errors.fullName}
             errorMessage={errors.fullName}
           />
           <NationalitySelector
             label="国籍"
             value={nationality}
             onValueChange={(code) => {
               setNationality(code);
               handleFieldBlur('nationality', code); // Save when nationality changes
             }}
             helpText="请选择您的国籍"
             error={!!errors.nationality}
             errorMessage={errors.nationality}
           />
           <Input label="护照号" value={passportNo} onChangeText={setPassportNo} onBlur={() => handleFieldBlur('passportNo', passportNo)} helpText="请输入您的护照号码" error={!!errors.passportNo} errorMessage={errors.passportNo} autoCapitalize="characters" testID="passport-number-input" />
           <Input label="出生日期" value={dob} onChangeText={setDob} onBlur={() => handleFieldBlur('dob', dob)} helpText="格式: YYYY-MM-DD" error={!!errors.dob} errorMessage={errors.dob} keyboardType="numeric" maxLength={10} maskType="date-ymd" />
           <Input label="护照有效期" value={expiryDate} onChangeText={setExpiryDate} onBlur={() => handleFieldBlur('expiryDate', expiryDate)} helpText="格式: YYYY-MM-DD" error={!!errors.expiryDate} errorMessage={errors.expiryDate} keyboardType="numeric" maxLength={10} maskType="date-ymd" />
         </CollapsibleSection>

        <CollapsibleSection 
          title={t('thailand.travelInfo.sections.personal', { defaultValue: '个人信息' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <Input label="职业" value={occupation} onChangeText={setOccupation} onBlur={() => handleFieldBlur('occupation', occupation)} helpText="请输入您的职业 (请使用英文)" error={!!errors.occupation} errorMessage={errors.occupation} autoCapitalize="words" />
           <Input label="居住城市" value={cityOfResidence} onChangeText={setCityOfResidence} onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)} helpText="请输入您居住的城市 (请使用英文)" error={!!errors.cityOfResidence} errorMessage={errors.cityOfResidence} autoCapitalize="words" />
           <NationalitySelector
             label="居住国家"
             value={residentCountry}
             onValueChange={(code) => {
               setResidentCountry(code);
               setPhoneCode(getPhoneCode(code));
               handleFieldBlur('residentCountry', code); // Save when country changes
             }}
             helpText="请选择您居住的国家"
             error={!!errors.residentCountry}
             errorMessage={errors.residentCountry}
           />
           <View style={styles.phoneInputContainer}>
             <Input
               label="国家代码"
               value={phoneCode}
               onChangeText={setPhoneCode}
               onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
               keyboardType="phone-pad"
               maxLength={5} // e.g., +886
               error={!!errors.phoneCode}
               errorMessage={errors.phoneCode}
               style={styles.phoneCodeInput}
             />
             <Input
               label="电话号码"
               value={phoneNumber}
               onChangeText={setPhoneNumber}
               onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
               keyboardType="phone-pad"
               helpText="请输入您的电话号码"
               error={!!errors.phoneNumber}
               errorMessage={errors.phoneNumber}
               style={styles.phoneInput}
             />
           </View>
           <Input label="电子邮箱" value={email} onChangeText={setEmail} onBlur={() => handleFieldBlur('email', email)} keyboardType="email-address" helpText="请输入您的电子邮箱地址" error={!!errors.email} errorMessage={errors.email} testID="email-input" />
           <View style={styles.fieldContainer}>
             <Text style={styles.fieldLabel}>性别</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        <CollapsibleSection 
          title="资金证明"
          isExpanded={expandedSection === 'funds'}
          onToggle={() => setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
        >
          <View style={styles.fundActions}>
            <Button title="添加现金" onPress={() => addFund('cash')} variant="secondary" style={styles.fundButton} />
            <Button title="添加信用卡照片" onPress={() => addFund('credit_card')} variant="secondary" style={styles.fundButton} />
            <Button title="添加银行账户余额" onPress={() => addFund('bank_balance')} variant="secondary" style={styles.fundButton} />
          </View>

          {funds.map((fund, index) => (
            <View key={fund.id} style={styles.fundItem}>
              <Text style={styles.fundType}>{{
                'cash': '现金',
                'credit_card': '信用卡照片',
                'bank_balance': '银行账户余额',
              }[fund.type]}</Text>
              {fund.type === 'cash' ? (
                <>
                  <Input
                    label="Amount"
                    value={fund.amount}
                    onChangeText={(text) => updateFundField(fund.id, 'amount', text)}
                    keyboardType="numeric"
                    testID="cash-amount-input"
                  />
                  <Input
                    label="Details"
                    value={fund.details}
                    onChangeText={(text) => updateFundField(fund.id, 'details', text)}
                  />
                </>
              ) : (
                <View>
                  <TouchableOpacity style={styles.photoButton} onPress={() => handleChoosePhoto(fund.id)}>
                    <Text style={styles.photoButtonText}>{fund.photo ? '更换照片' : '添加照片'}</Text>
                  </TouchableOpacity>
                  {fund.photo && (
                    <View>
                      <Text style={styles.photoDebug}>Photo URI: {fund.photo.substring(0, 50)}...</Text>
                      <Image 
                        source={{ uri: fund.photo }} 
                        style={styles.fundImage}
                        onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
                        onLoad={() => console.log('Image loaded successfully:', fund.photo)}
                      />
                    </View>
                  )}
                </View>
              )}
              <Button title="删除" onPress={() => removeFund(fund.id)} variant="danger" />
            </View>
          ))}
        </CollapsibleSection>

        <CollapsibleSection 
          title="旅行信息"
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>来泰国机票</Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTickets}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
          </View>
          <Input label="航班号" value={arrivalFlightNumber} onChangeText={setArrivalFlightNumber} onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)} helpText="请输入您的抵达航班号" error={!!errors.arrivalFlightNumber} errorMessage={errors.arrivalFlightNumber} autoCapitalize="characters" />
          <Input label="出发机场" value={arrivalDepartureAirport} onChangeText={setArrivalDepartureAirport} onBlur={() => handleFieldBlur('arrivalDepartureAirport', arrivalDepartureAirport)} helpText="请输入出发机场" error={!!errors.arrivalDepartureAirport} errorMessage={errors.arrivalDepartureAirport} autoCapitalize="words" />
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <DateTimeInput 
                label="出发日期" 
                value={arrivalDepartureDate} 
                onChangeText={setArrivalDepartureDate} 
                mode="date"
                helpText="选择日期"
                error={!!errors.arrivalDepartureDate} 
                errorMessage={errors.arrivalDepartureDate}
                onBlur={() => handleFieldBlur('arrivalDepartureDate', arrivalDepartureDate)}
              />
            </View>
            <View style={styles.dateTimeField}>
              <DateTimeInput 
                label="出发时间" 
                value={arrivalDepartureTime} 
                onChangeText={setArrivalDepartureTime} 
                mode="time"
                helpText="选择时间"
                error={!!errors.arrivalDepartureTime} 
                errorMessage={errors.arrivalDepartureTime}
                onBlur={() => handleFieldBlur('arrivalDepartureTime', arrivalDepartureTime)}
              />
            </View>
          </View>
          <Input label="抵达机场" value={arrivalArrivalAirport} onChangeText={setArrivalArrivalAirport} onBlur={() => handleFieldBlur('arrivalArrivalAirport', arrivalArrivalAirport)} helpText="请输入抵达机场" error={!!errors.arrivalArrivalAirport} errorMessage={errors.arrivalArrivalAirport} autoCapitalize="words" />
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <DateTimeInput 
                label="抵达日期" 
                value={arrivalArrivalDate} 
                onChangeText={setArrivalArrivalDate} 
                mode="date"
                helpText="选择日期"
                error={!!errors.arrivalArrivalDate} 
                errorMessage={errors.arrivalArrivalDate}
                onBlur={() => handleFieldBlur('arrivalArrivalDate', arrivalArrivalDate)}
              />
            </View>
            <View style={styles.dateTimeField}>
              <DateTimeInput 
                label="抵达时间" 
                value={arrivalArrivalTime} 
                onChangeText={setArrivalArrivalTime} 
                mode="time"
                helpText="选择时间"
                error={!!errors.arrivalArrivalTime} 
                errorMessage={errors.arrivalArrivalTime}
                onBlur={() => handleFieldBlur('arrivalArrivalTime', arrivalArrivalTime)}
              />
            </View>
          </View>

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>去程机票</Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTickets}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
          </View>
          <Input label="航班号" value={departureFlightNumber} onChangeText={setDepartureFlightNumber} onBlur={() => handleFieldBlur('departureFlightNumber', departureFlightNumber)} helpText="请输入您的离开航班号" error={!!errors.departureFlightNumber} errorMessage={errors.departureFlightNumber} autoCapitalize="characters" />
          <Input label="出发机场" value={departureDepartureAirport} onChangeText={setDepartureDepartureAirport} onBlur={() => handleFieldBlur('departureDepartureAirport', departureDepartureAirport)} helpText="请输入出发机场" error={!!errors.departureDepartureAirport} errorMessage={errors.departureDepartureAirport} autoCapitalize="words" />
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <DateTimeInput 
                label="出发日期" 
                value={departureDepartureDate} 
                onChangeText={setDepartureDepartureDate} 
                mode="date"
                helpText="选择日期"
                error={!!errors.departureDepartureDate} 
                errorMessage={errors.departureDepartureDate}
                onBlur={() => handleFieldBlur('departureDepartureDate', departureDepartureDate)}
              />
            </View>
            <View style={styles.dateTimeField}>
              <DateTimeInput 
                label="出发时间" 
                value={departureDepartureTime} 
                onChangeText={setDepartureDepartureTime} 
                mode="time"
                helpText="选择时间"
                error={!!errors.departureDepartureTime} 
                errorMessage={errors.departureDepartureTime}
                onBlur={() => handleFieldBlur('departureDepartureTime', departureDepartureTime)}
              />
            </View>
          </View>
          <Input label="抵达机场" value={departureArrivalAirport} onChangeText={setDepartureArrivalAirport} onBlur={() => handleFieldBlur('departureArrivalAirport', departureArrivalAirport)} helpText="请输入抵达机场" error={!!errors.departureArrivalAirport} errorMessage={errors.departureArrivalAirport} autoCapitalize="words" />
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeField}>
              <DateTimeInput 
                label="抵达日期" 
                value={departureArrivalDate} 
                onChangeText={setDepartureArrivalDate} 
                mode="date"
                helpText="选择日期"
                error={!!errors.departureArrivalDate} 
                errorMessage={errors.departureArrivalDate}
                onBlur={() => handleFieldBlur('departureArrivalDate', departureArrivalDate)}
              />
            </View>
            <View style={styles.dateTimeField}>
              <DateTimeInput 
                label="抵达时间" 
                value={departureArrivalTime} 
                onChangeText={setDepartureArrivalTime} 
                mode="time"
                helpText="选择时间"
                error={!!errors.departureArrivalTime} 
                errorMessage={errors.departureArrivalTime}
                onBlur={() => handleFieldBlur('departureArrivalTime', departureArrivalTime)}
              />
            </View>
          </View>

          <View style={styles.subSectionHeader}>
              <Text style={styles.subSectionTitle}>旅馆信息</Text>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanHotel}>
                  <Text style={styles.scanIcon}>📸</Text>
                  <Text style={styles.scanText}>扫描</Text>
              </TouchableOpacity>
          </View>
          <Input label="酒店名称" value={hotelName} onChangeText={setHotelName} onBlur={() => handleFieldBlur('hotelName', hotelName)} helpText="请输入您预订的酒店名称" error={!!errors.hotelName} errorMessage={errors.hotelName} autoCapitalize="words" />
          <Input label="酒店地址" value={hotelAddress} onChangeText={setHotelAddress} onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)} multiline helpText="请输入您预订的酒店地址" error={!!errors.hotelAddress} errorMessage={errors.hotelAddress} autoCapitalize="words" />
        </CollapsibleSection>

        <View style={styles.buttonContainer}>
          <Button
            title="生成入境卡"
            onPress={handleContinue}
            variant="primary"
            disabled={!isFormValid()}
          />
        </View>
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
  scrollContainer: {
    paddingBottom: spacing.xxl,
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
  },
  sectionContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  fieldCountBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  fieldCountBadgeComplete: {
    backgroundColor: '#d4edda', // Light green
  },
  fieldCountBadgeIncomplete: {
    backgroundColor: '#fff3cd', // Light yellow
  },
  fieldCountText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  fieldCountTextComplete: {
    color: '#155724', // Dark green
  },
  fieldCountTextIncomplete: {
    color: '#856404', // Dark yellow/orange
  },
  sectionIcon: {
    ...typography.h3,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  sectionContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 0,
  },
  dateTimeField: {
    flex: 1,
  },
  placeholderText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  scanIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  scanText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  subSectionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
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
  fundActions: {
    flexDirection: 'column',
    marginBottom: spacing.md,
  },
  fundButton: {
    marginVertical: spacing.xs,
  },
  fundItem: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  fundType: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  photoButton: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  fundImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  privacyText: {
    fontSize: 13,
    color: '#34C759',
    flex: 1,
    lineHeight: 18,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  phoneCodeInput: {
    width: '30%',
    marginRight: spacing.sm,
  },
  phoneInput: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
});

export default ThailandTravelInfoScreen;
