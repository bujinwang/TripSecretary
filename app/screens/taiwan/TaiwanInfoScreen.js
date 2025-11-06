import React from 'react';
import PropTypes from 'prop-types';
import { EntryInfoScreenTemplate } from '../../templates';
import { taiwanInfoScreenConfig } from '../../config/destinations/taiwan/infoScreenConfig';

const TaiwanInfoScreen = ({ navigation, route }) => (
  <EntryInfoScreenTemplate
    config={taiwanInfoScreenConfig}
    navigation={navigation}
    route={route}
  />
);

TaiwanInfoScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default TaiwanInfoScreen;
