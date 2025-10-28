/**
 * GlassCard Example Screen
 *
 * Demonstrates the GlassCard component in various configurations.
 * Shows how the glass effect works over different backgrounds.
 *
 * USAGE:
 * Import this screen and add it to your navigation stack to test the component.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  Platform,
} from 'react-native';
import { GlassCard } from './GlassCard';

/**
 * Example Screen Component
 *
 * Demonstrates GlassCard over:
 * 1. A gradient/colored background
 * 2. An image background
 * 3. Scrollable content (to show blur effect on dynamic content)
 */
export const GlassCardExampleScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Background colors for the gradient-like effect
  const backgroundColor = isDarkMode ? '#1a1a2e' : '#e3f2fd';
  const accentColor = isDarkMode ? '#16213e' : '#bbdefb';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Background with gradient-like effect using multiple views */}
        <View style={[styles.backgroundAccent, { backgroundColor: accentColor }]} />

        {/* Header */}
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
          Liquid Glass Cards
        </Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? '#aaa' : '#666' }]}>
          iOS 26 Translucent Design
        </Text>

        {/* Example 1: Basic Glass Card */}
        <GlassCard style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Default Glass Card
            </Text>
            <Text style={[styles.cardText, { color: isDarkMode ? '#ccc' : '#444' }]}>
              This card uses default blur and tint settings that adapt to the current color scheme.
              The blur effect makes background content visible but diffused.
            </Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Action Button</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Example 2: Custom Tint Glass Card */}
        <GlassCard
          style={styles.card}
          tintColor="rgba(100, 150, 255, 0.3)" // Blue tint
          blurAmount={60}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Custom Blue Tint
            </Text>
            <Text style={[styles.cardText, { color: isDarkMode ? '#ccc' : '#444' }]}>
              This card has a custom blue tint overlay and reduced blur amount (60 instead of 80).
              Notice the different glass color effect.
            </Text>
          </View>
        </GlassCard>

        {/* Example 3: Prominent Blur Type */}
        <GlassCard
          style={styles.card}
          blurType="prominent"
          cornerRadius={24}
          blurAmount={100}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Prominent Blur
            </Text>
            <Text style={[styles.cardText, { color: isDarkMode ? '#ccc' : '#444' }]}>
              Uses the 'prominent' blur type with maximum blur amount and larger corner radius.
              Creates a stronger glass effect.
            </Text>
          </View>
        </GlassCard>

        {/* Example 4: Minimal Glass Card (no border, no shadow) */}
        <GlassCard
          style={styles.card}
          borderWidth={0}
          showShadow={false}
          cornerRadius={12}
        >
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Minimal Style
            </Text>
            <Text style={[styles.cardText, { color: isDarkMode ? '#ccc' : '#444' }]}>
              No border rim, no shadow. A cleaner, more subtle glass effect for content that
              should blend seamlessly with the background.
            </Text>
          </View>
        </GlassCard>

        {/* Example 5: Over an Image Background */}
        <View style={styles.imageSection}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
            }}
            style={styles.imageBackground}
            imageStyle={{ borderRadius: 16 }}
          >
            <GlassCard
              style={styles.overlayCard}
              tintColor={isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)'}
              blurAmount={90}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: '#fff' }]}>
                  Over Image Background
                </Text>
                <Text style={[styles.cardText, { color: '#f0f0f0' }]}>
                  Glass cards work beautifully over images, creating a frosted effect that
                  maintains context while ensuring content readability.
                </Text>
              </View>
            </GlassCard>
          </ImageBackground>
        </View>

        {/* Example 6: Compact Glass Cards (Grid Layout) */}
        <View style={styles.gridContainer}>
          <GlassCard style={styles.gridCard} cornerRadius={12}>
            <View style={styles.gridCardContent}>
              <Text style={[styles.gridCardEmoji, { fontSize: 32 }]}>🌟</Text>
              <Text style={[styles.gridCardLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                Premium
              </Text>
            </View>
          </GlassCard>

          <GlassCard
            style={styles.gridCard}
            cornerRadius={12}
            tintColor="rgba(255, 100, 100, 0.3)"
          >
            <View style={styles.gridCardContent}>
              <Text style={[styles.gridCardEmoji, { fontSize: 32 }]}>🔥</Text>
              <Text style={[styles.gridCardLabel, { color: isDarkMode ? '#fff' : '#000' }]}>
                Trending
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Usage Notes */}
        <View style={styles.notesSection}>
          <Text style={[styles.notesTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            Implementation Notes:
          </Text>
          <Text style={[styles.notesText, { color: isDarkMode ? '#ccc' : '#666' }]}>
            • Best viewed on iOS device (simulator has less pronounced blur){'\n'}
            • Toggle light/dark mode to see automatic adaptation{'\n'}
            • Enable "Reduce Transparency" in Settings → Accessibility to see fallback{'\n'}
            • Performance is optimized - safe for most use cases{'\n'}
            • Avoid deeply nesting multiple blur layers
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
  },
  backgroundAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    opacity: 0.3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    fontWeight: '500',
  },

  // Card Styles
  card: {
    marginBottom: 20,
    // Let GlassCard handle background/border
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  button: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)', // iOS blue
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Image Background Example
  imageSection: {
    marginBottom: 20,
  },
  imageBackground: {
    width: '100%',
    height: 300,
    justifyContent: 'flex-end',
    padding: 16,
  },
  overlayCard: {
    // Size determined by content
  },

  // Grid Layout Example
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    marginHorizontal: 6,
    aspectRatio: 1, // Square cards
  },
  gridCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  gridCardEmoji: {
    marginBottom: 8,
  },
  gridCardLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Notes Section
  notesSection: {
    marginTop: 20,
    padding: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },

  bottomSpacer: {
    height: 40,
  },
});

export default GlassCardExampleScreen;
