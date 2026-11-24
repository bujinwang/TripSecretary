import { EntryPackPreviewConfig } from '../types';

export const taiwanEntryPackPreviewConfig: EntryPackPreviewConfig = {
  countryCode: 'taiwan',
  header: {
    title: 'Taiwan Entry Pack - Preview / 臺灣入境包預覽',
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: 'Preview Mode / 預覽模式',
    descriptions: [
      'This is a preview of your Taiwan entry information. Everything here helps you breeze through immigration.',
      '這是您的臺灣入境資訊預覽。所有資料將協助您順利通過入境查驗。',
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: '✏️ Continue Editing / 繼續完善資訊',
      type: 'navigate',
      screen: 'TaiwanTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'arrival_card',
      label: '🇹🇼 Submit Arrival Card / 前往線上入境卡',
      type: 'navigate',
      screen: 'TWArrivalSelection',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
  },
  infoSection: {
    icon: 'ℹ️',
    items: [
      'Tip: Complete the Taiwan Online Arrival Card within 3 days before arrival.',
      '提示：請在抵達臺灣前 3 天內完成線上入境卡申報。',
    ],
  },
};

export default taiwanEntryPackPreviewConfig;
