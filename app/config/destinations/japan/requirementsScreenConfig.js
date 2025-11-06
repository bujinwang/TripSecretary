export const japanRequirementsScreenConfig = {
  headerTitleKey: 'japan.requirements.headerTitle',
  introTitleKey: 'japan.requirements.introTitle',
  introSubtitleKey: 'japan.requirements.introSubtitle',
  requirements: [
    {
      key: 'validPassport',
      titleKey: 'japan.requirements.items.validPassport.title',
      descriptionKey: 'japan.requirements.items.validPassport.description',
      detailsKey: 'japan.requirements.items.validPassport.details',
    },
    {
      key: 'visaFreeEntry',
      titleKey: 'japan.requirements.items.visaFreeEntry.title',
      descriptionKey: 'japan.requirements.items.visaFreeEntry.description',
      detailsKey: 'japan.requirements.items.visaFreeEntry.details',
    },
    {
      key: 'onwardTicket',
      titleKey: 'japan.requirements.items.onwardTicket.title',
      descriptionKey: 'japan.requirements.items.onwardTicket.description',
      detailsKey: 'japan.requirements.items.onwardTicket.details',
    },
    {
      key: 'accommodation',
      titleKey: 'japan.requirements.items.accommodation.title',
      descriptionKey: 'japan.requirements.items.accommodation.description',
      detailsKey: 'japan.requirements.items.accommodation.details',
    },
    {
      key: 'funds',
      titleKey: 'japan.requirements.items.funds.title',
      descriptionKey: 'japan.requirements.items.funds.description',
      detailsKey: 'japan.requirements.items.funds.details',
    },
    {
      key: 'paperArrivalCard',
      titleKey: 'japan.requirements.items.paperArrivalCard.title',
      descriptionKey: 'japan.requirements.items.paperArrivalCard.description',
      detailsKey: 'japan.requirements.items.paperArrivalCard.details',
    },
  ],
  infoBox: {
    icon: '📝',
    titleKey: 'japan.requirements.status.info.title',
    subtitleKey: 'japan.requirements.status.info.subtitle',
  },
  primaryAction: {
    labelKey: 'japan.requirements.startButton',
    screen: 'JapanTravelInfo',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default japanRequirementsScreenConfig;