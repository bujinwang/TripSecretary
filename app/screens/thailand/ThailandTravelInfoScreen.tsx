/**
 * Thailand Travel Info Screen - Template Implementation
 *
 * PRODUCTION VERSION using EnhancedTravelInfoTemplate
 *
 * This is the main Thailand travel info screen used by the app.
 * It leverages the enhanced template to provide Thailand-grade features
 * with minimal code.
 */

import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { thailandComprehensiveTravelInfoConfig } from '../../config/destinations/thailand/comprehensiveTravelInfoConfig';

const ThailandTravelInfoScreen = ({ navigation, route }) => {
  return (
    <EnhancedTravelInfoTemplate
      config={thailandComprehensiveTravelInfoConfig}
      route={route}
      navigation={navigation}
    />
  );
};

export default ThailandTravelInfoScreen;
