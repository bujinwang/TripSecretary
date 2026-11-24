/**
 * 出境通 - Local OCR Service
 * Privacy-first OCR processing using on-device ML Kit
 * No data leaves the device - maximum privacy protection
 */

type MLKitBoundingBox = {
  width: number;
  height: number;
  left: number;
  top: number;
};

type MLKitElement = {
  text: string;
  confidence: number;
  bounds?: MLKitBoundingBox;
};

type MLKitLine = {
  text: string;
  confidence: number;
  elements?: MLKitElement[];
};

type MLKitBlock = {
  text: string;
  confidence: number;
  bounds?: MLKitBoundingBox;
  lines?: MLKitLine[];
};

type MLKitResult = {
  blocks: MLKitBlock[];
};

type TextRecognitionModule = {
  recognize: (imageUri: string) => Promise<MLKitResult>;
};

type PassportExtractedData = {
  passportNumber: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  expirationDate: string | null;
  nationality: string | null;
  issuingCountry: string | null;
  gender: string | null;
  personalNumber: string | null;
};

type OCRResult = {
  textBlocks: OCRTextBlock[];
  rawText: string;
  totalBlocks: number;
  averageConfidence: number;
};

type OCRTextBlock = {
  text: string;
  confidence: number;
  bounds?: MLKitBoundingBox;
  lines: OCRLine[];
};

type OCRLine = {
  text: string;
  confidence: number;
  elements?: MLKitElement[];
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

type ConfidenceScores = {
  overall: number;
  ocrQuality: number;
  fields: Record<string, number>;
};

type PassportExtractionResult = {
  success: boolean;
  data: PassportExtractedData;
  confidence: ConfidenceScores;
  completeness: number;
  validation: ValidationResult;
  method: 'local_ocr' | 'mock_data';
  privacy: {
    dataShared: boolean;
    imageShared: boolean;
    serverAccess: boolean;
    localProcessing: boolean;
    gdprCompliant: boolean;
  };
  raw: {
    textBlocks: OCRTextBlock[];
    rawText: string;
  };
};

let TextRecognition: TextRecognitionModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  TextRecognition = require('@react-native-ml-kit/text-recognition').default as TextRecognitionModule;
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn('ML Kit Text Recognition not available:', message);
}

class LocalOCRService {
  private readonly confidenceThreshold = 0.6;

  private readonly fieldConfidenceThreshold = 0.7;

  private readonly maxRetries = 2;

  /**
   * Process passport image using local OCR only
   * @param imageUri - URI of the passport image
   * @returns Extracted passport data
   */
  async extractPassportData(imageUri: string): Promise<PassportExtractionResult> {
    try {
      console.log('Starting local passport OCR processing...');

      if (!TextRecognition) {
        console.warn('OCR not available, returning mock data for development');
        return this.getMockPassportData();
      }

      const ocrResult = await this.extractTextFromImage(imageUri);
      const extractedData = this.parsePassportFields(ocrResult);
      const validation = this.validateExtractedData(extractedData);
      const confidence = this.calculateOverallConfidence(ocrResult, extractedData);
      const completeness = this.calculateCompleteness(extractedData);

      const result: PassportExtractionResult = {
        success: validation.isValid && confidence.overall > this.fieldConfidenceThreshold,
        data: extractedData,
        confidence,
        completeness,
        validation,
        method: 'local_ocr',
        privacy: {
          dataShared: false,
          imageShared: false,
          serverAccess: false,
          localProcessing: true,
          gdprCompliant: true
        },
        raw: {
          textBlocks: ocrResult.textBlocks,
          rawText: ocrResult.rawText
        }
      };

      console.log('Local OCR processing completed:', {
        success: result.success,
        completeness: result.completeness,
        confidence: result.confidence.overall
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Local OCR processing failed:', message);
      throw new Error(`OCR processing failed: ${message}`);
    }
  }

  /**
   * Extract text from image using ML Kit
   * @param imageUri - Image URI
   * @returns OCR result
   */
  async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    try {
      if (!TextRecognition) {
        throw new Error('Text recognition not available - ML Kit not installed');
      }

      const result = await TextRecognition.recognize(imageUri);
      const blocks = Array.isArray(result.blocks) ? result.blocks : [];

      const textBlocks: OCRTextBlock[] = blocks
        .filter(block => typeof block.confidence === 'number' && block.confidence > this.confidenceThreshold)
        .map(block => ({
          text: (block.text || '').trim(),
          confidence: block.confidence ?? 0,
          bounds: block.bounds,
          lines: (block.lines || []).map(line => ({
            text: (line.text || '').trim(),
            confidence: line.confidence ?? 0,
            elements: line.elements
          }))
        }))
        .filter(block => block.text.length > 0);

      const rawText = textBlocks.map(block => block.text).join('\n');

      const averageConfidence = textBlocks.length > 0
        ? textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textBlocks.length
        : 0;

      return {
        textBlocks,
        rawText,
        totalBlocks: textBlocks.length,
        averageConfidence
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Text extraction failed:', message);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Parse passport fields from OCR text using rule-based extraction
   * @param ocrResult - OCR result
   * @returns Extracted passport data
   */
  parsePassportFields(ocrResult: OCRResult): PassportExtractedData {
    const { textBlocks, rawText } = ocrResult;
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const data: PassportExtractedData = {
      passportNumber: null,
      fullName: null,
      dateOfBirth: null,
      expirationDate: null,
      nationality: null,
      issuingCountry: null,
      gender: null,
      personalNumber: null
    };

    data.passportNumber = this.extractPassportNumber(rawText, lines);
    data.fullName = this.extractFullName(lines, textBlocks);

    const dates = this.extractDates(rawText, lines);
    data.dateOfBirth = dates.dateOfBirth;
    data.expirationDate = dates.expirationDate;

    data.nationality = this.extractNationality(rawText, lines);
    data.issuingCountry = data.nationality;
    data.gender = this.extractGender(rawText);
    data.personalNumber = this.extractPersonalNumber(rawText);

    return data;
  }

  /**
   * Extract passport number using multiple patterns
   */
  extractPassportNumber(text: string, lines: string[]): string | null {
    void lines; // Currently unused but kept for potential future logic

    const patterns = [
      /\bE\d{8}\b/,
      /\b\d{9}\b/,
      /\b[A-Z]{2}\d{7}\b/,
      /\b[A-Z0-9]{6,12}\b/
    ];

    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern, 'gi'));
      if (matches) {
        const validMatches = matches.filter(match => this.isValidPassportNumber(match));
        if (validMatches.length > 0) {
          return validMatches[0].toUpperCase();
        }
      }
    }

    return null;
  }

  /**
   * Validate passport number format
   */
  isValidPassportNumber(number: string | null): boolean {
    if (!number || number.length < 6 || number.length > 12) {
      return false;
    }

    if (number.startsWith('E') && number.length === 9 && /^\d{8}$/.test(number.slice(1))) {
      return true;
    }

    if (/^\d{9}$/.test(number)) {
      return true;
    }

    if (/^[A-Z]{2}\d{7}$/.test(number)) {
      return true;
    }

    if (/^[A-Z0-9]{6,12}$/.test(number)) {
      return true;
    }

    return false;
  }

  /**
   * Extract full name from text lines
   */
  extractFullName(lines: string[], textBlocks: OCRTextBlock[]): string | null {
    void textBlocks;

    const candidates: Array<{ name: string; confidence: number; lineIndex: number }> = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      if (line.length < 2 || line.length > 50) {
        continue;
      }
      if (/\d{4}/.test(line)) {
        continue;
      }
      if (/^\d+$/.test(line)) {
        continue;
      }
      if (line.includes('<') && line.includes('>')) {
        continue;
      }

      const isAllCaps = line === line.toUpperCase();
      const hasSpaces = line.includes(' ');
      const wordCount = line.split(' ').filter(word => word.length > 0).length;

      if (wordCount >= 1 && wordCount <= 4 && (isAllCaps || hasSpaces)) {
        const confidence = this.calculateNameConfidence(line);
        if (confidence > 0.6) {
          candidates.push({
            name: line,
            confidence,
            lineIndex: i
          });
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates[0].name;
  }

  /**
   * Calculate confidence score for a potential name
   */
  calculateNameConfidence(name: string): number {
    let confidence = 0.5;

    if (name.length >= 5 && name.length <= 30) {
      confidence += 0.2;
    }

    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length >= 2 && words.length <= 3) {
      confidence += 0.2;
    }

    if (name === name.toUpperCase()) {
      confidence += 0.1;
    }

    if (/^[A-Z\s'-]+$/.test(name)) {
      confidence += 0.1;
    }

    if (/\d/.test(name)) {
      confidence -= 0.3;
    }

    if (/[^A-Z\s'-]/.test(name)) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract dates from text and classify them
   */
  extractDates(text: string, lines: string[]): { dateOfBirth: string | null; expirationDate: string | null } {
    void lines;

    const datePattern = /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/g;
    const dates: Array<{ date: string; raw: string; index: number; context: string }> = [];

    let match: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((match = datePattern.exec(text)) !== null) {
      const parsed = this.parseDate(match[0]);
      if (parsed) {
        const context = this.getContextAround(text, match.index, 50);
        dates.push({
          date: parsed,
          raw: match[0],
          index: match.index,
          context: context.toLowerCase()
        });
      }
    }

    const result: { dateOfBirth: string | null; expirationDate: string | null } = {
      dateOfBirth: null,
      expirationDate: null
    };

    if (dates.length === 1) {
      const dateValue = new Date(dates[0].date);
      const now = new Date();
      const isRecent = dateValue > now && dateValue < new Date(now.getTime() + 20 * 365 * 24 * 60 * 60 * 1000);

      if (isRecent) {
        result.expirationDate = dates[0].date;
      } else {
        result.dateOfBirth = dates[0].date;
      }
    } else if (dates.length >= 2) {
      const classified = this.classifyMultipleDates(dates);
      result.dateOfBirth = classified.dateOfBirth;
      result.expirationDate = classified.expirationDate;
    }

    return result;
  }

  /**
   * Classify multiple dates into DOB and expiration
   */
  classifyMultipleDates(
    dates: Array<{ date: string; raw: string; index: number; context: string }>
  ): { dateOfBirth: string | null; expirationDate: string | null } {
    const now = new Date();
    const result: { dateOfBirth: string | null; expirationDate: string | null } = { dateOfBirth: null, expirationDate: null };

    const scoredDates = dates.map(dateInfo => {
      const dateValue = new Date(dateInfo.date);
      let dobScore = 0;
      let expScore = 0;

      if (dateValue < now && dateValue > new Date(now.getTime() - 100 * 365 * 24 * 60 * 60 * 1000)) {
        dobScore += 1;
      }

      if (dateValue > now && dateValue < new Date(now.getTime() + 20 * 365 * 24 * 60 * 60 * 1000)) {
        expScore += 1;
      }

      if (dateInfo.context.includes('birth') || dateInfo.context.includes('born')) {
        dobScore += 2;
      }
      if (dateInfo.context.includes('expir') || dateInfo.context.includes('valid')) {
        expScore += 2;
      }

      return { ...dateInfo, dobScore, expScore };
    });

    scoredDates.sort((a, b) => b.dobScore - a.dobScore);
    if (scoredDates[0]?.dobScore > 0) {
      result.dateOfBirth = scoredDates[0].date;
    }

    scoredDates.sort((a, b) => b.expScore - a.expScore);
    if (scoredDates[0]?.expScore > 0) {
      result.expirationDate = scoredDates[0].date;
    }

    return result;
  }

  /**
   * Parse date string into standardized format
   */
  parseDate(dateStr: string): string | null {
    const formats = [
      /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/,
      /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/,
      /^(\d{4})[\/.-](\d{2})[\/.-](\d{2})$/
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        let year: string;
        let month: string;
        let day: string;

        if (match[1].length === 4) {
          [year, month, day] = match.slice(1);
        } else {
          [day, month, year] = match.slice(1);
        }

        const y = Number(year);
        const m = Number(month);
        const d = Number(day);

        if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        }
      }
    }

    return null;
  }

  /**
   * Extract nationality/country code
   */
  extractNationality(text: string, lines: string[]): string | null {
    void lines;

    const countryPattern = /\b([A-Z]{3})\b/g;
    const matches: string[] = [];

    let match: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((match = countryPattern.exec(text)) !== null) {
      const code = match[1];
      if (this.isValidCountryCode(code)) {
        matches.push(code);
      }
    }

    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Check if country code is valid
   */
  isValidCountryCode(code: string): boolean {
    const validCodes = [
      'CHN', 'USA', 'JPN', 'KOR', 'THA', 'SGP', 'MYS', 'TWN', 'HKG', 'MAC',
      'GBR', 'FRA', 'DEU', 'ITA', 'ESP', 'CAN', 'AUS', 'NZL', 'NLD', 'BEL',
      'CHE', 'AUT', 'SWE', 'NOR', 'DNK', 'FIN', 'POL', 'CZE', 'HUN', 'PRT'
    ];

    return validCodes.includes(code);
  }

  /**
   * Extract gender information
   */
  extractGender(text: string): string | null {
    const textLower = text.toLowerCase();

    if (textLower.includes(' m ') || textLower.includes(' male') || textLower.includes('<m>')) {
      return 'M';
    }

    if (textLower.includes(' f ') || textLower.includes(' female') || textLower.includes('<f>')) {
      return 'F';
    }

    const genderMatch = text.match(/\b[MFX]\b/);
    if (genderMatch) {
      const gender = genderMatch[0];
      if (gender === 'M' || gender === 'F' || gender === 'X') {
        return gender;
      }
    }

    return null;
  }

  /**
   * Extract personal number from MRZ
   */
  extractPersonalNumber(text: string): string | null {
    const mrzLines = text.split('\n').filter(line => line.includes('<'));

    for (const line of mrzLines) {
      const parts = line.split('<');
      if (parts.length >= 2) {
        const personalPart = parts[1];
        if (personalPart.length >= 14) {
          return personalPart.substring(0, 14);
        }
      }
    }

    return null;
  }

  /**
   * Get context around a position in text
   */
  getContextAround(text: string, position: number, radius = 50): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.substring(start, end);
  }

  /**
   * Validate extracted passport data
   */
  validateExtractedData(data: PassportExtractedData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.passportNumber) {
      errors.push('Passport number not found');
    }

    if (!data.fullName) {
      errors.push('Name not found');
    }

    if (data.expirationDate) {
      const expiry = new Date(data.expirationDate);
      const now = new Date();
      if (expiry < now) {
        errors.push('Passport appears to be expired');
      }
    }

    if (data.dateOfBirth) {
      const birth = new Date(data.dateOfBirth);
      const now = new Date();
      const age = now.getFullYear() - birth.getFullYear();
      if (age < 0 || age > 150) {
        warnings.push('Date of birth seems invalid');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate overall confidence score
   */
  calculateOverallConfidence(ocrResult: OCRResult, extractedData: PassportExtractedData): ConfidenceScores {
    const fieldConfidences: Record<string, number> = {
      passportNumber: extractedData.passportNumber ? 0.9 : 0.1,
      fullName: extractedData.fullName ? 0.8 : 0.2,
      dateOfBirth: extractedData.dateOfBirth ? 0.7 : 0.3,
      expirationDate: extractedData.expirationDate ? 0.7 : 0.3,
      nationality: extractedData.nationality ? 0.8 : 0.4
    };

    const fieldWeights: Record<string, number> = {
      passportNumber: 0.3,
      fullName: 0.25,
      dateOfBirth: 0.15,
      expirationDate: 0.15,
      nationality: 0.15
    };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const [field, weight] of Object.entries(fieldWeights)) {
      if (fieldConfidences[field] !== undefined) {
        weightedSum += fieldConfidences[field] * weight;
        totalWeight += weight;
      }
    }

    const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const ocrQuality = ocrResult.averageConfidence;
    const adjustedOverall = (overall * 0.7) + (ocrQuality * 0.3);

    return {
      overall: Math.min(adjustedOverall, 1.0),
      ocrQuality,
      fields: fieldConfidences
    };
  }

  /**
   * Calculate data completeness score
   */
  calculateCompleteness(data: PassportExtractedData): number {
    const fields: Array<keyof PassportExtractedData> = ['passportNumber', 'fullName', 'dateOfBirth', 'expirationDate', 'nationality'];
    const present = fields.filter(field => Boolean(data[field])).length;
    return Math.round((present / fields.length) * 100);
  }

  /**
   * Get suggestions for improving OCR results
   */
  getImprovementSuggestions(result: PassportExtractionResult): string[] {
    const suggestions: string[] = [];

    if (result.confidence.ocrQuality < 0.7) {
      suggestions.push('Ensure the image is well-lit and in focus');
      suggestions.push('Hold the camera steady while capturing');
    }

    if (result.completeness < 70) {
      suggestions.push('Make sure the entire passport data page is visible');
      suggestions.push('Try different angles if text is unclear');
    }

    if (!result.data.passportNumber) {
      suggestions.push('Ensure the passport number section is clearly visible');
    }

    if (!result.data.fullName) {
      suggestions.push('Make sure the name field is in the frame');
    }

    return suggestions;
  }

  /**
   * Get mock passport data for development when OCR is not available
   */
  getMockPassportData(): PassportExtractionResult {
    const mockData: PassportExtractedData = {
      passportNumber: 'E123456789',
      fullName: '张三 (ZHANG SAN)',
      dateOfBirth: '1990-05-15',
      expirationDate: '2030-05-15',
      nationality: 'CHN',
      issuingCountry: 'CHN',
      gender: 'M',
      personalNumber: '12345678901234'
    };

    return {
      success: true,
      data: mockData,
      confidence: {
        overall: 0.95,
        ocrQuality: 0.9,
        fields: {
          passportNumber: 0.95,
          fullName: 0.9,
          dateOfBirth: 0.95,
          expirationDate: 0.95,
          nationality: 0.9
        }
      },
      completeness: 100,
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      },
      method: 'mock_data',
      privacy: {
        dataShared: false,
        imageShared: false,
        serverAccess: false,
        localProcessing: true,
        gdprCompliant: true
      },
      raw: {
        textBlocks: [
          {
            text: 'E123456789',
            confidence: 0.95,
            bounds: { width: 100, height: 20, left: 10, top: 10 },
            lines: []
          }
        ],
        rawText: 'E123456789\n张三\n1990-05-15\n2030-05-15\nCHN'
      }
    };
  }
}

export default LocalOCRService;
