// BorderBuddy - Login Screen
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../components/Button';
import { colors, typography, spacing } from '../theme';
import api from '../services/api';
import { useLocale, getLanguageOptions } from '../i18n/LocaleContext';

const DEFAULT_DESTINATIONS = [
  { id: 'jp', name: 'Japan', flag: '🇯🇵', popularity: 92 },
  { id: 'th', name: 'Thailand', flag: '🇹🇭', popularity: 98 },
  { id: 'kr', name: 'South Korea', flag: '🇰🇷', popularity: 86 },
  { id: 'sg', name: 'Singapore', flag: '🇸🇬', popularity: 81 },
  { id: 'my', name: 'Malaysia', flag: '🇲🇾', popularity: 77 },
  { id: 'ae', name: 'United Arab Emirates', flag: '🇦🇪', popularity: 72 },
  { id: 'us', name: 'United States', flag: '🇺🇸', popularity: 83 },
];

const DESTINATION_NAME_I18N = {
  en: {
    jp: 'Japan',
    th: 'Thailand',
    kr: 'South Korea',
    sg: 'Singapore',
    my: 'Malaysia',
    ae: 'United Arab Emirates',
    us: 'United States',
  },
  'zh-CN': {
    jp: '日本',
    th: '泰国',
    kr: '韩国',
    sg: '新加坡',
    my: '马来西亚',
    ae: '阿联酋',
    us: '美国',
  },
  'zh-TW': {
    jp: '日本',
    th: '泰國',
    kr: '韓國',
    sg: '新加坡',
    my: '馬來西亞',
    ae: '阿聯酋',
    us: '美國',
  },
  'zh-HK': {
    jp: '日本',
    th: '泰國',
    kr: '韓國',
    sg: '新加坡',
    my: '馬來西亞',
    ae: '阿聯酋',
    us: '美國',
  },
  zh: {
    jp: '日本',
    th: '泰国',
    kr: '韩国',
    sg: '新加坡',
    my: '马来西亚',
    ae: '阿联酋',
    us: '美国',
  },
  fr: {
    jp: 'Japon',
    th: 'Thaïlande',
    kr: 'Corée du Sud',
    sg: 'Singapour',
    my: 'Malaisie',
    ae: 'Émirats Arabes Unis',
    us: 'États-Unis',
  },
  de: {
    jp: 'Japan',
    th: 'Thailand',
    kr: 'Südkorea',
    sg: 'Singapur',
    my: 'Malaysia',
    ae: 'Vereinigte Arabische Emirate',
    us: 'Vereinigte Staaten',
  },
  es: {
    jp: 'Japón',
    th: 'Tailandia',
    kr: 'Corea del Sur',
    sg: 'Singapur',
    my: 'Malasia',
    ae: 'Emiratos Árabes Unidos',
    us: 'Estados Unidos',
  },
};

const toPopularity = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const decorateDestinations = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const cleaned = items
    .map((item) => ({
      id: item?.id || item?.code || item?.key || item?.countryCode,
      name: item?.name || item?.country || item?.displayName,
      flag: item?.flag || item?.flagEmoji,
      popularity: toPopularity(
        item?.popularity ?? item?.score ?? item?.visitorCount ?? item?.count
      ),
    }))
    .filter((item) => (item.id || item.name) && item.flag);

  if (cleaned.length === 0) {
    return [];
  }

  const popularityList = cleaned.map((item) => item.popularity);

  const max = Math.max(...popularityList);
  const min = Math.min(...popularityList);
  const spread = max - min || 1;
  const baseSize = 68;
  const maxSize = 104;

  return cleaned.map((item) => {
    const weight = item.popularity - min;
    const ratio = Math.max(0, weight / spread);
    const size = Math.round(baseSize + ratio * (maxSize - baseSize));

    return {
      ...item,
      size,
    };
  });
};

const getLocalizedDestinationName = (destination, language) => {
  const langKey = DESTINATION_NAME_I18N[language] ? language : 'en';
  const id = destination?.id;
  const byId = (dictionary) => (id && dictionary[id]) || null;

  const localized = byId(DESTINATION_NAME_I18N[langKey]);
  if (localized) {
    return localized;
  }

  const englishFallback = id ? byId(DESTINATION_NAME_I18N.en) : null;
  if (englishFallback) {
    return englishFallback;
  }

  return destination?.name || '';
};

const LoginScreen = ({ navigation }) => {
  const [destinations, setDestinations] = useState(
    decorateDestinations(DEFAULT_DESTINATIONS)
  );
  const { language: selectedLanguage, setLanguage, t } = useLocale();
  const languageOptions = useMemo(() => getLanguageOptions(t), [t]);
  const appName = t('common.appName');
  const tagline = t('login.tagline');
  const benefitFree = t('login.benefits.free');
  const benefitNoRegistration = t('login.benefits.noRegistration');
  const benefitInstant = t('login.benefits.instant');
  const ctaTitle = t('login.ctaTitle');
  const ctaSubtitle = t('login.ctaSubtitle');
  const buttonText = t('login.buttonText');
  const buttonSubtext = t('login.buttonSubtext');
  const hotlistLabel = t('login.hotlistLabel');
  const hotlistDescription = t('login.hotlistDescription');
  const enterCta = t('common.enterCta');
  const footerCopy = t('common.footerMessage');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const { width } = Dimensions.get('window');

  const groupedDestinations = useMemo(() => {
    const chunkSize = 3;
    const result = [];
    for (let i = 0; i < destinations.length; i += chunkSize) {
      result.push(destinations.slice(i, i + chunkSize));
    }
    return result;
  }, [destinations]);

  const handleEnter = () => {
    console.log('Free entry pressed');
    navigation.replace('MainTabs');
  };

  const handleButtonPress = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      handleEnter();
    });
  };

  useEffect(() => {
    let isMounted = true;

    // Staggered animations for entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Slide animation with delay
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 200);

    const loadDestinations = async () => {
      try {
        const result = await api.getTrendingDestinations({
          campaign: 'national-day',
          limit: 12,
        });

        const payload =
          Array.isArray(result?.destinations) ? result.destinations : result;

        const decorated = decorateDestinations(payload);

        if (isMounted && decorated.length > 0) {
          setDestinations(decorated);
        }
      } catch (error) {
        if (error?.status !== 404) {
          console.warn('Failed to load trending destinations, using default data:', error.message);
        }
      }
    };

    loadDestinations();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E8F9F0', '#F8FFFE', '#E8F9F0']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.ScrollView
          style={[
            styles.scrollContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Language Selector */}
          <Animated.View
            style={[
              styles.languageBarWrapper,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {languageOptions.map(({ code, label }, index) => {
              const isActive = selectedLanguage === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageOption,
                    isActive && styles.languageOptionActive,
                  ]}
                  onPress={() => setLanguage(code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.languageLabel,
                      isActive && styles.languageLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Main Content */}
          <Animated.View
            style={[
              styles.mainContent,
              {
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* App Name with Enhanced Styling */}
            <View style={styles.appNameContainer}>
              <Text style={styles.appName}>{appName}</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>

            {/* Value Proposition */}
            <View style={styles.valueProposition}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💫</Text>
                <Text style={styles.benefitText}>{benefitFree}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🚀</Text>
                <Text style={styles.benefitText}>{benefitNoRegistration}</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>⚡</Text>
                <Text style={styles.benefitText}>{benefitInstant}</Text>
              </View>
            </View>

            {/* Enhanced CTA Section */}
            <View style={styles.ctaSection}>
              <Text style={styles.ctaTitle}>{ctaTitle}</Text>
              <Text style={styles.ctaSubtitle}>
                {ctaSubtitle}
              </Text>

              <Animated.View
                style={[
                  styles.buttonContainer,
                  {
                    transform: [{ scale: buttonScale }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.enhancedButton}
                  onPress={handleButtonPress}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#07C160', '#06AD56']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonIcon}>✈️</Text>
                    <Text style={styles.buttonText}>{buttonText}</Text>
                    <Text style={styles.buttonSubtext}>{buttonSubtext}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Enhanced Destination Showcase */}
            <View style={styles.destinationSection}>
              <View style={styles.destinationHeader}>
                <Text style={styles.destinationLabel}>{hotlistLabel}</Text>
                <Text style={styles.destinationDescription}>
                  {hotlistDescription}
                </Text>
              </View>

              <View style={styles.destinationGrid}>
                {groupedDestinations.map((row, rowIndex) => (
                  <View
                    key={`dest-row-${rowIndex}`}
                    style={[
                      styles.destinationRow,
                      row.length < 3 && styles.destinationRowCompact,
                    ]}
                  >
                    {row.map((destination, destIndex) => {
                      const localizedName = getLocalizedDestinationName(
                        destination,
                        selectedLanguage
                      );
                      const key = destination.id || destination.name || localizedName;

                      return (
                        <Animated.View
                          key={key}
                          style={[
                            styles.destinationCard,
                            {
                              transform: [
                                {
                                  scale: scaleAnim.interpolate({
                                    inputRange: [0.8, 1],
                                    outputRange: [0.8, 1],
                                    extrapolate: 'clamp',
                                  })
                                }
                              ]
                            }
                          ]}
                        >
                          <View style={styles.destinationCardContent}>
                            <Text style={styles.destinationFlag}>
                              {destination.flag}
                            </Text>
                            <Text style={styles.destinationName}>
                              {localizedName}
                            </Text>
                            <View style={styles.popularityIndicator}>
                              <Text style={styles.popularityText}>
                                {t('login.popularityText', { percent: destination.popularity })}
                              </Text>
                            </View>
                          </View>
                        </Animated.View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeAnim
              }
            ]}
          >
            <Text style={styles.footerCopy}>
              {footerCopy}
            </Text>
          </Animated.View>
        </Animated.ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl * 2.5,
    minHeight: '100%',
    justifyContent: 'center',
  },
  languageBarWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.xs,
    rowGap: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  languageOption: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.lg,
  },
  languageOptionActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  languageLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  languageLabelActive: {
    color: colors.white,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  appNameContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appName: {
    ...typography.h1,
    color: colors.text,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
    lineHeight: 44,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
    letterSpacing: 1,
    textAlign: 'center',
  },
  valueProposition: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  benefitItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(7, 193, 96, 0.05)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(7, 193, 96, 0.15)',
    minWidth: 80,
  },
  benefitIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  benefitText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
  ctaSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  ctaTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  ctaSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  enhancedButton: {
    width: '95%',
    maxWidth: 380,
    borderRadius: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.xl,
    minHeight: 56,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
    flexShrink: 1,
    textAlign: 'center',
  },
  buttonSubtext: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 11,
    marginTop: 1,
    fontWeight: '500',
    textAlign: 'center',
  },
  destinationSection: {
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  destinationHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  destinationLabel: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  destinationDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  destinationGrid: {
    alignItems: 'center',
  },
  destinationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  destinationRowCompact: {
    justifyContent: 'center',
  },
  destinationCard: {
    backgroundColor: colors.white,
    borderRadius: spacing.xl,
    padding: spacing.lg,
    alignItems: 'center',
    width: 115,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(7, 193, 96, 0.12)',
    marginHorizontal: spacing.xs,
  },
  destinationCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  destinationFlag: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  destinationName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  popularityIndicator: {
    backgroundColor: 'rgba(7, 193, 96, 0.1)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.xs,
    marginTop: 'auto',
  },
  popularityText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 9,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  footerCopy: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    fontSize: 11,
  },
});

export default LoginScreen;
