// @ts-nocheck

// Animation utilities for TDAC Entry Pack Preview
// Provides reusable animation configs, timing constants, and easing functions
// Follows front-end-spec.md Section 9: Animation & Micro-interactions

import { Easing } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';

/**
 * Animation duration constants (in milliseconds)
 * Following spec recommendations for smooth, responsive animations
 */
export const ANIMATION_DURATION = {
  INSTANT: 0,
  FAST: 150,       // Button press, quick interactions
  NORMAL: 250,     // Standard transitions, stepper updates
  SLOW: 400,       // Status card appearance, complex animations
  VERY_SLOW: 600,  // Success celebrations, major transitions
};

/**
 * Easing functions for natural motion
 * Using React Native Reanimated for native-thread animations
 */
export const ANIMATION_EASING = {
  LINEAR: Easing.linear,
  EASE_IN: Easing.bezier(0.42, 0, 1, 1),
  EASE_OUT: Easing.bezier(0, 0, 0.58, 1),
  EASE_IN_OUT: Easing.bezier(0.42, 0, 0.58, 1),
  EASE_OUT_BACK: Easing.bezier(0.34, 1.56, 0.64, 1),  // Slight bounce effect
  EASE_OUT_CUBIC: Easing.bezier(0.33, 1, 0.68, 1),
  EASE_OUT_QUINT: Easing.bezier(0.22, 1, 0.36, 1),
  EASE_IN_QUAD: Easing.bezier(0.11, 0, 0.5, 0),
};

/**
 * Reusable animation configurations
 * Pre-configured timing and easing for common patterns
 */
export const ANIMATION_CONFIGS = {
  // Page transitions (enter/exit)
  pageTransition: {
    duration: 300,
    easing: ANIMATION_EASING.EASE_OUT_CUBIC,
  },

  // Status card appearance (fade + scale with bounce)
  statusCardEntrance: {
    duration: ANIMATION_DURATION.SLOW,
    easing: ANIMATION_EASING.EASE_OUT_BACK,
  },

  // Progress stepper updates
  stepperUpdate: {
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.EASE_IN_OUT,
  },

  // Button press feedback
  buttonPress: {
    duration: ANIMATION_DURATION.FAST,
    easing: ANIMATION_EASING.EASE_IN_OUT,
  },

  // Alert appearance (slide down from top)
  alertAppear: {
    duration: 350,
    easing: ANIMATION_EASING.EASE_OUT_QUINT,
  },

  // Alert dismissal (slide up)
  alertDismiss: {
    duration: 200,
    easing: ANIMATION_EASING.EASE_IN_QUAD,
  },

  // Document expand to fullscreen
  documentExpand: {
    duration: 300,
    easing: ANIMATION_EASING.EASE_IN_OUT,
  },

  // Loading spinner
  spinner: {
    duration: 800,
    easing: ANIMATION_EASING.LINEAR,
  },

  // Error shake
  errorShake: {
    duration: 400,
    easing: ANIMATION_EASING.EASE_IN_OUT,
  },

  // Success celebration
  successCelebration: {
    duration: ANIMATION_DURATION.VERY_SLOW,
    easing: ANIMATION_EASING.EASE_OUT_BACK,
  },
};

/**
 * Reduce motion support
 * Provides alternative animation configs for users with motion sensitivity
 */
export class ReduceMotionManager {
  static isReduceMotionEnabled = null;

  static async init() {
    if (this.isReduceMotionEnabled === null) {
      try {
        this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      } catch (error) {
        console.warn('Failed to check reduce motion setting:', error);
        this.isReduceMotionEnabled = false;
      }
    }
    return this.isReduceMotionEnabled;
  }

  static getConfig(normalConfig, reducedConfig = null) {
    if (this.isReduceMotionEnabled) {
      // Return reduced motion config or instant transition
      return reducedConfig || { duration: 0, easing: ANIMATION_EASING.LINEAR };
    }
    return normalConfig;
  }

  static getDuration(normalDuration) {
    return this.isReduceMotionEnabled ? 0 : normalDuration;
  }
}

/**
 * Common animation presets
 * Ready-to-use animation functions
 */
export const AnimationPresets = {
  /**
   * Fade in animation
   * @param {number} duration - Animation duration (default: NORMAL)
   * @returns {Object} Animation config
   */
  fadeIn: (duration = ANIMATION_DURATION.NORMAL) => ({
    opacity: {
      from: 0,
      to: 1,
      duration,
      easing: ANIMATION_EASING.EASE_OUT,
    },
  }),

  /**
   * Fade out animation
   * @param {number} duration - Animation duration (default: NORMAL)
   * @returns {Object} Animation config
   */
  fadeOut: (duration = ANIMATION_DURATION.NORMAL) => ({
    opacity: {
      from: 1,
      to: 0,
      duration,
      easing: ANIMATION_EASING.EASE_IN,
    },
  }),

  /**
   * Scale animation (e.g., button press)
   * @param {number} fromScale - Starting scale (default: 1.0)
   * @param {number} toScale - Ending scale (default: 0.97)
   * @param {number} duration - Animation duration (default: FAST)
   * @returns {Object} Animation config
   */
  scale: (fromScale = 1.0, toScale = 0.97, duration = ANIMATION_DURATION.FAST) => ({
    scale: {
      from: fromScale,
      to: toScale,
      duration,
      easing: ANIMATION_EASING.EASE_IN_OUT,
    },
  }),

  /**
   * Slide animation
   * @param {string} direction - 'up' | 'down' | 'left' | 'right'
   * @param {number} distance - Distance to slide (default: 20)
   * @param {number} duration - Animation duration (default: NORMAL)
   * @returns {Object} Animation config
   */
  slide: (direction = 'down', distance = 20, duration = ANIMATION_DURATION.NORMAL) => {
    const axis = direction === 'up' || direction === 'down' ? 'translateY' : 'translateX';
    const multiplier = direction === 'up' || direction === 'left' ? -1 : 1;

    return {
      [axis]: {
        from: distance * multiplier,
        to: 0,
        duration,
        easing: ANIMATION_EASING.EASE_OUT,
      },
    };
  },

  /**
   * Pulse animation (scale up and down)
   * @param {number} maxScale - Maximum scale (default: 1.2)
   * @param {number} duration - Total duration (default: 350)
   * @returns {Object} Animation sequence config
   */
  pulse: (maxScale = 1.2, duration = 350) => ({
    scale: {
      sequence: [
        { to: 0.8, duration: duration * 0.29 },
        { to: maxScale, duration: duration * 0.43 },
        { to: 1.0, duration: duration * 0.29 },
      ],
      easing: ANIMATION_EASING.EASE_IN_OUT,
    },
  }),

  /**
   * Shake animation (horizontal)
   * @param {number} intensity - Shake intensity (default: 10)
   * @param {number} duration - Total duration (default: 400)
   * @returns {Object} Animation sequence config
   */
  shake: (intensity = 10, duration = 400) => ({
    translateX: {
      sequence: [
        { to: -intensity, duration: duration * 0.2 },
        { to: intensity, duration: duration * 0.2 },
        { to: -intensity / 2, duration: duration * 0.2 },
        { to: intensity / 2, duration: duration * 0.2 },
        { to: 0, duration: duration * 0.2 },
      ],
      easing: ANIMATION_EASING.EASE_IN_OUT,
    },
  }),

  /**
   * Entrance animation (fade + scale)
   * @param {number} duration - Animation duration (default: SLOW)
   * @returns {Object} Combined animation config
   */
  entrance: (duration = ANIMATION_DURATION.SLOW) => ({
    opacity: {
      from: 0,
      to: 1,
      duration,
      easing: ANIMATION_EASING.EASE_OUT,
    },
    scale: {
      from: 0.95,
      to: 1.0,
      duration,
      easing: ANIMATION_EASING.EASE_OUT_BACK,
    },
  }),

  /**
   * Slide down alert animation
   * @param {number} duration - Animation duration (default: 350)
   * @returns {Object} Combined animation config
   */
  alertSlideDown: (duration = 350) => ({
    translateY: {
      from: -50,
      to: 0,
      duration,
      easing: ANIMATION_EASING.EASE_OUT_QUINT,
    },
    opacity: {
      from: 0,
      to: 1,
      duration,
      easing: ANIMATION_EASING.EASE_OUT,
    },
  }),

  /**
   * Slide up dismissal animation
   * @param {number} duration - Animation duration (default: 200)
   * @returns {Object} Combined animation config
   */
  alertSlideUp: (duration = 200) => ({
    translateY: {
      from: 0,
      to: -50,
      duration,
      easing: ANIMATION_EASING.EASE_IN_QUAD,
    },
    opacity: {
      from: 1,
      to: 0,
      duration,
      easing: ANIMATION_EASING.EASE_IN,
    },
  }),
};

/**
 * Helper functions for animation timing
 */
export const AnimationHelpers = {
  /**
   * Calculate staggered delay for list animations
   * @param {number} index - Item index
   * @param {number} baseDelay - Base delay between items (default: 50ms)
   * @param {number} maxDelay - Maximum total delay (default: 300ms)
   * @returns {number} Delay in milliseconds
   */
  staggerDelay: (index, baseDelay = 50, maxDelay = 300) => {
    return Math.min(index * baseDelay, maxDelay);
  },

  /**
   * Convert milliseconds to seconds (for some animation libraries)
   * @param {number} ms - Milliseconds
   * @returns {number} Seconds
   */
  msToSeconds: (ms) => ms / 1000,

  /**
   * Get animation config with reduce motion support
   * @param {Object} normalConfig - Normal animation config
   * @param {Object} reducedConfig - Reduced motion alternative
   * @returns {Object} Appropriate config based on user preference
   */
  withReduceMotion: (normalConfig, reducedConfig = null) => {
    return ReduceMotionManager.getConfig(normalConfig, reducedConfig);
  },
};

/**
 * Spring animation configurations
 * For more natural, physics-based animations
 */
export const SPRING_CONFIGS = {
  // Gentle spring (smooth, subtle)
  gentle: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },

  // Bouncy spring (playful)
  bouncy: {
    damping: 10,
    stiffness: 400,
    mass: 0.8,
  },

  // Stiff spring (quick, snappy)
  stiff: {
    damping: 25,
    stiffness: 500,
    mass: 0.5,
  },

  // Slow spring (deliberate, emphasized)
  slow: {
    damping: 30,
    stiffness: 200,
    mass: 1.5,
  },
};

/**
 * Initialize reduce motion manager
 * Call this in app initialization
 */
export const initializeAnimations = async () => {
  await ReduceMotionManager.init();
};

export default {
  ANIMATION_DURATION,
  ANIMATION_EASING,
  ANIMATION_CONFIGS,
  AnimationPresets,
  AnimationHelpers,
  ReduceMotionManager,
  SPRING_CONFIGS,
  initializeAnimations,
};
