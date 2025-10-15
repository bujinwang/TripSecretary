// 入境通 - Profile Screen
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import { NationalitySelector, PassportNameInput } from '../components';
import FundItemDetailModal from '../components/FundItemDetailModal';
import { destinationRequirements } from '../config/destinationRequirements';
import PassportDataService from '../services/data/PassportDataService';
import SecureStorageService from '../services/security/SecureStorageService';

const ProfileScreen = ({ navigation, route }) => {
  const { t, language } = useTranslation();

  // Get destination from route params (e.g., 'th', 'us', 'ca')
  const destination = route?.params?.destination;

  // Passport data - loaded from database
  const [passportData, setPassportData] = useState({
    type: '中国护照',
    name: '',
    nameEn: '',
    passportNo: '',
    nationality: '',
    expiry: '',
  });


  // Personal info state - loaded from database
  const [personalInfo, setPersonalInfo] = useState({
    dateOfBirth: '',
    gender: '',
    occupation: '',
    provinceCity: '',
    countryRegion: '',
    phone: '',
    email: '',
  });

  // Fund items state - loaded from database
  const [fundItems, setFundItems] = useState([]);

  // Fund item detail modal state
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);

  const [expandedSection, setExpandedSection] = useState('personal'); // 'personal', 'passport', 'funding', or null
  const [editingContext, setEditingContext] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [draftSavedNotification, setDraftSavedNotification] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const languageLabel = useMemo(() => {
    const fallback = language ? language.toUpperCase() : 'LANG';
    return t(`languages.${language}`, { defaultValue: fallback });
  }, [t, language]);

  // Set default country/region to passport nationality on mount
  useEffect(() => {
    if (passportData.nationality && !personalInfo.countryRegion) {
      setPersonalInfo(prev => ({
        ...prev,
        countryRegion: passportData.nationality
      }));
    }
  }, [passportData.nationality]);



  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Get userId (for now using 'default_user', in production this would come from auth)
        const userId = 'default_user';
        
        // Initialize PassportDataService (ensures database is ready)
        try {
          await PassportDataService.initialize(userId);
        } catch (initError) {
          console.error('Failed to initialize PassportDataService:', initError);
          
          // If initialization fails due to schema issues, show alert to user
          if (initError.message && initError.message.includes('no such column')) {
            Alert.alert(
              'Database Schema Error',
              'The database schema is outdated. Please tap "Clear Saved Data" in the settings below to reset the database.',
              [{ text: 'OK' }]
            );
          }
          return; // Don't continue if initialization fails
        }
        
        // Check if migration is needed and trigger it
        try {
          await PassportDataService.migrateFromAsyncStorage(userId);
        } catch (migrationError) {
          // Continue loading even if migration fails
        }
        
        // Load all user data from centralized service
        const userData = await PassportDataService.getAllUserData(userId);
        
        // Load passport data
        if (userData.passport) {
          
          // Map passport model fields to component state
          const mappedPassport = {
            type: '中国护照',
            name: userData.passport.fullName || '',
            nameEn: userData.passport.fullName || '',
            passportNo: userData.passport.passportNumber || '',
            nationality: userData.passport.nationality || '',
            expiry: userData.passport.expiryDate || '',
          };
          
          setPassportData(mappedPassport);
          
          // Load personal info with gender from passport
          const mappedPersonalInfo = {
            dateOfBirth: userData.passport.dateOfBirth || '1988-01-22',
            gender: userData.passport.gender || 'MALE',
            occupation: userData.personalInfo?.occupation || '',
            provinceCity: userData.personalInfo?.provinceCity || '',
            countryRegion: userData.personalInfo?.countryRegion || userData.passport.nationality || '',
            phone: userData.personalInfo?.phoneNumber || '',
            email: userData.personalInfo?.email || '',
          };
          
          setPersonalInfo(mappedPersonalInfo);
        } else if (userData.personalInfo) {
          // If no passport but personal info exists, load personal info only
          
          const mappedPersonalInfo = {
            dateOfBirth: '1988-01-22',
            gender: 'MALE',
            occupation: userData.personalInfo.occupation || '',
            provinceCity: userData.personalInfo.provinceCity || '',
            countryRegion: userData.personalInfo.countryRegion || '',
            phone: userData.personalInfo.phoneNumber || '',
            email: userData.personalInfo.email || '',
          };
          
          setPersonalInfo(mappedPersonalInfo);
        }
        
        // Load fund items
        try {
          const items = await PassportDataService.getFundItems(userId);
          console.log('Loaded fund items:', items);
          setFundItems(items || []);
        } catch (fundItemsError) {
          console.error('Error loading fund items:', fundItemsError);
          setFundItems([]);
        }
        
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    
    loadSavedData();
  }, []);

  // Reload fund items when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadFundItems = async () => {
        try {
          const userId = 'default_user';
          const items = await PassportDataService.getFundItems(userId);
          console.log('Reloaded fund items on focus:', items);
          setFundItems(items || []);
        } catch (error) {
          console.error('Error reloading fund items:', error);
        }
      };
      
      loadFundItems();
    }, [])
  );

  // Note: Data saving is now handled through PassportDataService in individual update handlers
  // instead of useEffect hooks to avoid unnecessary saves on every render

  const personalFields = useMemo(() => {
    const destinationConfig = destination ? destinationRequirements[destination] : {};
    const requiresContactInfo = destinationConfig.requiresContactInfo !== false; // Default to true if not specified

    const fields = [
      {
        key: 'dateOfBirth',
        title: t('profile.personal.fields.dateOfBirth.title', { defaultValue: 'Date of Birth' }),
        subtitle: t('profile.personal.fields.dateOfBirth.subtitle', { defaultValue: 'Date of Birth' }),
        placeholder: t('profile.personal.fields.dateOfBirth.placeholder', { defaultValue: 'YYYY-MM-DD (自动格式化)' }),
        formatHint: '格式: YYYY-MM-DD',
      },
      {
        key: 'gender',
        title: t('profile.personal.fields.gender.title', { defaultValue: 'Gender' }),
        subtitle: t('profile.personal.fields.gender.subtitle', { defaultValue: 'Gender' }),
        placeholder: t('profile.personal.fields.gender.placeholder', { defaultValue: 'MALE / FEMALE' }),
      },
      {
        key: 'occupation',
        title: t('profile.personal.fields.occupation.title', { defaultValue: 'Occupation' }),
        subtitle: t('profile.personal.fields.occupation.subtitle', { defaultValue: 'Occupation' }),
        placeholder: t('profile.personal.fields.occupation.placeholder', { defaultValue: 'Occupation' }),
      },
      {
        key: 'countryRegion',
        title: t('profile.personal.fields.countryRegion.title', { defaultValue: 'Country / Region' }),
        subtitle: t('profile.personal.fields.countryRegion.subtitle', { defaultValue: 'Country / Region' }),
        placeholder: t('profile.personal.fields.countryRegion.placeholder', { defaultValue: 'Select your country' }),
        type: 'nationality-selector', // Mark as nationality selector type
      },
      {
        key: 'provinceCity',
        title: t('profile.personal.fields.provinceCity.title', { defaultValue: 'City / Province' }),
        subtitle: t('profile.personal.fields.provinceCity.subtitle', {
          defaultValue: 'Province / City of Residence',
        }),
        placeholder: t('profile.personal.fields.provinceCity.placeholder', { defaultValue: 'Province / City' }),
      },
    ];

    // Only add phone/email if destination requires contact info
    if (requiresContactInfo) {
      fields.push(
        {
          key: 'phone',
          title: t('profile.personal.fields.phone.title', { defaultValue: 'Phone Number' }),
          subtitle: t('profile.personal.fields.phone.subtitle', { defaultValue: 'Phone' }),
          placeholder: t('profile.personal.fields.phone.placeholder', { defaultValue: '+86 1234567890' }),
          keyboardType: 'phone-pad',
        },
        {
          key: 'email',
          title: t('profile.personal.fields.email.title', { defaultValue: 'Email Address' }),
          subtitle: t('profile.personal.fields.email.subtitle', { defaultValue: 'Email' }),
          placeholder: t('profile.personal.fields.email.placeholder', { defaultValue: 'your@email.com' }),
          keyboardType: 'email-address',
        }
      );
    }

    return fields;
  }, [t, language, destination]);

  const personalTitle = t('profile.personal.title', { defaultValue: 'Personal Information' });
  const personalSubtitle = t('profile.personal.subtitle', { defaultValue: 'Update border details' });
  const personalCollapsedHint = t('profile.personal.collapsedHint', {
    defaultValue: 'Tap to expand personal information',
  });
  const fundingTitle = t('profile.funding.title', { defaultValue: 'Funding Proof Checklist' });
  const fundingSubtitle = t('profile.funding.subtitle', { defaultValue: 'Show quickly at immigration' });
  const fundingCollapsedHint = t('profile.funding.collapsedHint', {
    defaultValue: 'Tap to expand funding checklist',
  });
  const fundingTipTitle = t('profile.funding.tip.title', { defaultValue: 'Sufficient funds' });
  const fundingTipSubtitle = t('profile.funding.tip.subtitle', {
    defaultValue: 'Carry at least 10,000 THB per person or equivalent proof',
  });
  const fundingTipDescription = t('profile.funding.tip.description', {
    defaultValue:
      'Officers may check your cash or bank balance. Prepare screenshots or statements and list your cash, cards, and balances for quick inspection.',
  });
  const scanProofText = t('profile.funding.actions.scanProof', { defaultValue: 'Scan / Upload Funding Proof' });
  const fundingFooterNote = t('profile.funding.footerNote', {
    defaultValue: 'Information syncs to your entry pack for immigration checks.',
  });
  const notFilledLabel = t('profile.common.notFilled', { defaultValue: 'Not filled' });

  const menuItems = useMemo(
    () => [
      {
        section: t('profile.sections.myServices', { defaultValue: 'My Services' }),
        items: [
          {
            id: 'backup',
            icon: '💾',
            title: t('profile.menu.backup.title', { defaultValue: 'Cloud Backup' }),
            subtitle: t('profile.menu.backup.subtitle', {
              time: t('profile.menu.backup.defaultTime', { defaultValue: 'Today' }),
            }),
          },
        ],
      },
      {
        section: t('profile.sections.settings', { defaultValue: 'Settings & Help' }),
        items: [
          {
            id: 'language',
            icon: '🌐',
            title: t('profile.menu.language.title', { defaultValue: 'Language' }),
            subtitle: t('profile.menu.language.subtitle', {
              language: languageLabel,
              defaultValue: languageLabel,
            }),
          },
          { id: 'settings', icon: '⚙️', title: t('profile.menu.settings.title', { defaultValue: 'Settings' }) },
          { id: 'help', icon: '❓', title: t('profile.menu.help.title', { defaultValue: 'Help Center' }) },
          { id: 'about', icon: '📱', title: t('profile.menu.about.title', { defaultValue: 'About Us' }) },
          {
            id: 'notifications',
            icon: '🔔',
            title: t('profile.menu.notifications.title', { defaultValue: 'Notification Settings' }),
          },
        ],
      },
    ],
    [t, languageLabel]
  );

  // Count filled fields for each section
  const personalFieldsCount = useMemo(() => {
    const filled = personalFields.filter(field => {
      const value = personalInfo[field.key];
      return value && value.toString().trim() !== '';
    }).length;
    return { filled, total: personalFields.length };
  }, [personalFields, personalInfo]);

  const passportFieldsCount = useMemo(() => {
    const passportFields = ['name', 'passportNo', 'nationality', 'expiry'];
    const filled = passportFields.filter(field => {
      const value = passportData[field];
      return value && value.toString().trim() !== '';
    }).length;
    return { filled, total: passportFields.length };
  }, [passportData]);

  const fundingFieldsCount = useMemo(() => {
    // Count fund items instead of legacy funding proof fields
    const filled = fundItems.length;
    const total = 3; // Expected minimum fund items (cash, bank card, supporting doc)
    return { filled, total };
  }, [fundItems]);

  const handleMenuPress = (itemId) => {
    if (itemId === 'language') {
      // Navigate back to login to change language
      navigation.replace('Login');
    }
    // TODO: Navigate to respective screens
  };

  const handleLogout = () => {
    // TODO: Implement logout
    navigation.replace('Login');
  };



  const handleStartEdit = (type, field, fieldIndex = null) => {
    let currentValue;
    if (type === 'personal') {
      currentValue = personalInfo[field.key];
    } else if (type === 'passport-nationality') {
      currentValue = passportData.nationality;
    } else if (type === 'passport-name') {
      currentValue = passportData.name;
    } else if (type === 'nationality-selector') {
      currentValue = personalInfo[field.key]; // For country/region field
    }
    setEditingContext({ type, ...field, fieldIndex });
    setEditValue(currentValue || '');
  };

  const handleNavigateField = (direction) => {
    if (!editingContext) return;

    // Validate date of birth before navigating away
    if (editingContext.key === 'dateOfBirth' && editValue.length === 10) {
      const validation = validateDateOfBirth(editValue);
      if (!validation.valid) {
        setValidationError(validation.error);
        return; // Don't navigate if invalid
      }
    }

    // Save current field before navigating
    handleSaveEdit();

    let fields;
    let currentIndex = editingContext.fieldIndex;

    if (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') {
      fields = personalFields;
    } else {
      return;
    }

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < fields.length) {
      const nextField = fields[nextIndex];
      const fieldType = nextField.type === 'nationality-selector' ? nextField.type : editingContext.type;
      handleStartEdit(fieldType, nextField, nextIndex);
    }
  };

  const handleGenderSelect = async (value) => {
    setEditValue(value);
    setPersonalInfo((prev) => ({
      ...prev,
      gender: value,
    }));
    
    // Save to PassportDataService
    try {
      const userId = 'default_user';
      const passport = await PassportDataService.getPassport(userId);
      if (passport && passport.id) {
        await PassportDataService.updatePassport(passport.id, {
          gender: value,
        }, { skipValidation: true }); // Skip validation for progressive data entry
      }
    } catch (error) {
      console.error('Error saving gender:', error);
    }
    
    showDraftSavedNotification(editingContext?.title || '性别');
    // Auto-close modal after a short delay to show the selection
    setTimeout(() => {
      handleCancelEdit();
    }, 500);
  };

  const renderGenderOptions = () => {
    const options = [
      { value: 'MALE', label: '男性' },
      { value: 'FEMALE', label: '女性' },
      { value: 'UNDEFINED', label: '未定义' }
    ];

    return (
      <View style={styles.genderOptions}>
        {options.map((option) => {
          const isActive = editValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.genderOption,
                isActive && styles.genderOptionActive,
              ]}
              onPress={() => handleGenderSelect(option.value)}
            >
              <Text
                style={[
                  styles.genderOptionText,
                  isActive && styles.genderOptionTextActive,
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

  const handleCancelEdit = () => {
    setEditingContext(null);
    setEditValue('');
    setValidationError(null);
  };

  const showDraftSavedNotification = (fieldName) => {
    setDraftSavedNotification(fieldName);
    setTimeout(() => {
      setDraftSavedNotification(null);
    }, 2000);
  };

  // Validate date of birth
  const validateDateOfBirth = (dateStr) => {
    // Check if date is in correct format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { valid: false, error: '请输入完整日期 (YYYY-MM-DD)' };
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Validate year (reasonable range: 1900 to current year)
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
      return { valid: false, error: `年份必须在 1900 到 ${currentYear} 之间` };
    }

    // Validate month (1-12)
    if (month < 1 || month > 12) {
      return { valid: false, error: '月份必须在 01 到 12 之间' };
    }

    // Validate day based on month and year
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return { valid: false, error: `该月份只有 ${daysInMonth} 天` };
    }

    // Check if date is not in the future
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (inputDate > today) {
      return { valid: false, error: '出生日期不能是未来日期' };
    }

    // Check if person is not unreasonably old (e.g., over 150 years)
    const age = currentYear - year;
    if (age > 150) {
      return { valid: false, error: '请检查出生年份是否正确' };
    }

    return { valid: true, error: null };
  };

  // Date formatting function for automatic YYYY-MM-DD formatting
  const formatDateInput = (text) => {
    // Remove all non-digits
    const digitsOnly = text.replace(/\D/g, '');

    // Limit to 8 digits (YYYYMMDD)
    const limitedDigits = digitsOnly.slice(0, 8);

    // Add hyphens in YYYY-MM-DD format
    let formatted = '';
    if (limitedDigits.length > 0) {
      formatted += limitedDigits.slice(0, 4); // YYYY
      if (limitedDigits.length >= 5) {
        formatted += '-' + limitedDigits.slice(4, 6); // -MM
      }
      if (limitedDigits.length >= 7) {
        formatted += '-' + limitedDigits.slice(6, 8); // -DD
      }
    }

    return formatted;
  };

  const handleAutoSave = async (value) => {
    if (!editingContext) {
      return;
    }

    setEditValue(value);

    const userId = 'default_user';

    // Auto-save after user stops typing (debounce)
    setTimeout(async () => {
      try {
        if (editingContext.type === 'personal') {
          setPersonalInfo((prev) => ({
            ...prev,
            [editingContext.key]: value,
          }));
          
          // Save to PassportDataService using upsert (create or update)
           const updates = {};
           if (editingContext.key === 'phone') updates.phoneNumber = value;
           else if (editingContext.key === 'email') updates.email = value;
           else if (editingContext.key === 'occupation') updates.occupation = value;
           else if (editingContext.key === 'provinceCity') updates.provinceCity = value;
           else if (editingContext.key === 'countryRegion') updates.countryRegion = value;

           await PassportDataService.upsertPersonalInfo(userId, updates);
          
          // Update passport if gender or dateOfBirth changed
          if (editingContext.key === 'gender' || editingContext.key === 'dateOfBirth') {
            const passportData = await PassportDataService.getPassport(userId);
            if (passportData && passportData.id) {
              const updates = {};
              if (editingContext.key === 'gender') updates.gender = value;
              if (editingContext.key === 'dateOfBirth') updates.dateOfBirth = value;
              await PassportDataService.updatePassport(passportData.id, updates, { skipValidation: true });
            }
          }
        } else if (editingContext.type === 'passport-nationality') {
          setPassportData((prev) => ({
            ...prev,
            [editingContext.key]: value,
          }));
          
          const passport = await PassportDataService.getPassport(userId);
          if (passport && passport.id) {
            await PassportDataService.updatePassport(passport.id, {
              nationality: value,
            }, { skipValidation: true });
          }
        } else if (editingContext.type === 'passport-name') {
          setPassportData((prev) => ({
            ...prev,
            name: value,
            nameEn: value,
          }));

          const passport = await PassportDataService.getPassport(userId);
          if (passport && passport.id) {
            await PassportDataService.updatePassport(
              passport.id,
              {
                fullName: value,
              },
              { skipValidation: true }
            );
          }
        } else if (editingContext.type === 'nationality-selector') {
          setPersonalInfo((prev) => ({
            ...prev,
            [editingContext.key]: value,
          }));
          
          await PassportDataService.upsertPersonalInfo(userId, {
            countryRegion: value,
          });
        }

        showDraftSavedNotification(editingContext.title);
      } catch (error) {
        console.error('Error auto-saving data:', error);
      }
    }, 1000); // Auto-save after 1 second of no typing
  };

  // Handle date input with real-time formatting
  const handleDateInputChange = (text) => {
    const formatted = formatDateInput(text);
    setEditValue(formatted);

    // Clear previous validation error
    setValidationError(null);

    // Only validate if we have a complete date (10 characters: YYYY-MM-DD)
    if (formatted.length === 10) {
      const validation = validateDateOfBirth(formatted);
      if (!validation.valid) {
        setValidationError(validation.error);
        return; // Don't save invalid date
      }
    }

    // Also trigger auto-save for the formatted value (only if valid or incomplete)
    setTimeout(async () => {
      if (editingContext?.key === 'dateOfBirth' && formatted.length === 10) {
        const validation = validateDateOfBirth(formatted);
        if (validation.valid) {
          setPersonalInfo((prev) => ({
            ...prev,
            dateOfBirth: formatted,
          }));
          
          // Save to PassportDataService
          try {
            const userId = 'default_user';
            const passport = await PassportDataService.getPassport(userId);
            if (passport && passport.id) {
              await PassportDataService.updatePassport(passport.id, {
                dateOfBirth: formatted,
              }, { skipValidation: true });
            }
          } catch (error) {
            console.error('Error saving date of birth:', error);
          }
          
          showDraftSavedNotification('出生日期');
        }
      }
    }, 1000);
  };

  const handleSaveEdit = async () => {
    // For immediate save when user taps save button (if they want to save immediately)
    if (!editingContext) {
      return;
    }

    const userId = 'default_user';

    try {
      if (editingContext.type === 'personal') {
        const updatedPersonalInfo = {
          ...personalInfo,
          [editingContext.key]: editValue,
        };
        setPersonalInfo(updatedPersonalInfo);
        
        // Save to PassportDataService using upsert
        const updates = {};
        if (editingContext.key === 'phone') updates.phoneNumber = editValue;
        else if (editingContext.key === 'email') updates.email = editValue;
        else if (editingContext.key === 'occupation') updates.occupation = editValue;
        else if (editingContext.key === 'provinceCity') updates.provinceCity = editValue;
        else if (editingContext.key === 'countryRegion') updates.countryRegion = editValue;
        
        await PassportDataService.upsertPersonalInfo(userId, updates);
        
        // Update passport if gender or dateOfBirth changed
        if (editingContext.key === 'gender' || editingContext.key === 'dateOfBirth') {
          const passportData = await PassportDataService.getPassport(userId);
          if (passportData && passportData.id) {
            const updates = {};
            if (editingContext.key === 'gender') updates.gender = editValue;
            if (editingContext.key === 'dateOfBirth') updates.dateOfBirth = editValue;
            await PassportDataService.updatePassport(passportData.id, updates, { skipValidation: true });
          }
        }
      } else if (editingContext.type === 'passport-nationality') {
        const updatedPassportData = {
          ...passportData,
          [editingContext.key]: editValue,
        };
        setPassportData(updatedPassportData);
        
        // Save to PassportDataService
        const passport = await PassportDataService.getPassport(userId);
        if (passport && passport.id) {
          await PassportDataService.updatePassport(passport.id, {
            nationality: editValue,
          }, { skipValidation: true });
        }
      } else if (editingContext.type === 'passport-name') {
        const updatedPassportData = {
          ...passportData,
          [editingContext.key]: editValue,
        };
        setPassportData(updatedPassportData);
        
        // Save to PassportDataService
        const passport = await PassportDataService.getPassport(userId);
        if (passport && passport.id) {
          await PassportDataService.updatePassport(passport.id, {
            fullName: editValue,
          }, { skipValidation: true });
        }
      } else if (editingContext.type === 'nationality-selector') {
        const updatedPersonalInfo = {
          ...personalInfo,
          [editingContext.key]: editValue,
        };
        setPersonalInfo(updatedPersonalInfo);
        
        // Save to PassportDataService
        await PassportDataService.upsertPersonalInfo(userId, {
          countryRegion: editValue,
        });
      }

      showDraftSavedNotification(editingContext.title);
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    }
    
    handleCancelEdit();
  };

  const handleManageFundItems = () => {
    // Navigate to Thailand travel info screen where fund items can be managed
    navigation.navigate('ThailandTravelInfo', { destination: 'th' });
  };

  // Fund item detail modal handlers
  const handleFundItemPress = (fundItem) => {
    // Convert FundItem instance to plain object to ensure all properties are accessible
    const fundItemData = fundItem.toJSON ? fundItem.toJSON() : fundItem;
    console.log('[ProfileScreen] Opening fund item detail:', {
      id: fundItemData.id,
      type: fundItemData.type,
      hasPhotoUri: !!fundItemData.photoUri,
      photoUri: fundItemData.photoUri?.substring(0, 100),
    });
    setSelectedFundItem(fundItemData);
    setFundItemModalVisible(true);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      // Refresh fund items list
      const userId = 'default_user';
      const items = await PassportDataService.getFundItems(userId);
      console.log('Refreshed fund items after update:', items);
      setFundItems(items || []);
      setFundItemModalVisible(false);
      setSelectedFundItem(null);
    } catch (error) {
      console.error('Error refreshing fund items after update:', error);
    }
  };

  const handleFundItemDelete = async (fundItemId) => {
    try {
      // Refresh fund items list
      const userId = 'default_user';
      const items = await PassportDataService.getFundItems(userId);
      console.log('Refreshed fund items after delete:', items);
      setFundItems(items || []);
      setFundItemModalVisible(false);
      setSelectedFundItem(null);
    } catch (error) {
      console.error('Error refreshing fund items after delete:', error);
    }
  };

  const handleFundItemManageAll = () => {
    // Close modal and navigate to full fund management
    setFundItemModalVisible(false);
    setSelectedFundItem(null);
    navigation.navigate('ThailandTravelInfo', { destination: 'th' });
  };

  const handleFundItemModalClose = () => {
    setFundItemModalVisible(false);
    setSelectedFundItem(null);
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Draft Saved Notification */}
      {draftSavedNotification && (
        <View style={styles.draftNotification}>
          <Text style={styles.draftNotificationIcon}>💾</Text>
          <Text style={styles.draftNotificationText}>
            {t('profile.draftSaved', {
              field: draftSavedNotification,
              defaultValue: `${draftSavedNotification} saved`
            })}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('profile.header', { defaultValue: 'Profile' })}
          </Text>
          <TouchableOpacity>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>张伟</Text>
            <Text style={styles.userPhone}>
              {t('profile.user.phone', {
                phone: '138****1234',
                defaultValue: 'Phone: 138****1234',
              })}
            </Text>
          </View>
        </View>

        {/* Personal Info Section */}
        <View style={styles.personalInfoSection}>
          <View style={styles.personalInfoCard}>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
              accessibilityRole="button"
            >
              <Text style={styles.personalInfoIcon}>👤</Text>
              <View style={styles.sectionHeaderText}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.personalInfoLabel}>{personalTitle}</Text>
                  <Text style={[
                    styles.fieldCount,
                    personalFieldsCount.filled === personalFieldsCount.total 
                      ? styles.fieldCountComplete 
                      : styles.fieldCountIncomplete
                  ]}>
                    {personalFieldsCount.filled}/{personalFieldsCount.total}
                  </Text>
                </View>
                <Text style={styles.sectionHeaderSubtitle}>{personalSubtitle}</Text>
              </View>
              <Text style={styles.sectionToggleArrow}>
                {expandedSection === 'personal' ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedSection === 'personal' ? (
              <View style={styles.infoList}>
                {personalFields.map((field, index) => {
                  const value = personalInfo[field.key];
                  const isLast = index === personalFields.length - 1;

                  return (
                    <TouchableOpacity
                      key={field.key}
                      style={[styles.infoRow, !isLast && styles.infoRowDivider]}
                      onPress={() => handleStartEdit(field.type === 'nationality-selector' ? field.type : 'personal', field, index)}
                      accessibilityRole="button"
                      testID={`${field.key}-field`}
                    >
                      <View style={styles.infoRowText}>
                        <Text style={styles.infoTitle}>{field.title}</Text>
                        {field.subtitle && (
                          <Text style={styles.infoSubtitle}>{field.subtitle}</Text>
                        )}
                        {field.formatHint && (
                          <Text style={styles.infoFormatHint}>{field.formatHint}</Text>
                        )}
                      </View>
                      <View style={styles.infoValueWrap}>
                        <Text
                          style={[
                            styles.infoValue,
                            !value && styles.infoPlaceholder,
                          ]}
                          numberOfLines={field.multiline ? 2 : 1}
                          testID={`${field.key}-input`}
                        >
                          {field.key === 'gender' ?
                            (value === 'MALE' ? '男性' :
                             value === 'FEMALE' ? '女性' :
                             value === 'UNDEFINED' ? '未定义' : value) || notFilledLabel
                            : field.key === 'countryRegion' ?
                            (value ? `${value} : ${t(`nationalities.${value}`, { defaultValue: value })}` : notFilledLabel)
                            : value || notFilledLabel}
                        </Text>
                        <Text style={styles.rowArrow}>›</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.collapsedHint}>{personalCollapsedHint}</Text>
            )}
          </View>
        </View>

        {/* Funding Proof Section */}
        <View style={styles.fundingSection}>
          <View style={styles.fundingCard}>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => setExpandedSection(expandedSection === 'funding' ? null : 'funding')}
              accessibilityRole="button"
            >
              <Text style={styles.fundingIcon}>💰</Text>
              <View style={styles.sectionHeaderText}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.fundingTitle}>{fundingTitle}</Text>
                  <Text style={[
                    styles.fieldCount,
                    fundingFieldsCount.filled === fundingFieldsCount.total 
                      ? styles.fieldCountComplete 
                      : styles.fieldCountIncomplete
                  ]}>
                    {fundingFieldsCount.filled}/{fundingFieldsCount.total}
                  </Text>
                </View>
                <Text style={styles.sectionHeaderSubtitle}>{fundingSubtitle}</Text>
              </View>
              <Text style={styles.sectionToggleArrow}>
                {expandedSection === 'funding' ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedSection === 'funding' ? (
              <>
                <View style={styles.fundingTip}>
                  <View style={styles.fundingTipHeader}>
                    <Text style={styles.fundingCheckIcon}>✅</Text>
                    <View style={styles.fundingTipText}>
                      <Text style={styles.fundingTipTitle}>{fundingTipTitle}</Text>
                      <Text style={styles.fundingTipSubtitle}>
                        {fundingTipSubtitle}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.fundingTipDescription}>
                    {fundingTipDescription}
                  </Text>
                </View>

                <View style={styles.infoList}>
                  {fundItems.length > 0 ? (
                    fundItems.map((item, index) => {
                      const isLast = index === fundItems.length - 1;

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
                          style={[styles.infoRow, !isLast && styles.infoRowDivider]}
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
                    })
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        {t('profile.funding.empty', { defaultValue: '暂无资金证明，请添加' })}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleManageFundItems}
                  accessibilityRole="button"
                >
                  <Text style={styles.actionRowText}>{scanProofText}</Text>
                  <Text style={styles.rowArrow}>›</Text>
                </TouchableOpacity>

                <Text style={styles.fundingFooterNote}>
                  {fundingFooterNote}
                </Text>
              </>
            ) : (
              <Text style={styles.collapsedHint}>{fundingCollapsedHint}</Text>
            )}
          </View>
        </View>

        {/* Passport Info Section */}
        <View style={styles.personalInfoSection}>
          <View style={styles.personalInfoCard}>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
              accessibilityRole="button"
            >
              <Text style={styles.personalInfoIcon}>📘</Text>
              <View style={styles.sectionHeaderText}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.personalInfoLabel}>
                    {t('profile.passport.title', { defaultValue: 'My Passport' })}
                  </Text>
                  <Text style={[
                    styles.fieldCount,
                    passportFieldsCount.filled === passportFieldsCount.total 
                      ? styles.fieldCountComplete 
                      : styles.fieldCountIncomplete
                  ]}>
                    {passportFieldsCount.filled}/{passportFieldsCount.total}
                  </Text>
                </View>
                <Text style={styles.sectionHeaderSubtitle}>
                  {t('profile.passport.subtitle', {
                    passportNo: passportData.passportNo,
                    expiry: passportData.expiry,
                    defaultValue: `${passportData.passportNo} · Valid until ${passportData.expiry}`,
                  })}
                </Text>
              </View>
              <Text style={styles.sectionToggleArrow}>
                {expandedSection === 'passport' ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedSection === 'passport' ? (
              <View style={styles.infoList}>
                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => handleStartEdit('passport-name', { key: 'name', title: '姓名', subtitle: 'Full Name' })}
                >
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>姓名</Text>
                    <Text style={styles.infoSubtitle}>Full Name</Text>
                  </View>
                  <View style={styles.infoValueWrap}>
                    <Text style={styles.infoValue}>{passportData.name || notFilledLabel}</Text>
                    <Text style={styles.rowArrow}>›</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.infoItem} testID="passport-number-display">
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>
                      {t('profile.passport.fields.passportNo', { defaultValue: 'Passport Number' })}
                    </Text>
                    <Text style={styles.infoSubtitle}>Passport No.</Text>
                  </View>
                  <Text style={styles.infoValue} testID="passport-number-input">{passportData.passportNo}</Text>
                </View>

                <TouchableOpacity
                  style={styles.infoItem}
                  onPress={() => handleStartEdit('passport-nationality', { key: 'nationality' })}
                >
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>
                      {t('profile.passport.fields.nationality', { defaultValue: 'Nationality' })}
                    </Text>
                    <Text style={styles.infoSubtitle}>Nationality</Text>
                  </View>
                  <View style={styles.infoValueWrap}>
                    <Text style={styles.infoValue}>
                      {passportData.nationality ?
                        `${passportData.nationality} : ${t(`nationalities.${passportData.nationality}`, { defaultValue: passportData.nationality })}` :
                        notFilledLabel}
                    </Text>
                    <Text style={styles.rowArrow}>›</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.infoItem}>
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>
                      {t('profile.passport.fields.expiry', { defaultValue: 'Expiry Date' })}
                    </Text>
                    <Text style={styles.infoSubtitle}>Valid Until</Text>
                  </View>
                  <Text style={styles.infoValue}>{passportData.expiry}</Text>
                </View>


                <TouchableOpacity
                  style={styles.updatePassportButton}
                  onPress={() => navigation.navigate('ScanPassport')}
                >
                  <Text style={styles.updatePassportText}>
                    {t('profile.passport.updateButton', { defaultValue: 'Update passport info' })}
                  </Text>
                  <Text style={styles.updatePassportArrow}>›</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.collapsedHint}>
                {t('profile.passport.collapsedHint', { defaultValue: 'Tap to expand passport details' })}
              </Text>
            )}
          </View>
        </View>

        {/* VIP Upgrade Card */}
        <View style={styles.vipCard}>
          <View style={styles.vipContent}>
            <Text style={styles.vipIcon}>💎</Text>
            <View style={styles.vipInfo}>
              <Text style={styles.vipTitle}>
                {t('profile.vip.title', { defaultValue: 'Upgrade to Premium' })}
              </Text>
              <Text style={styles.vipSubtitle}>
                {t('profile.vip.subtitle', { defaultValue: 'Unlimited generations, priority processing' })}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.vipButton}>
            <Text style={styles.vipButtonText}>
              {t('profile.vip.upgradeButton', { defaultValue: 'Upgrade now' })}
            </Text>
            <Text style={styles.vipArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.sectionTitle}>{section.section}</Text>

            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.id)}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>({item.badge})</Text>
                  </View>
                )}
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            {t('profile.logout', { defaultValue: 'Log out' })}
          </Text>
        </TouchableOpacity>


        {/* App Version */}
        <Text style={styles.version}>
          {t('profile.version', { version: '1.0.0', defaultValue: 'Version 1.0.0' })}
        </Text>
      </ScrollView>

      <Modal
        visible={!!editingContext}
        animationType="slide"
        transparent
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalWrapper}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingContext?.title || ''}
              </Text>
              {editingContext?.subtitle && (
                <Text style={styles.modalSubtitle}>
                  {editingContext.subtitle}
                </Text>
              )}

              {editingContext?.type === 'passport-name' ? (
                <PassportNameInput
                  label=""
                  value={editValue}
                  onChangeText={(text) => {
                    setEditValue(text);
                    handleAutoSave(text);
                  }}
                  style={styles.passportNameInput}
                />
              ) : editingContext?.type === 'passport-nationality' || editingContext?.type === 'nationality-selector' ? (
                <>
                  <NationalitySelector
                    label=""
                    value={editValue}
                    onValueChange={handleAutoSave}
                    style={styles.nationalitySelector}
                  />
                </>
              ) : editingContext?.key === 'gender' ? (
                <View>
                  <Text style={styles.modalSubtitle}>请选择性别</Text>
                  {renderGenderOptions()}
                </View>
              ) : editingContext?.key === 'dateOfBirth' ? (
                <View>
                  <TextInput
                    value={editValue}
                    onChangeText={handleDateInputChange}
                    placeholder={editingContext?.placeholder}
                    style={[
                      styles.modalInput,
                      editingContext?.multiline && styles.modalInputMultiline,
                      validationError && styles.modalInputError,
                    ]}
                    multiline={!!editingContext?.multiline}
                    numberOfLines={editingContext?.multiline ? 4 : 1}
                    textAlignVertical={editingContext?.multiline ? 'top' : 'center'}
                    keyboardType="numeric"
                    autoFocus
                    returnKeyType={(() => {
                      const fields = (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') 
                        ? personalFields 
                        : fundingFields;
                      return editingContext.fieldIndex < fields.length - 1 ? 'next' : 'done';
                    })()}
                    onSubmitEditing={() => {
                      // Validate before navigating
                      if (editValue.length === 10) {
                        const validation = validateDateOfBirth(editValue);
                        if (!validation.valid) {
                          setValidationError(validation.error);
                          return;
                        }
                      }
                      
                      const fields = (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') 
                        ? personalFields 
                        : fundingFields;
                      if (editingContext.fieldIndex < fields.length - 1) {
                        handleNavigateField('next');
                      } else {
                        handleCancelEdit();
                      }
                    }}
                  />
                  {validationError && (
                    <Text style={styles.validationError}>{validationError}</Text>
                  )}
                  <Text style={styles.dateHint}>
                    {t('profile.personal.fields.dateOfBirth.hint', { 
                      defaultValue: '示例: 1990-05-15 (年-月-日)' 
                    })}
                  </Text>
                </View>
              ) : (
                <TextInput
                  value={editValue}
                  onChangeText={handleAutoSave}
                  placeholder={editingContext?.placeholder}
                  style={[
                    styles.modalInput,
                    editingContext?.multiline && styles.modalInputMultiline,
                  ]}
                  multiline={!!editingContext?.multiline}
                  numberOfLines={editingContext?.multiline ? 4 : 1}
                  textAlignVertical={editingContext?.multiline ? 'top' : 'center'}
                  keyboardType={editingContext?.keyboardType || 'default'}
                  autoFocus
                  returnKeyType={(() => {
                    if (!editingContext || editingContext?.multiline) return 'default';
                    const fields = (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') 
                      ? personalFields 
                      : fundingFields;
                    return editingContext.fieldIndex < fields.length - 1 ? 'next' : 'done';
                  })()}
                  onSubmitEditing={() => {
                    if (!editingContext || editingContext?.multiline) return;
                    const fields = (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') 
                      ? personalFields 
                      : fundingFields;
                    if (editingContext.fieldIndex < fields.length - 1) {
                      handleNavigateField('next');
                    } else {
                      handleCancelEdit();
                    }
                  }}
                />
              )}
              <View style={styles.modalActions}>
                {editingContext?.fieldIndex !== null && editingContext !== null && (
                  <View style={styles.modalNavigation}>
                    <TouchableOpacity
                      style={[
                        styles.modalNavButton,
                        editingContext?.fieldIndex === 0 && styles.modalNavButtonDisabled
                      ]}
                      onPress={() => handleNavigateField('prev')}
                      disabled={editingContext?.fieldIndex === 0}
                    >
                      <Text style={[
                        styles.modalNavButtonText,
                        editingContext?.fieldIndex === 0 && styles.modalNavButtonTextDisabled
                      ]}>
                        {t('profile.editModal.previous', { defaultValue: '← Previous' })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalNavButton,
                        (() => {
                          const fields = (editingContext?.type === 'personal' || editingContext?.type === 'nationality-selector') 
                            ? personalFields 
                            : fundingFields;
                          return editingContext?.fieldIndex === fields.length - 1;
                        })() && styles.modalNavButtonDisabled
                      ]}
                      onPress={() => handleNavigateField('next')}
                      disabled={(() => {
                        const fields = (editingContext?.type === 'personal' || editingContext?.type === 'nationality-selector') 
                            ? personalFields 
                            : fundingFields;
                        return editingContext?.fieldIndex === fields.length - 1;
                      })()}
                    >
                      <Text style={[
                        styles.modalNavButtonText,
                        (() => {
                          const fields = (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') 
                            ? personalFields 
                            : fundingFields;
                          return editingContext.fieldIndex === fields.length - 1;
                        })() && styles.modalNavButtonTextDisabled
                      ]}>
                        {t('profile.editModal.next', { defaultValue: 'Next →' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.modalDoneButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.modalDoneText}>
                    {t('profile.editModal.done', { defaultValue: 'Done' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Fund Item Detail Modal */}
      <FundItemDetailModal
        visible={fundItemModalVisible}
        fundItem={selectedFundItem}
        onClose={handleFundItemModalClose}
        onUpdate={handleFundItemUpdate}
        onDelete={handleFundItemDelete}
        onManageAll={handleFundItemManageAll}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  settingsIcon: {
    fontSize: 24,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userPhone: {
    ...typography.body1,
    color: colors.textSecondary,
  },

  // Personal Info Section Styles
  personalInfoSection: {
    margin: spacing.md,
  },
  personalInfoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  personalInfoIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personalInfoLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  fieldCount: {
    ...typography.caption,
    fontWeight: '600',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
    marginLeft: spacing.xs,
  },
  fieldCountComplete: {
    color: '#155724', // Dark green
    backgroundColor: '#d4edda', // Light green
  },
  fieldCountIncomplete: {
    color: '#856404', // Dark yellow/orange
    backgroundColor: '#fff3cd', // Light yellow
  },
  sectionHeaderSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionToggleArrow: {
    ...typography.body1,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  collapsedHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  infoList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  infoTitle: {
    ...typography.body1,
    color: colors.text,
  },
  infoSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoFormatHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 1,
    fontSize: 11,
  },
  infoValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  infoValue: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '80%',
  },
  infoPlaceholder: {
    color: colors.textTertiary,
  },
  rowArrow: {
    ...typography.body1,
    color: colors.textDisabled,
    marginLeft: spacing.xs,
  },
  fundingSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  fundingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fundingIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  fundingTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  fundingTip: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.small,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  fundingTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fundingCheckIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  fundingTipText: {
    flex: 1,
  },
  fundingTipTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
  },
  fundingTipSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fundingTipDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionRowText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  fundingFooterNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  modalInput: {
    ...typography.body1,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
    backgroundColor: colors.white,
  },
  modalInputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  modalInputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  validationError: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  dateHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  modalActions: {
    flexDirection: 'column',
    marginTop: spacing.lg,
  },
  modalNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalNavButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.small,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    backgroundColor: colors.white,
  },
  modalNavButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  modalNavButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  modalNavButtonTextDisabled: {
    color: colors.textDisabled,
  },
  modalDoneButton: {
    width: '100%',
    borderRadius: borderRadius.small,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  modalDoneText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  modalSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.small,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  modalSecondaryText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  modalPrimaryButton: {
    flex: 1,
    borderRadius: borderRadius.small,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  modalPrimaryText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  nationalitySelector: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  passportNameInput: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  genderOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minWidth: 80,
    alignItems: 'center',
  },
  genderOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  genderOptionText: {
    ...typography.body1,
    color: colors.text,
  },
  genderOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Update Passport Button Styles
  updatePassportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  updatePassportText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  updatePassportArrow: {
    ...typography.h3,
    color: colors.primary,
    marginLeft: spacing.xs,
  },

  vipCard: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  vipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vipIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  vipInfo: {
    flex: 1,
  },
  vipTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  vipSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  vipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.small,
  },
  vipButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  vipArrow: {
    ...typography.h3,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
  },
  divider: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    height: 8,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textTertiary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    ...typography.body1,
    color: colors.text,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    marginRight: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  menuArrow: {
    ...typography.h2,
    color: colors.textDisabled,
  },
  logoutButton: {
    margin: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    ...typography.body1,
    color: colors.error,
  },
  version: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },

  // Draft Saved Notification
  draftNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.small,
  },
  draftNotificationIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  draftNotificationText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },

  
  // Empty state styles
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Fund item styles
  fundItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fundItemIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  fundItemDetails: {
    flex: 1,
  },
  fundItemType: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  fundItemValue: {
    ...typography.body1,
    color: colors.textSecondary,
  },
});

export default ProfileScreen;
