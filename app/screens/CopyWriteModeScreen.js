// 出境通 - Copy Write Mode Screen (抄写模式)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwakeAsync } from 'expo-keep-awake';
import Card from '../components/Card';
import { colors, typography, spacing, borderRadius } from '../theme';

const CopyWriteModeScreen = ({ navigation, route }) => {
  const { passport, destination, travelInfo } = route.params || {};
  const [fontSize, setFontSize] = useState(24);

  // Check destination for conditional content
  const isJapan = destination?.id === 'jp' || destination?.name === '日本';

  useEffect(() => {
    // 保持屏幕常亮，防止抄写时黑屏
    const keepAwake = async () => {
      try {
        await activateKeepAwakeAsync();
      } catch (error) {
        console.log('Failed to activate keep awake:', error);
      }
    };
    
    keepAwake();
    
    return () => {
      const deactivate = async () => {
        try {
          await deactivateKeepAwakeAsync();
        } catch (error) {
          console.log('Failed to deactivate keep awake:', error);
        }
      };
      deactivate();
    };
  }, []);

  const increaseFontSize = () => {
    if (fontSize < 32) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 16) setFontSize(fontSize - 2);
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // 确保格式为 YYYY-MM-DD
    return dateStr;
  };

  // 根据目的地显示不同的表格字段
  const getFormFields = () => {
    const isJapan = destination?.id === 'jp' || destination?.name === '日本';

    if (isJapan) {
      // 日本入境卡和海关申报单
      return [
        {
          section: '入境卡 (蓝色表格)',
          sectionEn: 'Landing Card (Blue Form)',
          fields: [
            {
              label: '姓 (Family Name)',
              value: passport?.nameEn?.split(' ').pop() || 'ZHANG',
              instruction: '填写护照上的姓氏',
            },
            {
              label: '名 (Given Name)',
              value: passport?.nameEn?.split(' ').slice(0, -1).join(' ') || 'WEI',
              instruction: '填写护照上的名字',
            },
            {
              label: '出生日期 (Date of Birth)',
              value: passport?.birthDate || '1980-01-01',
              instruction: '格式：年月日 (YYYYMMDD)',
            },
            {
              label: '国籍 (Nationality)',
              value: 'CHINA',
              instruction: '填写国籍',
            },
            {
              label: '护照号码 (Passport Number)',
              value: passport?.passportNo || 'E12345678',
              instruction: '填写护照号码',
            },
            {
              label: '航班号 (Flight Number)',
              value: travelInfo?.flightNumber || '',
              instruction: '例如：CA981, CZ309',
            },
            {
              label: '入境目的 (Purpose of Visit)',
              value: 'TOURISM',
              instruction: '填写 TOURISM',
            },
            {
              label: '住宿地址 (Address in Japan)',
              value: travelInfo?.hotelName + ', ' + travelInfo?.hotelAddress || '',
              instruction: '填写酒店名称和地址',
              multiline: true,
            },
          ],
        },
        {
          section: '海关申报单 (黄色表格)',
          sectionEn: 'Customs Declaration (Yellow Form)',
          fields: [
            {
              label: '姓名 (Name)',
              value: passport?.name || '张伟',
              instruction: '填写中文姓名',
            },
            {
              label: '是否有违禁品？(Prohibited Items?)',
              value: 'NO',
              instruction: '如果没有违禁品，填 NO',
            },
            {
              label: '携带现金超过10,000日元？(Cash > ¥10,000?)',
              value: 'NO',
              instruction: '如实回答',
            },
            {
              label: '是否有商业物品？(Commercial Goods?)',
              value: 'NO',
              instruction: '如实回答',
            },
            {
              label: '携带物品总价值 (Total Value of Goods)',
              value: travelInfo?.goodsValue || 'UNDER ¥200,000',
              instruction: '一般填写 UNDER ¥200,000',
            },
          ],
        },
      ];
    } else {
      // E311 表格 (加拿大)
      const e311Fields = [
        {
          section: '第一部分：旅客信息',
          sectionEn: 'Part 1: Traveler Information',
          fields: [
            {
              label: '姓 (Last Name)',
              value: passport?.nameEn?.split(' ').pop() || passport?.name || 'ZHANG',
              instruction: '填写护照上的姓（大写字母）',
            },
            {
              label: '名 (First Name)',
              value: passport?.nameEn?.split(' ').slice(0, -1).join(' ') || 'WEI',
              instruction: '填写护照上的名（大写字母）',
            },
            {
              label: '中间名首字母 (Initial)',
              value: '',
              instruction: '如果没有中间名，留空',
            },
            {
              label: '出生日期 (Date of Birth)',
              value: passport?.birthDate || '1980-01-01',
              instruction: '格式：年-月-日 (YYYY-MM-DD)',
            },
            {
              label: '国籍 (Citizenship)',
              value: passport?.nationality || 'CHINA',
              instruction: '填写国籍（大写字母）',
            },
          ],
        },
        {
          section: '第二部分：地址信息',
          sectionEn: 'Part 2: Address Information',
          fields: [
            {
              label: '家庭住址 (Home Address)',
              value: travelInfo?.hotelAddress || '',
              instruction: '填写在加拿大的住址（酒店地址）',
              multiline: true,
            },
            {
              label: '邮编 (Postal/ZIP Code)',
              value: '',
              instruction: '酒店的邮编（如果知道的话）',
            },
          ],
        },
        {
          section: '第三部分：旅行详情',
          sectionEn: 'Part 3: Travel Details',
          fields: [
            {
              label: '航班号 (Airline/Flight Number)',
              value: travelInfo?.flightNumber || '',
              instruction: '例如：AC088, CZ329',
            },
            {
              label: '到达日期 (Arrival Date)',
              value: formatDate(travelInfo?.arrivalDate) || '',
              instruction: '格式：年-月-日',
            },
            {
              label: '来自哪个国家 (Arriving From)',
              value: 'CHINA',
              instruction: '如果从美国转机，填 U.S.A.',
            },
            {
              label: '入境目的 (Purpose of Trip)',
              value: travelInfo?.travelPurpose === '旅游' ? 'Personal' :
                     travelInfo?.travelPurpose === '商务' ? 'Business' :
                     travelInfo?.travelPurpose === '学习' ? 'Study' : 'Personal',
              instruction: '选项：Study / Personal / Business',
            },
          ],
        },
        {
          section: '第四部分：海关申报（打勾 ✓ 或 ✗）',
          sectionEn: 'Part 4: Customs Declaration (Check YES or NO)',
          fields: [
            {
              label: '携带现金超过$10,000加元？',
              labelEn: 'Currency/monetary instruments ≥ CAN$10,000?',
              value: travelInfo?.hasHighCurrency === '是' ? '✓ YES' : '✗ NO',
              instruction: '如实回答',
              highlight: travelInfo?.hasHighCurrency === '是',
            },
            {
              label: '携带商业物品、样品或用于转售的商品？',
              labelEn: 'Commercial goods, samples, or goods for resale?',
              value: travelInfo?.hasCommercialGoods === '是' ? '✓ YES' : '✗ NO',
              instruction: '如实回答',
              highlight: travelInfo?.hasCommercialGoods === '是',
            },
            {
              label: '携带食品、植物、动物或相关产品？',
              labelEn: 'Food, plants, animals, or related products?',
              value: travelInfo?.visitedFarm === '是' || travelInfo?.carryingFood === '是' ? '✓ YES' : '✗ NO',
              instruction: '包括：水果、肉类、种子、木制品等',
              highlight: travelInfo?.visitedFarm === '是' || travelInfo?.carryingFood === '是',
            },
            {
              label: '近期访问过农场或接触过农场动物？',
              labelEn: 'Visited a farm or been in contact with farm animals?',
              value: travelInfo?.visitedFarm === '是' ? '✓ YES' : '✗ NO',
              instruction: '如实回答',
              highlight: travelInfo?.visitedFarm === '是',
            },
            {
              label: '携带枪支或武器？',
              labelEn: 'Firearms or weapons?',
              value: travelInfo?.hasFirearms === '是' ? '✓ YES' : '✗ NO',
              instruction: '如实回答',
              highlight: travelInfo?.hasFirearms === '是',
            },
            {
              label: '携带物品超过免税额度？',
              labelEn: 'Goods exceed duty-free allowance?',
              value: travelInfo?.exceedsDutyFree === '是' ? '✓ YES' : '✗ NO',
              instruction: '礼品超过$60加元需申报',
              highlight: travelInfo?.exceedsDutyFree === '是',
            },
          ],
        },
      ];
      return e311Fields;
    }
  }

  const formFields = getFormFields();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>抄写模式</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.icon}>✍️</Text>
          <Text style={styles.title}>抄写模式</Text>
          <Text style={styles.subtitle}>
            对照此屏幕填写纸质表格
          </Text>
          <Text style={styles.description}>
            屏幕会保持常亮，不会自动锁屏
            {'\n'}
            您可以慢慢抄写，不用着急
          </Text>
        </View>

        {/* Font Size Controls */}
        <View style={styles.fontControls}>
          <Text style={styles.fontLabel}>字体大小：</Text>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={decreaseFontSize}
          >
            <Text style={styles.fontButtonText}>A-</Text>
          </TouchableOpacity>
          <Text style={styles.fontCurrent}>{fontSize}pt</Text>
          <TouchableOpacity
            style={styles.fontButton}
            onPress={increaseFontSize}
          >
            <Text style={styles.fontButtonText}>A+</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <Card style={styles.instructionCard}>
          <Text style={styles.instructionIcon}>💡</Text>
          <Text style={styles.instructionTitle}>使用说明</Text>
          <Text style={styles.instructionText}>
            1. 在飞机上或入境大厅拿一张空白的{isJapan ? '入境卡和海关申报单' : 'E311表格'}
            {'\n\n'}
            2. 对照手机屏幕上的内容，用笔抄写到纸质表格上
            {'\n\n'}
            3. 字段按照表格的顺序排列，从上到下依次填写
            {'\n\n'}
            4. 填写完成后，交给入境官员
          </Text>
        </Card>

        {/* Form Fields */}
        <View style={styles.formSections}>
          {formFields.map((section, sectionIndex) => (
            <View key={sectionIndex}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { fontSize: fontSize + 2 }]}>
                  {section.section}
                </Text>
                <Text style={styles.sectionTitleEn}>
                  {section.sectionEn}
                </Text>
              </View>

              {/* Fields */}
              {section.fields.map((field, fieldIndex) => (
                <Card
                  key={fieldIndex}
                  style={[
                    styles.fieldCard,
                    field.highlight && styles.fieldCardHighlight,
                  ]}
                >
                  <View style={styles.fieldNumber}>
                    <Text style={styles.fieldNumberText}>
                      {sectionIndex + 1}.{fieldIndex + 1}
                    </Text>
                  </View>

                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, { fontSize }]}>
                      {field.label}
                    </Text>
                    {field.labelEn && (
                      <Text style={styles.fieldLabelEn}>
                        {field.labelEn}
                      </Text>
                    )}

                    <View style={[
                      styles.fieldValueBox,
                      field.multiline && styles.fieldValueBoxMultiline,
                    ]}>
                      <Text
                        style={[
                          styles.fieldValue,
                          { fontSize: fontSize + 4 },
                        ]}
                        selectable
                      >
                        {field.value || '（留空）'}
                      </Text>
                    </View>

                    {field.instruction && (
                      <View style={styles.fieldInstructionBox}>
                        <Text style={styles.fieldInstructionIcon}>ℹ️</Text>
                        <Text style={[styles.fieldInstruction, { fontSize: fontSize - 4 }]}>
                          {field.instruction}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          ))}
        </View>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsIcon}>⚠️</Text>
          <Text style={[styles.tipsTitle, { fontSize: fontSize }]}>
            重要提示
          </Text>
          <Text style={[styles.tipsText, { fontSize: fontSize - 2 }]}>
            {isJapan ? (
              <>
                • 请用<Text style={styles.bold}>黑色或蓝色笔</Text>填写表格
                {'\n\n'}
                • 字迹要<Text style={styles.bold}>清晰工整</Text>，避免涂改
                {'\n\n'}
                • 海关申报部分一定要<Text style={styles.bold}>如实填写</Text>
                {'\n\n'}
                • 填写完成后，交给入境官员检查
                {'\n\n'}
                • 保留入境卡副联直到离境
              </>
            ) : (
              <>
                • 请用<Text style={styles.bold}>大写英文字母</Text>填写姓名和国籍
                {'\n\n'}
                • 日期格式：年-月-日 (例如：2025-01-15)
                {'\n\n'}
                • 海关申报部分一定要<Text style={styles.bold}>如实填写</Text>
                {'\n\n'}
                • 填写完成后，在表格底部<Text style={styles.bold}>签名</Text>
                {'\n\n'}
                • 16岁以下的儿童可由父母代签
              </>
            )}
          </Text>
        </Card>

        {/* Sample Card */}
        <Card style={styles.sampleCard}>
          <Text style={styles.sampleIcon}>📄</Text>
          <Text style={[styles.sampleTitle, { fontSize: fontSize }]}>
            {isJapan ? '入境卡和申报单样式' : 'E311 表格样式'}
          </Text>
          <View style={styles.sampleImagePlaceholder}>
            <Text style={styles.sampleImageText}>
              {isJapan ? 'Landing Card & Customs Declaration' : 'E311 Declaration Card'}
              {'\n\n'}
              (纸质表格图片示例)
              {'\n\n'}
              表格上的字段顺序与本页面一致
            </Text>
          </View>
        </Card>

        {/* Bottom Tip */}
        <View style={styles.bottomTip}>
          <Text style={styles.bottomTipIcon}>✨</Text>
          <Text style={[styles.bottomTipText, { fontSize: fontSize - 2 }]}>
            抄写完成后，记得检查一遍
            {'\n'}
            确保姓名、护照号、航班号等重要信息正确
          </Text>
        </View>

        <View style={{ height: spacing.xxl }} />
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
    ...typography.h2,
    color: colors.primary,
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
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  fontLabel: {
    ...typography.body1,
    color: colors.text,
    marginRight: spacing.sm,
  },
  fontButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.medium,
    marginHorizontal: spacing.xs,
  },
  fontButtonText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  fontCurrent: {
    ...typography.body1,
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
  instructionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryLight,
  },
  instructionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  instructionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  instructionText: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 28,
  },
  formSections: {
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  sectionTitleEn: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  fieldCard: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  fieldCardHighlight: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  fieldNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  fieldNumberText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: 'bold',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    ...typography.body2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  fieldLabelEn: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  fieldValueBox: {
    backgroundColor: '#F5F5F5',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.primary,
    minHeight: 60,
    justifyContent: 'center',
  },
  fieldValueBoxMultiline: {
    minHeight: 100,
  },
  fieldValue: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  fieldInstructionBox: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.small,
  },
  fieldInstructionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  fieldInstruction: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  tipsCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: '#FFF3E0',
  },
  tipsIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  tipsTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tipsText: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 28,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.error,
  },
  sampleCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  sampleIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sampleTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sampleImagePlaceholder: {
    height: 200,
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  sampleImageText: {
    ...typography.body1,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomTip: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  bottomTipIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  bottomTipText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
});

export default CopyWriteModeScreen;
