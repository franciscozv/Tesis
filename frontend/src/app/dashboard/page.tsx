'use client';

import {
  Calendar,
  ClipboardList,
  Eye,
  HandHeart,
  LayoutTemplate,
  Mail,
  Package,
  Plus,
  Users,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActividades } from '@/features/actividades/hooks/use-actividades';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCalendarioConsolidado } from '@/features/calendario/hooks/use-calendario';
import { useColaboradores } from '@/features/colaboradores/hooks/use-colaboradores';
import { useGruposPermitidos } from '@/features/grupos-ministeriales/hooks/use-grupos-permitidos';
import { useMisGrupos } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';
import { useInvitados } from '@/features/invitados/hooks/use-invitados';
import { useMiembro, useMiembrosPaginated } from '@/features/miembros/hooks/use-miembros';
import { useMisResponsabilidades } from '@/features/mis-responsabilidades/hooks/use-mis-responsabilidades';
import { useNecesidadesAbiertas } from '@/features/necesidades/hooks/use-necesidades-abiertas';
import { usePatrones } from '@/features/patrones-actividad/hooks/use-patrones';
import { cn } from '@/lib/utils';

// Card de solo resumen — sin acciones
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, description, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('flex items-center justify-center size-10 rounded-lg', iconBg)}>
          <Icon className={cn('size-5', iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {description && <p className="text-muted-foreground text-xs mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

// Card con acciones — ver tabla y crear
interface ActionCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  iconBg: string;
  iconColor: string;
  viewHref: string;
  createHref?: string;
}

function ActionCard({
  title,
  value,
  icon: Icon,
  description,
  iconBg,
  iconColor,
  viewHref,
  createHref,
}: ActionCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('flex items-center justify-center size-10 rounded-lg', iconBg)}>
          <Icon className={cn('size-5', iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {description && <p className="text-muted-foreground text-xs mt-1">{description}</p>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-1.5', createHref ? 'flex-1' : 'w-full')}
            asChild
          >
            <Link href={viewHref}>
              <Eye className="size-3.5" />
              Ver
            </Link>
          </Button>
          {createHref && (
            <Button size="sm" className="flex-1 gap-1.5" asChild>
              <Link href={createHref}>
                <Plus className="size-3.5" />
                Nuevo
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const canSeeUserCards = !!usuario;
  const { data: miembroData } = useMiembro(usuario?.id ?? 0);
  const nombreCompleto = miembroData
    ? `${miembroData.nombre} ${miembroData.apellido}`
    : (usuario?.email?.split('@')[0] ?? 'usuario');

  const hoy = new Date();
  const hoyIso = hoy.toISOString().split('T')[0];
  const en7 = new Date(hoy);
  en7.setDate(en7.getDate() + 7);
  const en7Iso = en7.toISOString().split('T')[0];
  const en30 = new Date(hoy);
  en30.setDate(en30.getDate() + 30);
  const en30Iso = en30.toISOString().split('T')[0];
  const { data: miembrosData } = useMiembrosPaginated({ page: 1, limit: 1 });
  const { data: actividadesData } = useActividades({
    mes: hoy.getMonth() + 1,
    anio: hoy.getFullYear(),
    estado: 'programada',
  });
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();
  const siguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
  const mesSiguiente = siguiente.getMonth() + 1;
  const anioSiguiente = siguiente.getFullYear();
  const { data: calendarioActual } = useCalendarioConsolidado(mesActual, anioActual, undefined, {
    enabled: canSeeUserCards,
  });
  const { data: calendarioSiguiente } = useCalendarioConsolidado(
    mesSiguiente,
    anioSiguiente,
    undefined,
    { enabled: canSeeUserCards },
  );
  const { data: necesidadesAbiertas } = useNecesidadesAbiertas();
  const { data: misResponsabilidades } = useMisResponsabilidades();
  const { data: ofertasPendientes } = useColaboradores(
    { estado: 'pendiente' },
    { enabled: isAdmin },
  );
  const { grupos } = useGruposPermitidos();
  const { data: misGrupos } = useMisGrupos();
  const puedeVerMiembros = isAdmin || (usuario?.es_directiva ?? false);
  const { data: patronesData } = usePatrones();
  const { data: invitacionesPendientes } = useInvitados(
    usuario?.id ? { estado: 'pendiente', miembro_id: usuario.id } : undefined,
  );

  const totalMiembros = miembrosData?.meta?.total ?? '—';
  const proximasActividades = actividadesData?.length ?? '—';
  const actividadesUsuario = [...(calendarioActual ?? []), ...(calendarioSiguiente ?? [])];
  const proximasActividadesUsuario = actividadesUsuario.filter(
    (a) => a.fecha >= hoyIso && a.fecha <= en30Iso,
  );
  const totalProximasUsuario = proximasActividadesUsuario.length;
  const totalNecesidades = necesidadesAbiertas?.length ?? '—';
  const responsabilidadesProximas =
    misResponsabilidades?.filter(
      (r) =>
        r.actividad.estado === 'programada' &&
        r.actividad.fecha >= hoyIso &&
        r.actividad.fecha <= en7Iso,
    ) ?? [];
  const totalResponsabilidades = responsabilidadesProximas.length;
  const totalGrupos = grupos?.length ?? '—';
  const totalMisGrupos = misGrupos?.length ?? '—';
  const totalPatrones = patronesData?.length ?? '—';
  const totalInvitaciones = invitacionesPendientes?.length ?? '—';

  const hoyStr = hoy.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const hoyCapitalizado = hoyStr.charAt(0).toUpperCase() + hoyStr.slice(1);

  return (
    <div className="grid gap-6 max-w-5xl">
      {/* Banner de bienvenida */}
      <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <CardContent className="p-6 flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary-foreground/45">
            {hoyCapitalizado}
          </p>
          <h1 className="text-2xl font-light text-primary-foreground">
            Bienvenid@, {nombreCompleto}
          </h1>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Resumen
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {puedeVerMiembros && (
            <ActionCard
              title="Miembros"
              value={totalMiembros}
              icon={Users}
              description="En el registro"
              iconBg="bg-info/15"
              iconColor="text-info-foreground"
              viewHref="/dashboard/miembros"
              createHref={isAdmin ? '/dashboard/miembros?create=true' : undefined}
            />
          )}
          <ActionCard
            title={isAdmin ? 'Grupos Ministeriales' : 'Mis Grupos'}
            value={totalGrupos}
            icon={UsersRound}
            description={isAdmin ? 'Todos los grupos de la iglesia' : 'Grupos ministeriales'}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            viewHref={isAdmin ? '/dashboard/grupos' : '/dashboard/mis-grupos'}
            createHref={isAdmin ? '/dashboard/grupos?create=true' : undefined}
          />
          {isAdmin && (
            <ActionCard
              title="Mis Grupos"
              value={totalMisGrupos}
              icon={UsersRound}
              description="Grupos en los que participas"
              iconBg="bg-sky-500/10"
              iconColor="text-sky-600"
              viewHref="/dashboard/mis-grupos"
            />
          )}
          {isAdmin && (
            <ActionCard
              title="Actividades este Mes"
              value={proximasActividades}
              icon={Calendar}
              description="Programadas este mes"
              iconBg="bg-success/15"
              iconColor="text-success-foreground"
              viewHref="/dashboard/actividades"
              createHref="/dashboard/actividades?create=true"
            />
          )}
          <ActionCard
            title="Proximas Actividades"
            value={totalProximasUsuario}
            icon={Calendar}
            description="Proximos 30 dias"
            iconBg="bg-success/15"
            iconColor="text-success-foreground"
            viewHref="/dashboard/calendario"
          />
          <ActionCard
            title="Necesidades Abiertas"
            value={totalNecesidades}
            icon={Package}
            description="Pendientes de asignar"
            iconBg="bg-warning/15"
            iconColor="text-warning-foreground"
            viewHref="/dashboard/necesidades"
          />
          {isAdmin && (
            <StatCard
              title="Colaboraciones Pendientes"
              value={ofertasPendientes?.length ?? 'N/A'}
              icon={HandHeart}
              description="Colaboraciones por decidir"
              iconBg="bg-warning/15"
              iconColor="text-warning-foreground"
            />
          )}
          <ActionCard
            title="Mis Responsabilidades"
            value={totalResponsabilidades}
            icon={ClipboardList}
            description="Proximos 7 dias"
            iconBg="bg-primary/10"
            iconColor="text-primary"
            viewHref="/dashboard/mis-responsabilidades"
          />
          {isAdmin && (
            <ActionCard
              title="Patrones de Actividad"
              value={totalPatrones}
              icon={LayoutTemplate}
              description="Plantillas configuradas"
              iconBg="bg-secondary/50"
              iconColor="text-secondary-foreground"
              viewHref="/dashboard/patrones"
              createHref="/dashboard/patrones?create=true"
            />
          )}
          <ActionCard
            title="Mis Invitaciones"
            value={totalInvitaciones}
            icon={Mail}
            description="Pendientes de responder"
            iconBg="bg-info/15"
            iconColor="text-info-foreground"
            viewHref="/dashboard/invitaciones"
          />
        </div>
      </div>
    </div>
  );
}
