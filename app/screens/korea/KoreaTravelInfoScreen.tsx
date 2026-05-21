/**
 * Korea Travel Info Screen - Template Implementation
 *
 * PRODUCTION VERSION using EnhancedTravelInfoTemplate
 */

import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { koreaComprehensiveTravelInfoConfig } from '../../config/destinations/korea/comprehensiveTravelInfoConfig';

interface KoreaTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const KoreaTravelInfoScreen = ({ navigation, route }: KoreaTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate
    config={koreaComprehensiveTravelInfoConfig}
    route={route}
    navigation={navigation}
  />
);

export default KoreaTravelInfoScreen;
