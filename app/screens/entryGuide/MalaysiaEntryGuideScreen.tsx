/**
 * Malaysia Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
// import { malaysiaEntryGuide as malaysiaGuideConfig } from '../../config/entryGuide/malaysia';

interface MalaysiaEntryGuideScreenProps {
  navigation: {
    goBack: () => void;
  };
  route?: any;
}

const MalaysiaEntryGuideScreen: React.FC<MalaysiaEntryGuideScreenProps> = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={{} as any} // Temporary empty config
    navigation={navigation}
    route={route}
    onComplete={() => {}}
  >
    <EntryGuideTemplate.Header
      title="马来西亚入境指引 🇲🇾"
      titleEn="Malaysia Entry Guide 🇲🇾"
      titleZh="马来西亚入境指引 🇲🇾"
      backLabel="返回"
      backLabelEn="Back"
      backLabelZh="返回"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

export default MalaysiaEntryGuideScreen;