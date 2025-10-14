/**
 * 入境通 - Privacy Consent Screen
 * GDPR/PIPL compliant privacy policy and consent management
 */

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
import { colors, typography, spacing, borderRadius } from '../theme';
import { useTranslation } from '../i18n/LocaleContext';
import * as SecureStore from 'expo-secure-store';

const PrivacyConsentScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [consents, setConsents] = useState({
    privacyPolicy: false,
    dataProcessing: false,
    marketing: false,
    analytics: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFirstTime = route?.params?.firstTime || false;
  const requiredConsents = ['privacyPolicy', 'dataProcessing'];

  useEffect(() => {
    loadExistingConsents();
  }, []);

  const loadExistingConsents = async () => {
    try {
      const stored = await SecureStore.getItemAsync('privacy_consents');
      if (stored) {
        setConsents(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load consents:', error);
    }
  };

  const handleConsentChange = (consentType, value) => {
    setConsents(prev => ({
      ...prev,
      [consentType]: value
    }));
  };

  const handleAcceptAll = () => {
    setConsents({
      privacyPolicy: true,
      dataProcessing: true,
      marketing: true,
      analytics: true,
    });
  };

  const handleRejectAll = () => {
    setConsents({
      privacyPolicy: false,
      dataProcessing: false,
      marketing: false,
      analytics: false,
    });
  };

  const validateConsents = () => {
    // Check required consents
    for (const required of requiredConsents) {
      if (!consents[required]) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateConsents()) {
      Alert.alert(
        'Required Consents',
        'Please accept the privacy policy and data processing terms to continue.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Save consents
      const consentData = {
        ...consents,
        timestamp: new Date().toISOString(),
        version: '1.0',
        gdprCompliant: true,
      };

      await SecureStore.setItemAsync('privacy_consents', JSON.stringify(consentData));

      // Navigate based on context
      if (isFirstTime) {
        navigation.replace('Home');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to save consents:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ConsentItem = ({ type, title, description, required = false }) => (
    <View style={styles.consentItem}>
      <View style={styles.consentHeader}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleConsentChange(type, !consents[type])}
        >
          <Text style={styles.checkboxIcon}>
            {consents[type] ? '☑' : '☐'}
          </Text>
        </TouchableOpacity>
        <View style={styles.consentText}>
          <Text style={[styles.consentTitle, required && styles.requiredText]}>
            {title} {required && '*'}
          </Text>
          <Text style={styles.consentDescription}>{description}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('privacy.title', { defaultValue: 'Privacy & Consent' })}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isFirstTime
              ? t('privacy.firstTime', { defaultValue: 'Please review and accept our privacy terms to continue' })
              : t('privacy.update', { defaultValue: 'Update your privacy preferences' })
            }
          </Text>
        </View>

        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('privacy.policy.title', { defaultValue: 'Privacy Policy' })}
          </Text>

          <View style={styles.policyCard}>
            <Text style={styles.policyText}>
              {t('privacy.policy.summary', {
                defaultValue: 'We collect and process your personal information to provide immigration assistance services. Your data is encrypted and stored securely. We comply with GDPR and PIPL regulations.'
              })}
            </Text>

            <TouchableOpacity style={styles.readMoreButton}>
              <Text style={styles.readMoreText}>
                {t('privacy.policy.readMore', { defaultValue: 'Read Full Privacy Policy →' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Consent Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('privacy.consents.title', { defaultValue: 'Your Consents' })}
          </Text>

          <ConsentItem
            type="privacyPolicy"
            title={t('privacy.consents.privacy.title', { defaultValue: 'Privacy Policy' })}
            description={t('privacy.consents.privacy.description', {
              defaultValue: 'I agree to the collection and processing of my personal data as described in the privacy policy'
            })}
            required={true}
          />

          <ConsentItem
            type="dataProcessing"
            title={t('privacy.consents.processing.title', { defaultValue: 'Data Processing' })}
            description={t('privacy.consents.processing.description', {
              defaultValue: 'I consent to the processing of my data for immigration form generation and service improvement'
            })}
            required={true}
          />

          <ConsentItem
            type="marketing"
            title={t('privacy.consents.marketing.title', { defaultValue: 'Marketing Communications' })}
            description={t('privacy.consents.marketing.description', {
              defaultValue: 'I agree to receive updates about new features and travel tips (optional)'
            })}
          />

          <ConsentItem
            type="analytics"
            title={t('privacy.consents.analytics.title', { defaultValue: 'Usage Analytics' })}
            description={t('privacy.consents.analytics.description', {
              defaultValue: 'Help improve the app by sharing anonymous usage statistics (optional)'
            })}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('privacy.actions.title', { defaultValue: 'Quick Actions' })}
          </Text>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleAcceptAll}
            >
              <Text style={styles.quickActionText}>
                {t('privacy.actions.acceptAll', { defaultValue: 'Accept All' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleRejectAll}
            >
              <Text style={styles.quickActionText}>
                {t('privacy.actions.rejectAll', { defaultValue: 'Reject All' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('privacy.rights.title', { defaultValue: 'Your Data Rights' })}
          </Text>

          <View style={styles.rightsCard}>
            <Text style={styles.rightsItem}>• Access: View all your personal data</Text>
            <Text style={styles.rightsItem}>• Portability: Export your data in machine-readable format</Text>
            <Text style={styles.rightsItem}>• Rectification: Update incorrect information</Text>
            <Text style={styles.rightsItem}>• Erasure: Delete all your data ("Right to be Forgotten")</Text>
            <Text style={styles.rightsItem}>• Restriction: Limit data processing</Text>
            <Text style={styles.rightsItem}>• Objection: Opt-out of certain processing</Text>
          </View>
        </View>

        {/* Submit Section */}
        <View style={styles.submitSection}>
          <View style={styles.requiredNote}>
            <Text style={styles.requiredNoteText}>
              * Required consents must be accepted to use the app
            </Text>
          </View>

          <Button
            title={isFirstTime
              ? t('privacy.submit.firstTime', { defaultValue: 'Accept & Continue' })
              : t('privacy.submit.update', { defaultValue: 'Save Preferences' })
            }
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!validateConsents()}
            style={styles.submitButton}
          />

          {isFirstTime && (
            <TouchableOpacity
              style={styles.exitButton}
              onPress={() => Alert.alert(
                'Exit App',
                'You must accept the privacy terms to use this app.',
                [{ text: 'OK' }]
              )}
            >
              <Text style={styles.exitButtonText}>
                {t('privacy.exit', { defaultValue: 'Exit App' })}
              </Text>
            </TouchableOpacity>
          )}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  policyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  policyText: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  consentItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxIcon: {
    fontSize: 20,
  },
  consentText: {
    flex: 1,
  },
  consentTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  requiredText: {
    color: colors.error,
  },
  consentDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickActionText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  rightsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rightsItem: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  submitSection: {
    padding: spacing.lg,
  },
  requiredNote: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  requiredNoteText: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
  },
  submitButton: {
    marginBottom: spacing.md,
  },
  exitButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  exitButtonText: {
    ...typography.body1,
    color: colors.error,
    fontWeight: '600',
  },
});

export default PrivacyConsentScreen;