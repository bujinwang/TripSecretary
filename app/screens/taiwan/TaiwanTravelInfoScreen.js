
// 入境通 - Taiwan Travel Info Screen (台湾入境信息)
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
import Button from '../../components/Button';
import Input from '../../components/Input';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../components';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';

// Import secure data models and services
import UserDataService from '../../services/data/UserDataService';

// Import Taiwan-specific utilities and components
import { validateField } from '../../utils/taiwan/TaiwanValidationRules';
import { FieldWarningIcon, InputWithValidation, CollapsibleSection } from '../../components/taiwan/TaiwanTravelComponents';
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const TaiwanTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();
  
  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

  // Data model instances
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);

  // Smart defaults for common scenarios
  const getSmartDefaults = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      arrivalDate: tomorrow.toISOString().split('T')[0], // Default to tomorrow
      stayDuration: '7', // Default to 7 days
    };
  };

  // Auto-complete suggestions for common scenarios
  const getAutoCompleteSuggestions = (fieldType, currentValue) => {
    const suggestions = {
      flightNumber: [
        'CI101', 'CI123', 'BR101', 'BR189', 'CX123', 'CX456',
        'MU5007', 'MU5005', 'CA123', 'CA456', 'ZH123', 'ZH456'
      ],
      hotelName: [
        'Taipei Marriott Hotel', 'Grand Hyatt Taipei',
        'Mandarin Oriental Taipei', 'Shangri-La Taipei',
        'W Taipei', 'Eslite Hotel', 'Hotel Proverbs Taipei'
      ],
      occupation: [
        '软件工程师', '学生', '教师', '医生', '律师', '会计师',
        '销售经理', '退休人员', '家庭主妇', '自由职业者'
      ]
    };

    if (!currentValue || currentValue.length < 2) return [];

    return suggestions[fieldType]?.filter(item =>
      item.toLowerCase().includes(currentValue.toLowerCase())
    ).slice(0, 5) || [];
  };

  // UI State (loaded from database, not from route params)
  const [passportNo, setPassportNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Personal Info State (loaded from database)
  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  // Travel Info State - with smart defaults
  const smartDefaults = getSmartDefaults();
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState(smartDefaults.arrivalDate);
  const [hotelAddress, setHotelAddress] = useState('');
  const [stayDuration, setStayDuration] = useState(smartDefaults.stayDuration);

  // Proof of Funds State
  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [currentFundItem, setCurrentFundItem] = useState(null);
  const [newFundItemType, setNewFundItemType] = useState(null);

  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [lastEditedField, setLastEditedField] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'pending', 'saving', 'saved', 'error'

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
        const personalFields = [occupation, residentCountry, phoneCode, phoneNumber, email, sex];
        total = personalFields.length;
        filled = personalFields.filter(field => field && field.toString().trim() !== '').length;
        break;
      
      case 'travel':
        const travelFields = [
          arrivalFlightNumber, arrivalDate,
          hotelAddress,
          stayDuration
        ];
        total = travelFields.length;
        filled = travelFields.filter(field => {
          if (typeof field === 'boolean') return field;
          return field && field.toString().trim() !== '';
        }).length;
        break;

      case 'funds':
        // For funds, show actual count with minimum requirement of 1
        const fundItemCount = funds.length;
        total = Math.max(1, fundItemCount);
        filled = fundItemCount;
        break;
    }

    return { filled, total };
  };

  // Calculate total completion percentage with memoization
  const totalCompletionPercent = useMemo(() => {
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    const totalFields = passportCount.total + personalCount.total + fundsCount.total + travelCount.total;
    const filledFields = passportCount.filled + personalCount.filled + fundsCount.filled + travelCount.filled;

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }, [
    // Dependencies: all form fields that affect completion calculation
    passportNo, fullName, nationality, dob, expiryDate,
    occupation, residentCountry, phoneCode, phoneNumber, email, sex,
    funds,
    arrivalFlightNumber, arrivalDate, hotelAddress, stayDuration
  ]);

  const isFormValid = () => {
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const fundsCount = getFieldCount('funds');
    const travelCount = getFieldCount('travel');

    const allFieldsFilled =
      passportCount.filled === passportCount.total &&
      personalCount.filled === personalCount.total &&
      fundsCount.filled === fundsCount.total &&
      travelCount.filled === travelCount.total;

    const noErrors = Object.keys(errors).length === 0;

    return allFieldsFilled && noErrors;
  };

  // Get smart button configuration based on journey progress
  const smartButtonConfig = useMemo(() => {
    if (totalCompletionPercent >= 100) {
      return {
        label: '开始台湾之旅！🌸',
        variant: 'primary',
        icon: '🚀',
        action: 'submit'
      };
    } else if (totalCompletionPercent >= 80) {
      return {
        label: '继续填写，即将完成！✨',
        variant: 'secondary',
        icon: '🌺',
        action: 'edit'
      };
    } else if (totalCompletionPercent >= 40) {
      return {
        label: '继续我的台湾准备之旅 💪',
        variant: 'secondary',
        icon: '🏖️',
        action: 'edit'
      };
    } else {
      return {
        label: '开始准备台湾之旅吧！🇹🇼',
        variant: 'outline',
        icon: '�',
        action: 'start'
      };
    }
  }, [totalCompletionPercent]);

  // Get progress indicator text - traveler-friendly messaging
  const progressText = useMemo(() => {
    if (totalCompletionPercent >= 100) {
      return '准备好迎接台湾之旅了！🌸';
    } else if (totalCompletionPercent >= 80) {
      return '快完成了！台湾在向你招手 ✨';
    } else if (totalCompletionPercent >= 60) {
      return '进展不错！继续加油 💪';
    } else if (totalCompletionPercent >= 40) {
      return '已经完成一半了！🏖️';
    } else if (totalCompletionPercent >= 20) {
      return '好的开始！台湾欢迎你 🌺';
    } else {
      return '让我们开始准备台湾之旅吧！🇹�';
    }
  }, [totalCompletionPercent]);

  // Get progress color based on completion
  const progressColor = useMemo(() => {
    if (totalCompletionPercent >= 100) {
      return '#34C759'; // Green
    } else if (totalCompletionPercent >= 50) {
      return '#FF9500'; // Orange
    } else {
      return '#FF3B30'; // Red
    }
  }, [totalCompletionPercent]);

  // Get encouraging hint message
  const encouragingHint = useMemo(() => {
    if (totalCompletionPercent >= 100) return null;
    
    if (totalCompletionPercent < 30) {
      return '🌟 第一步，从介绍自己开始吧！';
    } else if (totalCompletionPercent < 60) {
      return '🎉 太棒了！继续保持这个节奏';
    } else {
      return '🚀 快要完成了，你的台湾之旅近在咫尺！';
    }
  }, [totalCompletionPercent]);

  // Get next step hint message
  const nextStepHint = useMemo(() => {
    if (totalCompletionPercent >= 100) return null;
    
    if (totalCompletionPercent < 25) {
      return '💡 从护照信息开始，告诉台湾你是谁';
    } else if (totalCompletionPercent < 50) {
      return '📞 添加联系方式，这样台湾就能找到你了';
    } else if (totalCompletionPercent < 75) {
      return '✈️ 分享你的旅行计划，台湾在等你！';
    } else {
      return '🎯 最后一步，完成所有信息填写！';
    }
  }, [totalCompletionPercent]);

  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);
        
        await UserDataService.initialize(userId);
        
        const userData = await UserDataService.getAllUserData(userId);

        const passportInfo = userData?.passport;
        if (passportInfo) {
          setPassportNo(passportInfo.passportNumber || passport?.passportNo || '');
          setFullName(passportInfo.fullName || passport?.nameEn || passport?.name || '');
          setNationality(passportInfo.nationality || passport?.nationality || '');
          setDob(passportInfo.dateOfBirth || passport?.dob || '');
          setExpiryDate(passportInfo.expiryDate || passport?.expiry || '');
          setPassportData(passportInfo);
        } else {
          setPassportNo(passport?.passportNo || '');
          setFullName(passport?.nameEn || passport?.name || '');
          setNationality(passport?.nationality || '');
          setDob(passport?.dob || '');
          setExpiryDate(passport?.expiry || '');
        }

        const personalInfo = userData?.personalInfo;
        if (personalInfo) {
          const loadedSex = passportInfo?.gender || passport?.sex || 'Male';
          setSex(loadedSex);
          
          setOccupation(personalInfo.occupation || '');
          setResidentCountry(personalInfo.countryRegion || '');
          setPhoneNumber(personalInfo.phoneNumber || '');
          setEmail(personalInfo.email || '');
          
          setPhoneCode(getPhoneCode(personalInfo.countryRegion || passport?.nationality || ''));
          
          setPersonalInfoData(personalInfo);
        } else {
          setSex(passport?.sex || 'Male');
          setPhoneCode(getPhoneCode(passport?.nationality || ''));
        }

        const destinationId = destination?.id || 'taiwan';
        let travelInfo = await UserDataService.getTravelInfo(userId, destinationId);
        
        if (!travelInfo && destination?.name) {
          travelInfo = await UserDataService.getTravelInfo(userId, destination.name);
        }
        
        if (travelInfo) {
          setArrivalFlightNumber(travelInfo.arrivalFlightNumber || '');
          setArrivalDate(travelInfo.arrivalArrivalDate || '');
          setHotelAddress(travelInfo.hotelAddress || '');
          setStayDuration(travelInfo.lengthOfStay || '');
        }

        // Load funds data
        const fundsData = await UserDataService.getFunds(userId);
        if (fundsData && Array.isArray(fundsData)) {
          const normalized = fundsData.map(fund => ({
            ...fund,
            id: fund.id || `fund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          }));
          setFunds(normalized);
        }

      } catch (error) {
        setPassportNo(passport?.passportNo || '');
        setFullName(passport?.nameEn || passport?.name || '');
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
  }, [userId]); // Only depend on userId, not the entire passport object

  const handleFieldBlur = async (fieldName, fieldValue) => {
    setLastEditedField(fieldName);

    // Perform field validation
    const context = {
      residentCountry,
      arrivalDate,
    };
    const validation = validateField(fieldName, fieldValue, context);

    if (validation.isWarning) {
      setWarnings(prev => ({ ...prev, [fieldName]: validation.errorMessage }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } else if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [fieldName]: validation.errorMessage }));
      setWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[fieldName];
        return newWarnings;
      });
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      setWarnings(prev => {
        const newWarnings = { ...prev };
        delete newWarnings[fieldName];
        return newWarnings;
      });
    }

    await saveDataToSecureStorage();
  };

  const saveDataToSecureStorage = async () => {
    try {
      setSaveStatus('saving');

      const existingPassport = await UserDataService.getPassport(userId);

      const passportUpdates = {};
      if (passportNo) passportUpdates.passportNumber = passportNo;
      if (fullName) passportUpdates.fullName = fullName;
      if (nationality) passportUpdates.nationality = nationality;
      if (dob) passportUpdates.dateOfBirth = dob;
      if (expiryDate) passportUpdates.expiryDate = expiryDate;
      if (sex) passportUpdates.gender = sex;

      if (Object.keys(passportUpdates).length > 0) {
        if (existingPassport && existingPassport.id) {
          await UserDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
        } else {
          await UserDataService.savePassport(passportUpdates, userId, { skipValidation: true });
        }
      }

      const personalInfoUpdates = {};
      if (phoneNumber) personalInfoUpdates.phoneNumber = phoneNumber;
      if (email) personalInfoUpdates.email = email;
      if (occupation) personalInfoUpdates.occupation = occupation;
      if (residentCountry) personalInfoUpdates.countryRegion = residentCountry;

      if (Object.keys(personalInfoUpdates).length > 0) {
        await UserDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      }

      const travelInfoUpdates = {};
      if (arrivalFlightNumber) travelInfoUpdates.arrivalFlightNumber = arrivalFlightNumber;
      if (arrivalDate) travelInfoUpdates.arrivalArrivalDate = arrivalDate;
      if (hotelAddress) travelInfoUpdates.hotelAddress = hotelAddress;
      if (stayDuration) travelInfoUpdates.lengthOfStay = stayDuration;


      if (Object.keys(travelInfoUpdates).length > 0) {
        const destinationId = destination?.id || 'taiwan';
        await UserDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);
      }

      // Save funds data
      if (funds && funds.length > 0) {
        await UserDataService.saveFunds(userId, funds);
      }

      setSaveStatus('saved');
      // Clear saved status after 2 seconds
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
      setSaveStatus('error');
    }
  };

  // Funds Management Functions
  const addFund = (type) => {
    setCurrentFundItem(null);
    setNewFundItemType(type);
    setFundItemModalVisible(true);
  };

  const handleFundItemPress = (fund) => {
    setCurrentFundItem(fund);
    setFundItemModalVisible(true);
  };

  const handleFundItemModalClose = () => {
    setFundItemModalVisible(false);
    setCurrentFundItem(null);
  };

  const handleSaveFundItem = async (fundItem) => {
    try {
      if (fundItem.id) {
        // Update existing fund item
        setFunds((prev) =>
          prev.map((f) => (f.id === fundItem.id ? fundItem : f))
        );
      } else {
        // Add new fund item
        const newFund = {
          ...fundItem,
          id: `fund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        setFunds((prev) => [...prev, newFund]);
      }
      handleFundItemModalClose();
      await saveDataToSecureStorage();
    } catch (error) {
      console.error('Failed to save fund item:', error);
      Alert.alert('Error', 'Failed to save fund item');
    }
  };

  const handleDeleteFundItem = async (id) => {
    Alert.alert(
      '删除资金证明',
      '确定要删除这个资金证明吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            setFunds((prev) => prev.filter((fund) => fund.id !== id));
            await saveDataToSecureStorage();
          },
        },
      ]
    );
  };

  const handleContinue = () => {
    if (!isFormValid()) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }
    navigation.navigate('Result', {
      destination: destination || { id: 'tw' },
    });
  };

  const handleGoBack = async () => {
    await saveDataToSecureStorage();
    navigation.goBack();
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
                await saveDataToSecureStorage();
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
        <Text style={styles.headerTitle}>{t('taiwan.travelInfo.headerTitle', { defaultValue: '台湾入境信息' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('taiwan.travelInfo.loading', { defaultValue: '正在加载数据...' })}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇹🇼</Text>
          <Text style={styles.title}>{t('taiwan.travelInfo.title', { defaultValue: '填写台湾入境信息' })}</Text>
          <Text style={styles.subtitle}>{t('taiwan.travelInfo.subtitle', { defaultValue: '请提供以下信息以完成入境卡生成' })}</Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('taiwan.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        <CollapsibleSection 
          title={t('taiwan.travelInfo.sections.passport', { defaultValue: '护照信息' })} 
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
           <PassportNameInput
             value={fullName}
             onChangeText={setFullName}
             onBlur={() => handleFieldBlur('fullName', fullName)}
             helpText="请填写汉语拼音"
             error={!!errors.fullName}
             errorMessage={errors.fullName}
           />
           <NationalitySelector
             label="国籍"
             value={nationality}
             onValueChange={(code) => {
               setNationality(code);
               handleFieldBlur('nationality', code);
             }}
             helpText="请选择您的国籍"
             error={!!errors.nationality}
             errorMessage={errors.nationality}
           />
           <InputWithValidation
             label="护照号"
             value={passportNo}
             onChangeText={setPassportNo}
             onBlur={() => handleFieldBlur('passportNo', passportNo)}
             helpText="请输入您的护照号码"
             error={!!errors.passportNo}
             errorMessage={errors.passportNo}
             warning={!!warnings.passportNo}
             warningMessage={warnings.passportNo}
             fieldName="passportNo"
             lastEditedField={lastEditedField}
             required
             t={t}
             autoCapitalize="characters"
           />
           <DateTimeInput
             label="出生日期"
             value={dob}
             onChangeText={setDob}
             mode="date"
             dateType="past"
             helpText="选择出生日期"
             error={!!errors.dob}
             errorMessage={errors.dob}
             onBlur={() => handleFieldBlur('dob', dob)}
           />
           <DateTimeInput
             label="护照有效期"
             value={expiryDate}
             onChangeText={setExpiryDate}
             mode="date"
             dateType="future"
             helpText="选择护照有效期"
             error={!!errors.expiryDate}
             errorMessage={errors.expiryDate}
             onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
           />
         </CollapsibleSection>

        <CollapsibleSection 
          title={t('taiwan.travelInfo.sections.personal', { defaultValue: '个人信息' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <InputWithValidation
             label="职业"
             value={occupation}
             onChangeText={setOccupation}
             onBlur={() => handleFieldBlur('occupation', occupation)}
             helpText="请输入您的职业 (请使用英文)"
             error={!!errors.occupation}
             errorMessage={errors.occupation}
             warning={!!warnings.occupation}
             warningMessage={warnings.occupation}
             fieldName="occupation"
             lastEditedField={lastEditedField}
             required
             t={t}
             autoCapitalize="words"
           />
           <NationalitySelector
             label="居住国家"
             value={residentCountry}
             onValueChange={(code) => {
               setResidentCountry(code);
               setPhoneCode(getPhoneCode(code));
               handleFieldBlur('residentCountry', code);
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
               maxLength={5}
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
           <InputWithValidation
             label="电子邮箱"
             value={email}
             onChangeText={setEmail}
             onBlur={() => handleFieldBlur('email', email)}
             keyboardType="email-address"
             helpText="请输入您的电子邮箱地址"
             error={!!errors.email}
             errorMessage={errors.email}
             warning={!!warnings.email}
             warningMessage={warnings.email}
             fieldName="email"
             lastEditedField={lastEditedField}
             required
             t={t}
           />
           <View style={styles.fieldContainer}>
             <Text style={styles.fieldLabel}>性别</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        <CollapsibleSection 
          title="旅行信息"
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <InputWithValidation
            label="航班号"
            value={arrivalFlightNumber}
            onChangeText={setArrivalFlightNumber}
            onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
            helpText="请输入您的抵达航班号 (例如: CI123)"
            error={!!errors.arrivalFlightNumber}
            errorMessage={errors.arrivalFlightNumber}
            warning={!!warnings.arrivalFlightNumber}
            warningMessage={warnings.arrivalFlightNumber}
            fieldName="arrivalFlightNumber"
            lastEditedField={lastEditedField}
            required
            t={t}
            autoCapitalize="characters"
          />
          <DateTimeInput 
            label="抵达日期" 
            value={arrivalDate} 
            onChangeText={setArrivalDate} 
            mode="date"
            dateType="future"
            helpText="选择日期"
            error={!!errors.arrivalDate} 
            errorMessage={errors.arrivalDate}
            onBlur={() => handleFieldBlur('arrivalDate', arrivalDate)}
          />
          <InputWithValidation
            label="在台住址"
            value={hotelAddress}
            onChangeText={setHotelAddress}
            onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)}
            multiline
            helpText="请输入详细地址"
            error={!!errors.hotelAddress}
            errorMessage={errors.hotelAddress}
            warning={!!warnings.hotelAddress}
            warningMessage={warnings.hotelAddress}
            fieldName="hotelAddress"
            lastEditedField={lastEditedField}
            required
            t={t}
            autoCapitalize="words"
          />
          <InputWithValidation
            label="停留天数"
            value={stayDuration}
            onChangeText={setStayDuration}
            onBlur={() => handleFieldBlur('stayDuration', stayDuration)}
            helpText="请输入停留天数"
            error={!!errors.stayDuration}
            errorMessage={errors.stayDuration}
            warning={!!warnings.stayDuration}
            warningMessage={warnings.stayDuration}
            fieldName="stayDuration"
            lastEditedField={lastEditedField}
            required
            t={t}
            keyboardType="numeric"
          />
        </CollapsibleSection>

        {/* Funds Section */}
        <CollapsibleSection
          title="💰 资金证明"
          subtitle="证明你有足够资金在台湾旅行"
          isExpanded={expandedSection === 'funds'}
          onToggle={() => setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
        >
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroIcon}>💳</Text>
            <Text style={styles.sectionIntroText}>
              台湾海关想确保你不会成为负担。只需证明你有足够钱支付旅行费用。
            </Text>
          </View>
          <View style={styles.fundActions}>
            <Button title="添加现金" onPress={() => addFund('cash')} variant="secondary" style={styles.fundButton} />
            <Button title="添加信用卡照片" onPress={() => addFund('credit_card')} variant="secondary" style={styles.fundButton} />
            <Button title="添加银行账户余额" onPress={() => addFund('bank_balance')} variant="secondary" style={styles.fundButton} />
          </View>

          {funds.length === 0 ? (
            <View style={styles.fundEmptyState}>
              <Text style={styles.fundEmptyText}>
                {t('taiwan.travelInfo.funds.empty', { defaultValue: '尚未添加资金证明，请先新建条目。' })}
              </Text>
            </View>
          ) : (
            <View style={styles.fundList}>
              {funds.map((fund, index) => {
                const isLast = index === funds.length - 1;
                const typeKey = (fund.type || 'OTHER').toUpperCase();
                const typeMeta = {
                  CASH: { icon: '💵' },
                  BANK_CARD: { icon: '💳' },
                  CREDIT_CARD: { icon: '💳' },
                  BANK_BALANCE: { icon: '🏦' },
                  DOCUMENT: { icon: '📄' },
                  INVESTMENT: { icon: '📈' },
                  OTHER: { icon: '💰' },
                };
                const defaultTypeLabels = {
                  CASH: 'Cash',
                  BANK_CARD: 'Bank Card',
                  CREDIT_CARD: 'Bank Card',
                  BANK_BALANCE: 'Bank Balance',
                  DOCUMENT: 'Supporting Document',
                  INVESTMENT: 'Investment',
                  OTHER: 'Funding',
                };
                const typeIcon = (typeMeta[typeKey] || typeMeta.OTHER).icon;
                const typeLabel = t(`fundItem.types.${typeKey}`, {
                  defaultValue: defaultTypeLabels[typeKey] || defaultTypeLabels.OTHER,
                });
                const notProvidedLabel = t('fundItem.detail.notProvided', {
                  defaultValue: 'Not provided yet',
                });

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

                const amountValue = normalizeAmount(fund.amount);
                const currencyValue = fund.currency ? fund.currency.toUpperCase() : '';
                const detailsValue = fund.details || '';

                let displayText;
                if (typeKey === 'DOCUMENT') {
                  displayText = detailsValue || notProvidedLabel;
                } else if (typeKey === 'BANK_CARD' || typeKey === 'CREDIT_CARD') {
                  const cardLabel = detailsValue || notProvidedLabel;
                  const amountLabel = amountValue || notProvidedLabel;
                  const currencyLabel = currencyValue || notProvidedLabel;
                  displayText = `${cardLabel} • ${amountLabel} ${currencyLabel}`.trim();
                } else if (['CASH', 'BANK_BALANCE', 'INVESTMENT'].includes(typeKey)) {
                  const amountLabel = amountValue || notProvidedLabel;
                  const currencyLabel = currencyValue || notProvidedLabel;
                  displayText = `${amountLabel} ${currencyLabel}`.trim();
                } else {
                  displayText = detailsValue || amountValue || currencyValue || notProvidedLabel;
                }

                if ((fund.photoUri || fund.photo) && typeKey !== 'CASH') {
                  const photoLabel = t('fundItem.detail.photoAttached', { defaultValue: 'Photo attached' });
                  displayText = `${displayText} • ${photoLabel}`;
                }

                return (
                  <TouchableOpacity
                    key={fund.id}
                    style={[styles.fundItem, isLast && styles.fundItemLast]}
                    onPress={() => handleFundItemPress(fund)}
                  >
                    <View style={styles.fundItemContent}>
                      <Text style={styles.fundItemIcon}>{typeIcon}</Text>
                      <View style={styles.fundItemDetails}>
                        <Text style={styles.fundItemType}>{typeLabel}</Text>
                        <Text style={styles.fundItemText} numberOfLines={2}>
                          {displayText}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.fundItemDeleteButton}
                      onPress={() => handleDeleteFundItem(fund.id)}
                    >
                      <Text style={styles.fundItemDeleteText}>🗑️</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </CollapsibleSection>

        <View style={styles.buttonContainer}>
          {/* Enhanced Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarEnhanced}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${totalCompletionPercent}%`,
                      backgroundColor: progressColor
                    }
                  ]}
                />
                {/* Completion Badge */}
                {totalCompletionPercent >= 100 && (
                  <View style={styles.completionBadge}>
                    <Text style={styles.completionBadgeText}>台湾准备就绪！🌸</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={[styles.progressText, { color: progressColor }]}>
              {progressText}
            </Text>
          </View>

          {/* Smart Button with Dynamic Configuration */}
          <Button
            title={`${smartButtonConfig.icon} ${smartButtonConfig.label}`}
            onPress={handleContinue}
            variant={smartButtonConfig.variant}
            disabled={false}
            style={smartButtonConfig.style}
          />
          
          {/* Encouraging Progress Messages */}
          {encouragingHint && (
            <Text style={styles.encouragingHint}>
              {encouragingHint}
            </Text>
          )}

          {/* Travel-Focused Next Steps */}
          {nextStepHint && (
            <Text style={styles.nextStepHint}>
              {nextStepHint}
            </Text>
          )}

          {/* Enhanced Save Status Indicator */}
          {saveStatus && (
            <View style={[styles.saveStatusBar, styles[`saveStatus${saveStatus.charAt(0).toUpperCase() + saveStatus.slice(1)}`]]}>
              <Text style={styles.saveStatusIcon}>
                {saveStatus === 'pending' && '⏳'}
                {saveStatus === 'saving' && '💾'}
                {saveStatus === 'saved' && '✅'}
                {saveStatus === 'error' && '❌'}
              </Text>
              <Text style={styles.saveStatusText}>
                {saveStatus === 'pending' && '等待保存... / Pending save...'}
                {saveStatus === 'saving' && '正在保存... / Saving...'}
                {saveStatus === 'saved' && '已保存 / Saved'}
                {saveStatus === 'error' && '保存失败 / Save failed'}
              </Text>
              {saveStatus === 'error' && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setSaveStatus('saving');
                    saveDataToSecureStorage();
                  }}
                >
                  <Text style={styles.retryButtonText}>
                    重试 / Retry
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fund Item Detail Modal */}
      <FundItemDetailModal
        visible={fundItemModalVisible}
        fundItem={currentFundItem}
        newItemType={newFundItemType}
        onClose={handleFundItemModalClose}
        onSave={handleSaveFundItem}
        onDelete={currentFundItem ? () => handleDeleteFundItem(currentFundItem.id) : undefined}
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
  scrollContainer: {
    paddingBottom: spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  flag: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    ...typography.body2,
    color: colors.text,
    fontSize: 12,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  privacyText: {
    fontSize: 12,
    color: '#34C759',
    flex: 1,
    lineHeight: 16,
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
  // Progress and button styles
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBarEnhanced: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  completionBadge: {
    position: 'absolute',
    top: -30,
    right: 0,
    backgroundColor: '#34C759',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  progressText: {
    ...typography.body2,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  encouragingHint: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  nextStepHint: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  // Button variant styles
  primaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  // Funds section styles
  sectionIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionIntroIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  sectionIntroText: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  fundActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  fundButton: {
    flex: 1,
    minWidth: 100,
  },
  fundEmptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  fundEmptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fundList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fundItemLast: {
    borderBottomWidth: 0,
  },
  fundItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fundItemIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  fundItemDetails: {
    flex: 1,
  },
  fundItemType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  fundItemText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
  },
  fundItemDeleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  fundItemDeleteText: {
    fontSize: 20,
  },
  saveStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  saveStatusPending: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  saveStatusSaving: {
    backgroundColor: '#d1ecf1',
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  saveStatusSaved: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  saveStatusError: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  saveStatusIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  saveStatusText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  retryButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
  },
  retryButtonText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
});

export default TaiwanTravelInfoScreen;
