/**
 * US Entry Guide Screen
 * Provides step-by-step guidance for US entry process
 */

import React, { useMemo } from 'react';
import { EntryGuideTemplate } from '../../templates';
import { usaEntryGuide } from '../../config/entryGuide/usa';
import type { RootStackScreenProps } from '../../types/navigation';
import { useTranslation } from '../../i18n/LocaleContext';
import { buildEmergencyTips } from '../../utils/EmergencyContactsBuilder';

type USAEntryGuideScreenProps = RootStackScreenProps<'USAEntryGuide'>;

const USAEntryGuideScreen: React.FC<USAEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const tailoredConfig = useMemo(() => {
    const passport = route?.params?.passport || route?.params?.userData?.passport || {};
    const resident = route?.params?.userData?.personalInfo?.countryRegion || passport?.nationality || '';
    const base = { ...usaEntryGuide, steps: usaEntryGuide.steps.map((s) => ({ ...s })) };
    const emergency = base.steps.find((s) => s.id === 'emergency_contacts');
    if (emergency) {
      const tipsEn = buildEmergencyTips({ destination: 'us', resident, passport: passport?.nationality, language: 'en' });
      const tipsZh = buildEmergencyTips({ destination: 'us', resident, passport: passport?.nationality, language: 'zh' });
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
      onComplete={() => navigation.goBack()}
    >
      <EntryGuideTemplate.Header
        title={t('dest.usa.entryGuide.title', { defaultValue: 'US Entry Guide' })}
        titleEn={t('dest.usa.entryGuide.title', { defaultValue: 'US Entry Guide' })}
        titleZh={t('dest.usa.entryGuide.title.zh', { defaultValue: '美国入境指引' })}
        backLabel={t('common.back')}
        backLabelEn={t('common.back')}
        backLabelZh={t('common.back.zh', { defaultValue: '返回' })}
      />
      <EntryGuideTemplate.AutoContent />
    </EntryGuideTemplate>
  );
};

export default USAEntryGuideScreen;
