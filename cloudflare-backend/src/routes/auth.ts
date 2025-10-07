// Authentication routes
import { Hono } from 'hono';
import { generateJWT } from '../utils/auth';

export const authRouter = new Hono();

// POST /api/auth/wechat - WeChat login
authRouter.post('/wechat', async (c) => {
  const { code } = await c.req.json();
  
  if (!code) {
    return c.json({ error: 'Code is required' }, 400);
  }

  try {
    // Exchange code for openid
    const wechatResponse = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?` +
      `appid=${c.env.WECHAT_APP_ID}&` +
      `secret=${c.env.WECHAT_APP_SECRET}&` +
      `js_code=${code}&` +
      `grant_type=authorization_code`
    );
    
    const wechatData = await wechatResponse.json();
    
    if (wechatData.errcode) {
      return c.json({ error: wechatData.errmsg }, 400);
    }

    const { openid, session_key } = wechatData;
    
    // Find or create user
    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE wechat_openid = ?'
    ).bind(openid).first();
    
    if (!user) {
      const result = await c.env.DB.prepare(
        'INSERT INTO users (wechat_openid) VALUES (?) RETURNING *'
      ).bind(openid).first();
      user = result;
    }
    
    // Generate JWT token
    const token = await generateJWT(user.id as number, c.env.JWT_SECRET);
    
    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar_url,
      }
    });
  } catch (error) {
    console.error('WeChat login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /api/auth/phone - Phone login
authRouter.post('/phone', async (c) => {
  const { phone, code } = await c.req.json();
  
  if (!phone || !code) {
    return c.json({ error: 'Phone and code are required' }, 400);
  }

  // TODO: Verify SMS code
  // For now, accept any code for development
  
  try {
    // Find or create user
    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE phone = ?'
    ).bind(phone).first();
    
    if (!user) {
      const result = await c.env.DB.prepare(
        'INSERT INTO users (phone) VALUES (?) RETURNING *'
      ).bind(phone).first();
      user = result;
    }
    
    // Generate JWT token
    const token = await generateJWT(user.id as number, c.env.JWT_SECRET);
    
    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error('Phone login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});
