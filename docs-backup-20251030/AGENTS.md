# Repository Guidelines

## Project Structure & Module Organization
TripSecretary is a React Native + Expo app backed by Cloudflare Workers. Core mobile code sits in `app/` (components, screens, navigation, services, theme, types, utils). Shared fixtures live in `data/`; `App.js` wires navigation and background services. Assets collect fonts, icons, and PDFs in `assets/`. Expo native scaffolding resides in `android/` and `ios/`. Cloudflare worker sources and automation live in `cloudflare-backend/`. Documentation stays in `docs/`. Tests live beside modules in `app/__tests__/` and in the root-level `tests/` suite for cross-screen flows.

## Build, Test, and Development Commands
From the repo root run `npm install`, then `npm start` (`npx expo start`) to launch Metro; press `i`, `a`, or `w` for iOS, Android, or web. `npm run android`, `npm run ios`, and `npm run web` call Expo Run targets. Run Jest via `npm run test`, `npm run test:watch`, and `npm run test:coverage`. For backend work execute `cd cloudflare-backend && npm install`, `npm run dev` for Wrangler dev, and `npm run deploy` to publish. Provision infrastructure with `npx wrangler d1 create chujingtong-db`, `npx wrangler d1 execute chujingtong-db --file src/db/schema.sql`, `npx wrangler r2 bucket create chujingtong-storage`, and `npx wrangler secret put <KEY>` for each secret. Use `./test-api.sh` to smoke test deployed routes.

## Coding Style & Naming Conventions
Author modern ES modules with optional TypeScript. Use two-space indentation, single quotes, and trailing commas in multi-line literals. Components and screens use `PascalCase`, hooks and services use `camelCase`, and Jest files follow `test-*.js`. Keep UI logic declarative, share primitives through `app/components/`, and pull tokens from `app/theme/` rather than hard-coding values.

## Testing Guidelines
Jest powers unit and feature tests. Place co-located specs in `app/__tests__/` when touching a single module, and add journey suites under `tests/` with names like `test-thailand-validator.js`. Mock async services (e.g., `NotificationService`, `BackgroundJobService`) and remote APIs for deterministic runs. Execute `npm run test` before commits and escalate to `npm run test:coverage` when altering core workflows or backend contracts.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`) with concise imperative summaries (`feat: add TDAC retry banner`). Bundle related changes per feature and note modified screens or worker routes in the body. PRs should link issues or stories, describe validation, include UI screenshots or recordings, and attach Jest output or Wrangler logs for backend edits. Request review only after linting, formatting, and tests pass.
