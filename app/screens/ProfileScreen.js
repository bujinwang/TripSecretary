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
import { useTranslation, useLocale, getLanguageOptions } from '../i18n/LocaleContext';
import { NationalitySelector, PassportNameInput } from '../components';
import FundItemDetailModal from '../components/FundItemDetailModal';
import { destinationRequirements } from '../config/destinationRequirements';
import PassportDataService from '../services/data/PassportDataService';
import SecureStorageService from '../services/security/SecureStorageService';
import DataExportService from '../services/export/DataExportService';

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
  
  // Fund item creation state
  const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
  const [newFundItemType, setNewFundItemType] = useState(null);

  const [expandedSection, setExpandedSection] = useState(null); // 'personal', 'passport', 'funding', or null
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
        // Get userId (for now using 'user_001', in production this would come from auth)
        const userId = 'user_001';
        
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
        
        // Load fund items (force refresh to ensure fresh data)
         try {
           const items = await PassportDataService.getFundItems(userId, { forceRefresh: true });
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
          const userId = 'user_001';
          // Invalidate cache first to ensure fresh data when screen comes into focus
          PassportDataService.invalidateCache('fundItems', userId);
          const items = await PassportDataService.getFundItems(userId, { forceRefresh: true });
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
            id: 'entryInfoHistory',
            icon: '📋',
            title: t('profile.menu.entryInfoHistory.title', { defaultValue: 'Entry Info History' }),
            subtitle: t('profile.menu.entryInfoHistory.subtitle', { defaultValue: 'View completed trips and archived entry info' }),
          },
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
          {
            id: 'notificationLogs',
            icon: '📊',
            title: t('profile.menu.notificationLogs.title', { defaultValue: 'Notification Logs' }),
            subtitle: t('profile.menu.notificationLogs.subtitle', { defaultValue: 'View notification history and analytics' }),
          },
          {
            id: 'exportData',
            icon: '📤',
            title: t('profile.menu.exportData.title', { defaultValue: 'Export My Data' }),
            subtitle: t('profile.menu.exportData.subtitle', { defaultValue: 'Download entry pack data as JSON' }),
          },
        ],
      },
      // Development tools section (only in development mode)
      ...(__DEV__ ? [{
        section: 'Development Tools',
        items: [
          {
            id: 'notificationTest',
            icon: '🧪',
            title: 'Notification Testing',
            subtitle: 'Test and debug notification system',
          },
        ],
      }] : []),
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

  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);

  const handleMenuPress = (itemId) => {
    if (itemId === 'language') {
      setLanguageSelectorVisible(true);
    } else if (itemId === 'notifications') {
      navigation.navigate('NotificationSettings');
    } else if (itemId === 'notificationLogs') {
      navigation.navigate('NotificationLog');
    } else if (itemId === 'entryInfoHistory') {
      navigation.navigate('EntryInfoHistory');
    } else if (itemId === 'exportData') {
      handleExportData();
    } else if (itemId === 'notificationTest') {
      navigation.navigate('NotificationTest');
    }
    // TODO: Navigate to other screens
  };

  const handleExportData = async () => {
    try {
      // Show confirmation dialog
      Alert.alert(
        t('profile.export.confirmTitle', { defaultValue: 'Export Data' }),
        t('profile.export.confirmMessage', { 
          defaultValue: 'This will export all your entry pack data as a JSON file. Continue?' 
        }),
        [
          {
            text: t('profile.export.cancel', { defaultValue: 'Cancel' }),
            style: 'cancel'
          },
          {
            text: t('profile.export.confirm', { defaultValue: 'Export' }),
            onPress: performDataExport
          }
        ]
      );
    } catch (error) {
      console.error('Export data error:', error);
      Alert.alert(
        t('profile.export.errorTitle', { defaultValue: 'Export Failed' }),
        t('profile.export.errorMessage', { defaultValue: 'Failed to export data. Please try again.' })
      );
    }
  };

  const performDataExport = async () => {
    try {
      // For now, we'll export a sample entry pack
      // In a real implementation, you'd get the actual entry pack ID from the user's data
      const userId = 'user_001';
      
      // Check if user has any entry packs
      const userData = await PassportDataService.getAllUserData(userId);
      
      if (!userData.passport && !userData.personalInfo && (!userData.funds || userData.funds.length === 0)) {
        Alert.alert(
          t('profile.export.noDataTitle', { defaultValue: 'No Data to Export' }),
          t('profile.export.noDataMessage', { 
            defaultValue: 'You don\'t have any entry pack data to export yet.' 
          })
        );
        return;
      }

      // Create a mock entry pack for export (in real implementation, this would be actual entry pack data)
      const mockEntryPackData = {
        entryPack: {
          id: `export_${Date.now()}`,
          userId: userId,
          destinationId: 'thailand',
          status: 'in_progress',
          createdAt: new Date().toISOString(),
          exportData: () => ({
            id: `export_${Date.now()}`,
            userId: userId,
            destinationId: 'thailand',
            status: 'in_progress',
            createdAt: new Date().toISOString()
          }),
          getSubmissionAttemptCount: () => 0,
          getFailedSubmissionCount: () => 0,
          hasValidTDACSubmission: () => false,
          displayStatus: { completionPercent: 75 }
        },
        entryInfo: null,
        passport: userData.passport,
        personalInfo: userData.personalInfo,
        funds: userData.funds || [],
        travel: null
      };

      // Export as JSON
      const result = await DataExportService.exportAsJSON(mockEntryPackData, {
        includeMetadata: true,
        includeSubmissionHistory: false,
        includePhotos: true
      });

      if (result.success) {
        // Show success dialog with sharing option
        Alert.alert(
          t('profile.export.successTitle', { defaultValue: 'Export Complete' }),
          t('profile.export.successMessage', { 
            defaultValue: `Data exported successfully!\nFile: ${result.filename}\nSize: ${Math.round(result.fileSize / 1024)} KB` 
          }),
          [
            {
              text: t('profile.export.ok', { defaultValue: 'OK' }),
              style: 'default'
            },
            {
              text: t('profile.export.share', { defaultValue: 'Share' }),
              onPress: () => shareExportedFile(result.sharingOptions)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Perform data export error:', error);
      Alert.alert(
        t('profile.export.errorTitle', { defaultValue: 'Export Failed' }),
        t('profile.export.errorMessage', { 
          defaultValue: `Failed to export data: ${error.message}` 
        })
      );
    }
  };

  const shareExportedFile = async (sharingOptions) => {
    try {
      if (!sharingOptions.available) {
        Alert.alert(
          t('profile.export.shareUnavailableTitle', { defaultValue: 'Sharing Not Available' }),
          t('profile.export.shareUnavailableMessage', { 
            defaultValue: 'File sharing is not supported on this device' 
          })
        );
        return;
      }

      await sharingOptions.share({
        title: t('profile.export.shareTitle', { defaultValue: 'Entry Pack Data Export' }),
        message: t('profile.export.shareMessage', { defaultValue: 'Here is my travel entry pack data' })
      });
    } catch (error) {
      console.error('Share exported file error:', error);
      Alert.alert(
        t('profile.export.shareErrorTitle', { defaultValue: 'Share Failed' }),
        t('profile.export.shareErrorMessage', { 
          defaultValue: `Failed to share file: ${error.message}` 
        })
      );
    }
  };

  const handleLanguageChange = (newLanguage) => {
    const { setLanguage } = useLocale();
    setLanguage(newLanguage);
    setLanguageSelectorVisible(false);
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
      const userId = 'user_001';
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
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) {
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

    const userId = 'user_001';

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
            const userId = 'user_001';
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

    const userId = 'user_001';

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
      // Invalidate cache first to ensure fresh data
      const userId = 'user_001';
      PassportDataService.invalidateCache('fundItems', userId);

      // Refresh fund items list
      const items = await PassportDataService.getFundItems(userId, { forceRefresh: true });
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
      // Invalidate cache first to ensure fresh data
      const userId = 'user_001';
      PassportDataService.invalidateCache('fundItems', userId);

      // Refresh fund items list
      const items = await PassportDataService.getFundItems(userId, { forceRefresh: true });
      console.log('Refreshed fund items after delete:', items);
      setFundItems(items || []);
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

  const handleManageFundItems = () => {
    // Navigate to Thailand travel info screen where fund items can be managed
    navigation.navigate('ThailandTravelInfo', { destination: 'th' });
  };

  // Handle add fund item button press
  const handleAddFundItem = () => {
    showFundItemTypeSelector();
  };

  // Show fund item type selector alert
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

  // Handle create fund item with selected type
  const handleCreateFundItem = (type) => {
    setNewFundItemType(type);
    setIsCreatingFundItem(true);
    setFundItemModalVisible(true);
  };

  // Handle fund item created
  const handleFundItemCreate = async (newItem) => {
    try {
      // Invalidate cache first to ensure fresh data
      const userId = 'user_001';
      PassportDataService.invalidateCache('fundItems', userId);

      // Refresh fund items list
      const items = await PassportDataService.getFundItems(userId, { forceRefresh: true });
      console.log('Refreshed fund items after create:', items);
      setFundItems(items || []);
      setFundItemModalVisible(false);
      setIsCreatingFundItem(false);
      setNewFundItemType(null);
    } catch (error) {
      console.error('Error refreshing fund items after create:', error);
    }
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
            <Text style={styles.userName}>{passportData.name || '张伟'}</Text>
            <Text style={styles.userPhone}>
              {personalInfo.phone ? t('profile.user.phone', { phone: personalInfo.phone }) : t('profile.user.phone', { phone: '138****1234' })}
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

                {/* Fund Items List or Empty State */}
                {fundItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      {t('profile.funding.empty', { defaultValue: 'No fund items yet. Tap below to add your first item.' })}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.infoList}>
                    {fundItems.map((item, index) => {
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
                    })}
                  </View>
                )}

                {/* Add Fund Item Button */}
                <TouchableOpacity
                  style={styles.addFundItemButton}
                  onPress={handleAddFundItem}
                  accessibilityRole="button"
                  accessibilityLabel={t('profile.funding.addButton', { defaultValue: 'Add Fund Item' })}
                >
                  <Text style={styles.addFundItemIcon}>➕</Text>
                  <Text style={styles.addFundItemText}>
                    {t('profile.funding.addButton', { defaultValue: 'Add Fund Item' })}
                  </Text>
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
        fundItem={isCreatingFundItem ? null : selectedFundItem}
        isCreateMode={isCreatingFundItem}
        createItemType={newFundItemType}
        onClose={handleFundItemModalClose}
        onUpdate={handleFundItemUpdate}
        onCreate={handleFundItemCreate}
        onDelete={handleFundItemDelete}
        onManageAll={handleManageFundItems}
      />

      {/* Language Selector Modal */}
      <Modal
        visible={languageSelectorVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLanguageSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <View style={styles.languageModal}>
            <View style={styles.languageModalHeader}>
              <Text style={styles.languageModalTitle}>
                {t('progressiveEntryFlow.settings.selectLanguage', { defaultValue: 'Select Language' })}
              </Text>
              <TouchableOpacity
                onPress={() => setLanguageSelectorVisible(false)}
                style={styles.languageModalClose}
              >
                <Text style={styles.languageModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageOptions}>
              {getLanguageOptions(t).map((option) => (
                <TouchableOpacity
                  key={option.code}
                  style={[ 
                    styles.languageOption,
                    language === option.code && styles.languageOptionSelected
                  ]}
                  onPress={() => handleLanguageChange(option.code)}
                >
                  <Text style={[ 
                    styles.languageOptionText,
                    language === option.code && styles.languageOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {language === option.code && (
                    <Text style={styles.languageOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: spacing.md,
  },
  fundingIcon: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  fundingTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  fundingTip: {
    backgroundColor: '#E3F2FD', // Light blue background
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#90CAF9', // Light blue border
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
    fontWeight: 'bold',
    color: '#0D47A1', // Dark blue text
  },
  fundingTipSubtitle: {
    ...typography.body2,
    color: '#1565C0', // Medium blue text
    marginTop: 2,
  },
  fundingTipDescription: {
    ...typography.caption,
    color: '#1E88E5', // Lighter blue text
    lineHeight: 18,
  },
  fundingList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
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
    fontWeight: 'bold',
    color: colors.text,
  },
  fundItemValue: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  addFundItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.medium,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },
  addFundItemIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  addFundItemText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  updatePassportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  updatePassportText: {
    ...typography.body2,
    color: colors.secondary,
  },
  updatePassportArrow: {
    ...typography.body2,
    color: colors.secondary,
    marginLeft: spacing.xs,
  },
  fundingFooterNote: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  vipCard: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  vipInfo: {
    flex: 1
  },
  vipTitle: {
    ...typography.h3,
    color: colors.white,
  },
  vipSubtitle: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  vipButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  vipButtonText: {
    ...typography.body1,
    color: '#FFD700', // Gold color
    fontWeight: 'bold',
  },
  vipArrow: {
    ...typography.body1,
    color: '#FFD700', // Gold color
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.sm,
  },
  divider: {
    paddingHorizontal: spacing.md,
    height: 30,
    justifyContent: 'center',
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: spacing.md
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
  },
  menuArrow: {
    ...typography.h3,
    color: colors.textTertiary,
    marginLeft: spacing.sm
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  logoutText: {
    ...typography.body1,
    color: colors.error,
  },
  version: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: spacing.md
  },
  draftNotification: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20, 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    zIndex: 100
  },
  draftNotificationIcon: {
    fontSize: 16,
    marginRight: 8
  },
  draftNotificationText: {
    color: '#fff',
    fontWeight: 'bold'
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    ...typography.body1,
    marginBottom: spacing.sm,
  },
  modalInputMultiline: {
    height: 100,
  },
  modalInputError: {
    borderColor: colors.error,
  },
  passportNameInput: {
    borderWidth: 0,
    padding: 0,
    marginTop: -spacing.sm
  },
  nationalitySelector: { 

  },
  dateHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  validationError: {
    color: colors.error,
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  genderOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  genderOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  genderOptionText: {
    ...typography.body1,
    color: colors.text
  },
  genderOptionTextActive: {
    color: colors.white
  },
  modalActions: {
    marginTop: spacing.md
  },
  modalNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  modalNavButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalNavButtonDisabled: {
    opacity: 0.4,
  },
  modalNavButtonText: {
    ...typography.body1,
    color: colors.secondary,
    fontWeight: 'bold'
  },
  modalNavButtonTextDisabled: {
    color: colors.textDisabled
  },
  modalDoneButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center'
  },
  modalDoneText: {
    ...typography.h3,
    color: colors.white
  },
  languageModal: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  languageModalTitle: {
    ...typography.h3,
  },
  languageModalClose: {
    padding: spacing.xs,
  },
  languageModalCloseText: {
    fontSize: 24,
    color: colors.textSecondary
  },
  languageOptions: {
    marginTop: spacing.sm,
    maxHeight: 300
  },
  languageOption: {
    paddingVertical: spacing.md,
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  languageOptionSelected: {
    backgroundColor: colors.primaryLight
  },
  languageOptionText: {
    ...typography.body1,
  },
  languageOptionTextSelected: {
    fontWeight: 'bold', 
    color: colors.primary
  },
  languageOptionCheck: {
    ...typography.body1, 
    color: colors.primary,
    fontWeight: 'bold'
  }
});

export default ProfileScreen;