/**
 * Singapore Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryGuideTemplate } from '../../templates';
import { singaporeEntryGuide as singaporeGuideConfig } from '../../config/entryGuide/singapore';

const SingaporeEntryGuideScreen = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={singaporeGuideConfig}
    navigation={navigation}
    route={route}
  >
    <EntryGuideTemplate.Header
      titleZh="新加坡入境指引 🇸🇬"
      titleEn="Singapore Entry Guide 🇸🇬"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

SingaporeEntryGuideScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default SingaporeEntryGuideScreen;
