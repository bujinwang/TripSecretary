import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import EntryPackDisplay from '../../components/EntryPackDisplay';
import UserDataService from '../../services/data/UserDataService';

const EntryPackPreviewScreen = ({ route, navigation }) => {
  const { userData, passport: rawPassport, destination, entryPackData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const handleClose = () => {
    navigation.goBack();
  };

  // Create a mock entry pack for preview
  const mockEntryPack = {
    id: 'preview',
    status: 'preview',
    tdacSubmission: entryPackData?.tdacSubmission || null,
    personalInfo: userData?.personalInfo || {},
    travel: userData?.travel || {},
    funds: userData?.funds || [],
    passport: userData?.passport || passport || {},
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>臺灣入境包 - 預覽 / Taiwan Entry Pack - Preview</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.previewBanner}>
          <Text style={styles.previewIcon}>👁️</Text>
          <Text style={styles.previewTitle}>預覽模式 / Preview Mode</Text>
          <Text style={styles.previewDescription}>
            這是您的臺灣入境資訊預覽。所有資訊將幫助您順利通過臺灣入境檢查。
          </Text>
          <Text style={styles.previewDescriptionEn}>
            This is your Taiwan entry information preview. All information will help you pass through Taiwan immigration smoothly.
          </Text>
        </View>

        <EntryPackDisplay
          entryPack={mockEntryPack}
          personalInfo={mockEntryPack.personalInfo}
          travelInfo={mockEntryPack.travel}
          funds={mockEntryPack.funds}
          isModal={false}
          country="taiwan"
        />

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to travel info to complete missing information
              navigation.navigate('TaiwanTravelInfo', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.continueButtonText}>
              繼續完善資訊 ✏️ / Continue Editing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to entry preparation
              navigation.navigate('TaiwanRequirements', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.submitButtonText}>
              前往入境準備 🇹🇼 / Go to Entry Preparation
            </Text>
          </TouchableOpacity>
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
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  previewDescription: {
    ...typography.body2,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  previewDescriptionEn: {
    ...typography.body2,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    padding: spacing.md,
    gap: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  continueButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  submitButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
});

export default EntryPackPreviewScreen;
