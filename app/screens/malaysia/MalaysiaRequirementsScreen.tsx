import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { malaysiaRequirementsScreenConfig } from '../../config/destinations/malaysia/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface MalaysiaRequirementsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const MalaysiaRequirementsScreen = ({ navigation, route }: MalaysiaRequirementsScreenProps) => (
  <EntryRequirementsTemplate config={malaysiaRequirementsScreenConfig as RequirementsScreenConfig} navigation={navigation} route={route} />
);

export default MalaysiaRequirementsScreen;
