'use client';

import { Info, Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { RolGrupo } from '@/features/catalogos/types';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import type { SugerirCargoInput, SugerirCargoResponse } from '../types';
import { CandidatoCargoCard } from './candidato-cargo-card';

const PERIODOS = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
];

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
  const esAdmin = usuario?.rol === 'administrador';
  // Encargado: tiene cuerpo_id en JWT; el backend lo aplica automáticamente
  const esEncargado = !esAdmin && usuario?.cuerpo_id !== undefined;

  // Lazy: React Query obtiene los grupos solo cuando el componente está montado
  const { data: grupos } = useGrupos();

  const [cargoId, setCargoId] = useState<string>('');
  const [periodoMeses, setPeriodoMeses] = useState<string>('12');
  const [cuerpoId, setCuerpoId] = useState<string>('');
  const [respuesta, setRespuesta] = useState<SugerirCargoResponse | null>(null);

  // El botón se habilita cuando hay cargo y (encargado, o admin con cuerpo elegido)
  const puedeHaceQuery = Boolean(cargoId) && (!esAdmin || Boolean(cuerpoId));

  function handleBuscar() {
    if (!puedeHaceQuery) return;

    const body: SugerirCargoInput = {
      cargo_id: Number(cargoId),
      periodo_meses: Number(periodoMeses),
      ...(esAdmin && cuerpoId ? { cuerpo_id: Number(cuerpoId) } : {}),
    };

    sugerirMutation.mutate(body, {
      onSuccess: (data: SugerirCargoResponse) => setRespuesta(data ?? null),
    });
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setCargoId('');
      setPeriodoMeses('12');
      setCuerpoId('');
      setRespuesta(null);
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir Candidatos para Cargo</DialogTitle>
          <DialogDescription>
            Candidatos del cuerpo ordenados por experiencia, carga actual, asistencia y antigüedad.
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
                      {r.nombre}
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

          {/* Admin: selector de cuerpo obligatorio */}
          {esAdmin && (
            <div>
              <Label className="mb-1.5 block">
                Cuerpo <span className="text-destructive">*</span>
              </Label>
              <Select value={cuerpoId} onValueChange={setCuerpoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuerpo" />
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

          {/* Encargado: aviso informativo */}
          {esEncargado && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Info className="size-3.5 shrink-0" />
              Mostrando candidatos de tu grupo (aplicado automáticamente).
            </p>
          )}
        </div>

        {/* Banner de metadata */}
        {respuesta && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium">
              Sugerencias para el cuerpo{' '}
              <span className="text-foreground">#{respuesta.metadata.cuerpo_id_usado}</span>
              {' · '}
              últimos {respuesta.metadata.periodo_meses_usado} mes
              {respuesta.metadata.periodo_meses_usado !== 1 ? 'es' : ''}
            </p>
            {respuesta.metadata.requiere_plena_comunion && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  Plena comunión requerida
                </Badge>
                Filtro aplicado automáticamente.
              </p>
            )}
          </div>
        )}

        {/* Sin resultados */}
        {respuesta && respuesta.candidatos.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No se encontraron candidatos para este cargo en el cuerpo seleccionado.
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
