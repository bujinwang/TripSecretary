// @ts-nocheck

export const taiwanRequirementsScreenConfig = {
  headerTitleKey: 'taiwan.requirements.headerTitle',
  introTitleKey: 'taiwan.requirements.introTitle',
  introSubtitleKey: 'taiwan.requirements.introSubtitle',
  requirements: [
    {
      key: 'entryPermit',
      titleKey: 'taiwan.requirements.items.entryPermit.title',
      descriptionKey: 'taiwan.requirements.items.entryPermit.description',
      detailsKey: 'taiwan.requirements.items.entryPermit.details',
    },
    {
      key: 'validPassport',
      titleKey: 'taiwan.requirements.items.validPassport.title',
      descriptionKey: 'taiwan.requirements.items.validPassport.description',
      detailsKey: 'taiwan.requirements.items.validPassport.details',
    },
    {
      key: 'returnTicket',
      titleKey: 'taiwan.requirements.items.returnTicket.title',
      descriptionKey: 'taiwan.requirements.items.returnTicket.description',
      detailsKey: 'taiwan.requirements.items.returnTicket.details',
    },
    {
      key: 'accommodation',
      titleKey: 'taiwan.requirements.items.accommodation.title',
      descriptionKey: 'taiwan.requirements.items.accommodation.description',
      detailsKey: 'taiwan.requirements.items.accommodation.details',
    },
  ],
  infoBox: {
    icon: 'ℹ️',
    titleKey: 'taiwan.requirements.status.info.title',
    subtitleKey: 'taiwan.requirements.status.info.subtitle',
  },
  successBox: {
    icon: '✅',
    titleKey: 'taiwan.requirements.status.success.title',
    subtitleKey: 'taiwan.requirements.status.success.subtitle',
  },
  warningBox: {
    icon: '⚠️',
    titleKey: 'taiwan.requirements.status.warning.title',
    subtitleKey: 'taiwan.requirements.status.warning.subtitle',
  },
  primaryAction: {
    labelKey: 'taiwan.requirements.continueButton',
    screen: 'TaiwanTravelInfo',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default taiwanRequirementsScreenConfig;
