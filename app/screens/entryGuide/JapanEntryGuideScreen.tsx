/**
 * Japan Entry Guide Screen
 * Now powered by the reusable EntryGuideTemplate.
 */

import React, { useMemo } from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { japanEntryGuide as japanGuideConfig } from '../../config/entryGuide/japan';
import type { RootStackScreenProps } from '../../types/navigation';
import { buildEmergencyTips } from '../../utils/EmergencyContactsBuilder';

type JapanEntryGuideScreenProps = RootStackScreenProps<'JapanEntryGuide'>;

const JapanEntryGuideScreen: React.FC<JapanEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const tailoredConfig = useMemo(() => {
    const passport = route?.params?.passport || route?.params?.userData?.passport || {};
    const resident = route?.params?.userData?.personalInfo?.countryRegion || passport?.nationality || '';
    const base = { ...japanGuideConfig, steps: japanGuideConfig.steps.map((s) => ({ ...s })) };
    const emergency = base.steps.find((s) => s.id === 'emergency_contacts');
    if (emergency) {
      const tipsEn = buildEmergencyTips({ destination: 'jp', resident, passport: passport?.nationality, language: 'en' });
      const tipsZh = buildEmergencyTips({ destination: 'jp', resident, passport: passport?.nationality, language: 'zh' });
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
        title={t('dest.japan.entryGuide.title')}
        titleEn={t('dest.japan.entryGuide.title')}
        titleZh={t('dest.japan.entryGuide.titleZh')}
        backLabel={t('common.back')}
        backLabelEn={t('common.back')}
        backLabelZh={t('common.back')}
      />
      <EntryGuideTemplate.AutoContent />
    </EntryGuideTemplate>
  );
};

export default JapanEntryGuideScreen;
