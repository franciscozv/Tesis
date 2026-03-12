'use client';

import {
  Calendar,
  ChevronRight,
  ClipboardList,
  HandHeart,
  Mail,
  Package,
  Users,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useColaboradores } from '@/features/colaboradores/hooks/use-colaboradores';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  iconBg: string;
  iconColor: string;
  href?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  iconBg,
  iconColor,
  href,
}: StatCardProps) {
  const card = (
    <Card className={cn('shadow-sm', href && 'transition-shadow hover:shadow-md cursor-pointer')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('flex items-center justify-center size-9 rounded-lg', iconBg)}>
          <Icon className={cn('size-4', iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {description && <p className="text-muted-foreground text-xs mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
  if (href)
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  return card;
}

interface QuickLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

function QuickLink({ href, icon: Icon, label, description }: QuickLinkProps) {
  return (
    <Link href={href} className="block group">
      <Card className="shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex items-center justify-center size-10 shrink-0 rounded-lg bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium group-hover:text-primary transition-colors">
              {label}
            </p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const nombre = usuario?.email?.split('@')[0] ?? 'usuario';
  const isAdmin = usuario?.rol === 'administrador';
  const { data: ofertasPendientes } = useColaboradores(
    { estado: 'pendiente' },
    { enabled: isAdmin },
  );

  const hoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const hoyCapitalizado = hoy.charAt(0).toUpperCase() + hoy.slice(1);

  return (
    <div className="grid gap-6 max-w-5xl">
      {/* Banner de bienvenida */}
      <Card
        className="border-0 shadow-md overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, oklch(0.22 0.10 230) 0%, oklch(0.32 0.10 225) 100%)',
        }}
      >
        <CardContent className="p-6 flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{hoyCapitalizado}</p>
          <h1 className="text-2xl font-semibold text-white">Bienvenido, {nombre}</h1>
          <p className="text-white/55 text-sm mt-0.5">
            Sistema de Gestión Ministerial &mdash; Iglesia Evangélica Pentecostal
          </p>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Resumen
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Miembros"
            value="—"
            icon={Users}
            iconBg="bg-info/15"
            iconColor="text-info-foreground"
          />
          <StatCard
            title="Próximas Actividades"
            value="—"
            icon={Calendar}
            description="Próximos 15 días"
            iconBg="bg-success/15"
            iconColor="text-success-foreground"
          />
          <StatCard
            title="Necesidades Abiertas"
            value="—"
            icon={Package}
            description="Pendientes de asignar"
            iconBg="bg-warning/15"
            iconColor="text-warning-foreground"
          />
          <StatCard
            title="Invitaciones Pendientes"
            value="—"
            icon={Mail}
            description="Sin respuesta"
            iconBg="bg-destructive/10"
            iconColor="text-destructive"
          />
          {isAdmin && (
            <StatCard
              title="Ofertas Pendientes"
              value={ofertasPendientes?.length ?? '—'}
              icon={HandHeart}
              description="Colaboraciones por decidir"
              iconBg="bg-warning/15"
              iconColor="text-warning-foreground"
              href="/dashboard/actividades"
            />
          )}
        </div>
      </div>

      {/* Acceso rápido */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Acceso rápido
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/dashboard/miembros"
            icon={Users}
            label="Miembros"
            description="Registro y gestión de miembros"
          />
          <QuickLink
            href="/dashboard/grupos"
            icon={UsersRound}
            label="Grupos Ministeriales"
            description="Administrar grupos e integrantes"
          />
          <QuickLink
            href="/dashboard/calendario"
            icon={Calendar}
            label="Calendario"
            description="Ver actividades programadas"
          />
          {isAdmin && (
            <QuickLink
              href="/dashboard/actividades"
              icon={ClipboardList}
              label="Actividades"
              description="Crear y gestionar actividades"
            />
          )}
          <QuickLink
            href="/dashboard/necesidades"
            icon={Package}
            label="Necesidades"
            description="Necesidades logísticas abiertas"
          />
          <QuickLink
            href="/dashboard/mis-responsabilidades"
            icon={Mail}
            label="Mis Responsabilidades"
            description="Tus asignaciones actuales"
          />
        </div>
      </div>
    </div>
  );
}
