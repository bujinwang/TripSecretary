/**
 * StatusCard Component - Category completion cards
 * Enhanced with better visual hierarchy, progress bar, and hover states
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, spacing, borderRadius, shadows, typography } from '../../theme/designTokens';
import { createAnimationValue, ANIMATIONS } from '../../utils/animations';

const StatusCard = ({
  title,
  icon,
  status,              // 'complete' | 'incomplete' | 'partial'
  progress,            // 0-100
  onPress,
  variant = 'default', // 'default' | 'compact'
  showChevron = true,
  disabled = false,
  style,
}) => {
  const scaleAnim = useRef(createAnimationValue(1)).current;
  const progressAnim = useRef(createAnimationValue(0)).current;

  // Animate progress bar on mount and when progress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: ANIMATIONS.duration.slow,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  // Get status colors and indicators
  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
        return {
          backgroundColor: designTokens.readyState,
          borderColor: designTokens.success,
          textColor: designTokens.success,
          indicator: '✓',
          indicatorColor: designTokens.success,
          progressColor: designTokens.success,
          badgeGradient: [designTokens.success, designTokens.primaryDark],
        };
      case 'partial':
        return {
          backgroundColor: designTokens.progressState,
          borderColor: designTokens.warning,
          textColor: designTokens.warning,
          indicator: '◐',
          indicatorColor: designTokens.warning,
          progressColor: designTokens.warning,
          badgeGradient: [designTokens.accent, designTokens.accentDark],
        };
      case 'incomplete':
      default:
        return {
          backgroundColor: designTokens.surface,
          borderColor: designTokens.border,
          textColor: designTokens.textSecondary,
          indicator: '○',
          indicatorColor: designTokens.textTertiary,
          progressColor: designTokens.border,
          badgeGradient: [designTokens.textTertiary, designTokens.border],
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isCompact = variant === 'compact';
  
  // Calculate progress bar width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: statusConfig.backgroundColor,
            borderColor: statusConfig.borderColor,
          },
          isCompact && styles.containerCompact,
          disabled && styles.containerDisabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || !onPress}
        activeOpacity={1}
      >
        <View style={styles.content}>
          {/* Icon with gradient badge */}
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <LinearGradient
              colors={statusConfig.badgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.indicatorBadge}
            >
              <Text style={[styles.indicator, { color: designTokens.background }]}>
                {statusConfig.indicator}
              </Text>
            </LinearGradient>
          </View>

          {/* Text content with progress bar */}
          <View style={[styles.textSection, isCompact && styles.textSectionCompact]}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.title,
                { color: designTokens.text },
                isCompact && styles.titleCompact
              ]}>
                {title}
              </Text>
              <Text style={[
                styles.progressPercent,
                { color: statusConfig.textColor },
                isCompact && styles.progressCompact
              ]}>
                {progress}%
              </Text>
            </View>
            
            {/* Animated progress bar */}
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth,
                    backgroundColor: statusConfig.progressColor,
                  }
                ]}
              />
            </View>
          </View>

          {/* Chevron with better styling */}
          {showChevron && (
            <View style={styles.chevronContainer}>
              <Text style={[styles.chevron, { color: statusConfig.textColor }]}>
                ›
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    ...shadows.medium,
  },
  containerCompact: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    alignItems: 'center',
    marginRight: spacing.lg,
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: designTokens.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.xs,
  },
  icon: {
    fontSize: 28,
  },
  indicatorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  indicator: {
    fontSize: 14,
    fontWeight: '800',
  },
  textSection: {
    flex: 1,
  },
  textSectionCompact: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h4,
    fontWeight: '600',
    flex: 1,
  },
  titleCompact: {
    ...typography.body1,
  },
  progressPercent: {
    ...typography.h4,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  progressCompact: {
    ...typography.body2,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: designTokens.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chevronContainer: {
    marginLeft: spacing.md,
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: designTokens.divider,
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
  },
});

export default StatusCard;