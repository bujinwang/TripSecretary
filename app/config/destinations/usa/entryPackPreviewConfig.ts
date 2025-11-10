// @ts-nocheck

/**
 * United States Entry Pack Preview Configuration
 */

export const usaEntryPackPreviewConfig = {
  countryCode: 'usa',
  header: {
    title: 'US Entry Pack Preview',
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: 'Preview Mode',
    descriptions: [
      'This is your US entry information overview: passport, EVUS, flight, accommodation, and proof of funds at a glance.',
      'Tip: You can update information at any time before arrival to ensure quick presentation to CBP officers.',
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: '✏️ Edit Information',
      type: 'navigate',
      screen: 'USTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'entryFlow',
      label: '📋 View Progress',
      type: 'navigate',
      screen: 'USAEntryFlow',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
  },
  infoSection: {
    icon: 'ℹ️',
    items: [
      'EVUS status and visa validity must be confirmed before departure.',
      'CBP interview common questions: purpose of visit, length of stay, accommodation address, amount of funds carried.',
    ],
  },
};

export default usaEntryPackPreviewConfig;
