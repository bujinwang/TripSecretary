// Authentication utilities
import { SignJWT, jwtVerify } from 'jose';
import { createMiddleware } from 'hono/factory';

export async function generateJWT(userId: number, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey);
  
  return token;
}

export async function verifyJWT(token: string, secret: string): Promise<{ userId: number }> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  const { payload } = await jwtVerify(token, secretKey);
  return payload as { userId: number };
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { userId } = await verifyJWT(token, c.env.JWT_SECRET);
    c.set('userId', userId);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});
