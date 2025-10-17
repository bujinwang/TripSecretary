
// 入境通 - Hong Kong Travel Info Screen (香港入境信息)
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
} from 'react-native';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../components';

import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';

// Import secure data models and services
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

const HongkongTravelInfoScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};
  const { t } = useLocale();

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
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

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

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);
        const userId = passport?.id || 'default_user';
        
        await PassportDataService.initialize(userId);
        
        const userData = await PassportDataService.getAllUserData(userId);

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

        const destinationId = destination?.id || 'hongkong';
        let travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);
        
        if (!travelInfo && destination?.name) {
          travelInfo = await PassportDataService.getTravelInfo(userId, destination.name);
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
  }, [passport]);

  const handleFieldBlur = async (fieldName, fieldValue) => {
    await saveDataToSecureStorage();
  };

  const saveDataToSecureStorage = async () => {
    try {
      const userId = passport?.id || 'default_user';

      const existingPassport = await PassportDataService.getPassport(userId);

      const passportUpdates = {};
      if (passportNo) passportUpdates.passportNumber = passportNo;
      if (fullName) passportUpdates.fullName = fullName;
      if (nationality) passportUpdates.nationality = nationality;
      if (dob) passportUpdates.dateOfBirth = dob;
      if (expiryDate) passportUpdates.expiryDate = expiryDate;
      if (sex) passportUpdates.gender = sex;

      if (Object.keys(passportUpdates).length > 0) {
        if (existingPassport && existingPassport.id) {
          await PassportDataService.updatePassport(existingPassport.id, passportUpdates, { skipValidation: true });
        } else {
          await PassportDataService.savePassport(passportUpdates, userId, { skipValidation: true });
        }
      }

      const personalInfoUpdates = {};
      if (phoneNumber) personalInfoUpdates.phoneNumber = phoneNumber;
      if (email) personalInfoUpdates.email = email;
      if (occupation) personalInfoUpdates.occupation = occupation;
      if (residentCountry) personalInfoUpdates.countryRegion = residentCountry;

      if (Object.keys(personalInfoUpdates).length > 0) {
        await PassportDataService.upsertPersonalInfo(userId, personalInfoUpdates);
      }

      const travelInfoUpdates = {};
      if (arrivalFlightNumber) travelInfoUpdates.arrivalFlightNumber = arrivalFlightNumber;
      if (arrivalDate) travelInfoUpdates.arrivalArrivalDate = arrivalDate;
      if (hotelAddress) travelInfoUpdates.hotelAddress = hotelAddress;
      if (stayDuration) travelInfoUpdates.lengthOfStay = stayDuration;


      if (Object.keys(travelInfoUpdates).length > 0) {
        const destinationId = destination?.id || 'hongkong';
        await PassportDataService.updateTravelInfo(userId, destinationId, travelInfoUpdates);
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
    navigation.navigate('ResultScreen', {
      destination: 'Hong Kong',
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
        <Text style={styles.headerTitle}>{t('hongkong.travelInfo.headerTitle', { defaultValue: '香港入境信息' })}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('hongkong.travelInfo.loading', { defaultValue: '正在加载数据...' })}</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇭🇰</Text>
          <Text style={styles.title}>{t('hongkong.travelInfo.title', { defaultValue: '填写香港入境信息' })}</Text>
          <Text style={styles.subtitle}>{t('hongkong.travelInfo.subtitle', { defaultValue: '请提供以下信息以完成入境卡生成' })}</Text>
        </View>

        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('hongkong.travelInfo.privacyNotice', { defaultValue: '所有信息仅保存在您的手机本地' })}
          </Text>
        </View>

        <CollapsibleSection 
          title={t('hongkong.travelInfo.sections.passport', { defaultValue: '护照信息' })} 
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
           <Input label="护照号" value={passportNo} onChangeText={setPassportNo} onBlur={() => handleFieldBlur('passportNo', passportNo)} helpText="请输入您的护照号码" error={!!errors.passportNo} errorMessage={errors.passportNo} autoCapitalize="characters" />
           <DateTimeInput
             label="出生日期"
             value={dob}
             onChangeText={setDob}
             mode="date"
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
             helpText="选择护照有效期"
             error={!!errors.expiryDate}
             errorMessage={errors.expiryDate}
             onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
           />
         </CollapsibleSection>

        <CollapsibleSection 
          title={t('hongkong.travelInfo.sections.personal', { defaultValue: '个人信息' })}
          isExpanded={expandedSection === 'personal'}
          onToggle={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
           <Input label="职业" value={occupation} onChangeText={setOccupation} onBlur={() => handleFieldBlur('occupation', occupation)} helpText="请输入您的职业 (请使用英文)" error={!!errors.occupation} errorMessage={errors.occupation} autoCapitalize="words" />
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
           <Input label="电子邮箱" value={email} onChangeText={setEmail} onBlur={() => handleFieldBlur('email', email)} keyboardType="email-address" helpText="请输入您的电子邮箱地址" error={!!errors.email} errorMessage={errors.email} />
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
          <Input label="航班号" value={arrivalFlightNumber} onChangeText={setArrivalFlightNumber} onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)} helpText="请输入您的抵达航班号" error={!!errors.arrivalFlightNumber} errorMessage={errors.arrivalFlightNumber} autoCapitalize="characters" />
          <DateTimeInput 
            label="抵达日期" 
            value={arrivalDate} 
            onChangeText={setArrivalDate} 
            mode="date"
            helpText="选择日期"
            error={!!errors.arrivalDate} 
            errorMessage={errors.arrivalDate}
            onBlur={() => handleFieldBlur('arrivalDate', arrivalDate)}
          />
          <Input 
            label="在港住址" 
            value={hotelAddress} 
            onChangeText={setHotelAddress} 
            onBlur={() => handleFieldBlur('hotelAddress', hotelAddress)} 
            multiline 
            helpText="请输入详细地址" 
            error={!!errors.hotelAddress} 
            errorMessage={errors.hotelAddress} 
            autoCapitalize="words" 
          />
          <Input 
            label="停留天数" 
            value={stayDuration} 
            onChangeText={setStayDuration} 
            onBlur={() => handleFieldBlur('stayDuration', stayDuration)} 
            helpText="请输入停留天数" 
            error={!!errors.stayDuration} 
            errorMessage={errors.stayDuration} 
            keyboardType="numeric" 
          />
        </CollapsibleSection>

        <View style={styles.buttonContainer}>
          <Button
            title="生成入境包"
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
  sectionContainer: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
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
    backgroundColor: '#d4edda',
  },
  fieldCountBadgeIncomplete: {
    backgroundColor: '#fff3cd',
  },
  fieldCountText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
  },
  fieldCountTextComplete: {
    color: '#155724',
  },
  fieldCountTextIncomplete: {
    color: '#856404',
  },
  sectionIcon: {
    ...typography.h3,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  sectionContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
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
});

export default HongkongTravelInfoScreen;
