'use client';

import {
  BadgeCheck,
  Check,
  ChevronsUpDown,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import * as React from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { RolGrupo } from '@/features/catalogos/types';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { cn } from '@/lib/utils';
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [nuevoRolId, setNuevoRolId] = React.useState<number>(0);
  
  const mutation = useCambiarRol();
  const { usuario } = useAuth();

  const esAdmin = usuario?.rol === 'administrador';
  
  // FILTRO: Solo roles activos que NO sean de directiva y que no sea el rol actual
  const rolesDisponibles =
    rolesGrupo?.filter(
      (r) => r.activo && r.id_rol_grupo !== comunion?.rol.id && !r.es_directiva,
    ) ?? [];

  const rolesFiltrados = rolesDisponibles.filter((r) =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedRol = rolesDisponibles.find((r) => r.id_rol_grupo === nuevoRolId);

  const nombreMiembro = comunion?.miembro
    ? `${comunion.miembro.nombre} ${comunion.miembro.apellido}`
    : `Miembro #${comunion?.miembro_id}`;

  function handleSubmit() {
    if (!comunion || !nuevoRolId) return;

    mutation.mutate(
      { id: comunion.id, input: { rol_grupo_id: nuevoRolId } },
      {
        onSuccess: () => {
          toast.success('Rol cambiado exitosamente');
          onOpenChange(false);
          setNuevoRolId(0);
          setSearchTerm('');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al cambiar el rol');
        },
      },
    );
  }

  // Limpiar estados al cerrar
  React.useEffect(() => {
    if (!open) {
      setNuevoRolId(0);
      setSearchTerm('');
      setOpenCombobox(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Rol</DialogTitle>
          <DialogDescription>
            Seleccione un nuevo rol operativo para {nombreMiembro}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex items-center gap-4 rounded-lg border p-3 bg-muted/30">
            <div className="flex-1">
              <Label className="text-muted-foreground text-xs font-normal uppercase tracking-wider">
                Rol actual
              </Label>
              <div className="mt-0.5 font-medium">{comunion?.rol.nombre}</div>
            </div>
            <Info className="size-4 text-muted-foreground opacity-50" />
          </div>

          <div className="grid gap-2">
            <Label>Nuevo rol operativo *</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between font-normal"
                >
                  {nuevoRolId ? selectedRol?.nombre : 'Seleccionar nuevo rol...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Buscar rol..."
                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                  {rolesFiltrados.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No se encontraron roles disponibles.
                    </div>
                  ) : (
                    rolesFiltrados.map((r) => (
                      <div
                        key={r.id_rol_grupo}
                        className={cn(
                          'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                          nuevoRolId === r.id_rol_grupo && 'bg-accent text-accent-foreground',
                        )}
                        onClick={() => {
                          setNuevoRolId(r.id_rol_grupo);
                          setOpenCombobox(false);
                          setSearchTerm('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            nuevoRolId === r.id_rol_grupo ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{r.nombre}</span>
                          <div className="flex flex-wrap gap-1">
                            {r.es_unico && (
                              <Badge
                                variant="secondary"
                                className="px-1 py-0 text-[10px] h-3.5 flex items-center gap-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none"
                              >
                                <UserCheck className="size-2.5" />
                                Único
                              </Badge>
                            )}
                            {r.requiere_plena_comunion && (
                              <Badge
                                variant="secondary"
                                className="px-1 py-0 text-[10px] h-3.5 flex items-center gap-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                              >
                                <BadgeCheck className="size-2.5" />
                                Plena Comunión
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending || !nuevoRolId}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
