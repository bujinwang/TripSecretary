import { EntryFlowConfig } from '../types';

/**
 * Malaysia Entry Flow Configuration
 *
 * Drives EntryFlowScreenTemplate for Malaysia MDAC flow.
 */

export const malaysiaEntryFlowConfig: EntryFlowConfig = {
  // Metadata
  destinationId: 'my',
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
      title: 'Ready to submit MDAC!',
      subtitle: 'All information is complete',
    },
    mostly_complete: {
      title: 'Almost finished!',
      subtitle: 'Complete the remaining items',
    },
    needs_improvement: {
      title: 'Get started',
      subtitle: 'Keep filling in your information for a smoother trip',
    },
  },

  // Progress hero card translations
  entryFlow: {
    progress: {
      headline: {
        ready: '马来西亚行程准备就绪！🇲🇾',
        almost: '快完成了，继续加油！',
        start: '开始整理马来西亚入境资料吧',
      },
      subtitle: {
        ready: '所有必填信息已完成，可随时应对入境问询。',
        almost: '还差 {{remaining}}%，完善后即可安心过关。',
        start: '填写护照、资金与行程信息，让入境问询更从容。',
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
