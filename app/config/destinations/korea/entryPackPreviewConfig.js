/**
 * South Korea Entry Pack Preview Configuration
 *
 * Configuration for KoreaEntryPackPreviewScreen template.
 * Defines document generation, data export, and sharing capabilities.
 */

export const koreaEntryPackPreviewConfig = {
  // Basic Metadata
  destinationId: 'kr',
  name: 'South Korea',
  flag: '🇰🇷',

  // Colors
  colors: {
    background: '#F9FAFB',
    primary: '#2563EB', // Korea's blue theme
    success: '#16A34A',
    warning: '#D97706',
  },

  // Document generation settings
  documents: {
    arrivalCard: {
      enabled: true,
      type: 'paper', // Korea uses paper arrival cards
      template: 'korea-arrival-card',
      languages: ['ko', 'en'],
      required: true,
    },
    keta: {
      enabled: true,
      type: 'digital', // K-ETA is digital
      template: 'keta-approval',
      languages: ['ko', 'en'],
      required: true,
    },
    customsDeclaration: {
      enabled: true,
      type: 'paper',
      template: 'korea-customs-declaration',
      languages: ['ko', 'en'],
      required: false,
    },
    healthDeclaration: {
      enabled: false, // No health declaration required for most visitors
      type: null,
      template: null,
      languages: [],
      required: false,
    },
  },

  // Data export configuration
  export: {
    pdf: {
      enabled: true,
      includePhotos: true,
      includeQrCodes: false, // No digital QR codes for arrival card
      pageOrientation: 'portrait',
      includeInstructions: true,
      languages: ['en'],
    },
    shareableLink: {
      enabled: false, // Korea doesn't use digital arrival card submission
      expiry: null,
    },
    printFormat: {
      enabled: true,
      paperSize: 'A4',
      includeInstructions: true,
      colorMode: 'color',
    },
  },

  // Preview screen options
  preview: {
    showCompletionChecklist: true,
    showDocumentStatus: true,
    showExportOptions: true,
    showShareOptions: false, // No digital sharing needed
    showPrintOptions: true,

    // Quick actions
    quickActions: [
      {
        id: 'edit_info',
        type: 'navigate',
        screenKey: 'travelInfo',
        icon: '✏️',
        titleKey: 'entryPack.preview.actions.editInfo',
        defaultTitle: '编辑信息',
        variant: 'outline',
      },
      {
        id: 'view_entry_guide',
        type: 'navigate',
        screenKey: 'entryGuide',
        icon: '🛂',
        titleKey: 'entryPack.preview.actions.viewGuide',
        defaultTitle: '入境指引',
        variant: 'outline',
      },
      {
        id: 'print_documents',
        type: 'action',
        action: 'print',
        icon: '🖨️',
        titleKey: 'entryPack.preview.actions.print',
        defaultTitle: '打印文件',
        variant: 'solid',
      },
    ],
  },

  // Validation before document generation
  validation: {
    requiredSections: ['passport', 'travel'],
    minCompletionPercent: 80,
    checkRequiredFields: true,
    validatePhoneNumbers: true,
    validateEmailFormat: true,
    validateFlightNumbers: true,
  },

  // Korea-specific requirements
  korea: {
    arrivalCard: {
      required: true,
      languages: ['korean', 'english'],
      sampleImage: 'korea-arrival-card-sample.jpg',
      instructions: {
        korean: '입국카드를 정확히填写해주세요.',
        english: 'Please fill out the arrival card accurately.',
        chinese: '请准确填写入境卡。',
      },
    },
    keta: {
      required: true,
      appliesTo: ['most_nationalities'],
      processingTime: '1-3_business_days',
      validFor: '2_years',
      cost: 'USD 10',
      languages: ['korean', 'english'],
      instructions: {
        korean: 'K-ETA는 도착 24시간 전에 신청해야 합니다.',
        english: 'K-ETA must be applied for at least 24 hours before arrival.',
        chinese: 'K-ETA 必须在抵达前至少24小时申请。',
      },
    },
    customsDeclaration: {
      required: false,
      threshold: 800, // Required if bringing goods over $800
      languages: ['korean', 'english'],
      sampleImage: 'korea-customs-declaration-sample.jpg',
    },
    workingStatus: {
      allowed: false, // No working under visa-free status
      businessActivities: 'limited', // Business activities may require permission
    },
  },

  // Feature flags
  features: {
    documentGeneration: true,
    pdfExport: true,
    printSupport: true,
    offlineMode: true,
    multiLanguage: true,
    dataValidation: true,
    completionTracking: true,
    photoUpload: true,
    digitalSubmission: false, // Korea doesn't have digital arrival card
    ketaSupport: true, // Special support for K-ETA
  },

  // UI Messages
  messages: {
    completion: {
      titleKey: 'korea.entryPack.preview.completion.title',
      subtitleKey: 'korea.entryPack.preview.completion.subtitle',
      defaultTitle: '准备就绪！',
      defaultSubtitle: '您的韩国入境资料已完整，准备好打印和使用了。',
    },
    validation: {
      titleKey: 'korea.entryPack.preview.validation.title',
      defaultTitle: '请完善信息',
      defaultMessage: '请完成所有必填项目后再生成文件。',
    },
    documents: {
      titleKey: 'korea.entryPack.preview.documents.title',
      defaultTitle: '入境文件',
      defaultSubtitle: '以下是您需要的韩国入境相关文件',
    },
  },

  // i18n configuration
  i18n: {
    namespace: 'korea.entryPack',
    fallbackLanguage: 'en',
  },
};

export default koreaEntryPackPreviewConfig;