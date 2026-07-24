import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { japanRequirementsScreenConfig } from '../../config/destinations/japan/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface JapanRequirementsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const JapanRequirementsScreen = ({ navigation, route }: JapanRequirementsScreenProps) => (
  <EntryRequirementsTemplate config={japanRequirementsScreenConfig as RequirementsScreenConfig} navigation={navigation} route={route} />
);

export default JapanRequirementsScreen;
