import React from 'react';
import PropTypes from 'prop-types';
import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate';
import { hongkongComprehensiveTravelInfoConfig } from '../../config/destinations/hongkong/comprehensiveTravelInfoConfig';

const HongKongTravelInfoScreen = ({ navigation, route }) => (
  <EnhancedTravelInfoTemplate
    config={hongkongComprehensiveTravelInfoConfig}
    navigation={navigation}
    route={route}
  />
);

HongKongTravelInfoScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
};

export default HongKongTravelInfoScreen;
