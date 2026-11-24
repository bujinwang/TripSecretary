import { RequirementsScreenConfig } from '../types';

export const thailandRequirementsScreenConfig: RequirementsScreenConfig = {
  headerTitleKey: 'thailand.requirements.headerTitle',
  introTitleKey: 'thailand.requirements.introTitle',
  introSubtitleKey: 'thailand.requirements.introSubtitle',
  requirements: [
    {
      key: 'validPassport',
      titleKey: 'thailand.requirements.items.validPassport.title',
      descriptionKey: 'thailand.requirements.items.validPassport.description',
      detailsKey: 'thailand.requirements.items.validPassport.details',
    },
    {
      key: 'onwardTicket',
      titleKey: 'thailand.requirements.items.onwardTicket.title',
      descriptionKey: 'thailand.requirements.items.onwardTicket.description',
      detailsKey: 'thailand.requirements.items.onwardTicket.details',
    },
    {
      key: 'accommodation',
      titleKey: 'thailand.requirements.items.accommodation.title',
      descriptionKey: 'thailand.requirements.items.accommodation.description',
      detailsKey: 'thailand.requirements.items.accommodation.details',
    },
    {
      key: 'funds',
      titleKey: 'thailand.requirements.items.funds.title',
      descriptionKey: 'thailand.requirements.items.funds.description',
      detailsKey: 'thailand.requirements.items.funds.details',
    },
    {
      key: 'healthCheck',
      titleKey: 'thailand.requirements.items.healthCheck.title',
      descriptionKey: 'thailand.requirements.items.healthCheck.description',
      detailsKey: 'thailand.requirements.items.healthCheck.details',
    },
  ],
  infoBox: {
    icon: '📝',
    titleKey: 'thailand.requirements.status.info.title',
    subtitleKey: 'thailand.requirements.status.info.subtitle',
  },
  primaryAction: {
    labelKey: 'thailand.requirements.startButton',
    screen: 'ThailandTravelInfo',
    buildParams: ({ passport, destination }: any) => ({
      passport,
      destination,
    }),
  },
};

export default thailandRequirementsScreenConfig;
