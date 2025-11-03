/**
 * Malaysia Info Screen Configuration
 *
 * Powers MalaysiaInfoScreen via EntryInfoScreenTemplate.
 * Reuses the Vietnam template structure with Malaysia translations.
 */

export const malaysiaInfoScreenConfig = {
  flag: '🇲🇾',
  headerTitleKey: 'malaysia.info.headerTitle',
  titleKey: 'malaysia.info.title',
  subtitleKey: 'malaysia.info.subtitle',
  sections: [
    {
      key: 'visa',
      titleKey: 'malaysia.info.sections.visa.title',
      itemsKey: 'malaysia.info.sections.visa.items',
      variant: 'info',
    },
    {
      key: 'onsite',
      titleKey: 'malaysia.info.sections.onsite.title',
      itemsKey: 'malaysia.info.sections.onsite.items',
      variant: 'warning',
    },
    {
      key: 'appFeatures',
      titleKey: 'malaysia.info.sections.appFeatures.title',
      itemsKey: 'malaysia.info.sections.appFeatures.items',
      variant: 'highlight',
    },
  ],
  primaryAction: {
    labelKey: 'malaysia.info.continueButton',
    screen: 'MalaysiaRequirements',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default malaysiaInfoScreenConfig;
