// 出境通 - Typography System
// Based on UI设计规范.md

import { Platform } from 'react-native';

export const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
};

export const fontSize = {
  h1: 28,      // Page titles
  h2: 24,      // Module titles
  h3: 20,      // Sub titles
  body1: 16,   // Body text (minimum)
  body2: 18,   // Emphasized body
  caption: 14, // Helper text
  button: 18,  // Button text
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

export const lineHeight = {
  title: 1.2,
  body: 1.5,
  caption: 1.4,
};

// Typography styles
export const typography = {
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.h1 * lineHeight.title,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.h2 * lineHeight.title,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semiBold,
    lineHeight: fontSize.h3 * lineHeight.title,
  },
  body1: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body1,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.body1 * lineHeight.body,
  },
  body2: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body2,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.body2 * lineHeight.body,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.caption * lineHeight.caption,
  },
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.button,
    fontWeight: fontWeight.semiBold,
  },
};

export default typography;
