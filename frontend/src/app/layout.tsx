export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import QueryProvider from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const fontSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
});

const fontSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-serif',
});

const fontMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

const fontCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-condensed',
});

export const metadata: Metadata = {
  title: 'Sistema IEP - Gestión Iglesia',
  description: 'Sistema de gestión para Iglesia Evangélica Pentecostal',
  icons: { icon: '/logo_iep.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} ${fontCondensed.variable}`}
      >
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
