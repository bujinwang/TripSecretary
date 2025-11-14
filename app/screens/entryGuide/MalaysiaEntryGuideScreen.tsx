/**
 * Malaysia Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { malaysiaEntryGuide as malaysiaGuideConfig } from '../../config/entryGuide/malaysia';
import type { RootStackScreenProps } from '../../types/navigation';

type MalaysiaEntryGuideScreenProps = RootStackScreenProps<'MalaysiaEntryGuide'>;

const MalaysiaEntryGuideScreen: React.FC<MalaysiaEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  return (
    <EntryGuideTemplate
      config={malaysiaGuideConfig}
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
