// 入境通 - PIK Guide Screen (自助通关机操作指南)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';
import { colors, typography, spacing, borderRadius } from '../../theme';
import UserDataService from '../../services/data/UserDataService';

const PIKGuideScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination, travelInfo } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const [fontSize, setFontSize] = useState(16);

  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  // 根据用户填写的信息生成预设答案
  const getPrefilledAnswers = () => {
    const answers = [];

    // 携带现金超过1万加元？
    answers.push({
      question: '携带现金或等值货币超过 $10,000 加元？',
      questionEn: 'Are you bringing currency or monetary instruments totaling CAN$10,000 or more?',
      answer: travelInfo?.hasHighCurrency === '是' ? 'YES ✅' : 'NO ❌',
      answerCn: travelInfo?.hasHighCurrency === '是' ? '是（点YES）' : '否（点NO）',
      highlight: travelInfo?.hasHighCurrency === '是',
    });

    // 携带食品、植物、动物？
    answers.push({
      question: '携带食品、植物、动物或相关产品？',
      questionEn: 'Are you bringing food, plants, animals, or related products?',
      answer: travelInfo?.visitedFarm === '是' || travelInfo?.carryingFood === '是' ? 'YES ✅' : 'NO ❌',
      answerCn: travelInfo?.visitedFarm === '是' || travelInfo?.carryingFood === '是' ? '是（点YES）' : '否（点NO）',
      highlight: travelInfo?.visitedFarm === '是' || travelInfo?.carryingFood === '是',
    });

    // 访问过农场？
    answers.push({
      question: '近期访问过农场或接触过农场动物？',
      questionEn: 'Have you visited a farm or been in contact with farm animals?',
      answer: travelInfo?.visitedFarm === '是' ? 'YES ✅' : 'NO ❌',
      answerCn: travelInfo?.visitedFarm === '是' ? '是（点YES）' : '否（点NO）',
      highlight: travelInfo?.visitedFarm === '是',
    });

    // 携带商业物品？
    answers.push({
      question: '携带商业物品、样品或用于转售的商品？',
      questionEn: 'Are you bringing commercial goods, samples, or goods for resale?',
      answer: travelInfo?.hasCommercialGoods === '是' ? 'YES ✅' : 'NO ❌',
      answerCn: travelInfo?.hasCommercialGoods === '是' ? '是（点YES）' : '否（点NO）',
      highlight: travelInfo?.hasCommercialGoods === '是',
    });

    // 携带枪支？
    answers.push({
      question: '携带枪支或武器？',
      questionEn: 'Are you bringing firearms or weapons?',
      answer: travelInfo?.hasFirearms === '是' ? 'YES ✅' : 'NO ❌',
      answerCn: travelInfo?.hasFirearms === '是' ? '是（点YES）' : '否（点NO）',
      highlight: travelInfo?.hasFirearms === '是',
    });

    // 超过免税额度？
    answers.push({
      question: '携带的物品总价值超过免税额度？',
      questionEn: 'Are you bringing goods that exceed your duty-free allowance?',
      answer: travelInfo?.exceedsDutyFree === '是' ? 'YES ✅' : 'NO ❌',
      answerCn: travelInfo?.exceedsDutyFree === '是' ? '是（点YES）' : '否（点NO）',
      highlight: travelInfo?.exceedsDutyFree === '是',
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
          label="返回"
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>自助通关指南</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.icon}>🤖</Text>
          <Text style={styles.title}>自助通关机操作指南</Text>
          <Text style={styles.subtitle}>
            Primary Inspection Kiosk (PIK)
          </Text>
          <Text style={styles.description}>
            加拿大边境的自助通关机很简单
            跟着这个指南一步步做就可以了
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

        {/* Steps */}
        <View style={styles.steps}>
          {/* Step 1 */}
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>第 1 步</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>🚶</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                找到自助机器
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                下飞机后，跟着 "Arrivals" 或 "入境" 的指示牌走
                {'\n\n'}
                进入入境大厅，找这种带大屏幕的机器
                {'\n\n'}
                通常有很多台排成一排，跟 ATM 取款机差不多大小
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
              <Text style={styles.stepNumber}>第 2 步</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>🌐</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                选择中文
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                屏幕上会显示语言选择
                {'\n\n'}
                用手指点击 "中文" 或 "Chinese"
                {'\n\n'}
                ⚠️ 如果找不到中文，选择 "English" 也没关系
                后面的步骤都有图片提示
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
              <Text style={styles.stepNumber}>第 3 步</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>📖</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                扫描护照
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                把护照翻到有照片的那一页（照片页）
                {'\n\n'}
                护照平放，照片朝下
                {'\n\n'}
                放到机器下方的扫描口（像复印机一样）
                {'\n\n'}
                听到 "哔" 一声，或者屏幕显示 "✓"，就扫描成功了
              </Text>
            </View>
            <View style={[styles.tipBox, styles.tipSuccess]}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={[styles.tipText, { fontSize }]}>
                小贴士：护照要放平整，不要弯曲
                如果扫描失败，重新放一次就好
              </Text>
            </View>
          </Card>

          {/* Step 4 - Most Important */}
          <Card style={[styles.stepCard, styles.importantStep]}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>第 4 步 ⭐</Text>
              <Text style={styles.importantBadge}>重要</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>❓</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                回答问题
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                屏幕会显示几个问题
                {'\n\n'}
                每个问题下面有 "是/YES" 和 "否/NO" 两个按钮
                {'\n\n'}
                <Text style={styles.bold}>
                  根据下面的答案，用手指点击对应的按钮：
                </Text>
              </Text>

              {/* Prefilled Answers */}
              <View style={styles.answersSection}>
                <Text style={[styles.answersTitle, { fontSize: fontSize + 2 }]}>
                  📋 您的答案（照着点就行）
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
                        <Text style={styles.answerLabel}>点击：</Text>
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
                重要：一定要如实回答！
                如果回答 "是"，可能需要额外检查，但不会有麻烦
              </Text>
            </View>
          </Card>

          {/* Step 5 */}
          <Card style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>第 5 步</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>🧾</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                取收据
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                所有问题回答完后，机器会打印一张小纸条
                {'\n\n'}
                收据会从机器下方或侧面出来
                {'\n\n'}
                <Text style={styles.bold}>
                  ⚠️ 一定要拿好这张收据！
                </Text>
                {'\n\n'}
                等会要交给海关官员
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
              <Text style={styles.stepNumber}>第 6 步</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepIcon}>👮</Text>
              <Text style={[styles.stepTitle, { fontSize: fontSize + 2 }]}>
                去人工柜台
              </Text>
              <Text style={[styles.stepDesc, { fontSize }]}>
                拿着护照和刚才打印的收据
                {'\n\n'}
                跟着人群排队，走到人工柜台
                {'\n\n'}
                把收据和护照一起交给海关官员
                {'\n\n'}
                官员可能会问几个简单问题：
                • 来加拿大做什么？（旅游）
                • 住在哪里？（酒店名字）
                • 停留多久？（几天）
                {'\n\n'}
                <Text style={styles.bold}>✅ 完成！欢迎来到加拿大</Text>
              </Text>
            </View>
          </Card>
        </View>

        {/* Help Section */}
        <Card style={styles.helpCard}>
          <Text style={styles.helpIcon}>🆘</Text>
          <Text style={[styles.helpTitle, { fontSize: fontSize + 2 }]}>
            如果不会操作怎么办？
          </Text>

          <View style={styles.helpOptions}>
            <View style={styles.helpOption}>
              <Text style={styles.helpOptionNumber}>1</Text>
              <View style={styles.helpOptionContent}>
                <Text style={[styles.helpOptionTitle, { fontSize }]}>
                  找工作人员帮忙
                </Text>
                <Text style={[styles.helpOptionDesc, { fontSize: fontSize - 2 }]}>
                  机器旁边通常有穿制服的工作人员
                  {'\n'}
                  对他们说：<Text style={styles.bold}>"I need help"</Text>
                  {'\n'}
                  他们会帮您操作
                </Text>
              </View>
            </View>

            <View style={styles.helpOption}>
              <Text style={styles.helpOptionNumber}>2</Text>
              <View style={styles.helpOptionContent}>
                <Text style={[styles.helpOptionTitle, { fontSize }]}>
                  找中国旅客帮忙
                </Text>
                <Text style={[styles.helpOptionDesc, { fontSize: fontSize - 2 }]}>
                  周围如果有中国旅客，可以请他们帮忙
                  大家都很乐意帮助同胞
                </Text>
              </View>
            </View>

            <View style={styles.helpOption}>
              <Text style={styles.helpOptionNumber}>3</Text>
              <View style={styles.helpOptionContent}>
                <Text style={[styles.helpOptionTitle, { fontSize }]}>
                  去人工柜台
                </Text>
                <Text style={[styles.helpOptionDesc, { fontSize: fontSize - 2 }]}>
                  实在不会用机器，直接找人工柜台排队
                  {'\n'}
                  虽然慢一点，但一样可以入境
                  {'\n'}
                  把护照和手机上的表格给官员看就行
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Reassurance Card */}
        <Card style={styles.reassuranceCard}>
          <Text style={styles.reassuranceIcon}>✅</Text>
          <Text style={[styles.reassuranceTitle, { fontSize: fontSize + 2 }]}>
            放心！不用紧张
          </Text>
          <Text style={[styles.reassuranceText, { fontSize }]}>
            • 加拿大边境官员都很友好，不会为难您
            {'\n\n'}
            • 很多机场有中文服务或中文翻译
            {'\n\n'}
            • 即使不会用机器，也可以走人工通道
            {'\n\n'}
            • 每年有几百万中国游客入境加拿大，都很顺利
            {'\n\n'}
            <Text style={styles.bold}>
              最重要的是：诚实回答问题，不要携带违禁品
            </Text>
          </Text>
        </Card>

        {/* Common Phrases */}
        <Card style={styles.phrasesCard}>
          <Text style={styles.phrasesIcon}>🗣️</Text>
          <Text style={[styles.phrasesTitle, { fontSize: fontSize + 2 }]}>
            常用英文短语（给工作人员看）
          </Text>

          <View style={styles.phrases}>
            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                I need help with the kiosk.
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                我需要帮助使用自助机。
              </Text>
            </View>

            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                Can you help me?
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                你能帮我吗？
              </Text>
            </View>

            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                Where is the manual counter?
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                人工柜台在哪里？
              </Text>
            </View>

            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                I don't speak English.
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                我不会说英语。
              </Text>
            </View>

            <View style={styles.phrase}>
              <Text style={[styles.phraseEn, { fontSize }]}>
                Do you have Chinese interpreter?
              </Text>
              <Text style={[styles.phraseCn, { fontSize: fontSize - 2 }]}>
                有中文翻译吗？
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="📋 查看我的信息"
            onPress={() => navigation.navigate('Result', { passport, destination, travelInfo })}
            variant="primary"
          />

          <Button
            title="✍️ 抄写模式"
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
