// 出境通 - Japan Procedures Screen (日本入境流程)
import React, { useMemo } from 'react';
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
import { useLocale } from '../../i18n/LocaleContext';

const JapanProceduresScreen = ({ navigation, route }) => {
  const { passport, destination } = route.params || {};
  const { t } = useLocale();

  const handleStartPreparation = () => {
    navigation.navigate('TravelInfo', { passport, destination });
  };

  const entrySteps = useMemo(() => {
    const steps = t('japan.procedures.entrySteps.steps', { defaultValue: [] });
    return steps.map((step, index) => ({
      step: index + 1,
      ...step
    }));
  }, [t]);

  const appFeatures = useMemo(() => 
    t('japan.procedures.features.items', { defaultValue: [] })
  , [t]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('japan.procedures.headerTitle')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('japan.procedures.title')}</Text>
          <Text style={styles.subtitle}>{t('japan.procedures.subtitle')}</Text>
        </View>

        {/* App Help Instruction */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>{t('japan.procedures.helpSection.title')}</Text>
          <View style={styles.helpCard}>
            <Text style={styles.helpText}>
              {t('japan.procedures.helpSection.description')}
            </Text>
            <Text style={styles.helpSubtext}>
              {t('japan.procedures.helpSection.subdescription')}
            </Text>
          </View>
        </View>

        {/* Entry Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('japan.procedures.entrySteps.title')}</Text>
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
          <Text style={styles.sectionTitle}>{t('japan.procedures.features.title')}</Text>
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
          <Text style={styles.sectionTitle}>{t('japan.procedures.importantNotes.title')}</Text>
          <View style={styles.notesCard}>
            {t('japan.procedures.importantNotes.items', { defaultValue: [] }).map((note, index) => (
              <Text key={index} style={styles.noteText}>{note}</Text>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartPreparation}
          >
            <Text style={styles.startButtonText}>{t('japan.procedures.startButton')}</Text>
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
