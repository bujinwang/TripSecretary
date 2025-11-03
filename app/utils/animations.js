/**
 * Animation utilities for ThailandEntryFlowScreen redesign
 * Provides consistent animation patterns and easing functions
 */

import { Animated, Easing } from 'react-native';

// Animation duration constants
export const ANIMATION_DURATION = {
  quick: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Easing functions
export const EASING = {
  standard: Easing.inOut(Easing.quad),
  accelerate: Easing.out(Easing.cubic),
  decelerate: Easing.in(Easing.cubic),
  bounce: Easing.out(Easing.back(1.2)),
  elastic: Easing.out(Easing.elastic(1)),
};

// Predefined animation configurations
export const ANIMATIONS = {
  // Scale animations for press feedback
  press: {
    scale: {
      from: 1,
      to: 0.95,
      duration: ANIMATION_DURATION.quick,
      easing: EASING.accelerate,
    },
    opacity: {
      from: 1,
      to: 0.8,
      duration: ANIMATION_DURATION.quick,
      easing: EASING.accelerate,
    },
  },

  // Fade animations
  fadeIn: {
    opacity: {
      from: 0,
      to: 1,
      duration: ANIMATION_DURATION.normal,
      easing: EASING.decelerate,
    },
  },

  fadeOut: {
    opacity: {
      from: 1,
      to: 0,
      duration: ANIMATION_DURATION.normal,
      easing: EASING.accelerate,
    },
  },

  // Slide animations
  slideUp: {
    translateY: {
      from: 20,
      to: 0,
      duration: ANIMATION_DURATION.normal,
      easing: EASING.bounce,
    },
  },

  slideDown: {
    translateY: {
      from: -20,
      to: 0,
      duration: ANIMATION_DURATION.normal,
      easing: EASING.bounce,
    },
  },

  // Progress ring animation
  progressRing: {
    duration: ANIMATION_DURATION.slow,
    easing: EASING.standard,
    useNativeDriver: true,
  },

  // State transitions
  stateTransition: {
    duration: ANIMATION_DURATION.normal,
    easing: EASING.standard,
  },
};

/**
 * Create a combined animation value for multiple properties
 * @param {Object} config - Animation configuration
 * @returns {Animated.Value} - Animated value
 */
export const createAnimationValue = (initialValue = 0) => {
  return new Animated.Value(initialValue);
};

/**
 * Animate a single value with predefined config
 * @param {Animated.Value} animatedValue - The value to animate
 * @param {Object} config - Animation config (to, duration, easing, etc.)
 * @returns {Promise} - Animation promise
 */
export const animateValue = (animatedValue, config) => {
  return new Promise((resolve) => {
    Animated.timing(animatedValue, {
      toValue: config.to,
      duration: config.duration || ANIMATION_DURATION.normal,
      easing: config.easing || EASING.standard,
      useNativeDriver: config.useNativeDriver !== false,
    }).start(resolve);
  });
};

/**
 * Animate multiple values simultaneously
 * @param {Array} animations - Array of [animatedValue, config] pairs
 * @returns {Promise} - Animation promise
 */
export const animateParallel = (animations) => {
  const animatedConfigs = animations.map(([value, config]) => {
    return Animated.timing(value, {
      toValue: config.to,
      duration: config.duration || ANIMATION_DURATION.normal,
      easing: config.easing || EASING.standard,
      useNativeDriver: config.useNativeDriver !== false,
    });
  });

  return new Promise((resolve) => {
    Animated.parallel(animatedConfigs).start(resolve);
  });
};

/**
 * Animate with sequence (one after another)
 * @param {Array} animations - Array of [animatedValue, config] pairs
 * @returns {Promise} - Animation promise
 */
export const animateSequence = (animations) => {
  const animatedConfigs = animations.map(([value, config]) => {
    return Animated.timing(value, {
      toValue: config.to,
      duration: config.duration || ANIMATION_DURATION.normal,
      easing: config.easing || EASING.standard,
      useNativeDriver: config.useNativeDriver !== false,
    });
  });

  return new Promise((resolve) => {
    Animated.sequence(animatedConfigs).start(resolve);
  });
};

/**
 * Create a spring animation
 * @param {Animated.Value} animatedValue - The value to animate
 * @param {Object} config - Spring config
 * @returns {Promise} - Animation promise
 */
export const animateSpring = (animatedValue, config) => {
  return new Promise((resolve) => {
    Animated.spring(animatedValue, {
      toValue: config.to,
      friction: config.friction || 7,
      tension: config.tension || 40,
      useNativeDriver: config.useNativeDriver !== false,
    }).start(resolve);
  });
};

/**
 * Create a looped animation
 * @param {Animated.CompositeAnimation} animation - The animation to loop
 * @param {number} iterations - Number of iterations (-1 for infinite)
 * @returns {Animated.CompositeAnimation} - Looped animation
 */
export const createLoop = (animation, iterations = -1) => {
  return Animated.loop(animation, { iterations });
};

/**
 * Interpolate animation values
 * @param {Animated.Value} animatedValue - The value to interpolate
 * @param {Array} inputRange - Input range
 * @param {Array} outputRange - Output range
 * @param {Object} options - Interpolation options
 * @returns {Animated.AnimatedInterpolation} - Interpolated value
 */
export const interpolate = (animatedValue, inputRange, outputRange, options = {}) => {
  return animatedValue.interpolate({
    inputRange,
    outputRange,
    extrapolate: options.extrapolate || 'clamp',
    ...options,
  });
};

/**
 * Create a progress animation for circular progress rings
 * @param {Animated.Value} progressValue - Progress value (0-1)
 * @param {number} targetProgress - Target progress (0-1)
 * @param {number} duration - Animation duration
 * @returns {Promise} - Animation promise
 */
export const animateProgress = (progressValue, targetProgress, duration = ANIMATION_DURATION.slow) => {
  return animateValue(progressValue, {
    to: targetProgress,
    duration,
    easing: EASING.standard,
    useNativeDriver: true,
  });
};

/**
 * Create a staggered animation for lists
 * @param {Array} items - Array of items to animate
 * @param {Function} animationCreator - Function that creates animation for each item
 * @param {number} staggerDelay - Delay between each animation
 * @returns {Promise} - Animation promise
 */
export const animateStagger = (items, animationCreator, staggerDelay = 100) => {
  const animations = items.map((item, index) => {
    return Animated.delay(index * staggerDelay).start(() => {
      return animationCreator(item, index);
    });
  });

  return Promise.all(animations);
};

export default {
  ANIMATION_DURATION,
  EASING,
  ANIMATIONS,
  createAnimationValue,
  animateValue,
  animateParallel,
  animateSequence,
  animateSpring,
  createLoop,
  interpolate,
  animateProgress,
  animateStagger,
};