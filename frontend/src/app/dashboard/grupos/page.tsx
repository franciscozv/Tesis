'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AccessDenied } from '@/components/access-denied';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { gruposApi } from '@/features/grupos-ministeriales/api';
import { GrupoFormModal } from '@/features/grupos-ministeriales/components/grupo-form-modal';
import { GruposTable } from '@/features/grupos-ministeriales/components/grupos-table';
import { GRUPOS_QUERY_KEY } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useGruposPermitidos } from '@/features/grupos-ministeriales/hooks/use-grupos-permitidos';
import { MIS_GRUPOS_QUERY_KEY } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';
import type { GrupoMinisterial } from '@/features/grupos-ministeriales/types';

export default function GruposPage() {
  const { grupos, isLoading, isAdmin } = useGruposPermitidos();

  if (!isAdmin) {
    return (
      <AccessDenied
        message="Solo los administradores pueden gestionar todos los grupos ministeriales."
        backHref="/dashboard/mis-grupos"
        backLabel="Ver mis grupos"
      />
    );
  }
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<GrupoMinisterial | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setCreateOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gruposApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MIS_GRUPOS_QUERY_KEY] });
      toast.success('Grupo eliminado exitosamente');
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message;
      toast.error(msg || 'Error al eliminar grupo');
    },
  });

  const filtered =
    grupos?.filter((g) => !search || g.nombre.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Grupos Ministeriales</h1>
          <p className="text-muted-foreground text-sm">Gestión de todos los grupos de la iglesia</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo Grupo
          </Button>
        )}
      </div>

      <div>
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      <GruposTable
        grupos={filtered}
        isLoading={isLoading}
        isAdmin={isAdmin}
        onEliminar={setDeleteTarget}
      />

      <GrupoFormModal open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Grupo</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el grupo &quot;{deleteTarget?.nombre}&quot;? Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id_grupo)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
