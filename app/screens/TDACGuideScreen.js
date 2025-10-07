// TDAC填写助手 - 帮助老人填写泰国电子入境卡
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Clipboard,
} from 'react-native';
import { colors, typography, spacing } from '../theme';

const TDACGuideScreen = ({ navigation, route }) => {
  const { passport, destination, travelInfo } = route.params || {};
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    Clipboard.setString(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    Alert.alert('已复制', `${fieldName}已复制到剪贴板`, [{ text: '好的' }]);
  };

  const openTDAC = () => {
    Linking.openURL('https://tdac.immigration.go.th');
  };

  // 解析姓名
  const nameEn = passport?.nameEn || passport?.name || '';
  const nameParts = nameEn.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const renderCopyField = (label, value, fieldName) => (
    <View style={styles.fieldRow}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.copyButton,
          copiedField === fieldName && styles.copyButtonActive,
        ]}
        onPress={() => copyToClipboard(value, label)}
      >
        <Text style={styles.copyButtonText}>
          {copiedField === fieldName ? '✓ 已复制' : '复制'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>TDAC填写助手</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionIcon}>💡</Text>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>使用说明</Text>
            <Text style={styles.instructionText}>
              1. 点击下方各字段的"复制"按钮{'\n'}
              2. 在TDAC网站对应位置粘贴{'\n'}
              3. 按照步骤填写完整表格{'\n'}
              4. 提交后保存QR码截图
            </Text>
          </View>
        </View>

        {/* Step 1: Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.sectionTitle}>个人信息 Personal Information</Text>
          </View>

          {renderCopyField('Family Name (姓)', lastName, 'lastName')}
          {renderCopyField('First Name (名)', firstName, 'firstName')}
          {renderCopyField('Passport Number (护照号)', passport?.passportNo, 'passportNo')}
          {renderCopyField('Nationality (国籍)', 'China', 'nationality')}
          {renderCopyField('Date of Birth (出生日期)', passport?.birthDate || '1980-01-01', 'birthDate')}
          {renderCopyField('Gender (性别)', passport?.gender || 'Male', 'gender')}
        </View>

        {/* Step 2: Trip Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.sectionTitle}>行程信息 Trip Information</Text>
          </View>

          {renderCopyField('Flight Number (航班号)', travelInfo?.flightNumber, 'flightNumber')}
          {renderCopyField('Arrival Date (到达日期)', travelInfo?.arrivalDate, 'arrivalDate')}
          {renderCopyField('Purpose of Visit (旅行目的)', travelInfo?.travelPurpose || 'Tourism', 'purpose')}
          {renderCopyField('Duration of Stay (停留天数)', travelInfo?.stayDuration || '7 days', 'duration')}
        </View>

        {/* Step 3: Accommodation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.sectionTitle}>住宿信息 Accommodation</Text>
          </View>

          {renderCopyField('Hotel Name (酒店名称)', travelInfo?.hotelName, 'hotelName')}
          {renderCopyField('Address (地址)', travelInfo?.hotelAddress, 'hotelAddress')}
          {renderCopyField('Contact Phone (联系电话)', travelInfo?.contactPhone, 'contactPhone')}
        </View>

        {/* Step 4: Health Declaration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.sectionTitle}>健康声明 Health Declaration</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>
                近期是否有发烧、咳嗽等症状？{'\n'}
                Any fever, cough or flu symptoms?{'\n'}
                {'\n'}
                请根据实际情况选择 Yes 或 No
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>⚠️ 重要提示</Text>
          <Text style={styles.notesText}>
            • 必须在入境前72小时内提交{'\n'}
            • 提交后会收到确认邮件和QR码{'\n'}
            • 入境时出示QR码和护照{'\n'}
            • 建议截图保存QR码
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.tdacButton} onPress={openTDAC}>
          <Text style={styles.tdacButtonIcon}>🌐</Text>
          <View style={styles.tdacButtonContent}>
            <Text style={styles.tdacButtonTitle}>前往TDAC网站填写</Text>
            <Text style={styles.tdacButtonSubtitle}>
              复制好信息后，在浏览器中打开并粘贴
            </Text>
          </View>
          <Text style={styles.tdacButtonArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            填写完成后，记得保存QR码截图！
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
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 32,
    color: colors.primary,
    fontWeight: 'bold',
    marginRight: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  instructionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    textAlign: 'center',
    lineHeight: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  copyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  copyButtonActive: {
    backgroundColor: colors.success,
  },
  copyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: '#FFF3E0',
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: spacing.sm,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  tdacButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tdacButtonIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  tdacButtonContent: {
    flex: 1,
  },
  tdacButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  tdacButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tdacButtonArrow: {
    fontSize: 36,
    color: colors.white,
    fontWeight: 'bold',
  },
  webViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webViewButtonIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  webViewButtonContent: {
    flex: 1,
  },
  webViewButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  webViewButtonSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  webViewButtonArrow: {
    fontSize: 36,
    color: colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default TDACGuideScreen;
