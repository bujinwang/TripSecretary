import React from 'react';
import PropTypes from 'prop-types';
import { EntryInfoScreenTemplate } from '../../templates';
import { malaysiaInfoScreenConfig } from '../../config/destinations/malaysia/infoScreenConfig';

const MalaysiaInfoScreen = ({ navigation, route }) => (
  <EntryInfoScreenTemplate
    config={malaysiaInfoScreenConfig}
    navigation={navigation}
    route={route}
  />
);

MalaysiaInfoScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default MalaysiaInfoScreen;
