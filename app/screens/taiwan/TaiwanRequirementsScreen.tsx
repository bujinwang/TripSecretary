import React from 'react';
import PropTypes from 'prop-types';
import { EntryRequirementsTemplate } from '../../templates';
import { taiwanRequirementsScreenConfig } from '../../config/destinations/taiwan/requirementsScreenConfig';

const TaiwanRequirementsScreen = ({ navigation, route }) => (
  <EntryRequirementsTemplate
    config={taiwanRequirementsScreenConfig}
    navigation={navigation}
    route={route}
  />
);

TaiwanRequirementsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default TaiwanRequirementsScreen;
