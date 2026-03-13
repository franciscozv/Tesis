'use client';

export const dynamic = 'force-dynamic';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-svh flex-col items-center justify-center gap-4">
          <h1 className="text-4xl font-bold">Error</h1>
          <p>Ocurrió un error inesperado.</p>
          <button onClick={reset} className="underline">
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
