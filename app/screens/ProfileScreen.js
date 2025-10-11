// 出境通 - Profile Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';

const ProfileScreen = ({ navigation }) => {
  const { t, locale } = useTranslation();
  
  // Mock passport data (in real app, get from context/storage)
  const passportData = {
    type: '中国护照',
    name: '张伟',
    nameEn: 'ZHANG WEI',
    passportNo: 'E12345678',
    expiry: '2030-12-31',
  };

  const menuItems = [
    {
      section: '我的服务',
      items: [
        { id: 'documents', icon: '📘', title: '我的证件', badge: 2 },
        { id: 'history', icon: '📋', title: '生成历史', badge: 12 },
        { id: 'backup', icon: '💾', title: '云端备份', subtitle: '最近: 今天' },
      ],
    },
    {
      section: '设置与帮助',
      items: [
        { id: 'language', icon: '🌐', title: '语言 / Language', subtitle: locale === 'zh' ? '中文' : locale === 'en' ? 'English' : locale === 'fr' ? 'Français' : locale === 'de' ? 'Deutsch' : 'Español' },
        { id: 'settings', icon: '⚙️', title: '设置' },
        { id: 'help', icon: '❓', title: '帮助中心' },
        { id: 'about', icon: '📱', title: '关于我们' },
        { id: 'notifications', icon: '🔔', title: '通知设置' },
      ],
    },
  ];

  const handleMenuPress = (itemId) => {
    console.log('Menu pressed:', itemId);
    if (itemId === 'language') {
      // Navigate back to login to change language
      navigation.replace('Login');
    }
    // TODO: Navigate to respective screens
  };

  const handleLogout = () => {
    console.log('Logout');
    // TODO: Implement logout
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的</Text>
          <TouchableOpacity>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>张伟</Text>
            <Text style={styles.userPhone}>手机: 138****1234</Text>
          </View>
        </View>

        {/* Passport Info */}
        <View style={styles.passportSection}>
          <Card style={styles.passportCard}>
            <View style={styles.passportHeader}>
              <Text style={styles.passportIcon}>📘</Text>
              <View style={styles.passportInfo}>
                <Text style={styles.passportLabel}>我的护照</Text>
                <Text style={styles.passportDetails}>
                  {passportData.passportNo} · 有效期至 {passportData.expiry}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.updatePassportButton}
              onPress={() => navigation.navigate('ScanPassport')}
            >
              <Text style={styles.updatePassportText}>更新护照信息</Text>
              <Text style={styles.updatePassportArrow}>›</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* VIP Upgrade Card */}
        <View style={styles.vipCard}>
          <View style={styles.vipContent}>
            <Text style={styles.vipIcon}>💎</Text>
            <View style={styles.vipInfo}>
              <Text style={styles.vipTitle}>升级高级会员</Text>
              <Text style={styles.vipSubtitle}>无限次生成，优先处理</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.vipButton}>
            <Text style={styles.vipButtonText}>立即升级</Text>
            <Text style={styles.vipArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.sectionTitle}>{section.section}</Text>

            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.id)}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>({item.badge})</Text>
                  </View>
                )}
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>版本 1.0.0</Text>
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
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  settingsIcon: {
    fontSize: 24,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userPhone: {
    ...typography.body1,
    color: colors.textSecondary,
  },

  // Passport Section Styles
  passportSection: {
    margin: spacing.md,
  },
  passportCard: {
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

  vipCard: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  vipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vipIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  vipInfo: {
    flex: 1,
  },
  vipTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  vipSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  vipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.small,
  },
  vipButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  vipArrow: {
    ...typography.h3,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
  },
  divider: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    height: 8,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textTertiary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    ...typography.body1,
    color: colors.text,
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    marginRight: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  menuArrow: {
    ...typography.h2,
    color: colors.textDisabled,
  },
  logoutButton: {
    margin: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    ...typography.body1,
    color: colors.error,
  },
  version: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
});

export default ProfileScreen;
