// Tamagui configuration seeded from existing TripSecretary theme tokens.
import { createFont, createTamagui, createTokens } from 'tamagui';
import { shorthands } from '@tamagui/shorthands';

import { colors as themeColors } from './app/theme/colors.js';
import { spacing, borderRadius } from './app/theme/spacing.js';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} from './app/theme/typography.js';

const tokens = createTokens({
  color: {
    ...themeColors,
  },
  radius: {
    none: 0,
    true: borderRadius.md,
    ...borderRadius,
  },
  space: {
    none: 0,
    hairline: 2,
    true: spacing.md,
    ...spacing,
  },
  size: {
    none: 0,
    xs: fontSize.caption,
    sm: fontSize.body1,
    md: fontSize.body2,
    lg: fontSize.h3,
    xl: fontSize.h2,
    '2xl': fontSize.h1,
    true: fontSize.body2,
  },
  zIndex: {
    none: 0,
    xs: 1,
    sm: 10,
    md: 100,
    lg: 500,
    xl: 1000,
    '2xl': 1100,
    true: 0,
  },
});

const bodyFont = createFont({
  family: fontFamily.regular ?? 'System',
  weight: {
    3: fontWeight.regular,
    4: fontWeight.medium,
    5: fontWeight.semiBold,
    6: fontWeight.bold,
  },
  size: {
    1: fontSize.caption,
    2: fontSize.body1,
    3: fontSize.body2,
    4: fontSize.h3,
    lg: fontSize.h3,
  },
  lineHeight: {
    1: Math.round(fontSize.caption * lineHeight.caption),
    2: Math.round(fontSize.body1 * lineHeight.body),
    3: Math.round(fontSize.body2 * lineHeight.body),
    4: Math.round(fontSize.h3 * lineHeight.title),
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  },
});

const headingFont = createFont({
  family: fontFamily.semiBold ?? fontFamily.bold ?? 'System',
  weight: {
    4: fontWeight.semiBold,
    5: fontWeight.bold,
  },
  size: {
    3: fontSize.h3,
    4: fontSize.h2,
    5: fontSize.h1,
  },
  lineHeight: {
    3: Math.round(fontSize.h3 * lineHeight.title),
    4: Math.round(fontSize.h2 * lineHeight.title),
    5: Math.round(fontSize.h1 * lineHeight.title),
  },
  letterSpacing: {
    3: 0,
    4: 0,
    5: 0,
  },
});

const monoFont = createFont({
  family: fontFamily.regular ?? 'System',
  weight: bodyFont.weight,
  size: bodyFont.size,
  lineHeight: bodyFont.lineHeight,
  letterSpacing: bodyFont.letterSpacing,
});

const themes = {
  light: {
    background: themeColors.background,
    backgroundHover: themeColors.backgroundLight,
    backgroundPress: themeColors.backgroundLight,
    backgroundStrong: themeColors.white,
    backgroundTransparent: 'transparent',
    color: themeColors.text,
    colorHover: themeColors.textSecondary,
    colorPress: themeColors.textSecondary,
    colorFocus: themeColors.text,
    colorSubtitle: themeColors.textSecondary,
    card: themeColors.card,
    borderColor: themeColors.border,
    borderColorHover: themeColors.divider,
    borderColorPress: themeColors.divider,
    overlay: themeColors.overlay,
    overlayStrong: themeColors.overlayDark,
    shadowColor: themeColors.shadow,
    primary: themeColors.primary,
    primaryHover: themeColors.primaryDark,
    primaryPress: themeColors.primaryDark,
    secondary: themeColors.secondary,
    success: themeColors.success,
    warning: themeColors.warning,
    danger: themeColors.error,
    textPrimary: themeColors.text,
  },
  dark: {
    background: '#111827',
    backgroundHover: '#1f2937',
    backgroundPress: '#1f2937',
    backgroundStrong: '#1f2937',
    backgroundTransparent: 'transparent',
    color: '#f3f4f6',
    colorHover: '#e5e7eb',
    colorPress: '#e5e7eb',
    colorFocus: '#ffffff',
    colorSubtitle: '#d1d5db',
    card: '#1f2937',
    borderColor: '#374151',
    borderColorHover: '#4b5563',
    borderColorPress: '#4b5563',
    overlay: 'rgba(15, 23, 42, 0.6)',
    overlayStrong: 'rgba(15, 23, 42, 0.75)',
    shadowColor: 'rgba(0, 0, 0, 0.6)',
    primary: themeColors.primary,
    primaryHover: themeColors.primaryLight,
    primaryPress: themeColors.primaryDark,
    secondary: themeColors.secondary,
    success: themeColors.success,
    warning: themeColors.warning,
    danger: themeColors.error,
    textPrimary: '#f3f4f6',
  },
};

const media = {
  xs: { maxWidth: 520 },
  sm: { maxWidth: 780 },
  md: { maxWidth: 1024 },
  lg: { maxWidth: 1280 },
  xl: { maxWidth: 1420 },
  short: { maxHeight: 820 },
  tall: { minHeight: 820 },
};

const tamaguiConfig = createTamagui({
  fonts: {
    body: bodyFont,
    heading: headingFont,
    mono: monoFont,
  },
  media,
  shorthands,
  themes,
  tokens,
});

export type TamaguiConfig = typeof tamaguiConfig;
declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends TamaguiConfig {}
}

export default tamaguiConfig;
