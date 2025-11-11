// @ts-nocheck
/**
 * Japan Entry Guide Screen
 * Now powered by the reusable EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { japanEntryGuide as japanGuideConfig } from '../../config/entryGuide/japan';

interface JapanEntryGuideScreenProps {
  navigation: {
    goBack: () => void;
  };
  route?: any;
}

const JapanEntryGuideScreen: React.FC<JapanEntryGuideScreenProps> = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={japanGuideConfig}
    navigation={navigation}
    route={route}
    onComplete={() => {}}
  >
    <EntryGuideTemplate.Header
      title="日本入境指引 🇯🇵"
      titleEn="Japan Entry Guide 🇯🇵"
      titleZh="日本入境指引 🇯🇵"
      backLabel="返回"
      backLabelEn="Back"
      backLabelZh="返回"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

export default JapanEntryGuideScreen;