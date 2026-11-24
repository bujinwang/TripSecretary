import React from 'react';
import type { RootStackScreenProps } from '../../types/navigation';
import SGArrivalGuideScreen from './SGArrivalGuideScreen';

const SGACAirportGuideScreen: React.FC<RootStackScreenProps<'SGACAirportGuide'>> = (props) => (
  <SGArrivalGuideScreen {...(props as unknown as RootStackScreenProps<'SGArrivalGuide'>)} />
);

export default SGACAirportGuideScreen;
