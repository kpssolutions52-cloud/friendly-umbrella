# ConstructionGuru Mobile App (Capacitor)

The web app is wrapped with [Capacitor](https://capacitorjs.com/) to run as native Android and iOS apps. The mobile app loads the web app from a URL (no static export needed).

## Prerequisites

### Android
- **Android Studio** – [Download](https://developer.android.com/studio)
- **Java 17+** (usually bundled with Android Studio)
- **Android SDK** – Installed via Android Studio

### iOS (macOS only)
- **Xcode** – [Download from App Store](https://apps.apple.com/app/xcode/id497799835)
- **CocoaPods** – `sudo gem install cocoapods`
- **Xcode Command Line Tools** – `xcode-select --install`

## How It Works

- The mobile app opens a WebView that loads the deployed web app
- Default URL: `https://friendly-umbrella-frontend.vercel.app`
- API calls use `NEXT_PUBLIC_API_URL` (your backend)
- No need to rebuild the mobile app when the web app changes

## Quick Start

### 1. Sync native projects (after changes to `public/` or Capacitor config)

```bash
npm run mobile:sync
# or from packages/frontend: npm run cap:sync
```

### 2. Open in IDE and run

**Android:**
```bash
npm run mobile:android
```
Then in Android Studio: Run the app (▶) or build an APK/AAB.

**iOS:**
```bash
npm run mobile:ios
```
Then in Xcode: Select a simulator or device and run (▶).

## Local Development

To load the app from your local dev server instead of production:

1. Start the web app: `npm run dev:frontend` (runs on port 3000)
2. Get your machine’s local IP: `ipconfig getifaddr en0` (macOS) or `hostname -I` (Linux)
3. For Android emulator, use: `http://10.0.2.2:3000` (special alias for host’s localhost)
4. For iOS simulator or a physical device, use your machine IP: `http://192.168.x.x:3000`
5. Run with that URL:
   ```bash
   CAPACITOR_SERVER_URL=http://10.0.2.2:3000 npm run mobile:android
   # or for iOS
   CAPACITOR_SERVER_URL=http://YOUR_IP:3000 npm run mobile:ios
   ```

## Configuration

Edit `packages/frontend/capacitor.config.ts`:

- **server.url** – Web app URL (default: production Vercel URL)
- **appId** – Bundle ID, e.g. `com.constructionguru.app`
- **appName** – App name in the launcher and app stores

## Building for Release

### Android
1. Open in Android Studio: `npm run mobile:android`
2. Build → Generate Signed Bundle / APK
3. Follow the signing wizard

### iOS

**Prerequisites (macOS only):** Xcode, CocoaPods (`sudo gem install cocoapods`), then `cd packages/frontend/ios/App && pod install`.

**Option A – Build simulator artifact (`.app`) from CLI**
```bash
cd packages/frontend
npm run cap:build:ios
```
Output: `ios/App/build/Build/Products/Release-iphonesimulator/App.app`

**Option B – Build archive for App Store / TestFlight**
1. Open in Xcode: `npm run mobile:ios` (from repo root) or `npx cap open ios` (from `packages/frontend`)
2. Select your team and signing certificate in the project settings
3. Product → Archive
4. Window → Organizer → Distribute App (App Store, Ad Hoc, or Enterprise)

## Troubleshooting

- **"Unable to locate a Java Runtime"** – Install Java 17+ or Android Studio
- **"No developer tools found" (iOS)** – Install Xcode and run `xcode-select --install`
- **WebView shows blank** – Confirm `server.url` is correct and reachable from the device/emulator
- **API calls fail** – Ensure `NEXT_PUBLIC_API_URL` points to your backend and CORS allows the app origin
