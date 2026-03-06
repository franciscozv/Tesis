'use client';

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Search,
  Settings2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { ResponsabilidadActividad } from '@/features/catalogos/types';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import type { Candidato, SugerirRolInput } from '../types';
import { CandidatosResults } from './candidatos-results';

const PERIODOS = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
];

const CRITERIOS_INFO = [
  {
    key: 'disponibilidad',
    label: 'Disponibilidad',
    description: 'Libre en la fecha → primero',
  },
  {
    key: 'experiencia_tipo',
    label: 'Experiencia en este tipo',
    description: 'Más veces en este tipo de actividad → mejor',
  },
  {
    key: 'rotacion',
    label: 'Rotación',
    description: 'Más días sin realizar el rol → primero',
  },
  {
    key: 'carga',
    label: 'Carga semanal',
    description: 'Menos servicios esta semana → mejor',
  },
  {
    key: 'fidelidad',
    label: 'Fidelidad (asistencia)',
    description: 'Mayor % de asistencia → mejor',
  },
] as const;

const CRITERIO_LABELS: Record<string, string> = {
  disponibilidad: 'Disponibilidad',
  experiencia_tipo: 'Exp. tipo',
  rotacion: 'Rotación',
  carga: 'Carga',
  fidelidad: 'Fidelidad',
};

const PRIORIDAD_DEFAULT = ['disponibilidad', 'experiencia_tipo', 'rotacion', 'carga', 'fidelidad'];

interface SugerirCandidatoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFecha?: string;
  /** ID de la actividad actual. Se envía al backend para filtrar candidatos por grupo. */
  actividadId?: number;
  /** Si es false (directiva), el selector de grupo se oculta: el backend lo infiere de actividadId. */
  isAdmin?: boolean;
  responsabilidadesActividad: ResponsabilidadActividad[] | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: mutation type varies
  sugerirMutation: any;
  onInvitar: (candidato: Candidato, rolId: number) => void;
}

export function SugerirCandidatoModal({
  open,
  onOpenChange,
  defaultFecha,
  actividadId,
  isAdmin = false,
  responsabilidadesActividad,
  sugerirMutation,
  onInvitar,
}: SugerirCandidatoModalProps) {
  const { data: grupos } = useGrupos();

  // Campos principales
  const [rolId, setRolId] = useState<string>('');
  const [fecha, setFecha] = useState(defaultFecha ?? '');
  const [periodoMeses, setPeriodoMeses] = useState<string>('12');
  const [filtroPlenaComun, setFiltroPlenaComun] = useState(false);
  const [grupoId, setGrupoId] = useState<string>('');
  const [resultados, setResultados] = useState<Candidato[] | null>(null);

  // Opciones avanzadas
  const [showOpciones, setShowOpciones] = useState(false);
  const [soloConExperiencia, setSoloConExperiencia] = useState(false);
  const [soloSinExperiencia, setSoloSinExperiencia] = useState(false);
  const [excluirConflictos, setExcluirConflictos] = useState(true);
  const [prioridad, setPrioridad] = useState<string[]>(PRIORIDAD_DEFAULT);

  // Estado de la última búsqueda (para el banner informativo)
  const [usedPrioridad, setUsedPrioridad] = useState<string[]>([]);
  const [usedSoloExp, setUsedSoloExp] = useState(false);
  const [usedSoloSinExp, setUsedSoloSinExp] = useState(false);
  const [usedPeriodo, setUsedPeriodo] = useState<string>('12');
  const [usedExcluirConflictos, setUsedExcluirConflictos] = useState(true);

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

  function handleSoloConExperiencia(checked: boolean) {
    setSoloConExperiencia(checked);
    if (checked) setSoloSinExperiencia(false);
  }

  function handleSoloSinExperiencia(checked: boolean) {
    setSoloSinExperiencia(checked);
    if (checked) setSoloConExperiencia(false);
  }

  function handleBuscar() {
    if (!rolId || !fecha) return;

    const criteriosEfectivos = [...prioridad];
    const soloExpEfectivo = soloConExperiencia;
    const soloSinExpEfectivo = soloSinExperiencia;
    const periodoEfectivo = periodoMeses;
    const excluirConflictosEfectivo = excluirConflictos;

    const body: SugerirRolInput = {
      responsabilidad_id: Number(rolId),
      fecha,
      ...(actividadId !== undefined && { actividad_id: actividadId }),
      periodo_meses: Number(periodoMeses),
      ...(filtroPlenaComun && { filtro_plena_comunion: true }),
      ...(grupoId ? { grupo_id: Number(grupoId) } : {}),
      solo_con_experiencia: soloExpEfectivo,
      solo_sin_experiencia: soloSinExpEfectivo,
      prioridad: criteriosEfectivos,
      incluir_con_conflictos: !excluirConflictosEfectivo,
    };

    sugerirMutation.mutate(body, {
      onSuccess: (data: Candidato[]) => {
        setResultados(data ?? []);
        setUsedPrioridad(criteriosEfectivos);
        setUsedSoloExp(soloExpEfectivo);
        setUsedSoloSinExp(soloSinExpEfectivo);
        setUsedPeriodo(periodoEfectivo);
        setUsedExcluirConflictos(excluirConflictosEfectivo);
      },
    });
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setRolId('');
      setFecha(defaultFecha ?? '');
      setPeriodoMeses('12');
      setFiltroPlenaComun(false);
      setGrupoId('');
      setResultados(null);
      setShowOpciones(false);
      setSoloConExperiencia(false);
      setSoloSinExperiencia(false);
      setExcluirConflictos(true);
      setPrioridad(PRIORIDAD_DEFAULT);
      setUsedPrioridad([]);
      setUsedSoloExp(false);
      setUsedSoloSinExp(false);
      setUsedPeriodo('12');
      setUsedExcluirConflictos(true);
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir Candidatos</DialogTitle>
          <DialogDescription>
            Candidatos ordenados por disponibilidad, experiencia, rotación y carga semanal.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Fila principal: rol + fecha + buscar */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block">Rol de Actividad</Label>
              <Select value={rolId} onValueChange={setRolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {responsabilidadesActividad?.map((r) => (
                    <SelectItem key={r.id_responsabilidad} value={String(r.id_responsabilidad)}>
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Label className="mb-1.5 block">Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>

            <Button onClick={handleBuscar} disabled={!rolId || !fecha || sugerirMutation.isPending}>
              {sugerirMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Buscar
            </Button>
          </div>

          {/* Fila de filtros básicos */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-3">
            <div className="flex items-center gap-2">
              <Label className="shrink-0 text-sm">Periodo:</Label>
              <Select value={periodoMeses} onValueChange={setPeriodoMeses}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="filtro-plena-comunion"
                checked={filtroPlenaComun}
                onCheckedChange={(checked) => setFiltroPlenaComun(checked === true)}
              />
              <Label htmlFor="filtro-plena-comunion" className="cursor-pointer text-sm">
                Solo plena comunión
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="excluir-conflictos"
                checked={excluirConflictos}
                onCheckedChange={(checked) => setExcluirConflictos(checked === true)}
              />
              <Label htmlFor="excluir-conflictos" className="cursor-pointer text-sm">
                Excluir con conflictos
              </Label>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <Label className="shrink-0 text-sm">Grupo:</Label>
                <Select value={grupoId} onValueChange={setGrupoId}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Todos los grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos?.map((g) => (
                      <SelectItem key={g.id_grupo} value={String(g.id_grupo)}>
                        {g.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Opciones avanzadas (colapsable) */}
          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setShowOpciones((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="size-4" />
                Opciones avanzadas
              </span>
              {showOpciones ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showOpciones && (
              <div className="grid gap-4 border-t px-4 py-4">
                {/* Filtros de perfil */}
                <div>
                  <p className="mb-2 text-sm font-medium">Filtro de perfil</p>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="solo-expertos"
                        checked={soloConExperiencia}
                        onCheckedChange={(v) => handleSoloConExperiencia(Boolean(v))}
                      />
                      <Label
                        htmlFor="solo-expertos"
                        className="cursor-pointer text-sm font-normal leading-none"
                      >
                        Solo expertos — excluir candidatos sin experiencia previa en el rol
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="solo-nuevos"
                        checked={soloSinExperiencia}
                        onCheckedChange={(v) => handleSoloSinExperiencia(Boolean(v))}
                      />
                      <Label
                        htmlFor="solo-nuevos"
                        className="cursor-pointer text-sm font-normal leading-none"
                      >
                        Nuevos talentos / Rotación — excluir candidatos con experiencia previa
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Criterios de prioridad */}
                <div>
                  <p className="mb-1 text-sm font-medium">Criterios de prioridad</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Ordena de mayor a menor importancia. En empate del primero se aplica el
                    siguiente.
                  </p>
                  <div className="grid gap-1.5">
                    {prioridad.map((key, index) => {
                      const criterio = CRITERIOS_INFO.find((c) => c.key === key);
                      if (!criterio) return null;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
                        >
                          <span className="w-4 shrink-0 text-center font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </span>
                          <GripVertical className="size-4 shrink-0 text-muted-foreground/40" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-none">{criterio.label}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {criterio.description}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moverArriba(index)}
                              disabled={index === 0}
                              className="rounded p-0.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Subir criterio"
                            >
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moverAbajo(index)}
                              disabled={index === prioridad.length - 1}
                              className="rounded p-0.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Bajar criterio"
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrioridad(PRIORIDAD_DEFAULT)}
                    className="mt-2 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                  >
                    Restablecer orden por defecto
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Banner informativo de la última búsqueda */}
        {resultados !== null && (
          <div className="space-y-1.5 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium">
              {resultados.length} candidato{resultados.length !== 1 ? 's' : ''} encontrado
              {resultados.length !== 1 ? 's' : ''}
              {' · '}últimos {usedPeriodo} mes{Number(usedPeriodo) !== 1 ? 'es' : ''}
            </p>
            {usedSoloExp && (
              <p className="text-xs text-muted-foreground">
                Filtrado: solo candidatos con experiencia previa en el rol.
              </p>
            )}
            {usedSoloSinExp && (
              <p className="text-xs text-muted-foreground">
                Filtrado: solo nuevos talentos / rotación (sin experiencia previa).
              </p>
            )}
            {!usedExcluirConflictos && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Candidatos con conflicto de horario incluidos — aparecen resaltados en rojo.
              </p>
            )}
            {usedPrioridad.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {'Orden de prioridad: '}
                {usedPrioridad.map((c, i) => (
                  <span key={c}>
                    <span className="font-medium text-foreground">
                      {CRITERIO_LABELS[c] ?? c}
                    </span>
                    {i < usedPrioridad.length - 1 && (
                      <span className="mx-0.5 text-muted-foreground/60">→</span>
                    )}
                  </span>
                ))}
              </p>
            )}
          </div>
        )}

        {/* Resultados */}
        {resultados !== null && (
          <div className="mt-1">
            <CandidatosResults
              candidatos={resultados}
              onInvitar={(c) => onInvitar(c, Number(rolId))}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

