/**
 * Malaysia Entry Pack Preview Configuration
 *
 * Provides copy and navigation targets for EntryPackPreviewTemplate.
 */

export const malaysiaEntryPackPreviewConfig = {
  countryCode: 'malaysia',
  header: {
    title: 'Malaysia Entry Pack - Preview / 马来西亚入境包预览',
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: 'Preview Mode / Mod Pratonton',
    descriptions: [
      'This is your Malaysia entry information preview. All information helps you pass Malaysian immigration smoothly.',
      'Ini adalah pratonton maklumat kemasukan Malaysia anda. Semua maklumat membantu anda melalui imigresen dengan lancar.',
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: '✏️ Continue Editing / 继续补充信息',
      type: 'navigate',
      screen: 'MalaysiaTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'mdac',
      label: '🇲🇾 Go to MDAC / 前往MDAC',
      type: 'navigate',
      screen: 'MDACSelection',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
  },
  infoSection: {
    icon: '💡',
    items: [
      'Tip: Ensure all information is accurate before submitting MDAC. The arrival card must be submitted within 3 days before arrival.',
      '提示：提交 MDAC 前请确认资料正确，到达前 3 天内完成提交。',
    ],
  },
};

export default malaysiaEntryPackPreviewConfig;
