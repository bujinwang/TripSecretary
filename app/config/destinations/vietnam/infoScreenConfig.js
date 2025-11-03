export const vietnamInfoScreenConfig = {
  flag: '🇻🇳',
  headerTitleKey: 'vietnam.info.headerTitle',
  titleKey: 'vietnam.info.title',
  subtitleKey: 'vietnam.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'vietnam.info.sections.visa.title',
      itemsKey: 'vietnam.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'onsite',
      titleKey: 'vietnam.info.sections.onsite.title',
      itemsKey: 'vietnam.info.sections.onsite.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'vietnam.info.sections.appFeatures.title',
      itemsKey: 'vietnam.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'vietnam.info.continueButton',
    screen: 'VietnamRequirements',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default vietnamInfoScreenConfig;
