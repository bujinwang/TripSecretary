/**
 * Japan Entry Pack Preview Configuration
 *
 * Configuration for JapanEntryPackPreviewScreen template.
 * Defines document generation, data export, and sharing capabilities.
 */

export const japanEntryPackPreviewConfig = {
  // Basic Metadata
  destinationId: 'jp',
  name: 'Japan',
  flag: '🇯🇵',

  // Colors
  colors: {
    background: '#F9FAFB',
    primary: '#DC2626', // Japan's red theme
    success: '#16A34A',
    warning: '#D97706',
  },

  // Document generation settings
  documents: {
    entryCard: {
      enabled: true,
      type: 'paper', // Japan uses paper arrival cards
      template: 'japan-entry-card',
      languages: ['ja', 'en', 'zh'],
      required: true,
    },
    customsDeclaration: {
      enabled: true,
      type: 'paper',
      template: 'japan-customs-declaration',
      languages: ['ja', 'en'],
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
      includeQrCodes: false, // No digital QR codes for Japan
      pageOrientation: 'portrait',
      includeInstructions: true,
      languages: ['en', 'zh'],
    },
    shareableLink: {
      enabled: false, // Japan doesn't use digital submission
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

  // Japan-specific requirements
  japan: {
    arrivalCard: {
      required: true,
      languages: ['japanese', 'english', 'chinese'],
      sampleImage: 'japan-entry-card-sample.jpg',
      instructions: {
        japanese: '入国カードを正確に記入してください。',
        english: 'Please fill out the arrival card accurately.',
        chinese: '请准确填写入境卡。',
      },
    },
    customsDeclaration: {
      required: false,
      threshold: 100000, // Required if bringing goods over ¥100,000
      languages: ['japanese', 'english'],
      sampleImage: 'japan-customs-declaration-sample.jpg',
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
    digitalSubmission: false, // Japan doesn't have digital arrival card
  },

  // UI Messages
  messages: {
    completion: {
      titleKey: 'japan.entryPack.preview.completion.title',
      subtitleKey: 'japan.entryPack.preview.completion.subtitle',
      defaultTitle: '准备就绪！',
      defaultSubtitle: '您的日本入境资料已完整，准备好打印和使用了。',
    },
    validation: {
      titleKey: 'japan.entryPack.preview.validation.title',
      defaultTitle: '请完善信息',
      defaultMessage: '请完成所有必填项目后再生成文件。',
    },
    documents: {
      titleKey: 'japan.entryPack.preview.documents.title',
      defaultTitle: '入境文件',
      defaultSubtitle: '以下是您需要的日本入境相关文件',
    },
  },

  // i18n configuration
  i18n: {
    namespace: 'japan.entryPack',
    fallbackLanguage: 'en',
  },
};

export default japanEntryPackPreviewConfig;