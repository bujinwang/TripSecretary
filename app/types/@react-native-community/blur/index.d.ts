declare module '@react-native-community/blur' {
  import type * as React from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export interface BlurViewProps {
    blurType?:
      | 'xlight'
      | 'light'
      | 'dark'
      | 'regular'
      | 'prominent'
      | 'chromeMaterial'
      | 'material'
      | 'thickMaterial'
      | 'thinMaterial'
      | 'ultraThinMaterial'
      | string;
    blurAmount?: number;
    reducedTransparencyFallbackColor?: string;
    overlayColor?: string;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }

  export class BlurView extends React.Component<BlurViewProps> {}

  export default BlurView;
}
