'use client';

import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Search,
  Settings2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { RolGrupo } from '@/features/catalogos/types';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useMisGrupos } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';
import type { SugerirCargoInput, SugerirCargoResponse } from '../types';
import { CandidatoCargoCard } from './candidato-cargo-card';

const PERIODOS = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
];

const CRITERIOS_INFO = [
  {
    key: 'experiencia',
    label: 'Experiencia en el cargo',
    description: 'Más veces en el cargo → mejor',
  },
  {
    key: 'carga_trabajo',
    label: 'Carga de trabajo',
    description: 'Menos grupos activos → mejor',
  },
  {
    key: 'fidelidad',
    label: 'Fidelidad (asistencia)',
    description: 'Mayor % de asistencia → mejor',
  },
  {
    key: 'antiguedad',
    label: 'Antigüedad',
    description: 'Más años en el grupo → mejor',
  },
] as const;

const CRITERIO_LABELS: Record<string, string> = {
  experiencia: 'Experiencia',
  carga_trabajo: 'Carga de trabajo',
  fidelidad: 'Fidelidad',
  antiguedad: 'Antigüedad',
};

const PRIORIDAD_DEFAULT = ['experiencia', 'carga_trabajo', 'fidelidad', 'antiguedad'];

interface SugerirCargoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rolesGrupo: RolGrupo[] | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: UseMutationResult genérico
  sugerirMutation: any;
}

export function SugerirCargoModal({
  open,
  onOpenChange,
  rolesGrupo,
  sugerirMutation,
}: SugerirCargoModalProps) {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  // Obtenemos ambos, pero usaremos uno según el rol
  const { data: todosLosGrupos } = useGrupos();
  const { data: misGrupos } = useMisGrupos();

  const gruposAMostrar = isAdmin
    ? todosLosGrupos
    : misGrupos?.map((g) => ({ id_grupo: g.id_grupo, nombre: g.nombre }));

  const [cargoId, setCargoId] = useState<string>('');
  const [periodoMeses, setPeriodoMeses] = useState<string>('12');
  const [grupoId, setGrupoId] = useState<string>('');
  const [respuesta, setRespuesta] = useState<SugerirCargoResponse | null>(null);

  // Auto-selección si solo hay un grupo disponible (común para directiva)
  useEffect(() => {
    if (open && gruposAMostrar?.length === 1 && !grupoId) {
      setGrupoId(String(gruposAMostrar[0].id_grupo));
    }
  }, [open, gruposAMostrar, grupoId]);

  // Opciones avanzadas
  const [showOpciones, setShowOpciones] = useState(false);
  const [soloConExperiencia, setSoloConExperiencia] = useState(false);
  const [prioridad, setPrioridad] = useState<string[]>(PRIORIDAD_DEFAULT);

  // Criterios usados en la última búsqueda (para el banner de metadata)
  const [usedCriterios, setUsedCriterios] = useState<string[]>([]);
  const [usedSoloExp, setUsedSoloExp] = useState(false);

  // El botón se habilita cuando hay cargo y grupo elegido
  const puedeHaceQuery = Boolean(cargoId) && Boolean(grupoId);

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

  function handleBuscar() {
    if (!puedeHaceQuery) return;

    const criteriosEfectivos = [...prioridad];
    const soloExpEfectivo = soloConExperiencia;

    const body: SugerirCargoInput = {
      cargo_id: Number(cargoId),
      periodo_meses: Number(periodoMeses),
      ...(grupoId ? { grupo_id: Number(grupoId) } : {}),
      solo_con_experiencia: soloExpEfectivo,
      criterios_prioridad: criteriosEfectivos,
    };

    sugerirMutation.mutate(body, {
      onSuccess: (data: SugerirCargoResponse) => {
        setRespuesta(data ?? null);
        setUsedCriterios(criteriosEfectivos);
        setUsedSoloExp(soloExpEfectivo);
      },
    });
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setCargoId('');
      setPeriodoMeses('12');
      setGrupoId('');
      setRespuesta(null);
      setShowOpciones(false);
      setSoloConExperiencia(false);
      setPrioridad(PRIORIDAD_DEFAULT);
      setUsedCriterios([]);
      setUsedSoloExp(false);
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir Candidatos para Cargo</DialogTitle>
          <DialogDescription>
            {isAdmin
              ? 'Candidatos del grupo ordenados por experiencia, carga actual, asistencia y antigüedad.'
              : 'Candidatos idóneos entre los miembros de tu grupo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {/* Fila principal: cargo + período + buscar */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block">Cargo</Label>
              <Select value={cargoId} onValueChange={setCargoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cargo" />
                </SelectTrigger>
                <SelectContent>
                  {rolesGrupo?.map((r) => (
                    <SelectItem key={r.id_rol_grupo} value={String(r.id_rol_grupo)}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{r.nombre}</span>
                        <div className="flex flex-wrap gap-1">
                          {r.es_directiva && (
                            <Badge
                              variant="secondary"
                              className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none"
                            >
                              <ShieldCheck className="size-2.5" />
                              Directiva
                            </Badge>
                          )}
                          {r.es_unico && (
                            <Badge
                              variant="secondary"
                              className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none"
                            >
                              <UserCheck className="size-2.5" />
                              Único
                            </Badge>
                          )}
                          {r.requiere_plena_comunion && (
                            <Badge
                              variant="secondary"
                              className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                            >
                              <BadgeCheck className="size-2.5" />
                              Plena Comunión
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <Label className="mb-1.5 block">Período</Label>
              <Select value={periodoMeses} onValueChange={setPeriodoMeses}>
                <SelectTrigger>
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

            <Button onClick={handleBuscar} disabled={!puedeHaceQuery || sugerirMutation.isPending}>
              {sugerirMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Buscar
            </Button>
          </div>

          {/* Selector de grupo (obligatorio para filtrar) */}
          <div>
            <Label className="mb-1.5 block">
              {isAdmin ? 'Grupo' : 'Grupo'} <span className="text-destructive">*</span>
            </Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger>
                <SelectValue placeholder={isAdmin ? 'Seleccionar grupo' : 'Seleccionar grupo'} />
              </SelectTrigger>
              <SelectContent>
                {gruposAMostrar?.map((g) => (
                  <SelectItem key={g.id_grupo} value={String(g.id_grupo)}>
                    {g.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opciones avanzadas (colapsable) */}
          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setShowOpciones((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="size-4" />
                Opciones avanzadas
              </span>
              {showOpciones ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showOpciones && (
              <div className="border-t px-4 py-4 grid gap-4">
                {/* Filtro: solo con experiencia */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="solo-experiencia"
                    checked={soloConExperiencia}
                    onCheckedChange={(v) => setSoloConExperiencia(Boolean(v))}
                  />
                  <Label
                    htmlFor="solo-experiencia"
                    className="cursor-pointer text-sm font-normal leading-none"
                  >
                    Solo con experiencia previa en este cargo
                  </Label>
                </div>

                <Separator />

                {/* Criterios de prioridad */}
                <div>
                  <p className="text-sm font-medium mb-1">Criterios de prioridad</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ordena de mayor a menor importancia. En caso de empate en el primero, se aplica
                    el siguiente.
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
                          <span className="text-xs font-mono text-muted-foreground w-4 shrink-0 text-center">
                            {index + 1}
                          </span>
                          <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none">{criterio.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {criterio.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => moverArriba(index)}
                              disabled={index === 0}
                              className="rounded p-0.5 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              aria-label="Subir criterio"
                            >
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moverAbajo(index)}
                              disabled={index === prioridad.length - 1}
                              className="rounded p-0.5 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                  >
                    Restablecer orden por defecto
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Banner de metadata */}
        {respuesta && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1.5">
            <p className="font-medium">
              Sugerencias para el grupo{' '}
              <span className="text-foreground">#{respuesta.metadata.grupo_id_usado}</span>
              {' · '}
              últimos {respuesta.metadata.periodo_meses_usado} mes
              {respuesta.metadata.periodo_meses_usado !== 1 ? 'es' : ''}
            </p>

            {respuesta.metadata.requiere_plena_comunion && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  Plena comunión requerida
                </Badge>
                Filtro aplicado automáticamente.
              </p>
            )}

            {usedSoloExp && (
              <p className="text-xs text-muted-foreground">
                Filtrado: solo candidatos con experiencia previa en el cargo.
              </p>
            )}

            {usedCriterios.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {'Orden de prioridad: '}
                {usedCriterios.map((c, i) => (
                  <span key={c}>
                    <span className="font-medium text-foreground">{CRITERIO_LABELS[c] ?? c}</span>
                    {i < usedCriterios.length - 1 && (
                      <span className="mx-0.5 text-muted-foreground/60">→</span>
                    )}
                  </span>
                ))}
              </p>
            )}
          </div>
        )}

        {/* Sin resultados */}
        {respuesta && respuesta.candidatos.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No se encontraron candidatos para este cargo en el grupo seleccionado.
          </p>
        )}

        {/* Lista de candidatos */}
        {respuesta && respuesta.candidatos.length > 0 && (
          <div className="grid gap-3">
            {respuesta.candidatos.map((c) => (
              <CandidatoCargoCard key={c.miembro_id} candidato={c} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
