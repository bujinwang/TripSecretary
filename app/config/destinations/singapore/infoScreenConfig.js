export const singaporeInfoScreenConfig = {
  flag: '🇸🇬',
  headerTitleKey: 'singapore.info.headerTitle',
  titleKey: 'singapore.info.title',
  subtitleKey: 'singapore.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'singapore.info.sections.visa.title',
      itemsKey: 'singapore.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'onsite',
      titleKey: 'singapore.info.sections.onsite.title',
      itemsKey: 'singapore.info.sections.onsite.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'singapore.info.sections.appFeatures.title',
      itemsKey: 'singapore.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'singapore.info.continueButton',
    screen: 'SingaporeRequirements',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default singaporeInfoScreenConfig;
