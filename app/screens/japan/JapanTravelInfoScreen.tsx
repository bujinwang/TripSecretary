import React from 'react';
import PropTypes from 'prop-types';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { japanComprehensiveTravelInfoConfig } from '../../config/destinations/japan/comprehensiveTravelInfoConfig';

const JapanTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={japanComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

JapanTravelInfoScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

export default JapanTravelInfoScreen;
