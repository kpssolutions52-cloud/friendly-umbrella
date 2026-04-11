import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { SITE_BRAND_NAME, SITE_ICON_PATH, SITE_LOGO_PATH } from '@/lib/siteBrand';

const inter = Inter({ subsets: ['latin'] });

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_BRAND_NAME,
    template: `%s · ${SITE_BRAND_NAME}`,
  },
  description:
    'AI assistant for quantity surveyors — supplier intelligence hub, Excel directory, and construction insights.',
  icons: {
    icon: [{ url: SITE_ICON_PATH, type: 'image/svg+xml' }],
    apple: SITE_ICON_PATH,
    shortcut: SITE_ICON_PATH,
  },
  openGraph: {
    type: 'website',
    locale: 'en',
    siteName: SITE_BRAND_NAME,
    title: SITE_BRAND_NAME,
    description:
      'AI assistant for quantity surveyors — supplier intelligence hub, Excel directory, and construction insights.',
    images: [{ url: SITE_LOGO_PATH, alt: SITE_BRAND_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_BRAND_NAME,
    description:
      'AI assistant for quantity surveyors — supplier intelligence hub, Excel directory, and construction insights.',
    images: [SITE_LOGO_PATH],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href={SITE_ICON_PATH} type="image/svg+xml" />
        <link rel="shortcut icon" href={SITE_ICON_PATH} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={SITE_ICON_PATH} />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={SITE_BRAND_NAME} />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

