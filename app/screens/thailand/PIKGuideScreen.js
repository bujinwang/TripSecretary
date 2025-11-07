// 入境通 - PIK Guide Screen (自助通关机操作指南)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/Card';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../../theme';
import UserDataService from '../../services/data/UserDataService';
import { useLocale } from '../../i18n/LocaleContext';

const PIKGuideScreen = ({ navigation, route }) => {
  const { t } = useLocale();
  const { passport: rawPassport, destination, travelInfo } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const [fontSize, setFontSize] = useState(16);

  const increaseFontSize = () => {
    if (fontSize < 24) {
setFontSize(fontSize + 2);
}
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
setFontSize(fontSize - 2);
}
  };

  // 根据用户填写的信息生成预设答案
  const getPrefilledAnswers = () => {
    const answers = [];
    const yesLabel = t('common.yes', { defaultValue: '是' });
    const noLabel = t('common.no', { defaultValue: '否' });

    // 携带现金超过1万加元？
    const hasHighCurrency = travelInfo?.hasHighCurrency === '是' || travelInfo?.hasHighCurrency === 'Yes';
    answers.push({
      question: t('canada.pikGuide.customsQuestions.currencyOverLimit', { defaultValue: '携带现金或等值货币超过 $10,000 加元？' }),
      questionEn: 'Are you bringing currency or monetary instruments totaling CAN$10,000 or more?',
      answer: hasHighCurrency ? 'YES ✅' : 'NO ❌',
      answerCn: hasHighCurrency ? `${yesLabel}（点YES）` : `${noLabel}（点NO）`,
      highlight: hasHighCurrency,
    });

    // 携带食品、植物、动物？
    const hasFoodAnimals = travelInfo?.visitedFarm === '是' || travelInfo?.visitedFarm === 'Yes' || 
                          travelInfo?.carryingFood === '是' || travelInfo?.carryingFood === 'Yes';
    answers.push({
      question: t('canada.pikGuide.customsQuestions.foodAnimals', { defaultValue: '携带食品、植物、动物或相关产品？' }),
      questionEn: 'Are you bringing food, plants, animals, or related products?',
      answer: hasFoodAnimals ? 'YES ✅' : 'NO ❌',
      answerCn: hasFoodAnimals ? `${yesLabel}（点YES）` : `${noLabel}（点NO）`,
      highlight: hasFoodAnimals,
    });

    // 访问过农场？
    const visitedFarm = travelInfo?.visitedFarm === '是' || travelInfo?.visitedFarm === 'Yes';
    answers.push({
      question: t('canada.pikGuide.customsQuestions.visitedFarm', { defaultValue: '近期访问过农场或接触过农场动物？' }),
      questionEn: 'Have you visited a farm or been in contact with farm animals?',
      answer: visitedFarm ? 'YES ✅' : 'NO ❌',
      answerCn: visitedFarm ? `${yesLabel}（点YES）` : `${noLabel}（点NO）`,
      highlight: visitedFarm,
    });

    // 携带商业物品？
    const hasCommercialGoods = travelInfo?.hasCommercialGoods === '是' || travelInfo?.hasCommercialGoods === 'Yes';
    answers.push({
      question: t('canada.pikGuide.customsQuestions.commercialGoods', { defaultValue: '携带商业物品、样品或用于转售的商品？' }),
      questionEn: 'Are you bringing commercial goods, samples, or goods for resale?',
      answer: hasCommercialGoods ? 'YES ✅' : 'NO ❌',
      answerCn: hasCommercialGoods ? `${yesLabel}（点YES）` : `${noLabel}（点NO）`,
      highlight: hasCommercialGoods,
    });

    // 携带枪支？
    const hasFirearms = travelInfo?.hasFirearms === '是' || travelInfo?.hasFirearms === 'Yes';
    answers.push({
      question: t('canada.pikGuide.customsQuestions.firearms', { defaultValue: '携带枪支或武器？' }),
      questionEn: 'Are you bringing firearms or weapons?',
      answer: hasFirearms ? 'YES ✅' : 'NO ❌',
      answerCn: hasFirearms ? `${yesLabel}（点YES）` : `${noLabel}（点NO）`,
      highlight: hasFirearms,
    });

    // 超过免税额度？
    const exceedsDutyFree = travelInfo?.exceedsDutyFree === '是' || travelInfo?.exceedsDutyFree === 'Yes';
    answers.push({
      question: t('canada.pikGuide.customsQuestions.dutyFree', { defaultValue: '携带的物品总价值超过免税额度？' }),
      questionEn: 'Are you bringing goods that exceed your duty-free allowance?',
      answer: exceedsDutyFree ? 'YES ✅' : 'NO ❌',
      answerCn: exceedsDutyFree ? `${yesLabel}（点YES）` : `${noLabel}（点NO）`,
      highlight: exceedsDutyFree,
    });

    return answers;
  };

  const prefilledAnswers = getPrefilledAnswers();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back', { defaultValue: '返回' })}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>{t('canada.pikGuide.headerTitle', { defaultValue: '自助通关指南' })}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.icon}>🤖</Text>
          <Text style={styles.title}>{t('canada.pikGuide.title', { defaultValue: '自助通关机操作指南' })}</Text>
          <Text style={styles.subtitle}>
            {t('canada.pikGuide.subtitle', { defaultValue: 'Primary Inspection Kiosk (PIK)' })}
          </Text>
          <Text style={styles.description}>
            {t('canada.pikGuide.description', { defaultValue: '加拿大边境的自助通关机很简单\n跟着这个指南一步步做就可以了' })}
          </Text>
        </View>

        {/* Font Size Controls */}
        <View style={styles.fontControls}>
          <Text style={styles.fontLabel}>{t('canada.pikGuide.fontSizeLabel', { defaultValue: '字体大小：' })}</Text>
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

        {/* Steps */}
        <View style={styles.steps}>
          {/* Step 1 */}
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>{t('canada.pikGuide.step', { number: 1, defaultValue: '第 1 步' })}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>🚶</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                {t('canada.pikGuide.step1.title', { defaultValue: '找到自助机器' })}
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                {t('canada.pikGuide.step1.description', { defaultValue: '下飞机后，跟着 "Arrivals" 或 "入境" 的指示牌走\n\n进入入境大厅，找这种带大屏幕的机器\n\n通常有很多台排成一排，跟 ATM 取款机差不多大小' })}
              </Text>
            </View>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                📷 PIK 机器照片
                {'\n'}(黑色立式机器，有触摸屏)
              </Text>
            </View>
          </Card>

          {/* Step 2 */}
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>{t('canada.pikGuide.step', { number: 2, defaultValue: '第 2 步' })}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>🌐</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                {t('canada.pikGuide.step2.title', { defaultValue: '选择中文' })}
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                {t('canada.pikGuide.step2.description', { defaultValue: '屏幕上会显示语言选择\n\n用手指点击 "中文" 或 "Chinese"\n\n⚠️ 如果找不到中文，选择 "English" 也没关系\n后面的步骤都有图片提示' })}
              </Text>
            </View>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                📷 语言选择界面
                {'\n'}(显示多种语言选项)
              </Text>
            </View>
          </Card>

          {/* Step 3 */}
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>{t('canada.pikGuide.step', { number: 3, defaultValue: '第 3 步' })}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>📖</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                {t('canada.pikGuide.step3.title', { defaultValue: '扫描护照' })}
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                {t('canada.pikGuide.step3.description', { defaultValue: '把护照翻到有照片的那一页（照片页）\n\n护照平放，照片朝下\n\n放到机器下方的扫描口（像复印机一样）\n\n听到 "哔" 一声，或者屏幕显示 "✓"，就扫描成功了' })}
              </Text>
            </View>
            <View style={[styles.tipBox, styles.tipSuccess]}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={[styles.tipText, { fontSize }]}>
                {t('canada.pikGuide.step3Tip', { defaultValue: '小贴士：护照要放平整，不要弯曲\n如果扫描失败，重新放一次就好' })}
              </Text>
            </View>
          </Card>

          {/* Step 4 - Most Important */}
          <Card style={[styles.stepCard, styles.importantStep]}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>{t('canada.pikGuide.stepImportant', { number: 4, defaultValue: '第 4 步 ⭐' })}</Text>
              <Text style={styles.importantBadge}>{t('canada.pikGuide.importantBadge', { defaultValue: '重要' })}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>❓</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                {t('canada.pikGuide.step4.title', { defaultValue: '回答问题' })}
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                {t('canada.pikGuide.step4.description', { defaultValue: '屏幕会显示几个问题\n\n每个问题下面有 "是/YES" 和 "否/NO" 两个按钮\n\n根据下面的答案，用手指点击对应的按钮：' })}
              </Text>

              {/* Prefilled Answers */}
              <View style={styles.answersSection}>
                <Text style={[styles.answersTitle, { fontSize: fontSize + 2 }]}>
                  {t('canada.pikGuide.answersTitle', { defaultValue: '📋 您的答案（照着点就行）' })}
                </Text>

                {prefilledAnswers.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.answerItem,
                      item.highlight && styles.answerItemHighlight,
                    ]}
                  >
                    <View style={styles.answerNumber}>
                      <Text style={styles.answerNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.answerContent}>
                      <Text style={[styles.answerQuestion, { fontSize }]}>
                        {item.question}
                      </Text>
                      <Text style={styles.answerQuestionEn}>
                        {item.questionEn}
                      </Text>
                      <View style={styles.answerBox}>
                        <Text style={styles.answerLabel}>{t('canada.pikGuide.answerLabel', { defaultValue: '点击：' })}</Text>
                        <Text style={[styles.answerValue, { fontSize: fontSize + 2 }]}>
                          {item.answerCn}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.tipBox, styles.tipWarning]}>
              <Text style={styles.tipIcon}>⚠️</Text>
              <Text style={[styles.tipText, { fontSize }]}>
                {t('canada.pikGuide.step4Warning', { defaultValue: '重要：一定要如实回答！\n如果回答 "是"，可能需要额外检查，但不会有麻烦' })}
              </Text>
            </View>
          </Card>

          {/* Step 5 */}
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>{t('canada.pikGuide.step', { number: 5, defaultValue: '第 5 步' })}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>🧾</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                {t('canada.pikGuide.step5.title', { defaultValue: '取收据' })}
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                {t('canada.pikGuide.step5.description', { defaultValue: '所有问题回答完后，机器会打印一张小纸条\n\n收据会从机器下方或侧面出来\n\n⚠️ 一定要拿好这张收据！\n\n等会要交给海关官员' })}
              </Text>
            </View>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>
                📷 收据样式
                {'\n'}(A4 纸大小，上面有您的信息)
              </Text>
            </View>
          </Card>

          {/* Step 6 */}
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>{t('canada.pikGuide.step', { number: 6, defaultValue: '第 6 步' })}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>👮</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                {t('canada.pikGuide.step6.title', { defaultValue: '去人工柜台' })}
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                {t('canada.pikGuide.step6.description', { defaultValue: '拿着护照和刚才打印的收据\n\n跟着人群排队，走到人工柜台\n\n把收据和护照一起交给海关官员\n\n官员可能会问几个简单问题：\n• 来加拿大做什么？（旅游）\n• 住在哪里？（酒店名字）\n• 停留多久？（几天）\n\n✅ 完成！欢迎来到加拿大' })}
              </Text>
            </View>
          </Card>
        </View>

        {/* Help Section */}
        <Card style={styles.helpCard}>
          <Text style={styles.helpIcon}>🆘</Text>
          <Text style={[styles.helpTitle, { fontSize: fontSize + 2 }]}>
            {t('canada.pikGuide.helpTitle', { defaultValue: '如果不会操作怎么办？' })}
          </Text>

          <View style={styles.helpOptions}>
            <View style={styles.helpOption}>
              <Text style={styles.helpOptionNumber}>1</Text>
              <View style={styles.helpOptionContent}>
                <Text style={[styles.helpOptionTitle, { fontSize }]}>
                  {t('canada.pikGuide.helpOption1.title', { defaultValue: '找工作人员帮忙' })}
                </Text>
                <Text style={[styles.helpOptionDesc, { fontSize: fontSize - 2 }]}>
                  {t('canada.pikGuide.helpOption1.description', { defaultValue: '机器旁边通常有穿制服的工作人员\n对他们说："I need help"\n他们会帮您操作' })}
                </Text>
              </View>
            </View>

            <View style={styles.helpOption}>
              <Text style={styles.helpOptionNumber}>2</Text>
              <View style={styles.helpOptionContent}>
                <Text style={[styles.helpOptionTitle, { fontSize }]}>
                  {t('canada.pikGuide.helpOption2.title', { defaultValue: '找中国旅客帮忙' })}
                </Text>
                <Text style={[styles.helpOptionDesc, { fontSize: fontSize - 2 }]}>
                  {t('canada.pikGuide.helpOption2.description', { defaultValue: '周围如果有中国旅客，可以请他们帮忙\n大家都很乐意帮助同胞' })}
                </Text>
              </View>
            </View>

            <View style={styles.helpOption}>
              <Text style={styles.helpOptionNumber}>3</Text>
              <View style={styles.helpOptionContent}>
                <Text style={[styles.helpOptionTitle, { fontSize }]}>
                  {t('canada.pikGuide.helpOption3.title', { defaultValue: '去人工柜台' })}
                </Text>
                <Text style={[styles.helpOptionDesc, { fontSize: fontSize - 2 }]}>
                  {t('canada.pikGuide.helpOption3.description', { defaultValue: '实在不会用机器，直接找人工柜台排队\n虽然慢一点，但一样可以入境\n把护照和手机上的表格给官员看就行' })}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Reassurance Card */}
        <Card style={styles.reassuranceCard}>
          <Text style={styles.reassuranceIcon}>✅</Text>
          <Text style={[styles.reassuranceTitle, { fontSize: fontSize + 2 }]}>
            {t('canada.pikGuide.reassuranceTitle', { defaultValue: '放心！不用紧张' })}
          </Text>
          <Text style={[styles.reassuranceText, { fontSize }]}>
            {t('canada.pikGuide.reassuranceText', { defaultValue: '• 加拿大边境官员都很友好，不会为难您\n\n• 很多机场有中文服务或中文翻译\n\n• 即使不会用机器，也可以走人工通道\n\n• 每年有几百万中国游客入境加拿大，都很顺利\n\n最重要的是：诚实回答问题，不要携带违禁品' })}
          </Text>
        </Card>

        {/* Common Phrases */}
        <Card style={styles.phrasesCard}>
          <Text style={styles.phrasesIcon}>🗣️</Text>
          <Text style={[styles.phrasesTitle, { fontSize: fontSize + 2 }]}>
            {t('canada.pikGuide.phrasesTitle', { defaultValue: '常用英文短语（给工作人员看）' })}
          </Text>

          <View style={styles.phrases}>
            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                {t('canada.pikGuide.phrases.helpKiosk.en', { defaultValue: 'I need help with the kiosk.' })}
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                {t('canada.pikGuide.phrases.helpKiosk.zh', { defaultValue: '我需要帮助使用自助机。' })}
              </Text>
            </View>

            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                {t('canada.pikGuide.phrases.canYouHelp.en', { defaultValue: 'Can you help me?' })}
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                {t('canada.pikGuide.phrases.canYouHelp.zh', { defaultValue: '你能帮我吗？' })}
              </Text>
            </View>

            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                {t('canada.pikGuide.phrases.whereManualCounter.en', { defaultValue: 'Where is the manual counter?' })}
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                {t('canada.pikGuide.phrases.whereManualCounter.zh', { defaultValue: '人工柜台在哪里？' })}
              </Text>
            </View>

            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                {t('canada.pikGuide.phrases.noEnglish.en', { defaultValue: 'I don\'t speak English.' })}
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                {t('canada.pikGuide.phrases.noEnglish.zh', { defaultValue: '我不会说英语。' })}
              </Text>
            </View>

            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                {t('canada.pikGuide.phrases.chineseInterpreter.en', { defaultValue: 'Do you have Chinese interpreter?' })}
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                {t('canada.pikGuide.phrases.chineseInterpreter.zh', { defaultValue: '有中文翻译吗？' })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={t('canada.pikGuide.buttonViewInfo', { defaultValue: '📋 查看我的信息' })}
            onPress={() => navigation.navigate('Result', { passport, destination, travelInfo })}
            variant="primary"
          />

          <Button
            title={t('canada.pikGuide.buttonCopyMode', { defaultValue: '✍️ 抄写模式' })}
            onPress={() => navigation.navigate('CopyWrite', { passport, destination, travelInfo })}
            variant="secondary"
            style={styles.actionButton}
          />
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
  steps: {
    paddingHorizontal: spacing.md,
  },
  stepCard: {
    marginBottom: spacing.lg,
  },
  importantStep: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  importantBadge: {
    ...typography.caption,
    color: colors.white,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  stepContent: {
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepDesc: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 28,
    textAlign: 'left',
    width: '100%',
  },
  bold: {
    fontWeight: 'bold',
    color: colors.text,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    ...typography.body1,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  tipBox: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    marginTop: spacing.md,
  },
  tipSuccess: {
    backgroundColor: '#E8F5E9',
  },
  tipWarning: {
    backgroundColor: '#FFF3E0',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  tipText: {
    ...typography.body1,
    flex: 1,
    lineHeight: 24,
  },
  answersSection: {
    width: '100%',
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
  },
  answersTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  answerItem: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerItemHighlight: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  answerNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  answerNumberText: {
    ...typography.body2,
    color: colors.white,
    fontWeight: 'bold',
  },
  answerContent: {
    flex: 1,
  },
  answerQuestion: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  answerQuestionEn: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  answerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: borderRadius.small,
  },
  answerLabel: {
    ...typography.body1,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  answerValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  helpCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  helpTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  helpOptions: {
    width: '100%',
  },
  helpOption: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  helpOptionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: spacing.md,
  },
  helpOptionContent: {
    flex: 1,
  },
  helpOptionTitle: {
    ...typography.body2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  helpOptionDesc: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  reassuranceCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
  },
  reassuranceIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  reassuranceTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  reassuranceText: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 28,
    textAlign: 'left',
    width: '100%',
  },
  phrasesCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  phrasesIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  phrasesTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  phrases: {
    width: '100%',
  },
  phrase: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.sm,
  },
  phraseEn: {
    ...typography.body2,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  phraseCn: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  actions: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
});

export default PIKGuideScreen;
