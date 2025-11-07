/**
 * Thailand Entry Pack Preview Screen
 * Powered by EntryPackPreviewTemplate with Thailand-specific config.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryPackPreviewTemplate } from '../../templates';
import { thailandEntryPackPreviewConfig } from '../../config/destinations/thailand/entryPackPreviewConfig';

const ThailandEntryPackPreviewScreen = ({ navigation, route }) => (
  <EntryPackPreviewTemplate
    config={thailandEntryPackPreviewConfig}
    navigation={navigation}
    route={route}
  >
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

ThailandEntryPackPreviewScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default ThailandEntryPackPreviewScreen;
