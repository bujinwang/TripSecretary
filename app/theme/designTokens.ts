/**
 * Design Tokens for ThailandEntryFlowScreen Redesign
 * Centralized design system constants for consistent UI
 */

export const designTokens = {
  // Primary Brand Colors - Thailand-themed (Emerald & Gold)
  primary: '#10B981',      // Vibrant emerald green
  primaryDark: '#059669',  // Deep emerald for pressed states
  primaryLight: '#D1FAE5', // Soft mint background
  primaryGradient: ['#10B981', '#059669'], // Emerald gradient

  // Secondary/Accent Colors - Thai Gold
  accent: '#F59E0B',       // Thai gold
  accentDark: '#D97706',   // Deep gold
  accentLight: '#FEF3C7',  // Soft gold background
  accentGradient: ['#FBBF24', '#F59E0B'], // Gold gradient

  // Semantic Colors
  success: '#059669',      // Emerald for completed states
  warning: '#F59E0B',      // Gold for warnings/alerts
  error: '#EF4444',        // Red for errors
  info: '#3B82F6',         // Blue for informational content

  // Neutral Colors - Enhanced hierarchy
  background: '#FFFFFF',
  surface: '#FAFAFA',      // Slightly warmer gray
  surfaceElevated: '#FFFFFF', // Elevated cards
  text: '#111827',         // Richer black
  textSecondary: '#6B7280', // Softer gray
  textTertiary: '#9CA3AF', // Light gray
  border: '#E5E7EB',       // Neutral border
  borderLight: '#F3F4F6',  // Subtle dividers
  divider: '#F3F4F6',

  // Status-specific backgrounds with better visual appeal
  emptyState: '#F0FDF4',   // Soft mint for empty states
  progressState: '#FFFBEB', // Soft gold for progress
  readyState: '#D1FAE5',   // Mint green for ready
  submittedState: '#DBEAFE', // Soft blue for submitted

  // Interactive states
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  shimmer: 'rgba(255, 255, 255, 0.3)',
};

// Typography Scale - Enhanced for better hierarchy
export const typography = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.3 },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '700', letterSpacing: -0.2 },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600', letterSpacing: 0 },
  h4: { fontSize: 18, lineHeight: 26, fontWeight: '600', letterSpacing: 0 },
  body1: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
  body2: { fontSize: 14, lineHeight: 22, fontWeight: '400', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '500', letterSpacing: 0.2 },
  button: { fontSize: 16, lineHeight: 24, fontWeight: '600', letterSpacing: 0.3 },
  overline: { fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }
};

// Spacing Scale (4px base) - More granular control
export const spacing = {
  xxs: 2,   // 2px - hairline spacing
  xs: 4,    // 4px - micro spacing
  sm: 8,    // 8px - small elements
  md: 12,   // 12px - compact padding
  lg: 16,   // 16px - standard padding
  xl: 24,   // 24px - large sections
  xxl: 32,  // 32px - major sections
  xxxl: 48  // 48px - screen margins
};

// Border Radius Scale
export const borderRadius = {
  xs: 4,   // Small elements
  sm: 8,   // Cards, inputs
  md: 12,  // Large cards
  lg: 16,  // Buttons
  xl: 20,  // Special elements
  xxl: 24  // Hero elements
};

// Shadow Definitions - Softer, more natural shadows
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonPressed: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  }
};

// Animation Constants
export const animations = {
  duration: {
    quick: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    standard: 'ease',
    accelerate: 'ease-out',
    decelerate: 'ease-in',
    bounce: 'ease-out-back',
  }
};

export default designTokens;