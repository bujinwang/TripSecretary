// 出国啰 - Select Destination Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Card from '../components/Card';
import CountryCard from '../components/CountryCard';
import { colors, typography, spacing } from '../theme';

const SelectDestinationScreen = ({ navigation, route }) => {
  const { passport, country } = route.params || {};
  const [selectedCountry, setSelectedCountry] = useState(country || null);

  const countries = [
    // 亚洲 - 热门
    { id: 'hk', flag: '🇭🇰', name: '香港', flightTime: '1小时飞行' },
    { id: 'tw', flag: '🇹🇼', name: '台湾', flightTime: '2小时飞行' },
    { id: 'th', flag: '🇹🇭', name: '泰国', flightTime: '3小时飞行' },
    { id: 'jp', flag: '🇯🇵', name: '日本', flightTime: '3小时飞行' },
    { id: 'kr', flag: '🇰🇷', name: '韩国', flightTime: '2小时飞行' },
    { id: 'sg', flag: '🇸🇬', name: '新加坡', flightTime: '5小时飞行' },
    { id: 'my', flag: '🇲🇾', name: '马来西亚', flightTime: '4小时飞行' },
    
    // 北美洲
    { id: 'us', flag: '🇺🇸', name: '美国', flightTime: '13小时飞行' },
    { id: 'ca', flag: '🇨🇦', name: '加拿大', flightTime: '14小时飞行' },
    
    // 大洋洲
    { id: 'au', flag: '🇦🇺', name: '澳大利亚', flightTime: '9小时飞行' },
    { id: 'nz', flag: '🇳🇿', name: '新西兰', flightTime: '11小时飞行' },
    
    // 欧洲
    { id: 'gb', flag: '🇬🇧', name: '英国', flightTime: '11小时飞行' },
    { id: 'fr', flag: '🇫🇷', name: '法国', flightTime: '12小时飞行' },
    { id: 'de', flag: '🇩🇪', name: '德国', flightTime: '11小时飞行' },
    { id: 'it', flag: '🇮🇹', name: '意大利', flightTime: '12小时飞行' },
    { id: 'es', flag: '🇪🇸', name: '西班牙', flightTime: '13小时飞行' },
  ];

  // 移除自动跳转逻辑 - 现在从首页直接跳转到TravelInfo
  // 这个屏幕只在从ScanPassport扫描完护照后使用

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    // Navigate to travel info screen
    setTimeout(() => {
      navigation.navigate('TravelInfo', { 
        passport, 
        destination: country 
      });
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>选择目的地</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Passport Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📘 已识别证件</Text>
          <Card style={styles.passportCard}>
            <Text style={styles.passportType}>
              {passport?.type || '中国护照'}
            </Text>
            <View style={styles.passportRow}>
              <Text style={styles.passportLabel}>姓名: </Text>
              <Text style={styles.passportValue}>
                {passport?.name || '张伟'}
              </Text>
            </View>
            <View style={styles.passportRow}>
              <Text style={styles.passportLabel}>护照号: </Text>
              <Text style={styles.passportValue}>
                {passport?.passportNo || 'E12345678'}
              </Text>
            </View>
            <View style={styles.passportRow}>
              <Text style={styles.passportLabel}>有效期: </Text>
              <Text style={styles.passportValue}>
                {passport?.expiry || '2030-12-31'}
              </Text>
              <Text style={styles.validCheck}> ✅</Text>
            </View>
          </Card>
        </View>

        {/* Destination Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 选择目的地</Text>
          <View style={styles.countriesGrid}>
            {countries.map((country) => (
              <CountryCard
                key={country.id}
                flag={country.flag}
                name={country.name}
                flightTime={country.flightTime}
                selected={selectedCountry?.id === country.id}
                onPress={() => handleCountrySelect(country)}
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
    ...typography.body2,
    color: colors.primary,
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
