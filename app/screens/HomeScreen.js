// 入境通 - Home Screen
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import CountryCard from '../components/CountryCard';
import { colors, typography, spacing, borderRadius } from '../theme';
import { findRecentValidGeneration, formatDate } from '../utils/historyChecker';
import api from '../services/api';
import { useLocale } from '../i18n/LocaleContext';
import PassportDataService from '../services/data/PassportDataService';

const HOT_COUNTRIES = [
  { id: 'jp', flag: '🇯🇵', name: 'Japan', flightTimeKey: 'home.destinations.japan.flightTime', enabled: true },
  { id: 'th', flag: '🇹🇭', name: 'Thailand', flightTimeKey: 'home.destinations.thailand.flightTime', enabled: true },
  { id: 'hk', flag: '🇭🇰', name: 'Hong Kong', flightTimeKey: 'home.destinations.hongKong.flightTime', enabled: true },
  { id: 'tw', flag: '🇹🇼', name: 'Taiwan', flightTimeKey: 'home.destinations.taiwan.flightTime', enabled: true },
  { id: 'kr', flag: '🇰🇷', name: 'South Korea', flightTimeKey: 'home.destinations.korea.flightTime', enabled: true },
  { id: 'sg', flag: '🇸🇬', name: 'Singapore', flightTimeKey: 'home.destinations.singapore.flightTime', enabled: true },
  { id: 'my', flag: '🇲🇾', name: 'Malaysia', flightTimeKey: 'home.destinations.malaysia.flightTime', enabled: true },
  { id: 'us', flag: '🇺🇸', name: 'United States', flightTimeKey: 'home.destinations.usa.flightTime', enabled: true },
];

const UPCOMING_TRIPS_CONFIG = [
  {
    id: 'jp',
    flag: '🇯🇵',
    titleKey: 'home.pendingTrips.cards.jp.title',
    city: '东京',
    cityEn: 'Tokyo',
    daysFromNow: 0,
    flightNumber: 'CA981',
    hotelName: 'Tokyo New Otani Hotel',
    hotelAddress: '4-1 Kioicho, Chiyoda City, Tokyo',
    contactPhone: '+81 3 3261 1111',
    stayDuration: '7',
  },
  {
    id: 'th',
    flag: '🇹🇭',
    titleKey: 'home.pendingTrips.cards.th.title',
    city: '曼谷',
    cityEn: 'Bangkok',
    daysFromNow: 2,
    flightNumber: 'TG615',
    hotelName: 'Bangkok Grand Hotel',
    hotelAddress: '123 Sukhumvit Road, Bangkok',
    contactPhone: '+66 2 123 4567',
    stayDuration: '7',
  },
];

const HomeScreen = ({ navigation }) => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passportData, setPassportData] = useState(null);

  const { t, language } = useLocale();

  const localizedHotCountries = useMemo(
    () =>
      HOT_COUNTRIES.map((country) => ({
        ...country,
        displayName: t(`home.destinationNames.${country.id}`, {
          defaultValue: country.name || country.id,
        }),
        flightTime: t(country.flightTimeKey, {
          defaultValue: '—',
        }),
      })),
    [language, t]
  );

  const upcomingTrips = useMemo(() => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    return UPCOMING_TRIPS_CONFIG.map((trip) => {
      const targetDate = new Date(Date.now() + trip.daysFromNow * DAY_MS);
      const isoDate = targetDate.toISOString().split('T')[0];

      return {
        ...trip,
        title: t(trip.titleKey),
        departureLabel: `${isoDate} ${t('home.pendingTrips.departSuffix')}`,
        destination: {
          id: trip.id,
          name: t(`home.destinationNames.${trip.id}`, {
            defaultValue: trip.id,
          }),
          flag: trip.flag,
        },
        travelInfo: {
          flightNumber: trip.flightNumber,
          arrivalDate: isoDate,
          hotelName: trip.hotelName,
          hotelAddress: trip.hotelAddress,
          contactPhone: trip.contactPhone,
          stayDuration: trip.stayDuration,
          travelPurpose: 'tourism',
        },
      };
    });
  }, [t, language]);

  // Get passport name for greeting (use given name, not surname)
  const passportName = passportData?.fullName 
    ? (passportData.fullName.includes(',') 
        ? passportData.fullName.split(',')[1].trim() // Get given name from "SURNAME, GIVENNAME" format
        : passportData.fullName.split(' ').slice(1).join(' ').trim() || passportData.fullName.trim()) // Get given name from "SURNAME GIVENNAME" format
    : '';
  
  const hasPassport = !!passportData;

  const headerTitle = t('home.header.title');
  const greetingText = t('home.greeting', { name: passportName });
  const welcomeMessage = t('home.welcomeText');
  const pendingSectionTitle = t('home.sections.pending');
  const exploreSectionTitle = t('home.sections.whereToGo');

  // 加载护照和历史记录
  useEffect(() => {
    loadPassportData();
    loadHistory();
  }, []);

  const loadPassportData = async () => {
    try {
      // Load primary passport for the current user
      const userId = 'user_001'; // TODO: Get from auth context
      const passport = await PassportDataService.getPrimaryPassport(userId);
      
      if (passport) {
        setPassportData(passport);
      }
    } catch (error) {
      console.log('Failed to load passport data:', error.message);
    }
  };

  const loadHistory = async () => {
    try {
      // 尝试从API加载历史记录
      const result = await api.getHistory(20, 0);
      setHistoryList(result.items || []);
    } catch (error) {
      console.log('无法连接后端API，使用本地模拟数据:', error.message);
      // 使用mock数据作为后备（后端未运行时）
      setHistoryList(getMockHistory());
    }
  };

  const getMockHistory = () => {
    // 返回空数组，不使用mock数据
    return [];
  };

  const handleScanPassport = () => {
    navigation.navigate('ScanPassport');
  };

  const handleCountrySelect = async (country) => {
    // Check if country is enabled
    if (!country.enabled) {
      Alert.alert(t('home.alerts.notAvailableTitle'), t('home.alerts.notAvailableBody'));
      return;
    }

    if (!hasPassport) {
      // 没有护照，先扫描
      navigation.navigate('ScanPassport');
      return;
    }

    const countryName = t(`home.destinationNames.${country.id}`, {
      defaultValue: country.name || country.id,
    });
    const destinationForNav = {
      ...country,
      name: countryName,
    };

    // Convert passport data to legacy format for navigation
    const passportForNav = {
      type: t('home.passport.type'),
      name: passportData.fullName || '',
      nameEn: passportData.fullName || '',
      passportNo: passportData.passportNumber || '',
      expiry: passportData.expiryDate || '',
    };

    // Special handling for Japan
    if (country.id === 'jp') {
      navigation.navigate('JapanInfo', {
        passport: passportForNav,
        destination: destinationForNav,
      });
      return;
    }

    if (country.id === 'th') {
      navigation.navigate('ThailandInfo', {
        passport: passportForNav,
        destination: destinationForNav,
      });
      return;
    }

    if (country.id === 'sg') {
      navigation.navigate('SingaporeInfo', {
        passport: passportForNav,
        destination: destinationForNav,
      });
      return;
    }

    if (country.id === 'my') {
      navigation.navigate('MalaysiaInfo', {
        passport: passportForNav,
        destination: destinationForNav,
      });
      return;
    }

    if (country.id === 'tw') {
      navigation.navigate('TaiwanInfo', {
        passport: passportForNav,
        destination: destinationForNav,
      });
      return;
    }

    if (country.id === 'hk') {
      navigation.navigate('HongKongInfo', {
        passport: passportForNav,
        destination: destinationForNav,
      });
      return;
    }

    if (country.id === 'kr') {
      navigation.navigate('KoreaInfo', {
        passport: passportForNav,
        destination: destinationForNav,
      });
      return;
    }

    if (country.id === 'us') {
      navigation.navigate('USAInfo', {
        passport: passportForNav,
        destination: destinationForNav,
      });
      return;
    }

    // 检查是否有该目的地的有效历史记录
    const recentRecord = findRecentValidGeneration(
      country.id,
      passportForNav.passportNo,
      historyList
    );

    if (recentRecord) {
      // 有有效的历史记录，询问用户
      const { validity } = recentRecord;

      let message = t('home.alerts.historyFoundBody.pre', {
        country: countryName,
      });
      message += '\n\n';
      message += `${t('home.alerts.historyFoundBody.flight')}: ${
        recentRecord.travelInfo?.flightNumber || t('home.common.unknown')
      }\n`;
      message += `${t('home.alerts.historyFoundBody.date')}: ${
        formatDate(recentRecord.travelInfo?.arrivalDate) || t('home.common.unknown')
      }\n`;
      message += `${t('home.alerts.historyFoundBody.hotel')}: ${
        recentRecord.travelInfo?.hotelName || t('home.common.unknown')
      }\n\n`;

      if (validity.warning) {
        message += `⚠️ ${validity.warning}\n\n`;
      }

      message += t('home.alerts.historyFoundBody.question');

      Alert.alert(
        t('home.alerts.historyFoundTitle'),
        message,
        [
          {
            text: t('common.view'),
            onPress: () => {
              // 直接查看历史记录
                  navigation.navigate('Result', {
                    passport: passportForNav,
                    destination: destinationForNav,
                    travelInfo: recentRecord.travelInfo,
                    generationId: recentRecord.id,
                    fromHistory: true,
                  });
                },
          },
          {
            text: t('home.alerts.historyFoundBody.regenerate'),
            onPress: () => {
              // 重新生成
              navigation.navigate('TravelInfo', {
                destination: destinationForNav,
                passport: passportForNav,
              });
            },
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } else {
      // 没有历史记录，直接跳转到补充旅行信息
      navigation.navigate('TravelInfo', {
        destination: destinationForNav,
        passport: passportForNav,
      });
    }
  };

  const handleViewAllCountries = () => {
    // 查看所有国家
    const passportForNav = passportData ? {
      type: t('home.passport.type'),
      name: passportData.fullName || '',
      nameEn: passportData.fullName || '',
      passportNo: passportData.passportNumber || '',
      expiry: passportData.expiryDate || '',
    } : null;
    
    navigation.navigate('SelectDestination', { 
      passport: passportForNav
    });
  };

  const getHistoryDisplayTime = (item) => {
    if (item?.travelInfo?.generatedAtLabel) {
      return item.travelInfo.generatedAtLabel;
    }

    if (item?.travelInfo?.arrivalDate) {
      return formatDate(item.travelInfo.arrivalDate);
    }

    if (item?.createdAt) {
      return formatDate(item.createdAt);
    }

    return '';
  };

  const renderHistoryCards = () => {
    if (!historyList.length) {
      return (
        <Card style={styles.historyCard}>
          <View style={styles.historyItem}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle}>{t('home.history.emptyTitle')}</Text>
              <Text style={styles.historyTime}>{t('home.history.emptySubtitle')}</Text>
            </View>
          </View>
        </Card>
      );
    }

    return historyList.slice(0, 2).map((item) => (
      <Card
        key={item.id}
        style={styles.historyCard}
        pressable
        onPress={() =>
          navigation.navigate('Result', {
            passport: item.passport,
            destination: {
              ...item.destination,
              name: t(`home.destinationNames.${item.destination?.id}`, {
                defaultValue: item.destination?.name || t('home.common.unknown'),
              }),
            },
            travelInfo: item.travelInfo,
            generationId: item.id,
            fromHistory: true,
          })
        }
      >
        <View style={styles.historyItem}>
          <Text style={styles.historyFlag}>{item.destination?.flag || '🌍'}</Text>
          <View style={styles.historyInfo}>
            <Text style={styles.historyTitle}>
              {t('home.history.cardTitle', {
                country: t(`home.destinationNames.${item.destination?.id}`, {
                  defaultValue:
                    item.destination?.name || t('home.common.unknown'),
                }),
              })}
            </Text>
            <Text style={styles.historyTime}>{getHistoryDisplayTime(item)}</Text>
          </View>
          <Text style={styles.historyArrow}>›</Text>
        </View>
      </Card>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <TouchableOpacity 
            style={styles.headerRight}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.settingsIcon}>🌐</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{greetingText}</Text>
          <Text style={styles.welcomeText}>{welcomeMessage}</Text>
        </View>

        {/* Pending Entries */}
        {upcomingTrips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{pendingSectionTitle}</Text>
            {upcomingTrips.map((trip) => (
              <Card
                key={trip.id}
                style={styles.historyCard}
                pressable
                onPress={() =>
                  navigation.navigate('Result', {
                    passport: passportData,
                    destination: trip.destination,
                    travelInfo: trip.travelInfo,
                    fromHistory: true,
                  })
                }
              >
                <View style={styles.historyItem}>
                  <Text style={styles.historyFlag}>{trip.flag}</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{trip.title}</Text>
                    <Text style={styles.historyTime}>{trip.departureLabel}</Text>
                  </View>
                  <Text style={styles.historyArrow}>›</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Where to Go */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{exploreSectionTitle}</Text>
          <View style={styles.countriesGrid}>
            {localizedHotCountries.map((country) => (
              <CountryCard
                key={country.id}
                flag={country.flag}
                name={country.displayName}
                flightTime={country.flightTime}
                onPress={() => handleCountrySelect(country)}
                disabled={!country.enabled}
              />
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  headerLeft: {
    width: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  settingsIcon: {
    fontSize: 24,
  },
  welcomeSection: {
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  welcomeText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  
  // Passport Card Styles
  passportCard: {
    margin: spacing.md,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  passportHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  passportIcon: {
    fontSize: 56,
    marginRight: spacing.md,
  },
  passportInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  passportLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  passportName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  passportDetails: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  updatePassportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  updatePassportText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  updatePassportArrow: {
    ...typography.h3,
    color: colors.primary,
    marginLeft: spacing.xs,
  },


  // Scan Section (when no passport)
  scanSection: {
    padding: spacing.md,
    alignItems: 'center',
  },
  scanButton: {
    width: '100%',
    height: 72,
    marginBottom: spacing.sm,
  },
  scanIcon: {
    fontSize: 28,
  },
  scanHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  viewAllText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '500',
  },

  // Countries Grid
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },

  // History Cards
  historyCard: {
    marginTop: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyFlag: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  historyTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  historyArrow: {
    ...typography.h2,
    color: colors.textDisabled,
  },
});

export default HomeScreen;
