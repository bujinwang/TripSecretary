/**
 * United States Entry Pack Preview Configuration
 */

export const usaEntryPackPreviewConfig = {
  countryCode: 'usa',
  header: {
    title: '美国入境资料包预览',
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: '预览模式',
    descriptions: [
      '这是您美国行的资料总览：护照、EVUS、航班、住宿与资金证明一目了然。',
      '提示：抵达前可随时更新信息，确保入境时快速出示。',
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: '✏️ 返回编辑',
      type: 'navigate',
      screen: 'USTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'entryFlow',
      label: '📋 查看准备进度',
      type: 'navigate',
      screen: 'USAEntryFlow',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
  },
  infoSection: {
    icon: 'ℹ️',
    items: [
      'EVUS 状态与签证有效期务必在出发前再次确认。',
      'CBP 面谈常见问题：访问目的、停留时间、住宿地址、携带资金数额。',
    ],
  },
};

export default usaEntryPackPreviewConfig;
