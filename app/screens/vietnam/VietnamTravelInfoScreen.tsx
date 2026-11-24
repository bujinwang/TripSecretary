/**
 * Vietnam Travel Info Screen - Template Implementation
 * PRODUCTION VERSION using EnhancedTravelInfoTemplate
 */

import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { vietnamComprehensiveTravelInfoConfig } from '../../config/destinations/vietnam/comprehensiveTravelInfoConfig';

interface VietnamTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const VietnamTravelInfoScreen = ({ navigation, route }: VietnamTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate config={vietnamComprehensiveTravelInfoConfig} route={route} navigation={navigation} />
);

export default VietnamTravelInfoScreen;
