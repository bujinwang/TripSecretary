// 入境通 - Button Component
import React, { type ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, typography, borderRadius, shadows, touchable } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'text' | 'prominent' | 'outline' | 'soft';
type ButtonSize = 'large' | 'medium' | 'small';

type ButtonIcon = ReactNode | null | false | undefined;

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ButtonIcon;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const VARIANT_ACTIVITY_INDICATOR_COLOR: Record<ButtonVariant, string> = {
  primary: colors.white,
  secondary: colors.primary,
  success: colors.white,
  text: colors.primary,
  prominent: colors.white,
  outline: colors.primary,
  soft: colors.text,
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    minHeight: touchable.minHeight,
  },

  primary: {
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  prominent: {
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  soft: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  success: {
    backgroundColor: '#4CAF50',
    ...shadows.button,
  },
  text: {
    backgroundColor: 'transparent',
  },

  large: {
    minHeight: 48,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  medium: {
    minHeight: 40,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  small: {
    minHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  disabled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    ...shadows.none,
  },

  buttonText: {
    ...typography.button,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.primary,
  },
  prominentText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  softText: {
    color: colors.text,
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

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  icon: {
    marginRight: 8,
  },
  iconText: {
    ...typography.button,
  },
});

const VARIANT_TEXT_STYLE_KEY: Record<ButtonVariant, keyof typeof styles> = {
  primary: 'primaryText',
  secondary: 'secondaryText',
  success: 'successText',
  text: 'textText',
  prominent: 'prominentText',
  outline: 'outlineText',
  soft: 'softText',
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const buttonStyles: StyleProp<ViewStyle>[] = [
    styles.button,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : null,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[VARIANT_TEXT_STYLE_KEY[variant]],
    disabled ? styles.disabledText : null,
    textStyle,
  ].filter(Boolean) as StyleProp<TextStyle>[];

  const shouldRenderIcon = icon !== null && icon !== false && icon !== undefined;

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={VARIANT_ACTIVITY_INDICATOR_COLOR[variant]} />
      ) : (
        <View style={styles.content}>
          {shouldRenderIcon ? (
            <View style={styles.icon}>
              {React.isValidElement(icon) ? (
                icon
              ) : (
                <Text style={[styles.iconText, ...textStyles]}>{icon}</Text>
              )}
            </View>
          ) : null}
          <Text style={[{ textAlign: 'center', flexShrink: 1 }, ...textStyles]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;
