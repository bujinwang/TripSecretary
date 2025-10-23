/**
 * DigitalArrivalCard Model Tests - Schema v2.0
 * Tests for the generic Digital Arrival Card model supporting TDAC, MDAC, SDAC, HKDAC
 */

import DigitalArrivalCard from '../DigitalArrivalCard';
import SecureStorageService from '../../services/security/SecureStorageService';

// Mock SecureStorageService
jest.mock('../../services/security/SecureStorageService');

describe('DigitalArrivalCard Model - Schema v2.0', () => {
  let testUserId;
  let testEntryInfoId;
  let testCard;

  beforeAll(async () => {
    // Mock database initialization
    SecureStorageService.initializeDatabase = jest.fn().mockResolvedValue(true);

    testUserId = 'test-user-' + Date.now();
    testEntryInfoId = 'entry_test_' + Date.now();
  });

  beforeEach(() => {
    testCard = new DigitalArrivalCard({
      entryInfoId: testEntryInfoId,
      userId: testUserId,
      cardType: 'TDAC',
      destinationId: 'thailand',
      arrCardNo: 'TH123456789',
      qrUri: 'https://example.com/qr/TH123456789',
      pdfUrl: 'https://example.com/pdf/TH123456789.pdf',
      status: 'success',
      apiResponse: { success: true, cardNumber: 'TH123456789' },
      processingTime: 2500,
      retryCount: 0,
      errorDetails: null,
      isSuperseded: 0,
      version: 1
    });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      SecureStorageService.deleteUserData = jest.fn().mockResolvedValue(true);
      await SecureStorageService.deleteUserData(testUserId);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Initialization and Properties', () => {
    test('should initialize with all required properties', () => {
      expect(testCard.entryInfoId).toBe(testEntryInfoId);
      expect(testCard.userId).toBe(testUserId);
      expect(testCard.cardType).toBe('TDAC');
      expect(testCard.destinationId).toBe('thailand');
      expect(testCard.arrCardNo).toBe('TH123456789');
      expect(testCard.qrUri).toBe('https://example.com/qr/TH123456789');
      expect(testCard.pdfUrl).toBe('https://example.com/pdf/TH123456789.pdf');
      expect(testCard.status).toBe('success');
      expect(testCard.processingTime).toBe(2500);
      expect(testCard.retryCount).toBe(0);
      expect(testCard.isSuperseded).toBe(0);
      expect(testCard.version).toBe(1);
    });

    test('should generate unique ID', () => {
      const id1 = DigitalArrivalCard.generateId();
      const id2 = DigitalArrivalCard.generateId();

      expect(id1).toMatch(/^dac_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^dac_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('should support different card types', () => {
      const cardTypes = ['TDAC', 'MDAC', 'SDAC', 'HKDAC'];

      cardTypes.forEach(type => {
        const card = new DigitalArrivalCard({
          entryInfoId: testEntryInfoId,
          userId: testUserId,
          cardType: type,
          destinationId: 'thailand'
        });
        expect(card.cardType).toBe(type);
      });
    });
  });

  describe('Save and Load Operations', () => {
    test('should save DigitalArrivalCard successfully', async () => {
      // Mock save operation
      SecureStorageService.saveDigitalArrivalCard = jest.fn().mockResolvedValue({
        id: testCard.id,
        success: true
      });

      const result = await testCard.save();

      expect(SecureStorageService.saveDigitalArrivalCard).toHaveBeenCalledWith({
        id: testCard.id,
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        arrCardNo: 'TH123456789',
        qrUri: 'https://example.com/qr/TH123456789',
        pdfUrl: 'https://example.com/pdf/TH123456789.pdf',
        submittedAt: expect.any(String),
        submissionMethod: 'api',
        status: 'success',
        apiResponse: JSON.stringify({ success: true, cardNumber: 'TH123456789' }),
        processingTime: 2500,
        retryCount: 0,
        errorDetails: null,
        isSuperseded: 0,
        supersededAt: null,
        supersededBy: null,
        supersededReason: null,
        version: 1,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      expect(result.success).toBe(true);
    });

    test('should load DigitalArrivalCard by ID', async () => {
      const mockData = {
        id: 'dac_test_123',
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        arrCardNo: 'TH123456789',
        qrUri: 'https://example.com/qr/TH123456789',
        pdfUrl: 'https://example.com/pdf/TH123456789.pdf',
        submittedAt: new Date().toISOString(),
        submissionMethod: 'api',
        status: 'success',
        apiResponse: JSON.stringify({ success: true, cardNumber: 'TH123456789' }),
        processingTime: 2500,
        retryCount: 0,
        errorDetails: null,
        isSuperseded: 0,
        supersededAt: null,
        supersededBy: null,
        supersededReason: null,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      SecureStorageService.getDigitalArrivalCard = jest.fn().mockResolvedValue(mockData);

      const loaded = await DigitalArrivalCard.load('dac_test_123');

      expect(loaded).toBeInstanceOf(DigitalArrivalCard);
      expect(loaded.id).toBe('dac_test_123');
      expect(loaded.cardType).toBe('TDAC');
      expect(loaded.arrCardNo).toBe('TH123456789');
      expect(loaded.apiResponse).toEqual({ success: true, cardNumber: 'TH123456789' });
    });

    test('should return null when loading non-existent card', async () => {
      SecureStorageService.getDigitalArrivalCard = jest.fn().mockResolvedValue(null);

      const loaded = await DigitalArrivalCard.load('non-existent-id');

      expect(loaded).toBeNull();
    });
  });

  describe('Query Operations', () => {
    test('should get all DigitalArrivalCards by entryInfoId', async () => {
      const mockCards = [
        {
          id: 'dac_1',
          entryInfoId: testEntryInfoId,
          cardType: 'TDAC',
          status: 'success',
          apiResponse: JSON.stringify({ success: true })
        },
        {
          id: 'dac_2',
          entryInfoId: testEntryInfoId,
          cardType: 'MDAC',
          status: 'success',
          apiResponse: JSON.stringify({ success: true })
        }
      ];

      SecureStorageService.getDigitalArrivalCardsByEntryInfoId = jest.fn().mockResolvedValue(mockCards);

      const cards = await DigitalArrivalCard.getByEntryInfoId(testEntryInfoId);

      expect(cards).toHaveLength(2);
      expect(cards[0]).toBeInstanceOf(DigitalArrivalCard);
      expect(cards[0].cardType).toBe('TDAC');
      expect(cards[1].cardType).toBe('MDAC');
    });

    test('should get latest successful DigitalArrivalCard by entryInfoId and cardType', async () => {
      const mockCard = {
        id: 'dac_latest',
        entryInfoId: testEntryInfoId,
        cardType: 'TDAC',
        status: 'success',
        submittedAt: new Date().toISOString(),
        apiResponse: JSON.stringify({ success: true, cardNumber: 'TH123456789' })
      };

      SecureStorageService.getLatestSuccessfulDigitalArrivalCard = jest.fn().mockResolvedValue(mockCard);

      const card = await DigitalArrivalCard.getLatestSuccessful(testEntryInfoId, 'TDAC');

      expect(card).toBeInstanceOf(DigitalArrivalCard);
      expect(card.id).toBe('dac_latest');
      expect(card.cardType).toBe('TDAC');
      expect(card.status).toBe('success');
    });

    test('should return null when no successful card exists', async () => {
      SecureStorageService.getLatestSuccessfulDigitalArrivalCard = jest.fn().mockResolvedValue(null);

      const card = await DigitalArrivalCard.getLatestSuccessful(testEntryInfoId, 'TDAC');

      expect(card).toBeNull();
    });
  });

  describe('Superseding Logic', () => {
    test('should mark card as superseded', async () => {
      SecureStorageService.saveDigitalArrivalCard = jest.fn().mockResolvedValue({ success: true });

      const result = await testCard.markAsSuperseded('dac_new_123', 'User submitted updated information');

      expect(testCard.isSuperseded).toBe(1);
      expect(testCard.supersededBy).toBe('dac_new_123');
      expect(testCard.supersededReason).toBe('User submitted updated information');
      expect(testCard.supersededAt).toBeDefined();

      expect(SecureStorageService.saveDigitalArrivalCard).toHaveBeenCalled();
    });
  });

  describe('Summary and Display', () => {
    test('should generate correct summary', () => {
      const summary = testCard.getSummary();

      expect(summary).toEqual({
        id: testCard.id,
        cardType: 'TDAC',
        destinationId: 'thailand',
        arrCardNo: 'TH123456789',
        status: 'success',
        submittedAt: testCard.submittedAt,
        isSuperseded: false,
        qrUri: 'https://example.com/qr/TH123456789',
        pdfUrl: 'https://example.com/pdf/TH123456789.pdf'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle failed card submission', () => {
      const failedCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        status: 'failed',
        errorDetails: { code: 'API_ERROR', message: 'Service unavailable' },
        retryCount: 2
      });

      expect(failedCard.status).toBe('failed');
      expect(failedCard.errorDetails).toEqual({ code: 'API_ERROR', message: 'Service unavailable' });
      expect(failedCard.retryCount).toBe(2);
    });

    test('should handle pending status', () => {
      const pendingCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        status: 'pending'
      });

      expect(pendingCard.status).toBe('pending');
    });
  });

  describe('Full Workflow Test', () => {
    test('should complete full TDAC submission workflow', async () => {
      // 1. Create initial card
      const initialCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        status: 'pending'
      });

      // 2. Mock successful save
      SecureStorageService.saveDigitalArrivalCard = jest.fn().mockResolvedValue({ success: true });

      // 3. Save initial card
      await initialCard.save();

      // 4. Update with successful submission data
      initialCard.status = 'success';
      initialCard.arrCardNo = 'TH987654321';
      initialCard.qrUri = 'https://example.com/qr/TH987654321';
      initialCard.pdfUrl = 'https://example.com/pdf/TH987654321.pdf';
      initialCard.apiResponse = { success: true, cardNumber: 'TH987654321' };
      initialCard.processingTime = 1800;

      // 5. Save updated card
      await initialCard.save();

      // 6. Verify final state
      expect(initialCard.status).toBe('success');
      expect(initialCard.arrCardNo).toBe('TH987654321');
      expect(initialCard.processingTime).toBe(1800);

      // 7. Test summary generation
      const summary = initialCard.getSummary();
      expect(summary.status).toBe('success');
      expect(summary.arrCardNo).toBe('TH987654321');
      expect(summary.isSuperseded).toBe(false);
    });

    test('should handle card superseding workflow', async () => {
      // 1. Create first successful card
      const firstCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        status: 'success',
        arrCardNo: 'TH111111111'
      });

      // 2. Create second card that will supersede the first
      const secondCard = new DigitalArrivalCard({
        entryInfoId: testEntryInfoId,
        userId: testUserId,
        cardType: 'TDAC',
        destinationId: 'thailand',
        status: 'success',
        arrCardNo: 'TH222222222'
      });

      // 3. Mock save operations
      SecureStorageService.saveDigitalArrivalCard = jest.fn().mockResolvedValue({ success: true });

      // 4. Save both cards
      await firstCard.save();
      await secondCard.save();

      // 5. Mark first card as superseded by second
      await firstCard.markAsSuperseded(secondCard.id, 'User resubmitted with updated information');

      // 6. Verify superseding
      expect(firstCard.isSuperseded).toBe(1);
      expect(firstCard.supersededBy).toBe(secondCard.id);
      expect(firstCard.supersededReason).toBe('User resubmitted with updated information');
      expect(firstCard.supersededAt).toBeDefined();

      // 7. Verify second card is not superseded
      expect(secondCard.isSuperseded).toBe(0);
      expect(secondCard.supersededBy).toBeNull();
    });
  });
});