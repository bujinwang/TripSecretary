import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EntryPackService } from '../../services/entryPack/EntryPackService';
import { SnapshotService } from '../../services/snapshot/SnapshotService';
import { PassportDataService } from '../../services/data/PassportDataService';
import BiometricAuthService from '../../services/security/BiometricAuthService';
import { EntryPackStatusBanner } from '../../components/EntryPackStatusBanner';
import { TDACInfoCard } from '../../components/TDACInfoCard';
import { Button } from '../../components/Button';
import { BackButton } from '../../components/BackButton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const EntryPackDetailScreen = ({ route, navigation }) => {
  const { entryPackId, snapshotId } = route.params || {};
  
  const [entryPack, setEntryPack] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticationRequired, setAuthenticationRequired] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Check if biometric authentication is required
      const authResult = await BiometricAuthService.authenticateForEntryPackView(entryPackId || snapshotId);
      
      if (!authResult.success && !authResult.skipped) {
        setAuthenticationRequired(true);
        setError(authResult.error || 'Authentication required to view entry pack details');
        return;
      }
      
      setIsAuthenticated(true);
      setAuthenticationRequired(false);
      
      if (snapshotId) {
        // Loading from snapshot (read-only historical view)
        const snapshotData = await SnapshotService.load(snapshotId);
        setSnapshot(snapshotData);
        setIsReadOnly(true);
      } else if (entryPackId) {
        // Loading active entry pack
        const entryPackData = await EntryPackService.load(entryPackId);
        setEntryPack(entryPackData);
        setIsReadOnly(false);
      } else {
        throw new Error('No entryPackId or snapshotId provided');
      }
    } catch (err) {
      console.error('Error loading entry pack detail:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [entryPackId, snapshotId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleResubmit = useCallback(async () => {
    if (!entryPack) return;

    Alert.alert(
      '重新提交入境卡',
      '修改信息后需要重新提交入境卡，确认要修改吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确认',
          onPress: async () => {
            try {
              // Mark current entry pack as superseded
              await EntryPackService.markAsSuperseded(entryPackId);
              
              // Create snapshot with reason 'superseded'
              await SnapshotService.createSnapshot(entryPackId, 'superseded');
              
              // Navigate back to travel info screen for editing
              navigation.navigate('ThailandTravelInfoScreen', {
                destinationId: entryPack.destinationId,
                tripId: entryPack.tripId,
              });
            } catch (err) {
              console.error('Error during resubmission:', err);
              Alert.alert('错误', '重新提交失败，请稍后重试');
            }
          },
        },
      ]
    );
  }, [entryPack, entryPackId, navigation]);

  const handleArchive = useCallback(async () => {
    if (!entryPack) return;

    Alert.alert(
      '归档入境包',
      '确认要将此入境包移至历史记录吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '归档',
          onPress: async () => {
            try {
              await EntryPackService.archive(entryPackId, 'user_manual');
              navigation.goBack();
            } catch (err) {
              console.error('Error archiving entry pack:', err);
              Alert.alert('错误', '归档失败，请稍后重试');
            }
          },
        },
      ]
    );
  }, [entryPack, entryPackId, navigation]);

  const handleDownloadPDF = useCallback(async () => {
    const data = snapshot || entryPack;
    if (!data?.tdacSubmission?.pdfPath) {
      Alert.alert('提示', 'PDF文件不可用');
      return;
    }

    try {
      // TODO: Implement PDF download/sharing functionality
      Alert.alert('功能开发中', 'PDF下载功能即将推出');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      Alert.alert('错误', 'PDF下载失败');
    }
  }, [entryPack, snapshot]);

  const handleShare = useCallback(async () => {
    try {
      // TODO: Implement sharing functionality
      Alert.alert('功能开发中', '分享功能即将推出');
    } catch (err) {
      console.error('Error sharing entry pack:', err);
      Alert.alert('错误', '分享失败');
    }
  }, []);

  const handleViewImmigrationGuide = useCallback(() => {
    const data = snapshot || entryPack;
    if (!data?.tdacSubmission) {
      Alert.alert('提示', '请先完成TDAC提交');
      return;
    }

    navigation.navigate('InteractiveImmigrationGuide', {
      destinationId: data.destinationId,
      entryPackId: entryPackId,
    });
  }, [entryPack, snapshot, entryPackId, navigation]);

  const handleShowToOfficer = useCallback(async () => {
    const data = snapshot || entryPack;
    if (!data?.tdacSubmission) {
      Alert.alert('提示', '请先完成TDAC提交');
      return;
    }

    try {
      // Load passport and travel data for presentation mode
      const passportData = await PassportDataService.getPassportInfo();
      const travelData = await PassportDataService.getTravelInfo();
      const fundData = await PassportDataService.getFundItems();

      navigation.navigate('ImmigrationOfficerView', {
        entryPack: data,
        passportData,
        travelData,
        fundData,
      });
    } catch (err) {
      console.error('Error loading data for presentation mode:', err);
      Alert.alert('错误', '加载数据失败，请稍后重试');
    }
  }, [entryPack, snapshot, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>入境包详情</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle authentication required
  if (authenticationRequired && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>入境包详情</Text>
        </View>
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>身份验证</Text>
          <Text style={styles.authMessage}>
            查看入境包详情需要验证您的身份
          </Text>
          <Button
            title="验证身份"
            onPress={async () => {
              setLoading(true);
              await loadData();
              setLoading(false);
            }}
            style={styles.authButton}
          />
          <Button
            title="取消"
            onPress={() => navigation.goBack()}
            style={[styles.authButton, styles.cancelButton]}
            textStyle={styles.cancelButtonText}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>入境包详情</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>加载失败: {error}</Text>
          <Button
            title="重试"
            onPress={loadData}
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const data = snapshot || entryPack;
  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>入境包详情</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>未找到入境包数据</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>
          {isReadOnly ? '历史记录详情' : '入境包详情'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Read-only banner for snapshots */}
        {isReadOnly && (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>
              这是历史记录的快照，无法修改
            </Text>
          </View>
        )}

        {/* Status Banner */}
        <EntryPackStatusBanner
          status={data.status}
          submissionDate={data.tdacSubmission?.submittedAt}
          arrivalDate={data.travel?.arrivalDate}
          isReadOnly={isReadOnly}
        />

        {/* TDAC Information Card */}
        {data.tdacSubmission && (
          <TDACInfoCard
            tdacSubmission={data.tdacSubmission}
            isReadOnly={isReadOnly}
          />
        )}

        {/* Snapshot Data Viewing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>入境信息</Text>
          
          {/* Passport Information */}
          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>护照信息</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>姓名:</Text>
              <Text style={styles.dataValue}>{data.passport?.fullName || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>护照号:</Text>
              <Text style={styles.dataValue}>{data.passport?.passportNumber || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>国籍:</Text>
              <Text style={styles.dataValue}>{data.passport?.nationality || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>出生日期:</Text>
              <Text style={styles.dataValue}>{data.passport?.dateOfBirth || '未填写'}</Text>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>个人信息</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>职业:</Text>
              <Text style={styles.dataValue}>{data.personalInfo?.occupation || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>电话:</Text>
              <Text style={styles.dataValue}>{data.personalInfo?.phoneNumber || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>邮箱:</Text>
              <Text style={styles.dataValue}>{data.personalInfo?.email || '未填写'}</Text>
            </View>
          </View>

          {/* Travel Information */}
          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>旅行信息</Text>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>入境日期:</Text>
              <Text style={styles.dataValue}>{data.travel?.arrivalDate || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>航班号:</Text>
              <Text style={styles.dataValue}>{data.travel?.flightNumber || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>旅行目的:</Text>
              <Text style={styles.dataValue}>{data.travel?.travelPurpose || '未填写'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>住宿:</Text>
              <Text style={styles.dataValue}>{data.travel?.accommodation || '未填写'}</Text>
            </View>
          </View>

          {/* Fund Information */}
          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>资金证明</Text>
            {data.funds && data.funds.length > 0 ? (
              data.funds.map((fund, index) => (
                <View key={index} style={styles.fundItem}>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>类型:</Text>
                    <Text style={styles.dataValue}>{fund.type || '未知'}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>金额:</Text>
                    <Text style={styles.dataValue}>
                      {fund.currency} {fund.amount || '0'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.dataValue}>未添加资金证明</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {data.tdacSubmission && (
            <Button
              title="向海关展示"
              onPress={handleShowToOfficer}
              style={[styles.actionButton, styles.presentationButton]}
            />
          )}

          {!isReadOnly && data.tdacSubmission && (
            <Button
              title="开始入境指引"
              onPress={handleViewImmigrationGuide}
              style={[styles.actionButton, styles.primaryButton]}
            />
          )}

          {data.tdacSubmission?.pdfPath && (
            <Button
              title="下载PDF"
              onPress={handleDownloadPDF}
              style={[styles.actionButton, styles.secondaryButton]}
            />
          )}

          {!isReadOnly && (
            <>
              <Button
                title="重新提交"
                onPress={handleResubmit}
                style={[styles.actionButton, styles.warningButton]}
              />
              
              <Button
                title="归档"
                onPress={handleArchive}
                style={[styles.actionButton, styles.secondaryButton]}
              />
            </>
          )}

          <Button
            title="分享给旅伴"
            onPress={handleShare}
            style={[styles.actionButton, styles.secondaryButton]}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    marginLeft: spacing.sm,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    minWidth: 120,
  },
  readOnlyBanner: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 8,
  },
  readOnlyText: {
    ...typography.body,
    color: colors.surface,
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  dataCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dataCardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dataLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  dataValue: {
    ...typography.body,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  fundItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  actionSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  presentationButton: {
    backgroundColor: '#1a1a1a', // Dark background for presentation mode
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningButton: {
    backgroundColor: colors.warning,
  },
  // Authentication styles
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  authTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  authMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  authButton: {
    minWidth: 200,
    marginBottom: spacing.md,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
});

export default EntryPackDetailScreen;