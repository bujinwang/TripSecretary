// 出境通 - Home Screen
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
import { findRecentValidGeneration, generateSummary, formatDate } from '../utils/historyChecker';
import api from '../services/api';
import { useLocale } from '../i18n/LocaleContext';

const HomeScreen = ({ navigation }) => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);

  const { t, language, setLanguage } = useLocale();
  const hotCountries = [
    { id: 'jp', flag: '🇯🇵', flightTimeKey: 'home.destinations.japan.flightTime', enabled: true },
    { id: 'th', flag: '🇹🇭', flightTimeKey: 'home.destinations.thailand.flightTime', enabled: true },
    { id: 'hk', flag: '🇭🇰', flightTimeKey: 'home.destinations.hongKong.flightTime', enabled: false },
    { id: 'tw', flag: '🇹🇼', flightTimeKey: 'home.destinations.taiwan.flightTime', enabled: false },
    { id: 'kr', flag: '🇰🇷', flightTimeKey: 'home.destinations.korea.flightTime', enabled: false },
    { id: 'my', flag: '🇲🇾', flightTimeKey: 'home.destinations.malaysia.flightTime', enabled: false },
    { id: 'us', flag: '🇺🇸', flightTimeKey: 'home.destinations.usa.flightTime', enabled: false },
  ];

  // Mock: 用户已有护照
  const hasPassport = true;
  const passportData = {
    type: t('home.passport.type'),
    name: '张伟',
    nameEn: 'ZHANG WEI',
    passportNo: 'E12345678',
    expiry: '2030-12-31',
  };

  // 加载历史记录
  useEffect(() => {
    loadHistory();
  }, []);

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

    // Special handling for Japan
    if (country.id === 'jp') {
      // Check if user has previous Japan entries
      const recentJapanEntry = findRecentValidGeneration('jp', passportData.passportNo, historyList);

      if (!recentJapanEntry) {
        // First time user - show info screen
        navigation.navigate('JapanInfo', {
          passport: passportData,
          destination: country
        });
      } else {
        // Returning user - show requirements screen
        navigation.navigate('JapanRequirements', {
          passport: passportData,
          destination: country
        });
      }
      return;
    }

    // 检查是否有该目的地的有效历史记录
    const recentRecord = findRecentValidGeneration(
      country.id,
      passportData.passportNo,
      historyList
    );

    if (recentRecord) {
      // 有有效的历史记录，询问用户
      const summary = generateSummary(recentRecord);
      const { validity } = recentRecord;

      const countryName = t(`home.destinationNames.${country.id}`, {
        defaultValue: country.name || country.id,
      });

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
                passport: passportData,
                destination: country,
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
                destination: country,
                passport: passportData,
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
        destination: country,
        passport: passportData,
      });
    }
  };

  const handleViewAllCountries = () => {
    // 查看所有国家
    navigation.navigate('SelectDestination', { 
      passport: hasPassport ? passportData : null 
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
              <Text style={styles.historyTitle}>暂无生成记录</Text>
              <Text style={styles.historyTime}>去选择目的地试试吧</Text>
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
            destination: item.destination,
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
              {item.destination?.name
                ? `${item.destination.name}入境表格`
                : '入境表格'}
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
          <Text style={styles.headerTitle}>出境通</Text>
          <TouchableOpacity style={styles.headerRight}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>你好，张伟 👋</Text>
          <Text style={styles.welcomeText}>选择目的地，立即生成通关包</Text>
        </View>

        {/* Pending Entries - Show only if there are upcoming trips */}
        {true && ( // In real app, check if user has pending trips
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛬 待入境</Text>
            <Card
              style={styles.historyCard}
              pressable
              onPress={() => navigation.navigate('Result', {
                passport: passportData,
                destination: { id: 'jp', name: '日本', flag: '🇯🇵' },
                travelInfo: {
                  flightNumber: 'CA981',
                  arrivalDate: new Date().toISOString().split('T')[0],
                  hotelName: '东京新大谷酒店',
                  hotelAddress: '千代田区纪尾井町4-1',
                  contactPhone: '+81 3 3261 9111',
                  stayDuration: '7',
                  travelPurpose: '旅游',
                },
                fromHistory: true,
              })}
            >
              <View style={styles.historyItem}>
                <Text style={styles.historyFlag}>🇯🇵</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>日本东京</Text>
                  <Text style={styles.historyTime}>{new Date().toISOString().split('T')[0]} 起飞</Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </View>
            </Card>
            <Card
              style={styles.historyCard}
              pressable
              onPress={() => navigation.navigate('Result', {
                passport: passportData,
                destination: { id: 'th', name: '泰国', flag: '🇹🇭' },
                travelInfo: {
                  flightNumber: 'CA981',
                  arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  hotelName: 'Bangkok Grand Hotel',
                  hotelAddress: '123 Sukhumvit Road, Bangkok',
                  contactPhone: '+66 2 123 4567',
                  stayDuration: '7',
                  travelPurpose: '旅游',
                },
                fromHistory: true,
              })}
            >
              <View style={styles.historyItem}>
                <Text style={styles.historyFlag}>🇹🇭</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>泰国曼谷</Text>
                  <Text style={styles.historyTime}>{new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 起飞</Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </View>
            </Card>
            <Card
              style={styles.historyCard}
              pressable
              onPress={() => navigation.navigate('Result', {
                passport: passportData,
                destination: { id: 'us', name: '美国', flag: '🇺🇸' },
                travelInfo: {
                  flightNumber: 'CA987',
                  arrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  hotelName: 'New York Hilton',
                  hotelAddress: '1335 Avenue of the Americas, New York',
                  contactPhone: '+1 212 586 7000',
                  stayDuration: '14',
                  travelPurpose: '旅游',
                },
                fromHistory: true,
              })}
            >
              <View style={styles.historyItem}>
                <Text style={styles.historyFlag}>🇺🇸</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>美国纽约</Text>
                  <Text style={styles.historyTime}>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 起飞</Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </View>
            </Card>
            <Card
              style={styles.historyCard}
              pressable
              onPress={() => navigation.navigate('Result', {
                passport: passportData,
                destination: { id: 'ca', name: '加拿大', flag: '🇨🇦' },
                travelInfo: {
                  flightNumber: 'CA025',
                  arrivalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  hotelName: 'Toronto Marriott Downtown',
                  hotelAddress: '525 Bay Street, Toronto',
                  contactPhone: '+1 416 597 9200',
                  stayDuration: '10',
                  travelPurpose: '旅游',
                },
                fromHistory: true,
              })}
            >
              <View style={styles.historyItem}>
                <Text style={styles.historyFlag}>🇨🇦</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>加拿大多伦多</Text>
                  <Text style={styles.historyTime}>{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 起飞</Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </View>
            </Card>
            <Card
              style={styles.historyCard}
              pressable
              onPress={() => navigation.navigate('Result', {
                passport: passportData,
                destination: { id: 'tw', name: '台湾', flag: '🇹🇼' },
                travelInfo: {
                  flightNumber: 'CI053',
                  arrivalDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  hotelName: 'Taipei Marriott',
                  hotelAddress: '199 Lequn 2nd Rd, Zhongshan District',
                  contactPhone: '+886 2 8509 5800',
                  stayDuration: '7',
                  travelPurpose: '旅游',
                },
                fromHistory: true,
              })}
            >
              <View style={styles.historyItem}>
                <Text style={styles.historyFlag}>🇹🇼</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>台湾台北</Text>
                  <Text style={styles.historyTime}>{new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 起飞</Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </View>
            </Card>
            <Card
              style={styles.historyCard}
              pressable
              onPress={() => navigation.navigate('Result', {
                passport: passportData,
                destination: { id: 'hk', name: '香港', flag: '🇭🇰' },
                travelInfo: {
                  flightNumber: 'CX711',
                  arrivalDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  hotelName: 'Hong Kong Marriott',
                  hotelAddress: 'Pacific Place, 88 Queensway',
                  contactPhone: '+852 2840 7777',
                  stayDuration: '5',
                  travelPurpose: '旅游',
                },
                fromHistory: true,
              })}
            >
              <View style={styles.historyItem}>
                <Text style={styles.historyFlag}>🇭🇰</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>香港</Text>
                  <Text style={styles.historyTime}>{new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 起飞</Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </View>
            </Card>
          </View>
        )}


        {/* Where to Go */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>想去哪儿？</Text>
          <View style={styles.countriesGrid}>
            {hotCountries.map((country) => (
              <CountryCard
                key={country.id}
                flag={country.flag}
                name={country.name}
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
