// @ts-nocheck

/**
 * ActionButton Component - Enhanced button with micro-interactions
 * Supports primary, secondary, success, and warning variants with optional gradients
 * Features: Scale animations, haptic feedback, loading states
 */

import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, spacing, borderRadius, shadows, typography } from '../../theme/designTokens';
import { createAnimationValue } from '../../utils/animations';

const ActionButton = ({
  title,
  variant = 'primary',    // 'primary' | 'secondary' | 'success' | 'warning'
  size = 'large',         // 'small' | 'medium' | 'large'
  icon,                   // emoji icon
  disabled = false,
  loading = false,
  onPress,
  gradient = false,       // use gradient background
  fullWidth = false,      // stretch to full width
  style,
}) => {
  const scaleAnim = useRef(createAnimationValue(1)).current;
  const opacityAnim = useRef(createAnimationValue(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Get variant-specific styles
  const getVariantConfig = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: disabled ? designTokens.surface : designTokens.surfaceElevated,
          borderColor: disabled ? designTokens.border : designTokens.primary,
          textColor: disabled ? designTokens.textTertiary : designTokens.primary,
          gradientColors: gradient ? designTokens.primaryGradient : null,
        };
      case 'success':
        return {
          backgroundColor: disabled ? designTokens.surface : designTokens.success,
          borderColor: designTokens.success,
          textColor: designTokens.background,
          gradientColors: gradient ? [designTokens.success, designTokens.primaryDark] : null,
        };
      case 'warning':
        return {
          backgroundColor: disabled ? designTokens.surface : designTokens.accent,
          borderColor: designTokens.accent,
          textColor: designTokens.background,
          gradientColors: gradient ? designTokens.accentGradient : null,
        };
      case 'primary':
      default:
        return {
          backgroundColor: disabled ? designTokens.surface : designTokens.primary,
          borderColor: designTokens.primary,
          textColor: designTokens.background,
          gradientColors: gradient ? designTokens.primaryGradient : null,
        };
    }
  };

  // Get size-specific styles
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          minHeight: 40,
          borderRadius: borderRadius.md,
          fontSize: typography.body2.fontSize,
        };
      case 'medium':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          minHeight: 48,
          borderRadius: borderRadius.lg,
          fontSize: typography.body1.fontSize,
        };
      case 'large':
      default:
        return {
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xxl,
          minHeight: 56,
          borderRadius: borderRadius.xl,
          fontSize: typography.button.fontSize,
        };
    }
  };

  const variantConfig = getVariantConfig();
  const sizeConfig = getSizeConfig();

  const buttonContent = (
    <View style={[
      styles.content,
      fullWidth && styles.contentFullWidth
    ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantConfig.textColor}
          style={styles.loader}
        />
      ) : icon ? (
        <Text style={styles.icon}>
          {icon}
        </Text>
      ) : null}

      <Text style={[
        styles.title,
        {
          color: variantConfig.textColor,
          fontSize: sizeConfig.fontSize,
          ...typography.button,
          lineHeight: Math.round(sizeConfig.fontSize * 1.4),
        },
        loading && styles.titleWithLoader,
      ]}>
        {title}
      </Text>
    </View>
  );

  const buttonStyle = [
    styles.container,
    {
      backgroundColor: variantConfig.gradientColors ? 'transparent' : variantConfig.backgroundColor,
      borderColor: variantConfig.borderColor,
      minHeight: sizeConfig.minHeight,
      borderRadius: sizeConfig.borderRadius,
      paddingVertical: sizeConfig.paddingVertical,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      ...(disabled ? shadows.none : shadows.button),
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const animatedButtonStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  if (variantConfig.gradientColors && !disabled) {
    return (
      <Animated.View style={animatedButtonStyle}>
        <TouchableOpacity
          style={buttonStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={1}
        >
          <LinearGradient
            colors={variantConfig.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradient,
              { borderRadius: sizeConfig.borderRadius }
            ]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedButtonStyle}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  contentFullWidth: {
    width: '100%',
  },
  icon: {
    fontSize: 22,
  },
  title: {
    ...typography.button,
    textAlign: 'center',
  },
  titleWithLoader: {
    marginLeft: spacing.xs,
  },
  loader: {
    marginRight: spacing.xs,
  },
});

export default ActionButton;
