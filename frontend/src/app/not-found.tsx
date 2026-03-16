import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background px-6 text-center">
      {/* Logo */}
      <div
        className="mb-8 rounded-full p-1.5"
        style={{
          backgroundColor: 'oklch(0.32 0.1 228 / 0.08)',
          boxShadow: '0 0 0 1px oklch(0.32 0.1 228 / 0.18)',
        }}
      >
        <Image
          src="/logo_iep.png"
          alt="Logo Iglesia Evangélica Pentecostal"
          width={88}
          height={88}
          className="rounded-full opacity-90"
          priority
        />
      </div>

      {/* Número grande decorativo */}
      <p
        className="text-[9rem] font-bold leading-none select-none"
        style={{
          fontFamily: 'var(--font-serif)',
          color: 'oklch(0.32 0.1 228 / 0.12)',
        }}
      >
        404
      </p>

      {/* Título */}
      <h1
        className="mt-2 text-2xl font-semibold text-foreground"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Página no encontrada
      </h1>

      {/* Descripción */}
      <p className="mt-3 text-sm text-muted-foreground max-w-[280px] leading-relaxed">
        La dirección que buscas no existe o fue movida a otra ubicación.
      </p>

      {/* Divisor */}
      <div className="mt-8 w-10 h-px bg-border" />

      {/* CTA */}
      <Link
        href="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        style={{
          backgroundColor: 'oklch(0.32 0.1 228)',
          color: 'oklch(1 0 0)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver al Dashboard
      </Link>

      {/* Pie */}
      <p
        className="mt-16 text-[11px] tracking-widest uppercase"
        style={{ color: 'oklch(0.52 0.022 248 / 0.45)' }}
      >
        IEP &mdash; Sistema de Gestión Ministerial
      </p>
    </div>
  );
}
