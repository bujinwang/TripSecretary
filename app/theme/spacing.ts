// 入境通 - Spacing System (8px grid)
// Based on UI设计规范.md

export type SpacingScale = Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>;

export const spacing: SpacingScale = {
  xs: 4,    // Extra small spacing (icon + text)
  sm: 8,    // Small spacing (related elements)
  md: 16,   // Standard spacing (page margins)
  lg: 24,   // Medium spacing (between modules)
  xl: 32,   // Large spacing (page sections)
  xxl: 48,  // Extra large spacing (page blocks)
};

export interface BorderRadiusScale {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
  [key: string]: number;
}

// Border radius
export const borderRadius: BorderRadiusScale = {
  sm: 8,    // Small buttons, input fields
  md: 12,   // Cards
  lg: 16,   // Large cards
  xl: 24,   // Large buttons
  full: 9999, // Fully rounded
  small: 8,
  medium: 12,
  large: 16,
  mediumLarge: 20
};

export interface TouchableArea {
  minHeight: number;
  minWidth: number;
}

// Minimum touchable area
export const touchable: TouchableArea = {
  minHeight: 44,
  minWidth: 44,
};

export default {
  spacing,
  borderRadius,
  touchable,
};
