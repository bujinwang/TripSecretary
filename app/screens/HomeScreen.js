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
import EntryPackService from '../services/entryPack/EntryPackService';
import CountdownFormatter from '../utils/CountdownFormatter';
import DateFormatter from '../utils/DateFormatter';

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
  const [activeEntryPacks, setActiveEntryPacks] = useState([]);
  const [multiDestinationData, setMultiDestinationData] = useState(null);
  const [inProgressDestinations, setInProgressDestinations] = useState([]);

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

  // Get passport name for greeting (use surname with honorific)
  const getSurnameWithHonorific = () => {
    if (!passportData?.getSurname) return '';
    const surname = passportData.getSurname();
    if (!surname) return '';
    
    // Add honorific based on language
    if (language === 'zh') {
      return `${surname}先生`;
    } else if (language === 'en') {
      return `Mr. ${surname}`;
    } else if (language === 'es') {
      return `Sr. ${surname}`;
    }
    return surname;
  };
  
  const passportName = getSurnameWithHonorific();
  const hasPassport = !!passportData;

  const headerTitle = t('home.header.title');
  const greetingText = t('home.greeting', { name: passportName });
  const welcomeMessage = t('home.welcomeText');
  const pendingSectionTitle = t('home.sections.pending');
  const exploreSectionTitle = t('home.sections.whereToGo');

  // 加载护照、历史记录和多目的地数据
  useEffect(() => {
    loadPassportData();
    loadHistory();
    loadMultiDestinationData();
  }, []);

  const loadPassportData = async () => {
    try {
      // Load primary passport for the current user
      const userId = 'user_001'; // TODO: Get from auth context
      
      // Ensure secure storage is initialized before accessing data
      await PassportDataService.initialize(userId);

      const passport = await PassportDataService.getPrimaryPassport(userId);
      
      console.log('=== HomeScreen Passport Debug ===');
      console.log('Loaded passport:', passport);
      console.log('Passport fullName:', passport?.fullName);
      console.log('Passport getGivenName():', passport?.getGivenName ? passport.getGivenName() : 'N/A');
      
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

  const loadMultiDestinationData = async () => {
    try {
      const userId = 'user_001'; // TODO: Get from auth context
      await PassportDataService.initialize(userId);
      
      // Load home screen data with multi-destination support
      const homeScreenData = await EntryPackService.getHomeScreenData(userId);
      
      console.log('Multi-destination data loaded:', {
        submittedPacks: homeScreenData.submittedEntryPacks.length,
        inProgressDestinations: homeScreenData.inProgressDestinations.length,
        overallCompletion: homeScreenData.summary.overallCompletionPercent
      });
      
      // Filter out archived entry packs from active display
      const activeSubmittedPacks = homeScreenData.submittedEntryPacks.filter(pack => 
        pack.status !== 'archived' && pack.status !== 'expired'
      );
      
      // Set active entry packs (submitted ones, excluding archived)
      setActiveEntryPacks(activeSubmittedPacks);
      
      // Set in-progress destinations
      setInProgressDestinations(homeScreenData.inProgressDestinations);
      
      // Set overall multi-destination data
      setMultiDestinationData({
        ...homeScreenData,
        submittedEntryPacks: activeSubmittedPacks
      });
      
    } catch (error) {
      console.log('Failed to load multi-destination data:', error.message);
      setActiveEntryPacks([]);
      setInProgressDestinations([]);
      setMultiDestinationData(null);
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

    const countryName = t(`home.destinationNames.${country.id}`, {
      defaultValue: country.name || country.id,
    });
    const destinationForNav = {
      ...country,
      name: countryName,
    };

    // Convert passport data to legacy format for navigation
    const passportForNav = hasPassport
      ? {
          type: t('home.passport.type'),
          name: passportData.fullName || '',
          nameEn: passportData.fullName || '',
          passportNo: passportData.passportNumber || '',
          expiry: passportData.expiryDate || '',
        }
      : null;

    // Map country ID to screen name
    const screenMap = {
      'jp': 'JapanInfo',
      'th': 'ThailandInfo',
      'hk': 'HongKongInfo',
      'tw': 'TaiwanInfo',
      'kr': 'KoreaInfo',
      'sg': 'SingaporeInfo',
      'my': 'MalaysiaInfo',
      'us': 'USAInfo',
    };

    const screenName = screenMap[country.id];
    if (screenName) {
      navigation.navigate(screenName, {
        passport: passportForNav,
        destination: destinationForNav,
      });
    } else {
      // Default navigation for other countries
      navigation.navigate('TravelInfo', {
        destination: destinationForNav,
        passport: passportForNav,
      });
    }
  };

  const handleViewAllCountries = () => {
    // 查看所有国家
    const passportForNav = hasPassport
      ? {
          type: t('home.passport.type'),
          name: passportData.fullName || '',
          nameEn: passportData.fullName || '',
          passportNo: passportData.passportNumber || '',
          expiry: passportData.expiryDate || '',
        }
      : null;
    
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

  const getDestinationFlag = (destinationId) => {
    const flagMap = {
      'th': '🇹🇭',
      'jp': '🇯🇵',
      'sg': '🇸🇬',
      'my': '🇲🇾',
      'hk': '🇭🇰',
      'tw': '🇹🇼',
      'kr': '🇰🇷',
      'us': '🇺🇸'
    };
    return flagMap[destinationId] || '🌍';
  };

  const getDestinationName = (destinationId) => {
    return t(`home.destinationNames.${destinationId}`, {
      defaultValue: destinationId
    });
  };

  const getArrivalCountdown = (arrivalDate) => {
    if (!arrivalDate) return '';
    
    try {
      const arrival = new Date(arrivalDate);
      const now = new Date();
      const diffMs = arrival.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        return t('progressiveEntryFlow.entryPack.arrivedToday', { defaultValue: '今日抵达' });
      }
      
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return t('progressiveEntryFlow.entryPack.arrivesTomorrow', { defaultValue: '明日抵达' });
      } else if (diffDays <= 7) {
        return t('progressiveEntryFlow.entryPack.arrivesInDays', { 
          days: diffDays,
          defaultValue: `${diffDays}天后抵达`
        });
      } else {
        return DateFormatter.formatDate(arrival, language);
      }
    } catch (error) {
      console.log('Error formatting arrival countdown:', error);
      return '';
    }
  };

  const renderEntryPackCards = () => {
    if (!activeEntryPacks.length) {
      return null;
    }

    return activeEntryPacks.map((pack) => {
      const flag = getDestinationFlag(pack.destinationId);
      const destinationName = pack.destinationName || getDestinationName(pack.destinationId);
      
      // Get arrival date from entry info (we'll need to load this)
      const arrivalCountdown = getArrivalCountdown(pack.arrivalDate);
      
      return (
        <Card
          key={pack.id}
          style={[styles.historyCard, styles.entryPackCard]}
          pressable
          onPress={() => navigation.navigate('EntryPackDetail', { entryPackId: pack.id })}
        >
          <View style={styles.entryPackItem}>
            <View style={styles.entryPackLeft}>
              <Text style={styles.entryPackFlag}>{flag}</Text>
              <View style={styles.entryPackQR}>
                <Text style={styles.qrPlaceholder}>QR</Text>
              </View>
            </View>
            <View style={styles.entryPackInfo}>
              <Text style={styles.entryPackTitle}>
                {t('progressiveEntryFlow.entryPack.title', { 
                  destination: destinationName,
                  defaultValue: `${destinationName} Entry Pack - Submitted`
                })}
              </Text>
              <Text style={styles.entryPackStatus}>
                {t('progressiveEntryFlow.entryPack.submitted', { defaultValue: '已提交' })}
              </Text>
              <Text style={styles.entryPackCountdown}>
                {arrivalCountdown}
              </Text>
            </View>
            <Text style={styles.historyArrow}>›</Text>
          </View>
        </Card>
      );
    });
  };

  const renderInProgressDestinationCards = () => {
    if (!inProgressDestinations.length) {
      return null;
    }

    return inProgressDestinations.map((destination) => {
      const flag = getDestinationFlag(destination.destinationId);
      const destinationName = destination.destinationName || getDestinationName(destination.destinationId);
      
      return (
        <Card
          key={destination.destinationId}
          style={[styles.historyCard, styles.inProgressCard]}
          pressable
          onPress={() => {
            // Navigate to the appropriate travel info screen for this destination
            const screenMap = {
              'jp': 'JapanTravelInfo',
              'th': 'ThailandTravelInfo',
              'hk': 'HongKongTravelInfo',
              'tw': 'TaiwanTravelInfo',
              'kr': 'KoreaTravelInfo',
              'sg': 'SingaporeTravelInfo',
              'my': 'MalaysiaTravelInfo',
              'us': 'USATravelInfo',
            };
            
            const screenName = screenMap[destination.destinationId];
            if (screenName) {
              navigation.navigate(screenName, {
                destination: {
                  id: destination.destinationId,
                  name: destinationName,
                  flag: flag
                },
                passport: passportData ? {
                  type: t('home.passport.type'),
                  name: passportData.fullName || '',
                  nameEn: passportData.fullName || '',
                  passportNo: passportData.passportNumber || '',
                  expiry: passportData.expiryDate || '',
                } : null
              });
            }
          }}
        >
          <View style={styles.entryPackItem}>
            <View style={styles.inProgressLeft}>
              <Text style={styles.entryPackFlag}>{flag}</Text>
              <View style={styles.progressIndicator}>
                <Text style={styles.progressPercent}>{destination.completionPercent}%</Text>
              </View>
            </View>
            <View style={styles.entryPackInfo}>
              <Text style={styles.entryPackTitle}>
                {t('progressiveEntryFlow.inProgress.title', { 
                  destination: destinationName,
                  defaultValue: `${destinationName} - In Progress`
                })}
              </Text>
              <Text style={styles.inProgressStatus}>
                {destination.isReady 
                  ? t('progressiveEntryFlow.inProgress.ready', { defaultValue: '准备提交' })
                  : t('progressiveEntryFlow.inProgress.incomplete', { defaultValue: '填写中' })
                }
              </Text>
              <Text style={styles.entryPackCountdown}>
                {t('progressiveEntryFlow.inProgress.completionPercent', { 
                  percent: destination.completionPercent,
                  defaultValue: `${destination.completionPercent}% 完成`
                })}
              </Text>
            </View>
            <Text style={styles.historyArrow}>›</Text>
          </View>
        </Card>
      );
    });
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

        {/* Pending Entries - Entry Packs and In-Progress Destinations */}
        {(activeEntryPacks.length > 0 || inProgressDestinations.length > 0 || upcomingTrips.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{pendingSectionTitle}</Text>
              <TouchableOpacity
                style={styles.viewHistoryButton}
                onPress={() => navigation.navigate('EntryPackHistory')}
              >
                <Text style={styles.viewHistoryText}>
                  {t('home.viewHistory', { defaultValue: '查看历史' })}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Multi-destination Progress Summary */}
            {multiDestinationData && multiDestinationData.summary.hasAnyProgress && (
              <Card style={[styles.historyCard, styles.summaryCard]}>
                <View style={styles.summaryContent}>
                  <View style={styles.summaryLeft}>
                    <Text style={styles.summaryIcon}>🌍</Text>
                  </View>
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryTitle}>
                      {t('progressiveEntryFlow.multiDestination.summary', { 
                        defaultValue: '多目的地进度'
                      })}
                    </Text>
                    <Text style={styles.summaryStats}>
                      {t('progressiveEntryFlow.multiDestination.stats', {
                        submitted: multiDestinationData.summary.submittedEntryPacks,
                        inProgress: multiDestinationData.summary.inProgressDestinations,
                        overall: multiDestinationData.summary.overallCompletionPercent,
                        defaultValue: `${multiDestinationData.summary.submittedEntryPacks} 已提交 • ${multiDestinationData.summary.inProgressDestinations} 进行中 • 总体 ${multiDestinationData.summary.overallCompletionPercent}% 完成`
                      })}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
            
            {/* Active Entry Packs (Submitted) */}
            {renderEntryPackCards()}
            
            {/* In-Progress Destinations */}
            {renderInProgressDestinationCards()}
            
            {/* Mock Upcoming Trips */}
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

        {/* History Section - Always show */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('home.sections.history', { defaultValue: '历史记录' })}
            </Text>
            <TouchableOpacity
              style={styles.viewHistoryButton}
              onPress={() => navigation.navigate('EntryPackHistory')}
            >
              <Text style={styles.viewHistoryText}>
                {t('home.viewAllHistory', { defaultValue: '查看全部' })}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.historyPreviewCard}
            onPress={() => navigation.navigate('EntryPackHistory')}
          >
            <View style={styles.historyPreviewContent}>
              <Text style={styles.historyPreviewIcon}>📋</Text>
              <View style={styles.historyPreviewInfo}>
                <Text style={styles.historyPreviewTitle}>
                  {t('home.historyPreview.title', { defaultValue: '查看您的旅行历史' })}
                </Text>
                <Text style={styles.historyPreviewSubtitle}>
                  {t('home.historyPreview.subtitle', { defaultValue: '已完成的入境包和旅程记录' })}
                </Text>
              </View>
              <Text style={styles.historyArrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  viewHistoryButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  viewHistoryText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  historyPreviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyPreviewIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  historyPreviewInfo: {
    flex: 1,
  },
  historyPreviewTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  historyPreviewSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
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

  // Entry Pack Card Styles
  entryPackCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  entryPackItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryPackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  entryPackFlag: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  entryPackQR: {
    width: 40,
    height: 40,
    backgroundColor: colors.backgroundLight,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrPlaceholder: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  entryPackInfo: {
    flex: 1,
  },
  entryPackTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  entryPackStatus: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginBottom: 2,
  },
  entryPackCountdown: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // In-Progress Destination Card Styles
  inProgressCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  inProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  progressIndicator: {
    width: 40,
    height: 40,
    backgroundColor: colors.warningLight,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  progressPercent: {
    ...typography.caption,
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  inProgressStatus: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    marginBottom: 2,
  },

  // Multi-destination Summary Card Styles
  summaryCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLeft: {
    marginRight: spacing.md,
  },
  summaryIcon: {
    fontSize: 32,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  summaryStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default HomeScreen;
