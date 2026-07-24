import React from 'react';
import type { RootStackScreenProps } from '../../types/navigation';
import SGArrivalWebViewScreen from './SGArrivalWebViewScreen';

const SGACWebViewScreen: React.FC<RootStackScreenProps<'SGACWebView'>> = (props) => (
  <SGArrivalWebViewScreen {...(props as unknown as RootStackScreenProps<'SGArrivalWebView'>)} />
);

export default SGACWebViewScreen;
