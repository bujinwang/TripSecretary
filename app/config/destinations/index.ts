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
 * ```typescript
 * import { getDestination, getActiveDestinations } from '@config/destinations';
 *
 * const thailand = getDestination('th');
 * console.log(thailand.currency); // 'THB'
 * console.log(thailand.financial?.atm?.fee); // 220
 * console.log(thailand.emergency?.emergencyNumbers?.police?.number); // '191'
 * ```
 */

import thailandConfig from './thailand';
import malaysiaConfig from './malaysia';
import singaporeConfig from './singapore';
import taiwanConfig from './taiwan';
import hongkongConfig from './hongkong';
import usaConfig from './usa';
import japanConfig from './japan';
import vietnamConfig from './vietnam';
import koreaConfig from './korea';

/**
 * Central destination registry
 * Using flexible typing to accommodate various config structures
 */
export const DESTINATIONS: Record<string, any> = {
  th: thailandConfig,
  my: malaysiaConfig,
  sg: singaporeConfig,
  tw: taiwanConfig,
  hk: hongkongConfig,
  us: usaConfig,
  jp: japanConfig,
  vn: vietnamConfig,
  kr: koreaConfig,

  // Add more destinations as they are implemented
};

/**
 * Get destination configuration by ID
 * @param {string} destinationId - Destination identifier (e.g., 'th', 'sg', 'jp')
 * @returns {any} Destination configuration object
 * @throws {Error} If destination not found
 *
 * @example
 * const thailand = getDestination('th');
 * console.log(thailand.currency); // 'THB'
 * console.log(thailand.financial?.atm?.fee); // 220
 */
export const getDestination = (destinationId: string): any => {
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
 * @returns {Array<any>} Array of enabled destination configurations
 *
 * @example
 * const activeDestinations = getActiveDestinations();
 * activeDestinations.forEach(dest => {
 *   console.log(`${dest.name} (${dest.id})`);
 * });
 */
export const getActiveDestinations = (): any[] => {
  return Object.values(DESTINATIONS).filter(dest => dest.enabled !== false);
};

/**
 * Get all destinations (including disabled ones)
 * @returns {Array<any>} Array of all destination configurations
 */
export const getAllDestinations = (): any[] => {
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
export const isDestinationAvailable = (destinationId: string): boolean => {
  const destination = DESTINATIONS[destinationId];
  return destination && destination.enabled !== false;
};

/**
 * Get destination metadata only (lightweight)
 * @param {string} destinationId - Destination identifier
 * @returns {any} Destination metadata
 *
 * @example
 * const metadata = getDestinationMetadata('th');
 * console.log(`${metadata.flag} ${metadata.name}`); // "🇹🇭 Thailand"
 */
export const getDestinationMetadata = (destinationId: string): any => {
  const destination = getDestination(destinationId);
  return {
    id: destination.metadata?.id || destinationId,
    code: destination.metadata?.code || destinationId.toUpperCase(),
    code3: destination.metadata?.code3 || destinationId.toUpperCase().padEnd(3, 'A'),
    name: destination.metadata?.name || destination.name || destinationId,
    nameZh: destination.metadata?.nameZh || destination.nameZh || destinationId,
    nameZhTW: destination.metadata?.nameZhTW || destination.nameZhTW,
    flag: destination.metadata?.flag || destination.flag || '🏳️',
    enabled: destination.enabled !== false, // default to true if not specified
    currency: destination.metadata?.currency || destination.currency || 'USD',
    currencySymbol: destination.metadata?.currencySymbol || destination.currencySymbol || '$',
    dateFormat: destination.metadata?.dateFormat || 'DD/MM/YYYY',
    timezone: destination.metadata?.timezone || 'UTC',
  };
};

/**
 * Get financial information for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Financial information
 */
export const getFinancialInfo = (destinationId: string): Record<string, any> => {
  const destination = getDestination(destinationId);
  return destination.financial || {};
};

/**
 * Get emergency contacts for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Emergency contact information
 */
export const getEmergencyInfo = (destinationId: string): Record<string, any> => {
  const destination = getDestination(destinationId);
  return destination.emergency || {};
};

/**
 * Get entry guide configuration for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Entry guide configuration
 */
export const getEntryGuide = (destinationId: string): Record<string, any> => {
  const destination = getDestination(destinationId);
  return destination.entryGuide || {};
};

/**
 * Get service class mappings for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Service class mappings
 */
export const getServiceMappings = (destinationId: string): Record<string, any> => {
  const destination = getDestination(destinationId);
  return destination.services || {};
};

/**
 * Get screen navigation mappings for a destination
 * @param {string} destinationId - Destination identifier
 * @returns {Object} Screen navigation mappings
 */
export const getScreenMappings = (destinationId: string): Record<string, any> => {
  const destination = getDestination(destinationId);
  return destination.screens || {};
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
export const isFeatureEnabled = (destinationId: string, featureName: string): boolean => {
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
} as const;