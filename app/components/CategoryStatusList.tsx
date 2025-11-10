// 入境通 - Category Status List Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

type CategoryStatus = 'complete' | 'partial' | 'missing';

export interface CategorySummary {
  id?: string;
  name: string;
  icon?: string;
  status: CategoryStatus;
  completedCount: number;
  totalCount: number;
  missingFields?: string[];
}

export interface CategoryStatusListProps {
  categories?: CategorySummary[];
  onCategoryPress?: (category: CategorySummary) => void;
  showMissingFields?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface CategoryStatusItemProps {
  category: CategorySummary;
  onPress?: () => void;
  showMissingFields: boolean;
  style?: StyleProp<ViewStyle>;
}

interface StatusInfo {
  icon: string;
  color: string;
  backgroundColor: string;
}

const STATUS_INFO: Record<CategoryStatus, StatusInfo> = {
  complete: {
    icon: '✓',
    color: colors.success,
    backgroundColor: '#E8F9F0',
  },
  partial: {
    icon: '⚠️',
    color: colors.warning,
    backgroundColor: '#FFF7E6',
  },
  missing: {
    icon: '❌',
    color: colors.error,
    backgroundColor: '#FFF2F2',
  },
};

const CategoryStatusItem: React.FC<CategoryStatusItemProps> = ({
  category,
  onPress,
  showMissingFields,
  style,
}) => {
  const {
    name,
    icon,
    status,
    completedCount,
    totalCount,
    missingFields = [],
  } = category;

  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.missing;

  return (
    <TouchableOpacity
      style={[styles.categoryItem, { backgroundColor: statusInfo.backgroundColor }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleContainer}>
          {icon ? <Text style={styles.categoryIcon}>{icon}</Text> : null}
          <Text style={styles.categoryName}>{name}</Text>
        </View>

        <View style={styles.categoryMetaContainer}>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusIcon, { color: statusInfo.color }]}>{statusInfo.icon}</Text>
            <Text style={styles.fieldCount}>
              {completedCount}/{totalCount}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </View>
      </View>

      {showMissingFields && status !== 'complete' && missingFields.length > 0 ? (
        <View style={styles.missingFieldsContainer}>
          <Text style={styles.missingFieldsLabel}>还差这些信息 🌟</Text>
          <Text style={styles.missingFieldsText}>
            {missingFields.slice(0, 3).join(', ')}
            {missingFields.length > 3 ? ` 等${missingFields.length - 3}个信息` : ''}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const CategoryStatusList: React.FC<CategoryStatusListProps> = ({
  categories = [],
  onCategoryPress,
  showMissingFields = true,
  style,
}) => (
  <View style={[styles.container, style]}>
    {categories.map((category, index) => (
      <CategoryStatusItem
        key={category.id ?? index.toString()}
        category={category}
        onPress={onCategoryPress ? () => onCategoryPress(category) : undefined}
        showMissingFields={showMissingFields}
        style={index < categories.length - 1 ? styles.itemSpacing : undefined}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
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
    marginRight: spacing.xs,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: spacing.xs,
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
  itemSpacing: {
    marginBottom: spacing.sm,
  },
});

export default CategoryStatusList;
