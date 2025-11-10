// @ts-nocheck

/**
 * Singapore Entry Pack Preview Configuration
 *
 * Provides copy and navigation targets for EntryPackPreviewTemplate.
 */

export const singaporeEntryPackPreviewConfig = {
  countryCode: 'singapore',
  header: {
    title: 'Singapore Entry Pack - Preview / 新加坡入境包预览',
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: 'Preview Mode / 预览模式',
    descriptions: [
      'This is a preview of your Singapore entry pack. Once SGAC is submitted, the full entry card details will be included.',
      '这是您的新加坡入境包预览。提交 SGAC 后会包含完整的入境卡信息。',
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: '✏️ Continue Editing / 继续完善信息',
      type: 'navigate',
      screen: 'SingaporeTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'sgac',
      label: '🇸🇬 Submit SGAC / 提交新加坡入境卡',
      type: 'navigate',
      screen: 'SGACSelection',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
  },
  infoSection: {
    icon: 'ℹ️',
    items: [
      'Tip: SGAC can be submitted 3 days before arrival and up to 15 days after.',
      '提示：SGAC 可在抵达前 3 天至抵达后 15 天内提交。',
    ],
  },
};

export default singaporeEntryPackPreviewConfig;
