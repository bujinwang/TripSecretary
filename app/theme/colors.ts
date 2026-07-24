// 入境通 - Color System
// Based on UI设计规范.md

export type ColorToken =
  | 'primary'
  | 'primaryDark'
  | 'primaryLight'
  | 'secondary'
  | 'success'
  | 'successLight'
  | 'warning'
  | 'warningLight'
  | 'error'
  | 'errorLight'
  | 'white'
  | 'black'
  | 'background'
  | 'backgroundLight'
  | 'backgroundSecondary'
  | 'card'
  | 'surface'
  | 'border'
  | 'borderLight'
  | 'divider'
  | 'text'
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'textDisabled'
  | 'overlay'
  | 'overlayDark'
  | 'shadow'
  | 'gray200'
  | 'gray300'
  | 'gray400'
  | 'gray500';

export type ColorPalette = Record<ColorToken, string> & Record<string, string>;

export const colors: ColorPalette = {
  // Primary Colors
  primary: '#07C160',        // WeChat Green - Main buttons, emphasis
  primaryDark: '#06AD56',    // Primary pressed state
  primaryLight: '#E8F9F0',   // Primary background

  secondary: '#576B95',      // WeChat Blue - Links, secondary info

  // Status Colors
  success: '#07C160',        // Green - Success messages
  successLight: '#E6F7EB',   // Light green backgrounds / badges
  warning: '#FA9D3B',        // Orange - Warning messages
  warningLight: '#FFF4E6',   // Soft warning background
  error: '#F56C6C',          // Red - Error messages, delete
  errorLight: '#FDECEC',     // Soft error background

  // Background Colors
  white: '#FFFFFF',          // Pure white
  black: '#000000',          // Pure black
  background: '#F5F5F5',     // Light gray background
  backgroundLight: '#FAFAFA', // Very light gray background
  backgroundSecondary: '#FFFFFF', // Secondary background blocks
  card: '#FFFFFF',           // Card background
  surface: '#FFFFFF',        // General surface color

  // Border & Divider
  border: '#E0E0E0',         // Medium gray borders
  borderLight: '#F2F2F2',    // Light dividers/borders
  divider: '#EDEDED',        // Dividers
  gray200: '#EEEEEE',        // Light gray utility
  gray300: '#DADADA',        // Mid gray utility
  gray400: '#BDBDBD',        // Darker gray utility
  gray500: '#888888',        // Muted text/lines

  // Text Colors
  text: '#1A1A1A',          // Primary text (90% black)
  textPrimary: '#1A1A1A',    // Alias for primary text
  textSecondary: '#555555',  // Secondary text - darker for WCAG AA compliance (4.9:1 ratio)
  textTertiary: '#666666',   // Tertiary text - darker for WCAG AA compliance (4.2:1 ratio)
  textDisabled: '#CCCCCC',   // Disabled text

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  // Shadow
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export default colors;
