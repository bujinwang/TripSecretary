/**
 * Navigation Types
 * 
 * Shared type definitions for React Navigation
 */

import { NavigationProp, RouteProp } from '@react-navigation/native';

// Base navigation prop type
export type BaseNavigationProp = NavigationProp<any>;

// Base route prop type
export type BaseRouteProp = RouteProp<any>;

// Screen props interface (standard for all screens)
export interface ScreenProps {
  navigation: BaseNavigationProp;
  route: BaseRouteProp;
}

// Common route params
export interface CommonRouteParams {
  passport?: any;
  destination?: string;
  userData?: any;
  entryPackData?: any;
  [key: string]: any;
}

