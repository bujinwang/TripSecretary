import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { vietnamRequirementsScreenConfig } from '../../config/destinations/vietnam/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface VietnamRequirementsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const VietnamRequirementsScreen = ({ navigation, route }: VietnamRequirementsScreenProps) => (
  <EntryRequirementsTemplate config={vietnamRequirementsScreenConfig as RequirementsScreenConfig} navigation={navigation} route={route} />
);

export default VietnamRequirementsScreen;
