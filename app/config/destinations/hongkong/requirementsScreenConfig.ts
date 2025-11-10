// @ts-nocheck

export const hongkongRequirementsScreenConfig = {
  headerTitleKey: 'hongkong.requirements.headerTitle',
  introTitleKey: 'hongkong.requirements.introTitle',
  introSubtitleKey: 'hongkong.requirements.introSubtitle',
  requirements: [
    {
      key: 'validPassport',
      titleKey: 'hongkong.requirements.items.validPassport.title',
      descriptionKey: 'hongkong.requirements.items.validPassport.description',
      detailsKey: 'hongkong.requirements.items.validPassport.details',
    },
    {
      key: 'returnTicket',
      titleKey: 'hongkong.requirements.items.returnTicket.title',
      descriptionKey: 'hongkong.requirements.items.returnTicket.description',
      detailsKey: 'hongkong.requirements.items.returnTicket.details',
    },
    {
      key: 'accommodation',
      titleKey: 'hongkong.requirements.items.accommodation.title',
      descriptionKey: 'hongkong.requirements.items.accommodation.description',
      detailsKey: 'hongkong.requirements.items.accommodation.details',
    },
    {
      key: 'sufficientFunds',
      titleKey: 'hongkong.requirements.items.sufficientFunds.title',
      descriptionKey: 'hongkong.requirements.items.sufficientFunds.description',
      detailsKey: 'hongkong.requirements.items.sufficientFunds.details',
    },
    {
      key: 'healthDeclaration',
      titleKey: 'hongkong.requirements.items.healthDeclaration.title',
      descriptionKey: 'hongkong.requirements.items.healthDeclaration.description',
      detailsKey: 'hongkong.requirements.items.healthDeclaration.details',
    },
  ],
  infoBox: {
    icon: 'ℹ️',
    titleKey: 'hongkong.requirements.status.info.title',
    subtitleKey: 'hongkong.requirements.status.info.subtitle',
  },
  primaryAction: {
    labelKey: 'hongkong.requirements.startButton',
    screen: 'HongKongTravelInfo',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default hongkongRequirementsScreenConfig;
