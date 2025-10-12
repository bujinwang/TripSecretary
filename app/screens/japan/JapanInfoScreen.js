// 出境通 - Japan Info Screen (日本入境信息)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import BackButton from '../../components/BackButton';

const JapanInfoScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};

  const handleContinue = () => {
    navigation.navigate('JapanRequirements', { passport, destination });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label="返回"
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>日本入境信息</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.flag}>🇯🇵</Text>
          <Text style={styles.title}>日本旅游签证信息</Text>
          <Text style={styles.subtitle}>专为中国护照持有者设计</Text>
        </View>

        {/* Visa Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✓ 签证要求</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              无需申请签证！中国护照持有者可免签证入境日本旅游。
            </Text>
            <Text style={styles.infoText}>
              • 停留期限：最多90天
            </Text>
            <Text style={styles.infoText}>
              • 入境目的：仅限旅游、观光
            </Text>
            <Text style={styles.infoText}>
              • 不可延期或改变身份
            </Text>
          </View>
        </View>

        {/* Stay Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ 停留期限</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • 每次入境最多可停留90天
            </Text>
            <Text style={styles.infoText}>
              • 6个月内累计停留不超过90天
            </Text>
            <Text style={styles.infoText}>
              • 建议安排合理的行程时间
            </Text>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ 重要提醒</Text>
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              • 必须有明确的旅游目的
            </Text>
            <Text style={styles.warningText}>
              • 不可在日本打工或从事商业活动
            </Text>
            <Text style={styles.warningText}>
              • 违反规定可能被拒绝入境或强制遣返
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>我了解，继续准备</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
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
    width: 40,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  flag: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  warningText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default JapanInfoScreen;
