// Passport routes
import { Hono } from 'hono';

export const passportRouter = new Hono();

// GET /api/passports - Get user's passports
passportRouter.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const results = await c.env.DB.prepare(
      'SELECT * FROM passports WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();
    
    return c.json({ passports: results.results });
  } catch (error) {
    console.error('Passports fetch error:', error);
    return c.json({ error: 'Failed to fetch passports' }, 500);
  }
});

// POST /api/passports - Save passport
passportRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const passportData = await c.req.json();
  
  try {
    const passport = await c.env.DB.prepare(
      `INSERT INTO passports (
        user_id, type, passport_no, name, name_en, gender,
        birth_date, nationality, issue_date, expiry_date, 
        issue_place, ocr_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    ).bind(
      userId,
      passportData.type,
      passportData.passportNo,
      passportData.name,
      passportData.nameEn,
      passportData.gender,
      passportData.birthDate,
      passportData.nationality,
      passportData.issueDate,
      passportData.expiryDate,
      passportData.issuePlace,
      JSON.stringify(passportData.raw || {})
    ).first();
    
    return c.json(passport);
  } catch (error) {
    console.error('Passport save error:', error);
    return c.json({ error: 'Failed to save passport' }, 500);
  }
});

// DELETE /api/passports/:id - Delete passport
passportRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  
  try {
    const result = await c.env.DB.prepare(
      'DELETE FROM passports WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Passport not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Passport delete error:', error);
    return c.json({ error: 'Failed to delete passport' }, 500);
  }
});
