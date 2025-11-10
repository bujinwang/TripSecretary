// @ts-nocheck

/**
 * Malaysia Entry Flow Configuration
 *
 * Drives EntryFlowScreenTemplate for Malaysia MDAC flow.
 */

export const malaysiaEntryFlowConfig = {
  // Metadata
  destinationId: 'malaysia',
  name: 'Malaysia',
  nameZh: '马来西亚',
  flag: '🇲🇾',

  colors: {
    background: '#F5F7FA',
    primary: '#2563EB',
  },

  // Screen navigation mapping
  screens: {
    current: 'MalaysiaEntryFlow',
    travelInfo: 'MalaysiaTravelInfo',
    submit: 'MDACSelection',
    entryGuide: 'MalaysiaEntryGuide',
    entryPackPreview: 'MalaysiaEntryPackPreview',
  },

  // Categories displayed in the progress view
  categories: [
    {
      id: 'passport',
      nameKey: 'malaysia.progressiveEntryFlow.categories.passport',
      icon: '📘',
      requiredFields: [
        'surname',
        'givenName',
        'passportNo',
        'nationality',
        'dob',
        'expiryDate',
        'sex',
      ],
    },
    {
      id: 'personal',
      nameKey: 'malaysia.progressiveEntryFlow.categories.personal',
      icon: '👤',
      requiredFields: [
        'occupation',
        'cityOfResidence',
        'residentCountry',
        'phoneCode',
        'phoneNumber',
        'email',
      ],
    },
    {
      id: 'funds',
      nameKey: 'malaysia.progressiveEntryFlow.categories.funds',
      icon: '💰',
      minRequired: 1,
      validator: (funds) => Array.isArray(funds) && funds.length >= 1,
    },
    {
      id: 'travel',
      nameKey: 'malaysia.progressiveEntryFlow.categories.travel',
      icon: '✈️',
      requiredFields: [
        'travelPurpose',
        'arrivalFlightNumber',
        'arrivalDate',
        'accommodationType',
        'province',
        'hotelAddress',
      ],
    },
  ],

  // Completion criteria before MDAC submission
  completion: {
    minPercent: 85,
    requiredCategories: ['passport', 'travel'],
  },

  // Status messages
  status: {
    ready: {
      title: '准备好提交MDAC！',
      subtitle: '所有信息已完成',
    },
    mostly_complete: {
      title: '快完成了！',
      subtitle: '继续完成剩余项目',
    },
    needs_improvement: {
      title: '开始填写',
      subtitle: '继续填写您的信息以使旅程更顺利',
    },
  },

  // Progress hero card translations
  entryFlow: {
    progress: {
      headline: {
        ready: '马来西亚准备就绪！🌴',
        almost: '几乎完成了！',
        start: '让我们开始吧！',
      },
      subtitle: {
        ready: '所有信息完整',
        almost: '继续填写您的信息以使旅程更顺利',
        start: '继续填写您的信息以使旅程更顺利',
      },
    },
  },

  // Feature flags
  features: {
    entryGuideQuickAction: true,
    submissionCountdown: true,
  },

  // Submission window (MDAC: submit within 3 days before arrival)
  submission: {
    hasWindow: true,
    windowHours: 72,
    reminderHours: 24,
    labelKey: 'malaysia.entryFlow.submissionWindow',
  },
};

export default malaysiaEntryFlowConfig;
