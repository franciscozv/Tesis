'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Crown,
  GripVertical,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  TrendingUp,
  Users,
  UserX,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
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
import { useAuth } from '@/features/auth/hooks/use-auth';
import { candidatosApi } from '@/features/candidatos/api';
import type { CandidatoCargo } from '@/features/candidatos/types';
import { useRolesHabilitadosEnGrupo } from '@/features/grupo-rol/hooks/use-grupo-rol';
import type { RolGrupo } from '@/features/catalogos/types';
import { useGrupo, useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { useRenovarDirectiva } from '@/features/integrantes-grupo/hooks/use-renovar-directiva';
import { useIntegrantesGrupo } from '@/features/integrantes-grupo/hooks/use-integrantes-grupo';

const PERIODOS = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
];

const CRITERIOS_INFO = [
  {
    key: 'experiencia',
    label: 'Experiencia',
    description: 'Más veces en el cargo → mejor',
  },
  {
    key: 'carga_trabajo',
    label: 'Carga de trabajo',
    description: 'Menos grupos activos → mejor',
  },
  {
    key: 'fidelidad',
    label: 'Actividad en Servicios',
    description: 'Más responsabilidades cumplidas → mejor',
  },
  {
    key: 'antiguedad',
    label: 'Antigüedad',
    description: 'Más años en el grupo → mejor',
  },
] as const;

const PRIORIDAD_DEFAULT = ['experiencia', 'carga_trabajo', 'fidelidad', 'antiguedad'];

function getNombre(mg: MiembroGrupo): string {
  const m = mg.miembro;
  return m ? `${m.nombre} ${m.apellido}` : `Miembro #${mg.miembro_id}`;
}

export default function RenovacionDirectivaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const grupoId = Number(id);
  const router = useRouter();
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  // --- Datos del Grupo ---
  const { data: grupo, isLoading: loadingGrupo } = useGrupo(grupoId);
  const { data: todosLosGrupos } = useGrupos();
  const { data: miembrosGrupo, isLoading: loadingMiembros } = useIntegrantesGrupo(grupoId);
  const { data: rolesGrupo, isLoading: loadingRoles } = useRolesHabilitadosEnGrupo(grupoId);

  // --- Estado del Formulario ---
  const [selecciones, setSelecciones] = useState<Map<number, number>>(new Map());
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  // --- Configuración del Algoritmo ---
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>(String(grupoId));
  const [periodoMeses, setPeriodoMeses] = useState<string>('12');
  const [prioridad, setPrioridad] = useState<string[]>(PRIORIDAD_DEFAULT);
  const [soloConExperiencia, setSoloConExperiencia] = useState(false);
  const [soloConPlenaComunion, setSoloConPlenaComunion] = useState(false);
  const [showConfig, setShowConfig] = useState(true); // Siempre visible o colapsable
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const DRAFT_KEY = `renovacion_draft_${grupoId}`;
  const [isLoaded, setIsLoaded] = useState(false);

  // --- 1. Cargar Borrador al iniciar ---
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.selecciones) setSelecciones(new Map(draft.selecciones));
        if (draft.fecha) setFecha(draft.fecha);
        if (draft.periodoMeses) setPeriodoMeses(draft.periodoMeses);
        if (draft.soloConExperiencia !== undefined) setSoloConExperiencia(draft.soloConExperiencia);
        if (draft.soloConPlenaComunion !== undefined)
          setSoloConPlenaComunion(draft.soloConPlenaComunion);
        if (draft.prioridad) setPrioridad(draft.prioridad);
        if (draft.selectedGrupoId) setSelectedGrupoId(draft.selectedGrupoId);

        toast.info('Borrador recuperado', {
          description: 'Se han cargado tus selecciones anteriores.',
          duration: 3000,
        });
      } catch (e) {
        console.error('Error al cargar borrador', e);
      }
    }
    setIsLoaded(true);
  }, [DRAFT_KEY]);

  // --- 2. Guardar Borrador al cambiar algo (solo después de cargar el inicial) ---
  useEffect(() => {
    if (!isLoaded) return;

    const draft = {
      selecciones: Array.from(selecciones.entries()),
      fecha,
      periodoMeses,
      soloConExperiencia,
      soloConPlenaComunion,
      prioridad,
      selectedGrupoId,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    selecciones,
    fecha,
    periodoMeses,
    soloConExperiencia,
    soloConPlenaComunion,
    prioridad,
    selectedGrupoId,
    DRAFT_KEY,
    isLoaded,
  ]);

  // Map: cargo_id → candidatos sugeridos
  const [sugerencias, setSugerencias] = useState<Map<number, CandidatoCargo[]>>(new Map());
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);

  const renovarMutation = useRenovarDirectiva(grupoId);

  // Filtrar roles directivos y miembros activos
  const rolesDirectiva = rolesGrupo?.filter((r) => r.es_directiva && r.activo) ?? [];
  const activos = miembrosGrupo?.filter((mg) => !mg.fecha_desvinculacion) ?? [];
  const holderByRolId = new Map(
    activos.filter((mg) => mg.rol.es_directiva).map((mg) => [mg.rol.id, mg]),
  );

  function moverArriba(index: number) {
    if (index === 0) return;
    const next = [...prioridad];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setPrioridad(next);
  }

  function moverAbajo(index: number) {
    if (index === prioridad.length - 1) return;
    const next = [...prioridad];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setPrioridad(next);
  }

  // Cargar sugerencias cuando cambian los roles o la config
  useEffect(() => {
    if (rolesDirectiva.length === 0) return;

    setLoadingSugerencias(true);

    Promise.all(
      rolesDirectiva.map(async (cargo) => {
        try {
          const res = await candidatosApi.sugerirCargo({
            cargo_id: cargo.id_rol_grupo,
            grupo_id: selectedGrupoId === 'all' ? undefined : Number(selectedGrupoId),
            periodo_meses: Number(periodoMeses),
            solo_con_experiencia: soloConExperiencia,
            solo_con_plena_comunion: soloConPlenaComunion,
            criterios_prioridad: prioridad,
          });
          return { cargoId: cargo.id_rol_grupo, candidatos: res.candidatos ?? [] };
        } catch {
          return { cargoId: cargo.id_rol_grupo, candidatos: [] };
        }
      }),
    ).then((results) => {
      const map = new Map<number, CandidatoCargo[]>();
      results.forEach(({ cargoId, candidatos }) => map.set(cargoId, candidatos));
      setSugerencias(map);
      setLoadingSugerencias(false);
    });
  }, [
    selectedGrupoId,
    rolesDirectiva.map((r) => r.id_rol_grupo).join(','),
    periodoMeses,
    soloConExperiencia,
    soloConPlenaComunion,
    prioridad.join(','),
  ]);

  function handleSubmit() {
    const renovaciones = [...selecciones.entries()].map(([cargo_id, nuevo_miembro_id]) => ({
      cargo_id,
      nuevo_miembro_id,
    }));

    if (renovaciones.length === 0) {
      toast.error('Debe seleccionar al menos un nuevo titular');
      return;
    }

    // --- Validar duplicados de miembros ---
    const miembroIds = renovaciones.map((r) => r.nuevo_miembro_id);
    if (new Set(miembroIds).size !== miembroIds.length) {
      toast.error('No se puede asignar el mismo miembro a múltiples cargos directivos', {
        description: 'Cada cargo debe tener un titular único.',
      });
      return;
    }

    // Si todo está bien, mostrar modal de confirmación
    setShowConfirmModal(true);
  }

  function handleConfirm() {
    const renovaciones = [...selecciones.entries()].map(([cargo_id, nuevo_miembro_id]) => ({
      cargo_id,
      nuevo_miembro_id,
    }));

    // Convertir fecha local (YYYY-MM-DD) a ISO datetime
    const fechaISO = new Date(`${fecha}T00:00:00`).toISOString();

    renovarMutation.mutate(
      { renovaciones, fecha: fechaISO },
      {
        onSuccess: () => {
          localStorage.removeItem(DRAFT_KEY);
          toast.success('Directiva renovada exitosamente');
          router.push(`/dashboard/grupos/${grupoId}`);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al renovar la directiva');
          setShowConfirmModal(false);
        },
      },
    );
  }

  if (loadingGrupo || loadingMiembros || loadingRoles) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!grupo || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
        <Button variant="link" asChild>
          <Link href={`/dashboard/grupos/${grupoId}`}>Volver al detalle</Link>
        </Button>
      </div>
    );
  }

  const totalSelecciones = selecciones.size;

  return (
    <div className="grid gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/grupos/${grupoId}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Renovación Masiva de Directiva</h1>
            <p className="text-muted-foreground text-sm">{grupo.nombre}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/grupos/${grupoId}`}>Cancelar</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={totalSelecciones === 0 || renovarMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {renovarMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crown className="size-4" />
            )}
            Confirmar Renovación
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna Izquierda: Configuración */}
        <div className="space-y-6 lg:col-span-1">
          {/* Tarjeta de Fecha */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-4 text-blue-600" />
                Fecha de Vigencia
              </CardTitle>
              <CardDescription>Indica cuándo asume la nueva directiva.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="fecha-renovacion">Fecha efectiva</Label>
                <input
                  id="fecha-renovacion"
                  type="date"
                  value={fecha}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Algoritmo */}
          <Card className="border-blue-100 bg-blue-50/20 dark:border-blue-900/40 dark:bg-blue-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="size-4 text-blue-600" />
                  Configurar Algoritmo
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-blue-600"
                >
                  {showConfig ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
              </div>
              <CardDescription>Ajusta los criterios para las sugerencias.</CardDescription>
            </CardHeader>
            {showConfig && (
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Alcance de búsqueda
                  </Label>
                  <Select value={selectedGrupoId} onValueChange={setSelectedGrupoId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los grupos (Global)</SelectItem>
                      <SelectItem value={String(grupoId)}>Este grupo</SelectItem>
                      <Separator className="my-1" />
                      {todosLosGrupos
                        ?.filter((g) => g.id_grupo !== grupoId)
                        .map((g) => (
                          <SelectItem key={g.id_grupo} value={String(g.id_grupo)}>
                            {g.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Busca candidatos en el grupo actual o a través de toda la congregación.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Período de análisis
                  </Label>
                  <Select value={periodoMeses} onValueChange={setPeriodoMeses}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODOS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          Últimos {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Define el rango de tiempo para calcular el % de asistencia.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5">
                  <Checkbox
                    id="solo-exp-page"
                    checked={soloConExperiencia}
                    onCheckedChange={(v) => setSoloConExperiencia(Boolean(v))}
                  />
                  <Label
                    htmlFor="solo-exp-page"
                    className="cursor-pointer text-xs font-medium leading-none"
                  >
                    Priorizar solo con experiencia previa
                  </Label>
                </div>

                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5">
                  <Checkbox
                    id="solo-plena-page"
                    checked={soloConPlenaComunion}
                    onCheckedChange={(v) => setSoloConPlenaComunion(Boolean(v))}
                  />
                  <Label
                    htmlFor="solo-plena-page"
                    className="cursor-pointer text-xs font-medium leading-none"
                  >
                    Solo con Plena Comunión
                  </Label>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Prioridades de búsqueda
                  </Label>
                  <div className="grid gap-2">
                    {prioridad.map((key, index) => {
                      const crit = CRITERIOS_INFO.find((c) => c.key === key);
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 rounded-md border bg-background p-2 transition-colors hover:border-blue-200"
                        >
                          <GripVertical className="size-4 text-muted-foreground/40" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-semibold">{crit?.label}</p>
                          </div>
                          <div className="flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => moverArriba(index)}
                              disabled={index === 0}
                              className="rounded p-0.5 hover:bg-muted disabled:opacity-20"
                            >
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moverAbajo(index)}
                              disabled={index === prioridad.length - 1}
                              className="rounded p-0.5 hover:bg-muted disabled:opacity-20"
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setPrioridad(PRIORIDAD_DEFAULT)}
                    className="h-auto p-0 text-[11px] text-muted-foreground"
                  >
                    Restablecer orden por defecto
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Cargos */}
        <div className="space-y-4 lg:col-span-2">
          {rolesDirectiva.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <UserX className="size-12 text-muted-foreground/20" />
                <p className="mt-2 text-muted-foreground">
                  No hay cargos directivos configurados para este grupo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rolesDirectiva.map((cargo) => {
                const titular = holderByRolId.get(cargo.id_rol_grupo);
                const titularNombre = titular ? getNombre(titular) : null;
                const seleccionado = selecciones.get(cargo.id_rol_grupo);
                const candidatosCargo = (sugerencias.get(cargo.id_rol_grupo) ?? []).slice(0, 3);

                // Todos los miembros activos del grupo pueden ser candidatos (incluyendo directiva actual para reelección)
                const opcionesSelect = activos;

                return (
                  <Card
                    key={cargo.id_rol_grupo}
                    className={`transition-all ${
                      seleccionado ? 'border-green-200 bg-green-50/5 dark:border-green-900/30' : ''
                    }`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <ShieldCheck className="size-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{cargo.nombre}</CardTitle>
                              {cargo.requiere_plena_comunion && (
                                <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-200 bg-amber-50">
                                  Requiere Plena Comunión
                                </Badge>
                              )}
                            </div>
                            {titularNombre ? (
                              <p className="text-sm text-muted-foreground">
                                Titular actual:{' '}
                                <span className="font-medium text-foreground">{titularNombre}</span>
                              </p>
                            ) : (
                              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                <UserX className="size-3.5" />
                                Vacante
                              </p>
                            )}
                          </div>
                        </div>
                        {seleccionado && (
                          <div className="flex gap-2">
                            {[...selecciones.values()].filter((id) => id === seleccionado).length >
                              1 && (
                              <Badge
                                variant="destructive"
                                className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              >
                                Duplicado
                              </Badge>
                            )}
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Asignado
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="grid gap-2">
                        <Label className="text-sm font-semibold">Seleccionar nuevo titular</Label>
                        <Select
                          value={seleccionado?.toString() ?? ''}
                          onValueChange={(val) => {
                            const next = new Map(selecciones);
                            if (val) {
                              next.set(cargo.id_rol_grupo, Number(val));
                            } else {
                              next.delete(cargo.id_rol_grupo);
                            }
                            setSelecciones(next);
                          }}
                        >
                          <SelectTrigger className="h-10 bg-background">
                            <SelectValue placeholder="— Seleccionar miembro de la nómina —" />
                          </SelectTrigger>
                          <SelectContent>
                            {opcionesSelect.length === 0 ? (
                              <SelectItem value="__empty__" disabled>
                                Sin integrantes disponibles en la nómina
                              </SelectItem>
                            ) : (
                              opcionesSelect.map((mg) => (
                                <SelectItem key={mg.miembro_id} value={mg.miembro_id.toString()}>
                                  {getNombre(mg)}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sugerencias */}
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Sugerencias del Algoritmo
                          </p>
                          {loadingSugerencias && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                        </div>

                        {loadingSugerencias ? (
                          <div className="grid gap-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : candidatosCargo.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {candidatosCargo.map((c) => {
                              const pct = Math.round(c.indicadores.asistencia_ratio_periodo * 100);
                              const isSelected = seleccionado === c.miembro_id;
                              return (
                                <button
                                  key={c.miembro_id}
                                  type="button"
                                  onClick={() => {
                                    const next = new Map(selecciones);
                                    if (isSelected) {
                                      next.delete(cargo.id_rol_grupo);
                                    } else {
                                      next.set(cargo.id_rol_grupo, c.miembro_id);
                                    }
                                    setSelecciones(next);
                                  }}
                                  className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                                    isSelected
                                      ? 'border-blue-400 bg-blue-50 text-blue-900 shadow-sm dark:bg-blue-900/20 dark:text-blue-100'
                                      : 'border-border bg-background hover:border-blue-200'
                                  }`}
                                >
                                  <div className="flex w-full items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-blue-600 dark:text-blue-400">#{c.posicion}</span>
                                      <span className="text-sm font-semibold">{c.nombre_completo}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {cargo.requiere_plena_comunion && !c.indicadores.plena_comunion && (
                                        <Badge variant="destructive" className="h-4 px-1.5 text-[9px] uppercase animate-pulse">
                                          Sin Plena Comunión
                                        </Badge>
                                      )}
                                      {/* DIAGNÓSTICO AVANZADO */}
                                      {c.indicadores.historial_otros_cargos?.some((h) => h.es_directiva) && (
                                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold border-amber-500 text-amber-600 bg-amber-50 gap-1">
                                          <Crown className="size-2.5" />
                                          {(() => {
                                            const activosOtros = c.indicadores.historial_otros_cargos?.filter(h => !h.fecha_fin && h.es_directiva && h.grupo_nombre?.trim().toLowerCase() !== grupo.nombre?.trim().toLowerCase());
                                            const activosEste = c.indicadores.historial_otros_cargos?.filter(h => !h.fecha_fin && h.es_directiva && h.grupo_nombre?.trim().toLowerCase() === grupo.nombre?.trim().toLowerCase());
                                            if (activosOtros && activosOtros.length > 0) return `Directiva en otro grupo (${activosOtros.length})`;
                                            if (activosEste && activosEste.length > 0) return "Directiva actual";
                                            return "Ex-Directiva";
                                          })()}
                                        </Badge>
                                      )}
                                      {isSelected && <RefreshCw className="size-3 text-blue-600 animate-spin-slow" />}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-normal gap-1 border-amber-200 bg-amber-50 text-amber-700">
                                      <Award className="size-2.5" />
                                      {c.indicadores.experiencia_cargo_en_grupo}× exp.
                                    </Badge>
                                    <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-normal gap-1 border-green-200 bg-green-50 text-green-700">
                                      <TrendingUp className="size-2.5" />
                                      {c.indicadores.asistencias_count} servicios
                                    </Badge>
                                  </div>

                                  {/* 1. Grupos Actuales (Carga de Trabajo) */}
                                  {c.indicadores.historial_otros_cargos && c.indicadores.historial_otros_cargos.some(h => !h.fecha_fin) && (
                                    <div className="mt-1 text-[10px] text-muted-foreground leading-tight space-y-0.5">
                                      <p className="font-medium text-muted-foreground/80 uppercase text-[8px] tracking-wider">Participa actualmente en:</p>
                                      {c.indicadores.historial_otros_cargos
                                        .filter(h => !h.fecha_fin)
                                        .map((h, idx) => {
                                          const esDirectiva = h.es_directiva;
                                          return (
                                            <p key={idx} className={`flex items-center gap-1 pl-1 border-l ${
                                              esDirectiva 
                                                ? 'border-amber-400 text-amber-700 dark:text-amber-400 font-semibold' 
                                                : 'border-blue-400 text-blue-700 dark:text-blue-400 font-medium'
                                            }`}>
                                              {esDirectiva ? <Crown className="size-2.5 shrink-0" /> : <Users className="size-2.5 shrink-0" />}
                                              <span>{h.grupo_nombre} ({h.cargo_nombre || 'Integrante'})</span>
                                            </p>
                                          );
                                        })}
                                    </div>
                                  )}

                                  {/* 2. Historial Pasado (Trayectoria) */}
                                  {c.indicadores.historial_otros_cargos && c.indicadores.historial_otros_cargos.some(h => h.fecha_fin) && (
                                    <div className="mt-1.5 text-[10px] text-muted-foreground leading-tight space-y-0.5">
                                      <p className="font-medium text-muted-foreground/80 uppercase text-[8px] tracking-wider">Trayectoria Anterior:</p>
                                      {c.indicadores.historial_otros_cargos
                                        .filter(h => h.fecha_fin) // Solo los que terminaron
                                        .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
                                        .map((h, idx) => {
                                          const nombreCargoExhibido = h.cargo_nombre || 'Integrante'; 
                                          const inicio = h.fecha_inicio ? new Date(h.fecha_inicio).getFullYear() : '?';
                                          const fin = new Date(h.fecha_fin!).getFullYear();
                                          const esDirectiva = h.es_directiva;

                                          return (
                                            <p key={idx} className={`flex items-center gap-1 pl-1 border-l ${
                                              esDirectiva 
                                                ? 'border-amber-400 text-amber-700 dark:text-amber-400 font-medium' 
                                                : 'border-muted-foreground/20'
                                            }`}>
                                              {esDirectiva ? <Crown className="size-2.5 shrink-0" /> : <span className="w-2.5 text-center">•</span>}
                                              <span>{nombreCargoExhibido} en {h.grupo_nombre} ({inicio}-{fin})</span>
                                            </p>
                                          );
                                        })}
                                    </div>
                                  )}

                                  {/* Resumen de Actividades - Siempre Visible */}
                                  <div className="mt-2 w-full space-y-1">
                                    <p className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-400">
                                      Actividades Realizadas ({periodoMeses} meses):
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {c.indicadores.resumen_servicios && c.indicadores.resumen_servicios.length > 0 ? (
                                        c.indicadores.resumen_servicios.map((s, i) => (
                                          <Badge key={i} variant="secondary" className="h-4 px-1.5 text-[9px] font-normal bg-muted/50">
                                            {s.cantidad} {s.tipo} ({s.rol})
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1 rounded flex items-center gap-1">
                                          ⚠️ No se registran actividades previas.
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-1 space-y-0.5">
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                      <span className="font-medium text-muted-foreground/80">Antigüedad en grupo: </span>
                                      {c.indicadores.antiguedad_grupo_anios} años 
                                      {c.indicadores.fecha_vinculacion_grupo && ` (Desde ${new Date(c.indicadores.fecha_vinculacion_grupo).getFullYear()})`}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                      <span className="font-medium text-muted-foreground/80">Antigüedad en iglesia: </span>
                                      {c.indicadores.antiguedad_anios} años (Desde {new Date(c.indicadores.fecha_ingreso).getFullYear()})
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs italic text-muted-foreground">
                            No se encontraron candidatos idóneos con el filtro actual.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="size-5 text-amber-600" />
              Confirmar Renovación de Directiva
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se aplicarán los siguientes cambios de forma masiva en el grupo{' '}
              <span className="font-bold text-foreground">{grupo.nombre}</span>. Los cargos
              anteriores se cerrarán con fecha {new Date(fecha).toLocaleDateString()}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 max-h-[50vh] overflow-y-auto rounded-md border bg-muted/30 p-4">
            <div className="grid gap-3">
              {[...selecciones.entries()].map(([cargoId, miembroId]) => {
                const cargo = rolesDirectiva.find((r) => r.id_rol_grupo === cargoId);
                const nuevoTitular = activos.find((mg) => mg.miembro_id === miembroId);
                const titularActual = holderByRolId.get(cargoId);
                const candidato = (sugerencias.get(cargoId) ?? []).find(
                  (c) => c.miembro_id === miembroId,
                );

                // Cargos activos del entrante en OTROS grupos (directivos o no)
                const cargosActivosExternos =
                  candidato?.indicadores.historial_otros_cargos?.filter(
                    (h) =>
                      h.fecha_fin === null &&
                      h.grupo_nombre?.trim().toLowerCase() !== grupo.nombre?.trim().toLowerCase(),
                  ) ?? [];

                // Cargo directivo activo del entrante en ESTE mismo grupo (diferente al que se le asigna)
                const cargoDirectivoEsteGrupo =
                  candidato?.indicadores.historial_otros_cargos?.find(
                    (h) =>
                      h.fecha_fin === null &&
                      h.es_directiva &&
                      h.grupo_nombre?.trim().toLowerCase() === grupo.nombre?.trim().toLowerCase() &&
                      h.cargo_nombre !== cargo?.nombre,
                  ) ?? null;

                const hayAdvertencias =
                  cargosActivosExternos.length > 0 || cargoDirectivoEsteGrupo !== null;

                return (
                  <div
                    key={cargoId}
                    className={`flex flex-col gap-2 rounded-lg border p-3 ${
                      hayAdvertencias
                        ? 'border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20'
                        : 'border-border bg-background'
                    }`}
                  >
                    {/* Fila cargo */}
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                      {cargo?.nombre}
                    </p>

                    {/* Fila Saliente → Entrante */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground">Saliente</span>
                        <span className="text-xs">
                          {titularActual ? getNombre(titularActual) : 'Vacante'}
                        </span>
                      </div>
                      <ArrowLeft className="size-3 rotate-180 text-muted-foreground" />
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase text-green-600 font-bold">Entrante</span>
                        <span className="text-xs font-semibold">
                          {candidato?.nombre_completo ?? (nuevoTitular ? getNombre(nuevoTitular) : `Miembro #${miembroId}`)}
                        </span>
                      </div>
                    </div>

                    {/* Advertencias de conflicto */}
                    {cargoDirectivoEsteGrupo && (
                      <div className="flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-100/60 px-2.5 py-1.5 dark:border-amber-700/40 dark:bg-amber-900/20">
                        <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-600 dark:text-amber-400" />
                        <p className="text-[11px] text-amber-800 dark:text-amber-300">
                          <span className="font-semibold">
                            {candidato?.nombre_completo ?? (nuevoTitular ? getNombre(nuevoTitular) : 'El entrante')} ya ocupa otro cargo en este grupo:
                          </span>{' '}
                          {cargoDirectivoEsteGrupo.cargo_nombre}
                        </p>
                      </div>
                    )}

                    {cargosActivosExternos.length > 0 && (
                      <div className="flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-100/60 px-2.5 py-1.5 dark:border-amber-700/40 dark:bg-amber-900/20">
                        <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                            {candidato?.nombre_completo ?? (nuevoTitular ? getNombre(nuevoTitular) : 'El entrante')} tiene cargos activos en otros grupos:
                          </p>
                          <ul className="mt-0.5 space-y-0.5">
                            {cargosActivosExternos.map((h, i) => (
                              <li key={i} className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                                {h.es_directiva ? (
                                  <Crown className="size-2.5 shrink-0" />
                                ) : (
                                  <Users className="size-2.5 shrink-0" />
                                )}
                                <span className="font-medium">{h.cargo_nombre ?? 'Integrante'}</span>
                                <span className="text-amber-600/70">en</span>
                                <span>{h.grupo_nombre}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={renovarMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={renovarMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {renovarMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 size-4" />
              )}
              Aplicar Cambios Masivos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
