// 出国啰 - Spacing System (8px grid)
// Based on UI设计规范.md

export const spacing = {
  xs: 4,    // Extra small spacing (icon + text)
  sm: 8,    // Small spacing (related elements)
  md: 16,   // Standard spacing (page margins)
  lg: 24,   // Medium spacing (between modules)
  xl: 32,   // Large spacing (page sections)
  xxl: 48,  // Extra large spacing (page blocks)
};

// Border radius
export const borderRadius = {
  sm: 8,    // Small buttons, input fields
  md: 12,   // Cards
  lg: 16,   // Large cards
  xl: 24,   // Large buttons
  full: 9999, // Fully rounded
};

// Minimum touchable area
export const touchable = {
  minHeight: 44,
  minWidth: 44,
};

export default {
  spacing,
  borderRadius,
  touchable,
};
