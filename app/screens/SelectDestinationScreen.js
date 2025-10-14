// 入境通 - Select Destination Screen
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
import BackButton from '../components/BackButton';
import { colors, typography, spacing } from '../theme';
import { findRecentValidGeneration } from '../utils/historyChecker';
import { Alert } from 'react-native';

const SelectDestinationScreen = ({ navigation, route }) => {
  const { passport, country } = route.params || {};
  const [selectedCountry, setSelectedCountry] = useState(country || null);

  const countries = [
    // 目前启用的目的地
    { id: 'jp', flag: '🇯🇵', name: '日本', flightTime: '3小时飞行', enabled: true },
    { id: 'th', flag: '🇹🇭', name: '泰国', flightTime: '3小时飞行', enabled: true },

    // 暂未启用的目的地
    { id: 'hk', flag: '🇭🇰', name: '香港', flightTime: '1小时飞行', enabled: true },
    { id: 'tw', flag: '🇹🇼', name: '台湾', flightTime: '2小时飞行', enabled: true },
    { id: 'kr', flag: '🇰🇷', name: '韩国', flightTime: '2小时飞行', enabled: true },
    { id: 'sg', flag: '🇸🇬', name: '新加坡', flightTime: '5小时飞行', enabled: true },
    { id: 'my', flag: '🇲🇾', name: '马来西亚', flightTime: '4小时飞行', enabled: true },
    { id: 'us', flag: '🇺🇸', name: '美国', flightTime: '13小时飞行', enabled: true },
    { id: 'ca', flag: '🇨🇦', name: '加拿大', flightTime: '14小时飞行', enabled: false },
    { id: 'au', flag: '🇦🇺', name: '澳大利亚', flightTime: '9小时飞行', enabled: false },
    { id: 'nz', flag: '🇳🇿', name: '新西兰', flightTime: '11小时飞行', enabled: false },
    { id: 'gb', flag: '🇬🇧', name: '英国', flightTime: '11小时飞行', enabled: false },
    { id: 'fr', flag: '🇫🇷', name: '法国', flightTime: '12小时飞行', enabled: false },
    { id: 'de', flag: '🇩🇪', name: '德国', flightTime: '11小时飞行', enabled: false },
    { id: 'it', flag: '🇮🇹', name: '意大利', flightTime: '12小时飞行', enabled: false },
    { id: 'es', flag: '🇪🇸', name: '西班牙', flightTime: '13小时飞行', enabled: false },
  ];

  // 移除自动跳转逻辑 - 现在从首页直接跳转到TravelInfo
  // 这个屏幕只在从ScanPassport扫描完护照后使用

  const handleCountrySelect = (country) => {
    // Check if country is enabled
    if (!country.enabled) {
      Alert.alert('暂未开放', '该目的地暂未开放，敬请期待！');
      return;
    }

    setSelectedCountry(country);

    // Special handling for Japan
    if (country.id === 'jp') {
      // Mock history data - in real app, this would come from AsyncStorage or API
      const historyList = [
        // Add mock history if needed for testing
      ];

      const recentJapanEntry = findRecentValidGeneration('jp', passport?.passportNo, historyList);

      setTimeout(() => {
        if (!recentJapanEntry) {
          // First time user - show info screen
          navigation.navigate('JapanInfo', {
            passport,
            destination: country
          });
        } else {
          // Returning user - show requirements screen
          navigation.navigate('JapanRequirements', {
            passport,
            destination: country
          });
        }
      }, 300);
      return;
    }

    if (country.id === 'th') {
      setTimeout(() => {
        navigation.navigate('ThailandInfo', {
          passport,
          destination: country
        });
      }, 300);
      return;
    }

    if (country.id === 'my') {
      setTimeout(() => {
        navigation.navigate('MalaysiaInfo', {
          passport,
          destination: country
        });
      }, 300);
      return;
    }

    if (country.id === 'sg') {
      setTimeout(() => {
        navigation.navigate('SingaporeInfo', {
          passport,
          destination: country
        });
      }, 300);
      return;
    }

    if (country.id === 'tw') {
      setTimeout(() => {
        navigation.navigate('TaiwanInfo', {
          passport,
          destination: country
        });
      }, 300);
      return;
    }

    if (country.id === 'hk') {
      setTimeout(() => {
        navigation.navigate('HongKongInfo', {
          passport,
          destination: country
        });
      }, 300);
      return;
    }

    if (country.id === 'kr') {
      setTimeout(() => {
        navigation.navigate('KoreaInfo', {
          passport,
          destination: country
        });
      }, 300);
      return;
    }

    if (country.id === 'us') {
      setTimeout(() => {
        navigation.navigate('USAInfo', {
          passport,
          destination: country
        });
      }, 300);
      return;
    }

    // Default navigation for other countries
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
          <BackButton
            onPress={() => navigation.goBack()}
            label="返回"
            style={styles.backButton}
          />
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
                {passport?.name || ''}
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


function CountryInfoCard({ country, userNationality }) {
  const contentResolver = new NationalityContentResolver(userNationality, country.id);
  const requirements = contentResolver.getRequirements();
  
  const subtitle = contentResolver.resolveContent(`countries.${country.id}.info.subtitle`);
  const visaInfo = contentResolver.resolveContent(`countries.${country.id}.info.sections.visa`);
  
  return (
    <Card>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <VisaRequirementBadge 
        required={requirements.visaRequired}
        type={requirements.visaType}
        nationality={userNationality}
      />
    </Card>
  );
}
