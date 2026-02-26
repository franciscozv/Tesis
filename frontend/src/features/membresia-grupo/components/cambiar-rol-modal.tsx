'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import type { RolGrupo } from '@/features/catalogos/types';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { useCambiarRol } from '../hooks/use-cambiar-rol';

interface CambiarRolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membresia: MiembroGrupo | null;
  rolesGrupo: RolGrupo[] | undefined;
}

export function CambiarRolModal({
  open,
  onOpenChange,
  membresia,
  rolesGrupo,
}: CambiarRolModalProps) {
  const [nuevoRolId, setNuevoRolId] = useState<string>('');
  const mutation = useCambiarRol();

  const rolesDisponibles =
    rolesGrupo?.filter((r) => r.activo && r.id_rol_grupo !== membresia?.rol.id) ?? [];

  const nombreMiembro = membresia?.miembro
    ? `${membresia.miembro.nombre} ${membresia.miembro.apellido}`
    : `Miembro #${membresia?.miembro_id}`;

  function handleSubmit() {
    if (!membresia || !nuevoRolId) return;

    mutation.mutate(
      { id: membresia.id, input: { rol_grupo_id: Number(nuevoRolId) } },
      {
        onSuccess: () => {
          toast.success('Rol cambiado exitosamente');
          onOpenChange(false);
          setNuevoRolId('');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al cambiar el rol');
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setNuevoRolId('');
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Rol</DialogTitle>
          <DialogDescription>Cambiar el rol de {nombreMiembro} en el grupo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label className="text-muted-foreground text-sm">Rol actual</Label>
            <div className="mt-1">
              <Badge variant="secondary">{membresia?.rol.nombre}</Badge>
            </div>
          </div>
          <div>
            <Label>Nuevo rol *</Label>
            <Select value={nuevoRolId} onValueChange={setNuevoRolId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar nuevo rol" />
              </SelectTrigger>
              <SelectContent>
                {rolesDisponibles.map((r) => (
                  <SelectItem key={r.id_rol_grupo} value={String(r.id_rol_grupo)}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending || !nuevoRolId}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
