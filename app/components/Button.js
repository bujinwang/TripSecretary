// 入境通 - Button Component
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, typography, borderRadius, shadows, touchable } from '../theme';

const Button = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, text
  size = 'large', // large, medium, small
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`${variant}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'success' ? colors.white : colors.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon !== null && icon !== false && (
            <View style={styles.icon}>
              {React.isValidElement(icon) ? (
                icon
              ) : (
                <Text style={[styles.iconText, textStyles]}>{icon}</Text>
              )}
            </View>
          )}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    minHeight: touchable.minHeight,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  success: {
    backgroundColor: '#4CAF50',
    ...shadows.button,
  },
  textVariant: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  large: {
    height: 48,
    paddingHorizontal: 32,
  },
  medium: {
    height: 40,
    paddingHorizontal: 24,
  },
  small: {
    height: 32,
    paddingHorizontal: 16,
  },
  
  // Disabled
  disabled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    ...shadows.none,
  },
  
  // Text styles
  buttonText: {
    ...typography.button,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.primary,
  },
  successText: {
    color: colors.white,
  },
  textText: {
    color: colors.secondary,
  },
  disabledText: {
    color: colors.textDisabled,
  },
  
  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  iconText: {
    ...typography.button,
  },
});

export default Button;
