import React from 'react';
import PropTypes from 'prop-types';
import { EntryInfoScreenTemplate } from '../../templates';
import { hongkongInfoScreenConfig } from '../../config/destinations/hongkong/infoScreenConfig';

const HongKongInfoScreen = ({ navigation, route }) => (
  <EntryInfoScreenTemplate
    config={hongkongInfoScreenConfig}
    navigation={navigation}
    route={route}
  />
);

HongKongInfoScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default HongKongInfoScreen;
