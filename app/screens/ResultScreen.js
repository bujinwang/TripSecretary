// 出国啰 - Result Screen
import React, { useState, useEffect } from 'react';
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
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, typography, spacing } from '../theme';
import api from '../services/api';
import { getAvailableFeatures, getEntryInstructions } from '../config/destinationRequirements';
import { mergeTDACData } from '../data/mockTDACData';

const ResultScreen = ({ navigation, route }) => {
  const { passport, destination, travelInfo, generationId } = route.params || {};
  
  // 获取目的地特定的功能配置
  const features = getAvailableFeatures(destination?.id);
  const entryInstructions = getEntryInstructions(destination?.id);
  const [pdfUri, setPdfUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);

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
              <p>Generated by 出国啰 TripSecretary</p>
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
            {destination?.flag} {destination?.name || ''}入境表已生成
          </Text>
          <Text style={styles.subtitle}>已填写完整信息，可直接使用</Text>
        </View>

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
          {/* 1. 向海关出示 - 仅当需要纸质表格时显示 */}
          {features.showPresentToCustoms && (
            <TouchableOpacity 
              style={styles.actionCardPrimary} 
              onPress={() => navigation.navigate('PresentToCustoms', { passport, destination, travelInfo })}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIconPrimary}>👮</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitlePrimary}>向海关出示</Text>
                <Text style={styles.actionSubtitlePrimary}>Present to Customs Officer</Text>
              </View>
              <Text style={styles.actionArrowPrimary}>›</Text>
            </TouchableOpacity>
          )}

          {/* 2. 抄写模式 - 仅当需要手写时显示 */}
          {features.showCopyMode && (
            <TouchableOpacity 
              style={features.showPresentToCustoms ? styles.actionCard : styles.actionCardPrimary} 
              onPress={() => navigation.navigate('CopyWrite', { passport, destination, travelInfo })}
              activeOpacity={0.8}
            >
              <Text style={features.showPresentToCustoms ? styles.actionIcon : styles.actionIconPrimary}>✍️</Text>
              <View style={styles.actionTextContainer}>
                <Text style={features.showPresentToCustoms ? styles.actionTitle : styles.actionTitlePrimary}>
                  抄写模式
                </Text>
                <Text style={features.showPresentToCustoms ? styles.actionSubtitle : styles.actionSubtitlePrimary}>
                  适合老人手写表格
                </Text>
              </View>
              <Text style={features.showPresentToCustoms ? styles.actionArrow : styles.actionArrowPrimary}>›</Text>
            </TouchableOpacity>
          )}

          {/* 3. 自助通关机指南 - 仅当有自助机时显示 */}
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

          {/* 4. 下载PDF - 仅当有PDF格式时显示 */}
          {features.showDownloadPDF && (
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={handleDownload}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>⬇️</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>下载PDF</Text>
                <Text style={styles.actionSubtitle}>
                  {entryInstructions?.pdfFormat || '保存到手机'}
                </Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}

          {/* 5. 分享 - 总是显示 */}
          {features.showShare && (
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>分享</Text>
                <Text style={styles.actionSubtitle}>发送给家人朋友</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Optional: Check Details - Moved to bottom */}
        <View style={styles.checkSection}>
          <Text style={styles.checkSectionTitle}>需要检查信息？</Text>
          
          <TouchableOpacity 
            style={styles.checkCard}
            onPress={() => {/* TODO: Navigate to preview */}}
            activeOpacity={0.7}
          >
            <Text style={styles.checkIcon}>📋</Text>
            <View style={styles.checkTextContainer}>
              <Text style={styles.checkTitle}>查看完整表格</Text>
              <Text style={styles.checkSubtitle}>已填写 12 项信息</Text>
            </View>
            <Text style={styles.checkArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.checkCard}
            onPress={() => {/* TODO: Navigate to Q&A */}}
            activeOpacity={0.7}
          >
            <Text style={styles.checkIcon}>💬</Text>
            <View style={styles.checkTextContainer}>
              <Text style={styles.checkTitle}>海关问答参考</Text>
              <Text style={styles.checkSubtitle}>20个常见问题</Text>
            </View>
            <Text style={styles.checkArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity onPress={handleGoHome} style={styles.footer}>
          <Text style={styles.footerText}>完成！返回首页</Text>
        </TouchableOpacity>

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
    padding: spacing.md,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
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
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
  },
  previewContainer: {
    marginBottom: spacing.md,
  },
  previewPlaceholder: {
    height: 120,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  actionCardPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  actionIconPrimary: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitlePrimary: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  actionSubtitlePrimary: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionArrowPrimary: {
    fontSize: 36,
    color: colors.white,
    fontWeight: 'bold',
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
