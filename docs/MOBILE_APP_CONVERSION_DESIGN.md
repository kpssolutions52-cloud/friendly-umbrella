# Construction Guru — Mobile App Conversion: Research & Architecture

This document outlines the analysis, technology choices, architecture, and implementation plan for converting the Construction Guru web application into a high-quality iOS and Android mobile app that reuses the existing Node.js backend.

---

## STEP 1 — Analyze Existing System

### Backend (Node.js REST)

- **API base:** All routes are under `/api/v1`.
- **Stack:** Express, JWT (access + refresh), role/tenant middleware.
- **Auth:** JWT access token (short-lived) and refresh token; `Authorization: Bearer <accessToken>` on protected routes. Middleware: `requireAuth`, `requireQS`, `requireSupplier`, etc.
- **Main domains (current MVP):**
  - **Auth:** `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `GET /auth/organizations?type=company|supplier`
  - **Public:** Products, suppliers, service providers, companies, categories (product & service)
  - **QS (company):** Product search, suppliers list, chat
  - **Supplier:** Products CRUD, profile (incl. logo), chat
  - **Prices:** Default/private prices, companies list
  - **Catalog:** Categories and catalog items

**Note:** `/auth/refresh` is not currently exposed in the active simplified auth routes. The backend should add `POST /api/v1/auth/refresh` with `{ refreshToken }` returning `{ accessToken }` so the mobile app can refresh tokens without re-login.

### Frontend (React / Next.js)

- **Router:** App Router; routes for `/`, `/auth/login`, `/auth/register`, `/customer|company|supplier|service-provider|admin/dashboard`, `/products/[id]`, `/chat`, `/rfq/[id]`, etc.
- **API client:** Custom `fetch` wrapper in `lib/api.ts`; base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Helpers: `apiGet`, `apiPost`, `apiPut`, `apiDelete`, `apiPostForm`; all attach `Authorization: Bearer <token>` and handle 401 with token refresh + retry.
- **Auth state:** Tokens in `localStorage`; user and loading in `AuthContext`; `login`, `register`, `logout`, `refreshUser`; protected routes redirect unauthenticated users to login.

### How the Mobile App Should Communicate with the Backend

1. **Same API contract:** Use the same base URL (configurable, e.g. `https://api.constructionguru.com` or dev URL). All requests to `/api/v1/*`.
2. **Auth header:** Send `Authorization: Bearer <accessToken>` on every authenticated request.
3. **Token storage:** Use **secure storage** (e.g. Expo SecureStore / react-native-keychain), not plain storage, for access and refresh tokens.
4. **Refresh flow:** On 401, call `POST /api/v1/auth/refresh` with `{ refreshToken }`; on success store new access token and retry the failed request once; on failure clear tokens and redirect to login.
5. **No backend rebuild required** for basic mobile support; only add the refresh endpoint if missing. Optionally add API version header or app version for analytics/support.

---

## STEP 2 — Best Mobile Tech Stack Comparison

| Criterion            | React Native | Flutter | Expo | Native (Swift/Kotlin) | PWA |
|----------------------|-------------|---------|------|------------------------|-----|
| **Performance**      | Very good   | Excellent | Same as RN (Expo is RN) | Best | Good for simple UIs |
| **Dev speed**        | High        | Medium  | Highest (managed workflow) | Low | High |
| **Maintainability**  | High        | High    | High | Two codebases         | High |
| **Reuse React**      | Yes         | No      | Yes  | No                     | Yes (same codebase) |
| **UI flexibility**   | High        | High    | High | Full                   | Limited (mobile UX) |
| **Ecosystem**         | Large       | Growing | RN + Expo modules      | Mature | Web |
| **Long-term scale**   | Proven      | Proven  | Proven                 | Proven | Limited for native UX |

- **React Native:** Single JS/TS codebase, native components, large ecosystem, team already knows React. Best fit when reusing React and wanting one mobile codebase.
- **Flutter:** Great performance and UI, but Dart and different paradigm; no reuse of existing React/frontend code.
- **Expo:** React Native with managed tooling (builds, OTA, secure store, etc.). Easiest path to ship and iterate; can eject to bare RN if needed.
- **Native (Swift + Kotlin):** Maximum control and performance but two codebases and no React reuse; higher cost and slower feature parity.
- **PWA:** One codebase with web, but limited push, offline, and native UX; not ideal for a “high-quality mobile app” with dashboards, forms, and file/camera use.

**Recommendation:** **Expo (React Native)** — best balance of reusing React knowledge, development speed, maintainability, and native UX. Expo provides secure storage, OTA updates, and a clear path to App Store / Play Store without managing Xcode/Android Studio initially.

---

## STEP 3 — Final Recommended Stack

| Layer              | Choice                | Rationale |
|--------------------|-----------------------|------------|
| **Mobile framework** | Expo (React Native)   | Managed workflow, OTA, secure store, single codebase, React reuse |
| **State management** | React Context + hooks (Zustand optional) | Matches web; add Zustand only if global state grows |
| **Navigation**       | React Navigation 6 (native stack + bottom tabs) | Standard, deep linking, native feel |
| **Networking**       | Fetch + thin API client layer | Same as web; interceptors for token and refresh |
| **Authentication**   | JWT in SecureStore + AuthContext | Secure storage, same flow as web |
| **Offline storage**  | Expo SecureStore (tokens) + AsyncStorage or MMKV (cache/prefs) | Secure for secrets; fast KV for cache |
| **Push notifications** | Expo Notifications (FCM + APNs) | One API for both platforms |
| **Analytics**        | Optional: Expo Application or custom events to backend | Lightweight start |
| **Error monitoring** | Optional: Sentry React Native or backend logging | Add when scaling |

---

## STEP 4 — Mobile App Architecture

```
/mobile-app
  /src
    /components     # Reusable UI (buttons, cards, inputs, lists)
    /screens        # Full-screen views (Login, Home, Dashboard, ProductDetail, etc.)
    /navigation     # Stack/tab navigators and linking config
    /services       # API client, auth service, and domain services
      /api          # apiClient, interceptors, types
      authService.ts
      productService.ts
      ...
    /store          # Global state (auth context, optional Zustand slices)
    /hooks          # useAuth, useProducts, etc.
    /utils          # helpers, constants, formatters
    /theme          # colors, typography, spacing
  App.tsx
  app.json
```

- **components:** Shared, presentational components; keep them dumb and testable.
- **screens:** One component per main screen; compose components and call hooks/services.
- **navigation:** Define stacks (auth stack, main app stack) and tabs (e.g. Home, Projects, Profile); central place for deep links.
- **services/api:** Single `apiClient` that uses base URL, attaches token, handles 401 + refresh and retry; all HTTP calls go through it.
- **services (authService, productService, …):** Encapsulate endpoints and map to app types; used by screens and hooks.
- **store:** Auth state (user, tokens, login/logout) in context; optional store for products, quotes, etc.
- **hooks:** Encapsulate loading/error/data and service calls (e.g. `useAuth`, `useProducts`).
- **utils / theme:** Shared constants, formatters, and design tokens for consistency and maintainability.

---

## STEP 5 — UX Design: Web to Mobile-First

- **Dashboard:** One primary metric and 2–3 actions per role; swipe or tabs for role-specific sections; pull-to-refresh; avoid dense tables — use cards and lists.
- **Project/task tracking:** List-by-status with swipe actions; bottom sheet or modal for quick add; large touch targets (min 44pt); skeleton loaders.
- **Notifications:** In-app list + push; tap opens relevant screen (e.g. quote, RFQ); clear “mark read” and grouping.
- **Document viewing:** Full-screen viewer with pinch-zoom; share/open in external app; optional offline cache for recent docs.
- **Forms:** One column; large inputs; sticky primary CTA; inline validation; optional save draft locally.
- **General:** Fewer clicks via bottom tabs and contextual actions; touch-friendly spacing; fast navigation with native stack animations; offline support for lists and drafts using cache and queue.

---

## STEP 6 — API Integration

- **apiClient:** Single module that:
  - Reads base URL from config/env.
  - Gets access token from secure storage (or in-memory after load).
  - Adds `Authorization: Bearer <accessToken>` to every request.
  - On 401: calls auth service `refreshToken()`, then retries request once; on refresh failure clears storage and triggers logout (e.g. via context).
- **authService:** `login`, `register`, `getMe`, `refreshToken`, `logout` (client-only clear); uses apiClient for all calls.
- **projectService / taskService / productService:** Methods like `getList`, `getById`, `create`, `update`; call apiClient and return typed data. Map backend DTOs to app models if needed.

Use **fetch** (or a small wrapper) to stay consistent with the web app; optional timeout and abort for slow networks.

---

## STEP 7 — Authentication Flow

1. **Login:** User enters email/password → `authService.login()` → backend returns `user` + `tokens` → store tokens in SecureStore, user in context → navigate to main app.
2. **Token storage:** Access and refresh tokens in **expo-secure-store** (or equivalent); read on app start to restore session.
3. **Token refresh:** On any 401 from apiClient, call `POST /api/v1/auth/refresh` with stored refresh token; store new access token and retry; if refresh fails, clear tokens and redirect to login.
4. **Logout:** Clear SecureStore and in-memory user; navigate to login screen.

Avoid storing tokens in AsyncStorage or plain storage; use secure storage only.

---

## STEP 8 — Mobile Features (Implementation Approach)

- **Push notifications:** Expo Notifications; register device token with backend (e.g. `POST /api/v1/me/device-token`); backend uses FCM/APNs to send; handle tap to open correct screen.
- **Offline caching:** Cache product list and key entities in AsyncStorage/MMKV with TTL; show cached data when offline and refresh when online; optional queue for mutations.
- **Image upload from camera:** Use `expo-image-picker`; get URI and send as multipart in `apiClient` (e.g. same endpoint as web for supplier logo).
- **File viewer:** Use `expo-document-picker` and `expo-file-system` or in-app webview for PDFs; open in system viewer when possible.
- **Location tagging:** Use `expo-location` for coordinates; send lat/lng in API payloads where backend supports it.
- **Biometric login:** After first login, store a flag and optionally encrypted refresh token; use `expo-local-authentication` to gate access to app or to confirm before sensitive actions.

---

## STEP 9 — Performance Optimization

- **Lazy loading:** Lazy-load tabs/screens with `React.lazy` + `Suspense` or React Navigation’s lazy option; load list data in chunks (pagination).
- **API caching:** Short TTL cache for product/category lists; invalidate on refresh or after mutations.
- **State management:** Keep server state in hooks or a small cache (e.g. React Query optional later); avoid duplicate requests for the same resource.
- **Image optimization:** Use `expo-image` or similar with resize and caching; thumbnails for lists, full size on detail.

---

## STEP 10 — Build & Deployment

- **iOS:** EAS Build (expo) or Xcode archive; configure signing and provisioning; submit to App Store Connect (TestFlight then production).
- **Android:** EAS Build or Android Studio; signing key; upload AAB to Google Play Console (internal → closed → production).
- **CI/CD:** EAS Submit + GitHub Actions (or similar): on tag or main, run tests, build with EAS, submit to stores; use environment secrets for API URL and keys.

---

## STEP 11 — Development Roadmap

- **Phase 1 — Project setup (1–2 weeks):** Expo init, navigation (auth + main), apiClient + auth service, secure token storage, login/register and role-based home.
- **Phase 2 — Core features (3–4 weeks):** Dashboards per role, product list/detail (public + QS/supplier), profile edit, supplier logo upload; reuse existing APIs.
- **Phase 3 — Advanced mobile (2–3 weeks):** Push, offline cache, camera upload, file viewer, biometric gate (optional).
- **Phase 4 — Testing & deployment (1–2 weeks):** E2E (Detox or Maestro), store listings, EAS Build and first release to TestFlight/Internal testing.

---

## STEP 12 — Starter Project

The starter project is generated under **`/mobile-app`** with:

- **Expo (React Native)** + TypeScript
- **Navigation:** Auth stack (Login) and main app (Home) with role-based entry; single stack that switches by `isAuthenticated`
- **API client:** `src/services/api/apiClient.ts` — centralized fetch wrapper with Bearer token and 401 refresh + retry
- **Authentication:** `expo-secure-store` for tokens, `src/store/AuthContext.tsx` for user and login/logout/restoreSession
- **Example screens:** `src/screens/LoginScreen.tsx` (email/password), `src/screens/HomeScreen.tsx` (user info + logout)
- **Services:** `authService.ts`, `productService.ts` (example) in `src/services/`
- **Clean folder structure:** `src/components`, `src/screens`, `src/navigation`, `src/services`, `src/store`, `src/utils`, `src/theme`

Code is production-oriented: error handling, loading states, and typed responses. **Backend change required:** add `POST /api/v1/auth/refresh` if not already present.
