/**
 * Vietnam Travel Info Screen - Template Implementation
 *
 * PRODUCTION VERSION using EnhancedTravelInfoTemplate
 *
 * This is the main Vietnam travel info screen used by the app.
 * It leverages the enhanced template to provide Thailand-grade features
 * with minimal code.
 */

import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { vietnamComprehensiveTravelInfoConfig } from '../../config/destinations/vietnam/comprehensiveTravelInfoConfig';

const VietnamTravelInfoScreen = ({ navigation, route }) => {
  return (
    <EnhancedTravelInfoTemplate
      config={vietnamComprehensiveTravelInfoConfig}
      route={route}
      navigation={navigation}
    />
  );
};

export default VietnamTravelInfoScreen;
