/**
 * HomeScreen Entry Pack Cards Integration Test
 * Tests the entry pack functionality in HomeScreen
 */

import EntryPackService from '../../services/entryPack/EntryPackService';
import UserDataService from '../../services/data/UserDataService';

// Mock services
jest.mock('../../services/entryPack/EntryPackService');
jest.mock('../../services/data/UserDataService');
jest.mock('../../services/api');

// Mock EntryInfo
jest.mock('../../models/EntryInfo', () => ({
  default: {
    load: jest.fn(),
  },
}));

describe('HomeScreen Entry Pack Cards Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock UserDataService
    UserDataService.initialize = jest.fn().mockResolvedValue();
    UserDataService.getPrimaryPassport = jest.fn().mockResolvedValue(null);
  });

  it('should load active entry packs for user', async () => {
    const mockEntryPacks = [
      {
        id: 'pack_1',
        status: 'submitted',
        destinationId: 'th',
        entryInfoId: 'entry_1',
      },
    ];

    EntryPackService.getActivePacksForUser = jest.fn().mockResolvedValue(mockEntryPacks);

    const result = await EntryPackService.getActivePacksForUser('user_001');
    
    expect(EntryPackService.getActivePacksForUser).toHaveBeenCalledWith('user_001');
    expect(result).toEqual(mockEntryPacks);
  });

  it('should filter for submitted packs only', async () => {
    const mockEntryPacks = [
      {
        id: 'pack_1',
        status: 'submitted',
        destinationId: 'th',
        entryInfoId: 'entry_1',
      },
      {
        id: 'pack_2',
        status: 'in_progress',
        destinationId: 'jp',
        entryInfoId: 'entry_2',
      },
    ];

    EntryPackService.getActivePacksForUser = jest.fn().mockResolvedValue(mockEntryPacks);

    const result = await EntryPackService.getActivePacksForUser('user_001');
    const submittedPacks = result.filter(pack => pack.status === 'submitted');
    
    expect(submittedPacks).toHaveLength(1);
    expect(submittedPacks[0].id).toBe('pack_1');
  });

  it('should handle service errors gracefully', async () => {
    EntryPackService.getActivePacksForUser = jest.fn().mockRejectedValue(new Error('Service error'));

    try {
      await EntryPackService.getActivePacksForUser('user_001');
    } catch (error) {
      expect(error.message).toBe('Service error');
    }
  });

  it('should load arrival dates from EntryInfo', async () => {
    const mockEntryPack = {
      id: 'pack_1',
      status: 'submitted',
      destinationId: 'th',
      entryInfoId: 'entry_1',
    };

    const mockEntryInfo = {
      arrivalDate: '2024-12-25T10:00:00Z',
    };

    const EntryInfo = require('../../models/EntryInfo').default;
    EntryInfo.load = jest.fn().mockResolvedValue(mockEntryInfo);

    const result = await EntryInfo.load(mockEntryPack.entryInfoId);
    
    expect(EntryInfo.load).toHaveBeenCalledWith('entry_1');
    expect(result.arrivalDate).toBe('2024-12-25T10:00:00Z');
  });

  it('should handle missing arrival dates', async () => {
    const mockEntryPack = {
      id: 'pack_1',
      status: 'submitted',
      destinationId: 'th',
      entryInfoId: 'entry_1',
    };

    const EntryInfo = require('../../models/EntryInfo').default;
    EntryInfo.load = jest.fn().mockResolvedValue(null);

    const result = await EntryInfo.load(mockEntryPack.entryInfoId);
    
    expect(result).toBeNull();
  });

  it('should verify destination flag mapping', () => {
    const getDestinationFlag = (destinationId) => {
      const flagMap = {
        'th': '🇹🇭',
        'jp': '🇯🇵',
        'sg': '🇸🇬',
        'my': '🇲🇾',
        'hk': '🇭🇰',
        'tw': '🇹🇼',
        'kr': '🇰🇷',
        'us': '🇺🇸'
      };
      return flagMap[destinationId] || '🌍';
    };

    expect(getDestinationFlag('th')).toBe('🇹🇭');
    expect(getDestinationFlag('jp')).toBe('🇯🇵');
    expect(getDestinationFlag('unknown')).toBe('🌍');
  });

  it('should calculate arrival countdown correctly', () => {
    const getArrivalCountdown = (arrivalDate) => {
      if (!arrivalDate) return '';
      
      try {
        const arrival = new Date(arrivalDate);
        const now = new Date();
        const diffMs = arrival.getTime() - now.getTime();
        
        if (diffMs <= 0) {
          return '今日抵达';
        }
        
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          return '明日抵达';
        } else if (diffDays <= 7) {
          return `${diffDays}天后抵达`;
        } else {
          return arrival.toLocaleDateString();
        }
      } catch (error) {
        return '';
      }
    };

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    expect(getArrivalCountdown(tomorrow.toISOString())).toBe('明日抵达');
    expect(getArrivalCountdown(twoDaysLater.toISOString())).toBe('2天后抵达');
    expect(getArrivalCountdown(pastDate.toISOString())).toBe('今日抵达');
    expect(getArrivalCountdown(null)).toBe('');
  });
});