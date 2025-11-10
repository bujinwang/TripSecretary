// @ts-nocheck

export const taiwanInfoScreenConfig = {
  flag: '🇹🇼',
  headerTitleKey: 'taiwan.info.headerTitle',
  titleKey: 'taiwan.info.title',
  subtitleKey: 'taiwan.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'taiwan.info.sections.visa.title',
      itemsKey: 'taiwan.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'onsite',
      titleKey: 'taiwan.info.sections.onsite.title',
      itemsKey: 'taiwan.info.sections.onsite.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'taiwan.info.sections.appFeatures.title',
      itemsKey: 'taiwan.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'taiwan.info.continueButton',
    screen: 'TaiwanRequirements',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default taiwanInfoScreenConfig;
