export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import QueryProvider from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';

export const metadata: Metadata = {
  title: 'Sistema IEP - Gestión Iglesia',
  description: 'Sistema de gestión para Iglesia Evangélica Pentecostal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
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
