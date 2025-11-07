import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { taiwanEntryFlowConfig } from '../../config/destinations/taiwan/entryFlowConfig';

const TaiwanEntryFlowScreen = ({ navigation, route }) => (
  <EntryFlowScreenTemplate
    config={taiwanEntryFlowConfig}
    navigation={navigation}
    route={route}
  >
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default TaiwanEntryFlowScreen;
