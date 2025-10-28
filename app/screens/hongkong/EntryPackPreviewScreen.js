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

const HongKongEntryPackPreviewScreen = ({ route, navigation }) => {
  const { userData, passport: rawPassport, destination, entryPackData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const handleClose = () => {
    navigation.goBack();
  };

  // Create a mock entry pack for preview
  const mockEntryPack = {
    id: 'preview',
    status: 'preview',
    hdacSubmission: entryPackData?.hdacSubmission || null,
    personalInfo: userData?.personalInfo || {},
    travel: userData?.travel || {},
    funds: userData?.funds || entryPackData?.funds || [],
    passport: userData?.passport || passport || {},
    country: 'hongkong'
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>香港入境包 - 預覽 / Hong Kong Entry Pack - Preview</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.previewBanner}>
          <Text style={styles.previewIcon}>👁️</Text>
          <Text style={styles.previewTitle}>預覽模式 / Preview Mode</Text>
          <Text style={styles.previewDescription}>
            這是您的香港入境信息預覽。所有信息將幫助您順利通過香港入境檢查。
          </Text>
          <Text style={styles.previewDescriptionEn}>
            This is your Hong Kong entry information preview. All information will help you pass through Hong Kong immigration smoothly.
          </Text>
        </View>

        <EntryPackDisplay
          entryPack={mockEntryPack}
          personalInfo={mockEntryPack.personalInfo}
          travelInfo={mockEntryPack.travel}
          funds={mockEntryPack.funds || []}
          isModal={false}
          country="hongkong"
        />

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to travel info to complete missing information
              navigation.navigate('HongkongTravelInfo', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.continueButtonText}>
              繼續完善信息 ✏️ / Continue Editing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to HDAC submission
              navigation.navigate('HDACSelection', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.submitButtonText}>
              前往入境準備 🇭🇰 / Go to Entry Preparation
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoText}>
              提示：確保所有信息準確無誤。香港入境通常比較快速，但建議提前準備好所有材料。
            </Text>
            <Text style={styles.infoTextEn}>
              Tip: Ensure all information is accurate. Hong Kong immigration is usually quick, but it's recommended to prepare all materials in advance.
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
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  previewBanner: {
    backgroundColor: '#FFEBEE',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  previewIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    ...typography.h3,
    color: '#D32F2F',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  previewDescription: {
    ...typography.body2,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  previewDescriptionEn: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  actionSection: {
    margin: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#D32F2F',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  continueButtonText: {
    ...typography.body1,
    color: '#D32F2F',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#D32F2F',
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
  infoText: {
    ...typography.body2,
    color: '#059669',
    lineHeight: 20,
  },
  infoTextEn: {
    ...typography.body2,
    color: '#047857',
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});

export default HongKongEntryPackPreviewScreen;
