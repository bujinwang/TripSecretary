/**
 * Thailand Requirements Screen - Template Implementation
 */
import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { thailandRequirementsScreenConfig } from '../../config/destinations/thailand/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface ThailandRequirementsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const ThailandRequirementsScreen = ({ navigation, route }: ThailandRequirementsScreenProps) => (
  <EntryRequirementsTemplate config={thailandRequirementsScreenConfig as RequirementsScreenConfig} navigation={navigation} route={route} />
);

export default ThailandRequirementsScreen;
