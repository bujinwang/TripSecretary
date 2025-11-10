// @ts-nocheck

export const usaInfoScreenConfig = {
  flag: '🇺🇸',
  headerTitleKey: 'usa.info.headerTitle',
  titleKey: 'usa.info.title',
  subtitleKey: 'usa.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'usa.info.sections.visa.title',
      itemsKey: 'usa.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'important',
      titleKey: 'usa.info.sections.important.title',
      itemsKey: 'usa.info.sections.important.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'usa.info.sections.appFeatures.title',
      itemsKey: 'usa.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'usa.info.continueButton',
    screen: 'USARequirements',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default usaInfoScreenConfig;
