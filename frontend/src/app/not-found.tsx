export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Página no encontrada</p>
      <a href="/dashboard" className="underline">
        Volver al inicio
      </a>
    </div>
  );
}
