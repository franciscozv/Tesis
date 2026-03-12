import Image from 'next/image';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-svh flex">
      {/* Panel izquierdo — Identidad institucional */}
      <div
        className="hidden md:flex md:w-[42%] flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: 'oklch(0.20 0.09 228)' }}
      >
        {/* Ornamento superior derecho */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5"
          style={{ backgroundColor: 'oklch(0.70 0.12 200)', transform: 'translate(40%, -40%)' }}
        />
        {/* Ornamento inferior izquierdo */}
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-5"
          style={{ backgroundColor: 'oklch(0.65 0.10 228)', transform: 'translate(-40%, 40%)' }}
        />

        <div className="relative flex flex-col items-center gap-8 px-14 text-white">
          {/* Logo */}
          <div
            className="rounded-full p-1.5 ring-1 ring-white/15"
            style={{ backgroundColor: 'oklch(1 0 0 / 0.06)' }}
          >
            <Image
              src="/logo_iep.png"
              alt="Logo Iglesia Evangélica Pentecostal"
              width={148}
              height={148}
              className="rounded-full"
              priority
            />
          </div>

          {/* Textos */}
          <div className="text-center space-y-3">
            <h1
              className="text-2xl font-semibold leading-snug tracking-wide"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Iglesia Evangélica
              <br />
              Pentecostal
            </h1>
            <p
              className="text-[11px] tracking-[0.22em] uppercase"
              style={{ color: 'oklch(1 0 0 / 0.45)' }}
            >
              Sistema de Gestión Ministerial
            </p>
          </div>

          {/* Divisor */}
          <div className="w-12 h-px" style={{ backgroundColor: 'oklch(1 0 0 / 0.18)' }} />

          {/* Descripción */}
          <p
            className="text-sm text-center max-w-[240px] leading-relaxed"
            style={{ color: 'oklch(1 0 0 / 0.62)' }}
          >
            Administración de miembros, grupos ministeriales y actividades de la comunidad.
          </p>
        </div>

        {/* Pie del panel */}
        <div
          className="absolute bottom-6 text-[11px] tracking-widest uppercase"
          style={{ color: 'oklch(1 0 0 / 0.22)' }}
        >
          IEP &mdash; Uso interno
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background">
        {/* Logo compacto en mobile */}
        <div className="flex flex-col items-center gap-3 mb-8 md:hidden">
          <Image
            src="/logo_iep.png"
            alt="Logo IEP"
            width={68}
            height={68}
            className="rounded-full"
            priority
          />
          <p className="text-[11px] text-muted-foreground tracking-[0.2em] uppercase">
            Sistema IEP
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
