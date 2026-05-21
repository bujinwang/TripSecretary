import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { singaporeRequirementsScreenConfig } from '../../config/destinations/singapore/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface SingaporeRequirementsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const SingaporeRequirementsScreen = ({ navigation, route }: SingaporeRequirementsScreenProps) => (
  <EntryRequirementsTemplate config={singaporeRequirementsScreenConfig as RequirementsScreenConfig} navigation={navigation} route={route} />
);

export default SingaporeRequirementsScreen;
