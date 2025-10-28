
// 入境通 - Taiwan Travel Info Screen (臺灣入境資訊)
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
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

  // Travel Info State
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [stayDuration, setStayDuration] = useState('');


  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [lastEditedField, setLastEditedField] = useState(null);

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
    }

    return { filled, total };
  };

  // Calculate total completion percentage with memoization
  const totalCompletionPercent = useMemo(() => {
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const travelCount = getFieldCount('travel');

    const totalFields = passportCount.total + personalCount.total + travelCount.total;
    const filledFields = passportCount.filled + personalCount.filled + travelCount.filled;

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }, [
    // Dependencies: all form fields that affect completion calculation
    passportNo, fullName, nationality, dob, expiryDate,
    occupation, residentCountry, phoneCode, phoneNumber, email, sex,
    arrivalFlightNumber, arrivalDate, hotelAddress, stayDuration
  ]);

  const isFormValid = () => {
    const passportCount = getFieldCount('passport');
    const personalCount = getFieldCount('personal');
    const travelCount = getFieldCount('travel');

    const allFieldsFilled = 
      passportCount.filled === passportCount.total &&
      personalCount.filled === personalCount.total &&
      travelCount.filled === travelCount.total;

    const noErrors = Object.keys(errors).length === 0;

    return allFieldsFilled && noErrors;
  };

  // Get smart button configuration based on journey progress
  const smartButtonConfig = useMemo(() => {
    if (totalCompletionPercent >= 100) {
      return {
        label: '開始臺灣之旅！🌸',
        variant: 'primary',
        icon: '🚀',
        action: 'submit'
      };
    } else if (totalCompletionPercent >= 80) {
      return {
        label: '繼續填寫，即將完成！✨',
        variant: 'secondary',
        icon: '🌺',
        action: 'edit'
      };
    } else if (totalCompletionPercent >= 40) {
      return {
        label: '繼續我的臺灣準備之旅 💪',
        variant: 'secondary',
        icon: '🏖️',
        action: 'edit'
      };
    } else {
      return {
        label: '開始準備臺灣之旅吧！🇹🇼',
        variant: 'outline',
        icon: '📝',
        action: 'start'
      };
    }
  }, [totalCompletionPercent]);

  // Get progress indicator text - traveler-friendly messaging
  const progressText = useMemo(() => {
    if (totalCompletionPercent >= 100) {
      return '準備好迎接臺灣之旅了！🌸';
    } else if (totalCompletionPercent >= 80) {
      return '快完成了！臺灣在向你招手 ✨';
    } else if (totalCompletionPercent >= 60) {
      return '進展不錯！繼續加油 💪';
    } else if (totalCompletionPercent >= 40) {
      return '已經完成一半了！🏖️';
    } else if (totalCompletionPercent >= 20) {
      return '好的開始！臺灣歡迎你 🌺';
    } else {
      return '讓我們開始準備臺灣之旅吧！🇹🇼';
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
      return '🌟 第一步，從介紹自己開始吧！';
    } else if (totalCompletionPercent < 60) {
      return '🎉 太棒了！繼續保持這個節奏';
    } else {
      return '🚀 快要完成了，你的臺灣之旅近在咫尺！';
    }
  }, [totalCompletionPercent]);

  // Get next step hint message
  const nextStepHint = useMemo(() => {
    if (totalCompletionPercent >= 100) return null;

    if (totalCompletionPercent < 25) {
      return '💡 從護照資訊開始，告訴臺灣你是誰';
    } else if (totalCompletionPercent < 50) {
      return '📞 添加聯絡方式，這樣臺灣就能找到你了';
    } else if (totalCompletionPercent < 75) {
      return '✈️ 分享你的旅行計劃，臺灣在等你！';
    } else {
      return '🎯 最後一步，完成所有資訊填寫！';
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
    } catch (error) {
      console.error('Failed to save data to secure storage:', error);
    }
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
      { value: 'Undefined', label: t('thailand.travelInfo.fields.sex.options.undefined', { defaultValue: '未定義' }) }
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
        <Text style={styles.headerTitle}>{t('taiwan.travelInfo.headerTitle', { defaultValue: '臺灣入境資訊' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('taiwan.travelInfo.loading', { defaultValue: '正在載入資料...' })}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇹🇼</Text>
          <Text style={styles.title}>{t('taiwan.travelInfo.title', { defaultValue: '填寫臺灣入境資訊' })}</Text>
          <Text style={styles.subtitle}>{t('taiwan.travelInfo.subtitle', { defaultValue: '請提供以下資訊以完成入境卡生成' })}</Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('taiwan.travelInfo.privacyNotice', { defaultValue: '所有資訊僅保存在您的手機本地' })}
          </Text>
        </View>

        <CollapsibleSection
          title={t('taiwan.travelInfo.sections.passport', { defaultValue: '護照資訊' })} 
          isExpanded={expandedSection === 'passport'}
          onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
           <PassportNameInput
             value={fullName}
             onChangeText={setFullName}
             onBlur={() => handleFieldBlur('fullName', fullName)}
             helpText="請填寫護照英文姓名"
             error={!!errors.fullName}
             errorMessage={errors.fullName}
           />
           <NationalitySelector
             label="國籍"
             value={nationality}
             onValueChange={(code) => {
               setNationality(code);
               handleFieldBlur('nationality', code);
             }}
             helpText="請選擇您的國籍"
             error={!!errors.nationality}
             errorMessage={errors.nationality}
           />
           <InputWithValidation
             label="護照號碼"
             value={passportNo}
             onChangeText={setPassportNo}
             onBlur={() => handleFieldBlur('passportNo', passportNo)}
             helpText="請輸入您的護照號碼"
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
             helpText="選擇出生日期"
             error={!!errors.dob}
             errorMessage={errors.dob}
             onBlur={() => handleFieldBlur('dob', dob)}
           />
           <DateTimeInput
             label="護照有效期"
             value={expiryDate}
             onChangeText={setExpiryDate}
             mode="date"
             dateType="future"
             helpText="選擇護照有效期"
             error={!!errors.expiryDate}
             errorMessage={errors.expiryDate}
             onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
           />
         </CollapsibleSection>

        <CollapsibleSection
          title={t('taiwan.travelInfo.sections.personal', { defaultValue: '個人資訊' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <InputWithValidation
             label="職業"
             value={occupation}
             onChangeText={setOccupation}
             onBlur={() => handleFieldBlur('occupation', occupation)}
             helpText="請輸入您的職業 (請使用英文)"
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
             label="居住國家"
             value={residentCountry}
             onValueChange={(code) => {
               setResidentCountry(code);
               setPhoneCode(getPhoneCode(code));
               handleFieldBlur('residentCountry', code);
             }}
             helpText="請選擇您居住的國家"
             error={!!errors.residentCountry}
             errorMessage={errors.residentCountry}
           />
           <View style={styles.phoneInputContainer}>
             <Input
               label="國家代碼"
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
               label="電話號碼"
               value={phoneNumber}
               onChangeText={setPhoneNumber}
               onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
               keyboardType="phone-pad"
               helpText="請輸入您的電話號碼"
               error={!!errors.phoneNumber}
               errorMessage={errors.phoneNumber}
               style={styles.phoneInput}
             />
           </View>
           <InputWithValidation
             label="電子郵箱"
             value={email}
             onChangeText={setEmail}
             onBlur={() => handleFieldBlur('email', email)}
             keyboardType="email-address"
             helpText="請輸入您的電子郵箱地址"
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
             <Text style={styles.fieldLabel}>性別</Text>
             {renderGenderOptions()}
           </View>
         </CollapsibleSection>

        <CollapsibleSection
          title="旅行資訊"
          isExpanded={expandedSection === 'travel'}
          onToggle={() => setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <InputWithValidation
            label="航班號碼"
            value={arrivalFlightNumber}
            onChangeText={setArrivalFlightNumber}
            onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
            helpText="請輸入您的抵達航班號 (例如: CI123)"
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
            label="抵達日期"
            value={arrivalDate}
            onChangeText={setArrivalDate}
            mode="date"
            dateType="future"
            helpText="選擇日期"
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
            helpText="請輸入詳細地址"
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
            label="停留天數"
            value={stayDuration}
            onChangeText={setStayDuration}
            onBlur={() => handleFieldBlur('stayDuration', stayDuration)}
            helpText="請輸入停留天數"
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
                    <Text style={styles.completionBadgeText}>臺灣準備就緒！🌸</Text>
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
});

export default TaiwanTravelInfoScreen;
