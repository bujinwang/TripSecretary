/**
 * GlassCard Component
 *
 * A reusable "Liquid Glass" (translucent, frosted-glass) UI component for iOS.
 * Implements the modern iOS design style with blur effects, semi-transparent overlays,
 * and adaptive theming.
 *
 * SETUP INSTRUCTIONS:
 * 1. Install the blur library:
 *    npm install @react-native-community/blur
 *    or
 *    yarn add @react-native-community/blur
 *
 * 2. For iOS, install pods:
 *    cd ios && pod install && cd ..
 *
 * 3. Rebuild your app:
 *    npx react-native run-ios
 *
 * TESTING:
 * - Test on both iOS Simulator and real device for best results
 * - The blur effect is more pronounced on real devices
 * - Test with light/dark mode toggle (swipe down Control Center on device)
 * - Test with Reduce Transparency enabled:
 *   Settings > Accessibility > Display & Text Size > Reduce Transparency
 *
 * TRADE-OFFS & CONSIDERATIONS:
 * - Performance: Blur effects can impact performance on older devices (pre-A12 chip)
 *   Keep blur regions reasonably sized and avoid excessive nesting
 * - Accessibility: Component auto-detects Reduce Transparency setting and falls back
 *   to solid colors for better performance and accessibility
 * - iOS Version: Works on iOS 10+, optimized for iOS 13+ with improved blur APIs
 * - Android: While the blur library supports Android, the effect quality varies.
 *   Consider platform-specific styling if targeting Android
 */

import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  AccessibilityInfo,
  useColorScheme,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

/**
 * Props for the GlassCard component
 */
export interface GlassCardProps {
  /**
   * The overlay tint color applied on top of the blur.
   * Should include alpha for transparency (e.g., 'rgba(255,255,255,0.6)').
   * Defaults to adaptive color based on color scheme.
   */
  tintColor?: string;

  /**
   * The intensity of the blur effect.
   * Valid values: 'xlight', 'light', 'dark' (iOS)
   * Or custom amount for Android: number
   * Default: 'light' for light mode, 'dark' for dark mode
   */
  blurType?: 'xlight' | 'light' | 'dark' | 'regular' | 'prominent' | 'chromeMaterial' | 'material' | 'thickMaterial' | 'thinMaterial' | 'ultraThinMaterial';

  /**
   * Blur intensity (iOS 10+): 0-100
   * Higher values = stronger blur
   * Default: 80
   */
  blurAmount?: number;

  /**
   * Border radius for the glass card
   * Default: 16
   */
  cornerRadius?: number;

  /**
   * Additional styles for the container
   * Use this for size, margin, padding, etc.
   */
  style?: ViewStyle;

  /**
   * Content to be rendered inside the glass card
   */
  children: React.ReactNode;

  /**
   * Enable shadow/elevation effect
   * Default: true
   */
  showShadow?: boolean;

  /**
   * Border rim width (creates the glass edge effect)
   * Set to 0 to disable
   * Default: 1
   */
  borderWidth?: number;

  /**
   * Border rim color
   * Defaults to semi-transparent white in light mode, transparent white in dark mode
   */
  borderColor?: string;
}

/**
 * GlassCard Component
 *
 * A translucent glass-effect card with blur background, semi-transparent overlay,
 * and adaptive theming for iOS.
 */
export const GlassCard: React.FC<GlassCardProps> = React.memo(({
  tintColor,
  blurType,
  blurAmount = 80,
  cornerRadius = 16,
  style,
  children,
  showShadow = true,
  borderWidth = 1,
  borderColor,
}) => {
  // Detect current color scheme (light/dark mode)
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Track if Reduce Transparency is enabled (accessibility feature)
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] = useState(false);

  // Check accessibility settings on mount and when they change
  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => {
      setIsReduceTransparencyEnabled(enabled);
    });

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setIsReduceTransparencyEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Compute default values based on color scheme
  // Memoized to avoid recalculation on every render
  const defaultTintColor = useMemo(() => {
    if (tintColor) return tintColor;
    // Light mode: semi-transparent white
    // Dark mode: semi-transparent dark gray with slight warmth
    return isDarkMode
      ? 'rgba(28, 28, 30, 0.7)' // iOS dark mode background color
      : 'rgba(255, 255, 255, 0.6)'; // iOS light mode glass tint
  }, [tintColor, isDarkMode]);

  const defaultBlurType = useMemo(() => {
    if (blurType) return blurType;
    // Use native iOS blur types that match the glass aesthetic
    // 'light' for light mode creates a subtle blur
    // 'dark' for dark mode creates appropriate contrast
    return isDarkMode ? 'dark' : 'light';
  }, [blurType, isDarkMode]);

  const defaultBorderColor = useMemo(() => {
    if (borderColor) return borderColor;
    // Subtle border that mimics glass edge
    return isDarkMode
      ? 'rgba(255, 255, 255, 0.15)' // Subtle white rim in dark mode
      : 'rgba(255, 255, 255, 0.3)'; // More visible white rim in light mode
  }, [borderColor, isDarkMode]);

  // Fallback background for when transparency is reduced (accessibility)
  const solidFallbackColor = useMemo(() => {
    return isDarkMode
      ? 'rgba(28, 28, 30, 0.95)' // Nearly opaque dark
      : 'rgba(255, 255, 255, 0.95)'; // Nearly opaque light
  }, [isDarkMode]);

  // Container styles with shadow
  const containerStyle = useMemo<ViewStyle>(() => ({
    borderRadius: cornerRadius,
    overflow: 'hidden', // Ensure children respect border radius
    borderWidth: borderWidth,
    borderColor: defaultBorderColor,
    // Shadow for depth (iOS only, Android uses elevation)
    ...(showShadow && Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: isDarkMode ? 0.4 : 0.15,
      shadowRadius: 12,
    }),
    ...(showShadow && Platform.OS === 'android' && {
      elevation: 8,
    }),
  }), [cornerRadius, borderWidth, defaultBorderColor, showShadow, isDarkMode]);

  // ACCESSIBILITY FALLBACK: If Reduce Transparency is enabled, skip blur
  // and use a solid background for better performance and visibility
  if (isReduceTransparencyEnabled) {
    return (
      <View style={[containerStyle, style, { backgroundColor: solidFallbackColor }]}>
        {children}
      </View>
    );
  }

  // MAIN GLASS EFFECT IMPLEMENTATION
  // Layer structure (bottom to top):
  // 1. BlurView - blurs background content
  // 2. Tint overlay View - adds color tint
  // 3. Children content - actual card content
  return (
    <View style={[containerStyle, style]}>
      {/* Blur Layer - Native iOS blur effect */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={defaultBlurType}
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor={solidFallbackColor}
      />

      {/* Tint Overlay - Adds colored glass effect */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: defaultTintColor },
        ]}
      />

      {/* Content Layer */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
});

// Display name for debugging
GlassCard.displayName = 'GlassCard';

/**
 * Internal styles
 * Kept minimal - most styling should come through props
 */
const styles = StyleSheet.create({
  contentContainer: {
    // Content sits on top of blur and tint layers
    // Add padding here if you want default internal spacing
    flex: 1,
  },
});

export default GlassCard;
