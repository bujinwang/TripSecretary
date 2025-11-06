export const singaporeRequirementsScreenConfig = {
  headerTitleKey: 'singapore.requirements.headerTitle',
  introTitleKey: 'singapore.requirements.introTitle',
  introSubtitleKey: 'singapore.requirements.introSubtitle',
  requirements: [
    {
      key: 'validPassport',
      titleKey: 'singapore.requirements.items.validPassport.title',
      descriptionKey: 'singapore.requirements.items.validPassport.description',
      detailsKey: 'singapore.requirements.items.validPassport.details',
    },
    {
      key: 'submissionWindow',
      titleKey: 'singapore.requirements.items.submissionWindow.title',
      descriptionKey: 'singapore.requirements.items.submissionWindow.description',
      detailsKey: 'singapore.requirements.items.submissionWindow.details',
    },
    {
      key: 'travelDetails',
      titleKey: 'singapore.requirements.items.travelDetails.title',
      descriptionKey: 'singapore.requirements.items.travelDetails.description',
      detailsKey: 'singapore.requirements.items.travelDetails.details',
    },
    {
      key: 'familyGroups',
      titleKey: 'singapore.requirements.items.familyGroups.title',
      descriptionKey: 'singapore.requirements.items.familyGroups.description',
      detailsKey: 'singapore.requirements.items.familyGroups.details',
    },
    {
      key: 'sgArrivalHistory',
      titleKey: 'singapore.requirements.items.sgArrivalHistory.title',
      descriptionKey: 'singapore.requirements.items.sgArrivalHistory.description',
      detailsKey: 'singapore.requirements.items.sgArrivalHistory.details',
    },
  ],
  infoBox: {
    icon: 'ℹ️',
    titleKey: 'singapore.requirements.status.info.title',
    subtitleKey: 'singapore.requirements.status.info.subtitle',
  },
  successBox: {
    icon: '✅',
    titleKey: 'singapore.requirements.status.success.title',
    subtitleKey: 'singapore.requirements.status.success.subtitle',
  },
  warningBox: {
    icon: '⚠️',
    titleKey: 'singapore.requirements.status.warning.title',
    subtitleKey: 'singapore.requirements.status.warning.subtitle',
  },
  primaryAction: {
    labelKey: 'singapore.requirements.startButton',
    screen: 'SingaporeTravelInfo',
    buildParams: ({ passport, destination }) => ({
      passport,
      destination,
    }),
  },
};

export default singaporeRequirementsScreenConfig;
