// Cloudflare Workers API - Main Entry Point
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth';
import { ocrRouter } from './routes/ocr';
import { generateRouter } from './routes/generate';
import { historyRouter } from './routes/history';
import { profileRouter } from './routes/profile';
import { passportRouter } from './routes/passport';
import { authMiddleware } from './utils/auth';

type Bindings = {
  DB: D1Database;
  STORAGE: R2Bucket;
  ALIBABA_OCR_KEY: string;
  ALIBABA_OCR_SECRET: string;
  QWEN_API_KEY: string;
  WECHAT_APP_ID: string;
  WECHAT_APP_SECRET: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:8081', 'https://chujingtong.com'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'chujingtong-api',
    version: '1.0.0',
  });
});

// Public routes (no auth required)
app.route('/api/auth', authRouter);

// Protected routes (auth required)
app.use('/api/*', authMiddleware);
app.route('/api/ocr', ocrRouter);
app.route('/api/generate', generateRouter);
app.route('/api/history', historyRouter);
app.route('/api/profile', profileRouter);
app.route('/api/passports', passportRouter);

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: err.message || 'Internal Server Error',
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
  }, 404);
});

export default app;
