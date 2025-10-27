import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import EntryPackDisplay from '../../components/EntryPackDisplay';
import UserDataService from '../../services/data/UserDataService';

const USEntryPackPreviewScreen = ({ route, navigation }) => {
  const { userData, passport: rawPassport, destination, entryPackData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const handleClose = () => {
    navigation.goBack();
  };

  // Create a mock entry pack for preview
  const mockEntryPack = {
    id: 'preview',
    status: 'preview',
    i94Submission: entryPackData?.i94Submission || null,
    personalInfo: userData?.personalInfo || {},
    travel: userData?.travel || {},
    funds: userData?.funds || entryPackData?.funds || [],
    passport: userData?.passport || passport || {},
    country: 'usa'
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          美国入境包 - 预览 / US Entry Pack - Preview
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.previewBanner}>
          <Text style={styles.previewIcon}>👁️</Text>
          <Text style={styles.previewTitle}>预览模式 / Preview Mode</Text>
          <Text style={styles.previewDescription}>
            这是您的美国入境信息预览。所有信息将帮助您顺利通过美国入境检查。
          </Text>
          <Text style={styles.previewDescriptionEn}>
            This is your United States entry information preview. All information will help you pass through US immigration smoothly.
          </Text>
        </View>

        <EntryPackDisplay
          entryPack={mockEntryPack}
          personalInfo={mockEntryPack.personalInfo}
          travelInfo={mockEntryPack.travel}
          funds={mockEntryPack.funds || []}
          isModal={false}
          country="usa"
        />

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to travel info to complete missing information
              navigation.navigate('USTravelInfo', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.continueButtonText}>
              继续完善信息 ✏️ / Continue Editing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to US Entry Flow
              // Note: I-94 is completed at the airport, not online
              // This could navigate to entry preparation screen
            }}
          >
            <Text style={styles.submitButtonText}>
              前往入境准备 🇺🇸 / Go to Entry Preparation
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              提示：I-94入境记录将在抵达美国机场时填写。请确保所有信息准确，并准备好向海关及边境保护局(CBP)官员展示。
            </Text>
            <Text style={styles.infoTextEn}>
              Tip: The I-94 arrival/departure record will be completed at the airport upon arrival in the US. Ensure all information is accurate and ready to show to CBP officers.
            </Text>
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  previewBanner: {
    backgroundColor: colors.primaryLight,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  previewIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  previewDescription: {
    ...typography.body2,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  previewDescriptionEn: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
  },
  actionSection: {
    margin: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  continueButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    ...typography.body2,
    color: '#059669',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  infoTextEn: {
    ...typography.caption,
    color: '#059669',
    lineHeight: 18,
    fontSize: 11,
  },
});

export default USEntryPackPreviewScreen;
