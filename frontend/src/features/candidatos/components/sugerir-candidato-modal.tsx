'use client';

import { Loader2, Search } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RolActividad } from '@/features/catalogos/types';
import type { Candidato } from '../types';
import { CandidatosResults } from './candidatos-results';

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
  const [rolId, setRolId] = useState<string>('');
  const [fecha, setFecha] = useState(defaultFecha ?? '');
  const [resultados, setResultados] = useState<Candidato[] | null>(null);
  const rolLabelId = useId();
  const fechaLabelId = useId();

  function handleBuscar() {
    if (!rolId || !fecha) return;
    sugerirMutation.mutate(
      { rol_id: Number(rolId), fecha },
      {
        onSuccess: (data: Candidato[]) => setResultados(data),
      },
    );
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setRolId('');
      setFecha(defaultFecha ?? '');
      setResultados(null);
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir Candidatos</DialogTitle>
          <DialogDescription>
            Seleccione un rol y fecha para obtener candidatos sugeridos automáticamente según su
            scoring.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor={rolLabelId} className="mb-1.5 block text-sm font-medium">
              Rol de Actividad
            </label>
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
            <label htmlFor={fechaLabelId} className="mb-1.5 block text-sm font-medium">
              Fecha
            </label>
            <Input
              id={fechaLabelId}
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <Button onClick={handleBuscar} disabled={!rolId || !fecha || sugerirMutation.isPending}>
            {sugerirMutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar
          </Button>
        </div>

        {resultados && (
          <div className="mt-2">
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
