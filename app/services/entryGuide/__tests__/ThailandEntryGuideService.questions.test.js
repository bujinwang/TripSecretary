// 泰国入境问题服务测试 - Thailand Entry Guide Service Questions Tests
import ThailandEntryGuideService from '../ThailandEntryGuideService';

describe('ThailandEntryGuideService - Immigration Questions', () => {
  let service;

  beforeEach(() => {
    service = new ThailandEntryGuideService();
  });

  describe('getImmigrationQuestions', () => {
    it('should return immigration questions configuration', () => {
      const questions = service.getImmigrationQuestions();

      expect(questions).toBeDefined();
      expect(questions.basic).toBeDefined();
      expect(questions.holiday).toBeDefined();
      expect(questions.business).toBeDefined();
      expect(questions.health_finance).toBeDefined();
      expect(questions.visa).toBeDefined();
    });
  });

  describe('generateQuestionsWithAnswers', () => {
    const mockTravelerProfile = {
      travelInfo: {
        travelPurpose: 'HOLIDAY',
        arrivalArrivalDate: '2025-01-15',
        departureDepartureDate: '2025-01-25',
        arrivalFlightNumber: 'FD501',
        departureFlightNumber: 'FD502',
        hotelName: 'Bangkok Grand Hotel',
        hotelAddress: '123 Sukhumvit Road, Bangkok',
        accommodationType: 'HOTEL',
        province: 'Bangkok',
        recentStayCountry: 'China',
        visaNumber: '',
      },
      passport: {
        fullName: 'ZHANG WEI',
        nationality: 'CHN',
      },
      personalInfo: {
        occupation: 'Engineer',
        email: 'zhang@example.com',
      },
    };

    it('should generate questions with answers for complete profile', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile);

      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);

      // Check that all questions have required properties
      questions.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('answer');
        expect(q).toHaveProperty('category');
        expect(q).toHaveProperty('required');
      });
    });

    it('should generate correct answer for purpose of visit', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile);
      const purposeQuestion = questions.find(q => q.id === 'purpose_of_visit');

      expect(purposeQuestion).toBeDefined();
      expect(purposeQuestion.answer).toBe('度假旅游');
    });

    it('should calculate correct length of stay', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile);
      const stayQuestion = questions.find(q => q.id === 'length_of_stay');

      expect(stayQuestion).toBeDefined();
      expect(stayQuestion.answer).toContain('10天');
    });

    it('should generate accommodation answer based on hotel type', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile);
      const accommodationQuestion = questions.find(q => q.id === 'accommodation');

      expect(accommodationQuestion).toBeDefined();
      expect(accommodationQuestion.answer).toContain('Bangkok Grand Hotel');
    });

    it('should generate return ticket answer', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile);
      const ticketQuestion = questions.find(q => q.id === 'return_ticket');

      expect(ticketQuestion).toBeDefined();
      expect(ticketQuestion.answer).toContain('FD502');
      expect(ticketQuestion.answer).toContain('2025-01-25');
    });

    it('should support English language', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile, {
        language: 'en',
      });

      const purposeQuestion = questions.find(q => q.id === 'purpose_of_visit');
      expect(purposeQuestion).toBeDefined();
      expect(purposeQuestion.answer).toBe('Holiday/Tourism');
    });

    it('should support Thai language', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile, {
        language: 'th',
      });

      const purposeQuestion = questions.find(q => q.id === 'purpose_of_visit');
      expect(purposeQuestion).toBeDefined();
      expect(purposeQuestion.answer).toBe('ท่องเที่ยว');
    });

    it('should include holiday-specific questions for holiday travelers', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile);
      const holidayQuestions = questions.filter(q => q.category === 'holiday');

      expect(holidayQuestions.length).toBeGreaterThan(0);
    });

    it('should not include business questions for holiday travelers', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile);
      const businessQuestions = questions.filter(q => q.category === 'business');

      expect(businessQuestions.length).toBe(0);
    });

    it('should include business questions for business travelers', () => {
      const businessProfile = {
        ...mockTravelerProfile,
        travelInfo: {
          ...mockTravelerProfile.travelInfo,
          travelPurpose: 'BUSINESS',
        },
      };

      const questions = service.generateQuestionsWithAnswers(businessProfile);
      const businessQuestions = questions.filter(q => q.category === 'business');

      expect(businessQuestions.length).toBeGreaterThan(0);
    });

    it('should filter optional questions when includeOptional is false', () => {
      const allQuestions = service.generateQuestionsWithAnswers(mockTravelerProfile, {
        includeOptional: true,
      });

      const requiredOnlyQuestions = service.generateQuestionsWithAnswers(mockTravelerProfile, {
        includeOptional: false,
      });

      expect(requiredOnlyQuestions.length).toBeLessThan(allQuestions.length);
      requiredOnlyQuestions.forEach(q => {
        expect(q.required).toBe(true);
      });
    });

    it('should handle visa-exempt entry', () => {
      const questions = service.generateQuestionsWithAnswers(mockTravelerProfile);
      const visaQuestion = questions.find(q => q.id === 'visa_type');

      expect(visaQuestion).toBeDefined();
      expect(visaQuestion.answer).toContain('免签');
    });

    it('should handle entry with visa number', () => {
      const profileWithVisa = {
        ...mockTravelerProfile,
        travelInfo: {
          ...mockTravelerProfile.travelInfo,
          visaNumber: 'TH123456789',
        },
      };

      const questions = service.generateQuestionsWithAnswers(profileWithVisa);
      const visaQuestion = questions.find(q => q.id === 'visa_type');

      expect(visaQuestion).toBeDefined();
      expect(visaQuestion.answer).toContain('TH123456789');
    });

    it('should return empty array for incomplete profile', () => {
      const incompleteProfile = {
        travelInfo: null,
      };

      const questions = service.generateQuestionsWithAnswers(incompleteProfile);
      expect(questions).toEqual([]);
    });
  });

  describe('getQuestionsByCategory', () => {
    const mockProfile = {
      travelInfo: {
        travelPurpose: 'HOLIDAY',
        arrivalArrivalDate: '2025-01-15',
        departureDepartureDate: '2025-01-25',
        arrivalFlightNumber: 'FD501',
        departureFlightNumber: 'FD502',
        hotelName: 'Test Hotel',
        hotelAddress: 'Test Address',
        accommodationType: 'HOTEL',
      },
    };

    it('should return only basic category questions', () => {
      const basicQuestions = service.getQuestionsByCategory(mockProfile, 'basic');

      expect(basicQuestions.length).toBeGreaterThan(0);
      basicQuestions.forEach(q => {
        expect(q.category).toBe('basic');
      });
    });

    it('should return only holiday category questions', () => {
      const holidayQuestions = service.getQuestionsByCategory(mockProfile, 'holiday');

      expect(holidayQuestions.length).toBeGreaterThan(0);
      holidayQuestions.forEach(q => {
        expect(q.category).toBe('holiday');
      });
    });
  });

  describe('getRequiredQuestions', () => {
    const mockProfile = {
      travelInfo: {
        travelPurpose: 'HOLIDAY',
        arrivalArrivalDate: '2025-01-15',
        departureDepartureDate: '2025-01-25',
        arrivalFlightNumber: 'FD501',
        departureFlightNumber: 'FD502',
        hotelName: 'Test Hotel',
        hotelAddress: 'Test Address',
        accommodationType: 'HOTEL',
      },
    };

    it('should return only required questions', () => {
      const requiredQuestions = service.getRequiredQuestions(mockProfile);

      expect(requiredQuestions.length).toBeGreaterThan(0);
      requiredQuestions.forEach(q => {
        expect(q.required).toBe(true);
      });
    });
  });

  describe('checkQuestionsCompleteness', () => {
    it('should return completeness status for complete profile', () => {
      const completeProfile = {
        travelInfo: {
          travelPurpose: 'HOLIDAY',
          arrivalArrivalDate: '2025-01-15',
          departureDepartureDate: '2025-01-25',
          arrivalFlightNumber: 'FD501',
          departureFlightNumber: 'FD502',
          hotelName: 'Test Hotel',
          hotelAddress: 'Test Address',
          accommodationType: 'HOTEL',
        },
      };

      const completeness = service.checkQuestionsCompleteness(completeProfile);

      expect(completeness).toHaveProperty('total');
      expect(completeness).toHaveProperty('answered');
      expect(completeness).toHaveProperty('missing');
      expect(completeness).toHaveProperty('percentage');
      expect(completeness).toHaveProperty('isComplete');
      expect(completeness).toHaveProperty('missingQuestions');

      expect(completeness.total).toBeGreaterThan(0);
      expect(completeness.answered).toBeGreaterThan(0);
      expect(completeness.percentage).toBeGreaterThan(0);
    });

    it('should identify missing answers', () => {
      const incompleteProfile = {
        travelInfo: {
          travelPurpose: 'HOLIDAY',
          // Missing dates and other required fields
        },
      };

      const completeness = service.checkQuestionsCompleteness(incompleteProfile);

      expect(completeness.isComplete).toBe(false);
      expect(completeness.missing).toBeGreaterThan(0);
      expect(completeness.missingQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('_shouldIncludeQuestion', () => {
    const mockTravelInfo = {
      travelPurpose: 'HOLIDAY',
      accommodationType: 'HOTEL',
    };

    it('should include question without conditions', () => {
      const questionConfig = {
        id: 'test',
        category: 'basic',
      };

      const result = service._shouldIncludeQuestion(questionConfig, mockTravelInfo);
      expect(result).toBe(true);
    });

    it('should include question when condition matches', () => {
      const questionConfig = {
        id: 'test',
        category: 'holiday',
        condition: { travelPurpose: 'HOLIDAY' },
      };

      const result = service._shouldIncludeQuestion(questionConfig, mockTravelInfo);
      expect(result).toBe(true);
    });

    it('should exclude question when condition does not match', () => {
      const questionConfig = {
        id: 'test',
        category: 'business',
        condition: { travelPurpose: 'BUSINESS' },
      };

      const result = service._shouldIncludeQuestion(questionConfig, mockTravelInfo);
      expect(result).toBe(false);
    });

    it('should handle array conditions', () => {
      const questionConfig = {
        id: 'test',
        category: 'business',
        condition: { travelPurpose: ['BUSINESS', 'MEETING'] },
      };

      const businessTravelInfo = { ...mockTravelInfo, travelPurpose: 'BUSINESS' };
      const result = service._shouldIncludeQuestion(questionConfig, businessTravelInfo);
      expect(result).toBe(true);

      const holidayResult = service._shouldIncludeQuestion(questionConfig, mockTravelInfo);
      expect(holidayResult).toBe(false);
    });
  });

  describe('_getLangSuffix', () => {
    it('should return correct suffix for supported languages', () => {
      expect(service._getLangSuffix('en')).toBe('En');
      expect(service._getLangSuffix('th')).toBe('Th');
      expect(service._getLangSuffix('zh')).toBe('Zh');
    });

    it('should default to En for unsupported languages', () => {
      expect(service._getLangSuffix('fr')).toBe('En');
      expect(service._getLangSuffix('unknown')).toBe('En');
    });
  });
});
