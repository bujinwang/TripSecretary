/**
 * Vietnam Entry Guide Screen
 * Now powered by the reusable EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { vietnamEntryGuide as vietnamGuideConfig } from '../../config/entryGuide/vietnam';
import type { RootStackScreenProps } from '../../types/navigation';

type VietnamEntryGuideScreenProps = RootStackScreenProps<'VietnamEntryGuide'>;

const VietnamEntryGuideScreen: React.FC<VietnamEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  return (
    <EntryGuideTemplate
      config={vietnamGuideConfig}
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
