/**
 * HeroSection Component
 *
 * Displays the introductory hero section with gradient background
 * for Thailand Travel Info Screen
 */

import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { YStack, XStack, Text as TamaguiText } from '../../tamagui';

const HeroSection = ({ t }) => {
  return (
    <LinearGradient
      colors={['#1a3568', '#102347']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <YStack alignItems="center">
        <TamaguiText fontSize={64} marginBottom="$md">🇹🇭</TamaguiText>
        <YStack alignItems="center" marginBottom="$xl">
          <TamaguiText fontSize={28} fontWeight="700" color="white" marginBottom="$xs" textAlign="center">
            泰国入境准备指南
          </TamaguiText>
          <TamaguiText fontSize={16} color="#E8F0FF" textAlign="center">
            别担心，我们来帮你！
          </TamaguiText>
        </YStack>

        {/* Beginner-Friendly Value Proposition */}
        <XStack justifyContent="space-around" width="100%" marginBottom="$xl" paddingVertical="$md">
          <YStack alignItems="center" flex={1}>
            <TamaguiText fontSize={32} marginBottom="$xs">⏱️</TamaguiText>
            <TamaguiText fontSize={12} fontWeight="600" color="white" textAlign="center">3分钟完成</TamaguiText>
          </YStack>
          <YStack alignItems="center" flex={1}>
            <TamaguiText fontSize={32} marginBottom="$xs">🔒</TamaguiText>
            <TamaguiText fontSize={12} fontWeight="600" color="white" textAlign="center">100%隐私保护</TamaguiText>
          </YStack>
          <YStack alignItems="center" flex={1}>
            <TamaguiText fontSize={32} marginBottom="$xs">🎯</TamaguiText>
            <TamaguiText fontSize={12} fontWeight="600" color="white" textAlign="center">避免通关延误</TamaguiText>
          </YStack>
        </XStack>

        <XStack backgroundColor="rgba(255, 255, 255, 0.1)" borderRadius={12} padding="$md" alignItems="flex-start">
          <TamaguiText fontSize={24} marginRight="$sm">💡</TamaguiText>
          <TamaguiText fontSize="$2" color="#E8F0FF" flex={1} lineHeight={20}>
            第一次过泰国海关？我们会一步步教你准备所有必需文件，确保顺利通关！
          </TamaguiText>
        </XStack>
      </YStack>
    </LinearGradient>
  );
};

export default HeroSection;
