// 出国啰 - Result Screen
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
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import Button from '../components/Button';
import { colors, typography, spacing } from '../theme';
import api from '../services/api';
import { getAvailableFeatures, getEntryInstructions } from '../config/destinationRequirements';
import { mergeTDACData } from '../data/mockTDACData';
import { useTranslation } from '../i18n/LocaleContext';

const ResultScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const routeParams = route.params || {};
  const { generationId, fromHistory = false } = routeParams;
  
  const [pdfUri, setPdfUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);

  const currentPassport = resultData?.passport || routeParams.passport;
  const currentDestination = resultData?.destination || routeParams.destination;
  const currentTravelInfo = resultData?.travelInfo || routeParams.travelInfo;

  const passport = currentPassport;
  const destination = currentDestination;
  const travelInfo = currentTravelInfo;

  // 获取目的地特定的功能配置
  const features = getAvailableFeatures(destination?.id);
  const entryInstructions = getEntryInstructions(destination?.id);
  const isHistoryItem = Boolean(fromHistory || resultData?.fromHistory);

  useEffect(() => {
    if (generationId) {
      loadGenerationResult();
    }
  }, [generationId]);

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
  const arrivalDateDisplay = travelInfo?.arrivalDate || '待确认';
  const accommodationDisplay =
    travelInfo?.hotelName ||
    travelInfo?.hotelAddress ||
    travelInfo?.accommodationName ||
    '待确认';

  const entrySubtitle = useMemo(() => {
    const parts = [];
    if (destination?.name) {
      parts.push(destination.name);
    }
    if (arrivalDateDisplay !== '待确认') {
      parts.push(arrivalDateDisplay);
    }
    if (flightNumberDisplay !== '待确认') {
      parts.push(`航班 ${flightNumberDisplay}`);
    }
    return parts.join(' · ') || '请补齐行程信息';
  }, [destination?.name, arrivalDateDisplay, flightNumberDisplay]);

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
      { label: t('result.entryPack.fields.traveler'), value: travelerName },
      { label: t('result.entryPack.fields.passportNo'), value: passportNumber },
      { label: t('result.entryPack.fields.flightNo'), value: flightNumberDisplay },
      { label: t('result.entryPack.fields.arrivalDate'), value: arrivalDateDisplay },
      { label: t('result.entryPack.fields.accommodation'), value: accommodationDisplay, fullWidth: true },
    ],
    [t, travelerName, passportNumber, flightNumberDisplay, arrivalDateDisplay, accommodationDisplay],
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
              <p>Generated by 出境通 TripSecretary</p>
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

  const handleShare = async () => {
    const uri = await generatePDF();
    if (!uri) return;

    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('错误', '该设备不支持分享功能');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `分享${destination?.name || ''}入境表格`,
      });
    } catch (error) {
      Alert.alert('错误', '分享失败');
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header - Simplified */}
        <View style={styles.headerContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.title}>
            {destination?.flag} {destination?.name || ''}入境包已准备好
          </Text>
          <Text style={styles.subtitle}>所有资料已整理，随时可在机场出示</Text>
        </View>

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

        <View style={styles.entryPackCard}>
          <View style={styles.entryPackHeader}>
            <Text style={styles.entryPackIcon}>🧳</Text>
            <View style={styles.entryPackHeaderText}>
              <Text style={styles.entryPackTitle}>基本信息</Text>
              <Text style={styles.entryPackSubtitle}>{entrySubtitle}</Text>
            </View>
            {canShareInline && (
              <TouchableOpacity
                style={styles.entryPackShareButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.entryPackShareText}>分享</Text>
              </TouchableOpacity>
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
              <Button
                title="启动入境指南"
                onPress={handleStartArrivalFlow}
                icon={<Text style={styles.entryPackActionIcon}>🛬</Text>}
                style={styles.entryPackPrimaryButton}
              />
              <TouchableOpacity
                onPress={handleEditInfo}
                style={styles.entryPackSecondaryButton}
                activeOpacity={0.7}
              >
                <Text style={styles.entryPackSecondaryText}>更改资料</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.entryPackTimestamp}>最后更新：{formattedGeneratedAt}</Text>
        </View>

        {isHistoryItem && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
              activeOpacity={0.6}
            >
              <Text style={styles.actionButtonIcon}>↗</Text>
              <Text style={styles.actionButtonText}>{t('result.historyBanner.secondaryCta.shareFamily')}</Text>
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

        {/* Digital Entry System Info */}
        {features.digitalInfo && (
          <View style={styles.digitalInfoCard}>
            <Text style={styles.digitalInfoIcon}>📱</Text>
            <View style={styles.digitalInfoContent}>
              <Text style={styles.digitalInfoTitle}>需要在线申请 {features.digitalInfo.systemName}</Text>
              {features.digitalInfo.notes.map((note, index) => (
                <Text key={index} style={styles.digitalInfoNote}>• {note}</Text>
              ))}
              {features.digitalInfo.url && (
                <TouchableOpacity 
                  onPress={async () => {
                    // 泰国显示选择界面，其他国家打开网址
                    if (destination?.id === 'th') {
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
                    } else {
                      Linking.openURL(features.digitalInfo.url);
                    }
                  }}
                  style={styles.digitalInfoButton}
                >
                  <Text style={styles.digitalInfoButtonText}>
                    {destination?.id === 'th' ? '⚡ 自动填写' : '前往申请 ›'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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

        {/* Additional Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            已自动保存到「历史记录」，随时可以查看
          </Text>
        </View>
      </ScrollView>
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
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  successIcon: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  entryPackCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
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
  entryPackShareButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
  entryPackShareText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  entryPackInfoGrid: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  entryPackInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
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
  },
  entryPackActionIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  entryPackSecondaryButton: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  entryPackSecondaryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  entryPackTimestamp: {
    fontSize: 13,
    color: colors.textSecondary,
    padding: spacing.lg,
    paddingTop: spacing.md,
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.md,
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
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: spacing.lg,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  digitalInfoIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  digitalInfoContent: {
    flex: 1,
  },
  digitalInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: spacing.sm,
  },
  digitalInfoNote: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  digitalInfoButton: {
    backgroundColor: '#2196F3',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  digitalInfoButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default ResultScreen;
