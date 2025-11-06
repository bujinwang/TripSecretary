import React from 'react';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { hongkongComprehensiveTravelInfoConfig } from '../../config/destinations/hongkong/comprehensiveTravelInfoConfig';

const HongkongTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={hongkongComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

export default HongkongTravelInfoScreen;
