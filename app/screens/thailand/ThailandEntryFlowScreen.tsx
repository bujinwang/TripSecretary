// 入境通 - Thailand Entry Flow Screen (泰国入境准备状态)
import React, { useCallback, useMemo, useRef, useState } from 'react';
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

import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import EntryPackStatusBanner, { type EntryPackStatusBannerProps } from '../../components/EntryPackStatusBanner';
import PreparedState from '../../components/thailand/PreparedState';
import DataChangeAlert from '../../components/DataChangeAlert';
import { colors, typography, spacing, shadows } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import UserDataService from '../../services/data/UserDataService';
import ErrorHandler, { ErrorType, ErrorSeverity } from '../../utils/ErrorHandler';
import EntryInfoService from '../../services/EntryInfoService';
import ThailandTravelerContextBuilder from '../../services/thailand/ThailandTravelerContextBuilder';
import ArrivalWindowCalculator from '../../utils/thailand/ArrivalWindowCalculator';
import type { DestinationParam, RootStackScreenProps } from '../../types/navigation';
import type { AllUserData, SerializablePassport } from '../../types/data';
import type { SubmissionMethod, EntryPackPresentationStatus, TDACTravelerInfo } from '../../types/thailand';
import type { ResubmissionWarningEvent } from '../../services/data/events/DataEventService';
import type { ButtonProps } from '../../components/Button';

type ThailandEntryFlowScreenProps = RootStackScreenProps<'ThailandEntryFlow'>;

type CompletionStatus = 'incomplete' | 'needs_improvement' | 'mostly_complete' | 'ready' | string;

type CompletionCategoryId = 'passport' | 'personal' | 'funds' | 'travel';

type CompletionCategory = {
  id: CompletionCategoryId;
  name: string;
  icon: string;
  status: string;
  completedCount: number;
  totalCount: number;
  missingFields: string[];
};

type EntryPreparationData = {
  entryInfoId: string | null;
  passport: Record<string, unknown>;
  personalInfo: Record<string, unknown>;
  funds: unknown[];
  travel: Record<string, unknown>;
  lastUpdatedAt: string;
};

type LatestTdacData = {
  arrCardNo?: string | null;
  qrUri?: string | null;
  pdfUrl?: string | null;
  submittedAt?: string | null;
  submissionMethod?: SubmissionMethod | null;
};

type PrimaryActionKey = 'continue_improving' | 'submit_tdac' | 'view_entry_pack' | 'resubmit_tdac' | 'wait_for_window';
type ButtonVariant = NonNullable<ButtonProps['variant']>;

type PrimaryActionState = {
  title: string;
  action: PrimaryActionKey;
  disabled: boolean;
  variant: ButtonVariant;
  subtitle?: string;
};

type EntryPackStatus = EntryPackStatusBannerProps['status'];

const DEFAULT_USER_ID = 'user_001';
const DEFAULT_DESTINATION_ID = 'th';
const TDAC_CARD_TYPE = 'TDAC';

const ThailandEntryFlowScreen: React.FC<ThailandEntryFlowScreenProps> = ({ navigation, route }) => {
  const { t, language } = useLocale();
  const params = route.params ?? {};
  const destinationParam = useMemo<DestinationParam | null>(() => {
    const incoming = params.destination;
    if (!incoming) {
      return null;
    }
    if (typeof incoming === 'string') {
      return { id: incoming };
    }
    if (typeof incoming === 'object') {
      return incoming;
    }
    return null;
  }, [params.destination]);
  const destinationId = (typeof params.destination === 'string'
    ? params.destination
    : destinationParam?.id) ?? DEFAULT_DESTINATION_ID;
  const passportParam = useMemo<SerializablePassport | null>(() => {
    const incoming = params.passport ?? null;
    if (!incoming) {
      return null;
    }
    try {
      const serializable = UserDataService.toSerializablePassport(incoming as any);
      return (serializable || incoming) as SerializablePassport;
    } catch {
      return incoming as SerializablePassport;
    }
  }, [params.passport]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Completion state - calculated from real user data
  const [completionPercent, setCompletionPercent] = useState<number>(0);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>('incomplete');
  const [categories, setCategories] = useState<CompletionCategory[]>([]);
  const [userData, setUserData] = useState<EntryPreparationData | null>(null);
  const [arrivalDate, setArrivalDate] = useState<string | null>(null);

  // Data change detection state
  const [resubmissionWarning, setResubmissionWarning] = useState<ResubmissionWarningEvent | null>(null);
  const [entryPackStatus, setEntryPackStatus] = useState<EntryPackPresentationStatus | null>(null);
  const [showSupersededStatus, setShowSupersededStatus] = useState<boolean>(false);
  const [latestTdacData, setLatestTdacData] = useState<LatestTdacData | null>(null);

  // Passport selection state
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const dataChangeUnsubscribeRef = useRef<(() => void) | null>(null);

  const loadEntryInfoStatus = useCallback(async (activeUserId: string) => {
    try {
      const allEntryInfos = await EntryInfoService.getAllEntryInfos(activeUserId);
      const thailandEntryInfo = allEntryInfos?.find((info: any) => info?.destinationId === destinationId);

      if (!thailandEntryInfo?.id) {
        setEntryPackStatus(null);
        setShowSupersededStatus(false);
        setLatestTdacData(null);
        setResubmissionWarning(null);
        return;
      }

      const latestDACRecord = await EntryInfoService.getLatestSuccessfulDigitalArrivalCard(
        thailandEntryInfo.id,
        TDAC_CARD_TYPE
      );

      if (latestDACRecord) {
        const record = latestDACRecord as Record<string, any>;
        setEntryPackStatus('submitted');
        const isSuperseded = record.status === 'superseded';
        setShowSupersededStatus(isSuperseded);
        const submissionMethodRaw = typeof record.submissionMethod === 'string' ? record.submissionMethod.toLowerCase() : undefined;
        const normalizedSubmissionMethod: SubmissionMethod =
          submissionMethodRaw === 'api' ||
          submissionMethodRaw === 'webview' ||
          submissionMethodRaw === 'hybrid'
            ? (submissionMethodRaw as SubmissionMethod)
            : 'unknown';

        setLatestTdacData({
          arrCardNo: record.arrCardNo ?? null,
          qrUri: record.qrUri ?? null,
          pdfUrl: record.pdfUrl ?? null,
          submittedAt: record.submittedAt ?? null,
          submissionMethod: normalizedSubmissionMethod,
        });

        try {
          const warning = UserDataService.getResubmissionWarning(thailandEntryInfo.id) as ResubmissionWarningEvent | null;
          setResubmissionWarning(warning);
        } catch (warningError) {
          console.log('Resubmission warning check failed:', warningError);
        }
      } else {
        setEntryPackStatus('in_progress');
        setShowSupersededStatus(false);
        setLatestTdacData(null);
        setResubmissionWarning(null);
      }
    } catch (error) {
      ErrorHandler.handle(error, {
        context: 'ThailandEntryFlowScreen.loadEntryInfoStatus',
        type: ErrorType.DATA_LOAD,
        severity: ErrorSeverity.SILENT,
      } as any);
      setEntryPackStatus(null);
      setShowSupersededStatus(false);
      setLatestTdacData(null);
      setResubmissionWarning(null);
    }
  }, [destinationId]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const resolvedUserId = passportParam?.userId ?? passportParam?.id ?? DEFAULT_USER_ID;
      setActiveUserId(resolvedUserId);

      await UserDataService.initialize(resolvedUserId);

      const allUserData = (await UserDataService.getAllUserData(resolvedUserId)) as AllUserData;
      const fundItems = await UserDataService.getFundItems(resolvedUserId).catch(() => []);
      const travelInfo = await UserDataService.getTravelInfo(resolvedUserId, destinationId).catch(() => null);

      let entryInfoId: string | null = null;
      try {
        const allEntryInfos = await EntryInfoService.getAllEntryInfos(resolvedUserId);
        const thailandEntryInfo = allEntryInfos?.find((info: any) => info?.destinationId === destinationId);
        if (thailandEntryInfo?.id) {
          entryInfoId = String(thailandEntryInfo.id);
        }
      } catch (lookupError) {
        console.error('Failed to get entry info ID:', lookupError);
      }

      const entryInfo: EntryPreparationData = {
        entryInfoId,
        passport: (allUserData?.passport as Record<string, unknown>) ?? {},
        personalInfo: (allUserData?.personalInfo as Record<string, unknown>) ?? {},
        funds: Array.isArray(fundItems) ? fundItems : [],
        travel: travelInfo ? { ...(travelInfo as Record<string, unknown>) } : {},
        lastUpdatedAt: new Date().toISOString(),
      };

      setUserData(entryInfo);

      const travelRecord = travelInfo as Record<string, any> | null;
      const arrivalDateFromTravel =
        travelRecord?.arrivalArrivalDate ??
        travelRecord?.arrivalDate ??
        null;
      setArrivalDate(arrivalDateFromTravel ?? null);

      const completionSummary = EntryCompletionCalculator.getCompletionSummary(entryInfo) as any;
      const totalPercent = Number(completionSummary?.totalPercent ?? 0);
      setCompletionPercent(totalPercent);

      if (totalPercent === 100) {
        setCompletionStatus('ready');
      } else if (totalPercent >= 50) {
        setCompletionStatus('mostly_complete');
      } else {
        setCompletionStatus('needs_improvement');
      }

      const passportSummary = completionSummary?.categorySummary?.passport ?? {};
      const personalSummary = completionSummary?.categorySummary?.personalInfo ?? {};
      const fundsSummary = completionSummary?.categorySummary?.funds ?? {};
      const travelSummary = completionSummary?.categorySummary?.travel ?? {};

      const categoryData: CompletionCategory[] = [
        {
          id: 'passport',
          name: t('progressiveEntryFlow.categories.passport', { defaultValue: '护照信息' }),
          icon: '📘',
          status: String(passportSummary?.state ?? 'incomplete'),
          completedCount: Number(passportSummary?.completed ?? 0),
          totalCount: Number(passportSummary?.total ?? 5),
          missingFields: Array.isArray(completionSummary?.missingFields?.passport)
            ? completionSummary.missingFields.passport
            : [],
        },
        {
          id: 'personal',
          name: t('progressiveEntryFlow.categories.personal', { defaultValue: '个人信息' }),
          icon: '👤',
          status: String(personalSummary?.state ?? 'incomplete'),
          completedCount: Number(personalSummary?.completed ?? 0),
          totalCount: Number(personalSummary?.total ?? 4),
          missingFields: Array.isArray(completionSummary?.missingFields?.personalInfo)
            ? completionSummary.missingFields.personalInfo
            : [],
        },
        {
          id: 'funds',
          name: t('progressiveEntryFlow.categories.funds', { defaultValue: '资金证明' }),
          icon: '💰',
          status: String(fundsSummary?.state ?? 'incomplete'),
          completedCount: Number(fundsSummary?.validFunds ?? fundsSummary?.completed ?? 0),
          totalCount: 1,
          missingFields: Array.isArray(completionSummary?.missingFields?.funds)
            ? completionSummary.missingFields.funds
            : [],
        },
        {
          id: 'travel',
          name: t('progressiveEntryFlow.categories.travel', { defaultValue: '旅行信息' }),
          icon: '✈️',
          status: String(travelSummary?.state ?? 'incomplete'),
          completedCount: Number(travelSummary?.completed ?? 0),
          totalCount: Number(travelSummary?.total ?? 4),
          missingFields: Array.isArray(completionSummary?.missingFields?.travel)
            ? completionSummary.missingFields.travel
            : [],
        },
      ];

      setCategories(categoryData);

      void loadEntryInfoStatus(resolvedUserId).catch(error => {
        console.log('Entry info status check failed, continuing without it:', error);
      });
    } catch (error) {
      ErrorHandler.handleDataLoadError(error, 'ThailandEntryFlowScreen.loadData', {
        severity: ErrorSeverity.WARNING,
        customMessage: '加载入境准备信息时出现问题，请下拉刷新重试。',
        onRetry: () => {
          void loadData();
        },
      });

      setCompletionPercent(0);
      setCompletionStatus('needs_improvement');
      setCategories([
        {
          id: 'passport',
          name: t('progressiveEntryFlow.categories.passport', { defaultValue: '护照信息' }),
          icon: '📘',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 5,
          missingFields: ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'],
        },
        {
          id: 'personal',
          name: t('progressiveEntryFlow.categories.personal', { defaultValue: '个人信息' }),
          icon: '👤',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 4,
          missingFields: ['occupation', 'phoneNumber', 'email', 'gender'],
        },
        {
          id: 'funds',
          name: t('progressiveEntryFlow.categories.funds', { defaultValue: '资金证明' }),
          icon: '💰',
          status: 'incomplete',
          completedCount: 0,
          totalCount: 1,
          missingFields: ['fundItems'],
        },
        {
          id: 'travel',
          name: t('progressiveEntryFlow.categories.travel', { defaultValue: '旅行信息' }),
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
  }, [destinationId, loadEntryInfoStatus, passportParam, t]);

  const setupDataChangeListener = useCallback(() => {
    if (dataChangeUnsubscribeRef.current) {
      dataChangeUnsubscribeRef.current();
      dataChangeUnsubscribeRef.current = null;
    }

    dataChangeUnsubscribeRef.current = UserDataService.addDataChangeListener(
      (dataTypeOrEvent: unknown, maybeUserId?: string, changeDetails?: Record<string, any>) => {
        const event = (typeof dataTypeOrEvent === 'object' && dataTypeOrEvent !== null
          ? dataTypeOrEvent
          : {
              type: 'DATA_CHANGED',
              dataType: String(dataTypeOrEvent ?? 'unknown'),
              userId: maybeUserId ?? '',
              timestamp: new Date().toISOString(),
              ...(changeDetails ?? {}),
            }) as Record<string, unknown>;

        const eventType = typeof event.type === 'string' ? event.type : undefined;
        console.log('Data change event received in ThailandEntryFlowScreen:', event);

        if (eventType === 'RESUBMISSION_WARNING') {
          const warning = event as ResubmissionWarningEvent;
          const matchesEntry =
            !warning.entryInfoId ||
            warning.entryInfoId === params.entryPackId ||
            (userData?.entryInfoId ? warning.entryInfoId === userData.entryInfoId : false);
          if (matchesEntry) {
            setResubmissionWarning(warning);
          }
          return;
        }

        if (eventType === 'DATA_CHANGED' || eventType === 'TDAC_SUBMISSION_SUCCESS') {
          void loadData();
        }
      }
    );
  }, [loadData, params.entryPackId, userData?.entryInfoId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
      setupDataChangeListener();

      return () => {
        if (dataChangeUnsubscribeRef.current) {
          dataChangeUnsubscribeRef.current();
          dataChangeUnsubscribeRef.current = null;
        }
      };
    }, [loadData, setupDataChangeListener])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);


  /**
   * Handle resubmission warning actions (resubmit or ignore)
   *
   * When data changes are detected after TDAC submission, this handles:
   * - Marking entry pack as superseded
   * - Clearing warnings
   * - Navigating to edit screen for resubmission
   *
   * @param {Object} warning - Resubmission warning object
   * @param {string} warning.entryInfoId - ID of the entry info record
   * @param {Object} warning.diffResult - Details of data changes
   * @param {string} action - Action to take ('resubmit' or 'ignore')
   * @returns {Promise<void>}
   */
  const handleResubmissionWarning = async (warning: ResubmissionWarningEvent, action: 'resubmit' | 'ignore') => {
    try {
      if (action === 'resubmit') {
        if (!warning.entryInfoId) {
          return;
        }
        // Mark entry pack as superseded and navigate to edit
        await UserDataService.markEntryInfoAsSuperseded(warning.entryInfoId, {
          changedFields: warning.diffResult.changedFields,
          changeReason: 'user_confirmed_resubmission'
        });

        // Clear the warning
        setResubmissionWarning(null);
        setShowSupersededStatus(true);

        // Navigate to edit screen
        navigation.navigate('ThailandTravelInfo', {
          entryInfoId: warning.entryInfoId,
          destinationId,
          destination: destinationParam ?? undefined,
          passport: passportParam ?? undefined,
          resubmissionMode: true,
          showResubmissionHint: true,
          highlightMissingFields: true,
        });
      } else if (action === 'ignore') {
        if (!warning.entryInfoId) {
          return;
        }
        // Clear the warning but don't mark as superseded
        UserDataService.clearResubmissionWarning(warning.entryInfoId);
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
      entryInfoId: userData?.entryInfoId ?? undefined,
      destinationId,
      destination: destinationParam ?? undefined,
      passport: passportParam ?? undefined,
    });
  };

  const handlePreviewEntryCard = () => {
    console.log('🎯 Opening entry pack with TDAC data:', latestTdacData);

    // Navigate to EntryPackPreview to show the complete entry pack preview
    const previewParams = {
      userData: userData ? (userData as unknown as Record<string, unknown>) : undefined,
      passport: passportParam ?? undefined,
      destination: destinationParam ?? undefined,
      entryPackId: userData?.entryInfoId ?? undefined,
      entryPackData: {
        personalInfo: userData?.personalInfo ?? {},
        travelInfo: userData?.travel ?? {},
        funds: userData?.funds ?? [],
        tdacSubmission: latestTdacData ?? undefined,
      } as Record<string, unknown>,
    };

    navigation.navigate('EntryPackPreview', previewParams);
  };



  const handleCategoryPress = (category: CompletionCategory) => {
    // Navigate back to ThailandTravelInfoScreen with the specific section expanded
    navigation.navigate('ThailandTravelInfo', {
      entryInfoId: userData?.entryInfoId ?? undefined,
      destinationId,
      destination: destinationParam ?? undefined,
      passport: passportParam ?? undefined,
      expandSection: category.id,
    });
  };


  const handlePrimaryAction = async () => {
    const buttonState = getPrimaryButtonState();

    switch (buttonState.action) {
      case 'continue_improving':
        // Navigate back to ThailandTravelInfoScreen
        navigation.navigate('ThailandTravelInfo', {
          entryInfoId: userData?.entryInfoId ?? undefined,
          destinationId,
          destination: destinationParam ?? undefined,
          passport: passportParam ?? undefined,
        });
        break;
      case 'submit_tdac':
        // Navigate to TDAC submission screen with complete traveler info
        try {
          // Build complete traveler context from user data
          const resolvedUserId = activeUserId ?? passportParam?.userId ?? passportParam?.id ?? DEFAULT_USER_ID;
          const contextResult = await ThailandTravelerContextBuilder.buildThailandTravelerContext(resolvedUserId);
          
          if (contextResult.success && contextResult.payload) {
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
                        entryInfoId: userData?.entryInfoId ?? undefined,
                        destinationId,
                        destination: destinationParam ?? undefined,
                        passport: passportParam ?? undefined,
                      });
                    }
                  },
                  {
                    text: '继续提交',
                    style: 'default',
                    onPress: () => {
                      navigation.navigate('TDACHybrid', {
                        travelerInfo: contextResult.payload as TDACTravelerInfo,
                      });
                    }
                  }
                ]
              );
            } else {
              // No warnings, proceed directly to flash submission
              navigation.navigate('TDACHybrid', {
                travelerInfo: contextResult.payload as TDACTravelerInfo,
              });
            }
          } else {
            console.error('❌ Failed to build traveler context:', contextResult.errors);
            const errors = contextResult.errors?.length ? contextResult.errors : ['请检查并完善所有必填信息'];
            Alert.alert(
              '❌ TDAC提交要求严格',
              '泰国入境卡(TDAC)要求所有信息必须完整准确，不能使用默认值。\n\n必须完善的信息：\n\n• ' +
                errors.join('\n• ') +
                '\n\n请返回完善所有必需信息后再提交。',
              [
                {
                  text: '立即完善',
                  style: 'default',
                  onPress: () => {
                    navigation.navigate('ThailandTravelInfo', {
                      entryInfoId: userData?.entryInfoId ?? undefined,
                      destinationId,
                      destination: destinationParam ?? undefined,
                      passport: passportParam ?? undefined,
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
            onRetry: () => {
              void handlePrimaryAction();
            },
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
          entryInfoId: userData?.entryInfoId ?? undefined,
          destinationId,
          destination: destinationParam ?? undefined,
          passport: passportParam ?? undefined,
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

  /**
   * Get primary button state based on completion status and submission window
   *
   * Determines the appropriate button text, action, and enabled state based on:
   * - Entry pack superseded status
   * - Completion percentage
   * - Submission window availability
   * - Arrival date presence
   *
   * @returns {Object} Button configuration object
   * @returns {string} returns.title - Button text to display
   * @returns {string} returns.action - Action identifier (continue_improving, submit_tdac, etc.)
   * @returns {boolean} returns.disabled - Whether button should be disabled
   * @returns {string} returns.variant - Button variant (primary, secondary)
   * @returns {string} [returns.subtitle] - Optional subtitle text
   */
  const getPrimaryButtonState = (): PrimaryActionState => {
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
      try {
        const submissionWindow = ArrivalWindowCalculator.getSubmissionWindow(arrivalDate);
        canSubmitNow = Boolean(submissionWindow?.canSubmit);
      } catch {
        canSubmitNow = false;
      }
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

  const renderNoDataState = () => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataIcon}>📝</Text>
      <Text style={styles.noDataTitle}>
        准备开始泰国之旅吧！🌴
      </Text>
      <Text style={styles.noDataDescription}>
        你还没有填写泰国入境信息，别担心，我们会一步步帮你准备好所有需要的资料，让你轻松入境泰国！
      </Text>

      {/* Example/Tutorial hints */}
      <View style={styles.noDataHints}>
        <Text style={styles.noDataHintsTitle}>
          泰国入境需要准备这些信息 🌺
        </Text>
        <View style={styles.noDataHintsList}>
          <Text style={styles.noDataHint}>• 📘 护照信息 - 让泰国认识你</Text>
          <Text style={styles.noDataHint}>• 📞 联系方式 - 泰国怎么找到你</Text>
          <Text style={styles.noDataHint}>• 💰 资金证明 - 证明你能好好玩</Text>
          <Text style={styles.noDataHint}>• ✈️ 航班和住宿 - 你的旅行计划</Text>
        </View>
      </View>

      <Button
        title="开始我的泰国准备之旅！🇹🇭"
        onPress={handleEditInformation}
        variant="primary"
        style={styles.noDataButton}
      />
    </View>
  );

  const renderPreparedState = () => (
    <PreparedState
      completionPercent={completionPercent}
      completionStatus={completionStatus}
      arrivalDate={arrivalDate}
      t={t}
      passportParam={passportParam}
      destination={params.destination}
      userData={userData}
      handleEditInformation={handleEditInformation}
      handlePreviewEntryCard={handlePreviewEntryCard}
      navigation={navigation}
      onPrimaryAction={handlePrimaryAction}
      primaryActionState={primaryActionState}
      entryPackStatus={entryPackStatus}
      showSupersededStatus={showSupersededStatus}
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

      {hasNoEntryData ? renderNoDataState() : renderPreparedState()}
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

        {entryPackStatus === 'submitted' && !showSupersededStatus && (
          <View style={styles.preSubmissionHeader}>
            <Text style={styles.preSubmissionIcon}>🎉</Text>
            <Text style={styles.preSubmissionTitle}>
              100% 泰国准备就绪！🌴
            </Text>
            <Text style={styles.preSubmissionSubtitle}>
              入境卡已成功提交，可以查看您的入境信息
            </Text>
          </View>
        )}

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
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingBottom: spacing.lg,
  },

  preSubmissionHeader: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  preSubmissionIcon: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  preSubmissionTitle: {
    ...typography.h4,
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  preSubmissionSubtitle: {
    ...typography.body2,
    color: '#558B2F',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
  },
  // Status Section Styles
  statusSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },



  // Integrated Countdown & Submission Section Styles
  countdownSection: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Action Section Styles (now only for secondary actions)
  actionSection: {
    marginBottom: spacing.lg,
  },
  actionButtonsContainer: {
    gap: spacing.md,
  },
  primaryActionContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  secondaryActionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(7, 193, 96, 0.15)',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  secondaryActionIcon: {
    fontSize: 24,
  },
  secondaryActionContent: {
    flex: 1,
  },
  secondaryActionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  secondaryActionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  secondaryActionArrow: {
    ...typography.body2,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 18,
    marginLeft: spacing.sm,
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
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  noDataDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  noDataHints: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  noDataHintsTitle: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  noDataHintsList: {
    gap: spacing.xs,
  },
  noDataHint: {
    ...typography.body2,
    color: colors.primary,
    lineHeight: 18,
  },
  noDataButton: {
    minWidth: 200,
  },

  // Superseded Status Banner Styles
  supersededBanner: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 12,
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
    color: colors.error,
    marginBottom: spacing.xs,
  },
  supersededMessage: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Data Change Alert Styles
  dataChangeAlert: {
    marginBottom: spacing.md,
  },

  // Entry Guide Button Styles - Premium gradient button
  entryGuideButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: spacing.lg,
    ...shadows.button,
  },
  entryGuideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 18,
  },
  entryGuideIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  entryGuideContent: {
    flex: 1,
  },
  entryGuideTitle: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  entryGuideSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.90)',
    marginTop: 4,
    fontSize: 13,
  },
  entryGuideIcon: {
    fontSize: 26,
  },
  entryGuideChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  entryGuideArrow: {
    ...typography.body1,
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },

  // Quick Action Buttons - Compact action buttons with icons
  quickActionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.small,
  },
  quickActionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ThailandEntryFlowScreen;
