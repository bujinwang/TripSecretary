/**
 * Malaysia Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryGuideTemplate } from '../../templates';
import { malaysiaEntryGuide as malaysiaGuideConfig } from '../../config/entryGuide/malaysia';

const MalaysiaEntryGuideScreen = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={malaysiaGuideConfig}
    navigation={navigation}
    route={route}
  >
    <EntryGuideTemplate.Header
      titleKey="malaysia.entryGuide.title"
      defaultTitle="Malaysia Entry Guide 🇲🇾"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

MalaysiaEntryGuideScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default MalaysiaEntryGuideScreen;
