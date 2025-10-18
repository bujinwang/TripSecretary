/**
 * Entry Card Preview Screen - Auto-preview functionality
 * Shows a formatted preview of the entry card data similar to auto-submit TDAC
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  SafeAreaView
} from 'react-native';
import { useLocale } from '../../i18n/LocaleContext';
import PassportDataService from '../../services/data/PassportDataService';
import EntryCompletionCalculator from '../../utils/EntryCompletionCalculator';
import { colors, typography, spacing } from '../../theme';

const EntryCardPreviewScreen = ({ navigation, route }) => {
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Load user data and prepare preview
  useEffect(() => {
    loadPreviewData();
  }, []);

  const loadPreviewData = async () => {
    try {
      setIsLoading(true);

      // Get user ID from route params or use default
      const userId = route.params?.passport?.id || 'default_user';

      // Initialize PassportDataService
      await PassportDataService.initialize(userId);

      // Load all user data
      const allUserData = await PassportDataService.getAllUserData(userId);

      // Load fund items
      const fundItems = await PassportDataService.getFundItems(userId);

      // Load travel info for Thailand
      const destinationId = route.params?.destination?.id || 'thailand';
      const travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);

      // Prepare entry info for preview
      const passportInfo = allUserData.passport || {};
      const personalInfoFromStore = allUserData.personalInfo || {};
      const normalizedPersonalInfo = { ...personalInfoFromStore };

      if (!normalizedPersonalInfo.gender || !normalizedPersonalInfo.gender.trim()) {
        if (passportInfo.gender && passportInfo.gender.trim()) {
          normalizedPersonalInfo.gender = passportInfo.gender.trim();
        } else if (route.params?.passport?.gender && route.params.passport.gender.trim()) {
          normalizedPersonalInfo.gender = route.params.passport.gender.trim();
        } else if (route.params?.passport?.sex && route.params.passport.sex.trim()) {
          normalizedPersonalInfo.gender = route.params.passport.sex.trim();
        }
      }

      const entryInfo = {
        passport: passportInfo,
        personalInfo: normalizedPersonalInfo,
        funds: fundItems || [],
        travel: travelInfo || {},
        lastUpdatedAt: new Date().toISOString()
      };

      // Calculate completion to ensure data is ready
      const completionSummary = EntryCompletionCalculator.getCompletionSummary(entryInfo);

      // Prepare preview data
      const preview = {
        personalInfo: {
          familyName: passportInfo.familyName || personalInfoFromStore.familyName || '',
          firstName: passportInfo.firstName || personalInfoFromStore.firstName || '',
          passportNo: passportInfo.passportNo || '',
          gender: normalizedPersonalInfo.gender || passportInfo.gender || '',
          birthDate: passportInfo.birthDate || {},
          nationality: passportInfo.nationality || 'CHN',
          phoneNo: personalInfoFromStore.phoneNo || '',
          email: personalInfoFromStore.email || ''
        },
        travelInfo: {
          arrivalDate: travelInfo?.arrivalArrivalDate || travelInfo?.arrivalDate || '',
          flightNo: travelInfo?.flightNo || '',
          purpose: travelInfo?.purpose || 'HOLIDAY',
          accommodationType: travelInfo?.accommodationType || 'HOTEL',
          accommodationAddress: travelInfo?.accommodationAddress || '',
          province: travelInfo?.province || 'BANGKOK'
        },
        funds: fundItems || [],
        completionPercent: completionSummary.totalPercent,
        lastUpdated: new Date().toLocaleString()
      };

      setPreviewData(preview);

      // Auto-show preview after loading
      setTimeout(() => {
        setIsLoading(false);
        setShowPreview(true);
      }, 1000); // 1 second delay for smooth transition

    } catch (error) {
      console.error('Failed to load preview data:', error);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    setShowPreview(false);
    navigation.navigate('ThailandTravelInfo', {
      passport: route.params?.passport,
      destination: route.params?.destination,
    });
  };

  // Loading screen (similar to auto-submit)
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleClose}
        >
          <Text style={styles.cancelButtonText}>✕ 取消</Text>
        </TouchableOpacity>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>正在准备入境卡预览...</Text>
        <Text style={styles.loadingSubtext}>⚡ 预计1秒完成</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleClose}
        >
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>预览入境卡</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={false}
        animationType="slide"
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.previewContent}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>🇹🇭 泰国入境卡预览</Text>
                <Text style={styles.previewSubtitle}>
                  以下是您填写的入境信息预览。如需修改，请点击"编辑信息"。
                </Text>
              </View>

              {/* Personal Information Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>👤 个人信息</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>姓名：</Text>
                  <Text style={styles.value}>
                    {previewData?.personalInfo?.firstName} {previewData?.personalInfo?.familyName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>护照号码：</Text>
                  <Text style={styles.value}>{previewData?.personalInfo?.passportNo || '未填写'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>性别：</Text>
                  <Text style={styles.value}>
                    {previewData?.personalInfo?.gender === 'MALE' ? '男性' :
                     previewData?.personalInfo?.gender === 'FEMALE' ? '女性' : '未填写'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>出生日期：</Text>
                  <Text style={styles.value}>
                    {previewData?.personalInfo?.birthDate?.year || '未填写'}年
                    {previewData?.personalInfo?.birthDate?.month || '未填写'}月
                    {previewData?.personalInfo?.birthDate?.day || '未填写'}日
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>国籍：</Text>
                  <Text style={styles.value}>
                    {previewData?.personalInfo?.nationality === 'CHN' ? '中国' : '未填写'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>联系电话：</Text>
                  <Text style={styles.value}>{previewData?.personalInfo?.phoneNo || '未填写'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>邮箱：</Text>
                  <Text style={styles.value}>{previewData?.personalInfo?.email || '未填写'}</Text>
                </View>
              </View>

              {/* Travel Information Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✈️ 行程信息</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>抵达日期：</Text>
                  <Text style={styles.value}>{previewData?.travelInfo?.arrivalDate || '未填写'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>航班号：</Text>
                  <Text style={styles.value}>{previewData?.travelInfo?.flightNo || '未填写'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>旅行目的：</Text>
                  <Text style={styles.value}>
                    {previewData?.travelInfo?.purpose === 'HOLIDAY' ? '度假' :
                     previewData?.travelInfo?.purpose === 'BUSINESS' ? '商务' :
                     previewData?.travelInfo?.purpose === 'MEETING' ? '会议' : '探亲访友'}
                  </Text>
                </View>
              </View>

              {/* Accommodation Information Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏨 住宿信息</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>住宿类型：</Text>
                  <Text style={styles.value}>
                    {previewData?.travelInfo?.accommodationType === 'HOTEL' ? '酒店' :
                     previewData?.travelInfo?.accommodationType === 'GUEST_HOUSE' ? '民宿' :
                     previewData?.travelInfo?.accommodationType === 'APARTMENT' ? '公寓' :
                     previewData?.travelInfo?.accommodationType === 'FRIEND_HOUSE' ? '朋友家' : '未填写'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>住宿地址：</Text>
                  <Text style={styles.value}>{previewData?.travelInfo?.accommodationAddress || '未填写'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>省份：</Text>
                  <Text style={styles.value}>{previewData?.travelInfo?.province || '曼谷'}</Text>
                </View>
              </View>

              {/* Funds Information Section */}
              {previewData?.funds && previewData.funds.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>💰 资金证明</Text>
                  {previewData.funds.map((fund, index) => (
                    <View key={index} style={styles.infoRow}>
                      <Text style={styles.label}>资金{index + 1}：</Text>
                      <Text style={styles.value}>
                        {fund.type === 'cash' ? '现金' : '银行卡'} - {fund.amount} {fund.currency}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Completion Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 完成状态</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>完成度：</Text>
                  <Text style={[
                    styles.value,
                    { color: previewData?.completionPercent === 100 ? colors.success : colors.warning }
                  ]}>
                    {previewData?.completionPercent || 0}%
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>最后更新：</Text>
                  <Text style={styles.value}>{previewData?.lastUpdated}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEdit}
                >
                  <Text style={styles.editButtonText}>✏️ 编辑信息</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Text style={styles.closeButtonText}>完成预览</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
    position: 'relative'
  },
  cancelButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    zIndex: 10
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600'
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center'
  },
  loadingSubtext: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 10,
    textAlign: 'center'
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
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  previewContent: {
    padding: spacing.md,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  previewSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 80,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    flexWrap: 'wrap',
  },
  actionSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  editButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EntryCardPreviewScreen;