// Simplified Cloudflare Workers API for testing
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
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
  origin: ['http://localhost:8081', 'http://localhost:19000', 'https://chujingtong.com'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'chujingtong-api',
    version: '1.0.0',
    message: 'Backend is running!',
  });
});

// Simple phone login (no real validation for now)
app.post('/api/auth/phone', async (c) => {
  const { phone, code } = await c.req.json();
  
  // Mock JWT token for testing
  const mockToken = 'mock-jwt-token-' + Date.now();
  
  return c.json({
    token: mockToken,
    user: {
      id: 1,
      name: '张伟',
      phone: phone,
    }
  });
});

// Simple OCR endpoints (return mock data for now)
app.post('/api/ocr/passport', async (c) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return c.json({
    type: '中国护照',
    passportNo: 'E' + Math.floor(Math.random() * 90000000 + 10000000),
    name: '张伟',
    nameEn: 'ZHANG WEI',
    gender: '男',
    birthDate: '1990-01-01',
    nationality: '中国',
    issueDate: '2020-01-01',
    expiryDate: '2030-01-01',
    issuePlace: '北京',
  });
});

app.post('/api/ocr/ticket', async (c) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15);
  
  return c.json({
    flightNumber: 'CA' + Math.floor(Math.random() * 9000 + 1000),
    arrivalDate: futureDate.toISOString().split('T')[0],
    departureCity: '北京',
    arrivalCity: '曼谷',
  });
});

app.post('/api/ocr/hotel', async (c) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return c.json({
    hotelName: 'Grand Hotel',
    address: '123 Main Street, City Center',
    phone: '+66 2 123 4567',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
});

// Generate entry form
app.post('/api/generate', async (c) => {
  const data = await c.req.json();
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return c.json({
    id: Date.now(),
    entryForm: {
      fullName: '张伟',
      passportNumber: 'E12345678',
      destination: data.destination?.name || '泰国',
      flightNumber: data.travelInfo?.flightNumber || 'CA981',
      arrivalDate: data.travelInfo?.arrivalDate || '2025-01-15',
      hotelName: data.travelInfo?.hotelName || 'Grand Hotel',
    },
    pdfUrl: 'https://example.com/mock-pdf-' + Date.now() + '.pdf',
    createdAt: new Date().toISOString(),
  });
});

// Get history
app.get('/api/history', (c) => {
  return c.json({
    items: [],
    total: 0,
  });
});

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
    path: c.req.path,
  }, 404);
});

export default app;
