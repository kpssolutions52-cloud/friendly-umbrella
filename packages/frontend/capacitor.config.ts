import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.constructionguru.app',
  appName: 'Stravex QS AI Assistant',
  webDir: 'public',
  // Load web app from deployed URL (app has API routes, so we use URL loading)
  // For local dev: CAPACITOR_SERVER_URL=http://10.0.2.2:3000 (Android emulator) or your machine IP
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://friendly-umbrella-frontend.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
