// History routes
import { Hono } from 'hono';

const FLAG_MAP: Record<string, string> = {
  hk: '🇭🇰',
  th: '🇹🇭',
  tw: '🇹🇼',
  jp: '🇯🇵',
  kr: '🇰🇷',
  sg: '🇸🇬',
  my: '🇲🇾',
  us: '🇺🇸',
};

const safeParseJson = (value: unknown) => {
  if (!value || typeof value !== 'string') {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse JSON field in history row:', error);
    return {};
  }
};

export const historyRouter = new Hono();

// GET /api/history - Get user's generation history
historyRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  
  try {
    const results = await c.env.DB.prepare(
      `SELECT 
         g.*,
         p.name as passport_name,
         p.passport_no,
         p.type as passport_type,
         p.expiry_date as passport_expiry
       FROM generations g
       LEFT JOIN passports p ON g.passport_id = p.id
       WHERE g.user_id = ?
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(userId, limit, offset).all();

    const rows = (results?.results || []) as any[];

    const items = rows.map((row) => {
      const travelInfoExtras = safeParseJson(row.additional_data);
      const resultData = safeParseJson(row.result_data);

      return {
        id: row.id,
        createdAt: row.created_at,
        destination: {
          id: row.destination_id,
          name: row.destination_name,
          flag:
            travelInfoExtras.flag ||
            resultData.flag ||
            FLAG_MAP[row.destination_id] ||
            '🌍',
        },
        passport: {
          id: row.passport_id,
          name: row.passport_name,
          passportNo: row.passport_no,
          type: row.passport_type,
          expiry: row.passport_expiry,
        },
        travelInfo: {
          flightNumber: row.flight_number,
          arrivalDate: row.arrival_date,
          hotelName: row.hotel_name,
          hotelAddress: row.hotel_address,
          contactPhone: row.contact_phone,
          stayDuration: row.stay_duration,
          travelPurpose: row.travel_purpose,
          ...travelInfoExtras,
        },
        status: row.status,
        pdfUrl: row.pdf_url,
        resultData,
      };
    });

    return c.json({
      items,
      total: items.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

// GET /api/history/:id - Get specific generation
historyRouter.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  try {
    const generation = await c.env.DB.prepare(
      `SELECT g.*, p.name as passport_name, p.passport_no
       FROM generations g
       LEFT JOIN passports p ON g.passport_id = p.id
       WHERE g.id = ? AND g.user_id = ?`
    ).bind(id, userId).first();
    
    if (!generation) {
      return c.json({ error: 'Generation not found' }, 404);
    }
    
    return c.json(generation);
  } catch (error) {
    console.error('History item fetch error:', error);
    return c.json({ error: 'Failed to fetch generation' }, 500);
  }
});

// DELETE /api/history/:id - Delete generation
historyRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  try {
    const result = await c.env.DB.prepare(
      'DELETE FROM generations WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Generation not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('History delete error:', error);
    return c.json({ error: 'Failed to delete generation' }, 500);
  }
});
