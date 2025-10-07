import { AlibabaOCRReal, isRealCredentials } from './alibaba-ocr-real';

// Alibaba Cloud OCR Service
// Automatically uses real API when valid credentials are provided,
// otherwise falls back to mock data for development
export class AlibabaOCR {
  private accessKeyId: string;
  private accessKeySecret: string;
  private realClient: AlibabaOCRReal | null;
  private useMock: boolean;

  constructor(accessKeyId: string, accessKeySecret: string) {
    this.accessKeyId = accessKeyId;
    this.accessKeySecret = accessKeySecret;
    this.useMock = !isRealCredentials(accessKeyId, accessKeySecret);
    
    if (!this.useMock) {
      this.realClient = new AlibabaOCRReal({
        accessKeyId,
        accessKeySecret,
        region: 'cn-shanghai', // Change to your preferred region
      });
      console.log('✅ Using real Alibaba OCR API');
    } else {
      this.realClient = null;
      console.log('⚠️ Using mock OCR data (set real credentials to use API)');
    }
  }

  async recognizePassport(imageBuffer: ArrayBuffer): Promise<any> {
    if (this.realClient) {
      return await this.realClient.recognizePassport(imageBuffer);
    }
    
    // Mock data for development
    return {
      type: '中国护照',
      passport_no: 'E12345678',
      name: '张伟',
      name_en: 'ZHANG WEI',
      gender: '男',
      birth_date: '1990-01-01',
      nationality: '中国',
      issue_date: '2020-01-01',
      expiry_date: '2030-01-01',
      issue_place: '北京',
    };
  }

  async recognizeTicket(imageBuffer: ArrayBuffer): Promise<any> {
    if (this.realClient) {
      return await this.realClient.recognizeTicket(imageBuffer);
    }
    
    // Mock data for development
    return {
      flight_number: 'CA981',
      arrival_date: '2025-01-15',
      departure_city: '北京',
      arrival_city: '曼谷',
    };
  }

  async recognizeHotel(imageBuffer: ArrayBuffer): Promise<any> {
    if (this.realClient) {
      return await this.realClient.recognizeHotel(imageBuffer);
    }
    
    // Mock data for development
    return {
      hotel_name: 'Bangkok Grand Hotel',
      address: '123 Sukhumvit Road, Bangkok 10110, Thailand',
      phone: '+66 2 123 4567',
      check_in: '2025-01-15',
      check_out: '2025-01-20',
    };
  }
}
