/**
 * US Entry Guide Screen
 * Provides step-by-step guidance for US entry process
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { usaEntryGuide } from '../../config/entryGuide/usa';
import type { RootStackScreenProps } from '../../types/navigation';
import { useTranslation } from '../../i18n/LocaleContext';

type USAEntryGuideScreenProps = RootStackScreenProps<'USAEntryGuide'>;

const USAEntryGuideScreen: React.FC<USAEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  return (
    <EntryGuideTemplate
      config={usaEntryGuide}
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
