import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { usaRequirementsScreenConfig } from '../../config/destinations/usa/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface USARequirementsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const USARequirementsScreen = ({ navigation, route }: USARequirementsScreenProps) => (
  <EntryRequirementsTemplate config={usaRequirementsScreenConfig as RequirementsScreenConfig} navigation={navigation} route={route} />
);

export default USARequirementsScreen;
