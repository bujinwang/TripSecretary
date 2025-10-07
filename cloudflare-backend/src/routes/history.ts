// History routes
import { Hono } from 'hono';

export const historyRouter = new Hono();

// GET /api/history - Get user's generation history
historyRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  
  try {
    const results = await c.env.DB.prepare(
      `SELECT g.*, p.name as passport_name, p.passport_no
       FROM generations g
       LEFT JOIN passports p ON g.passport_id = p.id
       WHERE g.user_id = ?
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(userId, limit, offset).all();
    
    return c.json({
      items: results.results,
      total: results.results.length,
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
