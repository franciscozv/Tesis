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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RolGrupo } from '@/features/catalogos/types';
import type { Candidato } from '../types';
import { CandidatosResults } from './candidatos-results';

interface SugerirCargoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rolesGrupo: RolGrupo[] | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: mutation type varies
  sugerirMutation: any;
}

export function SugerirCargoModal({
  open,
  onOpenChange,
  rolesGrupo,
  sugerirMutation,
}: SugerirCargoModalProps) {
  const [cargoId, setCargoId] = useState<string>('');
  const [resultados, setResultados] = useState<Candidato[] | null>(null);
  const cargoLabelId = useId();

  function handleBuscar() {
    if (!cargoId) return;
    sugerirMutation.mutate(
      { cargo_id: Number(cargoId) },
      {
        onSuccess: (data: Candidato[]) => setResultados(data),
      },
    );
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setCargoId('');
      setResultados(null);
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sugerir Candidatos para Cargo</DialogTitle>
          <DialogDescription>
            Seleccione un cargo para obtener candidatos sugeridos automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor={cargoLabelId} className="mb-1.5 block text-sm font-medium">
              Cargo
            </label>
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
          <Button onClick={handleBuscar} disabled={!cargoId || sugerirMutation.isPending}>
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
            <CandidatosResults candidatos={resultados} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
