// @ts-nocheck

/**
 * SuggestionProviders Utility
 * 
 * Provides smart default suggestions for various form fields
 * based on user context, travel patterns, and common selections.
 * 
 * Features:
 * - Travel purpose suggestions based on common travel reasons
 * - Accommodation type suggestions with popular options first
 * - Boarding country suggestions based on passport nationality
 * - Context-aware suggestions that adapt to user data
 */

import { getThailandTravelPurposes, getBasicTravelPurposes } from '../data/travelPurposes';

/**
 * SuggestionProviders Class
 */
class SuggestionProviders {
  /**
   * Get travel purpose suggestions
   * 
   * @param {Object} context - User context for personalized suggestions
   * @param {string} context.destination - Destination country code
   * @param {string} context.nationality - User's nationality
   * @param {Array} context.previousPurposes - Previously selected purposes
   * @returns {Array<string>} Array of travel purpose suggestions
   */
  static getTravelPurposeSuggestions(context = {}) {
    const { destination, nationality, previousPurposes = [] } = context;

    // Base suggestions ordered by popularity
    const baseSuggestions = [
      'HOLIDAY',
      'BUSINESS',
      'VISITING_FRIENDS_FAMILY',
      'TRANSIT',
      'CONFERENCE',
      'EDUCATION',
      'MEDICAL',
      'OTHER'
    ];

    // Get display names for suggestions - use simple mapping for now
    const purposeMapping = {
      'HOLIDAY': 'Holiday/Tourism',
      'BUSINESS': 'Business',
      'VISITING_FRIENDS_FAMILY': 'Visiting Friends/Family',
      'TRANSIT': 'Transit',
      'CONFERENCE': 'Conference/Meeting',
      'EDUCATION': 'Education/Training',
      'MEDICAL': 'Medical Treatment',
      'OTHER': 'Other'
    };

    const suggestions = baseSuggestions.map(purpose => 
      purposeMapping[purpose] || purpose
    );

    // Prioritize previously used purposes
    if (previousPurposes.length > 0) {
      const prioritized = [...previousPurposes];
      const remaining = suggestions.filter(s => !previousPurposes.includes(s));
      return [...prioritized, ...remaining];
    }

    // Context-specific adjustments
    if (destination === 'TH') {
      // Thailand-specific ordering
      return [
        'Holiday/Tourism',
        'Business',
        'Visiting Friends/Family',
        'Transit',
        'Conference/Meeting',
        'Education/Training',
        'Medical Treatment',
        'Other'
      ];
    }

    if (destination === 'SG') {
      // Singapore-specific ordering
      return [
        'Business',
        'Holiday/Tourism',
        'Transit',
        'Conference/Meeting',
        'Visiting Friends/Family',
        'Education/Training',
        'Medical Treatment',
        'Other'
      ];
    }

    return suggestions;
  }

  /**
   * Get accommodation type suggestions
   * 
   * @param {Object} context - User context for personalized suggestions
   * @param {string} context.destination - Destination country code
   * @param {string} context.travelPurpose - Selected travel purpose
   * @param {Array} context.previousAccommodations - Previously selected accommodations
   * @returns {Array<string>} Array of accommodation type suggestions
   */
  static getAccommodationTypeSuggestions(context = {}) {
    const { destination, travelPurpose, previousAccommodations = [] } = context;

    // Base suggestions ordered by popularity
    let baseSuggestions = [
      'Hotel',
      'Apartment/Condo',
      'Friend/Family Home',
      'Hostel',
      'Resort',
      'Guesthouse',
      'Serviced Apartment',
      'Other'
    ];

    // Adjust based on travel purpose
    if (travelPurpose === 'BUSINESS' || travelPurpose === 'Business') {
      baseSuggestions = [
        'Hotel',
        'Serviced Apartment',
        'Apartment/Condo',
        'Resort',
        'Guesthouse',
        'Friend/Family Home',
        'Hostel',
        'Other'
      ];
    } else if (travelPurpose === 'VISITING_FRIENDS_FAMILY' || travelPurpose === 'Visiting Friends/Family') {
      baseSuggestions = [
        'Friend/Family Home',
        'Hotel',
        'Apartment/Condo',
        'Guesthouse',
        'Serviced Apartment',
        'Resort',
        'Hostel',
        'Other'
      ];
    } else if (travelPurpose === 'HOLIDAY' || travelPurpose === 'Holiday/Tourism') {
      baseSuggestions = [
        'Hotel',
        'Resort',
        'Apartment/Condo',
        'Guesthouse',
        'Hostel',
        'Serviced Apartment',
        'Friend/Family Home',
        'Other'
      ];
    }

    // Prioritize previously used accommodations
    if (previousAccommodations.length > 0) {
      const prioritized = [...previousAccommodations];
      const remaining = baseSuggestions.filter(s => !previousAccommodations.includes(s));
      return [...prioritized, ...remaining];
    }

    return baseSuggestions;
  }

  /**
   * Get boarding country suggestions
   * 
   * @param {Object} context - User context for personalized suggestions
   * @param {string} context.passportNationality - User's passport nationality
   * @param {string} context.destination - Destination country code
   * @param {Array} context.previousBoardingCountries - Previously used boarding countries
   * @returns {Array<string>} Array of boarding country suggestions
   */
  static getBoardingCountrySuggestions(context = {}) {
    const { passportNationality, destination, previousBoardingCountries = [] } = context;

    // Common boarding countries
    const commonCountries = [
      'China',
      'Singapore',
      'Malaysia',
      'Thailand',
      'Japan',
      'South Korea',
      'Hong Kong',
      'Taiwan',
      'United States',
      'United Kingdom',
      'Australia',
      'Germany',
      'France',
      'Canada'
    ];

    let suggestions = [...commonCountries];

    // Prioritize passport nationality as first suggestion
    if (passportNationality && !suggestions.includes(passportNationality)) {
      suggestions.unshift(passportNationality);
    } else if (passportNationality && suggestions.includes(passportNationality)) {
      // Move passport nationality to first position
      suggestions = suggestions.filter(c => c !== passportNationality);
      suggestions.unshift(passportNationality);
    }

    // Prioritize previously used boarding countries
    if (previousBoardingCountries.length > 0) {
      const prioritized = [...previousBoardingCountries];
      const remaining = suggestions.filter(s => !previousBoardingCountries.includes(s));
      return [...prioritized, ...remaining];
    }

    // Context-specific adjustments based on destination
    if (destination === 'TH') {
      // Common boarding countries for Thailand
      const thailandCommon = ['China', 'Singapore', 'Malaysia', 'Japan', 'South Korea', 'Hong Kong'];
      const reordered = thailandCommon.filter(c => suggestions.includes(c));
      const remaining = suggestions.filter(c => !thailandCommon.includes(c));
      suggestions = [...reordered, ...remaining];
    }

    if (destination === 'SG') {
      // Common boarding countries for Singapore
      const singaporeCommon = ['Malaysia', 'China', 'Thailand', 'Japan', 'Australia', 'United Kingdom'];
      const reordered = singaporeCommon.filter(c => suggestions.includes(c));
      const remaining = suggestions.filter(c => !singaporeCommon.includes(c));
      suggestions = [...reordered, ...remaining];
    }

    return suggestions.slice(0, 10); // Limit to top 10 suggestions
  }

  /**
   * Get suggestions for any field type
   * 
   * @param {string} fieldType - Type of field ('travelPurpose', 'accommodationType', 'boardingCountry')
   * @param {Object} context - User context for personalized suggestions
   * @returns {Array<string>} Array of suggestions for the field type
   */
  static getSuggestions(fieldType, context = {}) {
    switch (fieldType) {
      case 'travelPurpose':
        return this.getTravelPurposeSuggestions(context);
      
      case 'accommodationType':
        return this.getAccommodationTypeSuggestions(context);
      
      case 'boardingCountry':
        return this.getBoardingCountrySuggestions(context);
      
      default:
        console.warn(`Unknown field type for suggestions: ${fieldType}`);
        return [];
    }
  }

  /**
   * Update user context based on selections
   * This can be used to improve future suggestions
   * 
   * @param {string} fieldType - Type of field that was selected
   * @param {string} selectedValue - Value that was selected
   * @param {Object} currentContext - Current user context
   * @returns {Object} Updated context
   */
  static updateContextWithSelection(fieldType, selectedValue, currentContext = {}) {
    const updatedContext = { ...currentContext };

    switch (fieldType) {
      case 'travelPurpose':
        if (!updatedContext.previousPurposes) {
          updatedContext.previousPurposes = [];
        }
        if (!updatedContext.previousPurposes.includes(selectedValue)) {
          updatedContext.previousPurposes.unshift(selectedValue);
          // Keep only last 3 purposes
          updatedContext.previousPurposes = updatedContext.previousPurposes.slice(0, 3);
        }
        break;

      case 'accommodationType':
        if (!updatedContext.previousAccommodations) {
          updatedContext.previousAccommodations = [];
        }
        if (!updatedContext.previousAccommodations.includes(selectedValue)) {
          updatedContext.previousAccommodations.unshift(selectedValue);
          // Keep only last 3 accommodations
          updatedContext.previousAccommodations = updatedContext.previousAccommodations.slice(0, 3);
        }
        break;

      case 'boardingCountry':
        if (!updatedContext.previousBoardingCountries) {
          updatedContext.previousBoardingCountries = [];
        }
        if (!updatedContext.previousBoardingCountries.includes(selectedValue)) {
          updatedContext.previousBoardingCountries.unshift(selectedValue);
          // Keep only last 3 boarding countries
          updatedContext.previousBoardingCountries = updatedContext.previousBoardingCountries.slice(0, 3);
        }
        break;
    }

    return updatedContext;
  }

  /**
   * Get placeholder text for suggestion fields
   * 
   * @param {string} fieldType - Type of field
   * @param {Object} context - User context
   * @returns {string} Placeholder text
   */
  static getSuggestionPlaceholder(fieldType, context = {}) {
    const suggestionCount = this.getSuggestions(fieldType, context).length;
    
    switch (fieldType) {
      case 'travelPurpose':
        return `Tap to see ${suggestionCount} travel purposes...`;
      
      case 'accommodationType':
        return `Tap to see ${suggestionCount} accommodation types...`;
      
      case 'boardingCountry':
        return `Tap to see ${suggestionCount} countries...`;
      
      default:
        return 'Tap to see suggestions...';
    }
  }
}

export default SuggestionProviders;