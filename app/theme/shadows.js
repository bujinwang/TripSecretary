// 出境通 - Shadow System
// Based on UI设计规范.md

import { Platform } from 'react-native';
import { colors } from './colors';

export const shadows = {
  // Card shadow
  card: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  }),
  
  // Button shadow
  button: Platform.select({
    ios: {
      shadowColor: 'rgba(7, 193, 96, 0.3)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
  }),
  
  // Small shadow
  small: Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
  
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export default shadows;
