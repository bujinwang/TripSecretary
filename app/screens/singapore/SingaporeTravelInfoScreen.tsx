import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { singaporeComprehensiveTravelInfoConfig } from '../../config/destinations/singapore/comprehensiveTravelInfoConfig';

interface SingaporeTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const SingaporeTravelInfoScreen = ({ navigation, route }: SingaporeTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate config={singaporeComprehensiveTravelInfoConfig} navigation={navigation} route={route} />
);

export default SingaporeTravelInfoScreen;
