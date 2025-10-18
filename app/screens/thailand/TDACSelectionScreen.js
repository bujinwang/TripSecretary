/**
 * TDAC Selection Screen
 * 让用户选择使用WebView自动化版本 或 完全API版本
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../../theme';
import { mergeTDACData } from '../../data/mockTDACData';
import EntryPackService from '../../services/entryPack/EntryPackService';
import SnapshotService from '../../services/snapshot/SnapshotService';

const TDACSelectionScreen = ({ navigation, route }) => {
  const incomingTravelerInfo = (route.params && route.params.travelerInfo) || {};
  const travelerInfo = mergeTDACData(incomingTravelerInfo);

  /**
   * Handle successful TDAC submission by creating/updating entry pack
   * This is called when user returns from successful TDAC submission
   */
  const handleTDACSubmissionSuccess = async (submissionData) => {
    try {
      console.log('🎉 Handling TDAC submission success:', submissionData);

      // Task 4.2: Extract and validate all necessary fields from TDAC submission
      const tdacSubmission = extractTDACSubmissionMetadata(submissionData);

      // Validate metadata completeness (must have arrCardNo and qrUri)
      if (!validateTDACSubmissionMetadata(tdacSubmission)) {
        console.warn('⚠️ Invalid TDAC submission metadata:', tdacSubmission);
        return;
      }

      // Record submission history
      const submissionHistoryEntry = {
        timestamp: tdacSubmission.submittedAt,
        status: 'success',
        method: tdacSubmission.submissionMethod,
        arrCardNo: tdacSubmission.arrCardNo,
        duration: submissionData.duration || null,
        metadata: {
          qrUri: tdacSubmission.qrUri,
          pdfPath: tdacSubmission.pdfPath,
          travelerName: submissionData.travelerName,
          passportNo: submissionData.passportNo,
          arrivalDate: submissionData.arrivalDate
        }
      };

      console.log('📋 Submission history entry:', submissionHistoryEntry);

      // Find or create entry info ID (placeholder - would need actual implementation)
      const entryInfoId = await findOrCreateEntryInfoId(travelerInfo);
      
      if (entryInfoId) {
        // Create or update entry pack
        const entryPack = await EntryPackService.createOrUpdatePack(
          entryInfoId,
          tdacSubmission,
          { submissionMethod: tdacSubmission.submissionMethod }
        );

        console.log('✅ Entry pack created/updated:', {
          entryPackId: entryPack.id,
          arrCardNo: tdacSubmission.arrCardNo,
          status: entryPack.status
        });

        // Task 4.2: Record submission history
        await recordSubmissionHistory(entryPack.id, submissionHistoryEntry);

        // Task 4.3: Create entry pack snapshot immediately after creating entry pack
        await createEntryPackSnapshot(entryPack.id, 'submission', {
          appVersion: '1.0.0', // Would get from app config
          deviceInfo: 'mobile', // Would get from device info
          creationMethod: 'auto',
          submissionMethod: tdacSubmission.submissionMethod
        });

        // TODO: Update EntryInfo status (task 4.4)
        
      } else {
        console.warn('⚠️ Could not find or create entry info ID');
      }

    } catch (error) {
      console.error('❌ Failed to handle TDAC submission success:', error);
      
      // Task 4.1: Handle creation failure cases (show error but don't block user)
      // This is background processing, so we log the error but don't interrupt user flow
      
      // Could optionally show a non-blocking toast notification
      // Toast.show({
      //   type: 'error',
      //   text1: 'Entry Pack Creation Failed',
      //   text2: 'Your TDAC was submitted successfully, but we couldn\'t save the entry pack.',
      //   position: 'bottom',
      //   visibilityTime: 4000,
      // });
      
      // Record the failure for debugging
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const failureLog = {
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          submissionData: JSON.stringify(arguments[0]) // Log the submission data that failed
        };
        
        await AsyncStorage.setItem('entry_pack_creation_failures', JSON.stringify(failureLog));
        console.log('📝 Entry pack creation failure logged');
      } catch (logError) {
        console.error('❌ Failed to log entry pack creation failure:', logError);
      }
    }
  };

  /**
   * Task 4.2: Extract all necessary fields from TDAC API response
   * Standardizes metadata from different submission methods (API/WebView/Hybrid)
   */
  const extractTDACSubmissionMetadata = (submissionData) => {
    return {
      arrCardNo: submissionData.arrCardNo || submissionData.cardNo,
      qrUri: submissionData.qrUri || submissionData.fileUri || submissionData.src,
      pdfPath: submissionData.pdfPath || submissionData.fileUri,
      submittedAt: submissionData.submittedAt || submissionData.timestamp 
        ? new Date(submissionData.submittedAt || submissionData.timestamp).toISOString()
        : new Date().toISOString(),
      submissionMethod: submissionData.submissionMethod || 'unknown'
    };
  };

  /**
   * Task 4.2: Validate metadata completeness (must have arrCardNo and qrUri)
   */
  const validateTDACSubmissionMetadata = (tdacSubmission) => {
    const required = ['arrCardNo', 'qrUri'];
    const missing = required.filter(field => !tdacSubmission[field] || !tdacSubmission[field].trim());
    
    if (missing.length > 0) {
      console.error('❌ Missing required TDAC submission fields:', missing);
      return false;
    }

    // Validate arrCardNo format (should be alphanumeric)
    if (!/^[A-Za-z0-9_]+$/.test(tdacSubmission.arrCardNo)) {
      console.error('❌ Invalid arrCardNo format:', tdacSubmission.arrCardNo);
      return false;
    }

    // Validate qrUri/pdfPath exists
    if (!tdacSubmission.qrUri.includes('file://') && !tdacSubmission.qrUri.startsWith('data:')) {
      console.warn('⚠️ Unusual qrUri format:', tdacSubmission.qrUri);
    }

    return true;
  };

  /**
   * Task 4.2: Record submission history to submissionHistory array
   */
  const recordSubmissionHistory = async (entryPackId, submissionHistoryEntry) => {
    try {
      // This would integrate with EntryPack model to append to submissionHistory array
      console.log('📝 Recording submission history:', {
        entryPackId,
        entry: submissionHistoryEntry
      });
      
      // For now, just log - actual implementation would update EntryPack.submissionHistory
      return true;
    } catch (error) {
      console.error('❌ Failed to record submission history:', error);
      return false;
    }
  };

  /**
   * Task 4.3: Create entry pack snapshot
   * Creates immutable snapshot of entry pack data after successful TDAC submission
   */
  const createEntryPackSnapshot = async (entryPackId, reason = 'submission', metadata = {}) => {
    try {
      console.log('📸 Creating entry pack snapshot:', {
        entryPackId,
        reason,
        metadata
      });

      // Optional: Display snapshot creation progress
      // This could be a toast or loading indicator
      // For now, we'll just log the progress

      console.log('📸 Starting snapshot creation process...');

      // Call SnapshotService to create snapshot
      const snapshot = await SnapshotService.createSnapshot(entryPackId, reason, metadata);

      if (snapshot) {
        console.log('✅ Entry pack snapshot created successfully:', {
          snapshotId: snapshot.snapshotId,
          entryPackId: entryPackId,
          reason: reason,
          photoCount: snapshot.getPhotoCount(),
          createdAt: snapshot.createdAt
        });

        // Optional: Display success notification
        // Toast.show({
        //   type: 'success',
        //   text1: 'Entry Pack Saved',
        //   text2: 'Your travel documents have been securely archived.',
        //   position: 'bottom',
        //   visibilityTime: 3000,
        // });

        return snapshot;
      } else {
        throw new Error('Snapshot creation returned null');
      }

    } catch (error) {
      console.error('❌ Failed to create entry pack snapshot:', error);
      
      // Task 4.3: Handle snapshot creation failure gracefully
      // Don't block the user flow, but log the error for debugging
      
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const failureLog = {
          timestamp: new Date().toISOString(),
          entryPackId,
          reason,
          error: error.message,
          stack: error.stack,
          metadata
        };
        
        await AsyncStorage.setItem('snapshot_creation_failures', JSON.stringify(failureLog));
        console.log('📝 Snapshot creation failure logged');
      } catch (logError) {
        console.error('❌ Failed to log snapshot creation failure:', logError);
      }

      // Optional: Display non-blocking warning
      // Toast.show({
      //   type: 'info',
      //   text1: 'Archive Warning',
      //   text2: 'Documents saved but archival incomplete. Your TDAC is still valid.',
      //   position: 'bottom',
      //   visibilityTime: 4000,
      // });

      return null;
    }
  };

  /**
   * Find or create entry info ID for the traveler
   * This is a placeholder implementation - would need actual logic
   */
  const findOrCreateEntryInfoId = async (travelerInfo) => {
    try {
      // This would need to be implemented based on how entry info is stored
      // For now, return a placeholder ID
      const userId = 'current_user'; // Would get from auth context
      const destinationId = 'thailand';
      
      // Generate a consistent ID based on user and destination
      const entryInfoId = `entry_${userId}_${destinationId}_${Date.now()}`;
      
      console.log('📝 Generated entry info ID:', entryInfoId);
      return entryInfoId;
    } catch (error) {
      console.error('❌ Failed to find/create entry info ID:', error);
      return null;
    }
  };

  // Listen for navigation focus to check for successful submissions
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        // Check AsyncStorage for recent TDAC submissions
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        
        // Check for recent submissions in the last 5 minutes
        const recentSubmissionKey = 'recent_tdac_submission';
        const recentSubmissionData = await AsyncStorage.getItem(recentSubmissionKey);
        
        if (recentSubmissionData) {
          const submissionData = JSON.parse(recentSubmissionData);
          const submissionTime = new Date(submissionData.timestamp || submissionData.submittedAt);
          const now = new Date();
          const timeDiff = now.getTime() - submissionTime.getTime();
          
          // If submission was within last 5 minutes, process it
          if (timeDiff < 5 * 60 * 1000) {
            console.log('🔍 Found recent TDAC submission:', submissionData);
            await handleTDACSubmissionSuccess(submissionData);
            
            // Clear the recent submission flag
            await AsyncStorage.removeItem(recentSubmissionKey);
          }
        }
      } catch (error) {
        console.error('❌ Error checking for recent submissions:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>泰国入境卡提交方式</Text>
        <Text style={styles.headerSubtitle}>请选择提交方式</Text>
      </View>

      {/* Hybrid版本 - 推荐 */}
      <TouchableOpacity 
        style={[styles.card, styles.recommendedCard]}
        onPress={() => navigation.navigate('TDACHybrid', { travelerInfo })}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔥 推荐</Text>
        </View>
        
        <Text style={styles.cardTitle}>⚡ 混合极速版本</Text>
        <Text style={styles.cardSubtitle}>隐藏WebView + 直接API - 最优方案</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>5-8秒</Text>
            <Text style={styles.statLabel}>提交时间</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>95%+</Text>
            <Text style={styles.statLabel}>成功率</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>3倍</Text>
            <Text style={styles.statLabel}>速度提升</Text>
          </View>
        </View>

        <View style={styles.features}>
          <Text style={styles.feature}>⚡ 极速提交（5-8秒）</Text>
          <Text style={styles.feature}>✅ 自动获取Cloudflare Token</Text>
          <Text style={styles.feature}>✅ 直接API调用</Text>
          <Text style={styles.feature}>✅ 无需可见WebView</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.buttonText}>立即使用 →</Text>
        </View>
      </TouchableOpacity>

      {/* WebView版本 - 备用 */}
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('TDACWebView', { travelerInfo })}
      >
        <Text style={styles.cardTitle}>🌐 WebView自动化版本</Text>
        <Text style={styles.cardSubtitle}>网页自动填表方案 - 稳定备用</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.normalStat]}>24秒</Text>
            <Text style={styles.statLabel}>提交时间</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, styles.normalStat]}>85%</Text>
            <Text style={styles.statLabel}>成功率</Text>
          </View>
        </View>

        <View style={styles.features}>
          <Text style={styles.feature}>✅ 完整自动化流程</Text>
          <Text style={styles.feature}>✅ Cloudflare自动检测</Text>
          <Text style={styles.feature}>⚠️ 速度较慢（24秒）</Text>
          <Text style={styles.feature}>⚠️ 依赖网页结构</Text>
        </View>

        <View style={[styles.buttonContainer, styles.secondaryButton]}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>使用备用方案</Text>
        </View>
      </TouchableOpacity>

      {/* 对比说明 */}
      <View style={styles.comparisonSection}>
        <Text style={styles.comparisonTitle}>📊 性能对比</Text>
        
        <View style={styles.comparisonTable}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>速度</Text>
            <Text style={styles.comparisonApi}>5-8秒 ⚡</Text>
            <Text style={styles.comparisonWeb}>24秒</Text>
          </View>
          
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>可靠性</Text>
            <Text style={styles.comparisonApi}>95%+ ✅</Text>
            <Text style={styles.comparisonWeb}>85%</Text>
          </View>
          
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>技术方案</Text>
            <Text style={styles.comparisonApi}>混合 ✅</Text>
            <Text style={styles.comparisonWeb}>纯WebView</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 推荐使用混合极速版本：自动获取Token + 直接API提交 = 最佳体验
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.secondary,
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendedCard: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  normalStat: {
    color: colors.textSecondary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  features: {
    marginBottom: 20,
  },
  feature: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  buttonContainer: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: colors.secondary,
  },
  comparisonSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  comparisonTable: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  comparisonLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
  comparisonApi: {
    flex: 1,
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comparisonWeb: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  footerText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default TDACSelectionScreen;
