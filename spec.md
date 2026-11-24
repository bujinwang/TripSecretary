# Product Specification

## 1. Problem Statement

TripSecretary (入境通) is a mobile application designed for Chinese travelers preparing for international entry requirements. Travelers often face complex, country-specific documentation (digital arrival cards, visa applications) with varying field requirements and validation rules. This app streamlines the process by providing a unified interface for data collection, document preparation, and automated submission to government APIs.

**Target Users:** Chinese citizens traveling internationally.

## 2. Goals & Non-Goals

### Goals
- **Multi-Country Support:** Provide configurable support for multiple destination countries (Thailand, Vietnam, Malaysia, etc.), each with its own entry requirements.
- **Digital Card Integration:** Automated submission to government APIs (e.g., Thai TDAC) and local storage of QR codes/PDFs.
- **Offline Support:** Allow users to access forms, guides, and saved data without an internet connection.
- **Data Reusability:** Save passport and personal information once, and reuse it across multiple trips.
- **Multi-Language:** Full support for Chinese and English throughout the application.
- **Secure Data Persistence:** Store user data securely using SQLite and AsyncStorage with encryption.
- **Backup & Restore:** Allow users to backup and restore all their data.

### Non-Goals
- Full e-Visa application processing (where not offered by government APIs).
- Real-time flight/hotel booking integrations.
- Acting as a legal or immigration advice service.

## 3. User Stories

- As a **Chinese traveler**, I want to fill out my passport information once so that I can reuse it for any destination.
- As a **traveler to Thailand**, I want to submit my T-DAC digital arrival card so that I can skip the manual form at the airport.
- As a **user**, I want to have my data backed up automatically so that I can restore it if I switch phones.
- As a **user**, I want to see a checklist of required funding proof so that I can prepare for immigration checks.
- As an **elderly user**, I want clear, large UI elements and simple navigation so that I can use the app easily.

## 4. Technical Constraints

- **Platform:** React Native (Expo SDK 54+).
- **UI Library:** Tamagui.
- **Database:** `expo-sqlite` (v16+).
- **State Persistence:** `@react-native-async-storage/async-storage`.
- **Secure Storage:** `expo-secure-store`.
- **Minimum iOS:** 13.0
- **Minimum Android:** API 21 (Lollipop)

## 5. Architecture & Design

The application follows a layered architecture:

1.  **Presentation (UI):** Screens (`app/screens/`) and reusable components (`app/components/`).
2.  **Business Logic (Services):** Data management, API communication, and validation (`app/services/`).
3.  **Data Access (Persistence):** SQLite for structured data, AsyncStorage for simple key-value, FileSystem for PDFs/images (`app/database/`).
4.  **Utilities (Helpers):** Pure utility functions for parsing, formatting, and validation (`app/utils/`).
5.  **Configuration:** Country-specific metadata, validation rules, and type mappings (`app/config/destinations/`).

For more details, see [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

## 6. Open Questions

- Cloud backup provider integration (iCloud / Google Drive) requires further design for multi-platform consistency.
- Incremental backup strategy needs performance profiling.
