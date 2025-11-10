// @ts-nocheck

/**
 * Malaysia Requirements Screen Configuration
 *
 * Provides checklist content for EntryRequirementsTemplate.
 */

export const malaysiaRequirementsScreenConfig = {
  headerTitleKey: 'malaysia.requirements.headerTitle',
  introTitleKey: 'malaysia.requirements.introTitle',
  introSubtitleKey: 'malaysia.requirements.introSubtitle',
  requirements: [
    {
      key: 'validPassport',
      titleKey: 'malaysia.requirements.items.validPassport.title',
      descriptionKey: 'malaysia.requirements.items.validPassport.description',
      detailsKey: 'malaysia.requirements.items.validPassport.details',
    },
    {
      key: 'returnTicket',
      titleKey: 'malaysia.requirements.items.returnTicket.title',
      descriptionKey: 'malaysia.requirements.items.returnTicket.description',
      detailsKey: 'malaysia.requirements.items.returnTicket.details',
    },
    {
      key: 'accommodation',
      titleKey: 'malaysia.requirements.items.accommodation.title',
      descriptionKey: 'malaysia.requirements.items.accommodation.description',
      detailsKey: 'malaysia.requirements.items.accommodation.details',
    },
    {
      key: 'sufficientFunds',
      titleKey: 'malaysia.requirements.items.sufficientFunds.title',
      descriptionKey: 'malaysia.requirements.items.sufficientFunds.description',
      detailsKey: 'malaysia.requirements.items.sufficientFunds.details',
    },
  ],
  infoBox: {
    icon: '🛃',
    titleKey: 'malaysia.requirements.status.success.title',
    subtitleKey: 'malaysia.requirements.status.success.subtitle',
  },
  warningBox: {
    icon: '⚠️',
    titleKey: 'malaysia.requirements.status.warning.title',
    subtitleKey: 'malaysia.requirements.status.warning.subtitle',
  },
  primaryAction: {
    labelKey: 'malaysia.requirements.startButton',
    screen: 'MalaysiaTravelInfo',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default malaysiaRequirementsScreenConfig;
