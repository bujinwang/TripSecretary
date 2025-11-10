// @ts-nocheck

export const hongkongInfoScreenConfig = {
  flag: '🇭🇰',
  headerTitleKey: 'hongkong.info.headerTitle',
  titleKey: 'hongkong.info.title',
  subtitleKey: 'hongkong.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'hongkong.info.sections.visa.title',
      itemsKey: 'hongkong.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'onsite',
      titleKey: 'hongkong.info.sections.onsite.title',
      itemsKey: 'hongkong.info.sections.onsite.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'hongkong.info.sections.appFeatures.title',
      itemsKey: 'hongkong.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'hongkong.info.continueButton',
    screen: 'HongKongRequirements',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default hongkongInfoScreenConfig;
