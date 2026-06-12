// 入境通 - Result Screen
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  TouchableWithoutFeedback,
  Clipboard,
  Animated,
} from 'react-native';
import type { DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { colors, typography, spacing, borderRadius, shadows, touchable } from '../theme';
import api from '../services/api';
import { getAvailableFeatures, getEntryInstructions } from '../config/destinationRequirements';
// Removed mockTDACData dependency - using pure user data
import { useTranslation } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';

const ResultScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const routeParams = route.params || {};
  const { generationId, fromHistory = false, userId, context } = routeParams;
  const initialAction = routeParams.initialAction || 'guide';

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<Record<string, any> | null>(null);
  const [shareSession, setShareSession] = useState<Record<string, any> | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [japanTravelerData, setJapanTravelerData] = useState<Record<string, any> | null>(null);

  // Animation values
  const pulseAnimation = useMemo(() => new Animated.Value(1), []);
  const fadeAnimation = useMemo(() => new Animated.Value(0), []);

  const currentPassport = resultData?.passport || routeParams.passport;
  const currentDestination = resultData?.destination || routeParams.destination;
  const currentTravelInfo = resultData?.travelInfo || routeParams.travelInfo;

  const passport = UserDataService.toSerializablePassport(currentPassport);
  const destination = currentDestination;
  const travelInfo = currentTravelInfo;
  const isThailand = destination?.id === 'th';
  const isMalaysia = destination?.id === 'my';
  const isSingapore = destination?.id === 'sg';
  const isTaiwan = destination?.id === 'tw';
  const isJapan = destination?.id === 'jp';
  const isJapanManualGuide = isJapan && context === 'manual_entry_guide';

  const initialActionHandledRef = useRef(false);

  // 获取目的地特定的功能配置
  const features = getAvailableFeatures(destination?.id);
  const entryInstructions = getEntryInstructions(destination?.id);
  const isHistoryItem = Boolean(fromHistory || resultData?.fromHistory);

  useEffect(() => {
    if (generationId) {
      loadGenerationResult();
    }
  }, [generationId]);

  // Load Japan traveler data when in manual entry guide context
  useEffect(() => {
    if (isJapanManualGuide && userId) {
      loadJapanTravelerData();
    }
  }, [isJapanManualGuide, userId]);

  // Animation setup
  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Pulse animation for the ring
    const pulseAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimationLoop.start();

    return () => {
      pulseAnimationLoop.stop();
    };
  }, [pulseAnimation, fadeAnimation]);

  const loadGenerationResult = async () => {
    try {
      const data = await api.getHistoryItem(generationId);
      setResultData(data);
      if (data.pdfUrl) {
        setPdfUri(data.pdfUrl);
      }
    } catch (error) {
      console.log('Failed to load history, using passed data:', (error as Error).message);
      // If API call fails (e.g., backend not running), use passed parameters
      // This allows the app to work even without backend
    }
  };

  const loadJapanTravelerData = async () => {
    try {
      console.log('Loading Japan traveler data for userId:', userId);
      const JapanTravelerContextBuilder = require('../services/japan/JapanTravelerContextBuilder').default;
      
      const result = await JapanTravelerContextBuilder.buildContext(userId);
      
      if (result.success) {
        console.log('Japan traveler data loaded successfully');
        setJapanTravelerData(result.payload);
      } else {
        console.log('Failed to load Japan traveler data:', result.errors);
        Alert.alert(
          t('common.error', { defaultValue: 'Error' }),
          t('japan.result.manualEntry.loading', { defaultValue: 'Failed to load some information, please check if your entry information is complete' })
        );
      }
    } catch (error) {
      console.error('Error loading Japan traveler data:', error);
      Alert.alert(
        t('common.error', { defaultValue: 'Error' }),
        t('japan.result.manualEntry.loading', { defaultValue: 'Unable to load Japan entry information' })
      );
    }
  };

  const handleEditInfo = () => {
    navigation.navigate('TravelInfo', {
      passport,
      destination,
      travelInfo,
      editing: true,
      generationId,
      fromHistory: true,
    });
  };

  const handleStartArrivalFlow = () => {
    navigation.navigate('ImmigrationGuide', {
      passport,
      destination,
      travelInfo,
      currentStep: 0,
    });
  };

  const canShareInline = features.showShare && !isHistoryItem;

  const japanManualCompletion = useMemo(() => {
    if (!isJapanManualGuide) {
      return {
        percent: 0,
        completed: 0,
        total: 0,
        loaded: false,
      };
    }

    const requiredFields = [
      'passportNo',
      'fullName',
      'nationality',
      'dateOfBirth',
      'occupation',
      'email',
      'arrivalDate',
      'arrivalFlightNumber',
      'accommodationAddress',
      'accommodationPhone',
      'lengthOfStay',
    ];

    if (!japanTravelerData) {
      return {
        percent: 0,
        completed: 0,
        total: requiredFields.length + 1, // +1 for funds evidence
        loaded: false,
      };
    }

    let completed = requiredFields.filter((field) => {
      const value = japanTravelerData[field];
      if (value === null || value === undefined) {
        return false;
      }
      if (typeof value === 'number') {
        return !Number.isNaN(value);
      }
      return String(value).trim().length > 0;
    }).length;

    const total = requiredFields.length + 1;
    if (Array.isArray(japanTravelerData.fundItems) && japanTravelerData.fundItems.length > 0) {
      completed += 1;
    }

    const percent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));

    return {
      percent,
      completed,
      total,
      loaded: true,
    };
  }, [isJapanManualGuide, japanTravelerData]);

  const handleJapanManualEdit = useCallback(() => {
    navigation.navigate('JapanTravelInfo', {
      passport,
      destination,
      travelInfo,
      userId: userId || passport?.id,
    });
  }, [navigation, passport, destination, travelInfo, userId]);

  const travelerName = useMemo(() => {
    if (!passport) {
      return t('result.notProvided', { defaultValue: '未填写' });
    }
    const {
      name,
      fullName,
      firstName,
      givenName,
      lastName,
      familyName,
    } = passport;
    const composed = [
      lastName || familyName,
      firstName || givenName,
    ].filter(Boolean).join(' ');
    return name || fullName || composed || t('result.notProvided', { defaultValue: '未填写' });
  }, [passport, t]);

  const passportNumber = useMemo(() => {
    if (!passport) {
      return '—';
    }
    return (
      passport.passportNo ||
      passport.passportNumber ||
      passport.no ||
      '—'
    );
  }, [passport]);

  const flightNumberDisplay = travelInfo?.flightNumber || travelInfo?.flightNo || t('result.pending', { defaultValue: '待确认' });
  const departureDateDisplay = travelInfo?.departureDate || t('result.pending', { defaultValue: '待确认' });
  const arrivalDateDisplay = travelInfo?.arrivalDate || t('result.pending', { defaultValue: '待确认' });
  const accommodationDisplay = useMemo(() => {
    const parts = [];
    const hotelName = travelInfo?.hotelName || travelInfo?.accommodationName;
    const hotelAddress = travelInfo?.hotelAddress;
    const contactPhone = travelInfo?.contactPhone;
    
    if (hotelName) {
parts.push(hotelName);
}
    if (hotelAddress) {
parts.push(hotelAddress);
}
    if (contactPhone) {
parts.push(contactPhone);
}
    
    return parts.join(' | ') || t('result.pending', { defaultValue: '待确认' });
  }, [travelInfo, t]);

  const entrySubtitle = useMemo(() => {
    const parts = [];
    if (destination?.name) {
      parts.push(destination.name);
    }
    if (departureDateDisplay !== '待确认') {
      parts.push(
        t('result.entryPack.subtitleParts.departure', {
          date: departureDateDisplay,
          defaultValue: `Departure ${departureDateDisplay}`,
        })
      );
    }
    if (arrivalDateDisplay !== '待确认') {
      parts.push(
        t('result.entryPack.subtitleParts.arrival', {
          date: arrivalDateDisplay,
          defaultValue: `Arrival ${arrivalDateDisplay}`,
        })
      );
    }
    if (flightNumberDisplay !== '待确认') {
      parts.push(
        t('result.entryPack.subtitleParts.flight', {
          flight: flightNumberDisplay,
          defaultValue: `Flight ${flightNumberDisplay}`,
        })
      );
    }
    return (
      parts.join(' · ') ||
      t('result.entryPack.subtitleParts.missing', { defaultValue: 'Please complete travel information' })
    );
  }, [destination?.name, departureDateDisplay, arrivalDateDisplay, flightNumberDisplay, t]);

  const generatedAtSource =
    resultData?.updatedAt ||
    resultData?.createdAt ||
    routeParams?.generatedAt;

  const formattedGeneratedAt = useMemo(() => {
    if (!generatedAtSource) {
      return new Date().toLocaleString();
    }
    const parsed = new Date(generatedAtSource);
    return Number.isNaN(parsed.getTime())
      ? generatedAtSource
      : parsed.toLocaleString();
  }, [generatedAtSource]);

  const entryPackItems = useMemo(
    () => [
      { label: t('result.entryPack.fields.departureDate'), value: departureDateDisplay },
      { label: t('result.entryPack.fields.flightNo'), value: flightNumberDisplay },
      { label: t('result.entryPack.fields.arrivalDate'), value: arrivalDateDisplay },
      { label: t('result.entryPack.fields.accommodation'), value: accommodationDisplay, fullWidth: true },
    ],
    [t, departureDateDisplay, flightNumberDisplay, arrivalDateDisplay, accommodationDisplay],
  );

  const generatePDF = async () => {
    if (pdfUri) {
return pdfUri;
}

    try {
      setLoading(true);
      
      // 导入翻译工具
      const { translateField, translateFormData, getDestinationLanguage } = require('../utils/translations');
      const destLang = getDestinationLanguage(destination?.id);
      
      // 翻译字段
      const fields = {
        fullName: translateField('fullName', destination?.id),
        passportNumber: translateField('passportNumber', destination?.id),
        flightNumber: translateField('flightNumber', destination?.id),
        arrivalDate: translateField('arrivalDate', destination?.id),
        hotelName: translateField('hotelName', destination?.id),
        hotelAddress: translateField('hotelAddress', destination?.id),
        contactPhone: translateField('contactPhone', destination?.id),
      };
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 30px;
                max-width: 800px;
                margin: 0 auto;
              }
              h1 { 
                color: #07C160;
                text-align: center;
                border-bottom: 2px solid #07C160;
                padding-bottom: 10px;
              }
              .language-note {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin: 10px 0 20px 0;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: left;
              }
              th { 
                background-color: #f2f2f2;
                font-weight: bold;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #999;
                font-size: 12px;
              }
              .qr-placeholder {
                width: 100px;
                height: 100px;
                border: 1px dashed #ccc;
                margin: 20px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #999;
              }
            </style>
          </head>
          <body>
            <h1>${destination?.name || ''} Entry Form / 入境登记表</h1>
            <div class="language-note">
              This form is in ${destLang === 'en' ? 'English' : destLang} / 本表格使用${destLang === 'en' ? '英文' : '目的地语言'}填写
            </div>
            <table>
              <tr>
                <th style="width: 40%">Field / 项目</th>
                <th>Information / 内容</th>
              </tr>
              <tr>
                <td>${fields.fullName}<br/><small style="color:#666">姓名</small></td>
                <td><strong>${passport?.name || ''}</strong></td>
              </tr>
              <tr>
                <td>${fields.passportNumber}<br/><small style="color:#666">护照号</small></td>
                <td><strong>${passport?.passportNo || ''}</strong></td>
              </tr>
              <tr>
                <td>${fields.flightNumber}<br/><small style="color:#666">航班号</small></td>
                <td><strong>${travelInfo?.flightNumber || ''}</strong></td>
              </tr>
              <tr>
                <td>${fields.arrivalDate}<br/><small style="color:#666">到达日期</small></td>
                <td><strong>${travelInfo?.arrivalDate || ''}</strong></td>
              </tr>
              <tr>
                <td>${fields.hotelName}<br/><small style="color:#666">酒店名称</small></td>
                <td><strong>${travelInfo?.hotelName || ''}</strong></td>
              </tr>
              <tr>
                <td>${fields.hotelAddress}<br/><small style="color:#666">酒店地址</small></td>
                <td><strong>${travelInfo?.hotelAddress || ''}</strong></td>
              </tr>
              <tr>
                <td>${fields.contactPhone}<br/><small style="color:#666">联系电话</small></td>
                <td><strong>${travelInfo?.contactPhone || ''}</strong></td>
              </tr>
            </table>
            <div class="footer">
              <p>Generated by 入境通 BorderBuddy</p>
              <p>生成时间 / Generated: ${new Date().toLocaleString('zh-CN')}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      setPdfUri(uri);
      setLoading(false);
      return uri;
    } catch (error) {
      setLoading(false);
      Alert.alert('错误', '无法生成PDF');
      return null;
    }
  };

  const handleDownload = async () => {
    const uri = await generatePDF();
    if (!uri) {
return;
}

    try {
      const downloadPath = `${FileSystem.documentDirectory}${destination?.name || 'entry'}_form_${Date.now()}.pdf`;
      const sourceFile = new FileSystem.File(uri);
      await sourceFile.copy(downloadPath);
      Alert.alert('成功', `PDF已保存到: ${downloadPath}`);
    } catch (error) {
      Alert.alert('错误', '下载失败');
    }
  };

  const generateShareSession = () => {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    const password = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return {
      link: `https://borderbuddy.app/share/${token}`,
      password,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  };

  const isShareSessionActive = shareSession
    ? new Date(shareSession.expiresAt).getTime() > Date.now()
    : false;

  const handleShare = () => {
    let session = shareSession;
    if (!session || !isShareSessionActive) {
      session = generateShareSession();
      setShareSession(session);
    }
    setShareModalVisible(true);
  };

  useEffect(() => {
    if (!initialActionHandledRef.current && isJapanManualGuide) {
      if (initialAction === 'share') {
        initialActionHandledRef.current = true;
        handleShare();
      }
    }
  }, [initialAction, isJapanManualGuide, handleShare]);

  const handleCancelShare = () => {
    Alert.alert(
      t('result.share.cancelTitle', { defaultValue: '取消分享' }),
      t('result.share.cancelMessage', { defaultValue: '该操作会立即失效共享链接和密码，亲友将无法继续访问。确定要取消吗？' }),
      [
        { text: t('result.share.keep', { defaultValue: '保留' }), style: 'cancel' },
        {
          text: t('result.share.confirmCancel', { defaultValue: '取消分享' }),
          style: 'destructive',
          onPress: () => {
            setShareSession(null);
            setShareModalVisible(false);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCopy = (value: string, field: string) => {
    Clipboard.setString(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = async () => {
    const uri = await generatePDF();
    if (!uri) {
return;
}

    try {
      await Print.printAsync({ uri });
    } catch (error) {
      Alert.alert('错误', '打印失败');
    }
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const handleNavigateToInteractiveGuide = () => {
    navigation.navigate('ImmigrationGuide', {
      passport,
      destination,
      travelInfo,
      japanTravelerData
    });
  };

  const renderJapanManualHero = () => {
    if (!isJapanManualGuide) {
      return null;
    }

    const { percent, loaded, completed, total } = japanManualCompletion;
    const statusVariant = !loaded
      ? 'loading'
      : percent === 100
        ? 'complete'
        : percent >= 80
          ? 'almost'
          : 'incomplete';

    const themeMap = {
      complete: {
        color: '#0BD67B',
        background: 'rgba(11, 214, 123, 0.12)',
        border: 'rgba(11, 214, 123, 0.25)',
        statusText: '日本入境准备就绪！🌸',
        subtitle: '所有资料整理完成，随时可以在机场出示。',
      },
      almost: {
        color: '#FF9500',
        background: 'rgba(255, 149, 0, 0.12)',
        border: 'rgba(255, 149, 0, 0.2)',
        statusText: '再检查一下信息～',
        subtitle: '还有少量信息待确认，完成后更安心出行。',
      },
      incomplete: {
        color: colors.primary,
        background: 'rgba(10, 132, 255, 0.12)',
        border: 'rgba(10, 132, 255, 0.2)',
        statusText: '继续完善资料吧！',
        subtitle: '完成所有资料即可生成完整的日本入境包。',
      },
      loading: {
        color: colors.textSecondary,
        background: 'rgba(0, 0, 0, 0.04)',
        border: 'rgba(0, 0, 0, 0.08)',
        statusText: '正在加载您的资料…',
        subtitle: '请稍候，我们正在整理旅客信息。',
      },
    };

    const theme = themeMap[statusVariant];
    const progressWidth: DimensionValue = loaded ? `${percent}%` : '0%';

    return (
      <View style={styles.japanHeroContainer}>
        <View style={styles.japanHeroHeader}>
          <Text style={styles.japanHeroTitle}>
            {t('japan.result.manualEntry.heroTitle', { defaultValue: '我的日本之旅准备好了吗？🌸' })}
          </Text>
          <Text style={styles.japanHeroIntro}>
            {t('japan.result.manualEntry.heroSubtitle', {
              defaultValue: '看看你准备得怎么样，一起迎接日本冒险！',
            })}
          </Text>
        </View>

        <View
          style={[
            styles.japanHeroCard,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
        >
          <View style={styles.japanHeroProgressSection}>
            <Text style={[styles.japanHeroPercent, { color: theme.color }]}>
              {loaded ? `${percent}%` : '--'}
            </Text>
            <Text style={styles.japanHeroPercentLabel}>
              {t('japan.result.manualEntry.progressLabel', { defaultValue: '准备进度' })}
            </Text>
            <View style={styles.japanHeroProgressBar}>
              <View
                style={[
                  styles.japanHeroProgressFill,
                  { width: progressWidth, backgroundColor: theme.color },
                ]}
              />
            </View>
            <Text style={[styles.japanHeroStatus, { color: theme.color }]}>
              {statusVariant === 'complete' 
                ? t('japan.result.manualEntry.statusText.complete', { defaultValue: theme.statusText })
                : statusVariant === 'almost'
                ? t('japan.result.manualEntry.statusText.almost', { defaultValue: theme.statusText })
                : statusVariant === 'incomplete'
                ? t('japan.result.manualEntry.statusText.incomplete', { defaultValue: theme.statusText })
                : t('japan.result.manualEntry.statusText.loading', { defaultValue: theme.statusText })}
            </Text>
            <Text style={styles.japanHeroSubtitle}>
              {statusVariant === 'complete'
                ? t('japan.result.manualEntry.statusSubtitle.complete', { defaultValue: theme.subtitle })
                : statusVariant === 'almost'
                ? t('japan.result.manualEntry.statusSubtitle.almost', { defaultValue: theme.subtitle })
                : statusVariant === 'incomplete'
                ? t('japan.result.manualEntry.statusSubtitle.incomplete', { defaultValue: theme.subtitle })
                : t('japan.result.manualEntry.statusSubtitle.loading', { defaultValue: theme.subtitle })}
            </Text>
            {loaded && total > 0 && (
              <Text style={styles.japanHeroMeta}>
                {t('japan.result.manualEntry.itemsCompleted', {
                  completed,
                  total,
                  defaultValue: `已完成 ${completed}/${total} 项资料`,
                })}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.japanHeroActions}>
          <View
            style={[
              styles.japanHeroActionWrapper,
              !features.showShare && styles.japanHeroActionWrapperLast,
            ]}
          >
            <TouchableOpacity
              style={[styles.japanHeroActionButton, styles.japanHeroActionPrimary]}
              onPress={handleJapanManualEdit}
              activeOpacity={0.85}
            >
              <Text style={styles.japanHeroActionIcon}>✏️</Text>
              <Text style={styles.japanHeroActionLabel}>
                {t('japan.result.manualEntry.editButton', { defaultValue: '再改改' })}
              </Text>
            </TouchableOpacity>
          </View>
          {features.showShare && (
            <View style={[styles.japanHeroActionWrapper, styles.japanHeroActionWrapperLast]}>
              <TouchableOpacity
                style={[styles.japanHeroActionButton, styles.japanHeroActionSecondary]}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <Text style={[styles.japanHeroActionIcon, styles.japanHeroActionSecondaryIcon]}>👥</Text>
                <Text style={[styles.japanHeroActionLabel, styles.japanHeroActionSecondaryLabel]}>
                  {t('japan.result.manualEntry.shareButton', { defaultValue: '找亲友帮忙修改' })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderJapanManualGuide = () => {
    if (!isJapanManualGuide) {
      return null;
    }

    if (!japanTravelerData) {
      return (
        <View style={styles.japanManualLoadingCard}>
          <Text style={styles.japanManualLoadingText}>
            {t('japan.result.manualEntry.loading', { defaultValue: '正在加载日本入境资料…' })}
          </Text>
        </View>
      );
    }

    const data = japanTravelerData;
    const travelPurposeDisplay =
      data.travelPurpose === 'Other' && data.customTravelPurpose
        ? data.customTravelPurpose
        : data.travelPurpose;

    const fundTypeLabels = {
      cash: '现金 Cash',
      credit_card: '信用卡 Credit Card',
      bank_balance: '银行存款 Bank Balance',
      investment: '投资证明 Investment',
      other: '其他证明 Other',
    };

    const getFundIcon = (type: string) => {
      switch (type) {
        case 'cash':
          return '💵';
        case 'credit_card':
          return '💳';
        case 'bank_balance':
          return '🏦';
        case 'investment':
          return '📈';
        default:
          return '📂';
      }
    };

    const renderSection = (title: string, icon: string, rows: Array<Record<string, unknown>>) => (
      <View key={title} style={styles.japanManualSectionCard}>
        <View style={styles.japanManualSectionHeader}>
          <Text style={styles.japanManualSectionIcon}>{icon}</Text>
          <Text style={styles.japanManualSectionTitle}>{title}</Text>
        </View>
        <View style={styles.japanManualSectionBody}>
          {rows.map((row: Record<string, unknown>, index: number) => {
            if (!row) {
return null;
}
            const isLastRow = index === rows.length - 1;
            const value = row.value ?? '—';
            const isMultiline =
              row.multiline || (typeof value === 'string' && value.length > 22);

            return (
              <View
                key={`${title}-${row.label}-${index}`}
                style={[
                  styles.japanManualRow,
                  row.fullWidth && styles.japanManualRowFull,
                  isLastRow && styles.japanManualRowLast,
                ]}
              >
                <Text style={styles.japanManualLabel}>{row.label}</Text>
                <Text
                  style={[
                    styles.japanManualValue,
                    (row.fullWidth || isMultiline) && styles.japanManualValueMultiline,
                  ]}
                >
                  {value}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );

    const phoneDisplay =
      data.phoneCode || data.phoneNumber
        ? `${data.phoneCode ? `+${data.phoneCode} ` : ''}${data.phoneNumber || ''}`.trim()
        : '—';

    return (
      <View style={styles.japanManualContainer}>
        <View style={styles.japanManualIntroCard}>
          <Text style={styles.japanManualIntroTitle}>{t('japan.result.manualEntry.title', { defaultValue: '日本入境卡填写指南' })}</Text>
          <Text style={styles.japanManualIntroSubtitle}>
            {t('japan.result.manualEntry.intro', {
              defaultValue: '请按照下列信息填写纸质入境卡与海关申报表，可离线查看，建议截图保存。',
            })}
          </Text>
          <View style={styles.japanManualBadgesRow}>
            <Text style={styles.japanManualBadge}>{t('japan.result.manualEntry.badges.handwritten', { defaultValue: '✍️ 手写纸质入境卡' })}</Text>
            <Text style={styles.japanManualBadge}>{t('japan.result.manualEntry.badges.backedUp', { defaultValue: '📦 信息已备份到入境包' })}</Text>
            <Text style={styles.japanManualBadge}>{t('japan.result.manualEntry.badges.offline', { defaultValue: '📵 离线可用' })}</Text>
          </View>
        </View>

        {renderSection(t('japan.result.manualEntry.sections.passport', { defaultValue: '护照信息 Passport' }), '🛂', [
          { label: t('japan.result.manualEntry.fields.fullName', { defaultValue: '姓名 Full Name' }), value: data.fullName },
          { label: t('japan.result.manualEntry.fields.passportNo', { defaultValue: '护照号 Passport No.' }), value: data.passportNo },
          { label: t('japan.result.manualEntry.fields.nationality', { defaultValue: '国籍 Nationality' }), value: data.nationality },
          { label: t('japan.result.manualEntry.fields.dateOfBirth', { defaultValue: '出生日期 Date of Birth' }), value: data.dateOfBirth },
          data.gender ? { label: t('japan.result.manualEntry.fields.gender', { defaultValue: '性别 Gender' }), value: data.gender } : null,
          data.expiryDate ? { label: t('japan.result.manualEntry.fields.passportExpiry', { defaultValue: '护照有效期 Passport Expiry' }), value: data.expiryDate } : null,
        ].filter(Boolean))}

        {renderSection(t('japan.result.manualEntry.sections.personal', { defaultValue: '个人信息 Personal' }), '🙋‍♀️', [
          { label: t('japan.result.manualEntry.fields.occupation', { defaultValue: '职业 Occupation' }), value: data.occupation },
          { label: t('japan.result.manualEntry.fields.cityOfResidence', { defaultValue: '居住城市 City of Residence' }), value: data.cityOfResidence },
          { label: t('japan.result.manualEntry.fields.countryOfResidence', { defaultValue: '居住国家 Country of Residence' }), value: data.residentCountry },
          { label: t('japan.result.manualEntry.fields.phone', { defaultValue: '联系电话 Phone' }), value: phoneDisplay },
          { label: t('japan.result.manualEntry.fields.email', { defaultValue: '电子邮箱 Email' }), value: data.email },
        ])}

        {renderSection(t('japan.result.manualEntry.sections.travel', { defaultValue: '旅行信息 Travel Details' }), '🛫', [
          { label: t('japan.result.manualEntry.fields.purposeOfVisit', { defaultValue: '旅行目的 Purpose of Visit' }), value: travelPurposeDisplay },
          { label: t('japan.result.manualEntry.fields.flightNumber', { defaultValue: '航班号 Flight Number' }), value: data.arrivalFlightNumber },
          { label: t('japan.result.manualEntry.fields.arrivalDate', { defaultValue: '到达日期 Arrival Date' }), value: data.arrivalDate },
          {
            label: t('japan.result.manualEntry.fields.lengthOfStay', { defaultValue: '停留天数 Length of Stay' }),
            value: data.lengthOfStay ? `${data.lengthOfStay} ${t('japan.result.manualEntry.fields.days', { defaultValue: '天' })}` : '—',
          },
        ])}

        {renderSection(t('japan.result.manualEntry.sections.accommodation', { defaultValue: '住宿与联系 Accommodation' }), '🏨', [
          {
            label: t('japan.result.manualEntry.fields.address', { defaultValue: '住宿地址 Address' }),
            value: data.accommodationAddress,
            fullWidth: true,
            multiline: true,
          },
          { label: t('japan.result.manualEntry.fields.accommodationPhone', { defaultValue: '住宿电话 Phone' }), value: data.accommodationPhone },
        ])}

        <View style={styles.japanManualSectionCard}>
          <View style={styles.japanManualSectionHeader}>
            <Text style={styles.japanManualSectionIcon}>💰</Text>
            <Text style={styles.japanManualSectionTitle}>{t('japan.result.manualEntry.funds', { defaultValue: '资金证明 Funds & Assets' })}</Text>
          </View>
          <View style={styles.japanManualSectionBody}>
            {Array.isArray(data.fundItems) && data.fundItems.length > 0 ? (
              <View style={styles.japanManualFundsList}>
                {data.fundItems.map((item, index) => {
                  const label = fundTypeLabels[item.type] || '资金证明';
                  const isLast = index === data.fundItems.length - 1;

                  return (
                    <View
                      key={`${item.id || index}`}
                      style={[
                        styles.japanManualFundItem,
                        isLast && styles.japanManualFundItemLast,
                      ]}
                    >
                      <Text style={styles.japanManualFundIcon}>{getFundIcon(item.type)}</Text>
                      <View style={styles.japanManualFundTextContainer}>
                        <Text style={styles.japanManualFundTitle}>
                          {item.details || label}
                        </Text>
                        {(item.amount || item.currency) && (
                          <Text style={styles.japanManualFundSubtitle}>
                            {[item.currency, item.amount].filter(Boolean).join(' ')}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
                {data.totalFunds && Object.keys(data.totalFunds).length > 0 && (
                  <Text style={styles.japanManualTotalFunds}>
                    {Object.entries(data.totalFunds)
                      .map(([currency, amount]) => `${currency} ${amount}`)
                      .join(' · ')}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.japanManualEmptyText}>
                {t('japan.result.manualEntry.noFunds', {
                  defaultValue:
                    '尚未添加资金证明，建议准备至少一项（现金、银行卡或其他资产）。',
                })}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.japanInteractiveGuideButton}
          onPress={handleNavigateToInteractiveGuide}
          activeOpacity={0.85}
        >
          <View style={styles.japanInteractiveGuideContent}>
            <Text style={styles.japanInteractiveGuideIcon}>🛬</Text>
            <View style={styles.japanInteractiveGuideTextContainer}>
              <Text style={styles.japanInteractiveGuideTitle}>
                {t('japan.result.manualEntry.interactiveGuideTitle', { defaultValue: '查看互动入境指南' })}
              </Text>
              <Text style={styles.japanInteractiveGuideSubtitle}>
                {t('japan.result.manualEntry.interactiveGuideSubtitle', { defaultValue: '分步骤指导 · 大字体模式' })}
              </Text>
            </View>
            <Text style={styles.japanInteractiveGuideArrow}>›</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.japanHelpBox}>
          <Text style={styles.japanHelpIcon}>💡</Text>
          <Text style={styles.japanHelpText}>
            {t('japan.result.manualEntry.helpTip', {
              defaultValue:
                '请在飞机上或到达机场后，参考以上信息填写纸质入境卡。建议截图保存以便随时查看。',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isJapanManualGuide ? (
          <>
            {renderJapanManualHero()}
            {renderJapanManualGuide()}
          </>
        ) : (
          <>
            {/* Success Header - Enhanced Design */}
        <Animated.View style={[styles.successCard, { opacity: fadeAnimation }]}>
          <View style={styles.successGradient}>
            <View style={styles.successIconContainer}>
              <View style={styles.successIconBackground}>
                <Text style={styles.successIcon}>✅</Text>
              </View>
              <Animated.View
                style={[
                  styles.successPulseRing,
                  {
                    transform: [{ scale: pulseAnimation }],
                  },
                ]}
              />
            </View>

            <View style={styles.successContent}>
              <View style={styles.successTitleRow}>
                <Text style={styles.successFlag}>{destination?.flag || '🇨🇳'}</Text>
                <Text style={styles.successTitle}>
                  {t('result.title', { flag: '', country: destination?.name || '' })}
                </Text>
              </View>

              <Text style={styles.successSubtitle}>{t('result.subtitle')}</Text>

              <View style={styles.successDecorativeElements}>
                <View style={styles.successDecorativeLine} />
                <View style={styles.successDecorativeDots}>
                  <View style={styles.successDot} />
                  <View style={styles.successDot} />
                  <View style={styles.successDot} />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
        {isHistoryItem && (
          <TouchableOpacity
            style={styles.historyPrimaryCta}
            onPress={handleStartArrivalFlow}
            activeOpacity={0.85}
          >
            <View style={styles.historyPrimaryContent}>
              <Text style={styles.historyPrimaryIcon}>🛬</Text>
              <View>
                <Text style={styles.historyPrimaryTitle}>{t('result.historyBanner.primaryCta.title')}</Text>
                <Text style={styles.historyPrimarySubtitle}>{t('result.historyBanner.primaryCta.subtitle')}</Text>
              </View>
            </View>
            <Text style={styles.historyPrimaryArrow}>›</Text>
          </TouchableOpacity>
        )}

        {features.digitalInfo && (
          <View style={styles.digitalInfoCard}>
            <View style={styles.digitalInfoHeader}>
              <Text style={styles.digitalInfoIcon}>📱</Text>
              {(isThailand || isMalaysia || isSingapore || isTaiwan) && (
                <Text style={styles.digitalInfoStepBadge}>
                  {isThailand
                    ? '第一件事'
                    : isMalaysia
                      ? t('malaysia.result.digitalBadge')
                      : isSingapore
                        ? t('singapore.result.digitalBadge')
                        : t('taiwan.result.digitalBadge')}
                </Text>
              )}
            </View>
            <View style={styles.digitalInfoContent}>
              <Text style={styles.digitalInfoTitle}>
                {isThailand
                  ? '自动申请泰国电子入境卡（TDAC）'
                  : isMalaysia
                    ? t('malaysia.result.digitalTitle')
                    : isSingapore
                      ? t('singapore.result.digitalTitle')
                      : isTaiwan
                        ? t('taiwan.result.digitalTitle')
                        : t('result.digitalInfo.title', { systemName: features.digitalInfo.systemName })}
              </Text>
              {isThailand && (
                <Text style={styles.digitalInfoHighlight}>
                  应用会根据护照与行程信息自动提交电子入境卡，二维码会同步保存到本入境包。
                </Text>
              )}
              {isMalaysia && (
                <Text style={styles.digitalInfoHighlight}>
                  {t('malaysia.result.digitalHighlight')}
                </Text>
              )}
              {isSingapore && (
                <Text style={styles.digitalInfoHighlight}>
                  {t('singapore.result.digitalHighlight')}
                </Text>
              )}
              {isTaiwan && (
                <Text style={styles.digitalInfoHighlight}>
                  {t('taiwan.result.digitalHighlight')}
                </Text>
              )}
              {features.digitalInfo.notes.map((note, index) => (
                <Text key={index} style={styles.digitalInfoNote}>• {note}</Text>
              ))}
              {features.digitalInfo.url && (
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={async () => {
                    // 泰国显示选择界面，其他国家打开网址
                    if (isThailand) {
                      // 映射字段供两个版本使用
                      const accommodationType = travelInfo?.accommodationType || 'HOTEL';
                      const isHotelType = accommodationType === 'HOTEL';

                      const tdacTravelInfo = {
                        // Personal Information In Passport
                        familyName: passport?.familyName || passport?.lastName || '',
                        firstName: passport?.firstName || passport?.givenName || '',
                        middleName: passport?.middleName || '',
                        passportNo: passport?.passportNo || passport?.passportNumber || '',
                        nationality: passport?.nationality || 'CHN',

                        // Personal Information
                        birthDate: passport?.birthDate || passport?.dateOfBirth || '',
                        occupation: passport?.occupation || 'ENGINEER',
                        gender: passport?.gender || passport?.sex || 'MALE',
                        countryResidence: passport?.countryResidence || passport?.nationality || 'CHN',
                        cityResidence: passport?.cityResidence || 'BEIJING',
                        phoneCode: passport?.phoneCode || '86',
                        phoneNo: passport?.phoneNo || passport?.phone || '',
                        visaNo: passport?.visaNo || '',

                        // Contact
                        email: passport?.email || '',

                        // Trip Information
                        arrivalDate: travelInfo?.arrivalDate || '',
                        departureDate: travelInfo?.departureDate || null,
                        countryBoarded: travelInfo?.countryBoarded || passport?.nationality || 'CHN',
                        purpose: travelInfo?.travelPurpose || 'HOLIDAY', // Must be English: HOLIDAY, BUSINESS, etc.
                        travelMode: travelInfo?.travelMode || 'AIR',
                        flightNo: travelInfo?.flightNumber || travelInfo?.flightNo || '',
                        tranModeId: '',

                        // Accommodation
                        accommodationType,
                        province: travelInfo?.province || '',
                        // Only include district, subDistrict, and postCode for non-hotel accommodations
                        ...(isHotelType ? {} : {
                          district: travelInfo?.district || '',
                          subDistrict: travelInfo?.subDistrict || '',
                          postCode: travelInfo?.postCode || '',
                        }),
                        address: travelInfo?.hotelAddress || travelInfo?.hotelName || '',

                        // Token
                        cloudflareToken: 'auto',
                      };
                      
                      // 直接跳转到混合模式 - 使用纯用户数据
                      const travelerInfoWithFallbacks = tdacTravelInfo;
                      
                      navigation.navigate('TDACHybrid', { 
                        travelerInfo: travelerInfoWithFallbacks
                      });
                    } else if (isMalaysia) {
                      navigation.navigate('MDACSelection', {
                        passport,
                        destination,
                        travelInfo,
                      });
                    } else if (isSingapore) {
                      navigation.navigate('SGArrivalSelection', {
                        passport,
                        destination,
                        travelInfo,
                      });
                    } else if (isTaiwan) {
                      navigation.navigate('TWArrivalSelection', {
                        passport,
                        destination,
                        travelInfo,
                      });
                    } else {
                      Linking.openURL(features.digitalInfo.url);
                    }
                  }}
                  style={styles.digitalInfoButton}
                >
                  <View style={styles.digitalInfoButtonContent}>
                    <Text style={styles.digitalInfoButtonIcon}>
                      {isThailand || isMalaysia || isSingapore || isTaiwan ? '⚡' : '↗'}
                    </Text>
                    <Text style={styles.digitalInfoButtonLabel}>
                      {isThailand
                        ? '申请泰国电子入境卡'
                        : isMalaysia
                          ? t('malaysia.result.digitalButton')
                          : isSingapore
                            ? t('singapore.result.digitalButton')
                            : isTaiwan
                              ? t('taiwan.result.digitalButton')
                              : `${t('result.digitalInfo.button')} ›`}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.entryPackCard}>
          <View style={styles.entryPackHeader}>
            <Text style={styles.entryPackIcon}>🧳</Text>
            <View style={styles.entryPackHeaderText}>
              <Text style={styles.entryPackTitle}>{t('result.entryPack.title')}</Text>
              <Text style={styles.entryPackSubtitle}>{entrySubtitle}</Text>
            </View>
            {canShareInline && (
              <View style={styles.shareButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.entryPackShareButton,
                    isShareSessionActive && styles.entryPackShareButtonActive,
                  ]}
                  onPress={handleShare}
                  activeOpacity={0.85}
                >
                  <Text style={styles.entryPackShareText}>
                    {isShareSessionActive 
                      ? t('result.share.active', { defaultValue: '已邀请' })
                      : t('result.share.invite', { defaultValue: '亲友核实' })}
                  </Text>
                </TouchableOpacity>
                  {isShareSessionActive && shareSession && (
                  <Text style={styles.shareStatusText}>
                    {t('result.share.expiryText', { 
                      time: new Date(shareSession.expiresAt).toLocaleString(),
                      defaultValue: `有效至 ${new Date(shareSession.expiresAt).toLocaleString()}`
                    })}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.entryPackInfoGrid}>
            {entryPackItems.map((item, index) => {
              const isLast = index === entryPackItems.length - 1;
              return (
                <View
                  key={`${item.label}-${index}`}
                  style={[
                    styles.entryPackInfoItem,
                    item.fullWidth && styles.entryPackInfoItemFull,
                    isLast && styles.entryPackInfoItemLast,
                  ]}
                >
                  <Text style={styles.entryPackInfoLabel}>{item.label}</Text>
                  <Text
                    style={styles.entryPackInfoValue}
                    numberOfLines={item.fullWidth ? 3 : 1}
                  >
                    {item.value}
                  </Text>
                </View>
              );
            })}
          </View>

          {!isHistoryItem && (
            <View style={styles.entryPackActions}>
              <TouchableOpacity
                onPress={handleStartArrivalFlow}
                style={styles.entryPackPrimaryButton}
                activeOpacity={0.85}
              >
                <View style={styles.entryPackPrimaryContent}>
                  <View style={styles.entryPackPrimaryIconWrapper}>
                    <Text style={styles.entryPackPrimaryIcon}>🛬</Text>
                  </View>
                  <View style={styles.entryPackPrimaryTextContainer}>
                    <Text style={styles.entryPackPrimaryTitle}>
                      {t('result.entryPack.actions.startGuide', { defaultValue: 'Start Arrival Guide' })}
                    </Text>
                    <Text style={styles.entryPackPrimarySubtitle}>
                      {t('result.historyBanner.primaryCta.subtitle', { defaultValue: 'Step-by-step · Large text available' })}
                    </Text>
                  </View>
                  <View style={styles.entryPackPrimaryArrowWrapper}>
                    <Text style={styles.entryPackPrimaryArrow}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditInfo}
                style={styles.entryPackSecondaryButton}
                activeOpacity={0.7}
              >
                  <Text style={styles.entryPackSecondaryText}>
                    {t('result.changeInfo', { defaultValue: '更改资料' })}
                  </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.entryPackTimestamp}>{t('result.entryPack.lastUpdated', { time: formattedGeneratedAt })}</Text>
        </View>

        {isHistoryItem && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.6}
            >
              <Text style={styles.actionButtonIcon}>↗</Text>
              <Text style={styles.actionButtonText}>
                {isShareSessionActive 
                  ? t('result.share.viewShare', { defaultValue: '查看分享信息' })
                  : t('result.share.invite', { defaultValue: '亲友核实' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditInfo}
              activeOpacity={0.6}
            >
              <Text style={styles.actionButtonIcon}>✎</Text>
              <Text style={styles.actionButtonText}>{t('result.historyBanner.secondaryCta.editInfo')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons - Dynamic based on destination */}
        <View style={styles.buttonsContainer}>
          {/* 自助通关机指南 - 仅当有自助机时显示 */}
          {features.showKioskGuide && (
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => navigation.navigate('PIKGuide', { passport, destination, travelInfo })}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>🤖</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>
                  {t('result.kioskGuide.title', { 
                    kioskName: entryInstructions?.kioskName || t('result.kioskGuide.kioskName', { defaultValue: '自助通关机' }),
                    defaultValue: `${entryInstructions?.kioskName || '自助通关机'}指南`
                  })}
                </Text>
                <Text style={styles.actionSubtitle}>
                  {t('result.kioskGuide.subtitle', { defaultValue: '手把手教您操作' })}
                </Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}

        </View>
          </>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            {t('common.privacy.localStorage')}
          </Text>
        </View>

        {/* Additional Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            {t('common.privacy.localStorage')}
          </Text>
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShareModalVisible(false)}>
          <View style={styles.shareModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.shareModalSheet}>
                <View style={styles.shareModalHandle} />
                <Text style={styles.shareModalTitle}>
                  {t('result.share.modalTitle', { defaultValue: '请亲友协助核对资料' })}
                </Text>
                <Text style={styles.shareModalSubtitle}>
                  {t('result.share.modalSubtitle', { defaultValue: '分享下方链接与密码给信任的亲友，链接有效期24小时。亲友可补充或修改入境所需信息，更新后会同步到本入境包。' })}
                </Text>

                <View style={styles.shareInfoBlock}>
                  <Text style={styles.shareInfoLabel}>
                    {t('result.share.linkLabel', { defaultValue: '分享链接' })}
                  </Text>
                  <View style={styles.shareInfoRow}>
                    <Text style={styles.shareInfoValue} numberOfLines={1}>
                      {shareSession?.link}
                    </Text>
                    <TouchableOpacity
                      style={styles.shareCopyButton}
                      onPress={() => handleCopy(shareSession?.link || '', 'link')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.shareCopyText}>
                        {t('result.share.copy', { defaultValue: '复制' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {copiedField === 'link' && (
                    <Text style={styles.shareCopiedTag}>
                      {t('result.share.copied', { defaultValue: '已复制' })}
                    </Text>
                  )}
                </View>

                <View style={styles.shareInfoBlock}>
                  <Text style={styles.shareInfoLabel}>
                    {t('result.share.passwordLabel', { defaultValue: '访问密码' })}
                  </Text>
                  <View style={styles.shareInfoRow}>
                    <Text style={styles.sharePasswordValue}>{shareSession?.password}</Text>
                    <TouchableOpacity
                      style={styles.shareCopyButton}
                      onPress={() => handleCopy(shareSession?.password || '', 'password')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.shareCopyText}>
                        {t('result.share.copy', { defaultValue: '复制' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {copiedField === 'password' && (
                    <Text style={styles.shareCopiedTag}>
                      {t('result.share.copied', { defaultValue: '已复制' })}
                    </Text>
                  )}
                </View>

                <Text style={styles.shareExpiryText}>
                  {t('result.share.expiryText', {
                    time: shareSession ? new Date(shareSession.expiresAt).toLocaleString() : '--',
                    defaultValue: `有效期至：${shareSession ? new Date(shareSession.expiresAt).toLocaleString() : '--'}`
                  })}
                </Text>

                <View style={styles.shareActionsRow}>
                  <TouchableOpacity
                    style={styles.sharePrimaryAction}
                    onPress={() => setShareModalVisible(false)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.sharePrimaryText}>
                      {t('result.share.primaryAction', { defaultValue: '完成，去粘贴给亲友' })}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareCancelAction}
                    onPress={handleCancelShare}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.shareCancelText}>
                      {t('result.share.cancelAction', { defaultValue: '取消此次分享' })}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.shareSecurityNote}>
                  {t('result.share.securityNote', { defaultValue: '安全提示：请仅分享给可信赖的家人或朋友，您可随时取消分享以立即终止访问。' })}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  // Enhanced Success Header Styles
  successCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  successGradient: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#07C160',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  successIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  successIcon: {
    fontSize: 36,
    color: colors.white,
  },
  successPulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -10,
    left: -10,
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
  },
  successTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  successFlag: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1.5,
  },
  successDecorativeElements: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  successDecorativeLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.sm,
  },
  successDecorativeDots: {
    flexDirection: 'row',
    gap: 6,
  },
  successDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  entryPackCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  entryPackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  entryPackIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  entryPackHeaderText: {
    flex: 1,
  },
  entryPackTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  entryPackSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shareButtonContainer: {
    alignItems: 'flex-end',
  },
  entryPackShareButton: {
    backgroundColor: '#007AFF',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  entryPackShareText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  entryPackShareButtonActive: {
    backgroundColor: '#0056D2',
    shadowColor: '#0056D2',
  },
  shareStatusText: {
    marginTop: spacing.xs,
    fontSize: 11,
    color: colors.textSecondary,
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  shareModalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  shareModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  shareModalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  shareInfoBlock: {
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  shareInfoLabel: {
    fontSize: 13,
    color: '#0A84FF',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  shareInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareInfoValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: spacing.sm,
  },
  sharePasswordValue: {
    flex: 1,
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
    letterSpacing: 2,
  },
  shareCopyButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  shareCopyText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  shareCopiedTag: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: '#34C759',
  },
  shareExpiryText: {
    marginTop: spacing.lg,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  shareActionsRow: {
    marginTop: spacing.lg,
  },
  sharePrimaryAction: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sharePrimaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  shareCancelAction: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  shareCancelText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  shareSecurityNote: {
    marginTop: spacing.lg,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  entryPackInfoGrid: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  entryPackInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  entryPackInfoItemRight: {},
  entryPackInfoItemFull: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  entryPackInfoItemLast: {
    borderBottomWidth: 0,
  },
  entryPackInfoLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  entryPackInfoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'right',
    flex: 2,
  },
  entryPackActions: {
    marginTop: spacing.lg,
  },
  entryPackPrimaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touchable.minHeight + spacing.sm,
    justifyContent: 'center',
    ...shadows.button,
  },
  entryPackPrimaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryPackPrimaryIconWrapper: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryPackPrimaryIcon: {
    fontSize: 26,
  },
  entryPackPrimaryTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  entryPackPrimaryTitle: {
    ...typography.button,
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
  },
  entryPackPrimarySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  entryPackPrimaryArrowWrapper: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryPackPrimaryArrow: {
    fontSize: 22,
    color: colors.white,
  },
  entryPackSecondaryButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
  },
  entryPackSecondaryText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  entryPackTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    padding: spacing.md,
    paddingTop: spacing.sm,
    textAlign: 'center',
  },
  historyBanner: {
    backgroundColor: '#E6F8EE',
    borderRadius: 20,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(7, 193, 96, 0.18)',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyBadge: {
    ...typography.body2,
    fontWeight: '700',
    color: colors.primary,
  },
  historyStatusPill: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(7, 193, 96, 0.25)',
  },
  historyStatusText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  historyDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  historyPrimaryCta: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  historyPrimaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyPrimaryIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  historyPrimaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  historyPrimarySubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  historyPrimaryArrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '400',
    marginLeft: spacing.md,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonIcon: {
    fontSize: 18,
    color: colors.primary,
    marginRight: spacing.xs,
    fontWeight: '600',
  },
  actionButtonText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  historyFooter: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(7, 193, 96, 0.15)',
  },
  historyFooterTitle: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  historyFooterNote: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  digitalInfoCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 18,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(13, 71, 161, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  digitalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  digitalInfoIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  digitalInfoStepBadge: {
    backgroundColor: '#0D47A1',
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  digitalInfoContent: {
    flex: 1,
  },
  digitalInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D47A1',
    marginBottom: spacing.sm,
  },
  digitalInfoHighlight: {
    fontSize: 14,
    color: '#0D47A1',
    backgroundColor: 'rgba(33, 150, 243, 0.12)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  digitalInfoNote: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  digitalInfoButton: {
    backgroundColor: '#007AFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    marginTop: spacing.lg,
    alignSelf: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  digitalInfoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitalInfoButtonIcon: {
    fontSize: 18,
    color: colors.white,
    marginRight: spacing.sm,
  },
  digitalInfoButtonLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  previewText: {
    ...typography.body1,
    color: colors.textTertiary,
  },
  cardDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardInfo: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardActionText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  arrow: {
    ...typography.h3,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  buttonsContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionArrow: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: 'bold',
  },
  checkSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  checkSectionTitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  checkTextContainer: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  checkSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checkArrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.body1,
    color: colors.secondary,
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  privacyText: {
    fontSize: 13,
    color: '#34C759',
    flex: 1,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  // Japan Manual Hero Styles
  japanHeroContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  japanHeroHeader: {
    marginBottom: spacing.md,
  },
  japanHeroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  japanHeroIntro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  japanHeroCard: {
    borderRadius: 22,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  japanHeroProgressSection: {
    alignItems: 'center',
  },
  japanHeroPercent: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  japanHeroPercentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  japanHeroProgressBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  japanHeroProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  japanHeroStatus: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  japanHeroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  japanHeroMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  japanHeroActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  japanHeroActionWrapper: {
    flex: 1,
    marginRight: spacing.md,
  },
  japanHeroActionWrapperLast: {
    marginRight: 0,
  },
  japanHeroActionButton: {
    borderRadius: 16,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  japanHeroActionPrimary: {},
  japanHeroActionSecondary: {
    backgroundColor: '#F4F8FF',
    borderColor: 'rgba(21, 101, 192, 0.2)',
  },
  japanHeroActionIcon: {
    fontSize: 20,
  },
  japanHeroActionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  japanHeroActionSecondaryIcon: {
    color: '#1565C0',
  },
  japanHeroActionSecondaryLabel: {
    color: '#1565C0',
  },

  // Japan Manual Guide Styles
  japanManualLoadingCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: spacing.lg,
    alignItems: 'center',
  },
  japanManualLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  japanManualContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  japanManualIntroCard: {
    backgroundColor: 'rgba(21, 101, 192, 0.12)',
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(21, 101, 192, 0.2)',
    marginBottom: spacing.md,
  },
  japanManualIntroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D47A1',
  },
  japanManualIntroSubtitle: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  japanManualBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  japanManualBadge: {
    backgroundColor: 'rgba(21, 101, 192, 0.18)',
    color: '#0D47A1',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    fontSize: 12,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  japanManualSectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  japanManualSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  japanManualSectionIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  japanManualSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  japanManualSectionBody: {},
  japanManualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  japanManualRowFull: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  japanManualRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  japanManualLabel: {
    flex: 0.9,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  japanManualValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
    lineHeight: 20,
  },
  japanManualValueMultiline: {
    textAlign: 'left',
    marginTop: spacing.xs,
  },
  japanManualFundsList: {
    marginTop: spacing.xs,
  },
  japanManualFundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  japanManualFundItemLast: {
    borderBottomWidth: 0,
  },
  japanManualFundIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  japanManualFundTextContainer: {
    flex: 1,
  },
  japanManualFundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  japanManualFundSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  japanManualTotalFunds: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  japanManualEmptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  japanInteractiveGuideButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  japanInteractiveGuideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  japanInteractiveGuideIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  japanInteractiveGuideTextContainer: {
    flex: 1,
  },
  japanInteractiveGuideTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  japanInteractiveGuideSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  japanInteractiveGuideArrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '400',
    marginLeft: spacing.md,
  },
  japanHelpBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.2)',
  },
  japanHelpIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  japanHelpText: {
    fontSize: 13,
    color: '#1565C0',
    flex: 1,
    lineHeight: 18,
  },
});

export default ResultScreen;
