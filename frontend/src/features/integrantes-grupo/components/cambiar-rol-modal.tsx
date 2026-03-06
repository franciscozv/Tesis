'use client';

import { BadgeCheck, Info, Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { useCambiarRol } from '../hooks/use-cambiar-rol';

interface CambiarRolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comunion: MiembroGrupo | null;
  rolesGrupo: RolGrupo[] | undefined;
}

export function CambiarRolModal({
  open,
  onOpenChange,
  comunion,
  rolesGrupo,
}: CambiarRolModalProps) {
  const [nuevoRolId, setNuevoRolId] = useState<string>('');
  const mutation = useCambiarRol();
  const { usuario } = useAuth();

  const esAdmin = usuario?.rol === 'administrador';
  const rolesDisponibles =
    rolesGrupo?.filter(
      (r) => r.activo && r.id_rol_grupo !== comunion?.rol.id && (esAdmin || !r.es_directiva),
    ) ?? [];

  const nombreMiembro = comunion?.miembro
    ? `${comunion.miembro.nombre} ${comunion.miembro.apellido}`
    : `Miembro #${comunion?.miembro_id}`;

  function handleSubmit() {
    if (!comunion || !nuevoRolId) return;

    mutation.mutate(
      { id: comunion.id, input: { rol_grupo_id: Number(nuevoRolId) } },
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar Rol</DialogTitle>
          <DialogDescription>Cambiar el rol de {nombreMiembro} en el grupo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {!esAdmin && (
            <Alert className="py-2 px-3 border-blue-300 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200">
              <Info className="size-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-sm font-semibold">Cargos de Directiva</AlertTitle>
              <AlertDescription className="text-xs">
                Los cargos de directiva están reservados para la administración general.
              </AlertDescription>
            </Alert>
          )}
          <div>
            <Label className="text-muted-foreground text-sm font-normal">Rol actual</Label>
            <div className="mt-1">
              <Badge variant="outline">{comunion?.rol.nombre}</Badge>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Nuevo rol *</Label>
            <Select value={nuevoRolId} onValueChange={setNuevoRolId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nuevo rol" />
              </SelectTrigger>
              <SelectContent>
                {rolesDisponibles.map((r) => (
                  <SelectItem key={r.id_rol_grupo} value={String(r.id_rol_grupo)}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{r.nombre}</span>
                      <div className="flex flex-wrap gap-1">
                        {r.es_directiva && (
                          <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                            <ShieldCheck className="size-2.5" />
                            Directiva
                          </Badge>
                        )}
                        {r.es_unico && (
                          <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none">
                            <UserCheck className="size-2.5" />
                            Único
                          </Badge>
                        )}
                        {r.requiere_plena_comunion && (
                          <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none">
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


