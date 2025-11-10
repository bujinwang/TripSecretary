// @ts-nocheck

/**
 * Hong Kong Travel Info Hooks - Barrel Export
 *
 * Consolidates custom hooks for Hong Kong Travel Info Screen
 * following the proven refactoring methodology from Thailand.
 *
 * These hooks extract state management, data persistence, and validation
 * from the monolithic 3,907-line HongkongTravelInfoScreen component.
 */

export { useHongKongFormState } from './useHongKongFormState';
export { useHongKongDataPersistence } from './useHongKongDataPersistence';
export { useHongKongValidation } from './useHongKongValidation';
