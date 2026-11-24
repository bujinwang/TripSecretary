import React from 'react';
import PropTypes from 'prop-types';
import { EntryPackPreviewTemplate } from '../../templates';
import { taiwanEntryPackPreviewConfig } from '../../config/destinations/taiwan/entryPackPreviewConfig';

const TaiwanEntryPackPreviewScreen = ({ navigation, route }) => (
  <EntryPackPreviewTemplate
    config={taiwanEntryPackPreviewConfig}
    navigation={navigation}
    route={route}
  >
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

TaiwanEntryPackPreviewScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default TaiwanEntryPackPreviewScreen;
