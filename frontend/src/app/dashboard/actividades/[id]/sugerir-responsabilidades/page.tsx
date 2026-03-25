'use client';

import axios from 'axios';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AccessDenied } from '@/components/access-denied';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useActividad } from '@/features/actividades/hooks/use-actividades';
import { useInvitadosActividad } from '@/features/actividades/hooks/use-invitados-actividad';
import { useSugerirResponsabilidades } from '@/features/actividades/hooks/use-sugerir-responsabilidades';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { candidatosApi } from '@/features/candidatos/api';
import type { Candidato } from '@/features/candidatos/types';
import { responsabilidadesActividadHooks } from '@/features/catalogos/hooks';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useMisGrupos } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';
import { extractApiMessage } from '@/lib/api-error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatRotacion(dias: number | null): string {
  if (dias === null) return 'Sin asignaciones previas en este rol';
  if (dias < 7) return `Última asignación: hace ${dias} día${dias !== 1 ? 's' : ''}`;
  const semanas = Math.floor(dias / 7);
  return `Última asignación: hace ${semanas} semana${semanas !== 1 ? 's' : ''}`;
}

function generarJustificacion(dias: number | null, actividadesEsteMes: number): string {
  if (dias === null) {
    if (actividadesEsteMes === 0) return 'Primera vez en este rol y sin otras actividades este mes.';
    return `Primera vez en este rol. Tiene ${actividadesEsteMes} actividad${actividadesEsteMes !== 1 ? 'es' : ''} confirmada${actividadesEsteMes !== 1 ? 's' : ''} este mes.`;
  }
  const semanas = Math.floor(dias / 7);
  if (dias < 14) {
    return `Lo realizó recientemente (hace ${dias} día${dias !== 1 ? 's' : ''}). Hay otros con más tiempo sin este rol.`;
  }
  if (actividadesEsteMes === 0) {
    return `Lleva ${semanas} semana${semanas !== 1 ? 's' : ''} sin este rol y no tiene otras actividades confirmadas este mes.`;
  }
  return `Lleva ${semanas} semana${semanas !== 1 ? 's' : ''} sin este rol. Tiene ${actividadesEsteMes} actividad${actividadesEsteMes !== 1 ? 'es' : ''} confirmada${actividadesEsteMes !== 1 ? 's' : ''} este mes.`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SugerirResponsabilidadesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const actividadId = Number(id);
  const router = useRouter();
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  // --- Data ---
  const {
    data: actividad,
    isLoading: loadingActividad,
    error: errorActividad,
  } = useActividad(actividadId);
  const { data: responsabilidades, isLoading: loadingResp } =
    responsabilidadesActividadHooks.useAllActivos();
  const { data: invitados } = useInvitadosActividad(actividadId);
  const { data: grupos } = useGrupos();
  const { data: misGrupos } = useMisGrupos();

  const isForbidden = axios.isAxiosError(errorActividad) && errorActividad.response?.status === 403;

  const miGrupoActividad = misGrupos?.find((g) => g.id_grupo === actividad?.grupo_id);
  const esDirectivaDeEsteGrupo = miGrupoActividad?.es_directiva_miembro ?? false;

  // IDs de responsabilidades que ya tienen alguien asignado en la actividad
  const respIdsConAsignado = useMemo(() => {
    const s = new Set<number>();
    for (const inv of invitados ?? []) {
      if (inv.estado !== 'rechazado') s.add(inv.responsabilidad_id);
    }
    return s;
  }, [invitados]);

  // --- Search state ---
  const [responsabilidadId, setResponsabilidadId] = useState<string>('');
  const [resultados, setResultados] = useState<Candidato[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  // --- Filters ---
  const [excluirConflictos, setExcluirConflictos] = useState(false);
  const [filtroPlenaComun, setFiltroPlenaComun] = useState(false);
  const [priorizarExpTipo, setPriorizarExpTipo] = useState(false);
  const [grupoId, setGrupoId] = useState<string | undefined>(undefined);

  // --- Accumulated assignments: resp_id → { miembro_id, nombre, nombreResp, confirmado } ---
  const [selecciones, setSelecciones] = useState<
    Map<number, { miembro_id: number; nombre: string; nombreResp: string; confirmado: boolean }>
  >(new Map());

  // --- Confirm modal ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- Mutation ---
  const asignarMutation = useSugerirResponsabilidades(actividadId);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (actividad && grupoId === undefined) {
      setGrupoId(actividad.grupo_id ? String(actividad.grupo_id) : '');
    }
  }, [actividad, grupoId]);

  const handleBuscar = useCallback(async () => {
    if (!responsabilidadId || !actividad) return;
    setBuscando(true);
    try {
      const data = await candidatosApi.sugerirRol({
        responsabilidad_id: Number(responsabilidadId),
        fecha: actividad.fecha,
        tipo_actividad_id: actividad.tipo_actividad_id || undefined,
        actividad_id: actividadId,
        ...(filtroPlenaComun && { filtro_plena_comunion: true }),
        ...(grupoId ? { grupo_id: Number(grupoId) } : {}),
        incluir_con_conflictos: !excluirConflictos,
        priorizar_experiencia_tipo: priorizarExpTipo,
      });
      setResultados(data ?? []);
    } catch {
      toast.error('Error al buscar candidatos');
    } finally {
      setBuscando(false);
    }
  }, [
    responsabilidadId,
    actividad,
    actividadId,
    filtroPlenaComun,
    grupoId,
    excluirConflictos,
    priorizarExpTipo,
  ]);

  useEffect(() => {
    if (!responsabilidadId || !actividad) return;
    const timer = setTimeout(() => handleBuscar(), 300);
    return () => clearTimeout(timer);
  }, [handleBuscar, responsabilidadId, actividad]);

  function handleSeleccionarCandidato(candidato: Candidato) {
    const respId = Number(responsabilidadId);
    const nombreResp =
      responsabilidades?.find((r) => r.id_responsabilidad === respId)?.nombre ??
      `Responsabilidad #${respId}`;

    const next = new Map(selecciones);
    const yaSeleccionado = next.get(respId)?.miembro_id === candidato.miembro_id;

    if (yaSeleccionado) {
      next.delete(respId);
      toast.info(`${candidato.nombre_completo} deseleccionado`);
    } else {
      next.set(respId, {
        miembro_id: candidato.miembro_id,
        nombre: candidato.nombre_completo,
        nombreResp,
        confirmado: false,
      });
      toast.success(`${candidato.nombre_completo} seleccionado para ${nombreResp}`);
    }
    setSelecciones(next);
  }

  function handleQuitarSeleccion(respId: number) {
    const next = new Map(selecciones);
    next.delete(respId);
    setSelecciones(next);
  }

  function handleConfirm() {
    const assignments = [...selecciones.entries()].map(
      ([responsabilidad_id, { miembro_id, confirmado }]) => ({
        responsabilidad_id,
        miembro_id,
        confirmado,
      }),
    );

    asignarMutation.mutate(assignments, {
      onSuccess: () => {
        toast.success('Responsabilidades asignadas exitosamente');
        router.push(`/dashboard/actividades/${actividadId}`);
      },
      onError: (err: unknown) => {
        toast.error(extractApiMessage(err, 'Error al asignar responsabilidades'));
        setShowConfirmModal(false);
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const respActualId = Number(responsabilidadId);
  const seleccionActual = selecciones.get(respActualId);

  // ---------------------------------------------------------------------------
  // Loading / not found
  // ---------------------------------------------------------------------------

  if (loadingActividad || loadingResp) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isForbidden || (!loadingActividad && !isAdmin && !esDirectivaDeEsteGrupo)) {
    return (
      <AccessDenied
        message="Solo los miembros de directiva de este grupo pueden solicitar sugerencias de responsabilidades."
        backHref={`/dashboard/actividades/${actividadId}`}
        backLabel="Volver a la actividad"
      />
    );
  }

  if (!actividad) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Actividad no encontrada.</p>
        <Button variant="link" asChild>
          <Link href="/dashboard/actividades">Volver a actividades</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/actividades/${actividadId}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light tracking-tight">Sugerir Responsabilidades</h1>
            <p className="text-sm text-muted-foreground">
              {actividad.nombre} · {formatFecha(actividad.fecha)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/actividades/${actividadId}`}>Cancelar</Link>
          </Button>
          {selecciones.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selecciones.size} asignada{selecciones.size !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            onClick={() => setShowConfirmModal(true)}
            disabled={selecciones.size === 0 || asignarMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {asignarMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Confirmar ({selecciones.size})
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------------------------------------------------------------- */}
        {/* Left column                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-4 lg:col-span-1">

          {/* Card principal: búsqueda + filtros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" />
                Buscar candidatos
              </CardTitle>
              <CardDescription>
                Elige un rol y el sistema sugiere quién debería hacerlo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* 1. Responsabilidad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Responsabilidad</Label>
                  {respIdsConAsignado.size > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      {respIdsConAsignado.size} ya asignada
                      {respIdsConAsignado.size !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <Select
                  value={responsabilidadId}
                  onValueChange={(val) => {
                    setResponsabilidadId(val);
                    setResultados(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar responsabilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsabilidades
                      ?.filter((r) => !respIdsConAsignado.has(r.id_responsabilidad))
                      .map((r) => (
                        <SelectItem key={r.id_responsabilidad} value={String(r.id_responsabilidad)}>
                          <span className="flex items-center gap-2">
                            {r.nombre}
                            {selecciones.has(r.id_responsabilidad) && (
                              <Badge className="h-4 px-1.5 text-[9px] bg-success text-success-foreground">
                                Asignado
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    {responsabilidades?.some((r) =>
                      respIdsConAsignado.has(r.id_responsabilidad),
                    ) && (
                      <>
                        <Separator className="my-1" />
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Ya tienen responsable
                        </p>
                        {responsabilidades
                          ?.filter((r) => respIdsConAsignado.has(r.id_responsabilidad))
                          .map((r) => (
                            <SelectItem
                              key={r.id_responsabilidad}
                              value={String(r.id_responsabilidad)}
                              className="text-muted-foreground"
                            >
                              {r.nombre}
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 2. Grupo (solo admin ve todos los grupos) */}
              {isAdmin && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Buscar dentro del grupo</Label>
                  <Select
                    value={grupoId || 'all'}
                    onValueChange={(v) => setGrupoId(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Seleccionar grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los grupos</SelectItem>
                      {grupos?.map((g) => (
                        <SelectItem key={g.id_grupo} value={String(g.id_grupo)}>
                          {g.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* 3. Filtros */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Filtros
                </Label>
                <div className="grid gap-1.5">
                  {[
                    {
                      id: 'excluir-conflictos',
                      label: 'Ocultar personas con otra tarea ese día',
                      checked: excluirConflictos,
                      onChange: setExcluirConflictos,
                    },
                    {
                      id: 'plena-comunion',
                      label: 'Solo Plena Comunión',
                      checked: filtroPlenaComun,
                      onChange: setFiltroPlenaComun,
                    },
                    {
                      id: 'priorizar-exp-tipo',
                      label: `Priorizar con experiencia en este tipo de actividad${actividad.tipo_actividad?.nombre ? ` (${actividad.tipo_actividad.nombre})` : ''}`,
                      checked: priorizarExpTipo,
                      onChange: setPriorizarExpTipo,
                    },
                  ].map(({ id, label, checked, onChange }) => (
                    <div
                      key={id}
                      className="flex items-start gap-2 rounded-md border bg-background px-3 py-2"
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(v) => onChange(Boolean(v))}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={id}
                        className="cursor-pointer text-xs font-medium leading-snug"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explicación del orden */}
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground">
                  <strong className="text-foreground">Orden:</strong> disponibilidad → tiempo sin
                  este rol → actividades este mes
                  {priorizarExpTipo ? ' → experiencia en este tipo' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de selecciones */}
          {selecciones.size > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selecciones ({selecciones.size})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...selecciones.entries()].map(([respId, { nombre, nombreResp, confirmado }]) => (
                  <div
                    key={respId}
                    className="flex flex-col gap-2 rounded-md border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-primary dark:text-primary">
                          {nombreResp}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{nombre}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuitarSeleccion(respId)}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`confirmado-${respId}`}
                        checked={confirmado}
                        onCheckedChange={(v) => {
                          const next = new Map(selecciones);
                          const entry = next.get(respId);
                          if (entry) next.set(respId, { ...entry, confirmado: Boolean(v) });
                          setSelecciones(next);
                        }}
                      />
                      <Label
                        htmlFor={`confirmado-${respId}`}
                        className="cursor-pointer text-xs font-normal leading-none"
                      >
                        Registrar como confirmado
                      </Label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right column: resultados                                         */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:col-span-2">
          {!responsabilidadId ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <Sparkles className="mb-2 size-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                Selecciona una responsabilidad para ver sugerencias.
              </p>
            </div>
          ) : buscando && !resultados ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : resultados === null ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <Search className="mb-2 size-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Buscando mejores candidatos...</p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-sm text-muted-foreground">
                No se encontraron candidatos con los filtros actuales.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {/* Banner */}
              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {resultados.length} candidato{resultados.length !== 1 ? 's' : ''} encontrado
                    {resultados.length !== 1 ? 's' : ''}
                  </p>
                  {buscando && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
                </div>
                {!excluirConflictos && (
                  <p className="mt-1 text-xs text-warning-foreground dark:text-warning-foreground">
                    Se incluyen personas con otras tareas ese día (aparecen en rojo).
                  </p>
                )}
              </div>

              {/* Tarjetas de candidatos */}
              {resultados.map((c) => {
                const isSelected = seleccionActual?.miembro_id === c.miembro_id;
                const tieneConflicto = !c.indicadores.disponible_en_fecha;
                return (
                  <button
                    key={c.miembro_id}
                    type="button"
                    onClick={() => handleSeleccionarCandidato(c)}
                    className={`flex w-full flex-col items-start gap-2.5 rounded-lg border p-4 text-left transition-all hover:shadow-sm ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm dark:bg-primary/10'
                        : tieneConflicto
                          ? 'border-destructive/40 bg-destructive/5 hover:border-destructive/60'
                          : 'border-border bg-background hover:border-primary/40'
                    }`}
                  >
                    {/* Fila 1: nombre + badges */}
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Badge className="h-5 bg-primary px-2 text-[10px]">Seleccionado</Badge>
                        )}
                        <span className="font-semibold">{c.nombre_completo}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {tieneConflicto ? (
                          <Badge variant="destructive" className="h-5 px-2 text-[10px]">
                            <XCircle className="mr-1 size-3" />
                            {c.indicadores.conflictos_en_fecha_count} tarea
                            {c.indicadores.conflictos_en_fecha_count !== 1 ? 's' : ''} ese día
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="h-5 border-success-foreground px-2 text-[10px] text-success-foreground"
                          >
                            Disponible
                          </Badge>
                        )}
                        {c.indicadores.plena_comunion && (
                          <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                            Plena comunión
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Conflictos detallados */}
                    {tieneConflicto &&
                      c.indicadores.conflictos_detalle &&
                      c.indicadores.conflictos_detalle.length > 0 && (
                        <div className="space-y-0.5 pl-1">
                          {c.indicadores.conflictos_detalle.map((d, i) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: conflict list is stable
                            <p key={i} className="text-xs text-destructive">
                              • {d.rol} en {d.actividad} (este mismo día)
                            </p>
                          ))}
                        </div>
                      )}

                    {/* Fila 2: por qué se sugiere */}
                    <p className="rounded-md bg-muted/50 px-3 py-1.5 text-xs text-foreground">
                      {generarJustificacion(
                        c.indicadores.dias_desde_ultimo_uso,
                        c.indicadores.servicios_este_mes,
                      )}
                    </p>

                    {/* Fila 3: métricas de detalle */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3 shrink-0" />
                        <span>{formatRotacion(c.indicadores.dias_desde_ultimo_uso)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="size-3 shrink-0" />
                        <span>
                          Actividades este mes:{' '}
                          <strong
                            className={
                              c.indicadores.servicios_este_mes > 0
                                ? 'text-warning-foreground'
                                : 'text-foreground'
                            }
                          >
                            {c.indicadores.servicios_este_mes}
                          </strong>
                        </span>
                      </span>
                    </div>

                    {/* Fila 4: experiencia en tipo (solo si el filtro está activo) */}
                    {priorizarExpTipo && (
                      <Badge
                        variant={c.indicadores.experiencia_rol_en_tipo > 0 ? 'secondary' : 'outline'}
                        className="h-5 px-2 text-[10px]"
                      >
                        {c.indicadores.experiencia_rol_en_tipo > 0
                          ? `Con experiencia en ${actividad.tipo_actividad?.nombre ?? 'este tipo'}`
                          : `Sin experiencia en ${actividad.tipo_actividad?.nombre ?? 'este tipo'}`}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Modal de confirmación                                               */}
      {/* ------------------------------------------------------------------ */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Confirmar Asignaciones
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const entries = [...selecciones.values()];
                const hayConfirmados = entries.some((e) => e.confirmado);
                const hayInvitados = entries.some((e) => !e.confirmado);
                if (hayConfirmados && hayInvitados) {
                  return (
                    <>
                      Algunos miembros serán{' '}
                      <strong>registrados directamente como confirmados</strong> y otros recibirán
                      una <strong>invitación</strong> en{' '}
                      <span className="font-bold text-foreground">{actividad.nombre}</span>.
                    </>
                  );
                }
                if (hayConfirmados) {
                  return (
                    <>
                      Los siguientes miembros serán{' '}
                      <strong>registrados directamente como confirmados</strong> en{' '}
                      <span className="font-bold text-foreground">{actividad.nombre}</span> sin
                      enviar invitación.
                    </>
                  );
                }
                return (
                  <>
                    Se invitarán los siguientes miembros a{' '}
                    <span className="font-bold text-foreground">{actividad.nombre}</span>.
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2 max-h-[50vh] overflow-y-auto rounded-md border bg-muted/30 p-3">
            <div className="grid gap-2">
              {[...selecciones.entries()].map(
                ([respId, { miembro_id, nombre, nombreResp, confirmado }]) => {
                  const candidato = resultados?.find((c) => c.miembro_id === miembro_id);
                  const tieneConflicto = candidato && !candidato.indicadores.disponible_en_fecha;

                  return (
                    <div
                      key={respId}
                      className={`flex flex-col gap-1.5 rounded-lg border p-3 ${
                        tieneConflicto
                          ? 'border-warning-foreground/40 bg-warning/40 dark:border-warning-foreground/40 dark:bg-warning/30'
                          : 'border-border bg-background'
                      }`}
                    >
                      <p className="text-sm font-bold text-primary dark:text-primary">
                        {nombreResp}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold">{nombre}</p>
                        {confirmado && (
                          <Badge className="h-4 px-1.5 text-[9px] bg-success text-success-foreground">
                            Confirmado
                          </Badge>
                        )}
                      </div>

                      {tieneConflicto && (
                        <div className="flex items-start gap-1.5 rounded-md border border-warning-foreground/40 bg-warning/60 px-2 py-1.5 dark:border-warning-foreground/40 dark:bg-warning">
                          <AlertTriangle className="mt-0.5 size-3 shrink-0 text-warning-foreground" />
                          <div className="text-[11px] text-warning-foreground dark:text-warning-foreground">
                            <p className="font-semibold">
                              Tiene {candidato.indicadores.conflictos_en_fecha_count} conflicto
                              {candidato.indicadores.conflictos_en_fecha_count !== 1 ? 's' : ''} en
                              esta fecha
                            </p>
                            {candidato.indicadores.conflictos_detalle?.map((d, i) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                              <p key={i}>
                                • {d.rol} en {d.actividad}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={asignarMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={asignarMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {asignarMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Confirmar Asignación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
