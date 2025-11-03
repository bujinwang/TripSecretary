import React from 'react';
import PropTypes from 'prop-types';
import { EntryInfoScreenTemplate } from '../../templates';
import { vietnamInfoScreenConfig } from '../../config/destinations/vietnam/infoScreenConfig';

const VietnamInfoScreen = ({ navigation, route }) => (
  <EntryInfoScreenTemplate
    config={vietnamInfoScreenConfig}
    navigation={navigation}
    route={route}
  />
);

VietnamInfoScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default VietnamInfoScreen;
