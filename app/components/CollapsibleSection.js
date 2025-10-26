// 入境通 - CollapsibleSection Component
// Collapsible section with field count badge and completion status indicators
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const CollapsibleSection = ({
  title,
  children,
  fieldCount = { filled: 0, total: 0 },
  expanded = false,
  onToggle,
  style,
  headerStyle,
  contentStyle,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);
  
  const handleToggle = () => {
    if (Platform.OS === 'ios') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    if (onToggle) {
      onToggle(newExpanded);
    }
  };

  const isComplete = fieldCount.filled === fieldCount.total && fieldCount.total > 0;
  const hasProgress = fieldCount.filled > 0;

  const getBadgeStyle = () => {
    if (isComplete) {
      return styles.badgeComplete;
    } else if (hasProgress) {
      return styles.badgeIncomplete;
    } else {
      return styles.badgeEmpty;
    }
  };

  const getBadgeTextStyle = () => {
    if (isComplete) {
      return styles.badgeTextComplete;
    } else if (hasProgress) {
      return styles.badgeTextIncomplete;
    } else {
      return styles.badgeTextEmpty;
    }
  };

  const getChevronRotation = () => {
    return isExpanded ? '180deg' : '0deg';
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.header, headerStyle]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.headerRight}>
            {/* Field count badge */}
            <View style={[styles.badge, getBadgeStyle()]}>
              <Text style={[styles.badgeText, getBadgeTextStyle()]}>
                {fieldCount.filled}/{fieldCount.total}
              </Text>
            </View>
            
            {/* Chevron icon */}
            <Animated.View
              style={[
                styles.chevron,
                {
                  transform: [{ rotate: getChevronRotation() }],
                },
              ]}
            >
              <Text style={styles.chevronText}>▼</Text>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Collapsible content */}
      {isExpanded && (
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  
  header: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  title: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    minWidth: 40,
    alignItems: 'center',
  },
  
  badgeComplete: {
    backgroundColor: colors.success,
  },
  
  badgeIncomplete: {
    backgroundColor: colors.warning,
  },
  
  badgeEmpty: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  badgeTextComplete: {
    color: colors.white,
  },
  
  badgeTextIncomplete: {
    color: colors.white,
  },
  
  badgeTextEmpty: {
    color: colors.textSecondary,
  },
  
  chevron: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  chevronText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default CollapsibleSection;
