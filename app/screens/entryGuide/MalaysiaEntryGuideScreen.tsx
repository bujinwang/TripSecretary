/**
 * Malaysia Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React, { useMemo } from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { malaysiaEntryGuide as malaysiaGuideConfig } from '../../config/entryGuide/malaysia';
import type { RootStackScreenProps } from '../../types/navigation';
import { buildEmergencyTips } from '../../utils/EmergencyContactsBuilder';

type MalaysiaEntryGuideScreenProps = RootStackScreenProps<'MalaysiaEntryGuide'>;

const MalaysiaEntryGuideScreen: React.FC<MalaysiaEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const tailoredConfig = useMemo(() => {
    const passport = route?.params?.passport || route?.params?.userData?.passport || {};
    const resident = route?.params?.userData?.personalInfo?.countryRegion || passport?.nationality || '';
    const base = { ...malaysiaGuideConfig, steps: malaysiaGuideConfig.steps.map((s) => ({ ...s })) };
    const emergency = base.steps.find((s) => s.id === 'emergency_contacts');
    if (emergency) {
      const tipsEn = buildEmergencyTips({ destination: 'my', resident, passport: passport?.nationality, language: 'en' });
      const tipsZh = buildEmergencyTips({ destination: 'my', resident, passport: passport?.nationality, language: 'zh' });
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
        title={t('dest.malaysia.entryGuide.title')}
        titleEn={t('dest.malaysia.entryGuide.title')}
        titleZh={t('dest.malaysia.entryGuide.titleZh')}
        backLabel={t('common.back')}
        backLabelEn={t('common.back')}
        backLabelZh={t('common.back')}
      />
      <EntryGuideTemplate.AutoContent />
    </EntryGuideTemplate>
  );
};

export default MalaysiaEntryGuideScreen;
