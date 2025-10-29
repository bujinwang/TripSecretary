/**
 * PreparedState Component
 *
 * Displays the prepared state view for Thailand Entry Flow Screen.
 * Shows completion summary, countdown, and action buttons.
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
  pressStyle: { opacity: 0.7, scale: 0.98 },
  animation: 'quick',
  cursor: 'pointer',
});

/**
 * PreparedState component displays entry preparation status and action buttons
 *
 * @param {Object} props - Component props
 * @param {number} props.completionPercent - Overall completion percentage (0-100)
 * @param {string} props.completionStatus - Status: 'ready', 'mostly_complete', 'needs_improvement'
 * @param {string} props.arrivalDate - Arrival date in ISO format
 * @param {Function} props.t - Translation function
 * @param {Object} props.passportParam - Passport parameters for navigation
 * @param {Object} props.destination - Destination parameters
 * @param {Object} props.userData - User data for preview
 * @param {Function} props.handleEditInformation - Handler for edit information action
 * @param {Function} props.handlePreviewEntryCard - Handler for preview entry card action
 * @param {Function} props.navigation - Navigation object
 * @param {Object} props.primaryActionState - Object describing primary action button state
 * @param {Function} props.onPrimaryAction - Handler for primary action press
 * @param {string} props.entryPackStatus - Status of entry pack: 'submitted', 'in_progress', null
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
}) => {
  const renderPrimaryAction = () => {
    if (!primaryActionState) {
      return null;
    }

    if (entryPackStatus === 'submitted') {
      const gradientColors = primaryActionState.disabled
        ? ['#A5D6A7', '#81C784']
        : ['#0BD67B', colors.primary];

      return (
        <YStack>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPrimaryAction}
            disabled={primaryActionState.disabled}
            style={{ opacity: primaryActionState.disabled ? 0.6 : 1 }}
          >
            <YStack
              borderRadius={28}
              overflow="hidden"
              shadowColor="#0C8A52"
              shadowOffset={{ width: 0, height: 8 }}
              shadowOpacity={0.25}
              shadowRadius={12}
              elevation={6}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  paddingVertical: 16,
                  paddingHorizontal: spacing.lg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  fontSize={18}
                  fontWeight="700"
                  color="$white"
                  letterSpacing={0.3}
                >
                  {primaryActionState.title}
                </Text>
              </LinearGradient>
            </YStack>
          </TouchableOpacity>
          {primaryActionState.subtitle && (
            <Text
              fontSize={13}
              color="$textSecondary"
              textAlign="center"
              marginTop="$sm"
            >
              {primaryActionState.subtitle}
            </Text>
          )}
        </YStack>
      );
    }

    return (
      <YStack>
        <Button
          title={primaryActionState.title}
          onPress={onPrimaryAction}
          variant={primaryActionState.variant}
          disabled={primaryActionState.disabled}
          style={{ marginBottom: spacing.xs }}
        />
        {primaryActionState.subtitle && (
          <Text
            fontSize={13}
            color="$textSecondary"
            textAlign="center"
            marginTop="$xs"
          >
            {primaryActionState.subtitle}
          </Text>
        )}
      </YStack>
    );
  };

  return (
    <YStack>
      {/* Status Cards Section */}
      <YStack marginBottom="$xl">
        {/* Only show completion card if not submitted */}
        {entryPackStatus !== 'submitted' && (
          <CompletionSummaryCard
            completionPercent={completionPercent}
            status={completionStatus}
            showProgressBar={true}
          />
        )}

        {/* Pre-Submission Actions: Only show BEFORE submission */}
        {entryPackStatus !== 'submitted' && completionPercent >= 80 && (
          <YStack
            marginTop="$lg"
            paddingTop="$md"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            gap="$sm"
          >
            <PressableCard
              flexDirection="row"
              alignItems="center"
              backgroundColor="$background"
              borderRadius={14}
              paddingVertical="$md"
              paddingHorizontal="$md"
              borderWidth={1}
              borderColor="$borderColor"
              shadowColor="$shadow"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.1}
              shadowRadius={2}
              elevation={1}
              onPress={handleEditInformation}
            >
              <YStack
                width={48}
                height={48}
                borderRadius={24}
                backgroundColor="$primaryLight"
                alignItems="center"
                justifyContent="center"
                marginRight="$md"
              >
                <Text fontSize={24}>✏️</Text>
              </YStack>
              <YStack flex={1}>
                <Text
                  fontSize={16}
                  fontWeight="700"
                  color="$text"
                  marginBottom={2}
                >
                  再改改
                </Text>
                <Text fontSize={13} color="$textSecondary">
                  调整和完善信息
                </Text>
              </YStack>
              <Text fontSize={22} fontWeight="600" color="$primary" marginLeft="$xs">
                ›
              </Text>
            </PressableCard>

            <PressableCard
              flexDirection="row"
              alignItems="center"
              backgroundColor="$background"
              borderRadius={14}
              paddingVertical="$md"
              paddingHorizontal="$md"
              borderWidth={1}
              borderColor="$borderColor"
              shadowColor="$shadow"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.1}
              shadowRadius={2}
              elevation={1}
              onPress={() => {
                // Show sharing options
                Alert.alert(
                  '寻求帮助',
                  '您可以截图分享给亲友，让他们帮您检查信息是否正确。',
                  [
                    {
                      text: '截图分享',
                      onPress: () => {
                        // Here you could implement screenshot functionality
                        Alert.alert('提示', '请使用手机截图功能分享给亲友查看');
                      }
                    },
                    { text: '取消', style: 'cancel' }
                  ]
                );
              }}
            >
              <YStack
                width={48}
                height={48}
                borderRadius={24}
                backgroundColor="$primaryLight"
                alignItems="center"
                justifyContent="center"
                marginRight="$md"
              >
                <Text fontSize={24}>👥</Text>
              </YStack>
              <YStack flex={1}>
                <Text fontSize={16} fontWeight="700" color="$text" marginBottom={2}>
                  找亲友帮忙修改
                </Text>
                <Text fontSize={13} color="$textSecondary">
                  分享给亲友帮忙修改
                </Text>
              </YStack>
              <Text fontSize={22} fontWeight="600" color="$primary" marginLeft="$xs">
                ›
              </Text>
            </PressableCard>
          </YStack>
        )}

        {/* Post-Submission Actions: Show AFTER submission */}
        {entryPackStatus === 'submitted' && (
          <YStack
            marginTop="$lg"
            paddingTop="$md"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            gap="$sm"
          >
            {/* Edit Travel Info - New addition for post-submission */}
            <PressableCard
              flexDirection="row"
              alignItems="center"
              backgroundColor="$background"
              borderRadius={14}
              paddingVertical="$md"
              paddingHorizontal="$md"
              borderWidth={1}
              borderColor="$borderColor"
              shadowColor="$shadow"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.1}
              shadowRadius={2}
              elevation={1}
              onPress={handleEditInformation}
            >
              <YStack
                width={48}
                height={48}
                borderRadius={24}
                backgroundColor="#FFE7C2"
                alignItems="center"
                justifyContent="center"
                marginRight="$md"
              >
                <Text fontSize={24}>✏️</Text>
              </YStack>
              <YStack flex={1}>
                <Text fontSize={16} fontWeight="700" color="$text" marginBottom={2}>
                  编辑旅行信息
                </Text>
                <Text fontSize={13} color="$textSecondary">
                  如需修改，返回编辑并重新提交
                </Text>
              </YStack>
              <Text fontSize={22} fontWeight="600" color="#FF9800" marginLeft="$xs">
                ›
              </Text>
            </PressableCard>

            <PressableCard
              flexDirection="row"
              alignItems="center"
              backgroundColor="#F0FFF6"
              borderRadius={14}
              paddingVertical="$md"
              paddingHorizontal="$md"
              borderWidth={1}
              borderColor="rgba(11, 214, 123, 0.25)"
              shadowColor="$shadow"
              shadowOffset={{ width: 0, height: 1 }}
              shadowOpacity={0.1}
              shadowRadius={2}
              elevation={1}
              onPress={handlePreviewEntryCard}
            >
              <YStack
                width={48}
                height={48}
                borderRadius={24}
                backgroundColor="#D2F7E5"
                alignItems="center"
                justifyContent="center"
                marginRight="$md"
              >
                <Text fontSize={24}>👁️</Text>
              </YStack>
              <YStack flex={1}>
                <Text fontSize={16} fontWeight="700" color="$text" marginBottom={2}>
                  查看我的入境包
                </Text>
                <Text fontSize={13} color="$textSecondary">
                  重新查看您的所有入境信息
                </Text>
              </YStack>
              <Text fontSize={22} fontWeight="600" color="$primary" marginLeft="$xs">
                ›
              </Text>
            </PressableCard>
          </YStack>
        )}
      </YStack>

      {/* Integrated Countdown & Submission Section */}
      {entryPackStatus === 'submitted' ? (
        // Success State - TDAC has been submitted
        <YStack
          marginBottom="$xl"
          backgroundColor="$background"
          borderRadius={16}
          padding="$lg"
          shadowColor="$shadow"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.1}
          shadowRadius={4}
          elevation={3}
        >
          {/* Entry Guide Button - Prominent position after submission */}
          <YStack marginBottom="$lg">
            <PressableCard
              borderRadius={16}
              overflow="hidden"
              shadowColor="$shadow"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.2}
              shadowRadius={8}
              elevation={4}
              onPress={() => navigation.navigate('ThailandEntryGuide', {
                passport: passportParam,
                destination: destination,
                completionData: userData,
                showSubmittedTips: true
              })}
            >
              <LinearGradient
                colors={['#0BD67B', colors.primary]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.lg,
                  paddingVertical: 20,
                }}
              >
                <YStack
                  width={52}
                  height={52}
                  borderRadius={26}
                  backgroundColor="rgba(255, 255, 255, 0.28)"
                  alignItems="center"
                  justifyContent="center"
                  marginRight="$md"
                >
                  <Text fontSize={26}>🛂</Text>
                </YStack>
                <YStack flex={1}>
                <Text
                  fontSize={17}
                  fontWeight="700"
                  color="$white"
                  letterSpacing={0.2}
                >
                  开始入境流程
                </Text>
                <Text
                  fontSize={13}
                  color="rgba(255, 255, 255, 0.90)"
                  marginTop={4}
                >
                  如何在机场使用入境卡
                </Text>
                </YStack>
                <YStack
                  width={32}
                  height={32}
                  borderRadius={16}
                  backgroundColor="rgba(255, 255, 255, 0.26)"
                  alignItems="center"
                  justifyContent="center"
                  marginLeft="$sm"
                >
                  <Text fontSize={20} fontWeight="700" color="$white">
                    ›
                  </Text>
                </YStack>
              </LinearGradient>
            </PressableCard>
          </YStack>

          <YStack
            backgroundColor="#E8F5E9"
            borderRadius={12}
            padding="$lg"
            alignItems="center"
          >
            <Text fontSize={48} marginBottom="$sm">🎉</Text>
            <Text
              fontSize={18}
              fontWeight="700"
              color="#2E7D32"
              textAlign="center"
              marginBottom="$xs"
            >
              太棒了！泰国之旅准备就绪！🌴
            </Text>
            <Text fontSize={14} color="#558B2F" textAlign="center">
              入境卡已成功提交，可以查看您的入境信息
            </Text>
          </YStack>

          {/* Smart Primary Action Button */}
          <YStack
            marginTop="$md"
            paddingTop="$md"
            borderTopWidth={1}
            borderTopColor="$borderColor"
          >
            {renderPrimaryAction()}
          </YStack>
        </YStack>
      ) : (
        // Default State - Show countdown
        <YStack
          marginBottom="$xl"
          backgroundColor="$background"
          borderRadius={16}
          padding="$lg"
          shadowColor="$shadow"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.1}
          shadowRadius={4}
          elevation={3}
        >
          <Text
            fontSize={18}
            fontWeight="700"
            color="$text"
            letterSpacing={0.2}
            marginBottom="$md"
          >
            最佳提交时间 ⏰
          </Text>

          {/* Submission Countdown */}
          <SubmissionCountdown
            arrivalDate={arrivalDate}
            locale={t('locale', { defaultValue: 'zh' })}
            showIcon={true}
            updateInterval={1000} // Update every second for real-time countdown
          />

          {/* Smart Primary Action Button - Integrated with Countdown */}
          <YStack
            marginTop="$md"
            paddingTop="$md"
            borderTopWidth={1}
            borderTopColor="$borderColor"
          >
            {renderPrimaryAction()}
          </YStack>
        </YStack>
      )}

      {/* Secondary Actions Section - Vertically Stacked */}
      <YStack gap="$md">
        {/* Entry Guide Button - Only shown BEFORE submission (after submission it's in prominent position) */}
        {entryPackStatus !== 'submitted' && (
          <PressableCard
            borderRadius={16}
            overflow="hidden"
            shadowColor="$shadow"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.2}
            shadowRadius={8}
            elevation={4}
            onPress={() => navigation.navigate('ThailandEntryGuide', {
              passport: passportParam,
              destination: destination,
              completionData: userData,
              showSubmittedTips: false
            })}
          >
            <LinearGradient
              colors={['#0BD67B', colors.primary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
                paddingVertical: 20,
              }}
            >
              <YStack
                width={52}
                height={52}
                borderRadius={26}
                backgroundColor="rgba(255, 255, 255, 0.28)"
                alignItems="center"
                justifyContent="center"
                marginRight="$md"
              >
                <Text fontSize={26}>🗺️</Text>
              </YStack>
              <YStack flex={1}>
                <Text
                  fontSize={17}
                  fontWeight="700"
                  color="$white"
                  letterSpacing={0.2}
                >
                  开始入境流程
                </Text>
                <Text
                  fontSize={13}
                  color="rgba(255, 255, 255, 0.90)"
                  marginTop={4}
                >
                  查看完整的入境指引
                </Text>
              </YStack>
              <YStack
                width={32}
                height={32}
                borderRadius={16}
                backgroundColor="rgba(255, 255, 255, 0.26)"
                alignItems="center"
                justifyContent="center"
                marginLeft="$sm"
              >
                <Text fontSize={20} fontWeight="700" color="$white">
                  ›
                </Text>
              </YStack>
            </LinearGradient>
          </PressableCard>
        )}

        {/* Preview Entry Pack Button - Only show BEFORE submission */}
        {entryPackStatus !== 'submitted' && completionPercent > 50 && (
          <PressableCard
            flexDirection="row"
            alignItems="center"
            backgroundColor="$background"
            borderRadius={16}
            paddingVertical={18}
            paddingHorizontal="$md"
            borderWidth={1}
            borderColor="$borderColor"
            marginTop="$md"
            shadowColor="$shadow"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.1}
            shadowRadius={4}
            elevation={3}
            onPress={handlePreviewEntryCard}
          >
            <YStack
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor="$primaryLight"
              alignItems="center"
              justifyContent="center"
              marginRight="$md"
            >
              <Text fontSize={24}>👁️</Text>
            </YStack>
            <YStack flex={1}>
              <Text
                fontSize={16}
                fontWeight="700"
                color="$text"
                letterSpacing={0.1}
              >
                看看我的通关包
              </Text>
              <Text
                fontSize={13}
                color="$textSecondary"
                marginTop={4}
              >
                {t('progressiveEntryFlow.entryPack.quickPeek', { defaultValue: '快速查看旅途资料' })}
              </Text>
            </YStack>
            <Text
              fontSize={20}
              fontWeight="700"
              color="$primary"
              marginLeft="$xs"
            >
              ›
            </Text>
          </PressableCard>
        )}
      </YStack>
    </YStack>
  );
};

export default PreparedState;
