// 出国啰 - Theme System
// Central export for all theme constants

export { colors } from './colors';
export { typography, fontSize, fontWeight, fontFamily } from './typography';
export { spacing, borderRadius, touchable } from './spacing';
export { shadows } from './shadows';

// Combined theme object
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export default theme;
