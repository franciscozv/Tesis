'use client';

import {
  AlertTriangle,
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
  UserX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { candidatosApi } from '@/features/candidatos/api';
import type { CandidatoCargo } from '@/features/candidatos/types';
import type { RolGrupo } from '@/features/catalogos/types';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { useRenovarDirectiva } from '../hooks/use-renovar-directiva';

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
    label: 'Fidelidad',
    description: 'Mayor % de asistencia → mejor',
  },
  {
    key: 'antiguedad',
    label: 'Antigüedad',
    description: 'Más años en el grupo → mejor',
  },
] as const;

const PRIORIDAD_DEFAULT = ['experiencia', 'carga_trabajo', 'fidelidad', 'antiguedad'];

interface RenovarDirectivaModalProps {
  grupoId: number;
  grupoNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cargos directivos del catálogo */
  rolesDirectiva: RolGrupo[];
  /** Todos los integrantes activos del grupo */
  activos: MiembroGrupo[];
}

function getNombre(mg: MiembroGrupo): string {
  const m = mg.miembro;
  return m ? `${m.nombre} ${m.apellido}` : `Miembro #${mg.miembro_id}`;
}

export function RenovarDirectivaModal({
  grupoId,
  grupoNombre,
  open,
  onOpenChange,
  rolesDirectiva,
  activos,
}: RenovarDirectivaModalProps) {
  // Map: cargo_id → miembro_id seleccionado
  const [selecciones, setSelecciones] = useState<Map<number, number>>(new Map());
  // Fecha de renovación (por defecto hoy)
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  // --- Configuración del Algoritmo ---
  const [periodoMeses, setPeriodoMeses] = useState<string>('12');
  const [prioridad, setPrioridad] = useState<string[]>(PRIORIDAD_DEFAULT);
  const [soloConExperiencia, setSoloConExperiencia] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Map: cargo_id → candidatos sugeridos
  const [sugerencias, setSugerencias] = useState<Map<number, CandidatoCargo[]>>(new Map());
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);
  const [showResumen, setShowResumen] = useState(false);

  const renovarMutation = useRenovarDirectiva(grupoId);

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

  // Cargar sugerencias cuando se abre el modal o cambia la config
  useEffect(() => {
    if (!open || rolesDirectiva.length === 0) return;

    setLoadingSugerencias(true);

    Promise.all(
      rolesDirectiva.map(async (cargo) => {
        try {
          const res = await candidatosApi.sugerirCargo({
            cargo_id: cargo.id_rol_grupo,
            grupo_id: grupoId,
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
    open,
    grupoId,
    rolesDirectiva.map((r) => r.id_rol_grupo).join(','),
    periodoMeses,
    soloConExperiencia,
    soloConPlenaComunion,
    prioridad.join(','),
  ]);

  // Mapa: id_rol_grupo → titular actual
  const holderByRolId = new Map(
    activos.filter((mg) => mg.rol.es_directiva).map((mg) => [mg.rol.id, mg]),
  );

  function handleSubmit() {
    const renovaciones = [...selecciones.entries()].map(([cargo_id, nuevo_miembro_id]) => ({
      cargo_id,
      nuevo_miembro_id,
    }));

    if (renovaciones.length === 0) {
      toast.error('Debe seleccionar al menos un nuevo titular');
      return;
    }

    // Convertir fecha local (YYYY-MM-DD) a ISO datetime
    const fechaISO = new Date(`${fecha}T00:00:00`).toISOString();

    renovarMutation.mutate(
      { renovaciones, fecha: fechaISO },
      {
        onSuccess: () => {
          toast.success('Directiva renovada exitosamente');
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al renovar la directiva');
        },
      },
    );
  }

  function handleClose() {
    if (renovarMutation.isPending) return;
    setSelecciones(new Map());
    setSugerencias(new Map());
    setShowResumen(false);
    onOpenChange(false);
  }

  const totalSelecciones = selecciones.size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-4 text-primary" />
            Renovación Masiva de Directiva
          </DialogTitle>
          <DialogDescription>
            {grupoNombre} — Seleccione los nuevos titulares para cada cargo directivo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          {/* Fila superior: Fecha + Configuración */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex items-center gap-3">
                <Label htmlFor="fecha-renovacion" className="shrink-0 text-sm font-medium">
                  Fecha efectiva
                </Label>
                <input
                  id="fecha-renovacion"
                  type="date"
                  value={fecha}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFecha(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className={showConfig ? 'bg-primary/5 border-primary/40 text-primary' : ''}
            >
              <Settings2 className="mr-2 size-4" />
              Configurar Algoritmo
              {showConfig ? <ChevronUp className="ml-2 size-4" /> : <ChevronDown className="ml-2 size-4" />}
            </Button>
          </div>

          {/* Panel de Configuración del Algoritmo */}
          {showConfig && (
            <div className="rounded-lg border bg-primary/5 p-4 dark:bg-primary/5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Columna Izquierda: Período y Filtro */}
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Período de análisis
                    </Label>
                    <Select value={periodoMeses} onValueChange={setPeriodoMeses}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODOS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            Asistencia: últimos {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Define el rango de tiempo para calcular el % de asistencia.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2.5">
                    <Checkbox
                      id="solo-exp-global"
                      checked={soloConExperiencia}
                      onCheckedChange={(v) => setSoloConExperiencia(Boolean(v))}
                    />
                    <Label
                      htmlFor="solo-exp-global"
                      className="cursor-pointer text-xs font-medium leading-none"
                    >
                      Priorizar solo con experiencia previa
                    </Label>
                  </div>
                </div>

                {/* Columna Derecha: Prioridades */}
                <div className="space-y-2">
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Prioridades de búsqueda
                  </Label>
                  <div className="grid gap-1.5">
                    {prioridad.map((key, index) => {
                      const crit = CRITERIOS_INFO.find((c) => c.key === key);
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5"
                        >
                          <GripVertical className="size-3.5 text-muted-foreground/40" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[11px] font-semibold">{crit?.label}</p>
                          </div>
                          <div className="flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => moverArriba(index)}
                              disabled={index === 0}
                              className="rounded p-0.5 hover:bg-muted disabled:opacity-20"
                            >
                              <ChevronUp className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moverAbajo(index)}
                              disabled={index === prioridad.length - 1}
                              className="rounded p-0.5 hover:bg-muted disabled:opacity-20"
                            >
                              <ChevronDown className="size-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Resumen de Renovación (paso de confirmación) */}
          {showResumen && (() => {
            // Pre-computar: miembro_id → lista de cargoIds que se le están asignando (detecta duplicados)
            const cargosPorMiembro = new Map<number, number[]>();
            for (const [cargoId, miembroId] of selecciones) {
              const lista = cargosPorMiembro.get(miembroId) ?? [];
              lista.push(cargoId);
              cargosPorMiembro.set(miembroId, lista);
            }

            // Pre-computar: miembro_id → cargo directivo que ya ocupa actualmente en el grupo
            const cargoActualPorMiembro = new Map<number, string>();
            for (const [rolId, mg] of holderByRolId) {
              const cargoNombre = rolesDirectiva.find((r) => r.id_rol_grupo === rolId)?.nombre;
              if (cargoNombre) cargoActualPorMiembro.set(mg.miembro_id, cargoNombre);
            }

            const filas = [...selecciones.entries()].map(([cargoId, miembroId]) => {
              const cargo = rolesDirectiva.find((r) => r.id_rol_grupo === cargoId);
              const candidato = (sugerencias.get(cargoId) ?? []).find(
                (c) => c.miembro_id === miembroId,
              );
              const miembroActivo = activos.find((mg) => mg.miembro_id === miembroId);
              const nombre =
                candidato?.nombre_completo ??
                (miembroActivo ? getNombre(miembroActivo) : `Miembro #${miembroId}`);

              const advertencias: { texto: string; tipo: 'error' | 'aviso' }[] = [];

              // ① Ya asignado a otro cargo dentro de esta misma renovación
              const otrosCargosEnBatch = (cargosPorMiembro.get(miembroId) ?? []).filter(
                (id) => id !== cargoId,
              );
              if (otrosCargosEnBatch.length > 0) {
                const nombresOtros = otrosCargosEnBatch
                  .map((id) => rolesDirectiva.find((r) => r.id_rol_grupo === id)?.nombre ?? `#${id}`)
                  .join(', ');
                advertencias.push({
                  texto: `También asignado a: ${nombresOtros}`,
                  tipo: 'error',
                });
              }

              // ② Ya ocupa un cargo directivo actualmente en este grupo
              const cargoActual = cargoActualPorMiembro.get(miembroId);
              if (cargoActual && cargoActual !== cargo?.nombre) {
                advertencias.push({
                  texto: `Actualmente ocupa: ${cargoActual}`,
                  tipo: 'aviso',
                });
              }

              // ③ Indicadores del candidato sugerido (si aplica)
              if (candidato) {
                if (cargo?.requiere_plena_comunion && !candidato.indicadores.plena_comunion) {
                  advertencias.push({ texto: 'Sin Plena Comunión requerida', tipo: 'error' });
                }
                if (!candidato.indicadores.resumen_servicios?.length) {
                  advertencias.push({ texto: 'Sin actividades previas', tipo: 'aviso' });
                }
                const cargoDirectivoExterno = candidato.indicadores.historial_otros_cargos?.find(
                  (h) => h.es_directiva && h.fecha_fin === null,
                );
                if (cargoDirectivoExterno) {
                  advertencias.push({
                    texto: `Cargo activo en ${cargoDirectivoExterno.grupo_nombre}`,
                    tipo: 'aviso',
                  });
                }
              }

              return { cargoId, cargo, nombre, advertencias };
            });

            const hayAdvertencias = filas.some((f) => f.advertencias.length > 0);

            return (
              <div className="grid gap-3">
                <div>
                  <p className="font-semibold text-sm">Resumen de Cambios</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hayAdvertencias
                      ? 'Existen advertencias. Revíselas antes de ejecutar.'
                      : 'Sin conflictos detectados. Puede confirmar la renovación.'}
                  </p>
                </div>
                <div className="grid gap-2">
                  {filas.map(({ cargoId, cargo, nombre, advertencias }) => (
                    <div
                      key={cargoId}
                      className={`rounded-lg border px-3 py-2.5 ${
                        advertencias.some((a) => a.tipo === 'error')
                          ? 'border-destructive/40 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/10'
                          : advertencias.length > 0
                            ? 'border-warning-foreground/40 bg-warning/40 dark:border-warning-foreground/20 dark:bg-warning/20'
                            : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <ShieldCheck className="size-3.5 shrink-0 text-primary" />
                          <span className="text-xs text-muted-foreground shrink-0">
                            {cargo?.nombre}
                          </span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-sm font-medium truncate">{nombre}</span>
                        </div>
                        {advertencias.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {advertencias.map((a, i) => (
                              <Badge
                                key={i}
                                variant={a.tipo === 'error' ? 'destructive' : 'outline'}
                                className={`h-5 px-1.5 text-[10px] gap-0.5 ${
                                  a.tipo === 'aviso'
                                    ? 'border-warning-foreground/40 bg-warning text-warning-foreground dark:border-warning-foreground dark:bg-warning/30 dark:text-warning-foreground'
                                    : ''
                                }`}
                              >
                                <AlertTriangle className="size-2.5" />
                                {a.texto}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Cargos directivos */}
          {!showResumen && <div className="grid gap-4">
            {rolesDirectiva.map((cargo) => {
              const titular = holderByRolId.get(cargo.id_rol_grupo);
              const titularNombre = titular ? getNombre(titular) : null;
              const seleccionado = selecciones.get(cargo.id_rol_grupo);
              const candidatosCargo = (sugerencias.get(cargo.id_rol_grupo) ?? []).slice(0, 3);

              // Filtrar activos para el selector (todos los del grupo)
              const opcionesSelect = activos.filter((mg) => !mg.rol.es_directiva);

              return (
                <div
                  key={cargo.id_rol_grupo}
                  className="rounded-lg border border-primary/40 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/5"
                >
                  {/* Cabecera del cargo */}
                  <div className="mb-3 flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary dark:text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{cargo.nombre}</p>
                      {titularNombre ? (
                        <p className="text-xs text-muted-foreground">
                          Titular actual:{' '}
                          <span className="font-medium text-foreground">{titularNombre}</span>
                        </p>
                      ) : (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UserX className="size-3" />
                          Vacante
                        </p>
                      )}
                    </div>
                    {seleccionado && (
                      <Badge className="shrink-0 bg-success text-success-foreground dark:bg-success dark:text-success-foreground">
                        Asignado
                      </Badge>
                    )}
                  </div>

                  {/* Selector de nuevo titular */}
                  <div className="mb-3">
                    <Label className="mb-1.5 block text-xs text-muted-foreground">
                      Nuevo titular
                    </Label>
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
                      <SelectTrigger className="h-9 text-sm bg-background">
                        <SelectValue placeholder="— Seleccionar miembro —" />
                      </SelectTrigger>
                      <SelectContent>
                        {opcionesSelect.length === 0 ? (
                          <SelectItem value="__empty__" disabled>
                            Sin integrantes en la nómina
                          </SelectItem>
                        ) : (
                          opcionesSelect.map((mg) => {
                            const nombre = getNombre(mg);
                            return (
                              <SelectItem key={mg.miembro_id} value={mg.miembro_id.toString()}>
                                {nombre}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sugerencias del algoritmo */}
                  {loadingSugerencias ? (
                    <div className="grid gap-1.5">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-7 w-full rounded" />
                      ))}
                    </div>
                  ) : candidatosCargo.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Sugerencias del algoritmo
                      </p>
                      <div className="flex flex-wrap gap-1.5">
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
                              className={`flex flex-col items-start gap-1 rounded-lg border p-2 text-xs transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/10 dark:text-primary'
                                  : 'border-border bg-background hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary dark:text-primary">#{c.posicion}</span>
                                <span className="font-semibold">{c.nombre_completo}</span>
                                {cargo.requiere_plena_comunion && !c.indicadores.plena_comunion && (
                                  <Badge variant="destructive" className="h-4 px-1 text-[8px] uppercase">
                                    Sin Req.
                                  </Badge>
                                )}
                                <div className="flex gap-1">
                                  <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal gap-0.5 border-muted-foreground/30 bg-muted/50 text-muted-foreground">
                                    <Award className="size-2.5" />
                                    {c.indicadores.experiencia_cargo_en_grupo}×
                                  </Badge>
                                  <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal gap-0.5 border-success-foreground/40 bg-success text-success-foreground">
                                    <TrendingUp className="size-2.5" />
                                    {pct}%
                                  </Badge>
                                </div>
                              </div>

                              {/* RESUMEN DE ACTIVIDADES - VERSIÓN INFALIBLE */}
                              <div className="mt-2 w-full space-y-1">
                                <p className="text-[10px] font-extrabold uppercase text-primary dark:text-primary">
                                  Actividades Realizadas:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {c.indicadores.resumen_servicios && c.indicadores.resumen_servicios.length > 0 ? (
                                    c.indicadores.resumen_servicios.map((s, i) => (
                                      <Badge key={i} variant="secondary" className="h-4 px-1.5 text-[9px] font-normal bg-muted/50">
                                        {s.cantidad} {s.tipo} ({s.rol})
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-[10px] font-bold text-warning-foreground dark:text-warning-foreground bg-warning dark:bg-warning px-1 rounded">
                                      ⚠️ No se registran actividades previas.
                                    </span>
                                  )}
                                </div>
                              </div>

                              {c.indicadores.historial_experiencia && c.indicadores.historial_experiencia.length > 0 && (
                                <p className="text-[10px] text-muted-foreground leading-tight text-left">
                                  Cargos: {c.indicadores.historial_experiencia.map(h => {
                                    const inicio = h.fecha_inicio ? new Date(h.fecha_inicio).getFullYear() : '?';
                                    const fin = h.fecha_fin ? new Date(h.fecha_fin).getFullYear() : 'Hoy';
                                    return `${h.grupo_nombre} (${inicio}-${fin})`;
                                  }).join(', ')}
                                </p>
                              )}
                              {c.indicadores.historial_otros_cargos && c.indicadores.historial_otros_cargos.length > 0 && (
                                <p className="text-[10px] text-muted-foreground leading-tight text-left">
                                  Otros cargos: {c.indicadores.historial_otros_cargos.map(h => {
                                    const inicio = h.fecha_inicio ? new Date(h.fecha_inicio).getFullYear() : '?';
                                    return `${h.cargo_nombre} en ${h.grupo_nombre} (${inicio})`;
                                  }).join(', ')}
                                </p>
                              )}
                              {c.indicadores.grupos_activos_detalle && c.indicadores.grupos_activos_detalle.length > 0 && (
                                <p className="text-[10px] text-muted-foreground leading-tight text-left">
                                  Participa en: {c.indicadores.grupos_activos_detalle.map(g => `${g.grupo} (${g.rol})`).join(', ')}
                                </p>
                              )}
                              
                              {/* Bloque de Resumen de Actividades */}
                              <div className="mt-2 w-full border-t border-primary/20 pt-2 text-left dark:border-primary/20">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-primary dark:text-primary">
                                  Actividades Realizadas:
                                </p>
                                {(!c.indicadores.resumen_servicios || c.indicadores.resumen_servicios.length === 0) ? (
                                  <p className="text-[10px] font-medium italic text-warning-foreground dark:text-warning-foreground">
                                    No se registran actividades previas.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                    {c.indicadores.resumen_servicios.map((s, idx) => (
                                      <span key={idx} className="text-[10px] text-muted-foreground">
                                        <span className="font-semibold text-foreground">{s.cantidad}</span> {s.tipo} ({s.rol})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <p className="mt-1 text-left text-[10px] leading-tight text-muted-foreground">
                                Fidelidad: {pct}% asistencia ({c.indicadores.asistencias_count} de {c.indicadores.confirmadas_count})
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-tight text-left">
                                Antigüedad: {c.indicadores.antiguedad_anios} años (Desde {new Date(c.indicadores.fecha_ingreso).getFullYear()})
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">
                      No se encontraron sugerencias con la configuración actual.
                    </p>
                  )}
                </div>
              );
            })}
          </div>}

          {/* Acciones */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {totalSelecciones === 0
                ? 'Ningún cargo seleccionado'
                : `${totalSelecciones} cargo${totalSelecciones !== 1 ? 's' : ''} seleccionado${totalSelecciones !== 1 ? 's' : ''}`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={showResumen ? () => setShowResumen(false) : handleClose}
                disabled={renovarMutation.isPending}
              >
                {showResumen ? 'Volver' : 'Cancelar'}
              </Button>
              <Button
                onClick={showResumen ? handleSubmit : () => setShowResumen(true)}
                disabled={totalSelecciones === 0 || renovarMutation.isPending}
              >
                {renovarMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Crown className="size-4" />
                )}
                {showResumen ? 'Ejecutar Renovación' : 'Confirmar Renovación'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
