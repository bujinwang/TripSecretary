// 入境通 - Vietnam Requirements Screen (越南入境要求确认)
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';
import BackButton from '../../components/BackButton';
import { useLocale } from '../../i18n/LocaleContext';
import UserDataService from '../../services/data/UserDataService';

const VietnamRequirementsScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const handleContinue = () => {
    navigation.navigate('VietnamTravelInfo', { passport, destination });
  };

  const requirementItems = useMemo(
    () => [
      {
        key: 'validPassport',
        title: t('vietnam.requirements.items.validPassport.title', {
          defaultValue: 'Valid Passport',
        }),
        description: t('vietnam.requirements.items.validPassport.description', {
          defaultValue: 'Passport must be valid for at least 6 months',
        }),
        details: t('vietnam.requirements.items.validPassport.details', {
          defaultValue: 'Your passport must have at least 6 months validity from your date of entry into Vietnam.',
        }),
      },
      {
        key: 'visa',
        title: t('vietnam.requirements.items.visa.title', {
          defaultValue: 'E-Visa or Visa',
        }),
        description: t('vietnam.requirements.items.visa.description', {
          defaultValue: 'Apply for e-Visa online or obtain visa on arrival',
        }),
        details: t('vietnam.requirements.items.visa.details', {
          defaultValue: 'Chinese citizens can apply for e-Visa online (90 days validity) or obtain visa on arrival with pre-approval letter.',
        }),
      },
      {
        key: 'onwardTicket',
        title: t('vietnam.requirements.items.onwardTicket.title', {
          defaultValue: 'Return or Onward Ticket',
        }),
        description: t('vietnam.requirements.items.onwardTicket.description', {
          defaultValue: 'Proof of departure from Vietnam',
        }),
        details: t('vietnam.requirements.items.onwardTicket.details', {
          defaultValue: 'You must show proof of onward or return travel (flight, bus, or train ticket).',
        }),
      },
      {
        key: 'accommodation',
        title: t('vietnam.requirements.items.accommodation.title', {
          defaultValue: 'Accommodation Proof',
        }),
        description: t('vietnam.requirements.items.accommodation.description', {
          defaultValue: 'Hotel booking or address in Vietnam',
        }),
        details: t('vietnam.requirements.items.accommodation.details', {
          defaultValue: 'Provide hotel reservation or address of where you will stay in Vietnam.',
        }),
      },
      {
        key: 'funds',
        title: t('vietnam.requirements.items.funds.title', {
          defaultValue: 'Sufficient Funds',
        }),
        description: t('vietnam.requirements.items.funds.description', {
          defaultValue: 'Proof of financial means',
        }),
        details: t('vietnam.requirements.items.funds.details', {
          defaultValue: 'Be prepared to show proof of sufficient funds for your stay (cash, credit cards, or bank statements).',
        }),
      },
    ],
    [t]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back', { defaultValue: 'Back' })}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          {t('vietnam.requirements.headerTitle', { defaultValue: 'Entry Requirements' })}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {t('vietnam.requirements.introTitle', {
              defaultValue: 'What You Need to Enter Vietnam',
            })}
          </Text>
          <Text style={styles.subtitle}>
            {t('vietnam.requirements.introSubtitle', {
              defaultValue: 'Please ensure you have the following documents and requirements ready',
            })}
          </Text>
        </View>

        {/* Requirements List */}
        <View style={styles.requirementsList}>
          {requirementItems.map((item) => (
            <View key={item.key} style={styles.requirementCard}>
              <View style={styles.requirementHeader}>
                <View style={styles.bulletContainer}>
                  <View style={styles.bullet} />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>{item.title}</Text>
                  <Text style={styles.requirementDescription}>{item.description}</Text>
                </View>
              </View>
              <Text style={styles.requirementDetails}>{item.details}</Text>
            </View>
          ))}
        </View>

        {/* Status Message */}
        <View style={styles.statusSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📝</Text>
            <Text style={styles.infoText}>
              {t('vietnam.requirements.status.info.title', {
                defaultValue: 'Ready to Fill Entry Information',
              })}
            </Text>
            <Text style={styles.infoSubtext}>
              {t('vietnam.requirements.status.info.subtitle', {
                defaultValue: 'The app will help you organize these details for a smooth entry process',
              })}
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {t('vietnam.requirements.startButton', {
                defaultValue: 'Continue to Travel Details',
              })}
            </Text>
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
    ...typography.h3,
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
  requirementsList: {
    paddingHorizontal: spacing.md,
  },
  requirementCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requirementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bulletContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  requirementContent: {
    flex: 1,
  },
  requirementTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  requirementDescription: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  requirementDetails: {
    ...typography.body2,
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  statusSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#90CAF9',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.h4,
    color: '#1565C0',
    fontWeight: '600',
    textAlign: 'center',
  },
  infoSubtext: {
    ...typography.body2,
    color: '#1976D2',
    marginTop: spacing.xs,
    textAlign: 'center',
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

export default VietnamRequirementsScreen;
