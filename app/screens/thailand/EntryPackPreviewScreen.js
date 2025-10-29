import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import {
  StatusCard,
  ProgressStepper,
  PreviewBadge,
  DocumentPreviewCard,
  ActionButtonGroup,
  InfoAlert,
} from '../../components/preview';
import EntryPackDisplay from '../../components/EntryPackDisplay';
import UserDataService from '../../services/data/UserDataService';
import EntryPackValidationService from '../../services/validation/EntryPackValidationService';
import { useTranslation } from '../../i18n/LocaleContext';

const { height: screenHeight } = Dimensions.get('window');

const EntryPackPreviewScreen = ({ route, navigation }) => {
  const { userData, passport: rawPassport, destination, entryPackData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useTranslation();

  // State
  const [activeSection, setActiveSection] = useState('status');
  const scrollViewRef = useRef(null);
  const sectionRefs = useRef({});

  // Create entry pack data structure
  const mockEntryPack = useMemo(() => ({
    id: 'preview',
    status: 'preview',
    tdacSubmission: entryPackData?.tdacSubmission || null,
    personalInfo: userData?.personalInfo || {},
    travel: userData?.travel || {},
    funds: userData?.funds || [],
    passport: userData?.passport || passport || {},
  }), [entryPackData, userData, passport]);

  // Validate entry pack
  const validation = useMemo(() => {
    return EntryPackValidationService.validateEntryPack(mockEntryPack, 'thailand');
  }, [mockEntryPack]);

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

  // Progress stepper configuration
  const steps = [
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
  ];

  // Handle navigation
  const handleClose = () => {
    navigation.goBack();
  };

  const handleStepPress = (stepKey) => {
    setActiveSection(stepKey);
    // Scroll to section if needed
    if (sectionRefs.current[stepKey]) {
      sectionRefs.current[stepKey].measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        },
        () => {}
      );
    }
  };

  const handleContinueEditing = () => {
    // Navigate to first incomplete section
    const firstIncomplete = steps.find(step => step.status !== 'completed');
    if (firstIncomplete) {
      navigateToEditSection(firstIncomplete.key);
    } else {
      // If all complete, go back to travel info
      navigation.goBack();
    }
  };

  const handleSubmit = () => {
    if (!validation.isComplete) {
      // Show error or navigate to missing section
      return;
    }

    // Navigate to TDAC submission
    navigation.navigate('TDACSelection', {
      passport,
      destination,
      userData: {
        personalInfo: mockEntryPack.personalInfo,
        travel: mockEntryPack.travel,
        funds: mockEntryPack.funds,
      },
    });
  };

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

  // Get missing items for status card
  const missingItems = useMemo(() => {
    return steps
      .filter(step => step.status !== 'completed')
      .map(step => ({
        key: step.key,
        label: `${step.labelTh} / ${step.labelEn}`,
        onPress: () => navigateToEditSection(step.key),
      }));
  }, [steps]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          ชุดข้อมูลตรวจคนเข้าเมือง - ตัวอย่าง{'\n'}Entry Pack Preview
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Badge */}
        <PreviewBadge
          mode="preview"
          hint={t('preview.badge.previewHint')}
        />

        {/* Status Card - Hero Section */}
        <View
          ref={(ref) => (sectionRefs.current.status = ref)}
          style={styles.section}
        >
          <StatusCard
            variant={validation.isComplete ? 'complete' : 'incomplete'}
            title={
              validation.isComplete
                ? t('preview.status.complete')
                : t('preview.status.incomplete')
            }
            progress={{
              completed: validation.completedSections,
              total: validation.totalSections,
            }}
            missingItems={missingItems}
            onActionPress={
              validation.isComplete
                ? handleSubmit
                : handleContinueEditing
            }
            actionLabel={
              validation.isComplete
                ? t('preview.buttons.submit')
                : t('preview.buttons.continueEditing')
            }
          />
        </View>

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

        {/* Progress Stepper */}
        <View style={styles.section}>
          <ProgressStepper
            steps={steps}
            currentStep={activeSection}
            onStepPress={handleStepPress}
          />
        </View>

        {/* Document Preview Card */}
        {mockEntryPack.tdacSubmission && (
          <View
            ref={(ref) => (sectionRefs.current.tdac = ref)}
            style={styles.section}
          >
            <DocumentPreviewCard
              variant={mockEntryPack.tdacSubmission.arrCardNo ? 'filled' : 'sample'}
              documentData={mockEntryPack.tdacSubmission}
              onPress={() => {
                // Navigate to full screen document view
              }}
            />
          </View>
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

        {/* Info Alert - Guidance */}
        {!validation.isComplete && (
          <InfoAlert
            variant="info"
            message={t('preview.info.missingInformation')}
            dismissible={true}
          />
        )}

        {/* Bottom spacing for fixed buttons */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View style={styles.actionButtonContainer}>
        <ActionButtonGroup
          variant={validation.isComplete ? 'preview-complete' : 'preview-incomplete'}
          primaryLabel={
            validation.isComplete
              ? t('preview.buttons.submit')
              : t('preview.buttons.continueEditing')
          }
          secondaryLabel={
            validation.isComplete
              ? t('preview.buttons.continueEditing')
              : null
          }
          onPrimaryPress={
            validation.isComplete
              ? handleSubmit
              : handleContinueEditing
          }
          onSecondaryPress={
            validation.isComplete
              ? handleContinueEditing
              : null
          }
          primaryDisabled={!validation.isComplete && validation.completedSections === 0}
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
