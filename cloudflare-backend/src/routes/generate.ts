// Generation routes
import { Hono } from 'hono';
import { QwenAI } from '../services/qwen-ai';

export const generateRouter = new Hono();

// POST /api/generate - Generate entry form
generateRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const { passportId, destination, travelInfo } = await c.req.json();
  
  try {
    // Get passport info
    const passport = await c.env.DB.prepare(
      'SELECT * FROM passports WHERE id = ? AND user_id = ?'
    ).bind(passportId, userId).first();
    
    if (!passport) {
      return c.json({ error: 'Passport not found' }, 404);
    }
    
    // Check for duplicates
    const duplicate = await c.env.DB.prepare(
      `SELECT * FROM generations 
       WHERE passport_id = ? AND destination_id = ? 
       AND flight_number = ? AND arrival_date = ?
       LIMIT 1`
    ).bind(
      passportId,
      destination.id,
      travelInfo.flightNumber,
      travelInfo.arrivalDate
    ).first();
    
    if (duplicate) {
      return c.json({
        duplicate: true,
        existingId: duplicate.id,
      }, 409);
    }
    
    // Call AI to generate entry form
    const ai = new QwenAI(c.env.QWEN_API_KEY);
    const entryForm = await ai.generateEntryForm({
      passport,
      destination,
      travelInfo,
    });
    
    // Generate PDF URL (simplified - in production would actually generate PDF)
    const pdfKey = `pdfs/${userId}/${Date.now()}-${destination.id}.pdf`;
    const pdfUrl = `https://storage.chuguoluo.com/${pdfKey}`;
    
    // Save to database
    const generation = await c.env.DB.prepare(
      `INSERT INTO generations (
        user_id, passport_id, destination_id, destination_name,
        flight_number, arrival_date, hotel_name, hotel_address,
        contact_phone, stay_duration, travel_purpose,
        additional_data, status, result_data, pdf_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    ).bind(
      userId,
      passportId,
      destination.id,
      destination.name,
      travelInfo.flightNumber,
      travelInfo.arrivalDate,
      travelInfo.hotelName,
      travelInfo.hotelAddress,
      travelInfo.contactPhone,
      travelInfo.stayDuration,
      travelInfo.travelPurpose,
      JSON.stringify(travelInfo),
      'completed',
      JSON.stringify(entryForm),
      pdfUrl
    ).first();
    
    return c.json({
      id: generation.id,
      entryForm,
      pdfUrl,
      createdAt: generation.created_at,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return c.json({ error: 'Generation failed' }, 500);
  }
});

// GET /api/generate/check - Check for duplicates
generateRouter.get('/check', async (c) => {
  const userId = c.get('userId');
  const passportId = c.req.query('passport_id');
  const destinationId = c.req.query('destination_id');
  const flightNumber = c.req.query('flight_number');
  const arrivalDate = c.req.query('arrival_date');
  
  try {
    const duplicate = await c.env.DB.prepare(
      `SELECT * FROM generations 
       WHERE user_id = ? AND passport_id = ? AND destination_id = ? 
       AND flight_number = ? AND arrival_date = ?
       LIMIT 1`
    ).bind(userId, passportId, destinationId, flightNumber, arrivalDate).first();
    
    if (duplicate) {
      return c.json({
        isDuplicate: true,
        existingId: duplicate.id,
        createdAt: duplicate.created_at,
      });
    }
    
    return c.json({ isDuplicate: false });
  } catch (error) {
    console.error('Duplicate check error:', error);
    return c.json({ error: 'Check failed' }, 500);
  }
});
