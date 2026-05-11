// @ts-nocheck
/**
 * Canada Entry Guide Screen
 * Powered by the shared EntryGuideTemplate.
 */

import React, { useMemo } from 'react';
import { EntryGuideTemplate } from '../../templates';
import { canadaEntryGuide } from '../../config/entryGuide/canada';
import type { RootStackScreenProps } from '../../types/navigation';
import { buildEmergencyTips } from '../../utils/EmergencyContactsBuilder';

type CanadaEntryGuideScreenProps = RootStackScreenProps<'CanadaEntryGuide'>;

const CanadaEntryGuideScreen: React.FC<CanadaEntryGuideScreenProps> = ({ navigation, route }) => {
  const tailoredConfig = useMemo(() => {
    const passport = route?.params?.passport || route?.params?.userData?.passport || {};
    const resident = route?.params?.userData?.personalInfo?.countryRegion || passport?.nationality || '';
    const base = { ...canadaEntryGuide, steps: canadaEntryGuide.steps.map((s) => ({ ...s })) };
    const emergency = base.steps.find((s) => s.id === 'emergency_contacts');
    if (emergency) {
      const tipsEn = buildEmergencyTips({ destination: 'ca', resident, passport: passport?.nationality, language: 'en' });
      const tipsZh = buildEmergencyTips({ destination: 'ca', resident, passport: passport?.nationality, language: 'zh' });
      emergency.tips = tipsEn;
      emergency.tipsZh = tipsZh;
    }
    return base;
  }, [route]);
  return (
    <EntryGuideTemplate
      config={tailoredConfig}
      navigation={navigation}
      route={route}
      onComplete={() => navigation.goBack()}
    >
    <EntryGuideTemplate.Header
      title="加拿大入境指引 🇨🇦"
      titleEn="Canada Entry Guide 🇨🇦"
      titleZh="加拿大入境指引 🇨🇦"
      backLabel="返回"
      backLabelEn="Back"
      backLabelZh="返回"
    />
    <EntryGuideTemplate.AutoContent />
    </EntryGuideTemplate>
  );
};

export default CanadaEntryGuideScreen;
