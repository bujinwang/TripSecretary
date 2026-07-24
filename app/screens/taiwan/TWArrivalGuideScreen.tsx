/**
 * Taiwan Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate with tabs for steps.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { taiwanEntryGuide as taiwanGuideConfig } from '../../config/entryGuide/taiwan';
import type { RootStackScreenProps } from '../../types/navigation';

type TWArrivalGuideScreenProps = RootStackScreenProps<'TWArrivalGuide'>;

const TWArrivalGuideScreen: React.FC<TWArrivalGuideScreenProps> = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={taiwanGuideConfig}
    navigation={navigation}
    route={route}
    onComplete={() => navigation.goBack()}
  >
    <EntryGuideTemplate.Header
      title="台湾入境卡引导模式"
      titleEn="Taiwan Arrival Card Guided Mode"
      titleZh="台湾入境卡引导模式"
      backLabel="返回"
      backLabelEn="Back"
      backLabelZh="返回"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

export default TWArrivalGuideScreen;
