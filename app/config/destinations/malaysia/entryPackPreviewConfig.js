/**
 * Malaysia Entry Pack Preview Configuration
 *
 * Provides copy and navigation targets for EntryPackPreviewTemplate.
 */

export const malaysiaEntryPackPreviewConfig = {
  countryCode: 'my',
  i18n: {
    namespace: 'entryPackPreview.malaysia',
  },
  header: {
    title: {
      key: 'header.title',
      defaultValue: 'Malaysia Entry Pack - Preview / 马来西亚入境包预览',
    },
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: {
      key: 'previewBanner.title',
      defaultValue: 'Preview Mode / Mod Pratonton',
    },
    descriptions: [
      {
        key: 'previewBanner.descriptions.0',
        defaultValue:
          'This is your Malaysia entry information preview. All information helps you pass Malaysian immigration smoothly.',
      },
      {
        key: 'previewBanner.descriptions.1',
        defaultValue:
          'Ini adalah pratonton maklumat kemasukan Malaysia anda. Semua maklumat membantu anda melalui imigresen dengan lancar.',
      },
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: {
        key: 'actions.continueEditing',
        defaultValue: '✏️ Continue Editing / 继续补充信息',
      },
      type: 'navigate',
      screen: 'MalaysiaTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'mdac',
      label: {
        key: 'actions.goToMdac',
        defaultValue: '🇲🇾 Go to MDAC / 前往MDAC',
      },
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
      {
        key: 'infoSection.items.0',
        defaultValue:
          'Tip: Ensure all information is accurate before submitting MDAC. The arrival card must be submitted within 3 days before arrival.',
      },
      {
        key: 'infoSection.items.1',
        defaultValue: '提示：提交 MDAC 前请确认资料正确，到达前 3 天内完成提交。',
      },
    ],
  },
};

export default malaysiaEntryPackPreviewConfig;
