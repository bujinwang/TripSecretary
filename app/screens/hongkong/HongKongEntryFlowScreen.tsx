import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { hongkongEntryFlowConfig } from '../../config/destinations/hongkong/entryFlowConfig';

const HongKongEntryFlowScreen = ({ navigation, route }) => (
  <EntryFlowScreenTemplate
    config={hongkongEntryFlowConfig}
    navigation={navigation}
    route={route}
  >
    <EntryFlowScreenTemplate.Header />
    <EntryFlowScreenTemplate.StatusBanner />
    <EntryFlowScreenTemplate.AutoContent />
  </EntryFlowScreenTemplate>
);

export default HongKongEntryFlowScreen;
