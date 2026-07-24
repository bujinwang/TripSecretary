import { InfoScreenConfig } from '../types';

export const koreaInfoScreenConfig: InfoScreenConfig = {
  flag: '🇰🇷',
  headerTitleKey: 'korea.info.headerTitle',
  titleKey: 'korea.info.title',
  subtitleKey: 'korea.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'korea.info.sections.visa.title',
      itemsKey: 'korea.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'important',
      titleKey: 'korea.info.sections.important.title',
      itemsKey: 'korea.info.sections.important.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'korea.info.sections.appFeatures.title',
      itemsKey: 'korea.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'korea.info.continueButton',
    screen: 'KoreaRequirements',
    buildParams: ({ passport, destination }: any) => ({
      passport,
      destination,
    }),
  },
};

export default koreaInfoScreenConfig;
