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
  Share,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
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
        if (!snapshotData) {
          throw new Error('快照数据不存在或已被删除');
        }
        
        // Validate snapshot data integrity
        await validateSnapshotIntegrity(snapshotData);
        
        setSnapshot(snapshotData);
        setIsReadOnly(true);
      } else if (entryPackId) {
        // Loading active entry pack
        const entryPackData = await EntryPackService.load(entryPackId);
        if (!entryPackData) {
          throw new Error('入境包数据不存在或已被删除');
        }
        
        // Validate entry pack data integrity
        await validateEntryPackIntegrity(entryPackData);
        
        setEntryPack(entryPackData);
        setIsReadOnly(false);
      } else {
        throw new Error('No entryPackId or snapshotId provided');
      }
    } catch (err) {
      console.error('Error loading entry pack detail:', err);
      const userFriendlyError = getUserFriendlyError(err);
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  }, [entryPackId, snapshotId]);

  const validateSnapshotIntegrity = useCallback(async (snapshotData) => {
    try {
      // Check if TDAC submission files still exist
      if (snapshotData.tdacSubmission?.pdfPath) {
        const pdfInfo = await FileSystem.getInfoAsync(snapshotData.tdacSubmission.pdfPath);
        if (!pdfInfo.exists) {
          console.warn('Snapshot PDF file missing:', snapshotData.tdacSubmission.pdfPath);
          // Don't throw error, just log warning - historical data might have missing files
        }
      }

      // Check if fund photos still exist
      if (snapshotData.photoManifest && snapshotData.photoManifest.length > 0) {
        for (const photoPath of snapshotData.photoManifest) {
          const photoInfo = await FileSystem.getInfoAsync(photoPath);
          if (!photoInfo.exists) {
            console.warn('Snapshot photo missing:', photoPath);
          }
        }
      }
    } catch (err) {
      console.warn('Error validating snapshot integrity:', err);
      // Don't throw - integrity issues shouldn't prevent viewing
    }
  }, []);

  const validateEntryPackIntegrity = useCallback(async (entryPackData) => {
    try {
      // Check if TDAC submission files still exist
      if (entryPackData.tdacSubmission?.pdfPath) {
        const pdfInfo = await FileSystem.getInfoAsync(entryPackData.tdacSubmission.pdfPath);
        if (!pdfInfo.exists) {
          console.warn('Entry pack PDF file missing:', entryPackData.tdacSubmission.pdfPath);
          // Update entry pack to mark PDF as unavailable
          entryPackData.tdacSubmission.pdfAvailable = false;
        } else {
          entryPackData.tdacSubmission.pdfAvailable = true;
        }
      }

      // Check if fund photos still exist
      if (entryPackData.funds && entryPackData.funds.length > 0) {
        for (const fund of entryPackData.funds) {
          if (fund.photo) {
            const photoInfo = await FileSystem.getInfoAsync(fund.photo);
            if (!photoInfo.exists) {
              console.warn('Fund photo missing:', fund.photo);
              fund.photoAvailable = false;
            } else {
              fund.photoAvailable = true;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error validating entry pack integrity:', err);
      // Don't throw - integrity issues shouldn't prevent viewing
    }
  }, []);

  const getUserFriendlyError = useCallback((error) => {
    if (error.message.includes('Network')) {
      return '网络连接失败，请检查网络设置后重试';
    }
    if (error.message.includes('Permission')) {
      return '权限不足，请检查应用权限设置';
    }
    if (error.message.includes('Storage')) {
      return '存储空间不足，请清理设备存储后重试';
    }
    if (error.message.includes('Authentication')) {
      return '身份验证失败，请重新验证';
    }
    if (error.message.includes('不存在') || error.message.includes('已被删除')) {
      return error.message;
    }
    
    // Default error message
    return `加载失败: ${error.message}`;
  }, []);

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
      const pdfPath = data.tdacSubmission.pdfPath;
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(pdfPath);
      if (!fileInfo.exists) {
        Alert.alert('错误', 'PDF文件不存在，可能已被删除');
        return;
      }

      // Show options for what to do with PDF
      Alert.alert(
        'PDF操作',
        '请选择要执行的操作',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '分享PDF',
            onPress: async () => {
              try {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(pdfPath, {
                    mimeType: 'application/pdf',
                    dialogTitle: '分享泰国入境卡PDF',
                  });
                } else {
                  // Fallback to React Native Share
                  await Share.share({
                    url: Platform.OS === 'ios' ? pdfPath : `file://${pdfPath}`,
                    title: '泰国入境卡PDF',
                    message: `入境卡号: ${data.tdacSubmission.arrCardNo}`,
                  });
                }
              } catch (shareErr) {
                console.error('Error sharing PDF:', shareErr);
                Alert.alert('错误', '分享PDF失败');
              }
            },
          },
          {
            text: '保存到相册',
            onPress: async () => {
              try {
                // Request media library permissions
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('权限不足', '需要相册权限才能保存PDF');
                  return;
                }

                // Save to media library
                const asset = await MediaLibrary.createAssetAsync(pdfPath);
                await MediaLibrary.createAlbumAsync('入境卡', asset, false);
                Alert.alert('成功', 'PDF已保存到相册');
              } catch (saveErr) {
                console.error('Error saving PDF to album:', saveErr);
                Alert.alert('错误', '保存PDF到相册失败');
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error handling PDF:', err);
      Alert.alert('错误', 'PDF操作失败');
    }
  }, [entryPack, snapshot]);

  const handleShare = useCallback(async () => {
    const data = snapshot || entryPack;
    if (!data) {
      Alert.alert('错误', '没有可分享的数据');
      return;
    }

    try {
      // Show sharing options
      Alert.alert(
        '分享入境包',
        '选择要分享的内容',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '分享QR码',
            onPress: () => shareQRCode(data),
          },
          {
            text: '分享入境信息',
            onPress: () => shareEntryInfo(data),
          },
          {
            text: '分享完整包',
            onPress: () => shareCompletePackage(data),
          },
        ]
      );
    } catch (err) {
      console.error('Error showing share options:', err);
      Alert.alert('错误', '分享失败');
    }
  }, [entryPack, snapshot]);

  const shareQRCode = useCallback(async (data) => {
    try {
      if (!data.tdacSubmission?.qrUri) {
        Alert.alert('提示', 'QR码不可用');
        return;
      }

      const shareContent = {
        title: '泰国入境卡QR码',
        message: `入境卡号: ${data.tdacSubmission.arrCardNo}\n提交时间: ${formatDateTime(data.tdacSubmission.submittedAt)}`,
      };

      if (Platform.OS === 'ios') {
        shareContent.url = data.tdacSubmission.qrUri;
      }

      await Share.share(shareContent);
    } catch (err) {
      console.error('Error sharing QR code:', err);
      Alert.alert('错误', '分享QR码失败');
    }
  }, []);

  const shareEntryInfo = useCallback(async (data) => {
    try {
      const entryInfo = formatEntryInfoForSharing(data);
      
      await Share.share({
        title: '泰国入境信息',
        message: entryInfo,
      });
    } catch (err) {
      console.error('Error sharing entry info:', err);
      Alert.alert('错误', '分享入境信息失败');
    }
  }, []);

  const shareCompletePackage = useCallback(async (data) => {
    try {
      // Create a comprehensive share package
      const packageInfo = await createSharePackage(data);
      
      if (await Sharing.isAvailableAsync()) {
        // Use expo-sharing for file sharing
        await Sharing.shareAsync(packageInfo.filePath, {
          mimeType: 'text/plain',
          dialogTitle: '分享完整入境包',
        });
      } else {
        // Fallback to text sharing
        await Share.share({
          title: '泰国入境包',
          message: packageInfo.textContent,
        });
      }
    } catch (err) {
      console.error('Error sharing complete package:', err);
      Alert.alert('错误', '分享完整包失败');
    }
  }, []);

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '未知时间';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  }, []);

  const formatEntryInfoForSharing = useCallback((data) => {
    const lines = [
      '🇹🇭 泰国入境信息',
      '=' * 20,
      '',
    ];

    // TDAC Information
    if (data.tdacSubmission) {
      lines.push('📋 入境卡信息:');
      lines.push(`入境卡号: ${data.tdacSubmission.arrCardNo || '未知'}`);
      lines.push(`提交时间: ${formatDateTime(data.tdacSubmission.submittedAt)}`);
      lines.push(`提交方式: ${formatSubmissionMethod(data.tdacSubmission.submissionMethod)}`);
      lines.push('');
    }

    // Passport Information
    if (data.passport) {
      lines.push('🛂 护照信息:');
      lines.push(`姓名: ${data.passport.fullName || '未填写'}`);
      lines.push(`护照号: ${data.passport.passportNumber || '未填写'}`);
      lines.push(`国籍: ${data.passport.nationality || '未填写'}`);
      lines.push(`出生日期: ${data.passport.dateOfBirth || '未填写'}`);
      lines.push('');
    }

    // Travel Information
    if (data.travel) {
      lines.push('✈️ 旅行信息:');
      lines.push(`入境日期: ${data.travel.arrivalDate || '未填写'}`);
      lines.push(`航班号: ${data.travel.flightNumber || '未填写'}`);
      lines.push(`旅行目的: ${data.travel.travelPurpose || '未填写'}`);
      lines.push(`住宿: ${data.travel.accommodation || '未填写'}`);
      lines.push('');
    }

    // Fund Information
    if (data.funds && data.funds.length > 0) {
      lines.push('💰 资金证明:');
      data.funds.forEach((fund, index) => {
        lines.push(`${index + 1}. ${fund.type || '未知类型'}: ${fund.currency} ${fund.amount || '0'}`);
      });
      lines.push('');
    }

    lines.push('📱 由出境通App生成');
    
    return lines.join('\n');
  }, [formatDateTime]);

  const formatSubmissionMethod = useCallback((method) => {
    switch (method) {
      case 'API':
        return 'API自动提交';
      case 'WebView':
        return 'WebView填表';
      case 'Hybrid':
        return '混合模式';
      default:
        return method || '未知方式';
    }
  }, []);

  const createSharePackage = useCallback(async (data) => {
    try {
      const textContent = formatEntryInfoForSharing(data);
      
      // Create a temporary file for sharing
      const fileName = `thailand_entry_pack_${data.tdacSubmission?.arrCardNo || Date.now()}.txt`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, textContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return {
        filePath,
        textContent,
      };
    } catch (err) {
      console.error('Error creating share package:', err);
      throw new Error('创建分享包失败');
    }
  }, [formatEntryInfoForSharing]);

  const handlePDFRecovery = useCallback(async () => {
    Alert.alert(
      'PDF文件不可用',
      'PDF文件可能已被删除或移动。您可以尝试以下操作：',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '重新生成',
          onPress: async () => {
            try {
              // Navigate back to TDAC submission to regenerate PDF
              const data = snapshot || entryPack;
              navigation.navigate('TDACSelectionScreen', {
                destinationId: data.destinationId,
                tripId: data.tripId,
                regeneratePDF: true,
              });
            } catch (err) {
              console.error('Error navigating to regenerate PDF:', err);
              Alert.alert('错误', '无法重新生成PDF');
            }
          },
        },
        {
          text: '联系支持',
          onPress: () => {
            Alert.alert(
              '联系支持',
              '请通过应用内反馈功能联系我们的技术支持团队。',
              [{ text: '确定' }]
            );
          },
        },
      ]
    );
  }, [entryPack, snapshot, navigation]);

  const checkSharingAvailability = useCallback(async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      return {
        expoSharing: isAvailable,
        nativeShare: true, // React Native Share is always available
      };
    } catch (err) {
      console.warn('Error checking sharing availability:', err);
      return {
        expoSharing: false,
        nativeShare: true,
      };
    }
  }, []);

  const handleShareWithFallback = useCallback(async (shareFunction, fallbackMessage) => {
    try {
      const availability = await checkSharingAvailability();
      
      if (!availability.expoSharing && !availability.nativeShare) {
        Alert.alert('分享不可用', '您的设备不支持分享功能');
        return;
      }

      await shareFunction();
    } catch (err) {
      console.error('Error in share operation:', err);
      
      // Show fallback options
      Alert.alert(
        '分享失败',
        fallbackMessage || '分享操作失败，请稍后重试',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '复制到剪贴板',
            onPress: async () => {
              try {
                const data = snapshot || entryPack;
                const textContent = formatEntryInfoForSharing(data);
                // Note: Clipboard API would need to be imported if available
                Alert.alert('提示', '请手动复制以下信息：\n\n' + textContent);
              } catch (clipboardErr) {
                console.error('Error copying to clipboard:', clipboardErr);
                Alert.alert('错误', '复制失败');
              }
            },
          },
        ]
      );
    }
  }, [checkSharingAvailability, formatEntryInfoForSharing, entryPack, snapshot]);

  const handleViewImmigrationGuide = useCallback(() => {
    const data = snapshot || entryPack;
    if (!data?.tdacSubmission) {
      Alert.alert('提示', '请先完成TDAC提交');
      return;
    }

    // Navigate to Thailand-specific immigration guide
    navigation.navigate('ThailandInteractiveImmigrationGuide', {
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
              title={data.tdacSubmission.pdfAvailable === false ? "PDF不可用" : "下载PDF"}
              onPress={data.tdacSubmission.pdfAvailable === false ? handlePDFRecovery : handleDownloadPDF}
              style={[
                styles.actionButton, 
                data.tdacSubmission.pdfAvailable === false ? styles.disabledButton : styles.secondaryButton
              ]}
              disabled={data.tdacSubmission.pdfAvailable === false}
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
            onPress={() => handleShareWithFallback(handleShare, '分享入境包失败，请检查网络连接或稍后重试')}
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
  disabledButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.5,
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