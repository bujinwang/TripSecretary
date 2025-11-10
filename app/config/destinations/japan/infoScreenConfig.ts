// @ts-nocheck

export const japanInfoScreenConfig = {
  flag: '🇯🇵',
  headerTitleKey: 'japan.info.headerTitle',
  titleKey: 'japan.info.title',
  subtitleKey: 'japan.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'japan.info.sections.visa.title',
      itemsKey: 'japan.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'onsite',
      titleKey: 'japan.info.sections.onsite.title',
      itemsKey: 'japan.info.sections.onsite.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'japan.info.sections.appFeatures.title',
      itemsKey: 'japan.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'japan.info.continueButton',
    screen: 'JapanRequirements',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default japanInfoScreenConfig;