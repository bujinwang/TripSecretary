/**
 * Immigration Officer View Screen Constants
 *
 * Centralized magic numbers and configuration values for the Immigration Officer View
 * Extracted to improve maintainability and make values more discoverable
 */

import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * QR Code display configuration
 */
export const QR_CODE = {
  /**
   * Scale factors for QR code size calculation
   * QR code is sized as: Math.min(screenHeight * HEIGHT_SCALE, screenWidth * WIDTH_SCALE, MAX_SIZE)
   */
  HEIGHT_SCALE: 0.5,  // 50% of screen height in landscape
  WIDTH_SCALE: 0.4,   // 40% of screen width in landscape
  MAX_SIZE: 400,      // Maximum QR code size in pixels

  /**
   * Calculate QR code dimensions based on screen size
   * @returns {number} QR code size in pixels
   */
  getSize: () => Math.min(
    screenHeight * QR_CODE.HEIGHT_SCALE,
    screenWidth * QR_CODE.WIDTH_SCALE,
    QR_CODE.MAX_SIZE
  ),
};

/**
 * Gesture recognition thresholds
 */
export const GESTURES = {
  LONG_PRESS_DURATION: 800,  // Minimum duration for long press (ms)
  MIN_PINCH_SCALE: 0.5,      // Minimum zoom scale for pinch gesture
  MAX_PINCH_SCALE: 2.0,      // Maximum zoom scale for pinch gesture
};

/**
 * Animation and timing configurations
 */
export const ANIMATIONS = {
  HIGHLIGHT_DURATION: 2000,     // Duration for field highlight animation (ms)
  FADE_IN_DURATION: 300,        // Fade in animation duration (ms)
  SLIDE_IN_DURATION: 400,       // Slide in animation duration (ms)
  TOOLTIP_DISPLAY_TIME: 2000,   // How long to show tooltips/hints (ms)
};

/**
 * Typography configurations for display text
 */
export const TYPOGRAPHY = {
  ENTRY_CARD_NUMBER: {
    fontSize: 40,         // Extra large font for easy reading by immigration officers
    letterSpacing: 3,     // Increased letter spacing for clarity
  },
  SECTION_TITLE: {
    fontSize: 24,
  },
  FIELD_LABEL: {
    fontSize: 18,
  },
  FIELD_VALUE: {
    fontSize: 16,
  },
  HELP_TEXT: {
    fontSize: 14,
  },
};

/**
 * Image dimension configurations
 */
export const IMAGE_SIZES = {
  PASSPORT_PHOTO: {
    width: 120,
    height: 150,
  },
  DOCUMENT_PHOTO: {
    width: 200,
    height: 150,
  },
  FUND_PROOF_PHOTO: {
    width: 180,
    height: 120,
  },
};

/**
 * Layout spacing values
 */
export const LAYOUT = {
  BORDER_RADIUS: {
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 20,
    round: 25,
  },
  BORDER_WIDTH: {
    thin: 1,
    medium: 2,
    thick: 4,
  },
  SHADOW: {
    small: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  MODAL_MAX_WIDTH: 400,  // Maximum width for modal dialogs
};

/**
 * Opacity values for various UI states
 */
export const OPACITY = {
  DISABLED: 0.5,
  SECONDARY: 0.6,
  TERTIARY: 0.8,
  ACTIVE: 0.9,
  FULL: 1.0,
};

/**
 * Border color configurations with opacity
 */
export const BORDER_COLORS = {
  SUCCESS: 'rgba(76, 175, 80, 0.4)',
  WARNING: 'rgba(255, 152, 0, 0.4)',
  ERROR: 'rgba(244, 67, 54, 0.4)',
  INFO: 'rgba(33, 150, 243, 0.4)',
};

/**
 * Screen breakpoints for responsive design
 */
export const BREAKPOINTS = {
  SMALL: 600,
  MEDIUM: 900,
  LARGE: 1200,
};

export default {
  QR_CODE,
  GESTURES,
  ANIMATIONS,
  TYPOGRAPHY,
  IMAGE_SIZES,
  LAYOUT,
  OPACITY,
  BORDER_COLORS,
  BREAKPOINTS,
};
