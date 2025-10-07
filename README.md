# 出国啰 (ChuGuoLuo) - 智能出入境助手 🌏✈️

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

---

## 📱 Screens

| Screen | Status | Description |
|--------|--------|-------------|
| Login | ✅ | WeChat + Phone login |
| Home | ✅ | Scan button, countries, documents |
| Scan Passport | ✅ | Camera preview with guide |
| Select Destination | ✅ | Country selection grid |
| Generating | ✅ | Animated progress bar |
| Result | ✅ | Success page with download |
| History | ✅ | Time-grouped records |
| Profile | ✅ | User settings & services |

---

## 📂 Project Structure

```
TripSecretary/
├── app/                    # React Native app
│   ├── components/         # Reusable UI components
│   ├── screens/            # 8 app screens
│   ├── navigation/         # React Navigation setup
│   └── theme/              # Design system
├── docs/                   # 📚 All documentation
├── App.js                  # App entry point
├── package.json            # Dependencies
└── app.json                # Expo config
```

---

## 📚 Documentation

All documentation is in the [`docs/`](docs/) folder:

### English Docs
- [**App Documentation**](docs/README_APP.md) - Complete guide
- [**Quick Start**](docs/QUICKSTART.md) - Get running in 5 minutes
- [**Project Structure**](docs/PROJECT_STRUCTURE.md) - Detailed file tree

### Chinese Docs (中文文档)
- [产品设计文档](docs/智能出入境助手-产品设计文档.md)
- [最终技术栈确认](docs/MVP技术栈最终确认.md)
- [家庭账号与远程协助设计](docs/家庭账号与远程协助设计.md)
- [Cloudflare Workers详解](docs/Cloudflare-Workers详解.md)
- [微信登录集成方案](docs/微信登录集成方案.md)
- [UI设计规范](docs/UI设计规范.md)
- And 15+ more in [`docs/`](docs/)

---

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo
- **Navigation**: React Navigation (Stack + Tabs)
- **Backend**: Cloudflare Workers + D1 + R2
- **AI**: Alibaba Qwen-Max (通义千问)
- **OCR**: Alibaba Cloud OCR
- **Auth**: WeChat SDK

---

## 📦 Dependencies

```json
{
  "expo": "~49.0.0",
  "react-native": "0.72.6",
  "@react-navigation/native": "^6.1.9",
  "expo-camera": "~13.4.4"
}
```

See [package.json](package.json) for complete list.

---

## 🎨 Design System

- **Theme**: WeChat Green (#07C160)
- **Typography**: Large fonts (16px+) for elderly users
- **Spacing**: 8px grid system
- **Components**: Button, Card, Input, CountryCard

See [UI Design Guidelines](docs/UI设计规范.md) (Chinese)

---

## 🗺️ Roadmap

### ✅ V1.0 (Current - MVP)
- [x] Complete UI (8 screens)
- [x] Navigation setup
- [x] Design system
- [ ] API integration
- [ ] WeChat login
- [ ] PDF generation

### 🔄 V1.1 (Planned)
- [ ] Family account feature
- [ ] Remote assistance (bi-directional)
- [ ] Document management
- [ ] Cloud backup

### 🚀 V2.0 (Future)
- [ ] Voice guidance
- [ ] Video assistance
- [ ] Offline mode enhancement
- [ ] Apple Watch version

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
```

---

## 👥 Team

- **Product Design**: TripSecretary Team
- **Tech Stack**: Cloudflare + React Native + Alibaba AI
- **Target Users**: Chinese travelers aged 50-70

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

- Expo Team
- React Navigation Team
- Cloudflare Workers
- Alibaba Cloud

---

**出国啰** - Making international travel easier for everyone! 🌍✨

For questions: support@tripsecretary.com
