import { EntryPackPreviewConfig } from '../types';

export const chinaEntryPackPreviewConfig: EntryPackPreviewConfig = {
  destinationId: 'cn',
  countryCode: 'china',
  header: {
    title: {
      values: {
        'zh-CN': '通关包预览',
        'zh-TW': '通關包預覽',
        en: 'Entry Pack Preview',
      },
    },
    subtitle: {
      values: {
        'zh-CN': '提交前检查准备情况',
        'zh-TW': '提交前檢查準備情況',
        en: 'Check readiness before submission',
      },
    },
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: {
      values: {
        'zh-CN': '预览模式',
        'zh-TW': '預覽模式',
        en: 'Preview Mode',
      },
    },
    descriptions: [
      {
        values: {
          'zh-CN': '护照、行程与资金信息集中展示',
          'zh-TW': '護照、行程與資金資訊集中展示',
          en: 'Passport, itinerary and funds summarized in one place',
        },
      },
      {
        values: {
          'zh-CN': '用于向边检快速说明旅程与联系方式',
          'zh-TW': '用於向邊檢快速說明旅程與聯絡方式',
          en: 'Help explain trip and contact details to officers quickly',
        },
      },
    ],
  },
  infoSection: {
    icon: 'ℹ️',
    text: [
      {
        values: {
          'zh-CN': '建议随身携带酒店地址与电话、返程机票、资金证明',
          'zh-TW': '建議隨身攜帶飯店地址與電話、返程機票、資金證明',
          en: 'Carry hotel address/phone, return ticket, and fund proof',
        },
      },
      {
        values: {
          'zh-CN': '条目未填写完整时请返回修改信息',
          'zh-TW': '項目未填寫完整時請返回修改資訊',
          en: 'If items are incomplete, go back to edit information',
        },
      },
    ],
  },
  actions: {
    primary: {
      id: 'edit_info',
      type: 'navigate',
      screen: 'ChinaEntryFlow',
      label: {
        values: {
          'zh-CN': '返回修改信息',
          'zh-TW': '返回修改資訊',
          en: 'Go back to edit info',
        },
      },
    },
  },
  hooks: {},
};

export default chinaEntryPackPreviewConfig;