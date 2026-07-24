/**
 * Vietnam Entry Guide Screen
 * Now powered by the reusable EntryGuideTemplate.
 */

import React, { useMemo } from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { vietnamEntryGuide as vietnamGuideConfig } from '../../config/entryGuide/vietnam';
import type { RootStackScreenProps } from '../../types/navigation';
import { buildEmergencyTips } from '../../utils/EmergencyContactsBuilder';

type VietnamEntryGuideScreenProps = RootStackScreenProps<'VietnamEntryGuide'>;

const VietnamEntryGuideScreen: React.FC<VietnamEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const tailoredConfig = useMemo(() => {
    const passport = route?.params?.passport || route?.params?.userData?.passport || {};
    const resident = route?.params?.userData?.personalInfo?.countryRegion || passport?.nationality || '';
    const base = { ...vietnamGuideConfig, steps: vietnamGuideConfig.steps.map((s) => ({ ...s })) };
    const emergency = base.steps.find((s) => s.id === 'emergency_contacts');
    if (emergency) {
      const tipsEn = buildEmergencyTips({ destination: 'vn', resident, passport: passport?.nationality, language: 'en' });
      const tipsZh = buildEmergencyTips({ destination: 'vn', resident, passport: passport?.nationality, language: 'zh' });
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
        title={t('dest.vietnam.entryGuide.title')}
        titleEn={t('dest.vietnam.entryGuide.title')}
        titleZh={t('dest.vietnam.entryGuide.titleZh')}
        backLabel={t('common.back')}
        backLabelEn={t('common.back')}
        backLabelZh={t('common.back')}
      />
      <EntryGuideTemplate.AutoContent />
    </EntryGuideTemplate>
  );
};

export default VietnamEntryGuideScreen;
