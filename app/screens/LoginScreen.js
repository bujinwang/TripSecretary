// 出境通 - Login Screen
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
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
  const hotlistLabel = t('login.hotlistLabel');
  const hotlistDescription = t('login.hotlistDescription');
  const enterCta = t('common.enterCta');
  const footerCopy = t('common.footerMessage');

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

  useEffect(() => {
    let isMounted = true;

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
          console.warn('加载热门目的地失败，使用默认数据:', error.message);
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
      <View style={styles.content}>
        <View style={styles.languageBar}>
          {languageOptions.map(({ code, label }) => {
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
        </View>

        <View style={styles.appNameContainer}>
          <Text style={styles.appName}>{appName}</Text>
        </View>

        <View style={styles.hotlistSection}>
          <View style={styles.hotlistHeader}>
            <Text style={styles.hotlistLabel}>{hotlistLabel}</Text>
            <Text style={styles.hotlistDescription}>{hotlistDescription}</Text>
          </View>
          {groupedDestinations.map((row, rowIndex) => (
            <View
              key={`dest-row-${rowIndex}`}
              style={[
                styles.hotlistRow,
                row.length < 3 && styles.hotlistRowCompact,
              ]}
            >
              {row.map((destination) => {
                const localizedName = getLocalizedDestinationName(
                  destination,
                  selectedLanguage
                );
                const key = destination.id || destination.name || localizedName;

                return (
                  <View key={key} style={styles.destinationBubble}>
                    <Text style={styles.destinationFlag}>{destination.flag}</Text>
                    <Text style={styles.destinationName}>{localizedName}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            title={enterCta}
            onPress={handleEnter}
            variant="primary"
            icon={<Text style={styles.buttonIcon}>🚀</Text>}
          />
          <Text style={styles.footerCopy}>
            {footerCopy}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl * 1.5,
  },
  languageBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.lg,
    marginBottom: spacing.md,
    alignSelf: 'center',
    gap: spacing.xs,
  },
  languageOption: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.md,
  },
  languageOptionActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  languageLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  languageLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  appNameContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    ...typography.h3,
    letterSpacing: 1,
    color: colors.text,
    fontWeight: '700',
  },
  hotlistSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  hotlistHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hotlistLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hotlistDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  hotlistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  hotlistRowCompact: {
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 24,
  },
  destinationBubble: {
    backgroundColor: 'rgba(7, 193, 96, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    width: 92,
    height: 92,
    borderRadius: 46,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(7, 193, 96, 0.12)',
  },
  destinationFlag: {
    fontSize: 30,
  },
  destinationName: {
    ...typography.caption,
    color: colors.text,
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  footerCopy: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default LoginScreen;
