# 入境通 (ChuJingTong) - 智能出入境助手 🌏✈️

> An AI-powered travel assistant app for Chinese travelers (50-70 years old), helping them prepare immigration documents with ease.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the app
npx expo start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - 'w' for web browser
```

**First time?** See [Quick Start Guide](docs/QUICKSTART.md) (5 minutes)

---

## ✨ Features

- 📸 **Smart Passport Scan**: Auto-recognize passport information
- 🌍 **Popular Destinations**: Hong Kong, Taiwan, Thailand, USA, Canada, etc.
- 🤖 **AI Generation**: Auto-fill immigration forms and customs Q&A
- 💾 **History**: Save all generated documents
- 👨‍👩‍👧 **Family Assist**: Children can help parents remotely (V1.1)
- ⚡ **TDAC Hybrid Mode**: Submit Thailand arrival cards in 5-8 seconds (95%+ reliability)
- 🛡️ **TypeScript**: Full type safety across the application

---

## 📱 Screens

| Screen             | Status | Description                       |
| ------------------ | ------ | --------------------------------- |
| Login              | ✅     | WeChat + Phone login              |
| Home               | ✅     | Scan button, countries, documents |
| Scan Passport      | ✅     | Camera preview with guide         |
| Select Destination | ✅     | Country selection grid            |
| Generating         | ✅     | Animated progress bar             |
| Result             | ✅     | Success page with download        |
| History            | ✅     | Time-grouped records              |
| Profile            | ✅     | User settings & services          |

---

## 📂 Project Structure

```
BorderBuddy/
├── app/                    # React Native app
│   ├── components/         # Reusable UI components (TypeScript)
│   ├── screens/            # 8 app screens (TypeScript/TSX)
│   ├── navigation/         # React Navigation setup
│   └── theme/              # Design system
├── docs/                   # 📚 All documentation
├── App.tsx                 # App entry point (TypeScript)
├── package.json            # Dependencies
└── app.json                # Expo config
```

---

## 📚 Documentation

All documentation is in the [`docs/`](docs/) folder:

### English Docs

- [**App Documentation**](docs/README_APP.md) - Complete guide
- [**Quick Start**](docs/QUICKSTART.md) - Get running in 5 minutes
- [**Project Structure**](docs/architecture/PROJECT_STRUCTURE.md) - Detailed file tree
- [**TypeScript Migration Status**](docs/TYPESCRIPT_MIGRATION_STATUS.md) - Migration progress
- [**Adding New Country Guide**](docs/ADDING_NEW_COUNTRY.md) - TypeScript-friendly implementation

### Chinese Docs (中文文档)

- [产品设计文档](docs/design/智能出入境助手-产品设计文档.md)
- [最终技术栈确认](docs/architecture/MVP技术栈最终确认.md)
- [家庭账号与远程协助设计](docs/家庭账号与远程协助设计.md)
- [Cloudflare Workers详解](docs/architecture/Cloudflare-Workers详解.md)
- [微信登录集成方案](docs/integrations/微信登录集成方案.md)
- [UI设计规范](docs/design/UI设计规范.md)
- And 15+ more in [`docs/`](docs/)

---

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo + **TypeScript**
- **Navigation**: React Navigation (Stack + Tabs) with TypeScript types
- **Backend**: Cloudflare Workers + D1 + R2
- **AI**: Alibaba Qwen-Max (通义千问)
- **OCR**: Alibaba Cloud OCR
- **Auth**: WeChat SDK
- **Type Safety**: Full TypeScript coverage with progressive migration
- **Testing**: Jest + React Native Testing Library

---

## 📦 Dependencies

```json
{
  "expo": "~49.0.0",
  "react-native": "0.72.6",
  "@react-navigation/native": "^6.1.9",
  "expo-camera": "~13.4.4",
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0"
}
```

See [package.json](package.json) for complete list.

---

## 🎨 Design System

- **Theme**: WeChat Green (#07C160)
- **Typography**: Large fonts (16px+) for elderly users
- **Spacing**: 8px grid system
- **Components**: Button, Card, Input, CountryCard
- **Type Safety**: TypeScript interfaces for all components

See [UI Design Guidelines](docs/design/UI设计规范.md) (Chinese)

---

## 🗺️ Roadmap

### ✅ V1.0 (Current - MVP)

- [x] Complete UI (8 screens)
- [x] Navigation setup
- [x] Design system
- [x] **TDAC Hybrid Implementation** (⚡ 5-8s submission, 95%+ reliability, auto Cloudflare token)
- [x] Frontend-Backend API integration
- [x] PDF generation & sharing
- [x] **TypeScript Migration** - Progressive migration from JavaScript to TypeScript
- [ ] Real OCR API integration (Alibaba Cloud)
- [ ] Real AI API integration (Qwen)
- [ ] WeChat login

### 🔄 V1.1 (Planned)

- [ ] Family account feature
- [ ] Remote assistance (bi-directional)
- [ ] Document management
- [ ] Cloud backup
- [ ] **Complete TypeScript Coverage** - Finish remaining JS file migrations

### 🚀 V2.0 (Future)

- [ ] Voice guidance
- [ ] Video assistance
- [ ] Offline mode enhancement
- [ ] Apple Watch version
- [ ] **Advanced TypeScript Features** - Utility types, conditional types, etc.

---

## 🧪 Development

```bash
# Install
npm install

# Start dev server
npx expo start

# Start with cache clear
npx expo start -c

# Run on specific platform
npx expo start --ios
npx expo start --android

# Type checking
npx tsc --noEmit

# Run tests
npm run test
npm run test:watch
npm run test:coverage
```

### TypeScript Development

```bash
# Check types without building
npx tsc --noEmit

# Build and type check
npx tsc

# Watch mode for type checking
npx tsc --watch
```

---

## 📱 Build & Deploy

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Publish update
expo publish

# Type check before build
npx tsc --noEmit
```

---

## 👥 Team

- **Product Design**: BorderBuddy Team
- **Tech Stack**: Cloudflare + React Native + Alibaba AI + TypeScript
- **Target Users**: Chinese travelers aged 50-70
- **Type Safety**: Progressive JavaScript to TypeScript migration

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

- Expo Team
- React Navigation Team
- Cloudflare Workers
- Alibaba Cloud
- TypeScript Team

---

## 🔄 TypeScript Migration Status

> **Status**: ✅ File migration complete - 100% TypeScript (.tsx/.ts files)
> **Coverage**: 100% TypeScript (598/598 source files migrated, some using @ts-nocheck)
> **Type Checking**: In progress (gradual type annotation phase)
> **Last Updated**: 2025-11-10

### Migration Progress

✅ **File Format Migration Complete (100%)**:

- All 598 source files converted to .tsx/.ts
- Core models, services, components, screens migrated
- Country configurations, templates, utilities converted
- No remaining .js files in production code

✅ **Type Annotation Phase Started**:

- **3 files completed**: Type definitions and configuration files converted
- **341 files remaining** with @ts-nocheck directives
- **Strict mode enabled** in TypeScript configuration
- **Systematic conversion** from type definitions → configuration → components

🔄 **Current Phase: Type Annotation & Type Safety**:

- Progressive removal of @ts-nocheck directives
- Addition of comprehensive TypeScript interfaces
- Enhanced type safety implementation
- Better IDE support and error prevention

📋 **Next Steps**:

- Continue systematic @ts-nocheck removal (341 files remaining)
- Add advanced TypeScript features
- Complete strict type checking implementation

See detailed progress in [docs/TYPESCRIPT_MIGRATION_STATUS.md](docs/TYPESCRIPT_MIGRATION_STATUS.md)

---

**入境通** - Making international travel easier for everyone! 🌍✨

For questions: support@borderbuddy.com
