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
          title: 'ส่งแล้ว / Submitted',
          description: 'ส่งแบบฟอร์มเข้าเมืองเรียบร้อยแล้ว / Entry card submitted successfully',
        };
      case 'superseded':
        return {
          backgroundColor: colors.warning,
          textColor: colors.surface,
          icon: '⚠',
          title: 'ต้องส่งใหม่ / Resubmission Required',
          description: 'ข้อมูลถูกแก้ไข ต้องส่งแบบฟอร์มเข้าเมืองใหม่ / Information changed, please resubmit entry card',
        };
      case 'expired':
        return {
          backgroundColor: colors.error,
          textColor: colors.surface,
          icon: '⏰',
          title: 'หมดอายุ / Expired',
          description: 'ชุดข้อมูลเข้าเมืองหมดอายุ / Entry pack has expired',
        };
      case 'archived':
        return {
          backgroundColor: colors.textSecondary,
          textColor: colors.surface,
          icon: '📁',
          title: 'เก็บถาวรแล้ว / Archived',
          description: 'ชุดข้อมูลถูกเก็บไว้ในประวัติ / Entry pack archived',
        };
      case 'completed':
        return {
          backgroundColor: colors.success,
          textColor: colors.surface,
          icon: '🎉',
          title: 'เสร็จสมบูรณ์ / Completed',
          description: 'ผ่านด่านเข้าเมืองเรียบร้อย / Successfully entered',
        };
      case 'cancelled':
        return {
          backgroundColor: colors.textSecondary,
          textColor: colors.surface,
          icon: '❌',
          title: 'ยกเลิกแล้ว / Cancelled',
          description: 'ผู้ใช้ยกเลิกชุดข้อมูลนี้แล้ว / Entry pack cancelled by user',
        };
      case 'in_progress':
      default:
        return {
          backgroundColor: colors.primary,
          textColor: colors.surface,
          icon: '⏳',
          title: 'กำลังดำเนินการ / In Progress',
          description: 'กำลังเตรียมชุดข้อมูลเข้าเมือง / Entry pack preparing',
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';

      const thaiDate = `${date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })} ${date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

      const englishDate = `${date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })} ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

      return `${thaiDate} / ${englishDate}`;
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
              เวลาส่ง / Submission Time:
            </Text>
            <Text style={[styles.dateValue, { color: statusConfig.textColor }]}>
              {formatDate(submissionDate)}
            </Text>
          </View>
        )}
        
        {arrivalDate && (
          <View style={styles.dateRow}>
            <Text style={[styles.dateLabel, { color: statusConfig.textColor }]}>
              วันเข้าประเทศ / Arrival Date:
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
            📖 ประวัติ - อ่านอย่างเดียว / History - Read Only
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
