// @ts-nocheck

export const vietnamRequirementsScreenConfig = {
  headerTitleKey: 'vietnam.requirements.headerTitle',
  introTitleKey: 'vietnam.requirements.introTitle',
  introSubtitleKey: 'vietnam.requirements.introSubtitle',
  requirements: [
    {
      key: 'validPassport',
      titleKey: 'vietnam.requirements.items.validPassport.title',
      descriptionKey: 'vietnam.requirements.items.validPassport.description',
      detailsKey: 'vietnam.requirements.items.validPassport.details',
    },
    {
      key: 'visa',
      titleKey: 'vietnam.requirements.items.visa.title',
      descriptionKey: 'vietnam.requirements.items.visa.description',
      detailsKey: 'vietnam.requirements.items.visa.details',
    },
    {
      key: 'onwardTicket',
      titleKey: 'vietnam.requirements.items.onwardTicket.title',
      descriptionKey: 'vietnam.requirements.items.onwardTicket.description',
      detailsKey: 'vietnam.requirements.items.onwardTicket.details',
    },
    {
      key: 'accommodation',
      titleKey: 'vietnam.requirements.items.accommodation.title',
      descriptionKey: 'vietnam.requirements.items.accommodation.description',
      detailsKey: 'vietnam.requirements.items.accommodation.details',
    },
    {
      key: 'funds',
      titleKey: 'vietnam.requirements.items.funds.title',
      descriptionKey: 'vietnam.requirements.items.funds.description',
      detailsKey: 'vietnam.requirements.items.funds.details',
    },
  ],
  infoBox: {
    icon: '📝',
    titleKey: 'vietnam.requirements.status.info.title',
    subtitleKey: 'vietnam.requirements.status.info.subtitle',
  },
  primaryAction: {
    labelKey: 'vietnam.requirements.startButton',
    screen: 'VietnamTravelInfo',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default vietnamRequirementsScreenConfig;
