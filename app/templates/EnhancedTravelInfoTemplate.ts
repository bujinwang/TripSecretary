import type { ComponentType } from 'react';

// Re-export the JavaScript implementation while providing loose typing for TS consumers.
// Explicit .js extension avoids Metro resolving this file and creating a circular require.
declare const EnhancedTravelInfoTemplate: ComponentType<any>;

export default EnhancedTravelInfoTemplate;
