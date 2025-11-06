import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { usaEntryFlowConfig } from '../../config/destinations/usa/entryFlowConfig';

const USAEntryFlowScreen = ({ navigation, route }) => (
  <EntryFlowScreenTemplate
    config={usaEntryFlowConfig}
    navigation={navigation}
    route={route}
  >
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default USAEntryFlowScreen;
