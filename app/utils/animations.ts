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

interface AnimationConfig {
  to: number;
  duration?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
  friction?: number;
  tension?: number;
  extrapolate?: string;
}

interface SpringConfig {
  to: number;
  friction?: number;
  tension?: number;
  useNativeDriver?: boolean;
}

/**
 * Create a combined animation value for multiple properties
 * @param initialValue - Initial value
 * @returns Animated.Value
 */
export const createAnimationValue = (initialValue = 0): Animated.Value => new Animated.Value(initialValue);

/**
 * Animate a single value with predefined config
 * @param animatedValue - The value to animate
 * @param config - Animation config (to, duration, easing, etc.)
 * @returns Animation promise
 */
export const animateValue = (animatedValue: Animated.Value, config: AnimationConfig): Promise<void> => new Promise((resolve) => {
    Animated.timing(animatedValue, {
      toValue: config.to,
      duration: config.duration || ANIMATION_DURATION.normal,
      easing: config.easing || EASING.standard,
      useNativeDriver: config.useNativeDriver !== false,
    }).start(resolve as unknown as EndCallback);
  });

/**
 * Animate multiple values simultaneously
 * @param animations - Array of [animatedValue, config] pairs
 * @returns Animation promise
 */
export const animateParallel = (animations: Array<[Animated.Value, AnimationConfig]>): Promise<void> => {
  const animatedConfigs = animations.map(([value, config]) => Animated.timing(value, {
      toValue: config.to,
      duration: config.duration || ANIMATION_DURATION.normal,
      easing: config.easing || EASING.standard,
      useNativeDriver: config.useNativeDriver !== false,
    }));

  return new Promise((resolve) => {
    Animated.parallel(animatedConfigs).start(resolve as unknown as EndCallback);
  });
};

/**
 * Animate with sequence (one after another)
 * @param animations - Array of [animatedValue, config] pairs
 * @returns Animation promise
 */
export const animateSequence = (animations: Array<[Animated.Value, AnimationConfig]>): Promise<void> => {
  const animatedConfigs = animations.map(([value, config]) => Animated.timing(value, {
      toValue: config.to,
      duration: config.duration || ANIMATION_DURATION.normal,
      easing: config.easing || EASING.standard,
      useNativeDriver: config.useNativeDriver !== false,
    }));

  return new Promise((resolve) => {
    Animated.sequence(animatedConfigs).start(resolve as unknown as EndCallback);
  });
};

/**
 * Create a spring animation
 * @param animatedValue - The value to animate
 * @param config - Spring config
 * @returns Animation promise
 */
export const animateSpring = (animatedValue: Animated.Value, config: SpringConfig): Promise<void> => new Promise((resolve) => {
    Animated.spring(animatedValue, {
      toValue: config.to,
      friction: config.friction || 7,
      tension: config.tension || 40,
      useNativeDriver: config.useNativeDriver !== false,
    }).start(resolve as unknown as EndCallback);
  });

/**
 * Create a looped animation
 * @param animation - The animation to loop
 * @param iterations - Number of iterations (-1 for infinite)
 * @returns Looped animation
 */
export const createLoop = (animation: Animated.CompositeAnimation, iterations = -1): Animated.CompositeAnimation =>
  Animated.loop(animation, { iterations });

/**
 * Interpolate animation values
 * @param animatedValue - The value to interpolate
 * @param inputRange - Input range
 * @param outputRange - Output range
 * @param options - Interpolation options
 * @returns Interpolated value
 */
export const interpolate = (
  animatedValue: Animated.Value,
  inputRange: number[],
  outputRange: number[] | string[],
  options: { extrapolate?: string; [key: string]: unknown } = {}
): Animated.AnimatedInterpolation => animatedValue.interpolate({
    inputRange,
    outputRange,
    extrapolate: options.extrapolate || 'clamp',
    ...options,
  });

/**
 * Create a progress animation for circular progress rings
 * @param progressValue - Progress value (0-1)
 * @param targetProgress - Target progress (0-1)
 * @param duration - Animation duration
 * @returns Animation promise
 */
export const animateProgress = (
  progressValue: Animated.Value,
  targetProgress: number,
  duration: number = ANIMATION_DURATION.slow
): Promise<void> => animateValue(progressValue, {
    to: targetProgress,
    duration,
    easing: EASING.standard,
    useNativeDriver: true,
  });

/**
 * Create a staggered animation for lists
 * @param items - Array of items to animate
 * @param animationCreator - Function that creates animation for each item
 * @param staggerDelay - Delay between each animation
 * @returns Animation promise
 */
export const animateStagger = <T>(
  items: T[],
  animationCreator: (item: T, index: number) => void,
  staggerDelay = 100
): Promise<void[]> => {
  const animations = items.map((item: T, index: number) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        animationCreator(item, index);
        resolve();
      }, index * staggerDelay);
    })
  );

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
