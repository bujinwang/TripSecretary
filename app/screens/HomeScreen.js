// 出国啰 - Home Screen (优化版)
import React, { useState, useEffect } from 'react';
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

const HomeScreen = ({ navigation }) => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 热门目的地（增加到8个）
  const hotCountries = [
    { id: 'hk', flag: '🇭🇰', name: '香港', flightTime: '1小时飞行' },
    { id: 'tw', flag: '🇹🇼', name: '台湾', flightTime: '2小时飞行' },
    { id: 'th', flag: '🇹🇭', name: '泰国', flightTime: '3小时飞行' },
    { id: 'jp', flag: '🇯🇵', name: '日本', flightTime: '3小时飞行' },
    { id: 'kr', flag: '🇰🇷', name: '韩国', flightTime: '2小时飞行' },
    { id: 'sg', flag: '🇸🇬', name: '新加坡', flightTime: '5小时飞行' },
    { id: 'my', flag: '🇲🇾', name: '马来西亚', flightTime: '4小时飞行' },
    { id: 'us', flag: '🇺🇸', name: '美国', flightTime: '13小时飞行' },
  ];

  // Mock: 用户已有护照
  const hasPassport = true;
  const passportData = {
    type: '中国护照',
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
    if (!hasPassport) {
      // 没有护照，先扫描
      navigation.navigate('ScanPassport');
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
      
      let message = `已找到${country.name}的通关包：\n\n`;
      message += `航班：${recentRecord.travelInfo?.flightNumber || '未知'}\n`;
      message += `日期：${formatDate(recentRecord.travelInfo?.arrivalDate)}\n`;
      message += `酒店：${recentRecord.travelInfo?.hotelName || '未知'}\n\n`;
      
      if (validity.warning) {
        message += `⚠️ ${validity.warning}\n\n`;
      }
      
      message += '是否使用这个通关包？';

      Alert.alert(
        '发现历史记录',
        message,
        [
          {
            text: '查看',
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
            text: '重新生成',
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
          <Text style={styles.headerTitle}>出国啰</Text>
          <TouchableOpacity style={styles.headerRight}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>你好，张伟 👋</Text>
          <Text style={styles.welcomeText}>选择目的地，立即生成通关包</Text>
        </View>

        {/* Passport Card - 已有护照时显示 */}
        {hasPassport ? (
          <Card style={styles.passportCard}>
            <View style={styles.passportHeader}>
              <Text style={styles.passportIcon}>📘</Text>
              <View style={styles.passportInfo}>
                <Text style={styles.passportLabel}>我的护照</Text>
                <Text style={styles.passportName}>{passportData.name}</Text>
                <Text style={styles.passportDetails}>
                  {passportData.passportNo} · 有效期至 {passportData.expiry}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.updatePassportButton}
              onPress={handleScanPassport}
            >
              <Text style={styles.updatePassportText}>更新护照信息</Text>
              <Text style={styles.updatePassportArrow}>›</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          /* 没有护照时 - 显示扫描按钮 */
          <View style={styles.scanSection}>
            <Button
              title="扫描护照"
              onPress={handleScanPassport}
              variant="primary"
              icon={<Text style={styles.scanIcon}>📸</Text>}
              style={styles.scanButton}
            />
            <Text style={styles.scanHint}>扫描护照，3秒生成通关包</Text>
          </View>
        )}

        {/* Hot Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 热门目的地</Text>
            <TouchableOpacity onPress={handleViewAllCountries}>
              <Text style={styles.viewAllText}>查看全部 ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.countriesGrid}>
            {hotCountries.map((country) => (
              <CountryCard
                key={country.id}
                flag={country.flag}
                name={country.name}
                subtitle={country.flightTime}
                onPress={() => handleCountrySelect(country)}
              />
            ))}
          </View>
        </View>

        {/* Recent Generations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 最近生成</Text>
          <Card 
            style={styles.historyCard} 
            pressable
            onPress={() => navigation.navigate('Result', {
              passport: passportData,
              destination: { id: 'hk', name: '香港', flag: '🇭🇰' },
              travelInfo: {
                flightNumber: 'CX888',
                arrivalDate: new Date().toISOString().split('T')[0],
                hotelName: '香港文华东方酒店',
                hotelAddress: '中环干诺道中5号',
                contactPhone: '+852 2522 0111',
                stayDuration: '3',
                travelPurpose: '旅游',
              },
              fromHistory: true,
            })}
          >
            <View style={styles.historyItem}>
              <Text style={styles.historyFlag}>🇭🇰</Text>
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>香港入境表格</Text>
                <Text style={styles.historyTime}>2小时前</Text>
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
                arrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
                <Text style={styles.historyTitle}>泰国入境表格</Text>
                <Text style={styles.historyTime}>昨天 15:20</Text>
              </View>
              <Text style={styles.historyArrow}>›</Text>
            </View>
          </Card>
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
