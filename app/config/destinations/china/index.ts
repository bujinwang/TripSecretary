import metadata from './metadata';
import entryFlowConfig from './entryFlowConfig';

export default {
  ...metadata,
  entryFlow: entryFlowConfig,
  screens: {
    info: 'ChinaTravelInfo',
    travelInfo: 'ChinaTravelInfo',
    entryFlow: 'ChinaEntryFlow',
    entryPackPreview: 'EntryPackPreview',
  },
};