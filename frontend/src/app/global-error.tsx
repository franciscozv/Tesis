'use client';

import { useEffect, useState } from 'react';
import './globals.css';

function detectErrorType(error: Error, isOnline: boolean): 'offline' | 'server' | 'generic' {
  if (!isOnline) return 'offline';
  const msg = error.message.toLowerCase();
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout') ||
    msg.includes('conexión') ||
    msg.includes('connect')
  ) {
    return 'server';
  }
  return 'generic';
}

const ERROR_CONFIG = {
  offline: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="2" y1="2" x2="22" y2="22" />
        <path d="M8.5 16.5a5 5 0 0 1 7 0" />
        <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
        <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
        <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
        <path d="M5 12.85A10 10 0 0 1 9.42 10" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
    title: 'Sin conexión a internet',
    description:
      'Parece que no hay conexión a internet. Revisa tu red y la página se recargará automáticamente al reconectarse.',
    showAutoReload: true,
  },
  server: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
        <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
    title: 'El servidor no responde',
    description:
      'No se pudo conectar al servidor. Es posible que esté temporalmente fuera de servicio. Intenta nuevamente en unos momentos.',
    showAutoReload: false,
  },
  generic: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    title: 'Ocurrió un error inesperado',
    description: 'Algo salió mal al cargar la página. Puedes intentar recargar o volver al inicio.',
    showAutoReload: false,
  },
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-reload when connection is restored
      reset();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reset]);

  const errorType = detectErrorType(error, isOnline);
  const config = ERROR_CONFIG[errorType];

  return (
    <html lang="es">
      <body>
        <div
          className="min-h-svh flex flex-col items-center justify-center px-6 text-center"
          style={{ backgroundColor: 'oklch(0.97 0.006 248)' }}
        >
          {/* Logo */}
          <img
            src="/logo_iep.png"
            alt="Logo IEP"
            width={64}
            height={64}
            style={{ borderRadius: '9999px', marginBottom: '2rem', opacity: 0.85 }}
          />

          {/* Icono de error */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              borderRadius: '9999px',
              backgroundColor: 'oklch(0.5471 0.1438 32.9149 / 0.1)',
              color: 'oklch(0.5471 0.1438 32.9149)',
              marginBottom: '1.5rem',
            }}
          >
            {config.icon}
          </div>

          {/* Título */}
          <h1
            style={{
              fontSize: '1.375rem',
              fontWeight: 600,
              color: 'oklch(0.18 0.04 248)',
              fontFamily: 'Lora, serif',
              marginBottom: '0.75rem',
            }}
          >
            {config.title}
          </h1>

          {/* Descripción */}
          <p
            style={{
              fontSize: '0.875rem',
              color: 'oklch(0.52 0.022 248)',
              maxWidth: '22rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}
          >
            {config.description}
          </p>

          {/* Estado de conexión en tiempo real */}
          {errorType === 'offline' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: isOnline ? 'oklch(0.55 0.15 145)' : 'oklch(0.52 0.022 248)',
                backgroundColor: isOnline ? 'oklch(0.55 0.15 145 / 0.1)' : 'oklch(0.87 0.012 248)',
                borderRadius: '9999px',
                padding: '0.375rem 0.875rem',
                marginBottom: '1.5rem',
                transition: 'all 0.3s',
              }}
            >
              <span
                style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: isOnline ? 'oklch(0.55 0.15 145)' : 'oklch(0.65 0.022 248)',
                }}
              />
              {isOnline ? 'Conexión restaurada, recargando…' : 'Sin conexión'}
            </div>
          )}

          {/* Botones */}
          <div
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: 'oklch(0.32 0.1 228)',
                color: 'oklch(1 0 0)',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              Reintentar
            </button>

            <a
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: 'oklch(0.93 0.012 248)',
                color: 'oklch(0.3 0.06 248)',
                textDecoration: 'none',
                border: '1px solid oklch(0.87 0.012 248)',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Ir al inicio
            </a>
          </div>

          {/* Digest para debug (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && error.digest && (
            <p
              style={{
                marginTop: '2rem',
                fontSize: '0.7rem',
                color: 'oklch(0.65 0.022 248)',
                fontFamily: 'monospace',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          {/* Pie */}
          <p
            style={{
              marginTop: '3rem',
              fontSize: '0.6875rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'oklch(0.52 0.022 248 / 0.4)',
            }}
          >
            IEP &mdash; Sistema de Gestión Ministerial
          </p>
        </div>
      </body>
    </html>
  );
}
