import { InfoScreenConfig } from '../types';

export const thailandInfoScreenConfig: InfoScreenConfig = {
  flag: '🇹🇭',
  headerTitleKey: 'thailand.info.headerTitle',
  titleKey: 'thailand.info.title',
  subtitleKey: 'thailand.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'thailand.info.sections.visa.title',
      itemsKey: 'thailand.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'onsite',
      titleKey: 'thailand.info.sections.onsite.title',
      itemsKey: 'thailand.info.sections.onsite.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'thailand.info.sections.appFeatures.title',
      itemsKey: 'thailand.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'thailand.info.continueButton',
    screen: 'ThailandRequirements',
    buildParams: ({ passport, destination }: any) => ({
      passport,
      destination,
    }),
  },
};

export default thailandInfoScreenConfig;
