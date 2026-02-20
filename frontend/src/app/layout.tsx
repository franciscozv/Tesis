import { IBM_Plex_Mono, Libre_Baskerville, Lora } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import QueryProvider from '@/providers/query-provider';

// Configuración de las fuentes
const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-libre-baskerville', // variable CSS personalizada
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
});

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
    <html
      lang="es"
      className={` ${libreBaskerville.variable} ${lora.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
