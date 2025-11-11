/**
 * Canada Entry Guide Screen
 * Powered by the shared EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { canadaEntryGuide } from '../../config/entryGuide/canada';
import type { RootStackScreenProps } from '../../types/navigation';

type CanadaEntryGuideScreenProps = RootStackScreenProps<'CanadaEntryGuide'>;

const CanadaEntryGuideScreen: React.FC<CanadaEntryGuideScreenProps> = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={canadaEntryGuide}
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

export default CanadaEntryGuideScreen;
