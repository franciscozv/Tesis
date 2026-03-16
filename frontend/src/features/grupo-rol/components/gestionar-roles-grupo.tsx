'use client';

import { Check, Loader2, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { rolesGrupoHooks } from '@/features/catalogos/hooks';
import {
  useDeshabilitarRol,
  useHabilitarRol,
  useRolesHabilitadosEnGrupo,
} from '../hooks/use-grupo-rol';

interface GestionarRolesGrupoProps {
  grupoId: number;
}

export function GestionarRolesGrupo({ grupoId }: GestionarRolesGrupoProps) {
  const [rolSeleccionado, setRolSeleccionado] = React.useState<string>('');

  const { data: rolesHabilitados, isLoading: loadingHabilitados } =
    useRolesHabilitadosEnGrupo(grupoId);
  const { data: todosRoles, isLoading: loadingTodos } = rolesGrupoHooks.useAllActivos();

  const habilitarMutation = useHabilitarRol(grupoId);
  const deshabilitarMutation = useDeshabilitarRol(grupoId);

  const idsHabilitados = new Set(rolesHabilitados?.map((r) => r.id_rol_grupo) ?? []);
  const rolesDisponiblesParaAgregar = (todosRoles ?? []).filter(
    (r) => r.activo && !idsHabilitados.has(r.id_rol_grupo),
  );

  function handleHabilitar() {
    if (!rolSeleccionado) return;
    habilitarMutation.mutate(
      { grupo_id: grupoId, rol_grupo_id: Number(rolSeleccionado) },
      {
        onSuccess: () => {
          toast.success('Rol habilitado para el grupo');
          setRolSeleccionado('');
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al habilitar rol');
        },
      },
    );
  }

  function handleDeshabilitar(rolId: number, nombre: string) {
    deshabilitarMutation.mutate(
      { rolId },
      {
        onSuccess: () => toast.success(`Rol "${nombre}" deshabilitado`),
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al deshabilitar rol');
        },
      },
    );
  }

  if (loadingHabilitados || loadingTodos) {
    return (
      <div className="grid gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {rolesHabilitados && rolesHabilitados.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {rolesHabilitados.map((rol) => (
            <div
              key={rol.id_rol_grupo}
              className="flex items-center gap-1.5 rounded-full border bg-muted/40 pl-3 pr-1.5 py-1 text-sm"
            >
              <Check className="size-3 text-green-600" />
              <span className="font-medium">{rol.nombre}</span>
              {rol.es_directiva && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[10px] bg-blue-100 text-blue-700 border-none"
                >
                  Directiva
                </Badge>
              )}
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                onClick={() => handleDeshabilitar(rol.id_rol_grupo, rol.nombre)}
                disabled={deshabilitarMutation.isPending}
                title="Deshabilitar rol"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          No hay roles configurados para este grupo.
        </p>
      )}

      {rolesDisponiblesParaAgregar.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={rolSeleccionado} onValueChange={setRolSeleccionado}>
            <SelectTrigger className="h-8 text-sm flex-1">
              <SelectValue placeholder="Seleccionar rol para agregar..." />
            </SelectTrigger>
            <SelectContent>
              {rolesDisponiblesParaAgregar.map((r) => (
                <SelectItem key={r.id_rol_grupo} value={String(r.id_rol_grupo)}>
                  {r.nombre}
                  {r.es_directiva && (
                    <span className="ml-2 text-xs text-blue-600">(Directiva)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleHabilitar}
            disabled={!rolSeleccionado || habilitarMutation.isPending}
          >
            {habilitarMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Agregar
          </Button>
        </div>
      )}
    </div>
  );
}
