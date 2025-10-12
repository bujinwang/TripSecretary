// 出境通 - Japan Procedures Screen (日本入境流程)
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

const JapanProceduresScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};

  const handleStartPreparation = () => {
    navigation.navigate('TravelInfo', { passport, destination });
  };

  const entrySteps = [
    {
      step: 1,
      title: '抵达机场',
      description: '到达日本机场入境大厅',
      details: '准备好护照和已填写的入境卡、海关申报单'
    },
    {
      step: 2,
      title: '入境检查',
      description: '前往入境审查柜台',
      details: '提交护照、入境卡，接受官员审查和指纹采集'
    },
    {
      step: 3,
      title: '海关申报',
      description: '前往海关检查区',
      details: '提交海关申报单，申报携带物品，可能需要开箱检查'
    },
    {
      step: 4,
      title: '完成入境',
      description: '领取入境章',
      details: '在护照上盖入境章，正式进入日本境内'
    }
  ];

  const appFeatures = [
    {
      icon: '📝',
      title: '自动填表',
      description: '帮您把入境卡和申报单填好，您只要抄写就行'
    },
    {
      icon: '📋',
      title: '信息录入',
      description: '您输入一次旅行信息，系统自动填到所有表格里'
    },
    {
      icon: '📱',
      title: '不用联网',
      description: '填好后不用网络也能看，机场没信号也没关系'
    },
    {
      icon: '💾',
      title: '记住信息',
      description: '保存您的资料，下次去日本时直接用，不用重输'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>入境流程说明</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>日本入境完整流程</Text>
          <Text style={styles.subtitle}>TripSecretary将帮您准备一切</Text>
        </View>

        {/* App Help Instruction */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>📝 TripSecretary帮您做什么</Text>
          <View style={styles.helpCard}>
            <Text style={styles.helpText}>
              入境卡和海关申报单我帮你填好，你在机场找到表格照抄就行！
            </Text>
            <Text style={styles.helpSubtext}>
              不用担心填错字，跟着我准备好的内容抄写即可
            </Text>
          </View>
        </View>

        {/* Entry Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚶‍♂️ 入境步骤</Text>
          {entrySteps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
              <Text style={styles.stepDetails}>{step.details}</Text>
            </View>
          ))}
        </View>

        {/* App Capabilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ TripSecretary能为您做什么</Text>
          <View style={styles.featuresGrid}>
            {appFeatures.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ 重要提醒</Text>
          <View style={styles.notesCard}>
            <Text style={styles.noteText}>• 入境卡和海关申报单必须用黑色或蓝色笔填写</Text>
            <Text style={styles.noteText}>• 字迹要清晰，信息要准确</Text>
            <Text style={styles.noteText}>• 申报单上的"是/否"问题要如实回答</Text>
            <Text style={styles.noteText}>• 保持礼貌，配合检查</Text>
            <Text style={styles.noteText}>• 保留入境卡副联直到离境</Text>
          </View>
        </View>

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartPreparation}
          >
            <Text style={styles.startButtonText}>开始准备入境包</Text>
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
    ...typography.body2,
    color: colors.primary,
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
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  helpSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  helpTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  helpCard: {
    backgroundColor: '#E8F5E8',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  helpText: {
    ...typography.h3,
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  helpSubtext: {
    ...typography.body1,
    color: '#2E7D32',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.lg,
    fontWeight: 'bold',
  },
  stepCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  stepDescription: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  stepDetails: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 48, // Align with content
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: '48%', // Two columns
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  featureTitle: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  notesCard: {
    backgroundColor: '#FFF3E0',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  noteText: {
    ...typography.body1,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default JapanProceduresScreen;