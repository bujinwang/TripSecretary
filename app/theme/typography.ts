// 入境通 - Typography System
// Based on UI设计规范.md

import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

const selectFont = (options: { ios: string; android: string; web: string; default: string }): string =>
  Platform.select<string>(options) ?? options.default;

export interface FontFamilyConfig {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
}

export const fontFamily: FontFamilyConfig = {
  regular: selectFont({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  medium: selectFont({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  semiBold: selectFont({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  bold: selectFont({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
};

export type FontSizeToken = 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption' | 'button';

export const fontSize: Record<FontSizeToken, number> = {
  h1: 28,      // Page titles
  h2: 24,      // Module titles
  h3: 20,      // Sub titles
  body1: 16,   // Body text (minimum)
  body2: 18,   // Emphasized body
  caption: 14, // Helper text
  button: 18,  // Button text
};

export interface FontWeightConfig {
  regular: TextStyle['fontWeight'];
  medium: TextStyle['fontWeight'];
  semiBold: TextStyle['fontWeight'];
  bold: TextStyle['fontWeight'];
}

export const fontWeight: FontWeightConfig = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

export interface LineHeightConfig {
  title: number;
  body: number;
  caption: number;
}

export const lineHeight: LineHeightConfig = {
  title: 1.2,
  body: 1.5,
  caption: 1.4,
};

// Scaled size tokens for flexible usage
export const sizes: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
};

// Font weight aliases for consistency across components
export const weights = {
  regular: fontWeight.regular,
  medium: fontWeight.medium,
  semibold: fontWeight.semiBold,
  bold: fontWeight.bold,
} as const;

type TypographyKeys = 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption' | 'button';

export interface TypographyScale {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  body1: TextStyle;
  body2: TextStyle;
  caption: TextStyle;
  button: TextStyle;
  h4: TextStyle;
  body: TextStyle;
  bodyBold: TextStyle;
  captionBold: TextStyle;
  sizes: typeof sizes;
  weights: typeof weights;
  [key: string]: TextStyle | typeof sizes | typeof weights;
}

const createTypographyStyle = (
  key: TypographyKeys,
  overrides: Partial<TextStyle> = {}
): TextStyle => {
  const baseFontMap: Record<TypographyKeys, string> = {
    h1: fontFamily.bold,
    h2: fontFamily.bold,
    h3: fontFamily.semiBold,
    body1: fontFamily.regular,
    body2: fontFamily.regular,
    caption: fontFamily.regular,
    button: fontFamily.semiBold,
  };

  const baseWeightMap: Record<TypographyKeys, TextStyle['fontWeight']> = {
    h1: fontWeight.bold,
    h2: fontWeight.bold,
    h3: fontWeight.semiBold,
    body1: fontWeight.regular,
    body2: fontWeight.regular,
    caption: fontWeight.regular,
    button: fontWeight.semiBold,
  };

  const baseLineHeightMap: Partial<Record<TypographyKeys, number>> = {
    h1: fontSize.h1 * lineHeight.title,
    h2: fontSize.h2 * lineHeight.title,
    h3: fontSize.h3 * lineHeight.title,
    body1: fontSize.body1 * lineHeight.body,
    body2: fontSize.body2 * lineHeight.body,
    caption: fontSize.caption * lineHeight.caption,
  };

  return {
    fontFamily: baseFontMap[key],
    fontSize: fontSize[key],
    fontWeight: baseWeightMap[key],
    ...(baseLineHeightMap[key] ? { lineHeight: baseLineHeightMap[key] } : {}),
    ...overrides,
  };
};

export const typography: TypographyScale = {
  h1: createTypographyStyle('h1'),
  h2: createTypographyStyle('h2'),
  h3: createTypographyStyle('h3'),
  body1: createTypographyStyle('body1'),
  body2: createTypographyStyle('body2'),
  caption: createTypographyStyle('caption'),
  button: createTypographyStyle('button'),
  h4: {
    ...createTypographyStyle('body2'),
    fontWeight: fontWeight.semiBold,
  },
  body: createTypographyStyle('body1'),
  bodyBold: {
    ...createTypographyStyle('body1'),
    fontWeight: fontWeight.semiBold,
  },
  captionBold: {
    ...createTypographyStyle('caption'),
    fontWeight: fontWeight.semiBold,
  },
  sizes,
  weights,
};

export default typography;
