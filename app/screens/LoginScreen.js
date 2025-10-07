// 出国啰 - Login Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import Button from '../components/Button';
import { colors, typography, spacing } from '../theme';

const LoginScreen = ({ navigation }) => {
  const handleWeChatLogin = () => {
    console.log('WeChat login pressed');
    // TODO: Implement WeChat login
    navigation.replace('MainTabs');
  };

  const handlePhoneLogin = () => {
    console.log('Phone login pressed');
    // TODO: Implement phone login
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoEmoji}>✈️</Text>
          </View>
          <Text style={styles.title}>出国啰</Text>
          <Text style={styles.subtitle}>扫一扫证件，AI帮你过海关</Text>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title="微信登录"
            onPress={handleWeChatLogin}
            variant="primary"
            icon={<Text style={styles.buttonIcon}>💬</Text>}
          />
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="手机号登录"
            onPress={handlePhoneLogin}
            variant="secondary"
          />
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          登录即表示同意{' '}
          <Text style={styles.termsLink}>《用户协议》</Text>
          {' '}和{' '}
          <Text style={styles.termsLink}>《隐私政策》</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: colors.primaryLight,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 64,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
  },
  buttonIcon: {
    fontSize: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginHorizontal: spacing.md,
  },
  terms: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.secondary,
  },
});

export default LoginScreen;
