import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import OptimizedImage from './OptimizedImage';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
// QR code is displayed as an image from URI
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const { width: screenWidth } = Dimensions.get('window');
const QR_SIZE = Math.min(screenWidth * 0.6, 250);

const DigitalArrivalCardInfoCard = ({ digitalArrivalCard, isReadOnly = false }) => {
  const [qrError, setQrError] = useState(false);

  if (!tdacSubmission) {
    return null;
  }

  const {
    arrCardNo,
    qrUri,
    pdfUrl,
    submittedAt,
    submissionMethod,
  } = digitalArrivalCard;

  const formatSubmissionMethod = (method) => {
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
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
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
  };

  const handleSaveToAlbum = async () => {
    try {
      if (!qrUri) {
        Alert.alert('提示', 'QR码不可用');
        return;
      }

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能保存QR码');
        return;
      }

      // Download QR code image to cache first
      const fileName = `tdac_qr_${arrCardNo || Date.now()}.png`;
      const localUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      const downloadResult = await FileSystem.downloadAsync(qrUri, localUri);
      
      if (downloadResult.status === 200) {
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('入境卡', asset, false);
        Alert.alert('成功', 'QR码已保存到相册');
      } else {
        throw new Error('下载QR码失败');
      }
    } catch (error) {
      console.error('Error saving to album:', error);
      Alert.alert('错误', '保存失败，请稍后重试');
    }
  };

  const handleShare = async () => {
    try {
      const shareOptions = {
        title: '泰国入境卡',
        message: `入境卡号: ${arrCardNo}\n提交时间: ${formatDateTime(submittedAt)}`,
      };

      if (Platform.OS === 'ios') {
        shareOptions.url = qrUri;
      }

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('错误', '分享失败，请稍后重试');
    }
  };

  const handleViewPDF = async () => {
    if (!pdfPath) {
      Alert.alert('提示', 'PDF文件不可用');
      return;
    }

    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(pdfPath);
      if (!fileInfo.exists) {
        Alert.alert('错误', 'PDF文件不存在，可能已被删除');
        return;
      }

      // Show PDF options
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
                await Share.share({
                  url: Platform.OS === 'ios' ? pdfPath : `file://${pdfPath}`,
                  title: '泰国入境卡PDF',
                  message: `入境卡号: ${arrCardNo}`,
                });
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
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert('权限不足', '需要相册权限才能保存PDF');
                  return;
                }

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
    } catch (error) {
      console.error('Error handling PDF:', error);
      Alert.alert('错误', 'PDF操作失败');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>数字入境卡 (DAC)</Text>
        {!isReadOnly && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>已提交</Text>
          </View>
        )}
      </View>

      {/* Entry Card Number */}
      <View style={styles.cardNumberContainer}>
        <Text style={styles.cardNumberLabel}>入境卡号</Text>
        <Text style={styles.cardNumber}>{arrCardNo || '未获取'}</Text>
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        {qrUri && !qrError ? (
          <View style={styles.qrWrapper}>
            <OptimizedImage
              uri={qrUri}
              style={styles.qrCode}
              resizeMode="contain"
              loadingText="Loading QR code..."
              errorText="QR码加载失败"
              placeholder="📱"
              onError={() => setQrError(true)}
            />
          </View>
        ) : (
          <View style={[styles.qrWrapper, styles.qrPlaceholder]}>
            <Text style={styles.qrErrorText}>
              {qrUri ? 'QR码加载失败' : 'QR码不可用'}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {!isReadOnly && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleSaveToAlbum}
          >
            <Text style={styles.primaryButtonText}>💾 保存到相册</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleShare}
          >
            <Text style={styles.secondaryButtonText}>📤 分享</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PDF Button */}
      {pdfPath && (
        <TouchableOpacity
          style={[styles.actionButton, styles.pdfButton]}
          onPress={handleViewPDF}
        >
          <Text style={styles.pdfButtonText}>📄 查看PDF文件</Text>
        </TouchableOpacity>
      )}

      {/* Submission Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>提交详情</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>提交方式:</Text>
          <Text style={styles.detailValue}>
            {formatSubmissionMethod(submissionMethod)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>提交时间:</Text>
          <Text style={styles.detailValue}>
            {formatDateTime(submittedAt)}
          </Text>
        </View>

        {isReadOnly && (
          <View style={styles.readOnlyNotice}>
            <Text style={styles.readOnlyText}>
              📖 这是历史记录中的数字入境卡信息
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
  cardNumberContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  cardNumberLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardNumber: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  qrCode: {
    width: QR_SIZE,
    height: QR_SIZE,
  },
  qrPlaceholder: {
    width: QR_SIZE + spacing.md * 2,
    height: QR_SIZE + spacing.md * 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  qrErrorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  pdfButton: {
    backgroundColor: colors.warning,
    marginBottom: spacing.md,
  },
  pdfButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  detailsTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  readOnlyNotice: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  readOnlyText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default DigitalArrivalCardInfoCard;