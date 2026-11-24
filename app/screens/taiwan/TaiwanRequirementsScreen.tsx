import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { taiwanRequirementsScreenConfig } from '../../config/destinations/taiwan/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface TaiwanRequirementsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const TaiwanRequirementsScreen = ({ navigation, route }: TaiwanRequirementsScreenProps) => (
  <EntryRequirementsTemplate config={taiwanRequirementsScreenConfig as RequirementsScreenConfig} navigation={navigation} route={route} />
);

export default TaiwanRequirementsScreen;
