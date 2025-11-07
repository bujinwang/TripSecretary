/**
 * Taiwan Entry Guide Screen
 * Refactored to use the shared EntryGuideTemplate with tabs for steps.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EntryGuideTemplate } from '../../templates';
import { taiwanEntryGuide as taiwanGuideConfig } from '../../config/entryGuide/taiwan';

const TWArrivalGuideScreen = ({ navigation, route }) => (
  <EntryGuideTemplate
    config={taiwanGuideConfig}
    navigation={navigation}
    route={route}
  >
    <EntryGuideTemplate.Header
      titleKey="taiwan.guide.headerTitle"
      defaultTitle="Taiwan Arrival Card Guided Mode 🇹🇼"
    />
    <EntryGuideTemplate.AutoContent />
  </EntryGuideTemplate>
);

TWArrivalGuideScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default TWArrivalGuideScreen;
