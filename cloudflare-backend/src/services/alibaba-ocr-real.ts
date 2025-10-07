import * as crypto from 'crypto';

/**
 * Real Alibaba Cloud OCR Service Implementation
 * 
 * Supports:
 * - Passport Recognition (护照识别)
 * - Flight Ticket Recognition (机票识别)
 * - Hotel Booking Recognition (酒店预订单识别)
 * 
 * Documentation: https://help.aliyun.com/zh/ocr/
 */

interface OCRConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region?: string; // Default: cn-shanghai
}

export class AlibabaOCRReal {
  private accessKeyId: string;
  private accessKeySecret: string;
  private region: string;
  private endpoint: string;

  constructor(config: OCRConfig) {
    this.accessKeyId = config.accessKeyId;
    this.accessKeySecret = config.accessKeySecret;
    this.region = config.region || 'cn-shanghai';
    this.endpoint = `ocr.${this.region}.aliyuncs.com`;
  }

  /**
   * Recognize Passport
   * Uses: RecognizePassport API
   */
  async recognizePassport(imageBuffer: ArrayBuffer): Promise<any> {
    const base64Image = this.arrayBufferToBase64(imageBuffer);
    
    const params = {
      ImageURL: '', // Leave empty when using ImageContent
      ImageContent: base64Image,
    };

    const result = await this.callOCRAPI('RecognizePassport', params);
    
    // Parse result
    const data = result.Data;
    return {
      type: data.Type || '中国护照',
      passport_no: data.PassportNo || data.Number,
      name: data.Name,
      name_en: data.NameEnglish || data.EnglishName,
      gender: data.Sex || data.Gender,
      birth_date: data.BirthDate || data.DateOfBirth,
      nationality: data.Nationality || data.Country,
      issue_date: data.IssueDate || data.DateOfIssue,
      expiry_date: data.ExpiryDate || data.DateOfExpiry,
      issue_place: data.IssuePlace || data.PlaceOfIssue,
      raw: result, // Store full response for debugging
    };
  }

  /**
   * Recognize Flight Ticket
   * Uses: RecognizeTravelItinerary API
   */
  async recognizeTicket(imageBuffer: ArrayBuffer): Promise<any> {
    const base64Image = this.arrayBufferToBase64(imageBuffer);
    
    const params = {
      ImageURL: '',
      ImageContent: base64Image,
    };

    const result = await this.callOCRAPI('RecognizeTravelItinerary', params);
    
    const data = result.Data;
    const items = data.Items || [];
    const firstItem = items[0] || {};
    
    return {
      flight_number: firstItem.FlightNumber,
      arrival_date: firstItem.Date || firstItem.FlightDate,
      departure_city: firstItem.Departure || firstItem.From,
      arrival_city: firstItem.Destination || firstItem.To,
      departure_time: firstItem.DepartureTime,
      arrival_time: firstItem.ArrivalTime,
      passenger_name: data.Name,
      id_number: data.IdNumber,
      raw: result,
    };
  }

  /**
   * Recognize Hotel Booking
   * Uses: RecognizeGeneral (general text recognition) + custom parsing
   */
  async recognizeHotel(imageBuffer: ArrayBuffer): Promise<any> {
    const base64Image = this.arrayBufferToBase64(imageBuffer);
    
    const params = {
      ImageURL: '',
      ImageContent: base64Image,
    };

    // Use general OCR for hotel bookings
    const result = await this.callOCRAPI('RecognizeGeneral', params);
    
    // Parse text content for hotel information
    const content = result.Data?.Content || '';
    
    // Extract hotel information using regex patterns
    const hotelName = this.extractPattern(content, /(酒店名称|Hotel Name)[：:]\s*([^\n]+)/i) || 
                      this.extractPattern(content, /Hotel[：:]\s*([^\n]+)/i);
    
    const address = this.extractPattern(content, /(地址|Address)[：:]\s*([^\n]+)/i);
    
    const phone = this.extractPattern(content, /(电话|Phone|Tel)[：:]\s*([\d\s\-+]+)/i);
    
    const checkIn = this.extractPattern(content, /(入住|Check[\s-]?in)[：:]\s*([\d\-/]+)/i);
    
    const checkOut = this.extractPattern(content, /(离店|Check[\s-]?out)[：:]\s*([\d\-/]+)/i);
    
    return {
      hotel_name: hotelName || '未识别',
      address: address || '',
      phone: phone || '',
      check_in: checkIn || '',
      check_out: checkOut || '',
      raw_text: content,
      raw: result,
    };
  }

  /**
   * Call Alibaba Cloud OCR API with signature v3
   */
  private async callOCRAPI(action: string, params: any): Promise<any> {
    const timestamp = new Date().toISOString();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    const requestParams = {
      Format: 'JSON',
      Version: '2021-07-07', // Latest OCR API version
      AccessKeyId: this.accessKeyId,
      SignatureMethod: 'HMAC-SHA256',
      Timestamp: timestamp,
      SignatureVersion: '1.0',
      SignatureNonce: nonce,
      Action: action,
      ...params,
    };

    // Sort parameters
    const sortedParams = Object.keys(requestParams)
      .sort()
      .map(key => `${this.percentEncode(key)}=${this.percentEncode(requestParams[key])}`)
      .join('&');

    // Build string to sign
    const stringToSign = `POST&${this.percentEncode('/')}&${this.percentEncode(sortedParams)}`;

    // Calculate signature
    const signature = this.sign(stringToSign, this.accessKeySecret + '&');
    
    // Add signature to params
    const finalParams = {
      ...requestParams,
      Signature: signature,
    };

    // Make request
    const url = `https://${this.endpoint}`;
    const body = new URLSearchParams(finalParams as any).toString();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OCR API Error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    if (result.Code) {
      throw new Error(`OCR API Error: ${result.Code} - ${result.Message}`);
    }

    return result;
  }

  /**
   * Sign the request
   */
  private sign(stringToSign: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(stringToSign, 'utf8');
    return hmac.digest('base64');
  }

  /**
   * Percent encode for signature
   */
  private percentEncode(str: string): string {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Extract pattern from text
   */
  private extractPattern(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    if (match) {
      return match[match.length - 1].trim();
    }
    return null;
  }
}

/**
 * Helper function to determine if credentials are real or mock
 */
export function isRealCredentials(accessKeyId: string, accessKeySecret: string): boolean {
  return accessKeyId !== 'mock-key' && 
         accessKeySecret !== 'mock-secret' &&
         !accessKeyId.startsWith('mock') &&
         !accessKeySecret.startsWith('mock');
}
