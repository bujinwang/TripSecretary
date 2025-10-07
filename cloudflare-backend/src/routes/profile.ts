// Profile routes
import { Hono } from 'hono';

export const profileRouter = new Hono();

// GET /api/profile - Get user profile
profileRouter.get('/', async (c) => {
  const userId = c.get('userId');
  
  try {
    const user = await c.env.DB.prepare(
      'SELECT id, name, phone, avatar_url, created_at FROM users WHERE id = ?'
    ).bind(userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// PUT /api/profile - Update user profile
profileRouter.put('/', async (c) => {
  const userId = c.get('userId');
  const { name, avatar_url } = await c.req.json();
  
  try {
    const result = await c.env.DB.prepare(
      'UPDATE users SET name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
    ).bind(name, avatar_url, userId).first();
    
    return c.json(result);
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});
