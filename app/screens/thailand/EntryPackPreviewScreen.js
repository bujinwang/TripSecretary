import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { ActionButtonGroup, InfoAlert } from '../../components/preview';
import EntryPackDisplay from '../../components/EntryPackDisplay';
import UserDataService from '../../services/data/UserDataService';
import EntryPackValidationService from '../../services/validation/EntryPackValidationService';
import { useTranslation } from '../../i18n/LocaleContext';
import { PreviewHaptics } from '../../utils/haptics';
import { initializeAnimations } from '../../utils/animations/previewAnimations';

const { height: screenHeight } = Dimensions.get('window');

const EntryPackPreviewScreen = ({ route, navigation }) => {
  const { userData, passport: rawPassport, destination, entryPackData } = route.params || {};

  // Memoize passport to prevent infinite re-renders
  const passport = useMemo(() =>
    UserDataService.toSerializablePassport(rawPassport),
    [rawPassport]
  );

  const { t } = useTranslation();

  // State
  const [activeSection, setActiveSection] = useState('status');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [loadedTravelData, setLoadedTravelData] = useState(null);
  const [loadedFundsData, setLoadedFundsData] = useState(null);
  const scrollViewRef = useRef(null);
  const sectionRefs = useRef({});

  // Initialize animations on mount
  useEffect(() => {
    initializeAnimations();
  }, []);

  // Load missing data if not provided in userData (only run once on mount)
  useEffect(() => {
    const loadMissingData = async () => {
      try {
        // Get user ID from passport (could be passport.id or passport.userId)
        const userId = passport?.id || passport?.userId;

        if (!userId) {
          console.log('No user ID available in passport, cannot load data');
          return;
        }

        console.log('Loading data for user ID:', userId);

        // Check if travel data is missing or empty
        const hasTravelData = userData?.travel && Object.keys(userData.travel).length > 0;
        // Check if funds data is missing or empty
        const hasFundsData = userData?.funds && Array.isArray(userData.funds) && userData.funds.length > 0;

        // Load travel data if missing
        if (!hasTravelData && destination?.id) {
          console.log('Travel data missing, loading from database...');
          const travelInfo = await UserDataService.getTravelInfo(userId, destination.id);
          console.log('Loaded travel info:', travelInfo);
          setLoadedTravelData(travelInfo);
        }

        // Load funds data if missing
        if (!hasFundsData) {
          console.log('Funds data missing, loading from database...');
          const fundsInfo = await UserDataService.getFundItems(userId);
          console.log('Loaded funds info:', fundsInfo);
          setLoadedFundsData(fundsInfo);
        }
      } catch (error) {
        console.error('Failed to load missing data:', error);
      }
    };

    loadMissingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Create entry pack data structure
  const mockEntryPack = useMemo(() => ({
    id: 'preview',
    status: 'preview',
    tdacSubmission: entryPackData?.tdacSubmission || null,
    personalInfo: userData?.personalInfo || {},
    travel: loadedTravelData || userData?.travel || {},
    funds: loadedFundsData || userData?.funds || [],
    passport: userData?.passport || passport || {},
  }), [entryPackData, userData, passport, loadedTravelData, loadedFundsData]);

  // Check if this is an official entry pack (with real TDAC submission) or just a preview
  const isOfficialPack = useMemo(() => {
    const hasOfficialTDAC = !!(mockEntryPack.tdacSubmission && mockEntryPack.tdacSubmission.arrCardNo);
    console.log('🔍 Entry Pack Status Check:', {
      hasTdacSubmission: !!mockEntryPack.tdacSubmission,
      arrCardNo: mockEntryPack.tdacSubmission?.arrCardNo,
      isOfficial: hasOfficialTDAC
    });
    return hasOfficialTDAC;
  }, [mockEntryPack.tdacSubmission]);

  // Validate entry pack with error handling
  const validation = useMemo(() => {
    try {
      const result = EntryPackValidationService.validateEntryPack(mockEntryPack, 'thailand');
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      // Return a safe fallback validation result
      return {
        isComplete: false,
        completedSections: 0,
        totalSections: 4,
        sections: {
          tdac: { isComplete: false, missingFields: [] },
          personal: { isComplete: false, missingFields: [] },
          travel: { isComplete: false, missingFields: [] },
          funds: { isComplete: false, missingFields: [] },
        },
        error,
      };
    }
  }, [mockEntryPack]);

  // Handle validation errors in useEffect instead of during memoization
  useEffect(() => {
    if (validation.error) {
      setValidationError(validation.error);
    } else {
      setValidationError(null);
    }
  }, [validation]);

  // Calculate deadline info (example: 72 hours before arrival)
  const deadlineInfo = useMemo(() => {
    const arrivalDate = mockEntryPack.travel?.arrivalDate;
    if (!arrivalDate) return null;

    const arrival = new Date(arrivalDate);
    const now = new Date();
    const deadline = new Date(arrival.getTime() - (72 * 60 * 60 * 1000)); // 72 hours before
    const daysUntilDeadline = Math.ceil((deadline - now) / (24 * 60 * 60 * 1000));

    return {
      deadline,
      daysRemaining: daysUntilDeadline,
      isUrgent: daysUntilDeadline <= 3 && daysUntilDeadline > 0,
      isPastDeadline: daysUntilDeadline < 0,
    };
  }, [mockEntryPack.travel?.arrivalDate]);

  // Progress stepper configuration (memoized to prevent unnecessary re-creations)
  const steps = useMemo(() => [
    {
      key: 'tdac',
      labelTh: 'ปัตร TDAC',
      labelEn: 'TDAC Card',
      status: validation.sections.tdac.isComplete ? 'completed' : 'pending',
      missingFields: validation.sections.tdac.missingFields,
    },
    {
      key: 'personal',
      labelTh: 'ข้อมูลส่วนตัว',
      labelEn: 'Personal Info',
      status: validation.sections.personal.isComplete ? 'completed' : 'pending',
      missingFields: validation.sections.personal.missingFields,
    },
    {
      key: 'travel',
      labelTh: 'ข้อมูลการเดินทาง',
      labelEn: 'Travel Details',
      status: validation.sections.travel.isComplete ? 'completed' : 'pending',
      missingFields: validation.sections.travel.missingFields,
    },
    {
      key: 'funds',
      labelTh: 'เงินทุน',
      labelEn: 'Funds',
      status: validation.sections.funds.isComplete ? 'completed' : 'pending',
      missingFields: validation.sections.funds.missingFields,
    },
  ], [validation.sections]);

  // Simulate initial loading
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Wait for travel data to load if needed
      const hasTravelData = userData?.travel && Object.keys(userData.travel).length > 0;
      if (!hasTravelData && passport?.userId && destination?.id) {
        // Wait a bit longer for travel data to load
        await new Promise(resolve => setTimeout(resolve, 1200));
      } else {
        // Simulate data loading/validation
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setIsLoading(false);

      // Auto-scroll to first incomplete section after loading
      setTimeout(() => {
        scrollToFirstIncomplete();
      }, 400);
    };

    loadData();
  }, [userData, passport, destination]);

  // Handle navigation with error handling
  const handleClose = useCallback(() => {
    PreviewHaptics.buttonPress();
    try {
      navigation.goBack();
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigation]);

  const handleStepPress = useCallback((stepKey) => {
    setActiveSection(stepKey);
    PreviewHaptics.sectionScroll();

    // Scroll to section with error handling
    if (sectionRefs.current[stepKey]) {
      try {
        sectionRefs.current[stepKey].measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
          },
          (error) => {
            console.warn('Scroll measurement failed:', error);
          }
        );
      } catch (error) {
        console.error('Scroll error:', error);
      }
    }
  }, []);

  const scrollToFirstIncomplete = useCallback(() => {
    const firstIncomplete = steps.find(step => step.status !== 'completed');
    if (firstIncomplete && sectionRefs.current[firstIncomplete.key]) {
      handleStepPress(firstIncomplete.key);
    }
  }, [steps, handleStepPress]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    PreviewHaptics.refreshTriggered();

    // Simulate refresh - re-validate data
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsRefreshing(false);
  }, []);

  const handleContinueEditing = useCallback(() => {
    PreviewHaptics.buttonPress();

    try {
      navigation.navigate('ThailandEntryFlow', {
        passport,
        destination,
      });
    } catch (error) {
      console.error('Navigation error:', error);
      setValidationError(error);
    }
  }, [navigation, passport, destination]);

  const navigateToEditSection = (sectionKey) => {
    navigation.goBack();

    // Map section to screen
    const sectionToScreen = {
      tdac: 'TDACSelection',
      personal: 'ThailandPersonalInfo',
      travel: 'ThailandTravelInfo',
      funds: 'ThailandFunds',
    };

    const screenName = sectionToScreen[sectionKey];
    if (screenName) {
      setTimeout(() => {
        navigation.navigate(screenName, {
          passport,
          destination,
          userData: {
            personalInfo: mockEntryPack.personalInfo,
            travel: mockEntryPack.travel,
            funds: mockEntryPack.funds,
          },
        });
      }, 100);
    }
  };

// Show loading state
if (isLoading) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isOfficialPack
              ? 'ชุดข้อมูลตรวจคนเข้าเมือง\nEntry Pack'
              : 'ชุดข้อมูลตรวจคนเข้าเมือง - ตัวอย่าง\nEntry Pack Preview'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isOfficialPack
            ? 'ชุดข้อมูลตรวจคนเข้าเมือง\nEntry Pack'
            : 'ชุดข้อมูลตรวจคนเข้าเมือง - ตัวอย่าง\nEntry Pack Preview'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Scrollable Content with Pull-to-Refresh */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            title={t('common.refreshing', { defaultValue: 'Refreshing...' })}
          />
        }
      >
        {/* Validation Error Alert */}
        {validationError && (
          <InfoAlert
            variant="error"
            title={t('preview.error.validation.title', {
              defaultValue: 'Validation Error',
            })}
            message={t('preview.error.validation.message', {
              defaultValue: 'Unable to validate your information. Please try again.',
            })}
            dismissible={true}
            onDismiss={() => setValidationError(null)}
            onActionPress={handleRefresh}
            actionLabel={t('common.retry', { defaultValue: 'Retry' })}
          />
        )}

        {/* Deadline Alert (if applicable) */}
        {deadlineInfo && deadlineInfo.isUrgent && (
          <InfoAlert
            variant="warning"
            message={t('preview.alerts.deadline', {
              date: deadlineInfo.deadline.toLocaleDateString('th-TH'),
            })}
            dismissible={false}
          />
        )}

        {/* Entry Pack Display - Detailed Sections */}
        <View
          ref={(ref) => (sectionRefs.current.details = ref)}
          style={styles.entryPackContainer}
        >
          <EntryPackDisplay
            entryPack={mockEntryPack}
            personalInfo={mockEntryPack.personalInfo}
            travelInfo={mockEntryPack.travel}
            funds={mockEntryPack.funds}
            isModal={false}
            country="thailand"
          />
        </View>

        {/* Bottom spacing for fixed buttons */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View style={styles.actionButtonContainer}>
        <ActionButtonGroup
          variant="preview-info"
          primaryLabel={t('common.back', { defaultValue: 'Back' })}
          onPrimaryPress={handleContinueEditing}
          primaryDisabled={false}
        />
      </View>
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xl + 120, // Space for fixed buttons
  },
  section: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  entryPackContainer: {
    marginTop: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default EntryPackPreviewScreen;
