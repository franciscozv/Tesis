'use client';

import {
  Award,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Crown,
  GripVertical,
  Loader2,
  Settings2,
  TrendingUp,
  Users,
  UserX,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useSugerirCandidatosCargo } from '@/features/candidatos/hooks/use-sugerir-candidatos-cargo';
import type { RolGrupo } from '@/features/catalogos/types';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { useCambiarRol } from '../hooks/use-cambiar-rol';

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

interface NombramientoModalProps {
  grupoId: number;
  cargo: RolGrupo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Integrantes con rol no-directiva — universo de candidatos elegibles */
  integrantesNomina: MiembroGrupo[];
}

export function NombramientoModal({
  grupoId: grupoIdProp,
  cargo,
  open,
  onOpenChange,
  integrantesNomina,
}: NombramientoModalProps) {
  const sugerirMutation = useSugerirCandidatosCargo();
  const cambiarRolMutation = useCambiarRol();
  const { data: todosLosGrupos } = useGrupos();

  // --- Configuración del Algoritmo ---
  const [periodoMeses, setPeriodoMeses] = useState<string>('12');
  const [prioridad, setPrioridad] = useState<string[]>(PRIORIDAD_DEFAULT);
  const [soloConExperiencia, setSoloConExperiencia] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [grupoId, setGrupoId] = useState<string>(String(grupoIdProp));

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

  // Lanzar la consulta automáticamente al abrir o cambiar config
  const { mutate: buscarCandidatos } = sugerirMutation;
  useEffect(() => {
    if (open && cargo) {
      buscarCandidatos({
        cargo_id: cargo.id_rol_grupo,
        grupo_id: grupoId === 'all' ? undefined : Number(grupoId),
        periodo_meses: Number(periodoMeses),
        solo_con_experiencia: soloConExperiencia,
        criterios_prioridad: prioridad,
      });
    }
  }, [
    open,
    cargo?.id_rol_grupo,
    grupoId,
    buscarCandidatos,
    periodoMeses,
    soloConExperiencia,
    prioridad.join(','),
  ]);

  function handleNombrar(miembroId: number) {
    if (!cargo) return;
    const integrante = integrantesNomina.find((mg) => mg.miembro_id === miembroId);
    
    // Si no está en la nómina, es un candidato externo (búsqueda global)
    if (!integrante) {
      // Aquí se podría implementar la lógica para agregar al grupo y nombrar
      // Por ahora, notificamos que se requiere integración previa o ajustamos la mutación
      toast.info('Para nombrar a un miembro externo, primero debe ser agregado al grupo.');
      return;
    }

    cambiarRolMutation.mutate(
      { id: integrante.id, input: { rol_grupo_id: cargo.id_rol_grupo } },
      {
        onSuccess: () => {
          toast.success('Nombramiento realizado exitosamente');
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al realizar el nombramiento');
        },
      },
    );
  }

  function handleClose() {
    sugerirMutation.reset();
    setShowConfig(false);
    setGrupoId(String(grupoIdProp));
    onOpenChange(false);
  }

  const nominaIds = new Set(integrantesNomina.map((mg) => mg.miembro_id));
  
  // Si la búsqueda es global ('all'), mostramos todos los resultados del backend.
  // Si la búsqueda es por grupo, filtramos para asegurar que estén en la nómina (por seguridad UI).
  const candidatos = grupoId === 'all' 
    ? (sugerirMutation.data?.candidatos ?? [])
    : (sugerirMutation.data?.candidatos ?? []).filter((c) => nominaIds.has(c.miembro_id));

  const metadata = sugerirMutation.data?.metadata;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Crown className="size-4 text-primary" />
              Realizar Nombramiento
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className={
                showConfig
                  ? 'h-8 bg-primary/5 border-primary/40 text-primary'
                  : 'h-8 text-muted-foreground'
              }
            >
              <Settings2 className="mr-2 size-3.5" />
              <span className="text-xs">Configurar Algoritmo</span>
            </Button>
          </div>
          <DialogDescription asChild>
            <div className="space-y-0.5">
              {cargo && (
                <span>
                  Cargo: <span className="font-semibold text-foreground">{cargo.nombre}</span>
                  {cargo.requiere_plena_comunion && (
                    <span className="ml-2 text-xs text-warning-foreground dark:text-warning-foreground">
                      · requiere plena comunión
                    </span>
                  )}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Panel de Configuración del Algoritmo */}
          {showConfig && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Alcance de Búsqueda
                    </Label>
                    <Select value={grupoId} onValueChange={setGrupoId}>
                      <SelectTrigger className="h-8 bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Todos los grupos (Global)</SelectItem>
                        <SelectItem value={String(grupoIdProp)} className="text-xs">Este grupo</SelectItem>
                        <Separator className="my-1" />
                        {todosLosGrupos?.filter(g => g.id_grupo !== grupoIdProp).map((g) => (
                          <SelectItem key={g.id_grupo} value={String(g.id_grupo)} className="text-xs">
                            Grupo: {g.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Análisis de Asistencia
                    </Label>
                    <Select value={periodoMeses} onValueChange={setPeriodoMeses}>
                      <SelectTrigger className="h-8 bg-background text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODOS.map((p) => (
                          <SelectItem key={p.value} value={p.value} className="text-xs">
                            Últimos {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-2">
                    <Checkbox
                      id="solo-exp-indiv"
                      checked={soloConExperiencia}
                      onCheckedChange={(v) => setSoloConExperiencia(Boolean(v))}
                    />
                    <Label
                      htmlFor="solo-exp-indiv"
                      className="cursor-pointer text-[11px] font-medium leading-none"
                    >
                      Priorizar experiencia previa
                    </Label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Prioridades
                  </Label>
                  <div className="grid gap-1">
                    {prioridad.map((key, index) => {
                      const crit = CRITERIOS_INFO.find((c) => c.key === key);
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1"
                        >
                          <GripVertical className="size-3 text-muted-foreground/30" />
                          <p className="flex-1 truncate text-[10px] font-semibold">{crit?.label}</p>
                          <div className="flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => moverArriba(index)}
                              disabled={index === 0}
                              className="rounded p-0.5 hover:bg-muted disabled:opacity-20"
                            >
                              <ChevronUp className="size-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moverAbajo(index)}
                              disabled={index === prioridad.length - 1}
                              className="rounded p-0.5 hover:bg-muted disabled:opacity-20"
                            >
                              <ChevronDown className="size-2.5" />
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

          <Alert className="border-primary/40 bg-primary/5 py-2.5 dark:bg-primary/10">
            <BadgeCheck className="size-4 text-primary dark:text-primary" />
            <AlertDescription className="text-xs text-primary dark:text-primary">
              Se muestran solo los miembros de la nómina del grupo, ordenados por idoneidad según el
              algoritmo de candidatos.
            </AlertDescription>
          </Alert>

          {/* Cargando */}
          {sugerirMutation.isPending && (
            <div className="grid gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          )}

          {/* Sin nómina */}
          {!sugerirMutation.isPending && integrantesNomina.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No hay integrantes en la nómina del grupo para nominar.
              </p>
            </div>
          )}

          {/* Sin candidatos elegibles */}
          {!sugerirMutation.isPending &&
            sugerirMutation.isSuccess &&
            candidatos.length === 0 &&
            integrantesNomina.length > 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <UserX className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Ningún miembro de la nómina cumple los requisitos para este cargo.
                </p>
                {cargo?.requiere_plena_comunion && (
                  <p className="text-xs text-muted-foreground">
                    Este cargo requiere{' '}
                    <span className="font-medium text-warning-foreground dark:text-warning-foreground">
                      Plena Comunión
                    </span>
                    .
                  </p>
                )}
              </div>
            )}

          {/* Tabla de candidatos */}
          {candidatos.length > 0 && (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {metadata && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''} · últimos{' '}
                      {metadata.periodo_meses_usado} meses
                    </span>
                    {metadata.requiere_plena_comunion && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px] border-none">
                        Plena Comunión
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  * Ordenados por {prioridad.map((p) => CRITERIOS_INFO.find(c => c.key === p)?.label).slice(0, 1)}
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">Candidato</th>
                      <th className="hidden px-4 py-2.5 text-center font-medium text-muted-foreground sm:table-cell">
                        <span className="flex items-center justify-center gap-1">
                          <Award className="size-3.5 text-muted-foreground" />
                          Exp.
                        </span>
                      </th>
                      <th className="hidden px-4 py-2.5 text-center font-medium text-muted-foreground sm:table-cell">
                        <span className="flex items-center justify-center gap-1">
                          <TrendingUp className="size-3.5 text-success-foreground" />
                          Asist.
                        </span>
                      </th>
                      <th className="hidden px-4 py-2.5 text-center font-medium text-muted-foreground md:table-cell">
                        <span className="flex items-center justify-center gap-1">
                          <CalendarDays className="size-3.5 text-accent-foreground" />
                          Antigüedad
                        </span>
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidatos.map((c, idx) => {
                      const pct = Math.round(c.indicadores.asistencia_ratio_periodo * 100);
                      return (
                        <tr
                          key={c.miembro_id}
                          className={
                            idx !== candidatos.length - 1
                              ? 'border-b transition-colors hover:bg-muted/30'
                              : 'transition-colors hover:bg-muted/30'
                          }
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            #{c.posicion}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium leading-none">{c.nombre_completo}</p>
                            {c.indicadores.plena_comunion && (
                              <Badge
                                variant="secondary"
                                className="mt-1.5 h-4 border-none bg-success px-1 text-[10px] text-success-foreground dark:bg-success dark:text-success-foreground"
                              >
                                <BadgeCheck className="mr-0.5 size-2.5" />
                                Plena Comunión
                              </Badge>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 text-center sm:table-cell">
                            <span className="font-medium">
                              {c.indicadores.experiencia_cargo_en_grupo}×
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-center sm:table-cell">
                            <span className="font-medium">{pct}%</span>
                          </td>
                          <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">
                            {c.indicadores.antiguedad_anios} año
                            {c.indicadores.antiguedad_anios !== 1 ? 's' : ''}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleNombrar(c.miembro_id)}
                              disabled={cambiarRolMutation.isPending}
                            >
                              {cambiarRolMutation.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Crown className="size-3.5" />
                              )}
                              Nombrar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose} disabled={cambiarRolMutation.isPending}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
