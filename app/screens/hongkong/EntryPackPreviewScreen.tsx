import React from 'react';
import PropTypes from 'prop-types';
import { EntryPackPreviewTemplate } from '../../templates';
import { hongkongEntryPackPreviewConfig } from '../../config/destinations/hongkong/entryPackPreviewConfig';

const HongKongEntryPackPreviewScreen = ({ navigation, route }) => (
  <EntryPackPreviewTemplate
    config={hongkongEntryPackPreviewConfig}
    navigation={navigation}
    route={route}
  >
    <EntryPackPreviewTemplate.AutoContent />
  </EntryPackPreviewTemplate>
);

HongKongEntryPackPreviewScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }).isRequired,
  route: PropTypes.object,
};

export default HongKongEntryPackPreviewScreen;
