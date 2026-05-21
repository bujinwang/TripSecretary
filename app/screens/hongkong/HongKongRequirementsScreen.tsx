import React from 'react';
import { EntryRequirementsTemplate } from '../../templates';
import { hongkongRequirementsScreenConfig } from '../../config/destinations/hongkong/requirementsScreenConfig';
import type { RequirementsScreenConfig } from '../../config/destinations/types';

interface HongKongRequirementsScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const HongKongRequirementsScreen = ({ navigation, route }: HongKongRequirementsScreenProps) => (
  <EntryRequirementsTemplate config={hongkongRequirementsScreenConfig as RequirementsScreenConfig} navigation={navigation} route={route} />
);

export default HongKongRequirementsScreen;
