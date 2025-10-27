/**
 * Singapore Travel Info Section Components
 *
 * Barrel export for all Singapore section components
 */

// Original section components (with CollapsibleSection wrappers)
export { default as PassportSection } from './PassportSection';
export { default as PersonalInfoSection } from './PersonalInfoSection';
export { default as FundsSection } from './FundsSection';
export { default as TravelDetailsSection } from './TravelDetailsSection';

// Section content components (inner JSX only, used within CollapsibleSection)
export { default as PassportSectionContent } from './PassportSectionContent';
export { default as PersonalInfoSectionContent } from './PersonalInfoSectionContent';
export { default as FundsSectionContent } from './FundsSectionContent';
