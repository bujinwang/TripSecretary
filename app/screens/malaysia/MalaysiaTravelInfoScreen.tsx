import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { malaysiaComprehensiveTravelInfoConfig } from '../../config/destinations/malaysia/comprehensiveTravelInfoConfig';

interface MalaysiaTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const MalaysiaTravelInfoScreen = ({ navigation, route }: MalaysiaTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate config={malaysiaComprehensiveTravelInfoConfig} navigation={navigation} route={route} />
);

export default MalaysiaTravelInfoScreen;
