/**
 * Tests for EntryCompletionCalculator multi-destination functionality
 * Requirements: 15.1-15.7
 */

import EntryCompletionCalculator from '../EntryCompletionCalculator';

// Mock PassportDataService
jest.mock('../../services/data/PassportDataService', () => ({
  default: {
    getAllEntryInfosForUser: jest.fn(),
    getEntryInfoByDestination: jest.fn(),
    getEntryInfosForDestinations: jest.fn()
  }
}));

describe('EntryCompletionCalculator Multi-Destination', () => {
  let calculator;

  beforeEach(() => {
    calculator = EntryCompletionCalculator; // Use the singleton instance
    calculator.clearAllCaches(); // Clear caches before each test
    jest.clearAllMocks();
  });

  describe('calculateMultiDestinationMetrics', () => {
    it('should calculate metrics for multiple destinations', () => {
      const allDestinationData = {
        'th': {
          passport: { passportNumber: 'E12345678', fullName: 'John Doe', nationality: 'US', dateOfBirth: '1990-01-01', expiryDate: '2030-01-01' },
          personalInfo: { occupation: 'Engineer', provinceCity: 'New York', countryRegion: 'US', phoneNumber: '+1234567890', email: 'john@example.com', gender: 'M' },
          funds: [{ type: 'cash', amount: 1000, currency: 'USD' }],
          travel: { travelPurpose: 'tourism', arrivalDate: '2024-12-01', departureDate: '2024-12-10', flightNumber: 'AA123', accommodation: 'Hotel ABC' }
        },
        'jp': {
          passport: { passportNumber: 'E12345678', fullName: 'John Doe', nationality: 'US', dateOfBirth: '1990-01-01', expiryDate: '2030-01-01' },
          personalInfo: { occupation: 'Engineer', provinceCity: 'New York', countryRegion: 'US', phoneNumber: '+1234567890', email: 'john@example.com', gender: 'M' },
          funds: [],
          travel: { travelPurpose: 'business' }
        },
        'sg': null // No data for Singapore
      };

      const result = calculator.calculateMultiDestinationMetrics(allDestinationData);

      expect(result).toHaveProperty('destinations');
      expect(result).toHaveProperty('summary');
      expect(result.destinations).toHaveProperty('th');
      expect(result.destinations).toHaveProperty('jp');
      expect(result.destinations).toHaveProperty('sg');

      // Thailand should be complete
      expect(result.destinations.th.totalPercent).toBe(100);
      expect(result.destinations.th.isReady).toBe(true);

      // Japan should be partial (missing funds and some travel info)
      expect(result.destinations.jp.totalPercent).toBeLessThan(100);
      expect(result.destinations.jp.isReady).toBe(false);

      // Singapore should be empty
      expect(result.destinations.sg.totalPercent).toBe(0);
      expect(result.destinations.sg.isReady).toBe(false);

      // Summary should reflect the overall state
      expect(result.summary.totalDestinations).toBe(3);
      expect(result.summary.completedDestinations).toBe(1);
      expect(result.summary.inProgressDestinations).toBe(2);
      expect(result.summary.hasAnyProgress).toBe(true);
    });

    it('should handle empty destination data', () => {
      const result = calculator.calculateMultiDestinationMetrics({});

      expect(result.destinations).toEqual({});
      expect(result.summary.totalDestinations).toBe(0);
      expect(result.summary.completedDestinations).toBe(0);
      expect(result.summary.hasAnyProgress).toBe(false);
      expect(result.summary.overallCompletionPercent).toBe(0);
    });
  });

  describe('getEmptyDestinationMetrics', () => {
    it('should return empty metrics for a destination', () => {
      const result = calculator.getEmptyDestinationMetrics('th');

      expect(result.destinationId).toBe('th');
      expect(result.totalPercent).toBe(0);
      expect(result.isReady).toBe(false);
      expect(result.passport.state).toBe('missing');
      expect(result.personalInfo.state).toBe('missing');
      expect(result.funds.state).toBe('missing');
      expect(result.travel.state).toBe('missing');
    });
  });

  describe('getDestinationCompletionSummary', () => {
    it('should calculate completion summary for specific destination', () => {
      const entryInfo = {
        passport: { passportNumber: 'E12345678', fullName: 'John Doe', nationality: 'US', dateOfBirth: '1990-01-01', expiryDate: '2030-01-01' },
        personalInfo: { occupation: 'Engineer', provinceCity: 'New York', countryRegion: 'US', phoneNumber: '+1234567890', email: 'john@example.com', gender: 'M' },
        funds: [{ type: 'cash', amount: 1000, currency: 'USD' }],
        travel: { travelPurpose: 'tourism', arrivalDate: '2024-12-01', departureDate: '2024-12-10', flightNumber: 'AA123', accommodation: 'Hotel ABC' },
        lastUpdatedAt: '2024-10-17T10:00:00Z'
      };

      const result = calculator.getDestinationCompletionSummary('th', entryInfo);

      expect(result.destinationId).toBe('th');
      expect(result.totalPercent).toBe(100);
      expect(result.isReady).toBe(true);
      expect(result.lastUpdated).toBe('2024-10-17T10:00:00Z');
      expect(result.categorySummary).toHaveProperty('passport');
      expect(result.categorySummary).toHaveProperty('personalInfo');
      expect(result.categorySummary).toHaveProperty('funds');
      expect(result.categorySummary).toHaveProperty('travel');
    });
  });

  describe('switchDestinationContext', () => {
    it('should switch between destinations and preserve progress', async () => {
      const PassportDataService = require('../../services/data/PassportDataService').default;
      
      // Mock entry info for both destinations
      PassportDataService.getEntryInfoByDestination
        .mockResolvedValueOnce({
          passport: { passportNumber: 'E12345678', fullName: 'John Doe' },
          personalInfo: { occupation: 'Engineer' },
          funds: [{ type: 'cash', amount: 1000, currency: 'USD' }],
          travel: { travelPurpose: 'tourism' }
        })
        .mockResolvedValueOnce({
          passport: { passportNumber: 'E12345678', fullName: 'John Doe' },
          personalInfo: { occupation: 'Engineer' },
          funds: [],
          travel: {}
        });

      const result = await calculator.switchDestinationContext('th', 'jp', 'user_001');

      expect(result.progressPreserved).toBe(true);
      expect(result.fromDestination.destinationId).toBe('th');
      expect(result.toDestination.destinationId).toBe('jp');
      expect(result.switchedAt).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const PassportDataService = require('../../services/data/PassportDataService').default;
      PassportDataService.getEntryInfoByDestination.mockRejectedValue(new Error('Database error'));

      const result = await calculator.switchDestinationContext('th', 'jp', 'user_001');

      expect(result.progressPreserved).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.fromDestination.destinationId).toBe('th');
      expect(result.toDestination.destinationId).toBe('jp');
    });
  });

  describe('getHomeScreenCompletionData', () => {
    it('should return home screen data with categorized destinations', async () => {
      const PassportDataService = require('../../services/data/PassportDataService').default;
      
      // Mock destinations with progress
      PassportDataService.getAllEntryInfosForUser.mockResolvedValue([
        {
          destinationId: 'th',
          passport: { passportNumber: 'E12345678', fullName: 'John Doe', nationality: 'US', dateOfBirth: '1990-01-01', expiryDate: '2030-01-01' },
          personalInfo: { occupation: 'Engineer', provinceCity: 'New York', countryRegion: 'US', phoneNumber: '+1234567890', email: 'john@example.com', gender: 'M' },
          funds: [{ type: 'cash', amount: 1000, currency: 'USD' }],
          travel: { travelPurpose: 'tourism', arrivalDate: '2024-12-01', departureDate: '2024-12-10', flightNumber: 'AA123', accommodation: 'Hotel ABC' },
          lastUpdatedAt: '2024-10-17T10:00:00Z'
        },
        {
          destinationId: 'jp',
          passport: { passportNumber: 'E12345678', fullName: 'John Doe' },
          personalInfo: { occupation: 'Engineer' },
          funds: [],
          travel: { travelPurpose: 'business' },
          lastUpdatedAt: '2024-10-16T10:00:00Z'
        }
      ]);

      // Mock multi-destination progress
      PassportDataService.getEntryInfoByDestination
        .mockResolvedValueOnce(null) // th
        .mockResolvedValueOnce(null) // jp
        .mockResolvedValueOnce(null) // sg
        .mockResolvedValueOnce(null); // my

      const result = await calculator.getHomeScreenCompletionData('user_001');

      expect(result).toHaveProperty('hasAnyProgress');
      expect(result).toHaveProperty('inProgressDestinations');
      expect(result).toHaveProperty('readyDestinations');
      expect(result).toHaveProperty('summary');
      expect(Array.isArray(result.inProgressDestinations)).toBe(true);
      expect(Array.isArray(result.readyDestinations)).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should cache and retrieve destination-specific results', () => {
      const entryInfo = {
        passport: { passportNumber: 'E12345678' },
        personalInfo: { occupation: 'Engineer' },
        funds: [],
        travel: {}
      };

      // First call should calculate
      const result1 = calculator.getDestinationCompletionSummary('th', entryInfo);
      
      // Second call should use cache
      const result2 = calculator.getDestinationCompletionSummary('th', entryInfo);

      expect(result1).toEqual(result2);
      expect(calculator.destinationProgressCache.size).toBeGreaterThan(0);
    });

    it('should clear destination-specific cache', () => {
      const entryInfo = { passport: {}, personalInfo: {}, funds: [], travel: {} };
      
      calculator.getDestinationCompletionSummary('th', entryInfo);
      calculator.getDestinationCompletionSummary('jp', entryInfo);
      
      expect(calculator.destinationProgressCache.size).toBeGreaterThan(0);
      
      calculator.clearDestinationCache('th');
      
      // Should still have jp cache but not th
      const hasThailandCache = Array.from(calculator.destinationProgressCache.keys())
        .some(key => key.includes('destination_th_'));
      const hasJapanCache = Array.from(calculator.destinationProgressCache.keys())
        .some(key => key.includes('destination_jp_'));
        
      expect(hasThailandCache).toBe(false);
      expect(hasJapanCache).toBe(true);
    });

    it('should clear all caches', () => {
      const entryInfo = { passport: {}, personalInfo: {}, funds: [], travel: {} };
      
      calculator.getCompletionSummary(entryInfo);
      calculator.getDestinationCompletionSummary('th', entryInfo);
      
      expect(calculator.cache.size).toBeGreaterThan(0);
      expect(calculator.destinationProgressCache.size).toBeGreaterThan(0);
      
      calculator.clearAllCaches();
      
      expect(calculator.cache.size).toBe(0);
      expect(calculator.destinationProgressCache.size).toBe(0);
    });
  });
});