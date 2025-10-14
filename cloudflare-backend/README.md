# BorderBuddy Cloudflare Workers Backend

This is the backend API for the BorderBuddy (入境通) app, built on Cloudflare Workers.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
# Create the database
npx wrangler d1 create chujingtong-db

# Copy the database_id from output and update wrangler.toml

# Initialize schema
npx wrangler d1 execute chujingtong-db --file=./src/db/schema.sql
```

### 3. Create R2 Bucket

```bash
npx wrangler r2 bucket create chujingtong-storage
```

### 4. Set Secrets

```bash
# Set API keys and secrets
npx wrangler secret put ALIBABA_OCR_KEY
npx wrangler secret put ALIBABA_OCR_SECRET
npx wrangler secret put QWEN_API_KEY
npx wrangler secret put WECHAT_APP_ID
npx wrangler secret put WECHAT_APP_SECRET
npx wrangler secret put JWT_SECRET
```

### 5. Development

```bash
# Run locally
npm run dev

# Deploy to production
npm run deploy
```

## API Endpoints

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
- `GET /api/history` - Get user's generation history
- `GET /api/history/:id` - Get specific generation
- `DELETE /api/history/:id` - Delete generation

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Passports
- `GET /api/passports` - Get user's passports
- `POST /api/passports` - Save passport
- `DELETE /api/passports/:id` - Delete passport

## Architecture

```
cloudflare-backend/
├── src/
│   ├── index.ts              # Main entry point
│   ├── routes/               # API route handlers
│   │   ├── auth.ts
│   │   ├── ocr.ts
│   │   ├── generate.ts
│   │   ├── history.ts
│   │   ├── profile.ts
│   │   └── passport.ts
│   ├── services/             # External service integrations
│   │   ├── alibaba-ocr.ts
│   │   └── qwen-ai.ts
│   ├── db/                   # Database
│   │   └── schema.sql
│   └── utils/                # Utilities
│       └── auth.ts
├── wrangler.toml             # Cloudflare config
└── package.json
```

## TODO

1. **Alibaba OCR Integration**
   - Implement actual API calls
   - Add signature generation
   - Handle rate limiting

2. **Qwen AI Integration**
   - Implement actual API calls
   - Optimize prompts for each destination
   - Add response validation

3. **PDF Generation**
   - Add PDF generation service
   - Upload to R2 storage
   - Generate public URLs

4. **WeChat SDK**
   - Complete OAuth flow
   - Add user info retrieval
   - Handle token refresh

5. **Testing**
   - Add unit tests
   - Add integration tests
   - Set up CI/CD

## Notes

- Currently uses mock data for OCR and AI services
- JWT tokens expire after 30 days
- All routes except `/api/auth/*` require authentication
- CORS is configured for localhost and production domain
