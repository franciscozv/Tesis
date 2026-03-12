'use client';

import {
  ArrowLeft,
  BadgeCheck,
  Crown,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Users,
  UserX,
} from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { rolesGrupoHooks } from '@/features/catalogos/hooks';
import type { RolGrupo } from '@/features/catalogos/types';
import { useGrupo } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useMisGrupos } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { CambiarRolModal } from '@/features/integrantes-grupo/components/cambiar-rol-modal';
import { NombramientoModal } from '@/features/integrantes-grupo/components/nombramiento-modal';
import { VincularMiembroModal } from '@/features/integrantes-grupo/components/vincular-miembro-modal';
import { useDesvincularMiembro } from '@/features/integrantes-grupo/hooks/use-desvincular-miembro';
import { useIntegrantesGrupo } from '@/features/integrantes-grupo/hooks/use-integrantes-grupo';
import { useMiembros } from '@/features/miembros/hooks/use-miembros';

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm">{value || '—'}</span>
    </div>
  );
}

// ─── Tarjeta de cargo directivo ────────────────────────────────────────────

interface DirectivaCardProps {
  cargo: RolGrupo;
  holder: MiembroGrupo | undefined;
  holderNombre: string | null;
  puedeNombrar: boolean;
  onNombrar: (cargo: RolGrupo) => void;
  onDesvincular: (mg: MiembroGrupo) => void;
  isAdmin: boolean;
}

function DirectivaCard({
  cargo,
  holder,
  holderNombre,
  puedeNombrar,
  onNombrar,
  onDesvincular,
  isAdmin,
}: DirectivaCardProps) {
  return (
    <Card className="flex flex-col border-blue-200 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight">{cargo.nombre}</CardTitle>
            <div className="mt-1 flex flex-wrap gap-1">
              {cargo.es_unico && (
                <Badge
                  variant="secondary"
                  className="h-4 border-none bg-purple-100 px-1 text-[10px] text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                >
                  <UserCheck className="mr-0.5 size-2.5" />
                  Único
                </Badge>
              )}
              {cargo.requiere_plena_comunion && (
                <Badge
                  variant="secondary"
                  className="h-4 border-none bg-amber-100 px-1 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <BadgeCheck className="mr-0.5 size-2.5" />
                  Plena Comunión
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <Separator className="bg-blue-200/60 dark:bg-blue-900/30" />

        {/* Titular actual */}
        {holder && holderNombre ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{holderNombre}</p>
              <p className="text-xs text-muted-foreground">
                Desde {new Date(holder.fecha_vinculacion).toLocaleDateString('es-CL')}
              </p>
            </div>
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDesvincular(holder)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desvincular del cargo</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserX className="size-4 shrink-0" />
            <p className="text-sm">Vacante</p>
          </div>
        )}

        {/* Botón de nombramiento */}
        {puedeNombrar && (
          <Button
            size="sm"
            variant={holder ? 'outline' : 'default'}
            className="mt-auto w-full"
            onClick={() => onNombrar(cargo)}
          >
            <Crown className="size-3.5" />
            {holder ? 'Renovar Nombramiento' : 'Realizar Nombramiento'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Página principal ───────────────────────────────────────────────────────

export default function DetalleGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const grupoId = Number(id);
  const { data: grupo, isLoading } = useGrupo(grupoId);
  const { data: miembrosGrupo, isLoading: loadingMiembros } = useIntegrantesGrupo(grupoId);
  const { data: allMiembros } = useMiembros();
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const { data: misGrupos } = useMisGrupos();
  const misGruposIds = new Set(misGrupos?.map((g) => g.id_grupo) ?? []);
  const puedeEditar = isAdmin || misGruposIds.has(grupoId);
  const { data: rolesGrupo } = rolesGrupoHooks.useAllActivos();

  const [vincularOpen, setVincularOpen] = useState(false);
  const [cambiarRolTarget, setCambiarRolTarget] = useState<MiembroGrupo | null>(null);
  const [miembroADesvincular, setMiembroADesvincular] = useState<MiembroGrupo | null>(null);
  const [cargoNombramiento, setCargoNombramiento] = useState<RolGrupo | null>(null);

  const desvincularMutation = useDesvincularMiembro();

  const miembroMap = new Map(allMiembros?.map((m) => [m.id, m]));
  const activos = miembrosGrupo?.filter((mg) => !mg.fecha_desvinculacion) ?? [];

  // Separación de integrantes por tipo de rol
  const integrantesDirectiva = activos.filter((mg) => mg.rol.es_directiva);
  const integrantesNomina = activos.filter((mg) => !mg.rol.es_directiva);

  // Roles directivos del catálogo (para las tarjetas)
  const rolesDirectiva = rolesGrupo?.filter((r) => r.es_directiva && r.activo) ?? [];

  // Mapa: id_rol_grupo → integrante que ocupa ese cargo directivo
  const holderByRolId = new Map(integrantesDirectiva.map((mg) => [mg.rol.id, mg]));

  function getMiembroNombre(mg: MiembroGrupo): string | null {
    const m = mg.miembro ?? miembroMap.get(mg.miembro_id);
    return m ? `${m.nombre} ${m.apellido}` : null;
  }

  function handleConfirmDesvincular() {
    if (!miembroADesvincular) return;
    desvincularMutation.mutate(miembroADesvincular.id, {
      onSuccess: () => {
        toast.success('Miembro desvinculado exitosamente');
        setMiembroADesvincular(null);
      },
      onError: () => toast.error('Error al desvincular miembro'),
    });
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            {['a', 'b', 'c', 'd'].map((key) => (
              <Skeleton key={key} className="mb-3 h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!grupo) {
    return <p className="text-muted-foreground py-8 text-center">Grupo no encontrado.</p>;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/grupos">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{grupo.nombre}</h1>
            <p className="text-muted-foreground text-sm">Grupo Ministerial</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/grupos/${grupo.id_grupo}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      {/* Información del grupo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del Grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Nombre" value={grupo.nombre} />
          <Separator />
          <InfoRow label="Descripción" value={grupo.descripcion} />
          <Separator />
          <InfoRow label="Fecha Creación" value={grupo.fecha_creacion} />
          <Separator />
          <InfoRow label="Estado" value={grupo.activo ? 'Activo' : 'Inactivo'} />
        </CardContent>
      </Card>

      {/* ── Sección 1: Directiva Actual ─────────────────────────────────────── */}
      <Card className="border-blue-200 dark:border-blue-900/40">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4 text-blue-600 dark:text-blue-400" />
              Directiva Actual
            </CardTitle>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {integrantesDirectiva.length} / {rolesDirectiva.length} cargos ocupados
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Los cargos directivos son gestionados exclusivamente por la administración general.
          </p>
        </CardHeader>
        <CardContent>
          {loadingMiembros ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 w-full rounded-lg" />
              ))}
            </div>
          ) : rolesDirectiva.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No hay cargos directivos configurados para este grupo.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {rolesDirectiva.map((cargo) => {
                const holder = holderByRolId.get(cargo.id_rol_grupo);
                const holderNombre = holder ? getMiembroNombre(holder) : null;
                return (
                  <DirectivaCard
                    key={cargo.id_rol_grupo}
                    cargo={cargo}
                    holder={holder}
                    holderNombre={holderNombre}
                    puedeNombrar={isAdmin}
                    onNombrar={setCargoNombramiento}
                    onDesvincular={setMiembroADesvincular}
                    isAdmin={isAdmin}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Sección 2: Nómina de Integrantes ────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            Nómina de Integrantes
            <Badge variant="secondary" className="ml-1">
              {integrantesNomina.length}
            </Badge>
          </CardTitle>
          {puedeEditar && (
            <Button size="sm" onClick={() => setVincularOpen(true)}>
              <Plus className="size-4" />
              Agregar Integrante
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loadingMiembros ? (
            <div className="grid gap-2">
              {['a', 'b', 'c'].map((key) => (
                <Skeleton key={key} className="h-8 w-full" />
              ))}
            </div>
          ) : integrantesNomina.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="size-8 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                No hay integrantes en la nómina del grupo.
              </p>
              {puedeEditar && (
                <Button size="sm" variant="outline" onClick={() => setVincularOpen(true)}>
                  <Plus className="size-4" />
                  Agregar el primero
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Comunión</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="hidden md:table-cell">Vinculación</TableHead>
                    {puedeEditar && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrantesNomina.map((mg) => {
                    const miembro = mg.miembro ?? miembroMap.get(mg.miembro_id);
                    const nombre = miembro
                      ? `${miembro.nombre} ${miembro.apellido}`
                      : `Miembro #${mg.miembro_id}`;
                    const comunion = miembroMap.get(mg.miembro_id)?.estado_comunion;
                    return (
                      <TableRow key={mg.id}>
                        <TableCell className="font-medium">{nombre}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {comunion ? (
                            <Badge
                              variant="outline"
                              className={
                                comunion === 'plena_comunion'
                                  ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                  : ''
                              }
                            >
                              {comunion === 'plena_comunion'
                                ? 'Plena Comunión'
                                : comunion === 'probando'
                                  ? 'Probando'
                                  : 'Asistente'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{mg.rol.nombre}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground text-sm md:table-cell">
                          {new Date(mg.fecha_vinculacion).toLocaleDateString('es-CL')}
                        </TableCell>
                        {puedeEditar && (
                          <TableCell>
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => setCambiarRolTarget(mg)}
                                    >
                                      <RefreshCw className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Cambiar rol</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => setMiembroADesvincular(mg)}
                                      disabled={desvincularMutation.isPending}
                                    >
                                      <UserMinus className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Desvincular</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modales ──────────────────────────────────────────────────────────── */}

      <VincularMiembroModal
        grupoId={grupoId}
        open={vincularOpen}
        onOpenChange={setVincularOpen}
        soloNoDirectiva
      />

      <NombramientoModal
        grupoId={grupoId}
        cargo={cargoNombramiento}
        open={!!cargoNombramiento}
        onOpenChange={(v) => {
          if (!v) setCargoNombramiento(null);
        }}
        integrantesNomina={integrantesNomina}
      />

      <CambiarRolModal
        open={!!cambiarRolTarget}
        onOpenChange={(v) => {
          if (!v) setCambiarRolTarget(null);
        }}
        comunion={cambiarRolTarget}
        rolesGrupo={rolesGrupo}
      />

      <AlertDialog
        open={!!miembroADesvincular}
        onOpenChange={(v) => {
          if (!v) setMiembroADesvincular(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                if (!miembroADesvincular) return null;
                const nombre =
                  getMiembroNombre(miembroADesvincular) ??
                  `Miembro #${miembroADesvincular.miembro_id}`;
                const esDirectiva = miembroADesvincular.rol.es_directiva;
                return (
                  <>
                    ¿Está seguro que desea desvincular a{' '}
                    <span className="font-semibold text-foreground">{nombre}</span>
                    {esDirectiva && (
                      <>
                        {' '}
                        del cargo{' '}
                        <span className="font-semibold text-foreground">
                          {miembroADesvincular.rol.nombre}
                        </span>{' '}
                        en la directiva de{' '}
                      </>
                    )}{' '}
                    del grupo <span className="font-semibold text-foreground">{grupo.nombre}</span>?
                    Esta acción no se puede deshacer.
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={desvincularMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDesvincular}
              disabled={desvincularMutation.isPending}
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
