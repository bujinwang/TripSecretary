/**
 * US Entry Guide Screen
 * Provides step-by-step guidance for US entry process
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { usaEntryGuide } from '../../config/entryGuide/usa';
import type { RootStackScreenProps } from '../../types/navigation';

type USAEntryGuideScreenProps = RootStackScreenProps<'USAEntryGuide'>;

const USAEntryGuideScreen: React.FC<USAEntryGuideScreenProps> = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={usaEntryGuide}
    navigation={navigation}
    route={route}
    onComplete={() => navigation.goBack()}
  >
    <EntryGuideTemplate.Header
      title="US Entry Guide"
      titleEn="US Entry Guide"
      titleZh="美国入境指引"
      backLabel="Back"
      backLabelEn="Back"
      backLabelZh="返回"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

export default USAEntryGuideScreen;

