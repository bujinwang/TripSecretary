// OCR routes
import { Hono } from 'hono';
import { AlibabaOCR } from '../services/alibaba-ocr';

export const ocrRouter = new Hono();

// POST /api/ocr/passport - Recognize passport
ocrRouter.post('/passport', async (c) => {
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile || !(imageFile instanceof File)) {
      return c.json({ error: 'Image file is required' }, 400);
    }
    
    const imageBuffer = await imageFile.arrayBuffer();
    
    // Upload to R2 temporary storage
    const imageKey = `temp/passport-${Date.now()}.jpg`;
    await c.env.STORAGE.put(imageKey, imageBuffer);
    
    // Call Alibaba OCR
    const ocr = new AlibabaOCR(c.env.ALIBABA_OCR_KEY, c.env.ALIBABA_OCR_SECRET);
    const result = await ocr.recognizePassport(imageBuffer);
    
    return c.json({
      type: result.type || '中国护照',
      passportNo: result.passport_no,
      name: result.name,
      nameEn: result.name_en,
      gender: result.gender,
      birthDate: result.birth_date,
      nationality: result.nationality,
      issueDate: result.issue_date,
      expiryDate: result.expiry_date,
      issuePlace: result.issue_place,
      raw: result,
    });
  } catch (error) {
    console.error('Passport OCR error:', error);
    return c.json({ error: 'OCR recognition failed' }, 500);
  }
});

// POST /api/ocr/ticket - Recognize flight ticket
ocrRouter.post('/ticket', async (c) => {
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile || !(imageFile instanceof File)) {
      return c.json({ error: 'Image file is required' }, 400);
    }
    
    const imageBuffer = await imageFile.arrayBuffer();
    
    // Call Alibaba OCR
    const ocr = new AlibabaOCR(c.env.ALIBABA_OCR_KEY, c.env.ALIBABA_OCR_SECRET);
    const result = await ocr.recognizeTicket(imageBuffer);
    
    return c.json({
      flightNumber: result.flight_number,
      arrivalDate: result.arrival_date,
      departureCity: result.departure_city,
      arrivalCity: result.arrival_city,
    });
  } catch (error) {
    console.error('Ticket OCR error:', error);
    return c.json({ error: 'OCR recognition failed' }, 500);
  }
});

// POST /api/ocr/hotel - Recognize hotel booking
ocrRouter.post('/hotel', async (c) => {
  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile || !(imageFile instanceof File)) {
      return c.json({ error: 'Image file is required' }, 400);
    }
    
    const imageBuffer = await imageFile.arrayBuffer();
    
    // Call Alibaba OCR
    const ocr = new AlibabaOCR(c.env.ALIBABA_OCR_KEY, c.env.ALIBABA_OCR_SECRET);
    const result = await ocr.recognizeHotel(imageBuffer);
    
    return c.json({
      hotelName: result.hotel_name,
      address: result.address,
      phone: result.phone,
      checkIn: result.check_in,
      checkOut: result.check_out,
    });
  } catch (error) {
    console.error('Hotel OCR error:', error);
    return c.json({ error: 'OCR recognition failed' }, 500);
  }
});
