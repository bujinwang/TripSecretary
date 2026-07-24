/**
 * Thailand Info Screen - Template Implementation
 */
import React from 'react';
import { EntryInfoScreenTemplate } from '../../templates';
import { thailandInfoScreenConfig } from '../../config/destinations/thailand/infoScreenConfig';
import type { InfoScreenConfig } from '../../config/destinations/types';

interface ThailandInfoScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const ThailandInfoScreen = ({ navigation, route }: ThailandInfoScreenProps) => (
  <EntryInfoScreenTemplate config={thailandInfoScreenConfig as InfoScreenConfig} navigation={navigation} route={route} />
);

export default ThailandInfoScreen;
