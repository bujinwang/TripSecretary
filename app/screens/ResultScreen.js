// 入境通 - Result Screen
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  TouchableWithoutFeedback,
  Clipboard,
  Animated,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { colors, typography, spacing, borderRadius, shadows, touchable } from '../theme';
import api from '../services/api';
import { getAvailableFeatures, getEntryInstructions } from '../config/destinationRequirements';
import { mergeTDACData } from '../data/mockTDACData';
import { useTranslation } from '../i18n/LocaleContext';

const ResultScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const routeParams = route.params || {};
  const { generationId, fromHistory = false, userId, context } = routeParams;

  const [pdfUri, setPdfUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [shareSession, setShareSession] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [japanTravelerData, setJapanTravelerData] = useState(null);

  // Animation values
  const pulseAnimation = useMemo(() => new Animated.Value(1), []);
  const fadeAnimation = useMemo(() => new Animated.Value(0), []);

  const currentPassport = resultData?.passport || routeParams.passport;
  const currentDestination = resultData?.destination || routeParams.destination;
  const currentTravelInfo = resultData?.travelInfo || routeParams.travelInfo;

  const passport = currentPassport;
  const destination = currentDestination;
  const travelInfo = currentTravelInfo;
  const isThailand = destination?.id === 'th';
  const isMalaysia = destination?.id === 'my';
  const isSingapore = destination?.id === 'sg';
  const isTaiwan = destination?.id === 'tw';
  const isJapan = destination?.id === 'jp' || destination?.id === 'japan';
  const isJapanManualGuide = isJapan && context === 'manual_entry_guide';

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
      console.log('无法加载历史记录，使用传入的数据:', error.message);
      // 如果 API 调用失败（例如后端未运行），使用传入的参数
      // 这样即使没有后端，应用也能正常工作
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
        Alert.alert('提示', '部分信息加载失败，请检查您的入境信息是否完整');
      }
    } catch (error) {
      console.error('Error loading Japan traveler data:', error);
      Alert.alert('错误', '无法加载日本入境信息');
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

  const travelerName = useMemo(() => {
    if (!passport) {
      return '未填写';
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
    return name || fullName || composed || '未填写';
  }, [passport]);

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

  const flightNumberDisplay = travelInfo?.flightNumber || travelInfo?.flightNo || '待确认';
  const departureDateDisplay = travelInfo?.departureDate || '待确认';
  const arrivalDateDisplay = travelInfo?.arrivalDate || '待确认';
  const accommodationDisplay = useMemo(() => {
    const parts = [];
    const hotelName = travelInfo?.hotelName || travelInfo?.accommodationName;
    const hotelAddress = travelInfo?.hotelAddress;
    const contactPhone = travelInfo?.contactPhone;
    
    if (hotelName) parts.push(hotelName);
    if (hotelAddress) parts.push(hotelAddress);
    if (contactPhone) parts.push(contactPhone);
    
    return parts.join(' | ') || '待确认';
  }, [travelInfo]);

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
      t('result.entryPack.subtitleParts.missing', { defaultValue: '请补齐行程信息' })
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
    if (pdfUri) return pdfUri;

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
    if (!uri) return;

    try {
      const downloadPath = `${FileSystem.documentDirectory}${destination?.name || 'entry'}_form_${Date.now()}.pdf`;
      await FileSystem.copyAsync({
        from: uri,
        to: downloadPath,
      });
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

  const handleCancelShare = () => {
    Alert.alert(
      '取消分享',
      '该操作会立即失效共享链接和密码，亲友将无法继续访问。确定要取消吗？',
      [
        { text: '保留', style: 'cancel' },
        {
          text: '取消分享',
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

  const handleCopy = (value, field) => {
    Clipboard.setString(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = async () => {
    const uri = await generatePDF();
    if (!uri) return;

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

  const renderJapanManualGuide = () => {
    if (!isJapanManualGuide || !japanTravelerData) {
      return null;
    }

    return (
      <View style={styles.japanManualGuideCard}>
        <View style={styles.japanManualGuideHeader}>
          <Text style={styles.japanManualGuideIcon}>📋</Text>
          <View style={styles.japanManualGuideHeaderText}>
            <Text style={styles.japanManualGuideTitle}>日本入境卡填写指南</Text>
            <Text style={styles.japanManualGuideSubtitle}>请参考以下信息手动填写纸质入境卡</Text>
          </View>
        </View>

        {/* Passport Information Section */}
        <View style={styles.japanInfoSection}>
          <Text style={styles.japanSectionTitle}>护照信息 Passport Information</Text>
          <View style={styles.japanInfoGrid}>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>姓名 Full Name</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.fullName}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>姓 Family Name</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.familyName}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>名 Given Name</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.givenName}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>护照号 Passport No.</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.passportNo}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>国籍 Nationality</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.nationality}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>出生日期 Date of Birth</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.dateOfBirth}</Text>
            </View>
            {japanTravelerData.gender && (
              <View style={styles.japanInfoRow}>
                <Text style={styles.japanInfoLabel}>性别 Gender</Text>
                <Text style={styles.japanInfoValue}>{japanTravelerData.gender}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.japanInfoSection}>
          <Text style={styles.japanSectionTitle}>个人信息 Personal Information</Text>
          <View style={styles.japanInfoGrid}>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>职业 Occupation</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.occupation}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>居住城市 City of Residence</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.cityOfResidence}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>居住国家 Country of Residence</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.residentCountry}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>联系电话 Phone</Text>
              <Text style={styles.japanInfoValue}>+{japanTravelerData.phoneCode} {japanTravelerData.phoneNumber}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>电子邮箱 Email</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.email}</Text>
            </View>
          </View>
        </View>

        {/* Travel Information Section */}
        <View style={styles.japanInfoSection}>
          <Text style={styles.japanSectionTitle}>旅行信息 Travel Information</Text>
          <View style={styles.japanInfoGrid}>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>旅行目的 Purpose of Visit</Text>
              <Text style={styles.japanInfoValue}>
                {japanTravelerData.travelPurpose === 'Other' && japanTravelerData.customTravelPurpose
                  ? japanTravelerData.customTravelPurpose
                  : japanTravelerData.travelPurpose}
              </Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>航班号 Flight Number</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.arrivalFlightNumber}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>到达日期 Arrival Date</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.arrivalDate}</Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>停留天数 Length of Stay</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.lengthOfStay} 天</Text>
            </View>
          </View>
        </View>

        {/* Accommodation Information Section */}
        <View style={styles.japanInfoSection}>
          <Text style={styles.japanSectionTitle}>住宿信息 Accommodation</Text>
          <View style={styles.japanInfoGrid}>
            <View style={[styles.japanInfoRow, styles.japanInfoRowFull]}>
              <Text style={styles.japanInfoLabel}>住宿地址 Address</Text>
              <Text style={[styles.japanInfoValue, styles.japanInfoValueMultiline]}>
                {japanTravelerData.accommodationAddress}
              </Text>
            </View>
            <View style={styles.japanInfoRow}>
              <Text style={styles.japanInfoLabel}>住宿电话 Phone</Text>
              <Text style={styles.japanInfoValue}>{japanTravelerData.accommodationPhone}</Text>
            </View>
          </View>
        </View>

        {/* Fund Items Section */}
        {japanTravelerData.fundItems && japanTravelerData.fundItems.length > 0 && (
          <View style={styles.japanInfoSection}>
            <Text style={styles.japanSectionTitle}>资金证明 Funds</Text>
            <View style={styles.japanInfoGrid}>
              {japanTravelerData.fundItems.map((item, index) => (
                <View key={index} style={styles.japanInfoRow}>
                  <Text style={styles.japanInfoLabel}>
                    {item.type === 'cash' ? '现金 Cash' : 
                     item.type === 'credit_card' ? '信用卡 Credit Card' : 
                     '银行余额 Bank Balance'}
                  </Text>
                  <Text style={styles.japanInfoValue}>
                    {item.currency} {item.amount}
                  </Text>
                </View>
              ))}
              {japanTravelerData.totalFunds && Object.keys(japanTravelerData.totalFunds).length > 0 && (
                <View style={[styles.japanInfoRow, styles.japanTotalRow]}>
                  <Text style={styles.japanInfoLabel}>总计 Total</Text>
                  <Text style={styles.japanInfoValue}>
                    {Object.entries(japanTravelerData.totalFunds)
                      .map(([currency, amount]) => `${currency} ${amount}`)
                      .join(' + ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Interactive Guide Button */}
        <TouchableOpacity
          style={styles.japanInteractiveGuideButton}
          onPress={handleNavigateToInteractiveGuide}
          activeOpacity={0.85}
        >
          <View style={styles.japanInteractiveGuideContent}>
            <Text style={styles.japanInteractiveGuideIcon}>🛬</Text>
            <View style={styles.japanInteractiveGuideTextContainer}>
              <Text style={styles.japanInteractiveGuideTitle}>查看互动入境指南</Text>
              <Text style={styles.japanInteractiveGuideSubtitle}>分步骤指导 · 大字体模式</Text>
            </View>
            <Text style={styles.japanInteractiveGuideArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.japanHelpBox}>
          <Text style={styles.japanHelpIcon}>💡</Text>
          <Text style={styles.japanHelpText}>
            请在飞机上或到达机场后，参考以上信息填写纸质入境卡。建议截图保存以便随时查看。
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

        {/* Japan Manual Entry Guide */}
        {renderJapanManualGuide()}

        {isHistoryItem && !isJapanManualGuide && (
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

        {features.digitalInfo && !isJapanManualGuide && (
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
                        accommodationType: travelInfo?.accommodationType || 'HOTEL',
                        province: travelInfo?.province || 'BANGKOK',
                        district: travelInfo?.district || 'BANG_BON',
                        subDistrict: travelInfo?.subDistrict || 'BANG_BON_NUEA',
                        postCode: travelInfo?.postCode || '10150',
                        address: travelInfo?.hotelAddress || travelInfo?.hotelName || '',
                        
                        // Token
                        cloudflareToken: 'auto',
                      };
                      
                      // 直接跳转到混合模式
                      const travelerInfoWithFallbacks = mergeTDACData(tdacTravelInfo);
                      
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

        {!isJapanManualGuide && (
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
                    {isShareSessionActive ? '已邀请' : '亲友核实'}
                  </Text>
                </TouchableOpacity>
                {isShareSessionActive && shareSession && (
                  <Text style={styles.shareStatusText}>
                    有效至 {new Date(shareSession.expiresAt).toLocaleString()}
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
                <Text style={styles.entryPackSecondaryText}>更改资料</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.entryPackTimestamp}>{t('result.entryPack.lastUpdated', { time: formattedGeneratedAt })}</Text>
        </View>
        )}

        {isHistoryItem && !isJapanManualGuide && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.6}
            >
              <Text style={styles.actionButtonIcon}>↗</Text>
              <Text style={styles.actionButtonText}>
                {isShareSessionActive ? '查看分享信息' : '亲友核实'}
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
                  {entryInstructions?.kioskName || '自助通关机'}指南
                </Text>
                <Text style={styles.actionSubtitle}>手把手教您操作</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}

        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyBox}>
          <Text style={styles.privacyIcon}>💾</Text>
          <Text style={styles.privacyText}>
            所有信息仅保存在您的手机本地
          </Text>
        </View>

        {/* Additional Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            {t('result.infoBox')}
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
                <Text style={styles.shareModalTitle}>请亲友协助核对资料</Text>
                <Text style={styles.shareModalSubtitle}>
                  分享下方链接与密码给信任的亲友，链接有效期24小时。亲友可补充或修改入境所需信息，更新后会同步到本入境包。
                </Text>

                <View style={styles.shareInfoBlock}>
                  <Text style={styles.shareInfoLabel}>分享链接</Text>
                  <View style={styles.shareInfoRow}>
                    <Text style={styles.shareInfoValue} numberOfLines={1}>
                      {shareSession?.link}
                    </Text>
                    <TouchableOpacity
                      style={styles.shareCopyButton}
                      onPress={() => handleCopy(shareSession?.link || '', 'link')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.shareCopyText}>复制</Text>
                    </TouchableOpacity>
                  </View>
                  {copiedField === 'link' && <Text style={styles.shareCopiedTag}>已复制</Text>}
                </View>

                <View style={styles.shareInfoBlock}>
                  <Text style={styles.shareInfoLabel}>访问密码</Text>
                  <View style={styles.shareInfoRow}>
                    <Text style={styles.sharePasswordValue}>{shareSession?.password}</Text>
                    <TouchableOpacity
                      style={styles.shareCopyButton}
                      onPress={() => handleCopy(shareSession?.password || '', 'password')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.shareCopyText}>复制</Text>
                    </TouchableOpacity>
                  </View>
                  {copiedField === 'password' && <Text style={styles.shareCopiedTag}>已复制</Text>}
                </View>

                <Text style={styles.shareExpiryText}>
                  有效期至：{shareSession ? new Date(shareSession.expiresAt).toLocaleString() : '--'}
                </Text>

                <View style={styles.shareActionsRow}>
                  <TouchableOpacity
                    style={styles.sharePrimaryAction}
                    onPress={() => setShareModalVisible(false)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.sharePrimaryText}>完成，去粘贴给亲友</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareCancelAction}
                    onPress={handleCancelShare}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.shareCancelText}>取消此次分享</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.shareSecurityNote}>
                  安全提示：请仅分享给可信赖的家人或朋友，您可随时取消分享以立即终止访问。
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
  // Japan Manual Guide Styles
  japanManualGuideCard: {
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
  japanManualGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: '#E3F2FD',
    backgroundColor: '#F5F9FF',
  },
  japanManualGuideIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  japanManualGuideHeaderText: {
    flex: 1,
  },
  japanManualGuideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565C0',
  },
  japanManualGuideSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  japanInfoSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  japanSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: '#E3F2FD',
  },
  japanInfoGrid: {
    gap: spacing.sm,
  },
  japanInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  japanInfoRowFull: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  japanInfoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  japanInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
  japanInfoValueMultiline: {
    textAlign: 'left',
    marginTop: spacing.xs,
  },
  japanTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  japanInteractiveGuideButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
