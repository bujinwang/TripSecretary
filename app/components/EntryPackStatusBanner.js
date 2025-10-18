import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const EntryPackStatusBanner = ({ 
  status, 
  submissionDate, 
  arrivalDate, 
  isReadOnly = false 
}) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'submitted':
        return {
          backgroundColor: colors.success,
          textColor: colors.surface,
          icon: '✓',
          title: '已提交',
          description: '入境卡已成功提交',
        };
      case 'superseded':
        return {
          backgroundColor: colors.warning,
          textColor: colors.surface,
          icon: '⚠',
          title: '需要重新提交',
          description: '信息已修改，需要重新提交入境卡',
        };
      case 'expired':
        return {
          backgroundColor: colors.error,
          textColor: colors.surface,
          icon: '⏰',
          title: '已过期',
          description: '入境包已过期',
        };
      case 'archived':
        return {
          backgroundColor: colors.textSecondary,
          textColor: colors.surface,
          icon: '📁',
          title: '已归档',
          description: '入境包已归档到历史记录',
        };
      case 'completed':
        return {
          backgroundColor: colors.success,
          textColor: colors.surface,
          icon: '🎉',
          title: '已完成',
          description: '已成功入境',
        };
      case 'cancelled':
        return {
          backgroundColor: colors.textSecondary,
          textColor: colors.surface,
          icon: '❌',
          title: '已取消',
          description: '用户已取消此入境包',
        };
      case 'in_progress':
      default:
        return {
          backgroundColor: colors.primary,
          textColor: colors.surface,
          icon: '⏳',
          title: '进行中',
          description: '入境包准备中',
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <View style={[styles.container, { backgroundColor: statusConfig.backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: statusConfig.textColor }]}>
          {statusConfig.icon}
        </Text>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: statusConfig.textColor }]}>
            {statusConfig.title}
          </Text>
          <Text style={[styles.description, { color: statusConfig.textColor }]}>
            {statusConfig.description}
          </Text>
        </View>
      </View>

      {/* Date Information */}
      <View style={styles.dateContainer}>
        {submissionDate && (
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: statusConfig.textColor }]}>
              提交时间:
            </Text>
            <Text style={[styles.dateValue, { color: statusConfig.textColor }]}>
              {formatDate(submissionDate)}
            </Text>
          </View>
        )}
        
        {arrivalDate && (
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: statusConfig.textColor }]}>
              入境日期:
            </Text>
            <Text style={[styles.dateValue, { color: statusConfig.textColor }]}>
              {formatDate(arrivalDate)}
            </Text>
          </View>
        )}
      </View>

      {/* Read-only indicator */}
      {isReadOnly && (
        <View style={styles.readOnlyIndicator}>
          <Text style={[styles.readOnlyText, { color: statusConfig.textColor }]}>
            📖 历史记录 - 只读
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: 12,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    opacity: 0.9,
  },
  dateContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateLabel: {
    ...typography.caption,
    opacity: 0.8,
  },
  dateValue: {
    ...typography.caption,
    fontWeight: '500',
  },
  readOnlyIndicator: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  readOnlyText: {
    ...typography.caption,
    fontWeight: '600',
    opacity: 0.9,
  },
});

export default EntryPackStatusBanner;