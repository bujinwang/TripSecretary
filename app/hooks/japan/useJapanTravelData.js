import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import UserDataService from '../../services/data/UserDataService';
import { getPhoneCode } from '../../data/phoneCodes';
import JapanFormHelper from '../../utils/japan/JapanFormHelper';

const getDefaultArrivalDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
};

export const useJapanTravelData = (userId, navigation, t) => {
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [passportNo, setPassportNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');

  const [funds, setFunds] = useState([]);

  const [travelPurpose, setTravelPurpose] = useState('Tourism');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState(getDefaultArrivalDate());
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationAddress, setAccommodationAddress] = useState('');
  const [accommodationPhone, setAccommodationPhone] = useState('');
  const [lengthOfStay, setLengthOfStay] = useState('');

  const validateField = useCallback((fieldName, value) => {
    if (!value || value.toString().trim() === '') {
      return null;
    }

    switch (fieldName) {
      case 'passportNo':
        if (!/^[A-Z0-9]{6,12}$/i.test(value.replace(/\s/g, ''))) {
          return 'Invalid passport number format';
        }
        break;

      case 'dob':
      case 'expiryDate':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return 'Invalid date format (YYYY-MM-DD)';
        }
        break;

      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format';
        }
        break;

      case 'phoneNumber':
      case 'accommodationPhone':
        const cleanPhone = value.replace(/[^\d+\s-()]/g, '');
        if (!/^[\+]?[\d\s\-\(\)]{7,}$/.test(cleanPhone)) {
          return 'Invalid phone number format';
        }
        break;
    }

    return null;
  }, []);

  const saveData = useCallback(async () => {
    try {
      const existingPassport = await UserDataService.getPassport(userId);

      const passportUpdates = {};
      if (passportNo && passportNo.trim()) {
passportUpdates.passportNumber = passportNo;
}
      if (fullName && fullName.trim()) {
passportUpdates.fullName = fullName;
}
      if (nationality && nationality.trim()) {
passportUpdates.nationality = nationality;
}
      if (dob && dob.trim()) {
passportUpdates.dateOfBirth = dob;
}
      if (expiryDate && expiryDate.trim()) {
passportUpdates.expiryDate = expiryDate;
}
      if (gender && gender.trim()) {
passportUpdates.gender = gender;
}

      if (Object.keys(passportUpdates).length > 0) {
        if (existingPassport && existingPassport.id) {
          await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
        } else {
          await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
        }
      }

      const personalInfoUpdates = {};
      if (phoneNumber && phoneNumber.trim()) {
personalInfoUpdates.phoneNumber = phoneNumber;
}
      if (email && email.trim()) {
personalInfoUpdates.email = email;
}
      if (occupation && occupation.trim()) {
personalInfoUpdates.occupation = occupation;
}
      if (cityOfResidence && cityOfResidence.trim()) {
personalInfoUpdates.provinceCity = cityOfResidence;
}
      if (residentCountry && residentCountry.trim()) {
personalInfoUpdates.countryRegion = residentCountry;
}

      if (Object.keys(personalInfoUpdates).length > 0) {
        await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      }

      const travelInfoUpdates = {};
      if (travelPurpose === 'Other') {
        const customValue = customTravelPurpose.trim();
        if (customValue) {
          travelInfoUpdates.travelPurpose = 'Other';
          travelInfoUpdates.customTravelPurpose = customValue;
        }
      } else if (travelPurpose && travelPurpose.trim()) {
        travelInfoUpdates.travelPurpose = travelPurpose;
        travelInfoUpdates.customTravelPurpose = '';
      }
      if (arrivalFlightNumber && arrivalFlightNumber.trim()) {
travelInfoUpdates.arrivalFlightNumber = arrivalFlightNumber;
}
      if (arrivalDate && arrivalDate.trim()) {
travelInfoUpdates.arrivalArrivalDate = arrivalDate;
}
      travelInfoUpdates.isTransitPassenger = isTransitPassenger;
      if (!isTransitPassenger && accommodationAddress && accommodationAddress.trim()) {
travelInfoUpdates.hotelAddress = accommodationAddress;
}
      if (!isTransitPassenger && accommodationPhone && accommodationPhone.trim()) {
travelInfoUpdates.accommodationPhone = accommodationPhone;
}
      if (lengthOfStay && lengthOfStay.trim()) {
travelInfoUpdates.lengthOfStay = lengthOfStay;
}

      if (Object.keys(travelInfoUpdates).length > 0) {
        await UserDataService.updateTravelInfo(userId, 'japan', travelInfoUpdates);
      }
    } catch (error) {
      console.error('Error saving Japan travel info data:', error);
      throw error;
    }
  }, [
    userId, passportNo, fullName, nationality, dob, expiryDate, gender,
    phoneNumber, email, occupation, cityOfResidence, residentCountry,
    travelPurpose, customTravelPurpose, arrivalFlightNumber, arrivalDate,
    isTransitPassenger, accommodationAddress, accommodationPhone, lengthOfStay
  ]);

  const handleFieldBlur = useCallback(async (fieldName, value) => {
    try {
      const validationError = validateField(fieldName, value);
      const isValid = !validationError;

      setErrors(prev => ({
        ...prev,
        [fieldName]: isValid ? '' : validationError
      }));

      if (isValid) {
        await saveData();
      }
    } catch (error) {
      console.error('Failed to validate and save field:', error);
    }
  }, [validateField, saveData]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      await UserDataService.initialize(userId);

      const [passportData, personalInfo, travelInfo, fundItems] = await Promise.all([
        UserDataService.getPassport(userId).catch(() => null),
        UserDataService.getPersonalInfo(userId).catch(() => null),
        UserDataService.getTravelInfo(userId, 'japan').catch(() => null),
        UserDataService.getFundItems(userId).catch(() => [])
      ]);

      if (passportData) {
        setPassportNo(passportData.passportNumber || '');
        setFullName(passportData.fullName || '');
        setNationality(passportData.nationality || '');
        setDob(passportData.dateOfBirth || '');
        setExpiryDate(passportData.expiryDate || '');
      }

      if (personalInfo) {
        setOccupation(personalInfo.occupation || '');
        setCityOfResidence(personalInfo.provinceCity || '');
        setResidentCountry(personalInfo.countryRegion || '');
        const savedPhoneCode = personalInfo.phoneCode || '';
        const autoPhoneCode = savedPhoneCode || getPhoneCode(personalInfo.countryRegion || '');
        setPhoneCode(autoPhoneCode);
        setPhoneNumber(personalInfo.phoneNumber || '');
        setEmail(personalInfo.email || '');
      }

      if (passportData?.gender) {
        setGender(passportData.gender);
      }

      if (fundItems && Array.isArray(fundItems)) {
        setFunds(fundItems);
      }

      if (travelInfo) {
        const storedCustomPurpose = travelInfo.customTravelPurpose || '';
        const loadedPurposeRaw = travelInfo.travelPurpose || storedCustomPurpose || 'Tourism';
        const normalizedPurpose = JapanFormHelper.normalizeTravelPurpose(loadedPurposeRaw);
        if (normalizedPurpose === 'Other') {
          setTravelPurpose('Other');
          setCustomTravelPurpose(storedCustomPurpose || loadedPurposeRaw || '');
        } else {
          setTravelPurpose(normalizedPurpose);
          setCustomTravelPurpose('');
        }
        setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
        setArrivalDate(travelInfo.arrivalArrivalDate || getDefaultArrivalDate());
        setIsTransitPassenger(travelInfo.isTransitPassenger || false);
        setAccommodationAddress(travelInfo.hotelAddress || '');
        setAccommodationPhone(travelInfo.accommodationPhone || '');
        setLengthOfStay(travelInfo.lengthOfStay || '');
      } else {
        setArrivalDate(getDefaultArrivalDate());
      }

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
  }, [userId, t]);

  useEffect(() => {
    loadData();

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [loadData, navigation]);

  return {
    isLoading,
    errors,

    passportNo, setPassportNo,
    fullName, setFullName,
    nationality, setNationality,
    dob, setDob,
    expiryDate, setExpiryDate,

    occupation, setOccupation,
    cityOfResidence, setCityOfResidence,
    residentCountry, setResidentCountry,
    phoneCode, setPhoneCode,
    phoneNumber, setPhoneNumber,
    email, setEmail,
    gender, setGender,

    funds, setFunds,

    travelPurpose, setTravelPurpose,
    customTravelPurpose, setCustomTravelPurpose,
    arrivalFlightNumber, setArrivalFlightNumber,
    arrivalDate, setArrivalDate,
    isTransitPassenger, setIsTransitPassenger,
    accommodationAddress, setAccommodationAddress,
    accommodationPhone, setAccommodationPhone,
    lengthOfStay, setLengthOfStay,

    handleFieldBlur,
    saveData,
    loadData,
  };
};
