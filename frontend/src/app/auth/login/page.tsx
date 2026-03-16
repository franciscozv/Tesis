import Image from 'next/image';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-svh flex">
      {/* Panel izquierdo — Identidad institucional */}
      <div
        className="hidden md:flex md:w-[42%] flex-col items-center justify-center relative overflow-hidden bg-primary"
      >
        <div className="relative flex flex-col items-center gap-8 px-14 text-primary-foreground">
          {/* Logo */}
          <div
            className="rounded-full p-1.5 ring-1 ring-primary-foreground/15 bg-primary-foreground/5"
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
              className="text-2xl font-semibold leading-snug tracking-wide font-serif"
            >
              Iglesia Evangélica
              <br />
              Pentecostal
            </h1>
            <p
              className="text-[11px] tracking-[0.22em] uppercase text-primary-foreground/45"
            >
              Sistema de Gestión Ministerial
            </p>
          </div>

          {/* Divisor */}
          <div className="w-12 h-px bg-primary-foreground/15" />

          {/* Descripción */}
          <p
            className="text-sm text-center max-w-[240px] leading-relaxed text-primary-foreground/60"
          >
            Administración de miembros, grupos ministeriales y actividades de la comunidad.
          </p>
        </div>

        {/* Pie del panel */}
        <div
          className="absolute bottom-6 text-[11px] tracking-widest uppercase text-primary-foreground/25"
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
