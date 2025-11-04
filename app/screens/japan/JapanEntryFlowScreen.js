/**
 * Japan Entry Flow Screen - Template Implementation
 *
 * Following Vietnam's exact template pattern with explicit children.
 * Uses EntryFlowScreenTemplate with Header, StatusBanner, AutoContent.
 */

import React from 'react';
import { EntryFlowScreenTemplate } from '../../templates';
import { japanEntryFlowConfig } from '../../config/destinations/japan/entryFlowConfig';

const JapanEntryFlowScreen = ({ navigation, route }) => {
  return (
    <EntryFlowScreenTemplate
      config={japanEntryFlowConfig}
      route={route}
      navigation={navigation}
    >
      {/* Header with back button + title */}
      <EntryFlowScreenTemplate.Header />

      {/* Status banner (Ready/Almost There/Please Complete) */}
      <EntryFlowScreenTemplate.StatusBanner />

      {/* Scrollable content with pull-to-refresh */}
      <EntryFlowScreenTemplate.ScrollContainer>
        {/* Completion progress card with percentage */}
        <EntryFlowScreenTemplate.CompletionCard />

        {/* Category cards (Passport, Personal, Funds, Travel) */}
        <EntryFlowScreenTemplate.Categories />

        {/* Submission countdown (only if country has submission window) */}
        <EntryFlowScreenTemplate.SubmissionCountdown />

        {/* Action buttons (Submit / Continue Editing) */}
        <EntryFlowScreenTemplate.ActionButtons />
      </EntryFlowScreenTemplate.ScrollContainer>
    </EntryFlowScreenTemplate>
  );
};

export default JapanEntryFlowScreen;
