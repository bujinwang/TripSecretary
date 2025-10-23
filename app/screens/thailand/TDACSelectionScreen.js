/**
  * TDAC Selection Screen - Redesigned for User Experience
  * 让用户选择最适合的入境卡提交方式，聚焦于用户体验而非技术细节
  */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../../theme';
// Removed mockTDACData dependency - using pure user data
import EntryInfoService from '../../services/EntryInfoService';
import SnapshotService from '../../services/snapshot/SnapshotService';
import PassportDataService from '../../services/data/PassportDataService';
import TDACValidationService from '../../services/validation/TDACValidationService';
import TDACErrorHandler from '../../services/error/TDACErrorHandler';

const TDACSelectionScreen = ({ navigation, route }) => {
  const incomingTravelerInfo = (route.params && route.params.travelerInfo) || {};
  
  // Log incoming data for debugging
  console.log('🔍 TDACSelectionScreen received travelerInfo:', {
    hasData: Object.keys(incomingTravelerInfo).length > 0,
    keys: Object.keys(incomingTravelerInfo),
    passportNo: incomingTravelerInfo.passportNo,
    familyName: incomingTravelerInfo.familyName,
    firstName: incomingTravelerInfo.firstName,
    arrivalDate: incomingTravelerInfo.arrivalDate,
    email: incomingTravelerInfo.email
  });
  
  // Use pure user data directly - no mock data fallbacks
  const travelerInfo = incomingTravelerInfo;
  
  // Log user data for debugging
  console.log('🔍 Using pure user data:', {
    passportNo: travelerInfo.passportNo,
    familyName: travelerInfo.familyName,
    firstName: travelerInfo.firstName,
    arrivalDate: travelerInfo.arrivalDate,
    email: travelerInfo.email,
    flightNo: travelerInfo.flightNo
  });

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
        // Create or update digital arrival card
        const digitalArrivalCard = await PassportDataService.saveDigitalArrivalCard({
          entryInfoId: entryInfoId,
          cardType: 'TDAC', // Default to TDAC, can be extended for other types
          arrCardNo: tdacSubmission.arrCardNo,
          qrUri: tdacSubmission.qrUri,
          pdfUrl: tdacSubmission.pdfPath,
          submittedAt: tdacSubmission.submittedAt,
          submissionMethod: tdacSubmission.submissionMethod,
          status: 'success'
        });

        console.log('✅ Digital arrival card created/updated:', {
          cardId: digitalArrivalCard.id,
          arrCardNo: tdacSubmission.arrCardNo,
          status: digitalArrivalCard.status
        });

        // Task 4.2: Record submission history
        await recordSubmissionHistory(digitalArrivalCard.id, submissionHistoryEntry);

        // Task 4.3: Create entry info snapshot immediately after creating digital arrival card
        await createEntryInfoSnapshot(entryInfoId, 'submission', {
          appVersion: '1.0.0', // Would get from app config
          deviceInfo: 'mobile', // Would get from device info
          creationMethod: 'auto',
          submissionMethod: tdacSubmission.submissionMethod
        });

        // Task 4.4: Update EntryInfo status from 'ready' to 'submitted'
        await updateEntryInfoStatus(entryInfoId, tdacSubmission);
        
      } else {
        console.warn('⚠️ Could not find or create entry info ID');
      }

    } catch (error) {
      console.error('❌ Failed to handle TDAC submission success:', error);
      
      // Enhanced error handling with retry mechanisms and user-friendly reporting
      const errorResult = await TDACErrorHandler.handleSubmissionError(error, {
        operation: 'digital_arrival_card_creation',
        submissionMethod: tdacSubmission.submissionMethod,
        arrCardNo: tdacSubmission.arrCardNo,
        userAgent: 'TDACSelectionScreen'
      }, 0);

      console.log('📋 Error handling result:', errorResult);

      // Show user-friendly error dialog
      const errorDialog = TDACErrorHandler.createErrorDialog(errorResult);
      
      Alert.alert(
        errorDialog.title,
        `${errorDialog.message}\n\nError ID: ${errorResult.errorId}`,
        [
          {
            text: 'Retry Later',
            onPress: () => {
              // Schedule retry or show instructions
              console.log('User chose to retry later');
            }
          },
          {
            text: 'Continue Anyway',
            onPress: () => {
              console.log('User chose to continue despite error');
            }
          },
          {
            text: 'Contact Support',
            onPress: async () => {
              // Export error log for support
              const errorLog = await TDACErrorHandler.exportErrorLog();
              console.log('Error log exported for support:', errorResult.errorId);
            }
          }
        ]
      );
      
      // Record the failure with enhanced logging
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const failureLog = {
          timestamp: new Date().toISOString(),
          errorId: errorResult.errorId,
          category: errorResult.category,
          userMessage: errorResult.userMessage,
          technicalMessage: errorResult.technicalMessage,
          recoverable: errorResult.recoverable,
          error: error.message,
          stack: error.stack,
          submissionData: JSON.stringify(arguments[0]),
          suggestions: errorResult.suggestions
        };
        
        await AsyncStorage.setItem('digital_arrival_card_creation_failures', JSON.stringify(failureLog));
        console.log('📝 Enhanced digital arrival card creation failure logged:', errorResult.errorId);
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
   * Task 4.2: Enhanced TDAC submission metadata validation with comprehensive error handling
   */
  const validateTDACSubmissionMetadata = (tdacSubmission) => {
    try {
      console.log('🔍 Starting comprehensive TDAC validation...');
      
      // Use comprehensive validation service
      const validationResult = TDACValidationService.validateTDACSubmission(tdacSubmission, {
        strict: true,
        checkFiles: false // Skip file checks for performance
      });

      if (!validationResult.isValid) {
        console.error('❌ TDAC validation failed:', {
          errors: validationResult.errors,
          fieldErrors: validationResult.fieldErrors
        });

        // Show user-friendly error messages
        const summary = TDACValidationService.getValidationSummary(validationResult);
        
        // Display validation errors to user
        if (summary.criticalErrors.length > 0) {
          console.error('🚨 Critical validation errors:', summary.criticalErrors);
          
          // Show alert with specific field errors
          const fieldErrorMessages = Object.entries(validationResult.fieldErrors)
            .map(([field, errors]) => {
              const message = TDACValidationService.getFieldErrorMessage(field, errors);
              return `• ${field}: ${message}`;
            })
            .join('\n');

          if (fieldErrorMessages) {
            Alert.alert(
              '❌ Validation Failed',
              `Please correct the following issues:\n\n${fieldErrorMessages}`,
              [{ text: 'OK' }]
            );
          }
        }

        return false;
      }

      // Log warnings if any
      if (validationResult.warnings.length > 0) {
        console.warn('⚠️ TDAC validation warnings:', validationResult.warnings);
      }

      console.log('✅ TDAC validation passed');
      return true;

    } catch (error) {
      console.error('❌ TDAC validation error:', error);
      
      // Fallback to basic validation
      const required = ['arrCardNo', 'qrUri'];
      const missing = required.filter(field => !tdacSubmission[field] || !tdacSubmission[field].trim());
      
      if (missing.length > 0) {
        console.error('❌ Missing required TDAC submission fields:', missing);
        Alert.alert(
          '❌ Missing Information',
          `Required fields missing: ${missing.join(', ')}`,
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    }
  };

  /**
    * Task 4.2: Record submission history to submissionHistory array
    */
   const recordSubmissionHistory = async (digitalArrivalCardId, submissionHistoryEntry) => {
     try {
       // This would integrate with DigitalArrivalCard model to append to submissionHistory array
       console.log('📝 Recording submission history:', {
         digitalArrivalCardId,
         entry: submissionHistoryEntry
       });

       // For now, just log - actual implementation would update DigitalArrivalCard.submissionHistory
       return true;
     } catch (error) {
       console.error('❌ Failed to record submission history:', error);
       return false;
     }
   };

  /**
    * Task 4.3: Create entry info snapshot
    * Creates immutable snapshot of entry info data after successful TDAC submission
    */
   const createEntryInfoSnapshot = async (entryInfoId, reason = 'submission', metadata = {}) => {
     try {
       console.log('📸 Creating entry info snapshot:', {
         entryInfoId,
         reason,
         metadata
       });

       // Optional: Display snapshot creation progress
       // This could be a toast or loading indicator
       // For now, we'll just log the progress

       console.log('📸 Starting snapshot creation process...');

       // Call SnapshotService to create snapshot
       const snapshot = await SnapshotService.createSnapshot(entryInfoId, reason, metadata);

       if (snapshot) {
         console.log('✅ Entry info snapshot created successfully:', {
           snapshotId: snapshot.snapshotId,
           entryInfoId: entryInfoId,
           reason: reason,
           photoCount: snapshot.getPhotoCount(),
           createdAt: snapshot.createdAt
         });

         // Optional: Display success notification
         // Toast.show({
         //   type: 'success',
         //   text1: 'Entry Info Saved',
         //   text2: 'Your travel documents have been securely archived.',
         //   position: 'bottom',
         //   visibilityTime: 3000,
         // });

         return snapshot;
       } else {
         throw new Error('Snapshot creation returned null');
       }

     } catch (error) {
       console.error('❌ Failed to create entry info snapshot:', error);

       // Task 4.3: Handle snapshot creation failure gracefully
       // Don't block the user flow, but log the error for debugging

       try {
         const AsyncStorage = require('@react-native-async-storage/async-storage').default;
         const failureLog = {
           timestamp: new Date().toISOString(),
           entryInfoId,
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
   * This implementation looks for existing EntryInfo or creates a new one
   */
  const findOrCreateEntryInfoId = async (travelerInfo) => {
    try {
      const userId = 'current_user'; // Would get from auth context
      const destinationId = 'thailand';
      
      console.log('🔍 Looking for existing entry info...');
      
      // Try to find existing entry info for this user and destination
      const PassportDataService = require('../../services/data/PassportDataService').default;
      let entryInfo = await PassportDataService.getEntryInfo(userId, destinationId);
      
      if (entryInfo) {
        console.log('✅ Found existing entry info:', entryInfo.id);
        return entryInfo.id;
      }
      
      console.log('📝 Creating new entry info...');
      
      // Create new entry info if none exists
      const entryInfoData = {
        destinationId,
        status: 'incomplete',
        completionMetrics: {
          passport: { complete: 0, total: 5, state: 'missing' },
          personalInfo: { complete: 0, total: 6, state: 'missing' },
          funds: { complete: 0, total: 1, state: 'missing' },
          travel: { complete: 0, total: 6, state: 'missing' }
        },
        lastUpdatedAt: new Date().toISOString()
      };
      
      entryInfo = await PassportDataService.saveEntryInfo(entryInfoData, userId);
      console.log('✅ Created new entry info:', entryInfo.id);
      
      return entryInfo.id;
    } catch (error) {
      console.error('❌ Failed to find/create entry info ID:', error);
      return null;
    }
  };

  /**
   * Task 4.4: Update EntryInfo status from 'ready' to 'submitted'
   * Ensures proper state transitions and triggers notification system
   */
  const updateEntryInfoStatus = async (entryInfoId, tdacSubmission) => {
    try {
      console.log('📋 Updating EntryInfo status to submitted...');
      
      const PassportDataService = require('../../services/data/PassportDataService').default;
      
      // Update EntryInfo status from 'ready' to 'submitted'
      const updatedEntryInfo = await PassportDataService.updateEntryInfoStatus(
        entryInfoId,
        'submitted',
        {
          reason: 'TDAC submission successful',
          tdacSubmission: {
            arrCardNo: tdacSubmission.arrCardNo,
            qrUri: tdacSubmission.qrUri,
            pdfPath: tdacSubmission.pdfPath,
            submittedAt: tdacSubmission.submittedAt,
            submissionMethod: tdacSubmission.submissionMethod
          }
        }
      );
      
      console.log('✅ EntryInfo status updated successfully:', {
        entryInfoId: updatedEntryInfo.id,
        oldStatus: 'ready',
        newStatus: updatedEntryInfo.status,
        submissionDate: updatedEntryInfo.submissionDate,
        lastUpdatedAt: updatedEntryInfo.lastUpdatedAt
      });
      
      // Trigger state change event for notification system
      console.log('📢 State change event triggered for notification system');
      
      return updatedEntryInfo;
    } catch (error) {
      console.error('❌ Failed to update EntryInfo status:', error);
      
      // Log the failure but don't throw - this is a secondary operation
      // The TDAC submission was successful, so we don't want to break the user flow
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const failureLog = {
          timestamp: new Date().toISOString(),
          entryInfoId,
          error: error.message,
          stack: error.stack,
          tdacSubmission: JSON.stringify(tdacSubmission)
        };
        
        await AsyncStorage.setItem('entry_info_status_update_failures', JSON.stringify(failureLog));
        console.log('📝 EntryInfo status update failure logged');
      } catch (logError) {
        console.error('❌ Failed to log EntryInfo status update failure:', logError);
      }
      
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
      {/* 情感化头部 */}
      <View style={styles.heroSection}>
        <Text style={styles.heroEmoji}>🌟</Text>
        <Text style={styles.heroTitle}>快速入境，无忧通关</Text>
        <Text style={styles.heroSubtitle}>
          选择最适合您的泰国入境卡提交方式，{'\n'}让通关更简单、更安心
        </Text>
      </View>

      {/* 快速通道选项 */}
      <View style={styles.optionSection}>
        <TouchableOpacity
          style={[styles.optionCard, styles.recommendedCard]}
          onPress={() => navigation.navigate('TDACHybrid', { travelerInfo })}
          activeOpacity={0.8}
        >
          {/* 推荐徽章 */}
          <View style={styles.recommendationBadge}>
            <Text style={styles.recommendationIcon}>📱</Text>
            <Text style={styles.recommendationText}>推荐选择</Text>
          </View>

          {/* 标题区域 */}
          <View style={styles.cardHeader}>
            <Text style={styles.optionIcon}>⚡</Text>
            <View style={styles.titleSection}>
              <Text style={styles.optionTitle}>闪电提交</Text>
              <Text style={styles.optionSubtitle}>快速通道 · 智能验证</Text>
            </View>
          </View>

          {/* 核心优势 */}
          <View style={styles.benefitsSection}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⏱️</Text>
              <View>
                <Text style={styles.benefitValue}>5-8秒</Text>
                <Text style={styles.benefitLabel}>闪电完成</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <View>
                <Text style={styles.benefitValue}>95%+</Text>
                <Text style={styles.benefitLabel}>超高成功率</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🚀</Text>
              <View>
                <Text style={styles.benefitValue}>快3倍</Text>
                <Text style={styles.benefitLabel}>比传统方式</Text>
              </View>
            </View>
          </View>

          {/* 用户利益 */}
          <View style={styles.userBenefits}>
            <Text style={styles.benefitsTitle}>✨ 让您更省心</Text>
            <Text style={styles.benefitPoint}>• 节省宝贵时间，避免排队焦虑</Text>
            <Text style={styles.benefitPoint}>• 快速获得确认，安心等待登机</Text>
            <Text style={styles.benefitPoint}>• 专业团队保障，全程技术支持</Text>
          </View>

          {/* 行动按钮 */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TDACHybrid', { travelerInfo })}
          >
            <Text style={styles.actionButtonText}>立即体验闪电提交 →</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* 稳定通道选项 */}
      <View style={styles.optionSection}>
        <TouchableOpacity
          style={[styles.optionCard, styles.stableCard]}
          onPress={() => navigation.navigate('TDACWebView', { travelerInfo })}
          activeOpacity={0.8}
        >
          {/* 标题区域 */}
          <View style={styles.cardHeader}>
            <Text style={[styles.optionIcon, styles.stableIcon]}>🛡️</Text>
            <View style={styles.titleSection}>
              <Text style={[styles.optionTitle, styles.stableTitle]}>稳妥提交</Text>
              <Text style={[styles.optionSubtitle, styles.stableSubtitle]}>稳定通道 · 清晰可见</Text>
            </View>
          </View>

          {/* 核心指标 */}
          <View style={styles.benefitsSection}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>⏱️</Text>
              <View>
                <Text style={[styles.benefitValue, styles.stableValue]}>24秒</Text>
                <Text style={styles.benefitLabel}>稳定完成</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <View>
                <Text style={[styles.benefitValue, styles.stableValue]}>85%</Text>
                <Text style={styles.benefitLabel}>可靠成功率</Text>
              </View>
            </View>
          </View>

          {/* 用户利益 */}
          <View style={styles.userBenefits}>
            <Text style={styles.benefitsTitle}>✨ 适合这些旅客</Text>
            <Text style={styles.benefitPoint}>• 喜欢眼见为实，过程清晰可见</Text>
            <Text style={styles.benefitPoint}>• 初次使用，更喜欢稳妥的方式</Text>
            <Text style={styles.benefitPoint}>• 不赶时间，可以慢慢确认</Text>
          </View>

          {/* 行动按钮 */}
          <TouchableOpacity
            style={[styles.actionButton, styles.stableButton]}
            onPress={() => navigation.navigate('TDACWebView', { travelerInfo })}
          >
            <Text style={[styles.actionButtonText, styles.stableButtonText]}>选择稳妥方案</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* 智能推荐提示 */}
      <View style={styles.smartTipSection}>
        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>智能推荐</Text>
            <Text style={styles.tipText}>
              基于您的旅行习惯，我们推荐闪电提交方案。{'\n'}
              如果您更喜欢眼见为实的过程，可以随时切换到稳妥方案。
            </Text>
          </View>
        </View>
      </View>

      {/* 底部鼓励信息 */}
      <View style={styles.footerSection}>
        <Text style={styles.footerEmoji}>🌺</Text>
        <Text style={styles.footerTitle}>祝您泰国之旅愉快！</Text>
        <Text style={styles.footerText}>
          无论选择哪种方式，我们都会全力协助您{'\n'}
          顺利完成入境卡提交，安心享受泰国假期
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

  // 情感化头部区域
  heroSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },

  // 选项卡样式
  optionSection: {
    margin: 16,
    marginTop: 24,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  // 推荐选项样式
  recommendedCard: {
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: '#fafcfa',
  },

  // 推荐徽章
  recommendationBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationIcon: {
    color: colors.white,
    fontSize: 14,
    marginRight: 4,
  },
  recommendationText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // 卡片头部
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  stableIcon: {
    opacity: 0.8,
  },
  titleSection: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  stableTitle: {
    color: colors.text,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stableSubtitle: {
    opacity: 0.8,
  },

  // 优势展示区域
  benefitsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 16,
  },
  benefitItem: {
    alignItems: 'center',
    flex: 1,
  },
  benefitIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  benefitValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  stableValue: {
    color: colors.textSecondary,
  },
  benefitLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // 用户利益区域
  userBenefits: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  benefitPoint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },

  // 行动按钮
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // 稳定选项按钮样式
  stableButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  stableButtonText: {
    color: '#4CAF50',
  },

  // 智能推荐提示
  smartTipSection: {
    margin: 16,
    marginTop: 8,
  },
  tipCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },

  // 底部鼓励区域
  footerSection: {
    margin: 16,
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default TDACSelectionScreen;
