// 入境通 - Malaysia Travel Info Screen (马来西亚入境信息)
// Refactored version following the 5-phase methodology
import React, { useEffect, useMemo } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import FundItemDetailModal from '../../components/FundItemDetailModal';

import { colors, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';

// Inline styles
const styles = {
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  saveStatus: {
    fontSize: 16,
  },
  saveStatusSuccess: {
    color: colors.success,
  },
  saveStatusError: {
    color: colors.error,
  },
  scrollContainer: {
    paddingBottom: spacing.xl,
  },
  bottomActions: {
    padding: spacing.md,
  },
  continueButton: {
    marginBottom: spacing.sm,
  },
};

// Import custom hooks (Phase 1)
import { useMalaysiaFormState } from '../../hooks/malaysia/useMalaysiaFormState';
import { useMalaysiaDataPersistence } from '../../hooks/malaysia/useMalaysiaDataPersistence';
import { useMalaysiaValidation } from '../../hooks/malaysia/useMalaysiaValidation';

// Import section components (Phase 2)
import {
  HeroSection,
  PassportSection,
  PersonalInfoSection,
  TravelDetailsSection,
  FundsSection,
} from '../../components/malaysia/sections';

// Import utilities
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import UserDataService from '../../services/data/UserDataService';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const MalaysiaTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

  // Memoize userId to prevent unnecessary re-renders
  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('malaysia_travel_info');

  // ==================== PHASE 3A: HOOK INITIALIZATION ====================

  // Initialize form state hook
  const formState = useMalaysiaFormState(passport, destination);

  // Initialize persistence hook
  const persistence = useMalaysiaDataPersistence({
    passport,
    destination,
    userId,
    formState,
    userInteractionTracker,
    navigation,
  });

  // Initialize validation hook
  const validation = useMalaysiaValidation({
    formState,
    userInteractionTracker,
    debouncedSaveData: persistence.debouncedSaveData,
  });

  // Extract functions from hooks for convenience
  const {
    handleFieldBlur,
    handleFieldChange,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  } = validation;

  const {
    loadData,
    saveDataToSecureStorage,
    debouncedSaveData,
    refreshFundItems,
    saveFundItems,
    saveSessionState,
    savePhoto,
    scrollViewRef,
  } = persistence;

  // ==================== PHASE 3B: DATA LOADING ====================

  // Load data on mount - replaced 110 lines with 4 lines
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Destructure stable setters and values for useEffect
  const { setCompletionMetrics, setTotalCompletionPercent } = formState;
  const {
    passportNo, fullName, nationality, dob, expiryDate, sex,
    occupation, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, arrivalFlightNumber, arrivalDate,
    accommodationType, customAccommodationType, hotelAddress, stayDuration,
    funds
  } = formState;

  // Recalculate completion metrics whenever form data changes
  useEffect(() => {
    const metrics = calculateCompletionMetrics();
    setCompletionMetrics(metrics);
    setTotalCompletionPercent(metrics?.percent || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    passportNo, fullName, nationality, dob, expiryDate, sex,
    occupation, residentCountry, phoneCode, phoneNumber, email,
    travelPurpose, customTravelPurpose, arrivalFlightNumber, arrivalDate,
    accommodationType, customAccommodationType, hotelAddress, stayDuration,
    funds,
  ]);

  // Save session state when user navigates away
  useEffect(() => {
    return () => {
      saveSessionState();
    };
  }, [saveSessionState]);

  // ==================== FUND MANAGEMENT ====================

  const addFund = (type) => {
    const newFund = {
      id: `fund_${Date.now()}`,
      type: type,
      amount: '',
      currency: 'MYR',
      description: '',
    };
    formState.setCurrentFundItem(newFund);
    formState.setNewFundItemType(type);
    formState.setFundItemModalVisible(true);
  };

  const editFund = (fund) => {
    formState.setSelectedFundItem(fund);
    formState.setCurrentFundItem(fund);
    formState.setFundItemModalVisible(true);
  };

  const saveFundItem = async (fundItem) => {
    try {
      let updatedFunds;
      if (formState.selectedFundItem) {
        // Update existing fund
        updatedFunds = formState.funds.map(f => f.id === fundItem.id ? fundItem : f);
      } else {
        // Add new fund
        updatedFunds = [...formState.funds, fundItem];
      }

      const result = await saveFundItems(updatedFunds);

      if (result.success) {
        formState.setFundItemModalVisible(false);
        formState.setSelectedFundItem(null);
        formState.setCurrentFundItem(null);
        formState.setNewFundItemType(null);
      } else {
        throw new Error('Failed to save fund item');
      }
    } catch (error) {
      console.error('Error saving fund item:', error);
      Alert.alert('Error', 'Failed to save fund item. Please try again.');
    }
  };

  const deleteFundItem = async (fundId) => {
    try {
      const updatedFunds = formState.funds.filter(f => f.id !== fundId);
      const result = await saveFundItems(updatedFunds);

      if (result.success) {
        formState.setFundItemModalVisible(false);
        formState.setSelectedFundItem(null);
        formState.setCurrentFundItem(null);
      } else {
        throw new Error('Failed to delete fund item');
      }
    } catch (error) {
      console.error('Error deleting fund item:', error);
      Alert.alert('Error', 'Failed to delete fund item. Please try again.');
    }
  };

  // ==================== NAVIGATION ====================

  const handleContinue = () => {
    navigation.navigate('MalaysiaEntryFlow', {
      passport: passport,
      destination: destination,
    });
  };

  // ==================== PHASE 3C: RENDER WITH SECTION COMPONENTS ====================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <View style={styles.headerTitle}>Malaysia Entry Info</View>
        <View style={styles.headerRight}>
          {formState.saveStatus && (
            <View style={[
              styles.saveStatus,
              formState.saveStatus === 'saved' && styles.saveStatusSuccess,
              formState.saveStatus === 'error' && styles.saveStatusError
            ]}>
              {formState.saveStatus === 'saving' && '💾'}
              {formState.saveStatus === 'saved' && '✅'}
              {formState.saveStatus === 'error' && '❌'}
            </View>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={(e) => formState.setScrollPosition(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {/* Hero Section - replaced ~120 lines */}
        <HeroSection
          t={t}
          completionMetrics={formState.completionMetrics}
          getProgressText={getProgressText}
          getProgressColor={getProgressColor}
          styles={styles}
        />

        {/* Passport Section - replaced ~110 lines */}
        <PassportSection
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
          fullName={formState.fullName}
          nationality={formState.nationality}
          passportNo={formState.passportNo}
          dob={formState.dob}
          expiryDate={formState.expiryDate}
          sex={formState.sex}
          handleFieldChange={handleFieldChange}
          setFullName={formState.setFullName}
          setNationality={formState.setNationality}
          setPassportNo={formState.setPassportNo}
          setDob={formState.setDob}
          setExpiryDate={formState.setExpiryDate}
          setSex={formState.setSex}
          errors={formState.errors}
          warnings={formState.warnings}
          lastEditedField={formState.lastEditedField}
          userInteractionTracker={userInteractionTracker}
          t={t}
          styles={styles}
        />

        {/* Personal Info Section - replaced ~130 lines */}
        <PersonalInfoSection
          isExpanded={formState.expandedSection === 'personal'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
          occupation={formState.occupation}
          residentCountry={formState.residentCountry}
          phoneCode={formState.phoneCode}
          phoneNumber={formState.phoneNumber}
          email={formState.email}
          handleFieldChange={handleFieldChange}
          setOccupation={formState.setOccupation}
          setResidentCountry={formState.setResidentCountry}
          setPhoneCode={formState.setPhoneCode}
          setPhoneNumber={formState.setPhoneNumber}
          setEmail={formState.setEmail}
          errors={formState.errors}
          warnings={formState.warnings}
          lastEditedField={formState.lastEditedField}
          userInteractionTracker={userInteractionTracker}
          t={t}
          styles={styles}
        />

        {/* Travel Details Section - replaced ~200 lines */}
        <TravelDetailsSection
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
          travelPurpose={formState.travelPurpose}
          customTravelPurpose={formState.customTravelPurpose}
          arrivalFlightNumber={formState.arrivalFlightNumber}
          arrivalDate={formState.arrivalDate}
          accommodationType={formState.accommodationType}
          customAccommodationType={formState.customAccommodationType}
          hotelAddress={formState.hotelAddress}
          stayDuration={formState.stayDuration}
          flightTicketPhoto={formState.flightTicketPhoto}
          hotelReservationPhoto={formState.hotelReservationPhoto}
          handleFieldChange={handleFieldChange}
          setTravelPurpose={formState.setTravelPurpose}
          setCustomTravelPurpose={formState.setCustomTravelPurpose}
          setArrivalFlightNumber={formState.setArrivalFlightNumber}
          setArrivalDate={formState.setArrivalDate}
          setAccommodationType={formState.setAccommodationType}
          setCustomAccommodationType={formState.setCustomAccommodationType}
          setHotelAddress={formState.setHotelAddress}
          setStayDuration={formState.setStayDuration}
          savePhoto={savePhoto}
          errors={formState.errors}
          warnings={formState.warnings}
          lastEditedField={formState.lastEditedField}
          userInteractionTracker={userInteractionTracker}
          t={t}
          styles={styles}
        />

        {/* Funds Section - replaced ~150 lines */}
        <FundsSection
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
          funds={formState.funds}
          addFund={addFund}
          editFund={editFund}
          t={t}
          styles={styles}
        />

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title="Continue to Entry Flow →"
            onPress={handleContinue}
            variant="primary"
            style={styles.continueButton}
          />
        </View>
      </ScrollView>

      {/* Fund Item Modal */}
      <FundItemDetailModal
        visible={formState.fundItemModalVisible}
        fundItem={formState.currentFundItem}
        onSave={saveFundItem}
        onDelete={formState.selectedFundItem ? () => deleteFundItem(formState.selectedFundItem.id) : null}
        onCancel={() => {
          formState.setFundItemModalVisible(false);
          formState.setSelectedFundItem(null);
          formState.setCurrentFundItem(null);
          formState.setNewFundItemType(null);
        }}
      />
    </SafeAreaView>
  );
};

export default MalaysiaTravelInfoScreen;
