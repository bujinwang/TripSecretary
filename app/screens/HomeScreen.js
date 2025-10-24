// 入境通 - Home Screen
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import CountryCard from '../components/CountryCard';
import TravelReadinessDashboard from '../components/TravelReadinessDashboard';
import ProactiveAlerts from '../components/ProactiveAlerts';
import { colors, typography, spacing, borderRadius } from '../theme';
import { findRecentValidGeneration, formatDate } from '../utils/historyChecker';
import api from '../services/api';
import { useLocale } from '../i18n/LocaleContext';
import UserDataService from '../services/data/UserDataService';
import EntryInfoService from '../services/EntryInfoService';
import CountdownFormatter from '../utils/CountdownFormatter';
import DateFormatter from '../utils/DateFormatter';
import PerformanceMonitor from '../utils/PerformanceMonitor';

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

    // Sort by visa priority (easiest entry first), then by flight time
    return countriesWithVisaInfo.sort((a, b) => {
      if (a.visaPriority !== b.visaPriority) {
        return a.visaPriority - b.visaPriority;
      }
      // If same visa priority, sort by flight time (shorter first)
      const aTime = parseFloat(a.flightTime) || 999;
      const bTime = parseFloat(b.flightTime) || 999;
      return aTime - bTime;
    });
  }, [language, t]);

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

  const renderEntryPackCards = useCallback(() => {
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
          onPress={() => navigation.navigate('EntryInfoDetail', { entryInfoId: pack.id })}
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
  }, [activeEntryPacks, t, navigation]);

  const renderInProgressDestinationCards = useCallback(() => {
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


        {/* Proactive Alerts - NEW */}
        <ProactiveAlerts
          passportData={passportData}
          activeEntryPacks={activeEntryPacks}
          inProgressDestinations={inProgressDestinations}
          upcomingTrips={upcomingTrips}
          onAlertPress={(action, data) => {
            switch (action) {
              case 'scan_passport':
                handleScanPassport();
                break;
              case 'passport_renewal':
                // Navigate to passport renewal information
                console.log('Navigate to passport renewal info');
                break;
              case 'prepare_trip':
                if (data) {
                  handleCountrySelect({
                    id: data.id,
                    name: data.destination?.name || data.destination,
                    flag: data.flag
                  });
                }
                break;
              case 'complete_forms':
                // Navigate to complete forms
                if (inProgressDestinations.length > 0) {
                  const dest = inProgressDestinations[0];
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
                  const screenName = screenMap[dest.destinationId];
                  if (screenName) {
                    navigation.navigate(screenName, {
                      destination: {
                        id: dest.destinationId,
                        name: dest.destinationName,
                        flag: getDestinationFlag(dest.destinationId)
                      },
                      passport: passportData
                    });
                  }
                }
                break;
              case 'view_entry_pack':
                if (data) {
                  navigation.navigate('EntryInfoDetail', { entryInfoId: data.id });
                }
                break;
              default:
                console.log('Unknown alert action:', action);
            }
          }}
        />

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>{greetingText}</Text>
          <Text style={styles.welcomeText}>{welcomeMessage}</Text>
        </View>

        {/* Travel Readiness Dashboard - NEW */}
        <TravelReadinessDashboard
          passportData={passportData}
          activeEntryPacks={activeEntryPacks}
          inProgressDestinations={inProgressDestinations}
          upcomingTrips={upcomingTrips}
          onPassportPress={handleScanPassport}
          onTripPress={(trip) => {
            // Handle trip press based on trip type
            if (trip.type === 'active' || trip.type === 'inProgress') {
              navigation.navigate('EntryInfoDetail', { entryInfoId: trip.id || 'default' });
            } else {
              // Handle upcoming trip navigation
              console.log('Navigate to trip planning for:', trip.destination);
            }
          }}
          onActionPress={(action) => {
            switch (action) {
              case 'scan_passport':
                handleScanPassport();
                break;
              case 'complete_forms':
                // Navigate to in-progress destination
                if (inProgressDestinations.length > 0) {
                  const dest = inProgressDestinations[0];
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
                  const screenName = screenMap[dest.destinationId];
                  if (screenName) {
                    navigation.navigate(screenName, {
                      destination: {
                        id: dest.destinationId,
                        name: dest.destinationName,
                        flag: getDestinationFlag(dest.destinationId)
                      },
                      passport: passportData
                    });
                  }
                }
                break;
              case 'status_details':
                // Show detailed status information
                console.log('Show detailed travel status');
                break;
              default:
                console.log('Unknown action:', action);
            }
          }}
        />



        {/* Pending Entries - Entry Packs and In-Progress Destinations */}
        {(activeEntryPacks.length > 0 || inProgressDestinations.length > 0 || upcomingTrips.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{pendingSectionTitle}</Text>
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


        {/* Where to Go */}
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

  // Countries Grid
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
