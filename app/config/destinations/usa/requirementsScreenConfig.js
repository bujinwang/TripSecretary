export const usaRequirementsScreenConfig = {
  headerTitleKey: 'usa.requirements.headerTitle',
  introTitleKey: 'usa.requirements.introTitle',
  introSubtitleKey: 'usa.requirements.introSubtitle',
  requirements: [
    {
      key: 'validPassport',
      titleKey: 'usa.requirements.items.validPassport.title',
      descriptionKey: 'usa.requirements.items.validPassport.description',
      detailsKey: 'usa.requirements.items.validPassport.details',
    },
    {
      key: 'validVisa',
      titleKey: 'usa.requirements.items.validVisa.title',
      descriptionKey: 'usa.requirements.items.validVisa.description',
      detailsKey: 'usa.requirements.items.validVisa.details',
    },
    {
      key: 'returnTicket',
      titleKey: 'usa.requirements.items.returnTicket.title',
      descriptionKey: 'usa.requirements.items.returnTicket.description',
      detailsKey: 'usa.requirements.items.returnTicket.details',
    },
    {
      key: 'sufficientFunds',
      titleKey: 'usa.requirements.items.sufficientFunds.title',
      descriptionKey: 'usa.requirements.items.sufficientFunds.description',
      detailsKey: 'usa.requirements.items.sufficientFunds.details',
    },
    {
      key: 'accommodation',
      titleKey: 'usa.requirements.items.accommodation.title',
      descriptionKey: 'usa.requirements.items.accommodation.description',
      detailsKey: 'usa.requirements.items.accommodation.details',
    },
  ],
  infoBox: {
    icon: 'ℹ️',
    titleKey: 'usa.requirements.status.info.title',
    subtitleKey: 'usa.requirements.status.info.subtitle',
  },
  primaryAction: {
    labelKey: 'usa.requirements.startButton',
    screen: 'USTravelInfo',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default usaRequirementsScreenConfig;
