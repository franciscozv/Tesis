'use client';

import { Loader2, Search } from 'lucide-react';
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
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { RolActividad } from '@/features/catalogos/types';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import type { Candidato, SugerirRolInput } from '../types';
import { CandidatosResults } from './candidatos-results';

const PERIODOS = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
];

interface SugerirCandidatoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFecha?: string;
  rolesActividad: RolActividad[] | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: mutation type varies
  sugerirMutation: any;
  onInvitar: (candidato: Candidato, rolId: number) => void;
}

export function SugerirCandidatoModal({
  open,
  onOpenChange,
  defaultFecha,
  rolesActividad,
  sugerirMutation,
  onInvitar,
}: SugerirCandidatoModalProps) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'administrador';
  // El encargado tiene cuerpo_id en su token; el backend lo aplica automáticamente
  const esEncargado = !esAdmin && usuario?.cuerpo_id !== undefined;

  // Solo se carga cuando el admin abre el modal (lazy por React Query)
  const { data: grupos } = useGrupos();

  const [rolId, setRolId] = useState<string>('');
  const [fecha, setFecha] = useState(defaultFecha ?? '');
  const [periodoMeses, setPeriodoMeses] = useState<string>('12');
  const [filtroPlenaComun, setFiltroPlenaComun] = useState(false);
  const [cuerpoId, setCuerpoId] = useState<string>('');
  const [resultados, setResultados] = useState<Candidato[] | null>(null);

  function handleBuscar() {
    if (!rolId || !fecha) return;

    const body: SugerirRolInput = {
      rol_id: Number(rolId),
      fecha,
      periodo_meses: Number(periodoMeses),
      ...(filtroPlenaComun && { filtro_plena_comunion: true }),
      // El admin puede filtrar por grupo; el encargado no envía nada (lo gestiona el backend)
      ...(esAdmin && cuerpoId ? { cuerpo_id: Number(cuerpoId) } : {}),
    };

    sugerirMutation.mutate(body, {
      onSuccess: (data: Candidato[]) => setResultados(data ?? []),
    });
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setRolId('');
      setFecha(defaultFecha ?? '');
      setPeriodoMeses('12');
      setFiltroPlenaComun(false);
      setCuerpoId('');
      setResultados(null);
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir Candidatos</DialogTitle>
          <DialogDescription>
            Candidatos ordenados por disponibilidad, experiencia, asistencia y antigüedad.
          </DialogDescription>
        </DialogHeader>

        {/* Fila principal: rol + fecha + buscar */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="mb-1.5 block">Rol de Actividad</Label>
            <Select value={rolId} onValueChange={setRolId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {rolesActividad?.map((r) => (
                  <SelectItem key={r.id_rol} value={String(r.id_rol)}>
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

        {/* Fila de filtros adicionales */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-3">
          {/* Periodo de asistencia */}
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

          {/* Filtro plena comunión */}
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

          {/* Selector de grupo — solo visible para ADMIN */}
          {esAdmin && (
            <div className="flex items-center gap-2">
              <Label className="shrink-0 text-sm">Grupo:</Label>
              <Select value={cuerpoId} onValueChange={setCuerpoId}>
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

          {/* Encargado: confirmar visualmente que el filtro está activo */}
          {esEncargado && (
            <p className="text-xs text-muted-foreground">Mostrando candidatos de tu grupo</p>
          )}
        </div>

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
