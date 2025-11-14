// @ts-nocheck

/**
 * Malaysia Entry Pack Preview Configuration
 *
 * Provides copy and navigation targets for EntryPackPreviewTemplate.
 */

export const malaysiaEntryPackPreviewConfig = {
  // Basic Metadata
  countryCode: 'my',
  destinationId: 'my',
  name: 'Malaysia',
  flag: '🇲🇾',

  // Colors
  colors: {
    background: '#F5F7FA',
    primary: '#2563EB', // Malaysia's blue theme
    success: '#16A34A',
    warning: '#D97706',
  },

  // Document generation settings
  documents: {
    mdac: {
      enabled: true,
      type: 'digital', // Malaysia uses digital MDAC submission
      template: 'malaysia-mdac',
      languages: ['en', 'zh', 'ms'],
      required: true,
    },
  },

  // Preview screen options
  preview: {
    showCompletionChecklist: true,
    showDocumentStatus: true,
    showExportOptions: false, // No PDF export for MDAC (digital submission)
    showShareOptions: false, // No sharing for MDAC
    showPrintOptions: false, // No printing for MDAC

    // Quick actions
    quickActions: [
      {
        id: 'edit_info',
        type: 'navigate',
        screenKey: 'travelInfo',
        icon: '✏️',
        titleKey: 'preview.actions.editInfo',
        defaultTitle: 'Edit Information',
        variant: 'outline',
      },
      {
        id: 'view_mdac_guide',
        type: 'navigate',
        screenKey: 'mdacGuide',
        icon: '📋',
        titleKey: 'preview.actions.viewGuide',
        defaultTitle: 'MDAC Guide',
        variant: 'outline',
      },
      {
        id: 'submit_mdac',
        type: 'navigate',
        screenKey: 'mdacSelection',
        icon: '🇲🇾',
        titleKey: 'preview.actions.submitMdac',
        defaultTitle: 'Submit MDAC',
        variant: 'solid',
      },
    ],
  },

  // Validation before document generation
  validation: {
    requiredSections: ['passport', 'travel'],
    minCompletionPercent: 85,
    checkRequiredFields: true,
    validatePhoneNumbers: true,
    validateEmailFormat: true,
    validateFlightNumbers: true,
  },

  // Malaysia-specific requirements
  malaysia: {
    mdac: {
      required: true,
      submissionWindow: 72, // Must submit within 3 days (72 hours)
      languages: ['english', 'chinese', 'malay'],
      instructions: {
        english: 'MDAC must be submitted within 3 days before arrival.',
        chinese: 'MDAC必须在入境前3天内提交。',
        malay: 'MDAC mesti dihantar dalam tempoh 3 hari sebelum ketibaan.',
      },
    },
    requirements: {
      visaFree: true, // Most countries have visa-free access
      maxStay: 30, // Maximum stay in days
    },
  },

  // Feature flags
  features: {
    documentGeneration: false, // MDAC is digital, no documents to generate
    pdfExport: false,
    printSupport: false,
    offlineMode: true,
    multiLanguage: true,
    dataValidation: true,
    completionTracking: true,
    photoUpload: true,
    digitalSubmission: true, // MDAC uses digital submission
  },

  // UI Messages
  messages: {
    completion: {
      titleKey: 'preview.completion.title',
      subtitleKey: 'preview.completion.subtitle',
      defaultTitle: 'Ready for MDAC!',
      defaultSubtitle: 'Your Malaysia entry information is complete. Submit your MDAC within 3 days before arrival.',
    },
    validation: {
      titleKey: 'preview.validation.title',
      defaultTitle: 'Complete Required Information',
      defaultMessage: 'Please complete all required fields before submitting your MDAC.',
    },
    documents: {
      titleKey: 'preview.documents.title',
      defaultTitle: 'Malaysia Digital Arrival Card (MDAC)',
      defaultSubtitle: 'Your information will be submitted digitally to Malaysian immigration authorities.',
    },
  },

  // i18n configuration
  i18n: {
    namespace: 'my.entryPack',
    fallbackLanguage: 'en',
  },
};

export default malaysiaEntryPackPreviewConfig;
