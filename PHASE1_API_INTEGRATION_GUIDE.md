# Phase 1: API Integration Guide

## 📋 Overview

This guide walks you through integrating real APIs into your BorderBuddy backend.

**Current Status**: Backend running with mock data  
**Goal**: Replace mock implementations with real API calls  
**Timeline**: 1-2 weeks

---

## 🔧 Step 1: Alibaba Cloud OCR Setup

### 1.1 Create Alibaba Cloud Account

1. Go to [Alibaba Cloud](https://www.alibabacloud.com/)
2. Sign up for an account
3. Complete identity verification (required for API access)

### 1.2 Enable OCR Services

1. Navigate to **Products** → **Artificial Intelligence** → **OCR**
2. Enable the following services:
   - **ID Card & Document Recognition** (for passports)
   - **General Text Recognition** (for tickets and hotel bookings)
3. Or use **Intelligent Document Processing** for better accuracy

### 1.3 Get API Credentials

1. Go to **AccessKey Management** in your account settings
2. Create a new AccessKey pair
3. Save the **AccessKey ID** and **AccessKey Secret** securely

**Important**: Never commit these keys to git!

### 1.4 API Endpoints

Alibaba Cloud OCR uses different endpoints based on region:
- **China (Beijing)**: `ocr.cn-beijing.aliyuncs.com`
- **Singapore**: `ocr.ap-southeast-1.aliyuncs.com`
- **US (Virginia)**: `ocr.us-east-1.aliyuncs.com`

Choose the closest region to your users for better performance.

### 1.5 Estimated Costs

- **Document Recognition**: ~¥0.01 per call (~$0.0014 USD)
- **Free Tier**: First 1,000 calls/month free
- **Monthly estimate** (1,000 users, 3 scans each): ~¥20-30 (~$3-4 USD)

---

## 🤖 Step 2: Qwen AI Setup

### 2.1 Access Qwen API (DashScope)

1. Go to [Alibaba Cloud DashScope](https://dashscope.aliyun.com/)
2. Log in with your Alibaba Cloud account
3. Enable **Qwen (通义千问)** model access

### 2.2 Get API Key

1. Navigate to **API-KEY Management**
2. Create a new API Key
3. Save the key securely

### 2.3 Choose Model

For entry form generation, use:
- **qwen-turbo**: Fast, cost-effective (recommended)
- **qwen-plus**: Better accuracy, higher cost
- **qwen-max**: Best performance, highest cost

### 2.4 Estimated Costs

- **Qwen-turbo**: ~¥0.008 per 1K tokens (~$0.0011 USD)
- **Average form generation**: ~2K tokens = ¥0.016 (~$0.002 USD)
- **Monthly estimate** (1,000 generations): ~¥16 (~$2.20 USD)

---

## 📱 Step 3: WeChat Integration Setup

### 3.1 Register WeChat Mini Program

1. Go to [WeChat Open Platform](https://mp.weixin.qq.com/)
2. Register a new Mini Program account
3. Complete business verification (required for production)

### 3.2 Get Credentials

1. In your Mini Program admin panel
2. Go to **Development** → **Development Settings**
3. Copy your **AppID** and **AppSecret**

### 3.3 Configure OAuth

1. Add your server domain to **Server Domain** whitelist
2. Add your API domain to **Request Domain** whitelist
3. Example: `https://api.chujingtong.com`

### 3.4 Development Mode

For testing without a real Mini Program:
- Use WeChat DevTools
- Enable "Do not verify legal domain names" in settings
- Use phone number login as fallback

---

## 💻 Step 4: Implement Real APIs

### 4.1 Update Alibaba OCR Service

The real implementation is ready in: `cloudflare-backend/src/services/alibaba-ocr-real.ts`

Key features:
- Signature v3 authentication
- Support for multiple OCR types
- Passport, ticket, and hotel recognition
- Error handling and retries

### 4.2 Update Qwen AI Service

The real implementation is ready in: `cloudflare-backend/src/services/qwen-ai-real.ts`

Key features:
- Streaming API support
- Structured output (JSON mode)
- Custom prompts per destination
- Token usage tracking

### 4.3 Test Locally First

```bash
cd cloudflare-backend

# Update .dev.vars with real credentials
# Then start dev server
npm run dev

# In another terminal, test with curl
curl -X POST http://localhost:8787/api/ocr/passport \
  -H "Authorization: Bearer test-token" \
  -F "image=@test-passport.jpg"
```

---

## 🚀 Step 5: Deploy to Production

### 5.1 Create D1 Database

```bash
cd cloudflare-backend

# Create database
npx wrangler d1 create chujingtong-db

# Output will show database_id - copy it!
# Example: database_id = "abc123-def456-ghi789"

# Update wrangler.toml with the database_id
```

### 5.2 Initialize Database Schema

```bash
# Run schema.sql
npx wrangler d1 execute chujingtong-db --file=./src/db/schema.sql

# Verify tables created
npx wrangler d1 execute chujingtong-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 5.3 Create R2 Bucket

```bash
# Create bucket for PDFs and images
npx wrangler r2 bucket create chujingtong-storage

# Verify it exists
npx wrangler r2 bucket list
```

### 5.4 Set Production Secrets

```bash
# Set all secrets
npx wrangler secret put ALIBABA_OCR_KEY
# Paste your key when prompted

npx wrangler secret put ALIBABA_OCR_SECRET
npx wrangler secret put QWEN_API_KEY
npx wrangler secret put WECHAT_APP_ID
npx wrangler secret put WECHAT_APP_SECRET
npx wrangler secret put JWT_SECRET
# Generate a strong random string for JWT
```

### 5.5 Update wrangler.toml

Uncomment the D1 and R2 bindings:

```toml
[[d1_databases]]
binding = "DB"
database_name = "chujingtong-db"
database_id = "your-actual-database-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "chujingtong-storage"
```

### 5.6 Deploy!

```bash
# Deploy to production
npm run deploy

# Output will show your worker URL
# Example: https://chujingtong-api.your-subdomain.workers.dev
```

### 5.7 Set Custom Domain (Optional)

1. Go to Cloudflare Dashboard → Workers
2. Select your worker
3. Click **Triggers** → **Add Custom Domain**
4. Enter: `api.chujingtong.com`
5. Cloudflare will automatically handle SSL

---

## 🧪 Step 6: Test Real APIs

### 6.1 Test OCR Endpoints

```bash
# Test passport recognition
curl -X POST https://api.chujingtong.com/api/ocr/passport \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@real-passport.jpg"

# Test ticket recognition
curl -X POST https://api.chujingtong.com/api/ocr/ticket \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@flight-ticket.jpg"
```

### 6.2 Test AI Generation

```bash
curl -X POST https://api.chujingtong.com/api/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "passportId": 1,
    "destination": {
      "id": "th",
      "name": "泰国"
    },
    "travelInfo": {
      "flightNumber": "CA981",
      "arrivalDate": "2025-01-15",
      "hotelName": "Bangkok Hotel"
    }
  }'
```

### 6.3 Monitor Logs

```bash
# Watch real-time logs
npm run tail

# Filter for errors
npm run tail | grep ERROR
```

---

## 📊 Step 7: Update Frontend

### 7.1 Update API Base URL

In `app/services/api.js`:

```javascript
// Change from localhost to production
const API_BASE_URL = 'https://api.chujingtong.com';

// Or use environment variables
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8787' 
  : 'https://api.chujingtong.com';
```

### 7.2 Test on Real Device

```bash
cd /Users/bujin/Documents/Projects/BorderBuddy

# Start Expo
npm start

# Scan QR with Expo Go app
# Test full flow: Login → Scan → Generate
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: OCR Returns Empty Results

**Cause**: Image quality too low or wrong format  
**Solution**:
- Ensure image is JPEG/PNG
- Minimum resolution: 600x400
- Compress to < 2MB before upload

### Issue 2: Qwen API Rate Limited

**Cause**: Too many requests  
**Solution**:
- Implement request queuing
- Add exponential backoff
- Cache common responses

### Issue 3: WeChat Login Fails

**Cause**: Domain not whitelisted  
**Solution**:
- Add API domain to WeChat whitelist
- Check AppID matches Mini Program
- Use phone login as fallback

### Issue 4: CORS Errors

**Cause**: Missing CORS headers  
**Solution**: Already handled in `src/index.ts` middleware

---

## 💰 Cost Estimate (Monthly)

**For 1,000 active users, ~2 generations each:**

| Service | Usage | Cost |
|---------|-------|------|
| Cloudflare Workers | 2,000 requests | Free (under 100K limit) |
| D1 Database | 2,000 queries | Free (under 5M limit) |
| R2 Storage | 2GB storage | $0.30 |
| Alibaba OCR | 6,000 calls | $8.40 (¥60) |
| Qwen AI | 2,000 generations | $4.40 (¥32) |
| **Total** | | **~$13/month** (¥92) |

**At scale (10,000 users):**
- Estimated: ~$130/month (¥920)
- Still very affordable!

---

## ✅ Phase 1 Completion Checklist

- [ ] Alibaba Cloud account created
- [ ] OCR service enabled and tested
- [ ] Qwen API access granted and tested
- [ ] WeChat Mini Program registered (or fallback ready)
- [ ] Real API implementations deployed
- [ ] D1 database created and schema initialized
- [ ] R2 bucket created
- [ ] All production secrets set
- [ ] Backend deployed to Cloudflare
- [ ] Frontend updated with production API URL
- [ ] End-to-end test successful on real device
- [ ] Monitoring and logging set up

---

## 🎯 Next Steps After Phase 1

Once APIs are integrated:

1. **Phase 2: Testing & Polish**
   - Comprehensive testing on iOS/Android
   - Improve error messages
   - Add offline support
   
2. **Phase 3: PDF Enhancement**
   - Design proper PDF templates
   - Add destination-specific formatting
   
3. **Phase 4: Beta Launch**
   - Invite test users
   - Collect feedback
   - Iterate quickly

---

## 📚 Useful Resources

- [Alibaba OCR Docs](https://help.aliyun.com/product/442365.html)
- [Qwen API Docs](https://help.aliyun.com/zh/dashscope/)
- [WeChat Mini Program Docs](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework Docs](https://hono.dev/)

---

**Need Help?**
- Check Cloudflare dashboard for error logs
- Use `wrangler tail` for real-time debugging
- Test APIs independently before integration
- Start with small test images

Good luck! 🚀
