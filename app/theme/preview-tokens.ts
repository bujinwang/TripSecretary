// @ts-nocheck

// TDAC Entry Pack Preview - Design Token Extensions
// Extends the base TripSecretary theme with preview-specific tokens
// Following the spec from front-end-spec.md

import { Platform } from 'react-native';

/**
 * Preview-specific color palette
 * Neutral-focused with reduced green usage (green only for CTAs)
 */
export const previewColors = {
  // Primary action color (kept for CTAs only)
  actionPrimary: '#10B981',      // Green for Submit button and success states
  actionPrimaryLight: '#D1FAE5',  // Light green background
  actionPrimaryDark: '#059669',   // Green pressed state

  // Secondary action color
  actionSecondary: '#3B82F6',     // Blue for info states, links
  actionSecondaryLight: '#DBEAFE', // Light blue background

  // Status colors (following spec)
  statusIncomplete: '#F59E0B',    // Amber for incomplete/warning
  statusIncompleteLight: '#FEF3C7', // Amber background
  statusComplete: '#10B981',      // Green for completed
  statusCompleteLight: '#D1FAE5', // Green background
  statusError: '#EF4444',         // Red for errors
  statusErrorLight: '#FEE2E2',    // Red background
  statusInfo: '#3B82F6',          // Blue for info
  statusInfoLight: '#DBEAFE',     // Blue background

  // Neutral palette (used for 90% of interface)
  neutral900: '#111827',          // Primary text, headings (16:1 contrast)
  neutral600: '#4B5563',          // Secondary text (7:1 contrast)
  neutral400: '#9CA3AF',          // Placeholder text (4.5:1 contrast)
  neutral200: '#E5E7EB',          // Borders, dividers
  neutral100: '#F3F4F6',          // Card backgrounds
  neutral50: '#F9FAFB',           // Page background

  // Preview mode specific
  previewBadgeBg: '#F0F4F8',      // Light blue-gray for preview badge
  previewBadgeBorder: '#D0D8E0',  // Border for preview badge
  previewBorder: '#D0D8E0',       // Dashed border for document preview

  // White
  white: '#FFFFFF',
};

/**
 * Elevation/Shadow system following the spec
 */
export const previewShadows = {
  // Elevation 1 - Subtle lift (document preview)
  elevation1: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
    },
    android: {
      elevation: 1,
    },
  }),

  // Elevation 2 - Cards, dropdowns (status card)
  elevation2: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
  }),

  // Elevation 3 - Modals, overlays (action buttons when fixed)
  elevation3: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 15,
    },
    android: {
      elevation: 8,
    },
  }),

  // Elevation 4 - Drawer, bottom sheets
  elevation4: Platform.select({
    ios: {
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 1,
      shadowRadius: 25,
    },
    android: {
      elevation: 16,
    },
  }),
};

/**
 * Preview-specific spacing extensions
 * Following 8px grid system from spec
 */
export const previewSpacing = {
  xs: 4,      // 0.5 unit - Tight spacing within components
  sm: 8,      // 1 unit - Related items
  md: 16,     // 2 units - Standard component padding
  lg: 24,     // 3 units - Section spacing
  xl: 32,     // 4 units - Major section breaks
  '2xl': 48,  // 6 units - Page-level spacing
  '3xl': 64,  // 8 units - Hero sections
};

/**
 * Border radius scale from spec
 */
export const previewBorderRadius = {
  small: 4,   // Input fields, chips
  medium: 8,  // Cards, alerts
  large: 12,  // Buttons, major cards
  full: 9999, // Pills, badges
};

/**
 * Typography scale from spec
 * Sizes, weights, line heights
 */
export const previewTypography = {
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.02,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.01,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  },
  small: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
  },
  smallBold: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.01,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0,
  },
};

/**
 * Icon sizes from spec
 */
export const previewIconSizes = {
  small: 16,  // Inline with text
  medium: 20, // List items, input fields
  large: 24,  // Buttons, headers
  xl: 32,     // Empty states, illustrations
};

/**
 * Component-specific dimensions
 */
export const previewDimensions = {
  buttonHeight: {
    large: 52,  // Primary/Secondary action buttons
    medium: 44, // Standard buttons
    small: 36,  // Compact buttons
  },
  minTouchTarget: {
    ios: 44,
    android: 48,
  },
  stepperLineWidth: 2,
  borderWidth: {
    thin: 1,
    medium: 2,
  },
};

/**
 * Animation durations and easing (for reference)
 * Actual implementation will use React Native Reanimated
 */
export const previewAnimations = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
  },
  // Easing curves (Bezier values)
  easing: {
    linear: [0, 0, 1, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    easeOutBack: [0.34, 1.56, 0.64, 1],
  },
};

/**
 * Combined preview theme tokens
 * Export for easy consumption in components
 */
export const previewTheme = {
  colors: previewColors,
  shadows: previewShadows,
  spacing: previewSpacing,
  borderRadius: previewBorderRadius,
  typography: previewTypography,
  iconSizes: previewIconSizes,
  dimensions: previewDimensions,
  animations: previewAnimations,
};

export default previewTheme;
