import { RequirementsScreenConfig } from '../types';

export const koreaRequirementsScreenConfig: RequirementsScreenConfig = {
  headerTitleKey: 'korea.requirements.headerTitle',
  introTitleKey: 'korea.requirements.introTitle',
  introSubtitleKey: 'korea.requirements.introSubtitle',
  requirements: [
    {
      key: 'validPassport',
      titleKey: 'korea.requirements.items.validPassport.title',
      descriptionKey: 'korea.requirements.items.validPassport.description',
      detailsKey: 'korea.requirements.items.validPassport.details',
    },
    {
      key: 'returnTicket',
      titleKey: 'korea.requirements.items.returnTicket.title',
      descriptionKey: 'korea.requirements.items.returnTicket.description',
      detailsKey: 'korea.requirements.items.returnTicket.details',
    },
    {
      key: 'sufficientFunds',
      titleKey: 'korea.requirements.items.sufficientFunds.title',
      descriptionKey: 'korea.requirements.items.sufficientFunds.description',
      detailsKey: 'korea.requirements.items.sufficientFunds.details',
    },
    {
      key: 'accommodation',
      titleKey: 'korea.requirements.items.accommodation.title',
      descriptionKey: 'korea.requirements.items.accommodation.description',
      detailsKey: 'korea.requirements.items.accommodation.details',
    },
  ],
  infoBox: {
    icon: '📝',
    titleKey: 'korea.requirements.status.info.title',
    subtitleKey: 'korea.requirements.status.info.subtitle',
  },
  primaryAction: {
    labelKey: 'korea.requirements.startButton',
    screen: 'KoreaTravelInfo',
    buildParams: ({ passport, destination }: any) => ({
      passport,
      destination,
    }),
  },
};

export default koreaRequirementsScreenConfig;
