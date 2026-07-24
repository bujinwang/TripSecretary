// 入境通 - Theme System
// Central export for all theme constants

import type { ColorPalette } from './colors';
import type { TypographyScale } from './typography';
import type { SpacingScale, BorderRadiusScale } from './spacing';

export { colors } from './colors';
export {
  typography,
  fontSize,
  fontWeight,
  fontFamily,
  sizes as typographySizes,
  weights as typographyWeights,
} from './typography';
export { spacing, borderRadius, touchable } from './spacing';
export { shadows } from './shadows';

// Combined theme object
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';
import { shadows } from './shadows';

type ShadowScale = typeof shadows;

export interface Theme {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
}

export const theme: Theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export type { ColorPalette } from './colors';
export type {
  TypographyScale,
  FontFamilyConfig,
  FontSizeToken,
  FontWeightConfig,
  LineHeightConfig,
} from './typography';
export type { SpacingScale, BorderRadiusScale, TouchableArea } from './spacing';

export default theme;
