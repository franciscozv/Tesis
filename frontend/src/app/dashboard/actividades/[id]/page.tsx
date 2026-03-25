'use client';

import axios from 'axios';
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle,
  Pencil,
  ShieldOff,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { use, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActividadFormModal } from '@/features/actividades/components/actividad-form';
import { CambiarEstadoActividadModal } from '@/features/actividades/components/cambiar-estado-actividad-modal';
import { InvitarParticipanteModal } from '@/features/actividades/components/invitar-participante-modal';
import { LogisticaTab } from '@/features/actividades/components/logistica-tab';
import { ReprogramarActividadModal } from '@/features/actividades/components/reprogramar-actividad-modal';
import { useActividad } from '@/features/actividades/hooks/use-actividades';
import { useDuplicarActividad } from '@/features/actividades/hooks/use-duplicar-actividad';
import {
  useDeleteInvitado,
  useInvitadosActividad,
  useMarcarAsistencia,
} from '@/features/actividades/hooks/use-invitados-actividad';
import { useUpdateActividad } from '@/features/actividades/hooks/use-update-actividad';
import type {
  CreateActividadFormData,
  ReprogramarActividadFormData,
} from '@/features/actividades/schemas';
import type { EstadoActividad } from '@/features/actividades/types';
import type { EstadoInvitado } from '@/features/actividades/types/invitados';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { SugerirCandidatoModal } from '@/features/candidatos/components/sugerir-candidato-modal';
import { useSugerirCandidatosRol } from '@/features/candidatos/hooks/use-sugerir-candidatos-rol';
import type { Candidato } from '@/features/candidatos/types';
import { responsabilidadesActividadHooks, tiposActividadHooks } from '@/features/catalogos/hooks';
import { useGruposPermitidos } from '@/features/grupos-ministeriales/hooks/use-grupos-permitidos';
import { useMisGrupos } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';
import { useMiembros } from '@/features/miembros/hooks/use-miembros';

// ---------------------------------------------------------------------------
// Labels & variants
// ---------------------------------------------------------------------------

const estadoLabels: Record<EstadoActividad, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

const estadoVariant: Record<EstadoActividad, 'default' | 'secondary' | 'destructive'> = {
  programada: 'default',
  realizada: 'secondary',
  cancelada: 'destructive',
};

const invitadoEstadoLabels: Record<EstadoInvitado, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

const invitadoEstadoVariant: Record<EstadoInvitado, 'default' | 'secondary' | 'destructive'> = {
  confirmado: 'default',
  pendiente: 'secondary',
  rechazado: 'destructive',
  cancelado: 'destructive',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value || '—'}</span>
    </div>
  );
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

function formatFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DetalleActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const actividadId = Number(id);

  const { usuario } = useAuth();

  const searchParams = useSearchParams();
  const origin = searchParams.get('origin');
  const tabParam = searchParams.get('tab');
  const colaboradorIdParam = searchParams.get('colaboradorId');
  const isUsuario = usuario?.rol === 'usuario';
  const backHref =
    origin === 'mis-responsabilidades'
      ? '/dashboard/mis-responsabilidades'
      : origin === 'necesidades'
        ? '/dashboard/necesidades'
        : origin === 'calendar' || isUsuario
          ? '/dashboard/calendario'
          : '/dashboard/actividades';

  // Data queries
  const { data: actividad, isLoading, error } = useActividad(actividadId);

  const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;
  const { data: tiposActividad } = tiposActividadHooks.useAllActivos();
  const { grupos: gruposPermitidos, gruposGestionables } = useGruposPermitidos();
  const { data: misGrupos } = useMisGrupos();
  const { data: invitados, isLoading: loadingInvitados } = useInvitadosActividad(actividadId);
  const { data: miembros } = useMiembros();
  const { data: responsabilidadesActividad } = responsabilidadesActividadHooks.useAllActivos();
  const isAdmin = usuario?.rol === 'administrador';

  const actividadTerminada = useMemo(() => {
    if (!actividad) return false;
    const fin = actividad.hora_fin
      ? `${actividad.fecha}T${actividad.hora_fin}`
      : `${actividad.fecha}T23:59:59`;
    return new Date(fin) < new Date();
  }, [actividad]);

  const canManageGestion =
    isAdmin ||
    (isUsuario &&
      !!actividad?.grupo_id &&
      (misGrupos?.some(
        (g) => g.id_grupo === actividad.grupo_id && g.es_directiva_miembro,
      ) ?? false));

  // Mutations
  const updateMutation = useUpdateActividad();
  const duplicarMutation = useDuplicarActividad();
  const asistenciaMutation = useMarcarAsistencia();
  const deleteInvitadoMutation = useDeleteInvitado();
  const sugerirMutation = useSugerirCandidatosRol();

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [reprogramarOpen, setReprogramarOpen] = useState(false);
  const [invitarOpen, setInvitarOpen] = useState(false);
  const [sugerirOpen, setSugerirOpen] = useState(false);
  const [deletingInvitadoId, setDeletingInvitadoId] = useState<number | null>(null);
  const [pendingAsistencia, setPendingAsistencia] = useState<{
    invitadoId: number;
    asistio: boolean;
  } | null>(null);
  const [invitarDefaults, setInvitarDefaults] = useState<
    { miembro_id?: number; responsabilidad_id?: number } | undefined
  >();

  const responsabilidadesMap = useMemo(
    () => new Map(responsabilidadesActividad?.map((r) => [r.id_responsabilidad, r])),
    [responsabilidadesActividad],
  );

  function handleInvitarFromCandidato(candidato: Candidato, responsabilidadId: number) {
    setSugerirOpen(false);
    setInvitarDefaults({ miembro_id: candidato.miembro_id, responsabilidad_id: responsabilidadId });
    setInvitarOpen(true);
  }

  function handleReprogramar(data: ReprogramarActividadFormData) {
    if (!actividad) return;
    duplicarMutation.mutate(
      { id: actividad.id, input: data },
      {
        onSuccess: (nueva) => {
          toast.success('Actividad reprogramada. Se creó una nueva actividad.');
          setReprogramarOpen(false);
          if (nueva?.id) {
            window.location.href = `/dashboard/actividades/${nueva.id}`;
          }
        },
        onError: () => toast.error('Error al reprogramar actividad'),
      },
    );
  }

  function handleUpdate(data: CreateActividadFormData) {
    if (!actividad) return;
    updateMutation.mutate(
      { id: actividad.id, input: data },
      {
        onSuccess: () => {
          toast.success('Actividad actualizada');
          setFormOpen(false);
        },
        onError: () => toast.error('Error al actualizar actividad'),
      },
    );
  }

  function handleMarcarAsistencia(invitadoId: number, asistio: boolean) {
    setPendingAsistencia({ invitadoId, asistio });
  }

  function handleConfirmAsistencia() {
    if (!pendingAsistencia) return;
    asistenciaMutation.mutate(
      { id: pendingAsistencia.invitadoId, asistio: pendingAsistencia.asistio },
      {
        onSuccess: () => {
          toast.success(
            pendingAsistencia.asistio ? 'Registro completado' : 'Asistencia desmarcada',
          );
          setPendingAsistencia(null);
        },
        onError: () => {
          toast.error('Error al marcar asistencia');
          setPendingAsistencia(null);
        },
      },
    );
  }

  function handleDeleteInvitado() {
    if (!deletingInvitadoId) return;
    deleteInvitadoMutation.mutate(deletingInvitadoId, {
      onSuccess: () => {
        toast.success('Invitación eliminada');
        setDeletingInvitadoId(null);
      },
      onError: () => toast.error('Error al eliminar invitación'),
    });
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
              <Skeleton key={key} className="mb-3 h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <ShieldOff className="size-12 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">Acceso restringido</h2>
          <p className="text-muted-foreground mt-1">
            Solo los miembros de directiva pueden ver detalles de actividades pasadas.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
              Volver
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!actividad) {
    return <p className="py-8 text-center text-muted-foreground">Actividad no encontrada.</p>;
  }

  const isCancelada = actividad.estado === 'cancelada';

  const tipoNombre =
    actividad.tipo_actividad?.nombre ??
    tiposActividad?.find((t) => t.id_tipo === actividad.tipo_actividad_id)?.nombre;
  const grupoNombre = actividad.grupo_id
    ? gruposPermitidos?.find((g) => g.id_grupo === actividad.grupo_id)?.nombre
    : null;

  const editingDefaults = {
    tipo_actividad_id: actividad.tipo_actividad_id,
    nombre: actividad.nombre,
    descripcion: actividad.descripcion ?? '',
    fecha: actividad.fecha,
    hora_inicio: formatHora(actividad.hora_inicio),
    hora_fin: formatHora(actividad.hora_fin),
    lugar: actividad.lugar,
    grupo_id: actividad.grupo_id ?? 0,
    es_publica: actividad.es_publica,
  };

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light tracking-tight">{actividad.nombre}</h1>
            <p className="text-sm text-muted-foreground">{formatFecha(actividad.fecha)}</p>
          </div>
        </div>
        {canManageGestion && (
          <div className="flex gap-2">
            {actividad.estado === 'programada' && (
              <>
                <Button variant="outline" onClick={() => setEstadoOpen(true)}>
                  <XCircle className="size-4" />
                  Cancelar actividad
                </Button>
                <Button variant="outline" onClick={() => setFormOpen(true)}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
              </>
            )}
            {isCancelada && !actividad.reprogramada_en_id && (
              <Button variant="outline" onClick={() => setReprogramarOpen(true)}>
                <CalendarPlus className="size-4" />
                Reprogramar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={tabParam === 'logistica' && canManageGestion ? 'logistica' : 'info'}>
        <TabsList>
          <TabsTrigger value="info">Información General</TabsTrigger>
          {canManageGestion && <TabsTrigger value="logistica">Logística</TabsTrigger>}
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        {/* Información General Tab                                           */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="info" className="grid gap-6 mt-4">
          {/* Info cards */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información General</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Nombre" value={actividad.nombre} />
                <Separator />
                <InfoRow label="Tipo" value={tipoNombre} />
                <Separator />
                <InfoRow label="Fecha" value={formatFecha(actividad.fecha)} />
                <Separator />
                <InfoRow
                  label="Horario"
                  value={`${formatHora(actividad.hora_inicio)} - ${formatHora(actividad.hora_fin)}`}
                />
                <Separator />
                <InfoRow label="Lugar" value={actividad.lugar} />
                <Separator />
                <InfoRow label="Descripción" value={actividad.descripcion} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 py-2">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <span className="col-span-2">
                    <Badge variant={estadoVariant[actividad.estado]}>
                      {estadoLabels[actividad.estado]}
                    </Badge>
                  </span>
                </div>
                <Separator />
                <InfoRow label="Grupo" value={grupoNombre} />
                <Separator />
                <InfoRow label="Pública" value={actividad.es_publica ? 'Sí' : 'No'} />
                <Separator />
                <InfoRow
                  label="Creada"
                  value={new Date(actividad.fecha_creacion).toLocaleDateString('es-CL')}
                />
                {isCancelada && (
                  <>
                    <Separator />
                    <InfoRow label="Motivo cancelación" value={actividad.motivo_cancelacion} />
                  </>
                )}
                {actividad.reprogramacion_de_id && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-2 py-2">
                      <span className="text-sm text-muted-foreground">Reprogramación de</span>
                      <span className="col-span-2 text-sm">
                        <Link
                          href={`/dashboard/actividades/${actividad.reprogramacion_de_id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          ← Ver actividad original
                        </Link>
                      </span>
                    </div>
                  </>
                )}
                {isCancelada && actividad.reprogramada_en_id && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-2 py-2">
                      <span className="text-sm text-muted-foreground">Reprogramada en</span>
                      <span className="col-span-2 text-sm">
                        <Link
                          href={`/dashboard/actividades/${actividad.reprogramada_en_id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Ver actividad sucesora →
                        </Link>
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invitados section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Users className="size-4" />
                  Invitados ({invitados?.length ?? 0})
                </span>
                {canManageGestion && !isCancelada && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        href={`/dashboard/actividades/${actividadId}/sugerir-responsabilidades`}
                      >
                        <Sparkles className="size-4" />
                        Sugerir
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setInvitarDefaults(undefined);
                        setInvitarOpen(true);
                      }}
                    >
                      <UserPlus className="size-4" />
                      Invitar
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInvitados ? (
                <div className="grid gap-2">
                  {['a', 'b', 'c'].map((key) => (
                    <Skeleton key={key} className="h-8 w-full" />
                  ))}
                </div>
              ) : !invitados?.length ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No hay invitados en esta actividad.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Miembro</TableHead>
                        <TableHead>Responsabilidad</TableHead>
                        {canManageGestion && <TableHead>Estado</TableHead>}
                        {actividadTerminada && <TableHead>Cumplimiento</TableHead>}
                        {canManageGestion && <TableHead className="w-24">Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitados.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">
                            {inv.miembro
                              ? `${inv.miembro.nombre} ${inv.miembro.apellido}`
                              : `Miembro #${inv.miembro_id}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {inv.rol?.nombre ??
                                responsabilidadesMap.get(inv.responsabilidad_id)?.nombre ??
                                `Responsabilidad #${inv.responsabilidad_id}`}
                            </Badge>
                          </TableCell>
                          {canManageGestion && (
                            <TableCell>
                              <Badge variant={invitadoEstadoVariant[inv.estado]}>
                                {invitadoEstadoLabels[inv.estado]}
                              </Badge>
                            </TableCell>
                          )}
                          {actividadTerminada && (
                            <TableCell>
                              {canManageGestion &&
                              (inv.estado === 'confirmado' || inv.estado === 'pendiente') ? (
                                <Checkbox
                                  checked={inv.asistio}
                                  onCheckedChange={(checked) =>
                                    handleMarcarAsistencia(inv.id, checked === true)
                                  }
                                  disabled={asistenciaMutation.isPending}
                                  aria-label={
                                    inv.asistio ? 'Desmarcar asistencia' : 'Marcar asistencia'
                                  }
                                />
                              ) : inv.asistio ? (
                                <CheckCircle className="size-4 text-success-foreground" />
                              ) : (
                                <XCircle className="size-4 text-muted-foreground" />
                              )}
                            </TableCell>
                          )}
                          {canManageGestion && (
                            <TableCell>
                              {inv.estado === 'pendiente' && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setDeletingInvitadoId(inv.id)}
                                  title="Eliminar invitación"
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Logística Tab                                                     */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="logistica" className="mt-4">
          <LogisticaTab
            actividadId={actividadId}
            canManage={canManageGestion}
            isCancelada={isCancelada}
            resaltarColaboradorId={colaboradorIdParam ? parseInt(colaboradorIdParam) : undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ReprogramarActividadModal
        open={reprogramarOpen}
        onOpenChange={setReprogramarOpen}
        actividadNombre={actividad.nombre}
        isPending={duplicarMutation.isPending}
        onSubmit={handleReprogramar}
      />

      <ActividadFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={editingDefaults}
        onSubmit={handleUpdate}
        isPending={updateMutation.isPending}
        tiposActividad={tiposActividad}
        grupos={gruposGestionables}
        isEditing
      />

      <CambiarEstadoActividadModal
        actividad={actividad}
        open={estadoOpen}
        onOpenChange={setEstadoOpen}
      />

      <InvitarParticipanteModal
        actividadId={actividadId}
        open={invitarOpen}
        onOpenChange={setInvitarOpen}
        miembros={miembros}
        responsabilidadesActividad={responsabilidadesActividad}
        invitados={invitados}
        defaultValues={invitarDefaults}
        excludeMiembroId={usuario?.id ?? undefined}
      />

      <SugerirCandidatoModal
        open={sugerirOpen}
        onOpenChange={setSugerirOpen}
        defaultFecha={actividad?.fecha ?? ''}
        actividadId={actividadId}
        isAdmin={isAdmin}
        responsabilidadesActividad={responsabilidadesActividad}
        sugerirMutation={sugerirMutation}
        onInvitar={handleInvitarFromCandidato}
      />

      <AlertDialog
        open={!!pendingAsistencia}
        onOpenChange={(open) => !open && setPendingAsistencia(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAsistencia?.asistio ? 'Registrar asistencia' : 'Desmarcar asistencia'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {(() => {
                const inv = invitados?.find((i) => i.id === pendingAsistencia?.invitadoId);
                const nombre = inv?.miembro
                  ? `${inv.miembro.nombre} ${inv.miembro.apellido}`
                  : `Miembro #${inv?.miembro_id}`;
                const responsabilidad =
                  inv?.rol?.nombre ??
                  responsabilidadesMap.get(inv?.responsabilidad_id ?? 0)?.nombre ??
                  '—';
                return (
                  <p className="text-sm text-muted-foreground">
                    {pendingAsistencia?.asistio ? (
                      <>
                        Estás a punto de confirmar que{' '}
                        <span className="font-medium text-foreground">{nombre}</span> asistió a esta
                        actividad como{' '}
                        <span className="font-medium text-foreground">{responsabilidad}</span>.
                      </>
                    ) : (
                      <>
                        Estás a punto de quitar el registro de asistencia de{' '}
                        <span className="font-medium text-foreground">{nombre}</span> (
                        {responsabilidad}).
                      </>
                    )}
                  </p>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={asistenciaMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAsistencia}
              disabled={asistenciaMutation.isPending}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingInvitadoId}
        onOpenChange={(open) => !open && setDeletingInvitadoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar invitación</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la invitación pendiente. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvitado}
              disabled={deleteInvitadoMutation.isPending}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
