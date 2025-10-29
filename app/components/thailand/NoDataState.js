/**
 * NoDataState Component
 *
 * Displays an empty state when user has no Thailand entry data yet.
 * Encourages user to start filling in information with friendly guidance.
 *
 * Extracted from ThailandEntryFlowScreen for better maintainability.
 */

import React from 'react';
import { YStack, Text as TamaguiText } from '../tamagui';
import Button from '../Button';

/**
 * @param {Object} props
 * @param {Object} props.styles - Style object from parent screen
 * @param {Function} props.onGetStarted - Callback when user clicks start button
 * @returns {JSX.Element}
 */
const NoDataState = ({ styles, onGetStarted }) => {
  return (
    <YStack style={styles.noDataContainer}>
      <TamaguiText style={styles.noDataIcon}>📝</TamaguiText>
      <TamaguiText style={styles.noDataTitle}>
        准备开始泰国之旅吧！🌴
      </TamaguiText>
      <TamaguiText style={styles.noDataDescription}>
        你还没有填写泰国入境信息，别担心，我们会一步步帮你准备好所有需要的资料，让你轻松入境泰国！
      </TamaguiText>

      {/* Example/Tutorial hints */}
      <YStack style={styles.noDataHints}>
        <TamaguiText style={styles.noDataHintsTitle}>
          泰国入境需要准备这些信息 🌺
        </TamaguiText>
        <YStack style={styles.noDataHintsList}>
          <TamaguiText style={styles.noDataHint}>• 📘 护照信息 - 让泰国认识你</TamaguiText>
          <TamaguiText style={styles.noDataHint}>• 📞 联系方式 - 泰国怎么找到你</TamaguiText>
          <TamaguiText style={styles.noDataHint}>• 💰 资金证明 - 证明你能好好玩</TamaguiText>
          <TamaguiText style={styles.noDataHint}>• ✈️ 航班和住宿 - 你的旅行计划</TamaguiText>
        </YStack>
      </YStack>

      <Button
        title="开始我的泰国准备之旅！🇹🇭"
        onPress={onGetStarted}
        variant="primary"
        style={styles.noDataButton}
      />
    </YStack>
  );
};

export default NoDataState;
