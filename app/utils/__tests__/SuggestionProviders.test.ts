// @ts-nocheck

/**
 * SuggestionProviders Tests
 * 
 * Tests for the suggestion system that provides smart defaults
 * for travel purpose, accommodation type, and boarding country fields.
 */

import SuggestionProviders from '../SuggestionProviders';

describe('SuggestionProviders', () => {
  describe('getTravelPurposeSuggestions', () => {
    it('returns default travel purpose suggestions', () => {
      const suggestions = SuggestionProviders.getTravelPurposeSuggestions();
      
      expect(suggestions).toContain('Holiday/Tourism');
      expect(suggestions).toContain('Business');
      expect(suggestions).toContain('Visiting Friends/Family');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('prioritizes previous purposes', () => {
      const context = {
        previousPurposes: ['Business', 'Conference/Meeting']
      };
      
      const suggestions = SuggestionProviders.getTravelPurposeSuggestions(context);
      
      expect(suggestions[0]).toBe('Business');
      expect(suggestions[1]).toBe('Conference/Meeting');
    });

    it('provides Thailand-specific suggestions', () => {
      const context = { destination: 'TH' };
      
      const suggestions = SuggestionProviders.getTravelPurposeSuggestions(context);
      
      expect(suggestions[0]).toBe('Holiday/Tourism');
      expect(suggestions).toContain('Business');
    });

    it('provides Singapore-specific suggestions', () => {
      const context = { destination: 'SG' };
      
      const suggestions = SuggestionProviders.getTravelPurposeSuggestions(context);
      
      expect(suggestions[0]).toBe('Business');
      expect(suggestions).toContain('Holiday/Tourism');
    });
  });

  describe('getAccommodationTypeSuggestions', () => {
    it('returns default accommodation suggestions', () => {
      const suggestions = SuggestionProviders.getAccommodationTypeSuggestions();
      
      expect(suggestions).toContain('Hotel');
      expect(suggestions).toContain('Apartment/Condo');
      expect(suggestions).toContain('Friend/Family Home');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('adjusts suggestions for business travel', () => {
      const context = { travelPurpose: 'Business' };
      
      const suggestions = SuggestionProviders.getAccommodationTypeSuggestions(context);
      
      expect(suggestions[0]).toBe('Hotel');
      expect(suggestions[1]).toBe('Serviced Apartment');
    });

    it('adjusts suggestions for visiting friends/family', () => {
      const context = { travelPurpose: 'Visiting Friends/Family' };
      
      const suggestions = SuggestionProviders.getAccommodationTypeSuggestions(context);
      
      expect(suggestions[0]).toBe('Friend/Family Home');
    });

    it('adjusts suggestions for holiday travel', () => {
      const context = { travelPurpose: 'Holiday/Tourism' };
      
      const suggestions = SuggestionProviders.getAccommodationTypeSuggestions(context);
      
      expect(suggestions[0]).toBe('Hotel');
      expect(suggestions[1]).toBe('Resort');
    });

    it('prioritizes previous accommodations', () => {
      const context = {
        previousAccommodations: ['Resort', 'Guesthouse']
      };
      
      const suggestions = SuggestionProviders.getAccommodationTypeSuggestions(context);
      
      expect(suggestions[0]).toBe('Resort');
      expect(suggestions[1]).toBe('Guesthouse');
    });
  });

  describe('getBoardingCountrySuggestions', () => {
    it('returns default boarding country suggestions', () => {
      const suggestions = SuggestionProviders.getBoardingCountrySuggestions();
      
      expect(suggestions).toContain('China');
      expect(suggestions).toContain('Singapore');
      expect(suggestions).toContain('Malaysia');
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    it('prioritizes passport nationality', () => {
      const context = { passportNationality: 'Australia' };
      
      const suggestions = SuggestionProviders.getBoardingCountrySuggestions(context);
      
      expect(suggestions[0]).toBe('Australia');
    });

    it('moves existing passport nationality to first position', () => {
      const context = { passportNationality: 'China' };
      
      const suggestions = SuggestionProviders.getBoardingCountrySuggestions(context);
      
      expect(suggestions[0]).toBe('China');
    });

    it('adjusts suggestions for Thailand destination', () => {
      const context = { destination: 'TH' };
      
      const suggestions = SuggestionProviders.getBoardingCountrySuggestions(context);
      
      const topSuggestions = suggestions.slice(0, 3);
      expect(topSuggestions).toContain('China');
      expect(topSuggestions).toContain('Singapore');
    });

    it('adjusts suggestions for Singapore destination', () => {
      const context = { destination: 'SG' };
      
      const suggestions = SuggestionProviders.getBoardingCountrySuggestions(context);
      
      const topSuggestions = suggestions.slice(0, 3);
      expect(topSuggestions).toContain('Malaysia');
      expect(topSuggestions).toContain('China');
    });

    it('prioritizes previous boarding countries', () => {
      const context = {
        previousBoardingCountries: ['Japan', 'South Korea']
      };
      
      const suggestions = SuggestionProviders.getBoardingCountrySuggestions(context);
      
      expect(suggestions[0]).toBe('Japan');
      expect(suggestions[1]).toBe('South Korea');
    });
  });

  describe('getSuggestions', () => {
    it('returns travel purpose suggestions for travelPurpose field', () => {
      const suggestions = SuggestionProviders.getSuggestions('travelPurpose');
      
      expect(suggestions).toContain('Holiday/Tourism');
      expect(suggestions).toContain('Business');
    });

    it('returns accommodation suggestions for accommodationType field', () => {
      const suggestions = SuggestionProviders.getSuggestions('accommodationType');
      
      expect(suggestions).toContain('Hotel');
      expect(suggestions).toContain('Apartment/Condo');
    });

    it('returns boarding country suggestions for boardingCountry field', () => {
      const suggestions = SuggestionProviders.getSuggestions('boardingCountry');
      
      expect(suggestions).toContain('China');
      expect(suggestions).toContain('Singapore');
    });

    it('returns empty array for unknown field type', () => {
      const suggestions = SuggestionProviders.getSuggestions('unknownField');
      
      expect(suggestions).toEqual([]);
    });

    it('passes context correctly to specific suggestion methods', () => {
      const context = { destination: 'TH' };
      const suggestions = SuggestionProviders.getSuggestions('travelPurpose', context);
      
      expect(suggestions[0]).toBe('Holiday/Tourism');
    });
  });

  describe('updateContextWithSelection', () => {
    it('updates context with travel purpose selection', () => {
      const context = {};
      const updated = SuggestionProviders.updateContextWithSelection(
        'travelPurpose', 
        'Business', 
        context
      );
      
      expect(updated.previousPurposes).toContain('Business');
    });

    it('updates context with accommodation selection', () => {
      const context = {};
      const updated = SuggestionProviders.updateContextWithSelection(
        'accommodationType', 
        'Hotel', 
        context
      );
      
      expect(updated.previousAccommodations).toContain('Hotel');
    });

    it('updates context with boarding country selection', () => {
      const context = {};
      const updated = SuggestionProviders.updateContextWithSelection(
        'boardingCountry', 
        'China', 
        context
      );
      
      expect(updated.previousBoardingCountries).toContain('China');
    });

    it('limits previous selections to 3 items', () => {
      const context = {
        previousPurposes: ['Purpose1', 'Purpose2', 'Purpose3']
      };
      
      const updated = SuggestionProviders.updateContextWithSelection(
        'travelPurpose', 
        'Purpose4', 
        context
      );
      
      expect(updated.previousPurposes).toHaveLength(3);
      expect(updated.previousPurposes[0]).toBe('Purpose4');
      expect(updated.previousPurposes).not.toContain('Purpose3');
    });

    it('does not add duplicate selections', () => {
      const context = {
        previousPurposes: ['Business', 'Holiday']
      };
      
      const updated = SuggestionProviders.updateContextWithSelection(
        'travelPurpose', 
        'Business', 
        context
      );
      
      expect(updated.previousPurposes.filter(p => p === 'Business')).toHaveLength(1);
    });

    it('handles unknown field types gracefully', () => {
      const context = {};
      const updated = SuggestionProviders.updateContextWithSelection(
        'unknownField', 
        'value', 
        context
      );
      
      expect(updated).toEqual(context);
    });
  });

  describe('getSuggestionPlaceholder', () => {
    it('returns appropriate placeholder for travel purpose', () => {
      const placeholder = SuggestionProviders.getSuggestionPlaceholder('travelPurpose');
      
      expect(placeholder).toContain('travel purposes');
      expect(placeholder).toMatch(/\d+/); // Should contain number
    });

    it('returns appropriate placeholder for accommodation type', () => {
      const placeholder = SuggestionProviders.getSuggestionPlaceholder('accommodationType');
      
      expect(placeholder).toContain('accommodation types');
      expect(placeholder).toMatch(/\d+/);
    });

    it('returns appropriate placeholder for boarding country', () => {
      const placeholder = SuggestionProviders.getSuggestionPlaceholder('boardingCountry');
      
      expect(placeholder).toContain('countries');
      expect(placeholder).toMatch(/\d+/);
    });

    it('returns default placeholder for unknown field type', () => {
      const placeholder = SuggestionProviders.getSuggestionPlaceholder('unknownField');
      
      expect(placeholder).toBe('Tap to see suggestions...');
    });

    it('includes correct count based on context', () => {
      const context = { destination: 'TH' };
      const placeholder = SuggestionProviders.getSuggestionPlaceholder('travelPurpose', context);
      
      const suggestions = SuggestionProviders.getSuggestions('travelPurpose', context);
      expect(placeholder).toContain(suggestions.length.toString());
    });
  });
});