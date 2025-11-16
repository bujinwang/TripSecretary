// @ts-nocheck

export const singaporeInfoScreenConfig = {
  flag: '🇸🇬',
  headerTitleKey: 'sg.info.headerTitle',
  titleKey: 'sg.info.title',
  subtitleKey: 'sg.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'sg.info.sections.visa.title',
      itemsKey: 'sg.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'onsite',
      titleKey: 'sg.info.sections.onsite.title',
      itemsKey: 'sg.info.sections.onsite.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'sg.info.sections.appFeatures.title',
      itemsKey: 'sg.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'sg.info.continueButton',
    screen: 'SingaporeRequirements',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default singaporeInfoScreenConfig;
