/**
 * Malaysia Entry Flow Configuration
 *
 * Drives EntryFlowScreenTemplate for Malaysia MDAC flow.
 */

export const malaysiaEntryFlowConfig = {
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
      defaultName: 'Passport Information',
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
      defaultName: 'Personal Information',
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
      defaultName: 'Proof of Funds',
      icon: '💰',
      minRequired: 1,
      validator: (funds) => Array.isArray(funds) && funds.length >= 1,
    },
    {
      id: 'travel',
      nameKey: 'malaysia.progressiveEntryFlow.categories.travel',
      defaultName: 'Travel Information',
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
