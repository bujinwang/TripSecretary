// US Travel Info Screen - Refactored following Travel Info Screen Refactoring Guide
import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '../../components/BackButton';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import UserDataService from '../../services/data/UserDataService';
import DebouncedSave from '../../utils/DebouncedSave';

// Import custom hooks for state, persistence, and validation
import {
  useUSFormState,
  useUSDataPersistence,
  useUSValidation
} from '../../hooks/usa';

// Import section components
import {
  HeroSection,
  PassportSection,
  TravelSection,
  PersonalInfoSection,
  FundsSection
} from '../../components/usa/sections';

// Inline styles
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
  scrollContainer: {
    paddingBottom: spacing.xl,
  },
  saveStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  saveStatusPending: {
    backgroundColor: '#fef3c7',
  },
  saveStatusSaving: {
    backgroundColor: '#dbeafe',
  },
  saveStatusSaved: {
    backgroundColor: '#d1fae5',
  },
  saveStatusError: {
    backgroundColor: '#fee2e2',
  },
  saveStatusIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  saveStatusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  retryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastEditedText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
});

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const USTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t, language } = useLocale();

  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

  // Memoize userId
  const userId = useMemo(() => passport?.id || rawPassport?.id || 'user_001', [passport?.id, rawPassport?.id]);

  // Initialize form state hook - consolidates all useState declarations
  const formState = useUSFormState(passport);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('us_travel_info');

  // Initialize persistence hook - handles data loading and saving
  const persistence = useUSDataPersistence({
    passport,
    destination,
    userId,
    formState,
    userInteractionTracker,
    navigation,
    t,
  });

  // Initialize validation hook - handles field validation and completion tracking
  const validation = useUSValidation({
    formState,
    userInteractionTracker,
    saveDataToSecureStorageWithOverride: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData,
    t,
  });

  // Extract commonly used functions from hooks
  const {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor
  } = validation;

  const {
    loadData,
    saveDataToSecureStorage: saveDataToSecureStorageWithOverride,
    debouncedSaveData,
    refreshFundItems,
    initializeEntryInfo,
    saveSessionState,
    loadSessionState,
    scrollViewRef,
    shouldRestoreScrollPosition
  } = persistence;

  // Calculate completion metrics
  const metrics = useMemo(() => {
    return calculateCompletionMetrics();
  }, [calculateCompletionMetrics]);

  // Load saved data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add focus listener to reload data when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        await loadData();
        await refreshFundItems({ forceRefresh: true });
      } catch (error) {
        console.error('Error reloading data on focus:', error);
      }
    });

    return unsubscribe;
  }, [navigation, loadData, refreshFundItems]);

  // Add blur listener to save data when leaving the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      DebouncedSave.flushPendingSave('us_travel_info');
    });

    return unsubscribe;
  }, [navigation]);

  // Cleanup effect (component unmounting)
  useEffect(() => {
    return () => {
      try {
        DebouncedSave.flushPendingSave('us_travel_info');
        saveSessionState();
      } catch (error) {
        console.error('Failed to save data on component unmount:', error);
      }
    };
  }, [saveSessionState]);

  // Monitor save status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('us_travel_info');
      formState.setSaveStatus(currentStatus);
    }, 100);

    return () => clearInterval(interval);
  }, [formState]);

  // Save session state when UI state changes
  useEffect(() => {
    if (!formState.isLoading) {
      saveSessionState();
    }
  }, [formState.expandedSection, formState.lastEditedField, saveSessionState, formState.isLoading]);

  // Load session state on component mount
  useEffect(() => {
    loadSessionState();
  }, [loadSessionState]);

  // Restore scroll position after data loads
  useEffect(() => {
    if (
      !formState.isLoading &&
      shouldRestoreScrollPosition.current &&
      formState.scrollPosition > 0 &&
      scrollViewRef.current
    ) {
      const targetScrollPosition = formState.scrollPosition;
      shouldRestoreScrollPosition.current = false;

      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: targetScrollPosition,
          animated: false,
        });
      }, 100);
    }
  }, [formState.isLoading, formState.scrollPosition, scrollViewRef, shouldRestoreScrollPosition]);

  // Helper function to handle navigation with save error handling
  const handleNavigationWithSave = async (navigationAction, actionName = 'navigate') => {
    try {
      formState.setSaveStatus('saving');

      // Flush any pending saves before navigation
      await DebouncedSave.flushPendingSave('us_travel_info');

      // Execute the navigation action
      navigationAction();
    } catch (error) {
      console.error(`Failed to save data before ${actionName}:`, error);
      formState.setSaveStatus('error');

      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        t('us.travelInfo.errors.saveFailed', {
          defaultValue: `Failed to save your data. Do you want to ${actionName} without saving?`
        }),
        [
          {
            text: t('common.retrySave', { defaultValue: 'Retry Save' }),
            onPress: () => handleNavigationWithSave(navigationAction, actionName),
          },
          {
            text: t('common.continueAnyway', { defaultValue: 'Continue Anyway' }),
            onPress: () => navigationAction(),
          },
          {
            text: t('common.cancel', { defaultValue: 'Cancel' }),
            style: 'cancel',
            onPress: () => formState.setSaveStatus(null),
          },
        ]
      );
    }
  };

  // Handle go back
  const handleGoBack = async () => {
    await handleNavigationWithSave(
      () => navigation.goBack(),
      'go back'
    );
  };

  // Handle continue / view entry guide
  const handleContinue = async () => {
    await handleNavigationWithSave(
      () => {
        // Navigate to US Entry Flow (will be implemented)
        // For now, just show a success message
        Alert.alert(
          t('common.success', { defaultValue: 'Success' }),
          t('us.travelInfo.success.dataSaved', {
            defaultValue: 'Your travel information has been saved successfully'
          })
        );
      },
      'continue'
    );
  };

  // Fund item handlers
  const handleFundItemPress = (fundItem) => {
    const fundItemData = fundItem.toJSON ? fundItem.toJSON() : fundItem;
    formState.setCurrentFundItem(fundItemData);
    formState.setFundItemModalVisible(true);
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
    formState.setNewFundItemType(type);
    formState.setFundItemModalVisible(true);
  };

  const handleFundItemModalClose = () => {
    formState.setFundItemModalVisible(false);
    formState.setCurrentFundItem(null);
    formState.setNewFundItemType(null);
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      await refreshFundItems({ forceRefresh: true });
      formState.setFundItemModalVisible(false);
      formState.setCurrentFundItem(null);

      // Trigger save to update entry_info
      await DebouncedSave.flushPendingSave('us_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Error refreshing fund items after update:', error);
    }
  };

  const handleFundItemCreate = async (newItem) => {
    try {
      await refreshFundItems({ forceRefresh: true });
      formState.setFundItemModalVisible(false);
      formState.setNewFundItemType(null);

      // Trigger save
      await DebouncedSave.flushPendingSave('us_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Error refreshing fund items after create:', error);
    }
  };

  const handleFundItemDelete = async (fundItemId) => {
    try {
      await refreshFundItems({ forceRefresh: true });
      formState.setFundItemModalVisible(false);
      formState.setCurrentFundItem(null);

      // Trigger save
      await DebouncedSave.flushPendingSave('us_travel_info');
      debouncedSaveData();
    } catch (error) {
      console.error('Error refreshing fund items after delete:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back', { defaultValue: 'Back' })}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          {t('us.travelInfo.headerTitle', { defaultValue: '美国入境资料' })}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {formState.isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {t('us.travelInfo.loading', { defaultValue: 'Loading...' })}
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={(event) => {
          const currentScrollPosition = event.nativeEvent.contentOffset.y;
          formState.setScrollPosition(currentScrollPosition);
        }}
        scrollEventThrottle={100}
      >
        {/* Hero Section */}
        <HeroSection
          t={t}
          completionPercent={metrics.percentage}
          progressText={getProgressText()}
          progressColor={getProgressColor()}
          onViewEntryGuide={handleContinue}
          styles={styles}
        />

        {/* Save Status Indicator */}
        {formState.saveStatus && (
          <View style={[styles.saveStatusBar, styles[`saveStatus${formState.saveStatus.charAt(0).toUpperCase() + formState.saveStatus.slice(1)}`]]}>
            <Text style={styles.saveStatusIcon}>
              {formState.saveStatus === 'pending' && '⏳'}
              {formState.saveStatus === 'saving' && '💾'}
              {formState.saveStatus === 'saved' && '✅'}
              {formState.saveStatus === 'error' && '❌'}
            </Text>
            <Text style={styles.saveStatusText}>
              {formState.saveStatus === 'pending' && t('us.travelInfo.saveStatus.pending', { defaultValue: 'Pending save...' })}
              {formState.saveStatus === 'saving' && t('us.travelInfo.saveStatus.saving', { defaultValue: 'Saving...' })}
              {formState.saveStatus === 'saved' && t('us.travelInfo.saveStatus.saved', { defaultValue: 'Saved' })}
              {formState.saveStatus === 'error' && t('us.travelInfo.saveStatus.error', { defaultValue: 'Save failed' })}
            </Text>
            {formState.saveStatus === 'error' && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  formState.setSaveStatus('saving');
                  debouncedSaveData();
                }}
              >
                <Text style={styles.retryButtonText}>
                  {t('us.travelInfo.saveStatus.retry', { defaultValue: 'Retry' })}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Last Edited Timestamp */}
        {formState.lastEditedAt && (
          <Text style={styles.lastEditedText}>
            {t('us.travelInfo.lastEdited', {
              defaultValue: 'Last edited: {{time}}',
              time: formState.lastEditedAt.toLocaleTimeString()
            })}
          </Text>
        )}

        {/* Passport Information Section */}
        <PassportSection
          t={t}
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
          // Form state
          passportNo={formState.passportNo}
          fullName={formState.fullName}
          nationality={formState.nationality}
          dob={formState.dob}
          expiryDate={formState.expiryDate}
          gender={formState.gender}
          // Setters
          setPassportNo={formState.setPassportNo}
          setFullName={formState.setFullName}
          setNationality={formState.setNationality}
          setDob={formState.setDob}
          setExpiryDate={formState.setExpiryDate}
          setGender={formState.setGender}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
          setLastEditedAt={formState.setLastEditedAt}
          // Styles
          styles={styles}
        />

        {/* Travel Information Section */}
        <TravelSection
          t={t}
          language={language}
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
          // Form state
          travelPurpose={formState.travelPurpose}
          customTravelPurpose={formState.customTravelPurpose}
          arrivalFlightNumber={formState.arrivalFlightNumber}
          arrivalDate={formState.arrivalDate}
          isTransitPassenger={formState.isTransitPassenger}
          accommodationAddress={formState.accommodationAddress}
          accommodationPhone={formState.accommodationPhone}
          lengthOfStay={formState.lengthOfStay}
          // Setters
          setTravelPurpose={formState.setTravelPurpose}
          setCustomTravelPurpose={formState.setCustomTravelPurpose}
          setArrivalFlightNumber={formState.setArrivalFlightNumber}
          setArrivalDate={formState.setArrivalDate}
          setIsTransitPassenger={formState.setIsTransitPassenger}
          setAccommodationAddress={formState.setAccommodationAddress}
          setAccommodationPhone={formState.setAccommodationPhone}
          setLengthOfStay={formState.setLengthOfStay}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
          setLastEditedAt={formState.setLastEditedAt}
          // Styles
          styles={styles}
        />

        {/* Personal Information Section */}
        <PersonalInfoSection
          t={t}
          isExpanded={formState.expandedSection === 'personal'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
          // Form state
          occupation={formState.occupation}
          cityOfResidence={formState.cityOfResidence}
          residentCountry={formState.residentCountry}
          phoneCode={formState.phoneCode}
          phoneNumber={formState.phoneNumber}
          email={formState.email}
          // Setters
          setOccupation={formState.setOccupation}
          setCityOfResidence={formState.setCityOfResidence}
          setResidentCountry={formState.setResidentCountry}
          setPhoneCode={formState.setPhoneCode}
          setPhoneNumber={formState.setPhoneNumber}
          setEmail={formState.setEmail}
          // Validation
          errors={formState.errors}
          warnings={formState.warnings}
          handleFieldBlur={handleFieldBlur}
          lastEditedField={formState.lastEditedField}
          // Actions
          debouncedSaveData={debouncedSaveData}
          // Styles
          styles={styles}
        />

        {/* Funds Section */}
        <FundsSection
          t={t}
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={() => formState.setExpandedSection(formState.expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
          // Form state
          funds={formState.funds}
          // Actions
          addFund={showFundItemTypeSelector}
          handleFundItemPress={handleFundItemPress}
          // Styles
          styles={styles}
        />

        {/* Bottom Spacer */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Fund Item Detail Modal */}
      <FundItemDetailModal
        visible={formState.fundItemModalVisible}
        fundItem={formState.currentFundItem}
        isCreateMode={!formState.currentFundItem && formState.newFundItemType}
        createItemType={formState.newFundItemType}
        onClose={handleFundItemModalClose}
        onUpdate={handleFundItemUpdate}
        onCreate={handleFundItemCreate}
        onDelete={handleFundItemDelete}
      />
    </SafeAreaView>
  );
};

export default USTravelInfoScreen;
