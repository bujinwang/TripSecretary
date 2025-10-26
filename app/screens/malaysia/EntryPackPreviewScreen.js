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

const MalaysiaEntryPackPreviewScreen = ({ route, navigation }) => {
  const { userData, passport: rawPassport, destination, entryPackData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const handleClose = () => {
    navigation.goBack();
  };

  // Create a mock entry pack for preview
  const mockEntryPack = {
    id: 'preview',
    status: 'preview',
    mdacSubmission: entryPackData?.mdacSubmission || null,
    personalInfo: userData?.personalInfo || {},
    travel: userData?.travel || {},
    passport: userData?.passport || passport || {},
    country: 'malaysia'
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>马来西亚入境包 - 预览</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.previewBanner}>
          <Text style={styles.previewIcon}>👁️</Text>
          <Text style={styles.previewTitle}>预览模式</Text>
          <Text style={styles.previewDescription}>
            这是您的入境信息预览。提交MDAC数字入境卡后，将包含完整的入境卡详情。
          </Text>
        </View>

        <EntryPackDisplay
          entryPack={mockEntryPack}
          personalInfo={mockEntryPack.personalInfo}
          travelInfo={mockEntryPack.travel}
          funds={mockEntryPack.funds}
          isModal={false}
          country="malaysia"
        />

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to travel info to complete missing information
              navigation.navigate('MalaysiaTravelInfo', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.continueButtonText}>
              继续完善信息 ✏️
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              navigation.goBack();
              // Navigate to MDAC submission
              navigation.navigate('MDACSelection', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.submitButtonText}>
              提交MDAC入境卡 🇲🇾
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            提示：确保所有信息准确无误后再提交MDAC。入境卡需要在抵达前3天内提交。
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
  infoText: {
    ...typography.body2,
    color: '#059669',
    flex: 1,
    lineHeight: 20,
  },
});

export default MalaysiaEntryPackPreviewScreen;
