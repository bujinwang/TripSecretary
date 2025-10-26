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

const KoreaEntryPackPreviewScreen = ({ route, navigation }) => {
  const { userData, passport: rawPassport, destination, entryPackData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const handleClose = () => {
    navigation.goBack();
  };

  // Create a mock entry pack for preview
  const mockEntryPack = {
    id: 'preview',
    status: 'preview',
    ketaSubmission: entryPackData?.ketaSubmission || null,
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
        <Text style={styles.headerTitle}>入境信息包 - 预览 / Entry Pack Preview</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.previewBanner}>
          <Text style={styles.previewIcon}>👁️</Text>
          <Text style={styles.previewTitle}>预览模式 / Preview Mode</Text>
          <Text style={styles.previewDescription}>
            这是您的入境信息包预览。申请K-ETA后将包含完整的入境信息。 / This is a preview of your entry pack. After applying for K-ETA it will include the full entry details.
          </Text>
        </View>

        <EntryPackDisplay
          entryPack={mockEntryPack}
          personalInfo={mockEntryPack.personalInfo}
          travelInfo={mockEntryPack.travel}
          funds={mockEntryPack.funds}
          isModal={false}
        />

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to travel info to complete missing information
              navigation.navigate('KoreaTravelInfo', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.continueButtonText}>
              继续完善信息 ✏️ / Continue updating info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to K-ETA application
              // TODO: Implement K-ETA application screen
              alert('K-ETA申请功能即将推出 / K-ETA application screen coming soon');
            }}
          >
            <Text style={styles.submitButtonText}>
              申请 K-ETA 🇰🇷 / Apply for K-ETA
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Card about K-ETA */}
        <View style={styles.ketaInfoCard}>
          <Text style={styles.ketaInfoTitle}>📱 K-ETA 电子旅行许可信息</Text>
          <Text style={styles.ketaInfoText}>
            • K-ETA必须在抵达前72小时申请{'\n'}
            • 审批通常在24小时内完成{'\n'}
            • 批准的K-ETA有效期为2年{'\n'}
            • 申请费用约为10,000韩元
          </Text>
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
    flex: 1,
    textAlign: 'center',
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
    marginBottom: spacing.sm,
  },
  previewDescription: {
    ...typography.body2,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    padding: spacing.md,
    gap: spacing.md,
  },
  continueButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  continueButtonText: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '600',
  },
  ketaInfoCard: {
    backgroundColor: '#E3F2FD',
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  ketaInfoTitle: {
    ...typography.h3,
    color: '#1565C0',
    marginBottom: spacing.md,
  },
  ketaInfoText: {
    ...typography.body2,
    color: '#1976D2',
    lineHeight: 22,
  },
});

export default KoreaEntryPackPreviewScreen;
