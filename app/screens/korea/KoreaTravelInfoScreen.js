/**
 * Korea Travel Info Screen - Template Implementation
 *
 * PRODUCTION VERSION using EnhancedTravelInfoTemplate
 *
 * This is the main Korea travel info screen used by the app.
 * It leverages the enhanced template to provide Thailand-grade features
 * with minimal code.
 */

import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { koreaComprehensiveTravelInfoConfig } from '../../config/destinations/korea/comprehensiveTravelInfoConfig';

const KoreaTravelInfoScreen = ({ navigation, route }) => {
  return (
    <EnhancedTravelInfoTemplate
      config={koreaComprehensiveTravelInfoConfig}
      route={route}
      navigation={navigation}
    />
  );
};

export default KoreaTravelInfoScreen;
