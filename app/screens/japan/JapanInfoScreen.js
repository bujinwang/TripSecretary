import React from 'react';
import PropTypes from 'prop-types';
import { EntryInfoScreenTemplate } from '../../templates';
import { japanInfoScreenConfig } from '../../config/destinations/japan/infoScreenConfig';

const JapanInfoScreen = ({ navigation, route }) => (
  <EntryInfoScreenTemplate
    config={japanInfoScreenConfig}
    navigation={navigation}
    route={route}
  />
);

JapanInfoScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default JapanInfoScreen;
