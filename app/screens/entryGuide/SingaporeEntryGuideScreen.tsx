/**
 * Singapore Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
// import { singaporeEntryGuide as singaporeGuideConfig } from '../../config/entryGuide/singapore';

interface SingaporeEntryGuideScreenProps {
  navigation: {
    goBack: () => void;
  };
  route?: any;
}

const SingaporeEntryGuideScreen: React.FC<SingaporeEntryGuideScreenProps> = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={{} as any} // Temporary empty config
    navigation={navigation}
    route={route}
    onComplete={() => {}}
  >
    <EntryGuideTemplate.Header
      title="新加坡入境指引 🇸🇬"
      titleEn="Singapore Entry Guide 🇸🇬"
      titleZh="新加坡入境指引 🇸🇬"
      backLabel="返回"
      backLabelEn="Back"
      backLabelZh="返回"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

export default SingaporeEntryGuideScreen;