# Backend Quick Start Guide

## 🚀 Local Development

### Step 1: Install Dependencies

```bash
cd cloudflare-backend
npm install
```

### Step 2: Configure Environment

The `.dev.vars` file is already set up with mock credentials for local development:

```bash
# .dev.vars (current setup - works with mock data)
ALIBABA_OCR_KEY=mock-key
ALIBABA_OCR_SECRET=mock-secret
QWEN_API_KEY=mock-key
WECHAT_APP_ID=mock-app-id
WECHAT_APP_SECRET=mock-secret
JWT_SECRET=development-jwt-secret-key-change-in-production
```

**✅ You can start development immediately with mock data!**

### Step 3: Start Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:8787`

### Step 4: Test the API

Open a new terminal and test:

```bash
# Health check
curl http://localhost:8787/

# Test OCR (mock data)
curl -X POST http://localhost:8787/api/ocr/passport \
  -F "image=@test-image.jpg"

# Test generation (mock data)
curl -X POST http://localhost:8787/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "passportId": 1,
    "destination": {"id": "th", "name": "泰国"},
    "travelInfo": {
      "flightNumber": "CA981",
      "arrivalDate": "2025-01-15",
      "hotelName": "Bangkok Hotel"
    }
  }'
```

---

## 🔧 Using Real APIs (Optional)

### When You Have Real Credentials

1. **Update `.dev.vars`** with your real credentials:

```bash
# Real credentials
ALIBABA_OCR_KEY=your-real-access-key-id
ALIBABA_OCR_SECRET=your-real-access-key-secret
QWEN_API_KEY=sk-your-real-qwen-api-key
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your-wechat-app-secret
JWT_SECRET=generate-a-strong-random-string
```

2. **Restart the dev server**:

```bash
npm run dev
```

The services will automatically detect real credentials and use the actual APIs!

Look for these console messages:
- ✅ Using real Alibaba OCR API
- ✅ Using real Qwen AI API

---

## 📁 Project Structure

```
cloudflare-backend/
├── src/
│   ├── index.ts                    # Main entry (complex routing)
│   ├── index-simple.ts             # Simple entry (current default)
│   ├── routes/
│   │   ├── auth.ts                 # Authentication
│   │   ├── ocr.ts                  # OCR endpoints
│   │   ├── generate.ts             # AI generation
│   │   ├── history.ts              # History management
│   │   ├── profile.ts              # User profile
│   │   └── passport.ts             # Passport management
│   ├── services/
│   │   ├── alibaba-ocr.ts          # OCR service (auto-switch)
│   │   ├── alibaba-ocr-real.ts     # Real OCR implementation
│   │   ├── qwen-ai.ts              # AI service (auto-switch)
│   │   ├── qwen-ai-real.ts         # Real AI implementation
│   │   └── pdf.ts                  # PDF generation
│   ├── db/
│   │   ├── schema.sql              # Database schema
│   │   └── queries.ts              # Database queries
│   └── utils/
│       ├── auth.ts                 # JWT auth
│       └── validation.ts           # Input validation
├── .dev.vars                       # Local environment variables
├── wrangler.toml                   # Cloudflare config
└── package.json
```

---

## 🧪 Available Endpoints

### Authentication
- `POST /api/auth/wechat` - WeChat login
- `POST /api/auth/phone` - Phone login

### OCR
- `POST /api/ocr/passport` - Recognize passport
- `POST /api/ocr/ticket` - Recognize flight ticket
- `POST /api/ocr/hotel` - Recognize hotel booking

### Generation
- `POST /api/generate` - Generate entry form
- `GET /api/generate/check` - Check for duplicates

### History
- `GET /api/history` - Get user history
- `GET /api/history/:id` - Get specific generation
- `DELETE /api/history/:id` - Delete generation

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Passports
- `GET /api/passports` - Get user's passports
- `POST /api/passports` - Save passport
- `DELETE /api/passports/:id` - Delete passport

---

## 🔍 Debugging

### View Logs

```bash
# Real-time logs
npm run tail

# Or check console output from npm run dev
```

### Common Issues

#### 1. Port already in use

```bash
# Kill process on port 8787
lsof -ti:8787 | xargs kill -9

# Or change port in wrangler.toml
[dev]
port = 8788
```

#### 2. Module import errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 3. TypeScript errors

```bash
# Check TypeScript
npx tsc --noEmit
```

---

## 🚢 Production Deployment

See [PHASE1_API_INTEGRATION_GUIDE.md](../PHASE1_API_INTEGRATION_GUIDE.md) for full deployment instructions.

Quick version:

```bash
# 1. Create D1 database
npx wrangler d1 create chuguoluo-db

# 2. Update wrangler.toml with database_id

# 3. Initialize schema
npx wrangler d1 execute chuguoluo-db --file=./src/db/schema.sql

# 4. Create R2 bucket
npx wrangler r2 bucket create chuguoluo-storage

# 5. Set production secrets
npx wrangler secret put ALIBABA_OCR_KEY
npx wrangler secret put ALIBABA_OCR_SECRET
npx wrangler secret put QWEN_API_KEY
npx wrangler secret put JWT_SECRET

# 6. Deploy!
npm run deploy
```

---

## 📊 Testing Checklist

- [ ] Start dev server successfully
- [ ] Test health endpoint (`GET /`)
- [ ] Test OCR with mock data
- [ ] Test generation with mock data
- [ ] Update with real credentials (when available)
- [ ] Test OCR with real images
- [ ] Test AI generation with real data
- [ ] Deploy to production
- [ ] Test production endpoints

---

## 💡 Tips

1. **Start with mock data** - No need to sign up for APIs immediately
2. **Test incrementally** - Add one real API at a time
3. **Check logs** - Use `npm run tail` to debug issues
4. **Use curl** - Easier than building frontend first
5. **Cost awareness** - Monitor API usage in Alibaba Cloud console

---

## 📚 Next Steps

1. ✅ Get backend running locally (you're here!)
2. 📱 Test with frontend app
3. 🔑 Sign up for real APIs when ready
4. 🚀 Deploy to production
5. 🧪 Beta test with real users

---

**Need help?** Check the [main guide](../PHASE1_API_INTEGRATION_GUIDE.md) or Cloudflare Workers docs!
