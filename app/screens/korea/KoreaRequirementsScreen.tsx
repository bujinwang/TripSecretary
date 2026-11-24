import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { koreaRequirementsScreenConfig } from '../../config/destinations/korea/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface KoreaRequirementsScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const KoreaRequirementsScreen = ({ navigation, route }: KoreaRequirementsScreenProps) => (
  <EntryRequirementsTemplate
    config={koreaRequirementsScreenConfig as RequirementsScreenConfig}
    navigation={navigation}
    route={route}
  />
);

export default KoreaRequirementsScreen;
