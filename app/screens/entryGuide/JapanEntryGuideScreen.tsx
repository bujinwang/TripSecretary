/**
 * Japan Entry Guide Screen
 * Now powered by the reusable EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { japanEntryGuide as japanGuideConfig } from '../../config/entryGuide/japan';
import type { RootStackScreenProps } from '../../types/navigation';

type JapanEntryGuideScreenProps = RootStackScreenProps<'JapanEntryGuide'>;

const JapanEntryGuideScreen: React.FC<JapanEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  return (
    <EntryGuideTemplate
      config={japanGuideConfig}
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
