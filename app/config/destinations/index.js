/**
 * Central Destination Configuration Registry
 *
 * This is the single source of truth for all destination configurations.
 * Each destination exports:
 * - metadata: ID, name, currency, flag
 * - financial: ATM fees, cash recommendations, exchange rates
 * - emergency: Police, embassy, hospital contacts
 * - entryGuide: Immigration guide steps
 * - validation: Field validation rules
 * - services: Service class mappings
 * - screens: Screen navigation mappings
 * - features: Feature flags
 *
 * Usage:
 * ```javascript
 * import { getDestination, getActiveDestinations } from '@config/destinations';
 *
 * const thailand = getDestination('th');
 * console.log(thailand.metadata.currency); // 'THB'
 * console.log(thailand.financial.atm.fee); // 220
 * console.log(thailand.emergency.emergencyNumbers.police.number); // '191'
 * ```
 */

import thailandConfig from './thailand';

/**
 * @typedef {Object} DestinationMetadata
 * @property {string} id - Unique destination identifier
 * @property {string} code - ISO country code (2-letter)
 * @property {string} code3 - ISO country code (3-letter)
 * @property {string} name - English name
 * @property {string} nameZh - Chinese name
 * @property {string} flag - Unicode flag emoji
 * @property {boolean} enabled - Whether destination is available
 * @property {string} currency - ISO currency code
 * @property {string} currencySymbol - Currency symbol
 */

/**
 * @typedef {Object} DestinationConfig
 * @property {DestinationMetadata} metadata - Core metadata
 * @property {Object} financial - Financial information
 * @property {Object} emergency - Emergency contacts
 * @property {Object} entryGuide - Entry guide configuration
 * @property {Object} validation - Validation rules
 * @property {Object} services - Service class mappings
 * @property {Object} screens - Screen navigation mappings
 * @property {Object} features - Feature flags
 */

/**
 * Central destination registry
 * @type {Object.<string, DestinationConfig>}
 */
export const DESTINATIONS = {
  th: thailandConfig,

  // Singapore - To be added in Phase 2
  // sg: singaporeConfig,

  // Japan - To be added in Phase 2
  // jp: japanConfig,

  // Add more destinations as they are implemented
};

/**
 * Get destination configuration by ID
 * @param {string} destinationId - Destination identifier (e.g., 'th', 'sg', 'jp')
 * @returns {DestinationConfig} Destination configuration object
 * @throws {Error} If destination not found
 *
 * @example
 * const thailand = getDestination('th');
 * console.log(thailand.currency); // 'THB'
 * console.log(thailand.financial.atm.fee); // 220
 */
export const getDestination = (destinationId) => {
  if (!destinationId) {
    throw new Error('Destination ID is required');
  }

  const destination = DESTINATIONS[destinationId];

  if (!destination) {
    const availableDestinations = Object.keys(DESTINATIONS).join(', ');
    throw new Error(
      `Unknown destination: ${destinationId}. Available destinations: ${availableDestinations}`
    );
  }

  return destination;
};

/**
 * Get all active (enabled) destinations
 * @returns {Array<DestinationConfig>} Array of enabled destination configurations
 *
 * @example
 * const activeDestinations = getActiveDestinations();
 * activeDestinations.forEach(dest => {
 *   console.log(`${dest.name} (${dest.id})`);
 * });
 */
export const getActiveDestinations = () => {
  return Object.values(DESTINATIONS).filter(dest => dest.enabled);
};

/**
 * Get all destinations (including disabled ones)
 * @returns {Array<DestinationConfig>} Array of all destination configurations
 */
export const getAllDestinations = () => {
  return Object.values(DESTINATIONS);
};

/**
 * Check if a destination exists and is enabled
 * @param {string} destinationId - Destination identifier
 * @returns {boolean} True if destination exists and is enabled
 *
 * @example
 * if (isDestinationAvailable('th')) {
 *   // Thailand is available for selection
 * }
 */
export const isDestinationAvailable = (destinationId) => {
  const destination = DESTINATIONS[destinationId];
  return destination && destination.enabled === true;
};

/**
 * Get destination metadata only (lightweight)
 * @param {string} destinationId - Destination identifier
 * @returns {DestinationMetadata} Destination metadata
 *
 * @example
 * const metadata = getDestinationMetadata('th');
 * console.log(`${metadata.flag} ${metadata.name}`); // "🇹🇭 Thailand"
 */
export const getDestinationMetadata = (destinationId) => {
  const destination = getDestination(destinationId);
  return {
    id: destination.id,
    code: destination.code,
    code3: destination.code3,
    name: destination.name,
    nameZh: destination.nameZh,
    nameZhTW: destination.nameZhTW,
    flag: destination.flag,
    enabled: destination.enabled,
    currency: destination.currency,
    currencySymbol: destination.currencySymbol,
  };
};

/**
 * Get financial information for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Financial information
 */
export const getFinancialInfo = (destinationId) => {
  const destination = getDestination(destinationId);
  return destination.financial;
};

/**
 * Get emergency contacts for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Emergency contact information
 */
export const getEmergencyInfo = (destinationId) => {
  const destination = getDestination(destinationId);
  return destination.emergency;
};

/**
 * Get entry guide configuration for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Entry guide configuration
 */
export const getEntryGuide = (destinationId) => {
  const destination = getDestination(destinationId);
  return destination.entryGuide;
};

/**
 * Get service class mappings for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Service class mappings
 */
export const getServiceMappings = (destinationId) => {
  const destination = getDestination(destinationId);
  return destination.services;
};

/**
 * Get screen navigation mappings for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Screen navigation mappings
 */
export const getScreenMappings = (destinationId) => {
  const destination = getDestination(destinationId);
  return destination.screens;
};

/**
 * Check if a feature is enabled for a destination
 * @param {string} destinationId - Destination identifier
 * @param {string} featureName - Feature name
 * @returns {boolean} True if feature is enabled
 *
 * @example
 * if (isFeatureEnabled('th', 'digitalArrivalCard')) {
 *   // Show digital arrival card flow
 * }
 */
export const isFeatureEnabled = (destinationId, featureName) => {
  const destination = getDestination(destinationId);
  return destination.features?.[featureName] === true;
};

/**
 * Default export for convenience
 */
export default {
  DESTINATIONS,
  getDestination,
  getActiveDestinations,
  getAllDestinations,
  isDestinationAvailable,
  getDestinationMetadata,
  getFinancialInfo,
  getEmergencyInfo,
  getEntryGuide,
  getServiceMappings,
  getScreenMappings,
  isFeatureEnabled,
};
