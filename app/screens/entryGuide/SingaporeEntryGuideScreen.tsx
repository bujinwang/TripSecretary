/**
 * Singapore Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { singaporeEntryGuide as singaporeGuideConfig } from '../../config/entryGuide/singapore';
import type { RootStackScreenProps } from '../../types/navigation';

type SingaporeEntryGuideScreenProps = RootStackScreenProps<'SingaporeEntryGuide'>;

const SingaporeEntryGuideScreen: React.FC<SingaporeEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  return (
    <EntryGuideTemplate
      config={singaporeGuideConfig}
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
