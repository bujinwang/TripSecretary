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
import ActionBar from '../../components/japan/ActionBar';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { useJapanTravelData } from '../../hooks/japan/useJapanTravelData';
import { useFormProgress } from '../../hooks/japan/useFormProgress';
import UserDataService from '../../services/data/UserDataService';
import { getPhoneCode } from '../../data/phoneCodes';
import JapanFormHelper from '../../utils/japan/JapanFormHelper';

const ACTION_BAR_HEIGHT = 88;

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const JapanTravelInfoScreen = ({ navigation, route }) => {
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
  } = useJapanTravelData(resolvedUserId, navigation, t);

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

  const heroNextActionLabel = isReadyForTravel
    ? t('japan.travelInfo.hero.nextActionReady', { defaultValue: '下一步：打印入境包' })
    : t('japan.travelInfo.hero.nextActionPending', {
        remaining: remainingItems,
        defaultValue: remainingItems > 0 ? `还有 ${remainingItems} 项待确认` : '继续完善资料',
      });

  const heroSummaryLabel = t('japan.travelInfo.hero.summary', {
    completed: totalFilled,
    total: totalFields,
    defaultValue: `已完成 ${totalFilled}/${totalFields} 项准备`,
  });

  const heroMetaLabel = isReadyForTravel
    ? t('japan.travelInfo.hero.metaReady', {
        defaultValue: '所有资料已核对完成，可随时打印或分享给同行人。',
      })
    : t('japan.travelInfo.hero.metaPending', {
        remaining: remainingItems,
        defaultValue:
          remainingItems > 0
            ? `尚有 ${remainingItems} 项资料待填写，点击进度快速定位。`
            : '继续检查资料，确保纸质表格填写无误。',
      });

  const heroTips = useMemo(
    () => [
      {
        id: 'pen',
        icon: '✍️',
        label: t('japan.travelInfo.hero.tipPen', { defaultValue: '带黑/蓝色签字笔' }),
      },
      {
        id: 'sample',
        icon: '📷',
        label: t('japan.travelInfo.hero.tipSample', { defaultValue: '保存纸质表格样例' }),
      },
      {
        id: 'print',
        icon: '✅',
        label: t('japan.travelInfo.hero.tipPrint', { defaultValue: '打印入境包备用' }),
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
        Alert.alert(t('common.error'), t('japan.travelInfo.errors.completeAllFields'));
        return;
      }

      try {
        await saveData();
        navigation.navigate('Result', {
          userId: resolvedUserId,
          destination: destination || { id: 'jp' },
          context: 'manual_entry_guide',
          initialAction,
        });
      } catch (error) {
        Alert.alert(t('common.error'), t('japan.travelInfo.errors.saveFailed'));
      }
    },
    [destination, isFormValid, navigation, resolvedUserId, saveData, t]
  );

  const handleHeroPress = useCallback(() => {
    if (isReadyForTravel) {
      handleNavigateToResult({ initialAction: 'guide', requireValid: true });
    } else {
      focusFirstIncompleteSection();
    }
  }, [focusFirstIncompleteSection, handleNavigateToResult, isReadyForTravel]);

  const handleShareWithFriends = useCallback(() => {
    handleNavigateToResult({ initialAction: 'share', requireValid: false });
  }, [handleNavigateToResult]);

  const handlePrintOrSave = useCallback(() => {
    handleNavigateToResult({ initialAction: 'print', requireValid: true });
  }, [handleNavigateToResult]);

  const handleEditInformation = useCallback(() => {
    focusFirstIncompleteSection();
  }, [focusFirstIncompleteSection]);

  // Handle continue button press
  const navigateBackToPreviousScreen = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const fallbackParams = {
      userId: resolvedUserId,
      destination: destination || { id: 'jp' },
    };

    if (passport) {
      fallbackParams.passport = passport;
    } else if (rawPassport) {
      fallbackParams.passport = rawPassport;
    }

    if (initialTravelInfo) {
      fallbackParams.travelInfo = initialTravelInfo;
    }

    if (routeContext) {
      fallbackParams.context = routeContext;
    }

    navigation.navigate('Result', fallbackParams);
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

  // Handle section toggle
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
          onPress={handleGoBack}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('japan.travelInfo.headerTitle')}</Text>
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
            progressLabel={t('japan.travelInfo.hero.progressLabel', { defaultValue: '准备度' })}
            onPress={handleHeroPress}
          />

          <TipsChips tips={heroTips} />

          <Text style={styles.sectionGroupTitle}>
            {t('japan.travelInfo.groups.copyRequired', { defaultValue: '需抄写信息' })}
          </Text>

          <View onLayout={updateSectionOffset('passport')}>
            <CollapsibleSection
              title={t('japan.travelInfo.sections.passport')}
              expanded={expandedSection === 'passport'}
              onToggle={(expanded) => setExpandedSection(expanded ? 'passport' : null)}
              fieldCount={sectionProgress.passport}
              style={styles.sectionCard}
              headerStyle={styles.sectionHeader}
              contentStyle={styles.sectionContent}
            >
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
            </CollapsibleSection>
          </View>

          <View onLayout={updateSectionOffset('travel')}>
            <CollapsibleSection
              title={t('japan.travelInfo.sections.travel')}
              expanded={expandedSection === 'travel'}
              onToggle={(expanded) => setExpandedSection(expanded ? 'travel' : null)}
              fieldCount={sectionProgress.travel}
              style={styles.sectionCard}
              headerStyle={styles.sectionHeader}
              contentStyle={styles.sectionContent}
            >
              <TravelPurposeSelector
                label={t('japan.travelInfo.fields.travelPurpose')}
                value={travelPurposeCode}
                onValueChange={(value) => {
                  const normalizedValue = JapanFormHelper.normalizeTravelPurpose(value);
                  setTravelPurpose(normalizedValue);
                  if (normalizedValue !== 'Other') {
                    setCustomTravelPurpose('');
                  }
                  handleFieldBlur('travelPurpose', normalizedValue);
                }}
                purposeType="japan"
                locale={language}
                error={!!errors.travelPurpose}
                errorMessage={errors.travelPurpose}
              />

              {travelPurpose === 'Other' && (
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
                  {t('japan.travelInfo.fields.transitPassenger', { defaultValue: '我是过境旅客，不在日本停留' })}
                </Text>
              </TouchableOpacity>

              {!isTransitPassenger && (
                <>
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
            </CollapsibleSection>
          </View>

          <Text style={styles.sectionGroupTitleSecondary}>
            {t('japan.travelInfo.groups.supportingDocs', { defaultValue: '随身备用资料' })}
          </Text>

          <View onLayout={updateSectionOffset('personal')}>
            <CollapsibleSection
              title={t('japan.travelInfo.sections.personal')}
              expanded={expandedSection === 'personal'}
              onToggle={(expanded) => setExpandedSection(expanded ? 'personal' : null)}
              fieldCount={sectionProgress.personal}
              style={styles.sectionCard}
              headerStyle={styles.sectionHeader}
              contentStyle={styles.sectionContent}
            >
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
            </CollapsibleSection>
          </View>

          <View onLayout={updateSectionOffset('funds')}>
            <CollapsibleSection
              title={t('japan.travelInfo.sections.funds')}
              expanded={expandedSection === 'funds'}
              onToggle={(expanded) => setExpandedSection(expanded ? 'funds' : null)}
              fieldCount={sectionProgress.funds}
              style={styles.sectionCard}
              headerStyle={styles.sectionHeader}
              contentStyle={styles.sectionContent}
            >
              {funds.length === 0 ? (
                <Text style={styles.emptyFundsText}>
                  {t('japan.travelInfo.funds.emptyMessage', { defaultValue: 'No fund items added yet. Add at least one fund item to show proof of funds.' })}
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
                          <Text style={styles.fundItemIcon}>{JapanFormHelper.getFundItemIcon(item.type)}</Text>
                          <View style={styles.fundItemDetails}>
                            <Text style={styles.fundItemType}>
                              {JapanFormHelper.getFundItemLabel(item.type, t)}
                            </Text>
                            <Text style={styles.fundItemValue}>
                              {JapanFormHelper.getFundItemSummary(item, t)}
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
                  {t('japan.travelInfo.funds.addButton')}
                </Text>
              </TouchableOpacity>
            </CollapsibleSection>
          </View>

          <TouchableOpacity
            style={styles.offlineGuideCard}
            activeOpacity={0.85}
            onPress={() => handleNavigateToResult({ initialAction: 'guide', requireValid: isReadyForTravel })}
          >
            <View style={styles.offlineGuideIconWrap}>
              <Text style={styles.offlineGuideIcon}>🧳</Text>
            </View>
            <View style={styles.offlineGuideContent}>
              <Text style={styles.offlineGuideTitle}>
                {t('japan.travelInfo.offlineGuide.title', { defaultValue: '查看离线入境指南' })}
              </Text>
              <Text style={styles.offlineGuideSubtitle}>
                {t('japan.travelInfo.offlineGuide.subtitle', {
                  defaultValue: '分步指导 + 大字模式，离线也能查看。',
                })}
              </Text>
            </View>
            <Text style={styles.offlineGuideArrow}>›</Text>
          </TouchableOpacity>

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        <ActionBar
          onEdit={handleEditInformation}
          onShare={handleShareWithFriends}
          onPrint={handlePrintOrSave}
          editLabel={t('japan.travelInfo.actions.edit', { defaultValue: '修改信息' })}
          shareLabel={t('japan.travelInfo.actions.share', { defaultValue: '分享同行' })}
          printLabel={t('japan.travelInfo.actions.print', { defaultValue: '打印/保存 PDF' })}
        />
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
    paddingBottom: spacing.xl + ACTION_BAR_HEIGHT,
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
  offlineGuideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    shadowColor: '#00000014',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  offlineGuideIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  offlineGuideIcon: {
    fontSize: 24,
  },
  offlineGuideContent: {
    flex: 1,
  },
  offlineGuideTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  offlineGuideSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  offlineGuideArrow: {
    fontSize: 24,
    color: colors.primary,
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
