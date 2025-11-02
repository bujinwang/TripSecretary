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

const VietnamEntryPackPreviewScreen = ({ route, navigation }) => {
  const { userData, passport: rawPassport, destination, entryPackData } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);

  const handleClose = () => {
    navigation.goBack();
  };

  const mockEntryPack = {
    id: 'preview',
    status: 'preview',
    personalInfo: userData?.personalInfo || {},
    travel: userData?.travel || {},
    funds: userData?.funds || entryPackData?.funds || [],
    passport: userData?.passport || passport || {},
    country: 'vietnam',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vietnam Entry Pack Preview / 越南入境包预览</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewBanner}>
          <Text style={styles.previewIcon}>👁️</Text>
          <Text style={styles.previewTitle}>Preview Mode / 预览模式</Text>
          <Text style={styles.previewDescriptionVi}>
            Đây là bản xem trước thông tin nhập cảnh Việt Nam của bạn. Chuẩn bị đầy đủ giúp thủ tục nhập cảnh diễn ra suôn sẻ.
          </Text>
          <Text style={styles.previewDescriptionZh}>
            这是越南入境资料的预览版本。提前准备完整信息，可更顺利通过海关检查。
          </Text>
        </View>

        <EntryPackDisplay
          entryPack={mockEntryPack}
          personalInfo={mockEntryPack.personalInfo}
          travelInfo={mockEntryPack.travel}
          funds={mockEntryPack.funds || []}
          isModal={false}
          country="vietnam"
        />

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              navigation.goBack();
              navigation.navigate('VietnamTravelInfo', {
                passport,
                destination,
              });
            }}
          >
            <Text style={styles.primaryButtonText}>
              ✏️ Tiếp tục chỉnh sửa / 继续补充信息
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              navigation.navigate('VietnamEntryGuide');
            }}
          >
            <Text style={styles.secondaryButtonText}>
              🛂 Hướng dẫn nhập cảnh / 入境手续指南
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Vui lòng điền phiếu nhập cảnh/ xuất cảnh giấy bằng chữ in hoa tiếng Anh và mang theo bút ký. Mỗi hành khách cần chuẩn bị 2 liên (nhập cảnh & xuất cảnh).
          </Text>
          <Text style={styles.infoTextZh}>
            记得随身携带蓝/黑色签字笔，越南纸质入境/出境卡需用英文大写填写，并保留出境联以便离境时交回。
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
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  previewBanner: {
    backgroundColor: '#E5F7EB',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0BD67B',
  },
  previewIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    ...typography.h3,
    color: '#0B7A4B',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  previewDescriptionVi: {
    ...typography.body2,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  previewDescriptionZh: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: '#0BD67B',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  secondaryButtonText: {
    ...typography.body2,
    color: '#2196F3',
    fontWeight: '700',
  },
  infoSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoText: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  infoTextZh: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default VietnamEntryPackPreviewScreen;

