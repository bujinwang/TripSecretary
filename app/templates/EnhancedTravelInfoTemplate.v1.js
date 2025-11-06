/**
 * Legacy alias for EnhancedTravelInfoTemplate v2.
 * The project now standardizes on the V2 implementation; this file
 * remains to keep existing imports functioning.
 */

import EnhancedTravelInfoTemplateV2, {
  EnhancedTemplateContext,
  useEnhancedTemplate,
} from './EnhancedTravelInfoTemplate.v2';

export default EnhancedTravelInfoTemplateV2;
export { EnhancedTemplateContext, useEnhancedTemplate };
