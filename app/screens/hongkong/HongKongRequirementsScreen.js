import React from 'react';
import PropTypes from 'prop-types';
import { EntryRequirementsTemplate } from '../../templates';
import { hongkongRequirementsScreenConfig } from '../../config/destinations/hongkong/requirementsScreenConfig';

const HongKongRequirementsScreen = ({ navigation, route }) => (
  <EntryRequirementsTemplate
    config={hongkongRequirementsScreenConfig}
    navigation={navigation}
    route={route}
  />
);

HongKongRequirementsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default HongKongRequirementsScreen;
