/**
 * Malaysia Entry Pack Preview Screen
 * Refactored to use the shared EntryPackPreviewTemplate.
 */
import React from 'react';
import { EntryPackPreviewTemplate } from '../../templates';
import { malaysiaEntryPackPreviewConfig } from '../../config/destinations/malaysia/entryPackPreviewConfig';

interface MalaysiaEntryPackPreviewScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const MalaysiaEntryPackPreviewScreen = ({ navigation, route }: MalaysiaEntryPackPreviewScreenProps) => (
  <EntryPackPreviewTemplate config={malaysiaEntryPackPreviewConfig} navigation={navigation} route={route}>
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

export default MalaysiaEntryPackPreviewScreen;
