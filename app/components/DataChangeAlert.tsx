/**
 * DataChangeAlert - Component for displaying data change alerts and resubmission warnings
 * Shows when user data has changed after TDAC submission
 * 
 * Requirements: 12.3, 12.4, 13.1-13.6
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import { useLocale } from '../i18n/LocaleContext';

interface DataChangeAlertProps {
  warning: {
    changeSummary: {
      title: string;
      message: string;
      totalChanges: number;
      significantChanges: number;
      minorChanges: number;
      categories: Array<{
        name: string;
        changeCount: number;
        changes: string[];
      }>;
    };
    requiresImmediateResubmission: boolean;
  } | null;
  onResubmit?: (warning: Record<string, unknown>) => void;
  onIgnore?: (warning: Record<string, unknown>) => void;
  onViewDetails?: (warning: Record<string, unknown>) => void;
  visible?: boolean;
  style?: Record<string, unknown>;
}

const DataChangeAlert = ({ 
  warning, 
  onResubmit, 
  onIgnore, 
  onViewDetails, 
  visible = true,
  style 
}: DataChangeAlertProps) => {
  const { t } = useLocale();
  const [showDetails, setShowDetails] = useState(false);

  if (!warning || !visible) {
    return null;
  }

  const { changeSummary, requiresImmediateResubmission } = warning;

  const handleResubmit = () => {
    Alert.alert(
      t('progressiveEntryFlow.dataChange.confirmResubmit.title', { 
        defaultValue: '确认重新提交' 
      }),
      t('progressiveEntryFlow.dataChange.confirmResubmit.message', { 
        defaultValue: '重新提交将使当前入境卡失效，您需要重新生成入境卡。确定要继续吗？' 
      }),
      [
        {
          text: t('common.cancel', { defaultValue: '取消' }),
          style: 'cancel'
        },
        {
          text: t('progressiveEntryFlow.dataChange.resubmit', { defaultValue: '重新提交' }),
          style: 'destructive',
          onPress: () => {
            if (onResubmit) {
              onResubmit(warning);
            }
          }
        }
      ]
    );
  };

  const handleIgnore = () => {
    Alert.alert(
      t('progressiveEntryFlow.dataChange.confirmIgnore.title', { 
        defaultValue: '忽略变更' 
      }),
      t('progressiveEntryFlow.dataChange.confirmIgnore.message', { 
        defaultValue: '忽略变更可能导致入境时信息不匹配。建议重新提交以确保信息准确。确定要忽略吗？' 
      }),
      [
        {
          text: t('common.cancel', { defaultValue: '取消' }),
          style: 'cancel'
        },
        {
          text: t('progressiveEntryFlow.dataChange.ignore', { defaultValue: '忽略变更' }),
          style: 'default',
          onPress: () => {
            if (onIgnore) {
              onIgnore(warning);
            }
          }
        }
      ]
    );
  };

  const handleViewDetails = () => {
    setShowDetails(true);
    if (onViewDetails) {
      onViewDetails(warning);
    }
  };

  const renderDetailsModal = () => (
    <Modal
      visible={showDetails}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetails(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {t('progressiveEntryFlow.dataChange.detailsTitle', { 
              defaultValue: '变更详情' 
            })}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowDetails(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>{changeSummary.title}</Text>
            <Text style={styles.summaryMessage}>{changeSummary.message}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{changeSummary.totalChanges}</Text>
                <Text style={styles.statLabel}>
                  {t('progressiveEntryFlow.dataChange.totalChanges', { 
                    defaultValue: '总变更' 
                  })}
                </Text>
              </View>
              
              {changeSummary.significantChanges > 0 && (
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.significantStat]}>
                    {changeSummary.significantChanges}
                  </Text>
                  <Text style={styles.statLabel}>
                    {t('progressiveEntryFlow.dataChange.significantChanges', { 
                      defaultValue: '重要变更' 
                    })}
                  </Text>
                </View>
              )}
              
              {changeSummary.minorChanges > 0 && (
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, styles.minorStat]}>
                    {changeSummary.minorChanges}
                  </Text>
                  <Text style={styles.statLabel}>
                    {t('progressiveEntryFlow.dataChange.minorChanges', { 
                      defaultValue: '轻微变更' 
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {changeSummary.categories.map((category: { name: string; changeCount: number; changes: string[] }, index: number) => (
            <View key={index} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>
                {category.name} ({category.changeCount} 项变更)
              </Text>
              
              {category.changes.map((change: string, changeIndex: number) => (
                <View key={changeIndex} style={styles.changeItem}>
                  <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={[styles.modalButton, styles.resubmitButton]}
            onPress={() => {
              setShowDetails(false);
              handleResubmit();
            }}
          >
            <Text style={styles.resubmitButtonText}>
              {t('progressiveEntryFlow.dataChange.resubmit', { 
                defaultValue: '重新提交' 
              })}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.ignoreButton]}
            onPress={() => {
              setShowDetails(false);
              handleIgnore();
            }}
          >
            <Text style={styles.ignoreButtonText}>
              {t('progressiveEntryFlow.dataChange.ignore', { 
                defaultValue: '忽略变更' 
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={[styles.container, style]}>
        <View style={[
          styles.alertCard,
          requiresImmediateResubmission ? styles.urgentAlert : styles.warningAlert
        ]}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>
              {requiresImmediateResubmission ? '🚨' : '⚠️'}
            </Text>
            <View style={styles.alertContent}>
              <Text style={[
                styles.alertTitle,
                requiresImmediateResubmission ? styles.urgentTitle : styles.warningTitle
              ]}>
                {changeSummary.title}
              </Text>
              <Text style={styles.alertMessage}>
                {changeSummary.message}
              </Text>
            </View>
          </View>

          <View style={styles.alertActions}>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={handleViewDetails}
            >
              <Text style={styles.detailsButtonText}>
                {t('progressiveEntryFlow.dataChange.viewDetails', { 
                  defaultValue: '查看详情' 
                })}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.resubmitActionButton]}
                onPress={handleResubmit}
              >
                <Text style={styles.resubmitActionText}>
                  {t('progressiveEntryFlow.dataChange.resubmit', { 
                    defaultValue: '重新提交' 
                  })}
                </Text>
              </TouchableOpacity>

              {!requiresImmediateResubmission && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.ignoreActionButton]}
                  onPress={handleIgnore}
                >
                  <Text style={styles.ignoreActionText}>
                    {t('progressiveEntryFlow.dataChange.ignore', { 
                      defaultValue: '忽略' 
                    })}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {renderDetailsModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  alertCard: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentAlert: {
    backgroundColor: '#FFF5F5',
    borderColor: colors.error,
  },
  warningAlert: {
    backgroundColor: '#FFFBF0',
    borderColor: colors.warning,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typography.h4,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  urgentTitle: {
    color: colors.error,
  },
  warningTitle: {
    color: colors.warning,
  },
  alertMessage: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  alertActions: {
    gap: spacing.sm,
  },
  detailsButton: {
    alignSelf: 'flex-start',
  },
  detailsButtonText: {
    ...typography.body2,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  resubmitActionButton: {
    backgroundColor: colors.primary,
  },
  ignoreActionButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resubmitActionText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '600',
  },
  ignoreActionText: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h2,
    fontWeight: 'bold',
    color: colors.primary,
  },
  significantStat: {
    color: colors.error,
  },
  minorStat: {
    color: colors.warning,
  },
  statLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  changeItem: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  changeText: {
    ...typography.body2,
    color: colors.text,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  resubmitButton: {
    backgroundColor: colors.primary,
  },
  ignoreButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resubmitButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  ignoreButtonText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default DataChangeAlert;