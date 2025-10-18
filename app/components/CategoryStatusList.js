// 入境通 - Category Status List Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

const CategoryStatusItem = ({ 
  category, 
  onPress,
  showMissingFields = true 
}) => {
  const { 
    name, 
    icon, 
    status, 
    completedCount, 
    totalCount, 
    missingFields = [] 
  } = category;

  // Get status icon and color
  const getStatusInfo = () => {
    switch (status) {
      case 'complete':
        return {
          icon: '✓',
          color: colors.success,
          backgroundColor: '#E8F9F0',
        };
      case 'partial':
        return {
          icon: '⚠️',
          color: colors.warning,
          backgroundColor: '#FFF7E6',
        };
      case 'missing':
      default:
        return {
          icon: '❌',
          color: colors.error,
          backgroundColor: '#FFF2F2',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity 
      style={[styles.categoryItem, { backgroundColor: statusInfo.backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryIcon}>{icon}</Text>
          <Text style={styles.categoryName}>{name}</Text>
        </View>

        <View style={styles.categoryMetaContainer}>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusIcon, { color: statusInfo.color }]}>
              {statusInfo.icon}
            </Text>
            <Text style={styles.fieldCount}>
              {completedCount}/{totalCount}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </View>
      </View>

      {/* Missing fields hint */}
      {showMissingFields && status !== 'complete' && missingFields.length > 0 && (
        <View style={styles.missingFieldsContainer}>
          <Text style={styles.missingFieldsLabel}>
            缺少字段:
          </Text>
          <Text style={styles.missingFieldsText}>
            {missingFields.slice(0, 3).join(', ')}
            {missingFields.length > 3 && ` 等${missingFields.length - 3}个字段`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const CategoryStatusList = ({ 
  categories = [], 
  onCategoryPress,
  showMissingFields = true 
}) => {
  return (
    <View style={styles.container}>
      {categories.map((category, index) => (
        <CategoryStatusItem
          key={category.id || index}
          category={category}
          onPress={() => onCategoryPress && onCategoryPress(category)}
          showMissingFields={showMissingFields}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  categoryItem: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: spacing.md,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  categoryName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldCount: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  missingFieldsContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  missingFieldsLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  missingFieldsText: {
    ...typography.body2,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  arrow: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '300',
    paddingLeft: spacing.xs,
  },
});

export default CategoryStatusList;
