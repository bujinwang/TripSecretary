// 入境通 - Profile Screen
import React, { useMemo, useState, useEffect } from 'react';
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
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import { NationalitySelector, PassportNameInput } from '../components';
import { destinationRequirements } from '../config/destinationRequirements';
import SecureStorageService from '../services/security/SecureStorageService';

const ProfileScreen = ({ navigation, route }) => {
  const { t, language } = useTranslation();

  // Get destination from route params (e.g., 'th', 'us', 'ca')
  const destination = route?.params?.destination;

  // Mock passport data (in real app, get from context/storage)
  const [passportData, setPassportData] = useState({
    type: '中国护照',
    name: 'ZHANG, WEI', // Format: SURNAME, GIVENNAME (comma-separated for PassportNameInput)
    nameEn: 'ZHANG, WEI',
    passportNo: 'E12345678',
    nationality: 'CHN', // Store as ISO code only
    expiry: '2030-12-31',
    issueDate: '2020-12-31',
    issuePlace: 'Shanghai',
  });


  // Personal info state
  const [personalInfo, setPersonalInfo] = useState({
    dateOfBirth: '1988-01-22',
    gender: 'MALE',
    occupation: 'BUSINESS MAN',
    provinceCity: 'ANHUI',
    countryRegion: 'CHN', // Default to passport nationality, just ISO code
    phone: '+86 12343434343',
    email: 'traveler@example.com',
  });

  const [fundingProof, setFundingProof] = useState({
    cashAmount: t('profile.funding.fields.cashAmount.sample', {
      defaultValue: '10,000 THB equivalent cash (about ¥2,000)',
    }),
    bankCards: t('profile.funding.fields.bankCards.sample', {
      defaultValue:
        'CMB Visa (****1234) · Balance 20,000 CNY\nICBC Debit (****8899) · Balance 15,000 CNY',
    }),
    supportingDocs: t('profile.funding.fields.supportingDocs.sample', {
      defaultValue: 'Bank app screenshots and recent transaction PDFs saved',
    }),
  });

  const [showPersonalInfo, setShowPersonalInfo] = useState(true);
  const [showPassportInfo, setShowPassportInfo] = useState(true);
  const [showFundingProof, setShowFundingProof] = useState(true);
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

  // Debug: Log when component mounts and when personalInfo changes
  useEffect(() => {
    console.log('ProfileScreen mounted or personalInfo changed:', personalInfo);
  }, [personalInfo]);

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        console.log('=== LOADING SAVED DATA ===');
        const savedPersonalInfo = await SecureStorageService.getItem('personalInfo');
        const savedPassportData = await SecureStorageService.getItem('passportData');
        
        console.log('Raw savedPersonalInfo:', savedPersonalInfo);
        console.log('Raw savedPassportData:', savedPassportData);
        
        if (savedPersonalInfo) {
          const parsed = JSON.parse(savedPersonalInfo);
          console.log('Parsed personalInfo:', JSON.stringify(parsed, null, 2));
          console.log('Gender from saved data:', parsed.gender);
          
          // Merge with defaults to ensure all fields exist
          setPersonalInfo(prev => {
            const merged = {
              ...prev,
              ...parsed
            };
            console.log('Merged personalInfo:', merged);
            console.log('Final gender value:', merged.gender);
            return merged;
          });
        } else {
          console.log('No saved personalInfo found, using defaults');
        }
        
        if (savedPassportData) {
          const parsed = JSON.parse(savedPassportData);
          console.log('Loading saved passportData:', parsed);
          
          // Migrate old data format: if name is missing but nameEn exists, use nameEn
          if (!parsed.name && parsed.nameEn) {
            // Convert "ZHANG WEI" to "ZHANG, WEI" format if no comma exists
            if (parsed.nameEn && !parsed.nameEn.includes(',')) {
              const parts = parsed.nameEn.trim().split(/\s+/);
              if (parts.length >= 2) {
                // Assume first part is surname, rest is given name
                parsed.name = `${parts[0]}, ${parts.slice(1).join(' ')}`;
              } else {
                parsed.name = parsed.nameEn;
              }
            } else {
              parsed.name = parsed.nameEn;
            }
            console.log('Migrated name from nameEn:', parsed.nameEn, 'to:', parsed.name);
          }
          
          setPassportData(parsed);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    
    loadSavedData();
  }, []);

  // Save personalInfo whenever it changes
  useEffect(() => {
    const savePersonalInfo = async () => {
      try {
        await SecureStorageService.setItem('personalInfo', JSON.stringify(personalInfo));
        console.log('Saved personalInfo to storage');
      } catch (error) {
        console.error('Error saving personalInfo:', error);
      }
    };
    
    savePersonalInfo();
  }, [personalInfo]);

  // Save passportData whenever it changes
  useEffect(() => {
    const savePassportData = async () => {
      try {
        await SecureStorageService.setItem('passportData', JSON.stringify(passportData));
        console.log('Saved passportData to storage');
      } catch (error) {
        console.error('Error saving passportData:', error);
      }
    };
    
    savePassportData();
  }, [passportData]);

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

  const fundingFields = useMemo(
    () => [
      {
        key: 'cashAmount',
        title: t('profile.funding.fields.cashAmount.title', { defaultValue: 'Cash on hand' }),
        placeholder: t('profile.funding.fields.cashAmount.placeholder', {
          defaultValue: 'e.g. 10,000 THB cash + 500 USD',
        }),
      },
      {
        key: 'bankCards',
        title: t('profile.funding.fields.bankCards.title', { defaultValue: 'Bank cards & balances' }),
        placeholder: t('profile.funding.fields.bankCards.placeholder', {
          defaultValue: 'e.g.\nCMB Visa (****1234) · Balance 20,000 CNY',
        }),
        multiline: true,
      },
      {
        key: 'supportingDocs',
        title: t('profile.funding.fields.supportingDocs.title', { defaultValue: 'Supporting documents' }),
        placeholder: t('profile.funding.fields.supportingDocs.placeholder', {
          defaultValue: 'e.g. bank balance screenshots, transaction PDFs, statements',
        }),
        multiline: true,
      },
    ],
    [t, language]
  );

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
          {
            id: 'clearStorage',
            icon: '🗑️',
            title: t('profile.menu.clearStorage.title', { defaultValue: 'Clear Saved Data' }),
            subtitle: t('profile.menu.clearStorage.subtitle', { defaultValue: 'Reset to defaults (for debugging)' }),
          },
        ],
      },
    ],
    [t, languageLabel]
  );

  const handleMenuPress = (itemId) => {
    console.log('Menu pressed:', itemId);
    if (itemId === 'language') {
      // Navigate back to login to change language
      navigation.replace('Login');
    } else if (itemId === 'clearStorage') {
      handleClearStorage();
      Alert.alert(
        'Storage Cleared',
        'All saved data has been reset to defaults.',
        [{ text: 'OK' }]
      );
    }
    // TODO: Navigate to respective screens
  };

  const handleLogout = () => {
    console.log('Logout');
    // TODO: Implement logout
    navigation.replace('Login');
  };

  const handleClearStorage = async () => {
    try {
      await SecureStorageService.removeItem('personalInfo');
      await SecureStorageService.removeItem('passportData');
      console.log('Storage cleared successfully');
      // Reset to defaults
      setPersonalInfo({
        dateOfBirth: '1988-01-22',
        gender: 'MALE',
        occupation: 'BUSINESS MAN',
        provinceCity: 'ANHUI',
        countryRegion: 'CHN',
        phone: '+86 12343434343',
        email: 'traveler@example.com',
      });
      setPassportData({
        type: '中国护照',
        name: 'ZHANG, WEI',
        nameEn: 'ZHANG, WEI',
        passportNo: 'E12345678',
        nationality: 'CHN',
        expiry: '2030-12-31',
        issueDate: '2020-12-31',
        issuePlace: 'Shanghai',
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  // Expose clear storage function globally for debugging
  useEffect(() => {
    global.clearProfileStorage = handleClearStorage;
    return () => {
      delete global.clearProfileStorage;
    };
  }, []);

  const handleStartEdit = (type, field, fieldIndex = null) => {
    console.log('handleStartEdit called with type:', type, 'field:', field.key);
    console.log('Current personalInfo:', personalInfo);
    let currentValue;
    if (type === 'personal') {
      currentValue = personalInfo[field.key];
    } else if (type === 'funding') {
      currentValue = fundingProof[field.key];
    } else if (type === 'passport-nationality') {
      currentValue = passportData.nationality;
    } else if (type === 'passport-name') {
      currentValue = passportData.name;
    } else if (type === 'nationality-selector') {
      currentValue = personalInfo[field.key]; // For country/region field
    }
    console.log('Setting editingContext with type:', type, 'field.key:', field.key, 'currentValue:', currentValue);
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
    } else if (editingContext.type === 'funding') {
      fields = fundingFields;
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

  const handleGenderSelect = (value) => {
    console.log('Gender selected:', value);
    setEditValue(value);
    setPersonalInfo((prev) => {
      const updated = {
        ...prev,
        gender: value,
      };
      console.log('Updated personalInfo:', updated);
      return updated;
    });
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

    console.log('renderGenderOptions - editValue:', editValue, 'personalInfo.gender:', personalInfo.gender);

    return (
      <View style={styles.genderOptions}>
        {options.map((option) => {
          const isActive = editValue === option.value;
          console.log(`Option ${option.value}: editValue="${editValue}", isActive=${isActive}`);
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

  const handleAutoSave = (value) => {
    if (!editingContext) {
      return;
    }

    setEditValue(value);

    // Auto-save after user stops typing (debounce)
    setTimeout(() => {
      if (editingContext.type === 'personal') {
        setPersonalInfo((prev) => ({
          ...prev,
          [editingContext.key]: value,
        }));
      } else if (editingContext.type === 'funding') {
        setFundingProof((prev) => ({
          ...prev,
          [editingContext.key]: value,
        }));
      } else if (editingContext.type === 'passport-nationality') {
        setPassportData((prev) => ({
          ...prev,
          [editingContext.key]: value,
        }));
      } else if (editingContext.type === 'nationality-selector') {
        setPersonalInfo((prev) => ({
          ...prev,
          [editingContext.key]: value,
        }));
      }

      showDraftSavedNotification(editingContext.title);
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
    setTimeout(() => {
      if (editingContext?.key === 'dateOfBirth' && formatted.length === 10) {
        const validation = validateDateOfBirth(formatted);
        if (validation.valid) {
          setPersonalInfo((prev) => ({
            ...prev,
            dateOfBirth: formatted,
          }));
          showDraftSavedNotification('出生日期');
        }
      }
    }, 1000);
  };

  const handleSaveEdit = () => {
    // For immediate save when user taps save button (if they want to save immediately)
    if (!editingContext) {
      return;
    }

    if (editingContext.type === 'personal') {
      setPersonalInfo((prev) => ({
        ...prev,
        [editingContext.key]: editValue,
      }));
    } else if (editingContext.type === 'funding') {
      setFundingProof((prev) => ({
        ...prev,
        [editingContext.key]: editValue,
      }));
    } else if (editingContext.type === 'passport-nationality') {
      setPassportData((prev) => ({
        ...prev,
        [editingContext.key]: editValue,
      }));
    } else if (editingContext.type === 'passport-name') {
      setPassportData((prev) => ({
        ...prev,
        [editingContext.key]: editValue,
      }));
    } else if (editingContext.type === 'nationality-selector') {
      setPersonalInfo((prev) => ({
        ...prev,
        [editingContext.key]: editValue,
      }));
    }

    showDraftSavedNotification(editingContext.title);
    handleCancelEdit();
  };

  const handleScanFundingProof = () => {
    console.log('Scan or upload funding proof');
    // TODO: Navigate to scanner / uploader screen
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
              onPress={() => setShowPersonalInfo((prev) => !prev)}
              accessibilityRole="button"
            >
              <Text style={styles.personalInfoIcon}>👤</Text>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.personalInfoLabel}>{personalTitle}</Text>
                <Text style={styles.sectionHeaderSubtitle}>{personalSubtitle}</Text>
              </View>
              <Text style={styles.sectionToggleArrow}>
                {showPersonalInfo ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showPersonalInfo ? (
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
              onPress={() => setShowFundingProof((prev) => !prev)}
              accessibilityRole="button"
            >
              <Text style={styles.fundingIcon}>💰</Text>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.fundingTitle}>{fundingTitle}</Text>
                <Text style={styles.sectionHeaderSubtitle}>{fundingSubtitle}</Text>
              </View>
              <Text style={styles.sectionToggleArrow}>
                {showFundingProof ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showFundingProof ? (
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
                  {fundingFields.map((field, index) => {
                    const value = fundingProof[field.key];
                    const isLast = index === fundingFields.length - 1;

                    return (
                      <TouchableOpacity
                        key={field.key}
                        style={[styles.infoRow, !isLast && styles.infoRowDivider]}
                        onPress={() => handleStartEdit('funding', field, index)}
                        accessibilityRole="button"
                      >
                        <View style={styles.infoRowText}>
                          <Text style={styles.infoTitle}>{field.title}</Text>
                        </View>
                        <View style={styles.infoValueWrap}>
                          <Text
                            style={[
                              styles.infoValue,
                              !value && styles.infoPlaceholder,
                            ]}
                            numberOfLines={field.multiline ? 3 : 1}
                          >
                            {value || notFilledLabel}
                          </Text>
                          <Text style={styles.rowArrow}>›</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleScanFundingProof}
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
              onPress={() => setShowPassportInfo((prev) => !prev)}
              accessibilityRole="button"
            >
              <Text style={styles.personalInfoIcon}>📘</Text>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.personalInfoLabel}>
                  {t('profile.passport.title', { defaultValue: 'My Passport' })}
                </Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  {t('profile.passport.subtitle', {
                    passportNo: passportData.passportNo,
                    expiry: passportData.expiry,
                    defaultValue: `${passportData.passportNo} · Valid until ${passportData.expiry}`,
                  })}
                </Text>
              </View>
              <Text style={styles.sectionToggleArrow}>
                {showPassportInfo ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showPassportInfo ? (
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

                <View style={styles.infoItem}>
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>
                      {t('profile.passport.fields.passportNo', { defaultValue: 'Passport Number' })}
                    </Text>
                    <Text style={styles.infoSubtitle}>Passport No.</Text>
                  </View>
                  <Text style={styles.infoValue}>{passportData.passportNo}</Text>
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

                <View style={styles.infoItem}>
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>
                      {t('profile.passport.fields.issueDate', { defaultValue: 'Issue Date' })}
                    </Text>
                    <Text style={styles.infoSubtitle}>Issue Date</Text>
                  </View>
                  <Text style={styles.infoValue}>{passportData.issueDate}</Text>
                </View>

                <View style={[styles.infoItem, { borderBottomWidth: 0 }]}>
                  <View style={styles.infoHeader}>
                    <Text style={styles.infoTitle}>
                      {t('profile.passport.fields.issuePlace', { defaultValue: 'Issue Place' })}
                    </Text>
                    <Text style={styles.infoSubtitle}>Place of Issue</Text>
                  </View>
                  <Text style={styles.infoValue}>{passportData.issuePlace}</Text>
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

        {/* Generate Entry Card Button */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => navigation.navigate('SelectDestination')}
        >
          <Text style={styles.generateButtonIcon}>🚀</Text>
          <View style={styles.generateButtonText}>
            <Text style={styles.generateButtonTitle}>
              {t('profile.generate.title', { defaultValue: 'Generate Entry Card' })}
            </Text>
            <Text style={styles.generateButtonSubtitle}>
              {t('profile.generate.subtitle', { defaultValue: 'Create your personalized entry guide' })}
            </Text>
          </View>
          <Text style={styles.generateButtonArrow}>›</Text>
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
              {(() => {
                console.log('=== MODAL RENDERING ===');
                console.log('editingContext:', editingContext);
                console.log('editValue:', editValue);
                console.log('personalInfo.gender:', personalInfo.gender);
                return null;
              })()}
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
                  {console.log('Rendering NationalitySelector for type:', editingContext?.type)}
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
                  {(() => {
                    console.log('Rendering gender modal - editValue:', editValue, 'personalInfo.gender:', personalInfo.gender);
                    return renderGenderOptions();
                  })()}
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
                    if (editingContext?.multiline) return 'default';
                    const fields = (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') 
                      ? personalFields 
                      : fundingFields;
                    return editingContext.fieldIndex < fields.length - 1 ? 'next' : 'done';
                  })()}
                  onSubmitEditing={() => {
                    if (editingContext?.multiline) return;
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
                {editingContext?.fieldIndex !== null && (
                  <View style={styles.modalNavigation}>
                    <TouchableOpacity
                      style={[
                        styles.modalNavButton,
                        editingContext.fieldIndex === 0 && styles.modalNavButtonDisabled
                      ]}
                      onPress={() => handleNavigateField('prev')}
                      disabled={editingContext.fieldIndex === 0}
                    >
                      <Text style={[
                        styles.modalNavButtonText,
                        editingContext.fieldIndex === 0 && styles.modalNavButtonTextDisabled
                      ]}>
                        {t('profile.editModal.previous', { defaultValue: '← Previous' })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalNavButton,
                        (() => {
                          const fields = (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') 
                            ? personalFields 
                            : fundingFields;
                          return editingContext.fieldIndex === fields.length - 1;
                        })() && styles.modalNavButtonDisabled
                      ]}
                      onPress={() => handleNavigateField('next')}
                      disabled={(() => {
                        const fields = (editingContext.type === 'personal' || editingContext.type === 'nationality-selector') 
                          ? personalFields 
                          : fundingFields;
                        return editingContext.fieldIndex === fields.length - 1;
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
  personalInfoLabel: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
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

  // Generate Button
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginTop: spacing.lg,
  },
  generateButtonIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  generateButtonText: {
    flex: 1,
  },
  generateButtonTitle: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 2,
  },
  generateButtonSubtitle: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.9,
  },
  generateButtonArrow: {
    ...typography.h2,
    color: colors.white,
    marginLeft: spacing.sm,
  },
});

export default ProfileScreen;
