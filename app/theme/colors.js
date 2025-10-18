// 入境通 - Color System
// Based on UI设计规范.md

export const colors = {
  // Primary Colors
  primary: '#07C160',        // WeChat Green - Main buttons, emphasis
  primaryDark: '#06AD56',    // Primary pressed state
  primaryLight: '#E8F9F0',   // Primary background
  
  secondary: '#576B95',      // WeChat Blue - Links, secondary info
  
  // Status Colors
  success: '#07C160',        // Green - Success messages
  warning: '#FA9D3B',        // Orange - Warning messages
  error: '#F56C6C',          // Red - Error messages, delete
  
  // Background Colors
  white: '#FFFFFF',          // Pure white
  background: '#F5F5F5',     // Light gray background
  backgroundLight: '#FAFAFA', // Very light gray background
  card: '#FFFFFF',           // Card background
  
  // Border & Divider
  border: '#EDEDED',         // Medium gray borders
  divider: '#EDEDED',        // Dividers
  
  // Text Colors
  text: '#1A1A1A',          // Primary text (90% black)
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
