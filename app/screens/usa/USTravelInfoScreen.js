import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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
import HeroCard from '../../components/japan/HeroCard';
import TipsChips from '../../components/japan/TipsChips';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { useUSTravelData } from '../../hooks/usa/useUSTravelData';
import { useFormProgress } from '../../hooks/japan/useFormProgress';
import UserDataService from '../../services/data/UserDataService';
import { getPhoneCode } from '../../data/phoneCodes';
import USFormHelper from '../../utils/usa/USFormHelper';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const USTravelInfoScreen = ({ navigation, route }) => {
  const {
    passport: rawPassport,
    destination,
    travelInfo: initialTravelInfo,
    userId: routeUserId,
    context: routeContext,
  } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const resolvedUserId = routeUserId || passport?.id || rawPassport?.id || 'user_001';
  const { t, language } = useLocale();

  const [expandedSection, setExpandedSection] = useState(null);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
  const [newFundItemType, setNewFundItemType] = useState(null);
  const scrollViewRef = useRef(null);
  const [sectionOffsets, setSectionOffsets] = useState({});

  const {
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
  } = useUSTravelData(resolvedUserId, navigation, t);

  const travelPurposeCode = useMemo(() => {
    const mapping = {
      Tourism: 'TOURISM',
      Business: 'BUSINESS',
      'Visiting Relatives': 'VISITING_RELATIVES',
      Transit: 'TRANSIT',
      Other: 'OTHER',
    };
    return mapping[travelPurpose] || 'OTHER';
  }, [travelPurpose]);

  const formData = {
    fullName, nationality, passportNo, dob, expiryDate,
    occupation, cityOfResidence, residentCountry, phoneCode, phoneNumber, email, gender,
    funds,
    travelPurpose, customTravelPurpose, arrivalFlightNumber, arrivalDate,
    lengthOfStay, isTransitPassenger, accommodationAddress, accommodationPhone,
  };

  const {
    sectionProgress,
    totalFields,
    totalFilled,
    completionPercent,
    remainingItems,
    isReadyForTravel,
    isFormValid,
  } = useFormProgress(formData);

  const heroNextActionLabel = t('us.travelInfo.hero.nextAction', {
    defaultValue: '查看准备状态'
  });

  const heroSummaryLabel = t('us.travelInfo.hero.summary', {
    completed: totalFilled,
    total: totalFields,
    defaultValue: `已完成 ${totalFilled}/${totalFields} 项准备`,
  });

  const heroMetaLabel = isReadyForTravel
    ? t('us.travelInfo.hero.metaReady', {
        defaultValue: '所有资料已整理完成，点击查看准备状态和入境指南。',
      })
    : t('us.travelInfo.hero.metaPending', {
        remaining: remainingItems,
        defaultValue:
          remainingItems > 0
            ? `尚有 ${remainingItems} 项资料待填写，点击可查看详情。`
            : '点击查看准备状态，可继续完善资料或查看入境指南。',
      });

  const heroTips = useMemo(
    () => [
      {
        id: 'pen',
        icon: '✍️',
        label: t('us.travelInfo.hero.tipPen', { defaultValue: '带黑/蓝色签字笔' }),
      },
      {
        id: 'sample',
        icon: '📷',
        label: t('us.travelInfo.hero.tipSample', { defaultValue: '保存纸质表格样例' }),
      },
      {
        id: 'print',
        icon: '✅',
        label: t('us.travelInfo.hero.tipPrint', { defaultValue: '打印入境包备用' }),
      },
    ],
    [t]
  );

  const updateSectionOffset = useCallback(
    (key) => (event) => {
      const { y } = event.nativeEvent.layout;
      setSectionOffsets((prev) => ({
        ...prev,
        [key]: y,
      }));
    },
    []
  );

  const scrollToSection = useCallback(
    (key) => {
      const y = sectionOffsets[key];
      if (typeof y === 'number' && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: Math.max(y - spacing.lg, 0),
          animated: true,
        });
      }
    },
    [sectionOffsets]
  );

  const focusFirstIncompleteSection = useCallback(() => {
    const order = ['passport', 'travel', 'personal', 'funds'];
    for (const key of order) {
      const progress = sectionProgress[key];
      if (progress && progress.total > 0 && progress.filled < progress.total) {
        setExpandedSection(key);
        scrollToSection(key);
        return;
      }
    }
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [sectionProgress, scrollToSection]);

  const handleNavigateToResult = useCallback(
    async ({ initialAction = 'guide', requireValid = true } = {}) => {
      if (requireValid && !isFormValid()) {
        Alert.alert(t('common.error'), t('us.travelInfo.errors.completeAllFields', {
          defaultValue: 'Please complete all required fields'
        }));
        return;
      }

      try {
        await saveData();
        // Navigate to US Entry Flow (to be created)
        // navigation.navigate('USEntryFlow', {
        //   userId: resolvedUserId,
        //   passport: passport,
        //   destination: destination || { id: 'us' },
        // });
        Alert.alert(
          t('common.success', { defaultValue: 'Success' }),
          t('us.travelInfo.success.dataSaved', { defaultValue: 'Your travel information has been saved successfully' })
        );
      } catch (error) {
        Alert.alert(t('common.error'), t('us.travelInfo.errors.saveFailed', {
          defaultValue: 'Failed to save travel information'
        }));
      }
    },
    [destination, isFormValid, navigation, resolvedUserId, saveData, t, passport]
  );

  const handleHeroPress = useCallback(() => {
    // Always navigate to the entry flow hub, regardless of completion status
    handleNavigateToResult({ initialAction: 'guide', requireValid: false });
  }, [handleNavigateToResult]);


  // Handle continue button press
  const navigateBackToPreviousScreen = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const fallbackParams = {
      userId: resolvedUserId,
      destination: destination || { id: 'us' },
    };

    if (passport) {
      fallbackParams.passport = passport;
    } else if (rawPassport) {
      fallbackParams.passport = rawPassport;
    }

    // navigation.navigate('USEntryFlow', fallbackParams);
    navigation.goBack();
  };

  const handleGoBack = async () => {
    if (isLoading) {
      navigateBackToPreviousScreen();
      return;
    }

    try {
      await saveData();
    } catch (error) {
      console.error('Failed to save before navigating back:', error);
    } finally {
      navigateBackToPreviousScreen();
    }
  };

  const handleContinue = async () => {
    await handleNavigateToResult({ initialAction: 'guide', requireValid: true });
  };

  // Fund item handlers
  const handleFundItemPress = (fundItem) => {
    const fundItemData = fundItem.toJSON ? fundItem.toJSON() : fundItem;
    setSelectedFundItem(fundItemData);
    setFundItemModalVisible(true);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      const items = await UserDataService.getFundItems(resolvedUserId);
      setFunds(items || []);
      setFundItemModalVisible(false);
      setSelectedFundItem(null);
    } catch (error) {
      console.error('Error refreshing fund items after update:', error);
    }
  };

  const handleFundItemDelete = async (fundItemId) => {
    try {
      const items = await UserDataService.getFundItems(resolvedUserId);
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
      const items = await UserDataService.getFundItems(resolvedUserId);
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
          <Text style={styles.loadingText}>{t('us.travelInfo.loading', { defaultValue: 'Loading...' })}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('us.travelInfo.headerTitle', { defaultValue: '美国入境资料' })}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.body}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <HeroCard
            completionPercent={completionPercent}
            nextActionLabel={heroNextActionLabel}
            summaryLabel={heroSummaryLabel}
            metaLabel={heroMetaLabel}
            progressLabel={t('us.travelInfo.hero.progressLabel', { defaultValue: '准备度' })}
            onPress={handleHeroPress}
          />

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleHeroPress}
            activeOpacity={0.85}
          >
            <View style={styles.primaryButtonContent}>
              <Text style={styles.primaryButtonIcon}>🧳</Text>
              <View style={styles.primaryButtonTextContainer}>
                <Text style={styles.primaryButtonTitle}>查看准备状态</Text>
                <Text style={styles.primaryButtonSubtitle}>
                  {isReadyForTravel ? '已完成，查看入境指南' : `已完成 ${totalFilled}/${totalFields} 项资料`}
                </Text>
              </View>
              <Text style={styles.primaryButtonArrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TipsChips tips={heroTips} />

          <Text style={styles.sectionGroupTitle}>
            {t('us.travelInfo.groups.copyRequired', { defaultValue: '需抄写信息' })}
          </Text>

          <View onLayout={updateSectionOffset('passport')}>
            <CollapsibleSection
              title={t('us.travelInfo.sections.passport', { defaultValue: '护照信息' })}
              expanded={expandedSection === 'passport'}
              onToggle={(expanded) => setExpandedSection(expanded ? 'passport' : null)}
              fieldCount={sectionProgress.passport}
              style={styles.sectionCard}
              headerStyle={styles.sectionHeader}
              contentStyle={styles.sectionContent}
            >
              <PassportNameInput
                label={t('us.travelInfo.fields.passportName', { defaultValue: '护照姓名' })}
                value={fullName}
                onChangeText={setFullName}
                onBlur={() => handleFieldBlur('fullName', fullName)}
                placeholder={t('us.travelInfo.fields.passportNamePlaceholder', { defaultValue: 'ZHANG/SAN' })}
                error={errors.fullName}
                errorMessage={errors.fullName}
              />

              <NationalitySelector
                label={t('us.travelInfo.fields.nationality', { defaultValue: '国籍' })}
                value={nationality}
                onValueChange={(value) => {
                  setNationality(value);
                  handleFieldBlur('nationality', value);
                }}
                placeholder={t('us.travelInfo.fields.nationalityPlaceholder', { defaultValue: '选择国籍' })}
                error={errors.nationality}
                errorMessage={errors.nationality}
              />

              <Input
                label={t('us.travelInfo.fields.passportNumber', { defaultValue: '护照号码' })}
                value={passportNo}
                onChangeText={setPassportNo}
                onBlur={() => handleFieldBlur('passportNo', passportNo)}
                placeholder={t('us.travelInfo.fields.passportNumberPlaceholder', { defaultValue: 'E12345678' })}
                autoCapitalize="characters"
                error={errors.passportNo}
                errorMessage={errors.passportNo}
                helpText={t('us.travelInfo.fields.passportNumberHelp', { defaultValue: '护照号码通常在护照信息页右上角' })}
              />

              <DateTimeInput
                label={t('us.travelInfo.fields.dateOfBirth', { defaultValue: '出生日期' })}
                value={dob}
                onChangeText={setDob}
                onBlur={() => handleFieldBlur('dob', dob)}
                mode="date"
                dateType="past"
                error={errors.dob}
                errorMessage={errors.dob}
                helpText={t('us.travelInfo.fields.dateOfBirthHelp', { defaultValue: '护照上的出生日期' })}
              />

              <DateTimeInput
                label={t('us.travelInfo.fields.expiryDate', { defaultValue: '护照有效期' })}
                value={expiryDate}
                onChangeText={setExpiryDate}
                onBlur={() => handleFieldBlur('expiryDate', expiryDate)}
                mode="date"
                dateType="future"
                error={errors.expiryDate}
                errorMessage={errors.expiryDate}
                helpText={t('us.travelInfo.fields.expiryDateHelp', { defaultValue: '护照过期日期' })}
              />
            </CollapsibleSection>
          </View>

          <View onLayout={updateSectionOffset('travel')}>
            <CollapsibleSection
              title={t('us.travelInfo.sections.travel', { defaultValue: '行程信息' })}
              expanded={expandedSection === 'travel'}
              onToggle={(expanded) => setExpandedSection(expanded ? 'travel' : null)}
              fieldCount={sectionProgress.travel}
              style={styles.sectionCard}
              headerStyle={styles.sectionHeader}
              contentStyle={styles.sectionContent}
            >
              <TravelPurposeSelector
                label={t('us.travelInfo.fields.travelPurpose', { defaultValue: '旅行目的' })}
                value={travelPurposeCode}
                onValueChange={(value) => {
                  const normalizedValue = USFormHelper.normalizeTravelPurpose(value);
                  setTravelPurpose(normalizedValue);
                  if (normalizedValue !== 'Other') {
                    setCustomTravelPurpose('');
                  }
                  handleFieldBlur('travelPurpose', normalizedValue);
                }}
                purposeType="us"
                locale={language}
                error={!!errors.travelPurpose}
                errorMessage={errors.travelPurpose}
              />

              {travelPurpose === 'Other' && (
                <Input
                  label={t('us.travelInfo.fields.customTravelPurpose', { defaultValue: '其他目的' })}
                  value={customTravelPurpose}
                  onChangeText={setCustomTravelPurpose}
                  onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
                  placeholder={t('us.travelInfo.fields.customTravelPurposePlaceholder', { defaultValue: '请输入旅行目的' })}
                  helpText="Please enter in English"
                  autoCapitalize="words"
                />
              )}

              <Input
                label={t('us.travelInfo.fields.arrivalFlightNumber', { defaultValue: '抵达航班号' })}
                value={arrivalFlightNumber}
                onChangeText={setArrivalFlightNumber}
                onBlur={() => handleFieldBlur('arrivalFlightNumber', arrivalFlightNumber)}
                placeholder={t('us.travelInfo.fields.arrivalFlightNumberPlaceholder', { defaultValue: 'UA857' })}
                autoCapitalize="characters"
                error={errors.arrivalFlightNumber}
                errorMessage={errors.arrivalFlightNumber}
              />

              <DateTimeInput
                label={t('us.travelInfo.fields.arrivalDate', { defaultValue: '抵达日期' })}
                value={arrivalDate}
                onChangeText={setArrivalDate}
                onBlur={() => handleFieldBlur('arrivalDate', arrivalDate)}
                mode="date"
                dateType="future"
                error={errors.arrivalDate}
                errorMessage={errors.arrivalDate}
                helpText={t('us.travelInfo.fields.arrivalDateHelp', { defaultValue: '预计抵达美国日期' })}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={async () => {
                  const newValue = !isTransitPassenger;
                  setIsTransitPassenger(newValue);
                  if (newValue) {
                    setAccommodationAddress('');
                    setAccommodationPhone('');
                  }
                  await saveData();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isTransitPassenger && styles.checkboxChecked]}>
                  {isTransitPassenger && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  {t('us.travelInfo.fields.transitPassenger', { defaultValue: '我是过境旅客，不在美国停留' })}
                </Text>
              </TouchableOpacity>

              {!isTransitPassenger && (
                <>
                  <Input
                    label={t('us.travelInfo.fields.accommodationAddress', { defaultValue: '住宿地址' })}
                    value={accommodationAddress}
                    onChangeText={setAccommodationAddress}
                    onBlur={() => handleFieldBlur('accommodationAddress', accommodationAddress)}
                    placeholder={t('us.travelInfo.fields.accommodationAddressPlaceholder', { defaultValue: '123 Main St, New York, NY 10001' })}
                    multiline
                    numberOfLines={3}
                    error={errors.accommodationAddress}
                    errorMessage={errors.accommodationAddress}
                    helpText={t('us.travelInfo.fields.accommodationAddressHelp', { defaultValue: '请输入在美国的住宿地址' })}
                  />

                  <Input
                    label={t('us.travelInfo.fields.accommodationPhone', { defaultValue: '住宿电话' })}
                    value={accommodationPhone}
                    onChangeText={setAccommodationPhone}
                    onBlur={() => handleFieldBlur('accommodationPhone', accommodationPhone)}
                    placeholder={t('us.travelInfo.fields.accommodationPhonePlaceholder', { defaultValue: '212-555-1234' })}
                    keyboardType="phone-pad"
                    error={errors.accommodationPhone}
                    errorMessage={errors.accommodationPhone}
                  />
                </>
              )}

              <Input
                label={t('us.travelInfo.fields.lengthOfStay', { defaultValue: '停留天数' })}
                value={lengthOfStay}
                onChangeText={setLengthOfStay}
                onBlur={() => handleFieldBlur('lengthOfStay', lengthOfStay)}
                placeholder={t('us.travelInfo.fields.lengthOfStayPlaceholder', { defaultValue: '7' })}
                keyboardType="numeric"
                error={errors.lengthOfStay}
                errorMessage={errors.lengthOfStay}
              />
            </CollapsibleSection>
          </View>

          <Text style={styles.sectionGroupTitleSecondary}>
            {t('us.travelInfo.groups.supportingDocs', { defaultValue: '随身备用资料' })}
          </Text>

          <View onLayout={updateSectionOffset('personal')}>
            <CollapsibleSection
              title={t('us.travelInfo.sections.personal', { defaultValue: '个人信息' })}
              expanded={expandedSection === 'personal'}
              onToggle={(expanded) => setExpandedSection(expanded ? 'personal' : null)}
              fieldCount={sectionProgress.personal}
              style={styles.sectionCard}
              headerStyle={styles.sectionHeader}
              contentStyle={styles.sectionContent}
            >
              <Input
                label={t('us.travelInfo.fields.occupation', { defaultValue: '职业' })}
                value={occupation}
                onChangeText={setOccupation}
                onBlur={() => handleFieldBlur('occupation', occupation)}
                placeholder={t('us.travelInfo.fields.occupationPlaceholder', { defaultValue: 'Engineer' })}
                error={errors.occupation}
                errorMessage={errors.occupation}
              />

              <Input
                label={t('us.travelInfo.fields.cityOfResidence', { defaultValue: '居住城市' })}
                value={cityOfResidence}
                onChangeText={setCityOfResidence}
                onBlur={() => handleFieldBlur('cityOfResidence', cityOfResidence)}
                placeholder={t('us.travelInfo.fields.cityOfResidencePlaceholder', { defaultValue: 'Beijing' })}
                error={errors.cityOfResidence}
                errorMessage={errors.cityOfResidence}
              />

              <NationalitySelector
                label={t('us.travelInfo.fields.residentCountry', { defaultValue: '居住国家' })}
                value={residentCountry}
                onValueChange={(value) => {
                  setResidentCountry(value);
                  const code = getPhoneCode(value);
                  if (code) {
                    setPhoneCode(code);
                  }
                  handleFieldBlur('residentCountry', value);
                }}
                placeholder={t('us.travelInfo.fields.residentCountryPlaceholder', { defaultValue: '选择居住国家' })}
                error={errors.residentCountry}
                errorMessage={errors.residentCountry}
              />

              <View style={styles.phoneRow}>
                <View style={styles.phoneCodeContainer}>
                  <Input
                    label={t('us.travelInfo.fields.phoneCode', { defaultValue: '区号' })}
                    value={phoneCode}
                    onChangeText={setPhoneCode}
                    onBlur={() => handleFieldBlur('phoneCode', phoneCode)}
                    placeholder={t('us.travelInfo.fields.phoneCodePlaceholder', { defaultValue: '+86' })}
                    error={errors.phoneCode}
                    errorMessage={errors.phoneCode}
                    style={styles.phoneCodeInput}
                  />
                </View>
                <View style={styles.phoneNumberContainer}>
                  <Input
                    label={t('us.travelInfo.fields.phoneNumber', { defaultValue: '电话号码' })}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onBlur={() => handleFieldBlur('phoneNumber', phoneNumber)}
                    placeholder={t('us.travelInfo.fields.phoneNumberPlaceholder', { defaultValue: '13800138000' })}
                    keyboardType="phone-pad"
                    error={errors.phoneNumber}
                    errorMessage={errors.phoneNumber}
                  />
                </View>
              </View>

              <Input
                label={t('us.travelInfo.fields.email', { defaultValue: '电子邮箱' })}
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleFieldBlur('email', email)}
                placeholder={t('us.travelInfo.fields.emailPlaceholder', { defaultValue: 'example@email.com' })}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                errorMessage={errors.email}
              />

              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>{t('us.travelInfo.fields.gender', { defaultValue: '性别' })}</Text>
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
                      {t('us.travelInfo.fields.genderMale', { defaultValue: '男' })}
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
                      {t('us.travelInfo.fields.genderFemale', { defaultValue: '女' })}
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
                      {t('us.travelInfo.fields.genderUndefined', { defaultValue: '其他' })}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.gender && (
                  <Text style={styles.errorText}>{errors.gender}</Text>
                )}
              </View>
            </CollapsibleSection>
          </View>

          <View onLayout={updateSectionOffset('funds')}>
            <CollapsibleSection
              title={t('us.travelInfo.sections.funds', { defaultValue: '资金证明' })}
              expanded={expandedSection === 'funds'}
              onToggle={(expanded) => setExpandedSection(expanded ? 'funds' : null)}
              fieldCount={sectionProgress.funds}
              style={styles.sectionCard}
              headerStyle={styles.sectionHeader}
              contentStyle={styles.sectionContent}
            >
              {funds.length === 0 ? (
                <Text style={styles.emptyFundsText}>
                  {t('us.travelInfo.funds.emptyMessage', { defaultValue: 'No fund items added yet. Add at least one fund item to show proof of funds.' })}
                </Text>
              ) : (
                <View style={styles.fundsList}>
                  {funds.map((item, index) => {
                    const isLast = index === funds.length - 1;
                    return (
                      <TouchableOpacity
                        key={`${item.id}-${index}`}
                        style={[
                          styles.fundItem,
                          !isLast && styles.fundItemBorder
                        ]}
                        onPress={() => handleFundItemPress(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.fundItemContent}>
                          <Text style={styles.fundItemIcon}>{USFormHelper.getFundItemIcon(item.type)}</Text>
                          <View style={styles.fundItemDetails}>
                            <Text style={styles.fundItemType}>
                              {USFormHelper.getFundItemLabel(item.type, t)}
                            </Text>
                            <Text style={styles.fundItemValue}>
                              {USFormHelper.getFundItemSummary(item, t)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.rowArrow}>›</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                style={styles.addFundItemButton}
                onPress={handleAddFundItem}
              >
                <Text style={styles.addFundItemIcon}>➕</Text>
                <Text style={styles.addFundItemText}>
                  {t('us.travelInfo.funds.addButton', { defaultValue: '添加资金项目' })}
                </Text>
              </TouchableOpacity>
            </CollapsibleSection>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>

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
  body: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionGroupTitle: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionGroupTitleSecondary: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    backgroundColor: colors.white,
  },
  sectionContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  placeholderText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
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
  fundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  fundItemBorder: {
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
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  primaryButtonTextContainer: {
    flex: 1,
  },
  primaryButtonTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  primaryButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  primaryButtonArrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '400',
    marginLeft: spacing.md,
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
});

export default USTravelInfoScreen;
