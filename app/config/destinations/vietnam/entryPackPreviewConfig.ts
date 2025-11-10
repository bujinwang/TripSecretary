// @ts-nocheck

/**
 * Vietnam Entry Pack Preview Configuration
 *
 * Configuration for VietnamEntryPackPreviewScreen template.
 * Defines document generation, data export, and sharing capabilities.
 */

export const vietnamEntryPackPreviewConfig = {
  // Basic Metadata
  destinationId: 'vn',
  name: 'Vietnam',
  flag: '🇻🇳',

  // Colors
  colors: {
    background: '#F9FAFB',
    primary: '#2196F3', // Vietnam's blue theme
    success: '#16A34A',
    warning: '#D97706',
  },

  // Document generation settings
  documents: {
    arrivalCard: {
      enabled: true,
      type: 'paper', // Vietnam uses paper arrival cards
      template: 'vietnam-arrival-card',
      languages: ['vi', 'en'],
      required: true,
    },
    customsDeclaration: {
      enabled: true,
      type: 'paper',
      template: 'vietnam-customs-declaration',
      languages: ['vi', 'en'],
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
      includeQrCodes: false, // No digital QR codes for Vietnam
      pageOrientation: 'portrait',
      includeInstructions: true,
      languages: ['en'],
    },
    shareableLink: {
      enabled: false, // Vietnam doesn't use digital submission
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

  // Vietnam-specific requirements
  vietnam: {
    arrivalCard: {
      required: true,
      languages: ['vietnamese', 'english'],
      sampleImage: 'vietnam-arrival-card-sample.jpg',
      instructions: {
        vietnamese: 'Vui lòng điền thẻ nhập cảnh chính xác.',
        english: 'Please fill out the arrival card accurately.',
        chinese: '请准确填写入境卡。',
      },
    },
    customsDeclaration: {
      required: false,
      threshold: 20000000, // Required if bringing goods over 20 million VND
      languages: ['vietnamese', 'english'],
      sampleImage: 'vietnam-customs-declaration-sample.jpg',
    },
    evisa: {
      enabled: true,
      required: false, // e-Visa is optional for some nationalities
      processingTime: '3-5_business_days',
      cost: 'USD 25',
      validity: '30-90_days',
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
    digitalSubmission: false, // Vietnam doesn't have digital arrival card
    evisaSupport: true, // Support for e-Visa information
  },

  // UI Messages
  messages: {
    completion: {
      titleKey: 'vietnam.entryPack.preview.completion.title',
      subtitleKey: 'vietnam.entryPack.preview.completion.subtitle',
      defaultTitle: '准备就绪！',
      defaultSubtitle: '您的越南入境资料已完整，准备好打印和使用了。',
    },
    validation: {
      titleKey: 'vietnam.entryPack.preview.validation.title',
      defaultTitle: '请完善信息',
      defaultMessage: '请完成所有必填项目后再生成文件。',
    },
    documents: {
      titleKey: 'vietnam.entryPack.preview.documents.title',
      defaultTitle: '入境文件',
      defaultSubtitle: '以下是您需要的越南入境相关文件',
    },
  },

  // i18n configuration
  i18n: {
    namespace: 'vietnam.entryPack',
    fallbackLanguage: 'en',
  },
};

export default vietnamEntryPackPreviewConfig;
