import React from 'react';
import PropTypes from 'prop-types';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { taiwanComprehensiveTravelInfoConfig } from '../../config/destinations/taiwan/comprehensiveTravelInfoConfig';

const TaiwanTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={taiwanComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

TaiwanTravelInfoScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

export default TaiwanTravelInfoScreen;
