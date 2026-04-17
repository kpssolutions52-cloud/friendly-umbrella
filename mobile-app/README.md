# Construction Guru Mobile

Expo (React Native) app for Construction Guru. Connects to the existing Node.js backend at `/api/v1`.

## Prerequisites

- Node.js 18+
- iOS: Xcode (for simulator or device)
- Android: Android Studio / SDK (for emulator or device)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (optional; `npx expo` works)

## Setup

1. Install dependencies:
   ```bash
   cd mobile-app && npm install
   ```
2. Copy env and set API URL:
   ```bash
   cp .env.example .env
   # Edit .env: set EXPO_PUBLIC_API_URL to your backend (e.g. http://192.168.1.10:8000 for device)
   ```
3. Start the backend (from repo root):
   ```bash
   npm run dev:backend
   ```
4. Start Expo:
   ```bash
   npm start
   ```
   In app.json, `icon` and `splash` point to `./assets/`. If those files are missing, create them or use an Expo template (see assets/README.md).

## Project structure

- `App.tsx` — Root: AuthProvider + NavigationContainer + stack (Login vs Home).
- `src/store/AuthContext.tsx` — Auth state and restore session.
- `src/services/api/apiClient.ts` — HTTP client with Bearer token and 401 refresh/retry.
- `src/services/authService.ts` — login, register, getMe, logout using apiClient and SecureStore.
- `src/screens/LoginScreen.tsx` — Email/password login.
- `src/screens/HomeScreen.tsx` — Example home after login (user info + logout).

## Backend requirement

The app expects a refresh endpoint for long-lived sessions. If your backend does not yet expose it, add:

- `POST /api/v1/auth/refresh`  
  Body: `{ "refreshToken": "<string>" }`  
  Response: `{ "accessToken": "<string>" }`

## Build (EAS)

```bash
npx eas build --platform all
```

See [Expo EAS](https://docs.expo.dev/build/introduction/) for signing and store submission.
