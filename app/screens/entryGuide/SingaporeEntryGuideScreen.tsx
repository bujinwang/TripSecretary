/**
 * Singapore Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React, { useMemo } from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { singaporeEntryGuide as singaporeGuideConfig } from '../../config/entryGuide/singapore';
import type { RootStackScreenProps } from '../../types/navigation';
import { buildEmergencyTips } from '../../utils/EmergencyContactsBuilder';

type SingaporeEntryGuideScreenProps = RootStackScreenProps<'SingaporeEntryGuide'>;

const SingaporeEntryGuideScreen: React.FC<SingaporeEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const tailoredConfig = useMemo(() => {
    const passport = route?.params?.passport || route?.params?.userData?.passport || {};
    const resident = route?.params?.userData?.personalInfo?.countryRegion || passport?.nationality || '';
    const base = { ...singaporeGuideConfig, steps: singaporeGuideConfig.steps.map((s) => ({ ...s })) };
    const emergency = base.steps.find((s) => s.id === 'emergency_contacts');
    if (emergency) {
      const tipsEn = buildEmergencyTips({ destination: 'sg', resident, passport: passport?.nationality, language: 'en' });
      const tipsZh = buildEmergencyTips({ destination: 'sg', resident, passport: passport?.nationality, language: 'zh' });
      emergency.tips = tipsEn;
      emergency.tipsZh = tipsZh;
    }
    return base;
  }, [route, t]);
  return (
    <EntryGuideTemplate
      config={tailoredConfig}
      navigation={navigation}
      route={route}
      onComplete={() => {}}
    >
      <EntryGuideTemplate.Header
        title={t('dest.singapore.entryGuide.title')}
        titleEn={t('dest.singapore.entryGuide.title')}
        titleZh={t('dest.singapore.entryGuide.titleZh')}
        backLabel={t('common.back')}
        backLabelEn={t('common.back')}
        backLabelZh={t('common.back')}
      />
      <EntryGuideTemplate.AutoContent />
    </EntryGuideTemplate>
  );
};

export default SingaporeEntryGuideScreen;
