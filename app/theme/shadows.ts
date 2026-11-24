// 入境通 - Shadow System
// Based on UI设计规范.md

import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors } from './colors';

type ShadowKey = 'card' | 'button' | 'small' | 'none';

const selectShadow = (iosStyle: ViewStyle, androidStyle: ViewStyle): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: iosStyle,
    android: androidStyle,
    default: iosStyle,
  }) ?? iosStyle;

const iosCardShadow: ViewStyle = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 12,
};

const iosButtonShadow: ViewStyle = {
  shadowColor: 'rgba(7, 193, 96, 0.3)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 8,
};

const iosSmallShadow: ViewStyle = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 1,
  shadowRadius: 4,
};

const androidElevation = (value: number): ViewStyle => ({ elevation: value });

const noShadow: ViewStyle = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

export const shadows: Record<ShadowKey, ViewStyle> = {
  card: selectShadow(iosCardShadow, androidElevation(4)),
  button: selectShadow(iosButtonShadow, androidElevation(3)),
  small: selectShadow(iosSmallShadow, androidElevation(2)),
  none: noShadow,
};

export default shadows;
