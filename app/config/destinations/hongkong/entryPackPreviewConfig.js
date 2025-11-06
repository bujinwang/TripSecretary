/**
 * Hong Kong Entry Pack Preview Configuration
 *
 * Provides copy and navigation targets for EntryPackPreviewTemplate.
 */

export const hongkongEntryPackPreviewConfig = {
  countryCode: 'hongkong',
  header: {
    title: '香港入境资料包预览',
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: '预览模式',
    descriptions: [
      '这里汇总了护照、资金与行程资料，入境官询问时可快速展示。',
      '提示：为安全起见，请确保资料定期更新并备份到云端。',
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: '✏️ 返回编辑',
      type: 'navigate',
      screen: 'HongKongTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'entryFlow',
      label: '📋 查看准备进度',
      type: 'navigate',
      screen: 'HongKongEntryFlow',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
  },
  infoSection: {
    icon: 'ℹ️',
    items: [
      '入境官常见要求：返程机票、住宿凭证、资金证明。',
      '香港免签停留通常为7天，计划逗留更久需提前了解延期流程。',
    ],
  },
};

export default hongkongEntryPackPreviewConfig;
