/**
 * Japan Entry Pack Preview Screen
 *
 * Following Vietnam's exact template pattern with AutoContent.
 * Uses EntryPackPreviewTemplate with AutoContent for full functionality.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryPackPreviewTemplate } from '../../templates';
import { japanEntryPackPreviewConfig } from '../../config/destinations/japan/entryPackPreviewConfig';

const JapanEntryPackPreviewScreen = ({ navigation, route }) => (
  <EntryPackPreviewTemplate
    config={japanEntryPackPreviewConfig}
    navigation={navigation}
    route={route}
  >
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

JapanEntryPackPreviewScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default JapanEntryPackPreviewScreen;