/**
 * Vietnam Entry Guide Screen
 * Now powered by the reusable EntryGuideTemplate.
 */

import React from 'react';
import { EntryGuideTemplate } from '../../templates';
import { vietnamEntryGuide as vietnamGuideConfig } from '../../config/entryGuide/vietnam';

interface VietnamEntryGuideScreenProps {
  navigation: {
    goBack: () => void;
  };
  route?: any;
}

const VietnamEntryGuideScreen: React.FC<VietnamEntryGuideScreenProps> = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={vietnamGuideConfig}
    navigation={navigation}
    route={route}
    onComplete={() => {}}
  >
    <EntryGuideTemplate.Header
      title="越南入境指引 🇻🇳"
      titleEn="Vietnam Entry Guide 🇻🇳"
      titleZh="越南入境指引 🇻🇳"
      backLabel="返回"
      backLabelEn="Back"
      backLabelZh="返回"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

export default VietnamEntryGuideScreen;
