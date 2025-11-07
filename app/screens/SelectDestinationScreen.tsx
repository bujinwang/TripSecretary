// 入境通 - Select Destination Screen
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import CountryCard from '../components/CountryCard';
import BackButton from '../components/BackButton';
import { colors, typography, spacing } from '../theme';
import { Alert } from 'react-native';
import UserDataService from '../services/data/UserDataService';
import { useLocale } from '../i18n/LocaleContext';
import { getAllCountries, navigateToCountry, getVisaRequirement } from '../utils/countriesService';

const SelectDestinationScreen = ({ navigation, route }) => {
  const { passport: rawPassport, country } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const [selectedCountry, setSelectedCountry] = useState(country || null);
  const { t, language } = useLocale();

  // Get all countries (enabled and disabled) for this screen
  const countries = useMemo(() => {
    return getAllCountries({ enabledOnly: false, includeFallbacks: true })
      .map(country => ({
        ...country,
        displayName: language === 'zh-CN' || language === 'zh-TW'
          ? (country.nameZh || country.name)
          : country.name,
        flightTime: t(country.flightTimeKey || `home.destinations.${country.id}.flightTime`, {
          defaultValue: '—'
        }),
        visaRequirement: getVisaRequirement(country.id),
      }))
      .sort((a, b) => {
        // Sort enabled countries first, then by priority
        if (a.enabled !== b.enabled) {
          return b.enabled ? 1 : -1;
        }
        return (a.priority || 99) - (b.priority || 99);
      });
  }, [language, t]);

  const handleCountrySelect = (country) => {
    // Check if country is enabled
    if (!country.enabled) {
      Alert.alert(
        t('home.alerts.notAvailableTitle', { defaultValue: '暂未开放' }),
        t('home.alerts.notAvailableBody', { defaultValue: '该目的地暂未开放，敬请期待！' })
      );
      return;
    }

    setSelectedCountry(country);

    // Use centralized navigation helper
    navigateToCountry(
      navigation,
      country.id,
      'info', // Navigate to info screen first
      {
        passport,
        destination: {
          id: country.id,
          name: country.displayName,
          flag: country.flag,
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton
            onPress={() => navigation.goBack()}
            label={t('common.back', { defaultValue: '返回' })}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>
            {t('selectDestination.headerTitle', { defaultValue: '选择目的地' })}
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Passport Info */}
        {passport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('selectDestination.passportTitle', { defaultValue: '📘 已识别证件' })}
            </Text>
            <Card style={styles.passportCard}>
              <Text style={styles.passportType}>
                {passport?.type || t('selectDestination.passportType', { defaultValue: '中国护照' })}
              </Text>
              <View style={styles.passportRow}>
                <Text style={styles.passportLabel}>
                  {t('selectDestination.nameLabel', { defaultValue: '姓名: ' })}
                </Text>
                <Text style={styles.passportValue}>
                  {passport?.name || ''}
                </Text>
              </View>
              <View style={styles.passportRow}>
                <Text style={styles.passportLabel}>
                  {t('selectDestination.passportNumberLabel', { defaultValue: '护照号: ' })}
                </Text>
                <Text style={styles.passportValue}>
                  {passport?.passportNo || ''}
                </Text>
              </View>
              <View style={styles.passportRow}>
                <Text style={styles.passportLabel}>
                  {t('selectDestination.expiryLabel', { defaultValue: '有效期: ' })}
                </Text>
                <Text style={styles.passportValue}>
                  {passport?.expiry || ''}
                </Text>
                {passport?.expiry && <Text style={styles.validCheck}> ✅</Text>}
              </View>
            </Card>
          </View>
        )}

        {/* Destination Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('selectDestination.title', { defaultValue: '🌍 选择目的地' })}
          </Text>
          <View style={styles.countriesGrid}>
            {countries.map((country) => (
              <CountryCard
                key={country.id}
                flag={country.flag}
                name={country.displayName}
                flightTime={country.flightTime}
                visaRequirement={country.visaRequirement}
                selected={selectedCountry?.id === country.id}
                onPress={() => handleCountrySelect(country)}
                disabled={!country.enabled}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 50,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  passportCard: {
    backgroundColor: colors.primaryLight,
  },
  passportType: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  passportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  passportLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  passportValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  validCheck: {
    ...typography.body1,
  },
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default SelectDestinationScreen;
