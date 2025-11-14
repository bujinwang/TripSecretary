/**
 * Hong Kong Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { useTranslation } from '../../i18n/LocaleContext';
import { hongkongEntryGuide as hongkongGuideConfig } from '../../config/entryGuide/hongkong';
import type { RootStackScreenProps } from '../../types/navigation';

type HongKongEntryGuideScreenProps = RootStackScreenProps<'HongKongEntryGuide'>;

const HongKongEntryGuideScreen: React.FC<HongKongEntryGuideScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  return (
    <EntryGuideTemplate
      config={hongkongGuideConfig}
      navigation={navigation}
      route={route}
      onComplete={() => {}}
    >
      <EntryGuideTemplate.Header
        title={t('dest.hongkong.entryGuide.title')}
        titleEn={t('dest.hongkong.entryGuide.title')}
        titleZh={t('dest.hongkong.entryGuide.titleZh')}
        backLabel={t('common.back')}
        backLabelEn={t('common.back')}
        backLabelZh={t('common.back')}
      />
      <EntryGuideTemplate.AutoContent />
    </EntryGuideTemplate>
  );
};

export default HongKongEntryGuideScreen;
