/**
 * ProgressRing Component - Circular progress indicator
 * Enhanced with gradient ring and animated particles for visual appeal
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Svg, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { designTokens, spacing, shadows, typography } from '../../theme/designTokens';
import { animateProgress, createAnimationValue, ANIMATIONS } from '../../utils/animations';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressRing = ({
  progress = 0,           // 0-100
  size = 140,             // diameter in px (increased default for better visibility)
  strokeWidth = 10,       // ring thickness (increased)
  color = designTokens.primary,
  backgroundColor = designTokens.borderLight,
  showPercentage = true,  // display number in center
  animated = true,        // smooth animation
  showGradient = true,    // use gradient for progress ring
  showParticles = true,   // show animated particles
  children,               // center content override
  style,
}) => {
  const animatedProgress = useRef(createAnimationValue(0)).current;
  const scaleAnim = useRef(createAnimationValue(0.9)).current;
  const particleAnim = useRef(createAnimationValue(0)).current;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  // Animate progress changes
  useEffect(() => {
    if (animated) {
      // Progress ring animation
      animateProgress(animatedProgress, progress / 100, {
        duration: ANIMATIONS.duration.slow,
      });
      
      // Scale animation for entrance
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Particle rotation animation
      if (showParticles) {
        Animated.loop(
          Animated.timing(particleAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ).start();
      }
    } else {
      animatedProgress.setValue(progress / 100);
      scaleAnim.setValue(1);
    }
  }, [progress, animated]);

  // Calculate stroke dash offset for animation
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // Particle rotation
  const particleRotation = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[
      styles.container, 
      { 
        width: size, 
        height: size,
        transform: [{ scale: scaleAnim }]
      }, 
      style
    ]}>
      {/* Shadow layer for depth */}
      <View style={[
        styles.shadowLayer,
        {
          width: size - 8,
          height: size - 8,
          borderRadius: (size - 8) / 2,
          ...shadows.medium,
        }
      ]} />

      <Svg width={size} height={size} style={styles.svg}>
        {showGradient && (
          <Defs>
            <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={designTokens.primaryDark} stopOpacity="1" />
            </SvgLinearGradient>
          </Defs>
        )}
        
        {/* Background circle with subtle styling */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.3}
        />
        
        {/* Progress circle with gradient */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={showGradient ? "url(#progressGradient)" : color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Animated particles around the ring */}
      {showParticles && progress > 0 && (
        <Animated.View 
          style={[
            styles.particleContainer,
            {
              transform: [{ rotate: particleRotation }]
            }
          ]}
        >
          {[0, 120, 240].map((angle, index) => (
            <View
              key={index}
              style={[
                styles.particle,
                {
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateX: radius - 10 }
                  ]
                }
              ]}
            />
          ))}
        </Animated.View>
      )}

      {/* Center content */}
      <View style={styles.centerContent}>
        {children ? (
          children
        ) : showPercentage ? (
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageText, { color }]}>
              {Math.round(progress)}
            </Text>
            <Text style={[styles.percentageSymbol, { color: designTokens.textSecondary }]}>
              %
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    backgroundColor: designTokens.background,
  },
  svg: {
    position: 'absolute',
  },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: designTokens.accent,
    opacity: 0.8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  percentageText: {
    ...typography.display,
    fontWeight: '800',
    textAlign: 'center',
  },
  percentageSymbol: {
    ...typography.h4,
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default ProgressRing;