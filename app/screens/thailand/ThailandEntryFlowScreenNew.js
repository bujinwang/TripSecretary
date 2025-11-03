/**
 * ThailandEntryFlowScreenNew - Redesigned screen with modern UX
 * Preserves all existing functionality while providing improved user experience
 */

import React, { useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import existing components and services (preserved functionality)
import BackButton from '../../components/BackButton';
import CompletionSummaryCard from '../../components/CompletionSummaryCard';
import PreparedState from '../../components/thailand/PreparedState';
import SubmissionCountdown from '../../components/SubmissionCountdown';
import DataChangeAlert from '../../components/DataChangeAlert';
import { colors, typography, spacing, shadows } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import UserDataService from '../../services/data/UserDataService';
import ErrorHandler, { ErrorType, ErrorSeverity } from '../../utils/ErrorHandler';

// Import new design system components
import { designTokens, borderRadius } from '../../theme/designTokens';
import ProgressRing from '../../components/thailand/ProgressRing';
import StatusCard from '../../components/thailand/StatusCard';
import ActionButton from '../../components/thailand/ActionButton';
import EmptyStateView from '../../components/thailand/EmptyStateView';
import ProgressView from '../../components/thailand/ProgressView';
import ReadyView from '../../components/thailand/ReadyView';
import SubmittedView from '../../components/thailand/SubmittedView';
import { animateValue, createAnimationValue, ANIMATIONS } from '../../utils/animations';

const ThailandEntryFlowScreenNew = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Existing state management (preserved)
  const passportParam = UserDataService.toSerializablePassport(route.params?.passport);

  // Completion state - calculated from real user data
  const [completionPercent, setCompletionPercent] = useState(0);
  const [completionStatus, setCompletionStatus] = useState('incomplete');
  const [categories, setCategories] = useState([]);
  const [userData, setUserData] = useState(null);
  const [arrivalDate, setArrivalDate] = useState(null);

  // Data change detection state
  const [resubmissionWarning, setResubmissionWarning] = useState(null);
  const [entryPackStatus, setEntryPackStatus] = useState(null);
  const [showSupersededStatus, setShowSupersededStatus] = useState(false);
  const [latestTdacData, setLatestTdacData] = useState(null);

  // Passport selection state
  const [userId, setUserId] = useState(null);

  // Load data on component mount and when screen gains focus (preserved)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      setupDataChangeListener();

      return () => {
        // Cleanup listener on unmount
        if (dataChangeUnsubscribe) {
          dataChangeUnsubscribe();
        }
      };
    }, [])
  );

  // Data change listener (preserved)
  let dataChangeUnsubscribe = null;

  const setupDataChangeListener = () => {
    // Add listener for data changes and resubmission warnings
    dataChangeUnsubscribe = UserDataService.addDataChangeListener((event) => {
      console.log('Data change event received in ThailandEntryFlowScreen:', event);

      if (event.type === 'RESUBMISSION_WARNING') {
        // Check if this warning is for the current entry pack
        const currentEntryPackId = route.params?.entryPackId;
        if (currentEntryPackId && event.entryPackId === currentEntryPackId) {
          setResubmissionWarning(event);
        }
      } else if (event.type === 'DATA_CHANGED') {
        // Refresh data when changes are detected
        loadData();
      }
    });
  };

  // Load data function (preserved with minor optimizations)
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get user ID from route params or use default
      const currentUserId = passportParam?.id || 'user_001';
      setUserId(currentUserId);

      // Initialize UserDataService
      await UserDataService.initialize(currentUserId);

      // Load all user data - use currentUserId directly instead of userId state
      const allUserData = await UserDataService.getAllUserData(currentUserId);
      console.log('Loaded user data for completion calculation:', allUserData);

      // Load fund items - use currentUserId directly
      const fundItems = await UserDataService.getFundItems(currentUserId);

      // Load travel info for Thailand - use currentUserId directly
      // Note: This screen is Thailand-specific, so 'th' is the expected destinationId
      const destinationId = route.params?.destination?.id || 'th';
      if (!route.params?.destination?.id) {
        console.warn('⚠️ ThailandEntryFlowScreen: No destination.id in route params, defaulting to "th"');
      }
      const travelInfo = await UserDataService.getTravelInfo(currentUserId, destinationId);

      // Get entry info ID for this destination
      let entryInfoId = null;
      try {
        const EntryInfoService = require('../../services/EntryInfoService').default;
        if (EntryInfoService && typeof EntryInfoService.getAllEntryInfos === 'function') {
          const allEntryInfos = await EntryInfoService.getAllEntryInfos(currentUserId);
          const thailandEntryInfo = allEntryInfos?.find(info => info.destinationId === destinationId);
          if (thailandEntryInfo) {
            entryInfoId = thailandEntryInfo.id;
            console.log('✅ Found entry info ID:', entryInfoId);
          }
        } else {
          console.log('EntryInfoService not available, skipping entry info ID lookup');
        }
      } catch (error) {
        console.error('Failed to get entry info ID:', error);
      }

      // Prepare entry info for completion calculation
      const passportInfo = allUserData.passport || {};
      const personalInfoFromStore = allUserData.personalInfo || {};
      const normalizedPersonalInfo = { ...personalInfoFromStore };

      // Gender removed from personalInfo - use passport data directly
      // Gender normalization logic removed - handled by passport model

      const entryInfo = {
        entryInfoId, // Include the entry info ID
        passport: passportInfo,
        personalInfo: normalizedPersonalInfo,
        funds: fundItems || [],
        travel: travelInfo || {},
        lastUpdatedAt: new Date().toISOString()
      };

      setUserData(entryInfo);

      // Extract arrival date for countdown
      const arrivalDateFromTravel = travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate;
      setArrivalDate(arrivalDateFromTravel);

      // Calculate completion using EntryCompletionCalculator
      const completionSummary = EntryCompletionCalculator.getCompletionSummary(entryInfo);
      console.log('Completion summary:', completionSummary);

      // Update completion state
      setCompletionPercent(completionSummary.totalPercent);

      if (completionSummary.totalPercent === 100) {
        setCompletionStatus('ready');
      } else if (completionSummary.totalPercent >= 50) {
        setCompletionStatus('mostly_complete');
      } else {
        setCompletionStatus('needs_improvement');
      }

      // Create category data from completion metrics
      const categoryData = [
        {
          id: 'passport',
          name: t('progressiveEntryFlow.categories.passport', { defaultValue: '护照信息' }),
          icon: '📘',
          status: completionSummary.categorySummary.passport.state,
          completedCount: completionSummary.categorySummary.passport.completed,
          totalCount: completionSummary.categorySummary.passport.total,
          missingFields: completionSummary.missingFields.passport || [],
        },
        {
          id: 'personal',
          name: t('progressiveEntryFlow.categories.personal', { defaultValue: '个人信息' }),
          icon: '👤',
          status: completionSummary.categorySummary.personalInfo.state,
          completedCount: completionSummary.categorySummary.personalInfo.completed,
          totalCount: completionSummary.categorySummary.personalInfo.total,
          missingFields: completionSummary.missingFields.personalInfo || [],
        },
        {
          id: 'funds',
          name: t('progressiveEntryFlow.categories.funds', { defaultValue: '资金证明' }),
          icon: '💰',
          status: completionSummary.categorySummary.funds.state,
          completedCount: completionSummary.categorySummary.funds.validFunds,
          totalCount: 1, // At least 1 fund item required
          missingFields: completionSummary.missingFields.funds || [],
        },
        {
          id: 'travel',
          name: t('progressiveEntryFlow.categories.travel', { defaultValue: '旅行信息' }),
          icon: '✈️',
          status: completionSummary.categorySummary.travel.state,
          completedCount: completionSummary.categorySummary.travel.completed,
          totalCount: completionSummary.categorySummary.travel.total,
          missingFields: completionSummary.missingFields.travel || [],
        },
      ];

      setCategories(categoryData);

      // Check for entry info and resubmission warnings (non-blocking) - use currentUserId directly
      loadEntryInfoStatus(currentUserId).catch(error => {
        console.log('Entry info status check failed, continuing without it:', error);
      });

    } catch (error) {
      ErrorHandler.handleDataLoadError(error, 'ThailandEntryFlowScreen.loadData', {
        severity: ErrorSeverity.WARNING,
        customMessage: '加载入境准备信息时出现问题，请下拉刷新重试。',
        onRetry: () => loadData(),
      });

      // Fallback to empty state on error
      setCompletionPercent(0);
      setCompletionStatus('needs_improvement');
      setCategories([
        {
          id: 'passport',
          name: '护照信息',
          icon: '📘',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 5,
          missingFields: ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'],
        },
        {
          id: 'personal',
          name: '护照信息',
          icon: '👤',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 4,
          missingFields: ['occupation', 'phoneNumber', 'email', 'gender'],
        },
        {
          id: 'funds',
          name: '资金证明',
          icon: '💰',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 1,
          missingFields: ['fundItems'],
        },
        {
          id: 'travel',
          name: '旅行信息',
          icon: '✈️',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 4,
          missingFields: ['arrivalDate', 'flightNumber', 'accommodation', 'travelPurpose'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // All existing handler functions preserved
  const loadEntryInfoStatus = async (userId) => {
    try {
      // Use EntryInfoService to check for entry info with DAC submissions
      const EntryInfoService = require('../../services/EntryInfoService').default;

      if (!EntryInfoService || typeof EntryInfoService.getAllEntryInfos !== 'function') {
        console.log('EntryInfoService methods not available, skipping entry info status check');
        setEntryPackStatus(null);
        setShowSupersededStatus(false);
        setResubmissionWarning(null);
        return;
      }

      const allEntryInfos = await EntryInfoService.getAllEntryInfos(userId);

      // Find entry info for Thailand
      // Note: This screen is Thailand-specific, so 'th' is the expected destinationId
      const destinationId = route.params?.destination?.id || 'th';
      const thailandEntryInfo = allEntryInfos?.find(info =>
        info.destinationId === destinationId
      );

      if (thailandEntryInfo) {
        // Check if this entry info has a successful DAC submission
        const latestDAC = await EntryInfoService.getLatestSuccessfulDigitalArrivalCard(thailandEntryInfo.id, 'TDAC');

        if (latestDAC) {
          // Has successful DAC - consider it "submitted"
          setEntryPackStatus('submitted');
          setShowSupersededStatus(latestDAC.status === 'superseded');

          // Store the latest TDAC data for use in preview
          setLatestTdacData({
            arrCardNo: latestDAC.arrCardNo,
            qrUri: latestDAC.qrUri,
            pdfUrl: latestDAC.pdfUrl,
            submittedAt: latestDAC.submittedAt,
            submissionMethod: latestDAC.submissionMethod,
          });

          console.log('📌 Stored TDAC data:', {
            arrCardNo: latestDAC.arrCardNo,
            hasQr: !!latestDAC.qrUri,
            hasPdf: !!latestDAC.pdfUrl
          });

          // Check for pending resubmission warnings
          try {
            const warning = UserDataService.getResubmissionWarning(thailandEntryInfo.id);
            if (warning) {
              setResubmissionWarning(warning);
            }
          } catch (warningError) {
            console.log('Resubmission warning check failed:', warningError);
          }

          console.log('Entry info status loaded:', {
            entryInfoId: thailandEntryInfo.id,
            hasDAC: !!latestDAC,
            dacStatus: latestDAC.status,
            hasWarning: !!resubmissionWarning
          });
        } else {
          // No successful DAC - consider it "in_progress"
          setEntryPackStatus('in_progress');
          setShowSupersededStatus(false);
          setResubmissionWarning(null);
          setLatestTdacData(null);
        }
      } else {
        setEntryPackStatus(null);
        setShowSupersededStatus(false);
        setLatestTdacData(null);
        setResubmissionWarning(null);
      }
    } catch (error) {
      ErrorHandler.handle(error, {
        context: 'ThailandEntryFlowScreen.loadEntryInfoStatus',
        type: ErrorType.DATA_LOAD,
        severity: ErrorSeverity.SILENT, // Silent - don't notify user as this is non-critical
      });
      // Don't let entry info status loading failure block the main UI
      setEntryPackStatus(null);
      setShowSupersededStatus(false);
      setResubmissionWarning(null);
    }
  };

  const handleResubmissionWarning = async (warning, action) => {
    try {
      if (action === 'resubmit') {
        // Mark entry pack as superseded and navigate to edit
        await UserDataService.markEntryPackAsSuperseded(warning.entryPackId, {
          changedFields: warning.diffResult.changedFields,
          changeReason: 'user_confirmed_resubmission'
        });

        // Clear the warning
        setResubmissionWarning(null);
        setShowSupersededStatus(true);

        // Navigate to edit screen
        navigation.navigate('ThailandTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
          resubmissionMode: true
        });
      } else if (action === 'ignore') {
        // Clear the warning but don't mark as superseded
        UserDataService.clearResubmissionWarning(warning.entryPackId);
        setResubmissionWarning(null);
      }
    } catch (error) {
      ErrorHandler.handleDataSaveError(error, 'ThailandEntryFlowScreen.handleResubmissionWarning', {
        severity: ErrorSeverity.WARNING,
        customTitle: t('common.error', { defaultValue: '错误' }),
        customMessage: t('progressiveEntryFlow.dataChange.handleError', {
          defaultValue: '处理数据变更时出错，请重试。'
        }),
        onRetry: () => handleResubmissionWarning(warning, action),
      });
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleEditInformation = () => {
    // Navigate back to ThailandTravelInfoScreen
    navigation.navigate('ThailandTravelInfo', {
      passport: passportParam,
      destination: route.params?.destination,
    });
  };

  const handlePreviewEntryCard = () => {
    console.log('🎯 Opening entry pack with TDAC data:', latestTdacData);

    // Navigate to EntryPackPreview to show the complete entry pack preview
    navigation.navigate('EntryPackPreview', {
      userData,
      passport: passportParam,
      destination: route.params?.destination,
      entryPackData: {
        personalInfo: userData?.personalInfo,
        travelInfo: userData?.travel,
        funds: userData?.funds,
        tdacSubmission: latestTdacData // Use the loaded TDAC data
      }
    });
  };

  const handleCategoryPress = (category) => {
    // Navigate back to ThailandTravelInfoScreen with the specific section expanded
    // This will be enhanced in future tasks to expand the correct section
    navigation.navigate('ThailandTravelInfo', {
      expandSection: category.id,
      passport: passportParam,
      destination: route.params?.destination,
    });
  };

  const handlePrimaryAction = async () => {
    const buttonState = getPrimaryButtonState();

    switch (buttonState.action) {
      case 'continue_improving':
        // Navigate back to ThailandTravelInfoScreen
        navigation.navigate('ThailandTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
        });
        break;
      case 'submit_tdac':
        // Navigate to TDAC submission screen with complete traveler info
        try {
          // Build complete traveler context from user data
          const userId = passportParam?.id || 'user_001';
          const ThailandTravelerContextBuilder = require('../../services/thailand/ThailandTravelerContextBuilder').default;
          const contextResult = await ThailandTravelerContextBuilder.buildThailandTravelerContext(userId);

          if (contextResult.success) {
            console.log('✅ Built traveler context for TDAC submission:', {
              hasPassportNo: !!contextResult.payload.passportNo,
              hasFullName: !!contextResult.payload.familyName && !!contextResult.payload.firstName,
              hasArrivalDate: !!contextResult.payload.arrivalDate,
              hasEmail: !!contextResult.payload.email,
              warnings: contextResult.warnings
            });

            // Show warnings if any (but still allow submission since validation passed)
            if (contextResult.warnings && contextResult.warnings.length > 0) {
              Alert.alert(
                '⚠️ 数据提醒',
                '以下信息需要注意：\n\n• ' + contextResult.warnings.join('\n• ') + '\n\n数据验证通过，可以继续提交。',
                [
                  {
                    text: '完善信息',
                    onPress: () => {
                      navigation.navigate('ThailandTravelInfo', {
                        passport: passportParam,
                        destination: route.params?.destination,
                      });
                    }
                  },
                  {
                    text: '继续提交',
                    style: 'default',
                    onPress: () => {
                      navigation.navigate('TDACHybrid', {
                        passport: passportParam,
                        destination: route.params?.destination,
                        travelerInfo: contextResult.payload,
                      });
                    }
                  }
                ]
              );
            } else {
              // No warnings, proceed directly to flash submission
              navigation.navigate('TDACHybrid', {
                passport: passportParam,
                destination: route.params?.destination,
                travelerInfo: contextResult.payload,
              });
            }
          } else {
            console.error('❌ Failed to build traveler context:', contextResult.errors);
            Alert.alert(
              '❌ TDAC提交要求严格',
              '泰国入境卡(TDAC)要求所有信息必须完整准确，不能使用默认值。\n\n必须完善的信息：\n\n• ' + contextResult.errors.join('\n• ') + '\n\n请返回完善所有必需信息后再提交。',
              [
                {
                  text: '立即完善',
                  style: 'default',
                  onPress: () => {
                    navigation.navigate('ThailandTravelInfo', {
                      passport: passportParam,
                      destination: route.params?.destination,
                      highlightMissingFields: true, // Flag to highlight missing fields
                    });
                  }
                },
                { text: '取消', style: 'cancel' }
              ]
            );
          }
        } catch (error) {
          ErrorHandler.handleDataLoadError(error, 'ThailandEntryFlowScreen.handlePrimaryAction.buildContext', {
            severity: ErrorSeverity.WARNING,
            customTitle: '系统错误',
            customMessage: '构建旅行者信息时出错，请稍后重试。',
            onRetry: () => handlePrimaryAction(),
          });
        }
        break;
      case 'view_entry_pack':
        // Navigate to entry pack preview screen (not detail, as it's not submitted yet)
        handlePreviewEntryCard();
        break;
      case 'resubmit_tdac':
        // Handle resubmission - navigate to edit screen first
        navigation.navigate('ThailandTravelInfo', {
          passport: passportParam,
          destination: route.params?.destination,
          resubmissionMode: true,
          showResubmissionHint: true
        });
        break;
      case 'wait_for_window':
      default:
        // Button is disabled, no action
        break;
    }
  };

  // Get primary button state based on completion status and submission window (preserved)
  const getPrimaryButtonState = () => {
    // Check if TDAC has been submitted successfully
    if (entryPackStatus === 'submitted' && !showSupersededStatus) {
      return {
        title: '查看我的通关包 📋',
        action: 'view_entry_pack',
        disabled: false,
        variant: 'success',
        subtitle: '随时回顾你已准备好的资料'
      };
    }

    // Check if entry pack is superseded
    if (showSupersededStatus || entryPackStatus === 'superseded') {
      return {
        title: '更新我的泰国准备信息 🌺',
        action: 'resubmit_tdac',
        disabled: false,
        variant: 'primary',
        subtitle: '你的信息有更新，让我们重新准备最新的入境卡'
      };
    }

    // Check completion status
    const isComplete = completionPercent === 100;

    // Check submission window status
    let canSubmitNow = false;
    if (arrivalDate) {
      const window = require('../../utils/thailand/ArrivalWindowCalculator').default.getSubmissionWindow(arrivalDate);
      canSubmitNow = window.canSubmit;
    }

    // If completion is high enough, show entry pack option
    if (completionPercent >= 80 && isComplete && canSubmitNow) {
      return {
        title: '提交入境卡',
        action: 'submit_tdac',
        disabled: false,
        variant: 'primary'
      };
    } else if (completionPercent >= 60) {
      return {
        title: '查看我的通关包 📋',
        action: 'view_entry_pack',
        disabled: false,
        variant: 'primary',
        subtitle: '看看你已经准备好的入境信息'
      };
    } else if (!isComplete) {
      return {
        title: '继续准备我的泰国之旅 💪',
        action: 'continue_improving',
        disabled: false,
        variant: 'secondary'
      };
    } else if (isComplete && !arrivalDate) {
      return {
        title: '告诉我你什么时候到泰国 ✈️',
        action: 'continue_improving',
        disabled: false,
        variant: 'secondary',
        subtitle: '设置抵达日期，我们就能帮你找到最佳提交时间'
      };
    } else if (isComplete && !canSubmitNow) {
      return {
        title: t('progressiveEntryFlow.countdown.preWindow', { defaultValue: '等待提交窗口' }),
        action: 'wait_for_window',
        disabled: true,
        variant: 'primary',
        subtitle: t('progressiveEntryFlow.countdown.preWindow', {
          defaultValue: '提交窗口尚未开启'
        })
      };
    } else {
      return {
        title: '提交入境卡',
        action: 'submit_tdac',
        disabled: false,
        variant: 'primary'
      };
    }
  };

  const hasNoEntryData = completionPercent === 0 && categories.every(cat => cat.completedCount === 0);
  const primaryActionState = getPrimaryButtonState();

  // Animation values for state transitions
  const fadeAnim = React.useRef(createAnimationValue(1)).current;
  const slideAnim = React.useRef(createAnimationValue(0)).current;

  // Render functions with new design
  const renderNoDataState = () => (
    <EmptyStateView onStartPreparation={handleEditInformation} />
  );

  const renderProgressView = () => (
    <ProgressView
      completionPercent={completionPercent}
      categories={categories}
      arrivalDate={arrivalDate}
      primaryActionState={primaryActionState}
      onCategoryPress={handleCategoryPress}
      onPrimaryAction={handlePrimaryAction}
      onPreviewEntryCard={handlePreviewEntryCard}
      onEditInformation={handleEditInformation}
      language={language}
    />
  );

  const renderReadyView = () => (
    <ReadyView
      arrivalDate={arrivalDate}
      primaryActionState={primaryActionState}
      onPrimaryAction={handlePrimaryAction}
      onPreviewGuide={() => {
        console.log('Navigate to entry guide preview');
        navigation.navigate('ThailandEntryGuide', {
          passport: passportParam,
          destination: route.params?.destination,
          completionData: userData,
          previewMode: true,
        });
      }}
      onPreviewEntryCard={handlePreviewEntryCard}
      onEditInformation={handleEditInformation}
      language={language}
    />
  );

  const renderSubmittedView = () => (
    <SubmittedView
      latestTdacData={latestTdacData}
      onViewEntryPack={handlePreviewEntryCard}
      onStartImmigration={() => {
        navigation.navigate('ThailandEntryGuide', {
          passport: passportParam,
          destination: route.params?.destination,
          completionData: userData,
          showSubmittedTips: true,
        });
      }}
      onEditInformation={handleEditInformation}
    />
  );

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {/* Superseded Status Banner */}
      {showSupersededStatus && (
        <View style={styles.supersededBanner}>
          <Text style={styles.supersededIcon}>🔄</Text>
          <View style={styles.supersededContent}>
            <Text style={styles.supersededTitle}>
              {t('progressiveEntryFlow.status.superseded', {
                defaultValue: '需要重新提交'
              })}
            </Text>
            <Text style={styles.supersededMessage}>
              {t('progressiveEntryFlow.superseded.message', {
                defaultValue: '您的入境信息已更新，需要重新提交入境卡以确保信息准确。'
              })}
            </Text>
          </View>
        </View>
      )}

      {/* Data Change Alert */}
      {resubmissionWarning && (
        <DataChangeAlert
          warning={resubmissionWarning}
          onResubmit={(warning) => handleResubmissionWarning(warning, 'resubmit')}
          onIgnore={(warning) => handleResubmissionWarning(warning, 'ignore')}
          onViewDetails={(warning) => {
            console.log('View details for warning:', warning);
          }}
          style={styles.dataChangeAlert}
        />
      )}

      {hasNoEntryData ? renderNoDataState() : (
        entryPackStatus === 'submitted' && !showSupersededStatus
          ? renderSubmittedView()
          : completionPercent === 100
            ? renderReadyView()
            : renderProgressView()
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={handleGoBack}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          我的泰国之旅 🌺
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {t('thailand.entryFlow.loading', { defaultValue: '正在加载准备状态...' })}
            </Text>
          </View>
        ) : (
          renderContent()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: designTokens.background,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: designTokens.text,
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: designTokens.textSecondary,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
  },

  // Progress Section
  progressSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  progressMessage: {
    ...typography.h3,
    fontWeight: '600',
    color: designTokens.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },

  // Category Grid
  categoryGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  // Countdown Card
  countdownCard: {
    marginBottom: spacing.lg,
    backgroundColor: designTokens.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: designTokens.border,
    ...shadows.small,
  },

  // Action Section
  actionSection: {
    gap: spacing.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // No Data Styles
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  noDataIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  noDataTitle: {
    ...typography.h2,
    color: designTokens.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  noDataDescription: {
    ...typography.body1,
    color: designTokens.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  noDataHints: {
    backgroundColor: designTokens.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  noDataHintsTitle: {
    ...typography.body1,
    color: designTokens.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  noDataHintsList: {
    gap: spacing.xs,
  },
  noDataHint: {
    ...typography.body2,
    color: designTokens.primary,
    lineHeight: 18,
  },
  noDataButton: {
    minWidth: 200,
  },

  // Superseded Status Banner Styles
  supersededBanner: {
    backgroundColor: '#FFF5F5',
    borderColor: designTokens.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  supersededIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  supersededContent: {
    flex: 1,
  },
  supersededTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: designTokens.error,
    marginBottom: spacing.xs,
  },
  supersededMessage: {
    ...typography.body2,
    color: designTokens.textSecondary,
    lineHeight: 20,
  },

  // Data Change Alert Styles
  dataChangeAlert: {
    marginBottom: spacing.md,
  },
});

export default ThailandEntryFlowScreenNew;