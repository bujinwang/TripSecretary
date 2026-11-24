/**
 * Thailand Travel Info Screen - Template Implementation
 * PRODUCTION VERSION using EnhancedTravelInfoTemplate
 */
import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { thailandComprehensiveTravelInfoConfig } from '../../config/destinations/thailand/comprehensiveTravelInfoConfig';

interface ThailandTravelInfoScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const ThailandTravelInfoScreen = ({ navigation, route }: ThailandTravelInfoScreenProps) => (
  <EnhancedTravelInfoTemplate config={thailandComprehensiveTravelInfoConfig} route={route} navigation={navigation} />
);

export default ThailandTravelInfoScreen;
