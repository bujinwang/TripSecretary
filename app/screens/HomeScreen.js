// 入境通 - Home Screen
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Card from '../components/Card';
import CountryCard from '../components/CountryCard';
import { colors, typography, spacing, borderRadius } from '../theme';
import { findRecentValidGeneration, formatDate } from '../utils/historyChecker';
import api from '../services/api';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import EntryInfoService from '../services/EntryInfoService';
import CountdownFormatter from '../utils/CountdownFormatter';
import DateFormatter from '../utils/DateFormatter';
import PerformanceMonitor from '../utils/PerformanceMonitor';
import { getDestination } from '../config/destinations';

// TODO: Migrate all destinations to config system (see app/config/destinations/)
// Currently only Thailand ('th') is fully configured
// For other countries, add configs to app/config/destinations/{country}/ directory
const HOT_COUNTRIES = [
  { id: 'jp', flag: '🇯🇵', name: 'Japan', flightTimeKey: 'home.destinations.japan.flightTime', enabled: true },
  // Thailand loaded from destination config system
  (() => {
    try {
      const thailand = getDestination('th');
      return {
        id: thailand.id,
        flag: thailand.flag,
        name: thailand.name,
        flightTimeKey: thailand.flightTimeKey,
        enabled: thailand.enabled
      };
    } catch (error) {
      // Fallback if config not available
      console.warn('Failed to load Thailand from config, using hardcoded values:', error.message);
      return { id: 'th', flag: '🇹🇭', name: 'Thailand', flightTimeKey: 'home.destinations.thailand.flightTime', enabled: true };
    }
  })(),
  { id: 'vn', flag: '🇻🇳', name: 'Vietnam', flightTimeKey: 'home.destinations.vietnam.flightTime', enabled: true },
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
  // Thailand trip removed as requested - keeping only Japan upcoming trip
  // {
  //   id: 'th',
  //   flag: '🇹🇭',
  //   titleKey: 'home.pendingTrips.cards.th.title',
  //   city: '曼谷',
  //   cityEn: 'Bangkok',
  //   daysFromNow: 2,
  //   flightNumber: 'TG615',
  //   hotelName: 'Bangkok Grand Hotel',
  //   hotelAddress: '123 Sukhumvit Road, Bangkok',
  //   contactPhone: '+66 2 123 4567',
  //   stayDuration: '7',
  // },
];

const HomeScreen = ({ navigation }) => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passportData, setPassportData] = useState(null);
  const [activeEntryPacks, setActiveEntryPacks] = useState([]);
  const [multiDestinationData, setMultiDestinationData] = useState(null);
  const [inProgressDestinations, setInProgressDestinations] = useState([]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const { t, language, setLanguage } = useLocale();

  // Available languages for selection
  const availableLanguages = [
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
  ];

  const handleLanguageSelect = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setShowLanguageModal(false);
  };

  // Intelligent country prioritization based on visa requirements
  const getVisaRequirement = (countryId) => {
    // Accurate visa and permit requirements for Chinese passport holders (中国护照)
    const requirementMap = {
      th: 'visa_free',            // 泰国免签
      vn: 'evisa',                // 越南电子签证
      my: 'visa_free',            // 马来西亚免签
      sg: 'visa_free',            // 新加坡免签
      hk: 'hk_permit',            // 香港需要港澳通行证
      tw: 'tw_entry_permit',      // 台湾需要入台证
      jp: 'visa_required',        // 日本需要签证
      kr: 'visa_required',        // 韩国需要签证
      us: 'visa_required',        // 美国需要签证
    };

    return requirementMap[countryId] || 'unknown';
  };

  const getVisaPriority = (requirement) => {
    const priorityMap = {
      visa_free: 1,           // 最容易安排的免签目的地
      visa_on_arrival: 2,     // 落地签
      evisa: 3,               // 电子签证
      eta: 3,                 // ETA电子旅行许可
      hk_permit: 3,           // 港澳通行证
      tw_entry_permit: 3,     // 入台证
      visa_required: 4,       // 传统签证
      unknown: 5,
    };

    return priorityMap[requirement] ?? 5;
  };

  const localizedHotCountries = useMemo(() => {
    // Get IDs of destinations that already have active entry packs or in-progress entries
    const activeDestinationIds = new Set([
      ...activeEntryPacks.map(pack => pack.destinationId),
      ...inProgressDestinations.map(dest => dest.destinationId)
    ]);

    const countriesWithVisaInfo = HOT_COUNTRIES.map((country) => {
      const visaRequirement = getVisaRequirement(country.id);
      return {
        ...country,
        displayName: t(`home.destinationNames.${country.id}`, {
          defaultValue: country.name || country.id,
        }),
        flightTime: t(country.flightTimeKey, {
          defaultValue: '—',
        }),
        visaRequirement,
        visaPriority: getVisaPriority(visaRequirement),
      };
    });

    // Filter out destinations that already have active entry packs
    const availableCountries = countriesWithVisaInfo.filter(
      country => !activeDestinationIds.has(country.id)
    );

    // Sort by visa priority (easiest entry first), then by flight time
    return availableCountries.sort((a, b) => {
      if (a.visaPriority !== b.visaPriority) {
        return a.visaPriority - b.visaPriority;
      }
      // If same visa priority, sort by flight time (shorter first)
      const aTime = parseFloat(a.flightTime) || 999;
      const bTime = parseFloat(b.flightTime) || 999;
      return aTime - bTime;
    });
  }, [language, t, activeEntryPacks, inProgressDestinations]);

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

    // Animate empty state when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadPassportData = async () => {
    try {
      // Load primary passport for the current user
      const userId = 'user_001'; // TODO: Get from auth context

      // Ensure secure storage is initialized before accessing data
      await UserDataService.initialize(userId);

      // Try multiple methods to get passport data
      let passport = await UserDataService.getPrimaryPassport(userId);

      if (!passport) {
        const allPassports = await UserDataService.getAllPassports(userId);
        passport = allPassports?.[0] || null;
      }

      // Also check if passport data exists in other formats
      if (passport) {
        setPassportData(passport);
      } else {
        // No passport data found - user needs to input it
        setPassportData(null);
      }
    } catch (error) {
      console.log('Failed to load passport data:', error.message);
      // No mock data - data must come from user input or SQLite
      setPassportData(null);
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

  const loadMultiDestinationData = useCallback(async () => {
    const operationId = PerformanceMonitor.startTiming('loadMultiDestinationData');

    try {
      const userId = 'user_001'; // TODO: Get from auth context
      await UserDataService.initialize(userId);
      
      // Load home screen data with multi-destination support
      const homeScreenData = await EntryInfoService.getHomeScreenData(userId);
      
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

      PerformanceMonitor.endTiming(operationId, {
        submittedPacks: activeSubmittedPacks.length,
        inProgressDestinations: homeScreenData.inProgressDestinations.length,
        overallCompletion: homeScreenData.summary.overallCompletionPercent
      });
      
    } catch (error) {
      console.log('Failed to load multi-destination data:', error.message);
      PerformanceMonitor.endTiming(operationId, { error: error.message });
      setActiveEntryPacks([]);
      setInProgressDestinations([]);
      setMultiDestinationData(null);
    }
  }, []);

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
      'vn': 'VietnamInfo',
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


  const getDestinationName = (destinationId) => {
    return t(`home.destinationNames.${destinationId}`, {
      defaultValue: destinationId
    });
  };

  const getDestinationFlag = (destinationId) => {
    const flagMap = {
      'th': '🇹🇭',
      'vn': '🇻🇳',
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

  // Get estimated flight duration based on destination
  const getFlightDuration = (destinationId) => {
    const durationMap = {
      'th': '3小时',
      'jp': '3小时',
      'sg': '5小时',
      'my': '4小时',
      'hk': '1小时',
      'tw': '2小时',
      'kr': '2小时',
      'us': '13小时'
    };
    return durationMap[destinationId] || '';
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

  // Get submission countdown - recommends submitting 3-7 days before arrival
  const getSubmissionCountdown = (arrivalDate) => {
    if (!arrivalDate) return null;

    try {
      const arrival = new Date(arrivalDate);
      const now = new Date();
      const diffMs = arrival.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // If already passed or today
      if (diffDays <= 0) {
        return {
          text: t('progressiveEntryFlow.inProgress.submitNow', { defaultValue: '请尽快提交' }),
          urgent: true
        };
      }

      // Recommend submitting 3-7 days before arrival
      const recommendedSubmitDays = 3; // Submit at least 3 days before

      if (diffDays <= recommendedSubmitDays) {
        return {
          text: t('progressiveEntryFlow.inProgress.submitSoon', {
            days: diffDays,
            defaultValue: `建议 ${diffDays} 天内提交`
          }),
          urgent: true
        };
      } else if (diffDays <= 7) {
        return {
          text: t('progressiveEntryFlow.inProgress.canSubmitNow', {
            defaultValue: '可以提交了'
          }),
          urgent: false
        };
      } else {
        return {
          text: t('progressiveEntryFlow.inProgress.submitLater', {
            days: diffDays - recommendedSubmitDays,
            defaultValue: `还有 ${diffDays - recommendedSubmitDays} 天可提交`
          }),
          urgent: false
        };
      }
    } catch (error) {
      console.log('Error calculating submission countdown:', error);
      return null;
    }
  };

  const renderEntryPackCards = useCallback(() => {
    if (!activeEntryPacks.length) {
      return null;
    }

    return activeEntryPacks.map((pack) => {
      const flag = getDestinationFlag(pack.destinationId);
      const destinationName = pack.destinationName || getDestinationName(pack.destinationId);

      // Get arrival date from entry info
      const arrivalCountdown = getArrivalCountdown(pack.arrivalDate);

      // Get flight duration
      const flightDuration = getFlightDuration(pack.destinationId);

      // Format visa info
      const visaInfo = pack.visaNumber
        ? t('progressiveEntryFlow.entryPack.visaRequired', { defaultValue: '需要签证' })
        : t('progressiveEntryFlow.entryPack.visaFree', { defaultValue: '免签' });

      return (
        <Card
          key={pack.id}
          style={[styles.historyCard, styles.entryPackCard]}
          pressable
          onPress={() => {
            // Navigate to the appropriate entry flow screen for this destination
            const entryFlowScreenMap = {
              'jp': 'JapanEntryFlow',
              'th': 'ThailandEntryFlow',
              'hk': 'HongKongEntryFlow',
              'kr': 'KoreaEntryFlow',
              'sg': 'SingaporeEntryFlow',
              'my': 'MalaysiaEntryFlow',
            };

            const screenName = entryFlowScreenMap[pack.destinationId];
            if (screenName) {
              navigation.navigate(screenName, {
                destination: {
                  id: pack.destinationId,
                  name: destinationName,
                  flag: flag
                },
                passport: passportData ? {
                  id: 'user_001', // TODO: Get from auth context
                  type: t('home.passport.type'),
                  name: passportData.fullName || '',
                  nameEn: passportData.fullName || '',
                  passportNo: passportData.passportNumber || '',
                  expiry: passportData.expiryDate || '',
                } : null,
                entryPackId: pack.id, // Pass the entry info ID for loading existing data
              });
            } else {
              // Fallback for destinations without Entry Flow screen
              navigation.navigate('EntryInfoDetail', { entryInfoId: pack.id });
            }
          }}
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
                  defaultValue: `${destinationName}`
                })}
              </Text>
              <Text style={styles.entryPackStatus}>
                {t('progressiveEntryFlow.entryPack.submitted', { defaultValue: '已提交' })}
              </Text>
              {/* Prominent arrival countdown */}
              {pack.arrivalDate ? (
                <Text style={styles.entryPackArrivalCountdown}>
                  📅 {arrivalCountdown}
                </Text>
              ) : (
                <Text style={styles.entryPackArrivalCountdownMissing}>
                  📅 {t('progressiveEntryFlow.entryPack.noArrivalDate', { defaultValue: '待填写入境日期' })}
                </Text>
              )}
              <View style={styles.entryPackDetailsRow}>
                {pack.flightNumber && (
                  <Text style={styles.entryPackDetail}>
                    🎫 {pack.flightNumber}
                  </Text>
                )}
                {flightDuration && (
                  <Text style={styles.entryPackDetail}>
                    ✈️ {flightDuration}
                  </Text>
                )}
                <Text style={styles.entryPackDetail}>
                  {pack.visaNumber ? '📋 需要签证' : '✅ 免签'}
                </Text>
              </View>
            </View>
            <Text style={styles.historyArrow}>›</Text>
          </View>
        </Card>
      );
    });
  }, [activeEntryPacks, t, navigation, passportData]);

  const renderInProgressDestinationCards = useCallback(() => {
    if (!inProgressDestinations.length) {
      return null;
    }

    return inProgressDestinations.map((destination) => {
      const flag = getDestinationFlag(destination.destinationId);
      const destinationName = destination.destinationName || getDestinationName(destination.destinationId);

      // Get submission countdown if arrival date is set
      const submissionCountdown = getSubmissionCountdown(destination.arrivalDate);

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
              'vn': 'VietnamTravelInfo',
              'hk': 'HongkongTravelInfo',
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
                  defaultValue: `${destinationName}`
                })}
              </Text>
              <Text style={styles.inProgressStatus}>
                {destination.isReady
                  ? t('progressiveEntryFlow.inProgress.ready', { defaultValue: '准备提交' })
                  : t('progressiveEntryFlow.inProgress.incomplete', { defaultValue: '填写中' })
                }
              </Text>
              <View style={styles.entryPackDetailsRow}>
                <Text style={styles.entryPackDetail}>
                  {t('progressiveEntryFlow.inProgress.completionPercent', {
                    percent: destination.completionPercent,
                    defaultValue: `${destination.completionPercent}% 完成`
                  })}
                </Text>
                {destination.flightNumber && (
                  <Text style={styles.entryPackDetail}>
                    🎫 {destination.flightNumber}
                  </Text>
                )}
              </View>
              {submissionCountdown && (
                <Text style={[
                  styles.submissionCountdown,
                  submissionCountdown.urgent && styles.submissionCountdownUrgent
                ]}>
                  ⏰ {submissionCountdown.text}
                </Text>
              )}
            </View>
            <Text style={styles.historyArrow}>›</Text>
          </View>
        </Card>
      );
    });
  }, [inProgressDestinations, t, navigation, passportData]);

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
          <View style={styles.headerRight}>
            {__DEV__ && (
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => navigation.navigate('TDACDebug')}
              >
                <Text style={styles.debugIcon}>🔧</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setShowLanguageModal(true)}
            >
              <Text style={styles.settingsIcon}>🌐</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{greetingText}</Text>
          <Text style={styles.welcomeText}>{welcomeMessage}</Text>
        </View>

        {/* Active Entry Packs Section - Priority #1 */}
        {activeEntryPacks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('home.sections.activeTrips', { defaultValue: '我的行程' })}
              </Text>
              <Text style={styles.sectionBadge}>
                {activeEntryPacks.length}
              </Text>
            </View>
            {renderEntryPackCards()}
          </View>
        )}

        {/* In-Progress Destinations Section - Priority #2 */}
        {inProgressDestinations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('home.sections.inProgress', { defaultValue: '填写中' })}
              </Text>
              <Text style={styles.sectionBadge}>
                {inProgressDestinations.length}
              </Text>
            </View>
            {renderInProgressDestinationCards()}
          </View>
        )}

        {/* Empty State - No Active Trips */}
        {activeEntryPacks.length === 0 && inProgressDestinations.length === 0 && hasPassport && (
          <View style={styles.section}>
            <Animated.View
              style={[
                styles.emptyStateCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.emptyStateContentCompact}>
                <Text style={styles.emptyStateIconCompact}>🗺️</Text>
                <Text style={styles.emptyStateTitleCompact}>
                  {t('home.emptyState.title', { defaultValue: '还没有行程计划' })}
                </Text>
              </View>
            </Animated.View>
          </View>
        )}

        {/* Empty State - No Passport */}
        {!hasPassport && (
          <View style={styles.section}>
            <Card style={styles.emptyStateCard}>
              <View style={styles.emptyStateContent}>
                <Text style={styles.emptyStateIcon}>📱</Text>
                <Text style={styles.emptyStateTitle}>
                  {t('home.emptyState.noPassport.title', { defaultValue: '开始您的第一次旅行' })}
                </Text>
                <Text style={styles.emptyStateText}>
                  {t('home.emptyState.noPassport.subtitle', { defaultValue: '扫描护照快速填写信息' })}
                </Text>
                <Button
                  title={t('home.emptyState.noPassport.action', { defaultValue: '扫描护照' })}
                  onPress={handleScanPassport}
                  style={styles.emptyStateButton}
                  icon="📷"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Where to Go - Priority #3 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{exploreSectionTitle}</Text>
          </View>
          <View style={styles.countriesGrid}>
            {localizedHotCountries.map((country) => (
              <CountryCard
                key={country.id}
                flag={country.flag}
                name={country.displayName}
                flightTime={country.flightTime}
                visaRequirement={country.visaRequirement}
                onPress={() => handleCountrySelect(country)}
                disabled={!country.enabled}
              />
            ))}
          </View>
        </View>

        {/* History Section - At Bottom */}
        {historyList.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('home.sections.history', { defaultValue: '历史记录' })}
              </Text>
            </View>
            {renderHistoryCards()}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Language Selection Modal - iOS Style */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowLanguageModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select Language</Text>
              <View style={styles.languageList}>
                {availableLanguages.map((lang, index) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageOption,
                      index === 0 && styles.languageOptionFirst,
                      index === availableLanguages.length - 1 && styles.languageOptionLast,
                      language === lang.code && styles.languageOptionSelected
                    ]}
                    onPress={() => handleLanguageSelect(lang.code)}
                  >
                    <Text style={[
                      styles.languageOptionText,
                      language === lang.code && styles.languageOptionTextSelected
                    ]}>
                      {lang.label}
                    </Text>
                    {language === lang.code && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugButton: {
    padding: 4,
  },
  debugIcon: {
    fontSize: 20,
  },
  languageButton: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 24,
  },
  welcomeSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  welcomeText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 22,
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
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  sectionBadge: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.white,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    textAlign: 'center',
    overflow: 'hidden',
  },

  // Empty State Styles
  emptyStateCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateContentCompact: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateIconSmall: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyStateIconCompact: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  emptyStateTitle: {
    ...typography.h3,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyStateTitleCompact: {
    ...typography.body1,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
  },
  emptyStateText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyStateButton: {
    marginTop: spacing.sm,
    minWidth: 200,
  },

  // Countries Grid
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginHorizontal: -spacing.xs,
  },

  // History Cards
  historyCard: {
    marginBottom: spacing.md,
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
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
  entryPackArrivalCountdown: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  entryPackArrivalCountdownMissing: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  entryPackDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  entryPackDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },

  // In-Progress Destination Card Styles
  inProgressCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
  submissionCountdown: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  submissionCountdownUrgent: {
    color: colors.error,
    fontWeight: '600',
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

  // Language Selection Modal Styles - iOS Style
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  languageList: {
    paddingHorizontal: spacing.md,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  languageOptionFirst: {
    borderTopWidth: 0,
  },
  languageOptionLast: {
    borderBottomWidth: 0,
  },
  languageOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  languageOptionText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  languageOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
});

export default HomeScreen;
