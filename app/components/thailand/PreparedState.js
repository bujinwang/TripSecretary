/**
 * PreparedState Component - Redesigned for Better UX
 *
 * Displays the prepared state view for Thailand Entry Flow Screen.
 * Shows completion summary, countdown, and action buttons with improved
 * visual hierarchy for submitted vs not submitted states.
 */

import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  YStack,
  XStack,
  Text,
  styled,
} from 'tamagui';
import CompletionSummaryCard from '../CompletionSummaryCard';
import SubmissionCountdown from '../SubmissionCountdown';
import Button from '../Button';
import { colors, spacing } from '../../theme';

// Styled Tamagui components
const PressableCard = styled(YStack, {
  pressStyle: { opacity: 0.8, scale: 0.98 },
  animation: 'quick',
  cursor: 'pointer',
});

const AnimatedCard = styled(YStack, {
  pressStyle: { scale: 0.97 },
  animation: 'quick',
});

/**
 * Success Celebration Component
 */
const SuccessCelebration = ({ onStartImmigration, onViewEntryPack, onEditInfo }) => (
  <YStack marginBottom="$lg">
    {/* Primary Success Actions */}
    <YStack gap="$md">
      {/* Start Immigration Process */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onStartImmigration}
      >
        <AnimatedCard
          borderRadius={24}
          overflow="hidden"
          shadowColor="#0C8A52"
          shadowOffset={{ width: 0, height: 10 }}
          shadowOpacity={0.3}
          shadowRadius={15}
          elevation={8}
        >
          <LinearGradient
            colors={['#0BD67B', colors.primary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.xl,
              paddingVertical: 20,
            }}
          >
            <YStack
              width={56}
              height={56}
              borderRadius={28}
              backgroundColor="rgba(255, 255, 255, 0.3)"
              alignItems="center"
              justifyContent="center"
              marginRight="$lg"
            >
              <Text fontSize={28}>🛂</Text>
            </YStack>
            <YStack flex={1}>
              <Text
                fontSize={18}
                fontWeight="800"
                color="$white"
                letterSpacing={0.3}
              >
                开始入境流程
              </Text>
              <Text
                fontSize={14}
                color="rgba(255, 255, 255, 0.9)"
                marginTop={2}
              >
                查看完整的入境指引和注意事项
              </Text>
            </YStack>
            <YStack
              width={36}
              height={36}
              borderRadius={18}
              backgroundColor="rgba(255, 255, 255, 0.3)"
              alignItems="center"
              justifyContent="center"
              marginLeft="$md"
            >
              <Text fontSize={20} fontWeight="800" color="$white">›</Text>
            </YStack>
          </LinearGradient>
        </AnimatedCard>
      </TouchableOpacity>

      {/* Secondary Actions Row */}
      <XStack gap="$md">
        {/* View Entry Pack */}
        <AnimatedCard
          flex={1}
          backgroundColor="$white"
          borderRadius={16}
          padding="$lg"
          borderWidth={1.5}
          borderColor="rgba(11, 214, 123, 0.3)"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 3 }}
          shadowOpacity={0.12}
          shadowRadius={8}
          elevation={3}
          onPress={onViewEntryPack}
        >
          <YStack alignItems="center">
            <YStack
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor="#E8F5E9"
              alignItems="center"
              justifyContent="center"
              marginBottom="$sm"
            >
              <Text fontSize={24}>📋</Text>
            </YStack>
            <Text
              fontSize={14}
              fontWeight="700"
              color="$text"
              textAlign="center"
              marginBottom="$xs"
            >
              查看我的入境包
            </Text>
            <Text fontSize={12} color="$textSecondary" textAlign="center">
              重新查看所有准备资料
            </Text>
          </YStack>
        </AnimatedCard>

        {/* Edit Info */}
        <AnimatedCard
          flex={1}
          backgroundColor="$white"
          borderRadius={16}
          padding="$lg"
          borderWidth={1.5}
          borderColor="rgba(255, 152, 0, 0.3)"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 3 }}
          shadowOpacity={0.12}
          shadowRadius={8}
          elevation={3}
          onPress={onEditInfo}
        >
          <YStack alignItems="center">
            <YStack
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor="#FFF3E0"
              alignItems="center"
              justifyContent="center"
              marginBottom="$sm"
            >
              <Text fontSize={24}>✏️</Text>
            </YStack>
            <Text
              fontSize={14}
              fontWeight="700"
              color="$text"
              textAlign="center"
              marginBottom="$xs"
            >
              编辑旅行信息
            </Text>
            <Text fontSize={12} color="$textSecondary" textAlign="center">
              如需修改，返回编辑
            </Text>
          </YStack>
        </AnimatedCard>
      </XStack>
    </YStack>
  </YStack>
);

/**
 * Progress Encouragement Component
 */
const ProgressEncouragement = ({
  completionPercent,
  primaryActionState,
  onContinuePreparation,
  onPreviewPack,
  onGetHelp,
  arrivalDate,
  t,
  buttonState,
  navigation,
  passportParam,
  destination,
  userData,
}) => {
  console.log('ProgressEncouragement rendered with buttonState:', buttonState);
  console.log('Navigation available:', !!navigation);
  console.log('UserData available:', !!userData);

  const getPrimaryGradient = () => {
    if (buttonState.disabled) {
      return ['#CFD8DC', '#B0BEC5'];
    }

    switch (buttonState.variant) {
      case 'secondary':
        return ['#64B5F6', '#1E88E5'];
      case 'success':
        return ['#66BB6A', '#2E7D32'];
      case 'primary':
      default:
        return ['#0BD67B', colors.primary];
    }
  };

  return (
    <YStack marginBottom="$lg">
      {/* Action Buttons */}
      <YStack gap="$md">
        {/* Primary Action - Edit Travel Info (Most Important for Incomplete State) */}
        <PressableCard
          borderRadius={20}
          overflow="hidden"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 6 }}
          shadowOpacity={0.15}
          shadowRadius={10}
          elevation={5}
          onPress={() => {
            console.log('Primary Edit Travel Info button pressed');
            console.log('Navigation available:', !!navigation);
            console.log('Passport param:', passportParam);
            console.log('Destination:', destination);

            if (!navigation) {
              console.error('Navigation is not available!');
              Alert.alert('错误', '导航功能不可用');
              return;
            }

            navigation.navigate('ThailandTravelInfo', {
              passport: passportParam,
              destination: destination,
            });
          }}
        >
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.xl,
              paddingVertical: 18,
              justifyContent: 'center',
            }}
          >
            <Text
              fontSize={18}
              fontWeight="800"
              color="$white"
              letterSpacing={0.3}
            >
              ✏️ 修改旅行信息
            </Text>
          </LinearGradient>
        </PressableCard>

        {/* Countdown Section - High Priority Alert */}
        {(arrivalDate || buttonState.action === 'wait_for_window') && (
          <AnimatedCard
            backgroundColor="#FFF3E0"
            borderRadius={16}
            padding="$lg"
            borderWidth={2}
            borderColor="#FF9800"
            shadowColor="#FF9800"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.2}
            shadowRadius={8}
            elevation={4}
          >
            <YStack alignItems="center">
              <Text
                fontSize={16}
                fontWeight="700"
                color="#E65100"
                marginBottom="$sm"
              >
                {(() => {
                  if (buttonState.action === 'wait_for_window') {
                    return '📅 距离提交窗口开启还有';
                  }
                  return '🛂 距离提交入境卡还有';
                })()}
              </Text>
              <SubmissionCountdown
                arrivalDate={arrivalDate}
                locale={t('locale', { defaultValue: 'zh' })}
                showIcon={false}
                updateInterval={1000} // Update every second for dynamic countdown
              />
              {buttonState.action === 'submit_now' && (
                <YStack
                  marginTop="$md"
                  paddingHorizontal="$md"
                  paddingVertical="$sm"
                  backgroundColor="#FFCCBC"
                  borderRadius={8}
                >
                  <Text
                    fontSize={13}
                    fontWeight="600"
                    color="#BF360C"
                    textAlign="center"
                  >
                    ⚠️ 进入最后冲刺！窗口即将关闭，请立即提交入境卡
                  </Text>
                </YStack>
              )}
              <Text
                fontSize={12}
                color="#EF6C00"
                marginTop="$sm"
                textAlign="center"
              >
                抵达日期 {arrivalDate ? new Date(arrivalDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '年').replace(/年(\d+)年/, '年$1月') + '日' : ''}
              </Text>
            </YStack>
          </AnimatedCard>
        )}

        {/* Secondary Action - Preview Entry Pack */}
        <PressableCard
          backgroundColor="$white"
          borderRadius={16}
          padding="$lg"
          borderWidth={2}
          borderColor="rgba(11, 214, 123, 0.4)"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 3 }}
          shadowOpacity={0.12}
          shadowRadius={8}
          elevation={3}
          onPress={() => {
            console.log('Preview Entry Pack button pressed');
            console.log('Navigation available:', !!navigation);
            console.log('UserData:', userData);

            if (!navigation) {
              console.error('Navigation is not available!');
              Alert.alert('错误', '导航功能不可用');
              return;
            }

            navigation.navigate('EntryPackPreview', {
              userData,
              passport: passportParam,
              destination: destination,
              entryPackData: {
                personalInfo: userData?.personalInfo,
                travelInfo: userData?.travel,
                funds: userData?.funds,
                tdacSubmission: null
              }
            });
          }}
        >
          <YStack alignItems="center">
            <Text fontSize={18} fontWeight="700" color="$text">
              👁️ 预览入境包
            </Text>
            <Text fontSize={13} color="$textSecondary" marginTop="$xs" textAlign="center">
              查看你已经准备好的入境信息
            </Text>
          </YStack>
        </PressableCard>

        {/* Tertiary Actions Row */}
        <XStack justifyContent="center">
          {/* Get Help */}
          <AnimatedCard
            width="50%"
            backgroundColor="$white"
            borderRadius={14}
            padding="$md"
            borderWidth={1}
            borderColor="$borderColor"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={4}
            elevation={2}
            onPress={() => {
              console.log('Get Help button pressed');
              // Show help dialog instead of navigation
              Alert.alert(
                '寻求帮助 🤝',
                '你可以：\n\n📸 截图分享给亲友检查\n💬 向客服咨询问题\n📖 查看帮助文档',
                [
                  {
                    text: '截图分享',
                    onPress: () => Alert.alert('提示', '请使用手机截图功能分享给亲友查看')
                  },
                  {
                    text: '联系客服',
                    onPress: () => Alert.alert('功能开发中', '客服功能即将上线，敬请期待！')
                  },
                  { text: '取消', style: 'cancel' }
                ]
              );
            }}
          >
            <YStack alignItems="center">
              <Text fontSize={24} marginBottom="$xs">👥</Text>
              <Text fontSize={12} fontWeight="600" color="$text" textAlign="center">
                寻求帮助
              </Text>
            </YStack>
          </AnimatedCard>
        </XStack>
      </YStack>
    </YStack>
  );
};

/**
 * Main PreparedState component with redesigned UX
 */
const PreparedState = ({
  completionPercent,
  completionStatus,
  arrivalDate,
  t,
  passportParam,
  destination,
  userData,
  handleEditInformation,
  handlePreviewEntryCard,
  navigation,
  primaryActionState,
  onPrimaryAction,
  entryPackStatus,
  showSupersededStatus,
}) => {
  const isSuperseded = showSupersededStatus || entryPackStatus === 'superseded';
  const buttonState = primaryActionState || {};

  const renderContent = () => {
    // Submitted Status - Success Celebration
    if (entryPackStatus === 'submitted' && !isSuperseded) {
      return (
        <SuccessCelebration
          onStartImmigration={() => navigation.navigate('ThailandEntryGuide', {
            passport: passportParam,
            destination: destination,
            completionData: userData,
            showSubmittedTips: true
          })}
          onViewEntryPack={handlePreviewEntryCard}
          onEditInfo={handleEditInformation}
        />
      );
    }

    // Not Submitted Status - Progress Encouragement
    return (
      <ProgressEncouragement
        completionPercent={completionPercent}
        primaryActionState={primaryActionState}
        onContinuePreparation={onPrimaryAction}
        onPreviewPack={handlePreviewEntryCard}
        onGetHelp={() => {
          Alert.alert(
            '寻求帮助 🤝',
            '你可以：\n\n📸 截图分享给亲友检查\n💬 向客服咨询问题\n📖 查看帮助文档',
            [
              {
                text: '截图分享',
                onPress: () => Alert.alert('提示', '请使用手机截图功能分享给亲友查看')
              },
              {
                text: '联系客服',
                onPress: () => Alert.alert('功能开发中', '客服功能即将上线，敬请期待！')
              },
              { text: '取消', style: 'cancel' }
            ]
          );
        }}
        arrivalDate={arrivalDate}
        t={t}
        buttonState={buttonState}
        navigation={navigation}
        passportParam={passportParam}
        destination={destination}
        userData={userData}
      />
    );
  };

  return (
    <YStack>
      {/* Only show completion card if not submitted */}
      {(entryPackStatus !== 'submitted' || isSuperseded) && (
        <YStack marginBottom="$lg">
          <CompletionSummaryCard
            completionPercent={completionPercent}
            status={completionStatus}
            showProgressBar={true}
          />
        </YStack>
      )}

      {/* Main Content */}
      {renderContent()}
    </YStack>
  );
};

export default PreparedState;
