'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { gruposApi } from '@/features/grupos-ministeriales/api';
import { GRUPOS_QUERY_KEY } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useGruposPermitidos } from '@/features/grupos-ministeriales/hooks/use-grupos-permitidos';
import { MIS_GRUPOS_QUERY_KEY } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';
import type { GrupoMinisterial } from '@/features/grupos-ministeriales/types';

export default function GruposPage() {
  const { grupos, isLoading, isAdmin } = useGruposPermitidos();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<GrupoMinisterial | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => gruposApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GRUPOS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MIS_GRUPOS_QUERY_KEY] });
      toast.success('Grupo eliminado exitosamente');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Error al eliminar grupo');
    },
  });

  const filtered =
    grupos?.filter((g) => !search || g.nombre.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grupos Ministeriales</h1>
          <p className="text-muted-foreground">Gestión de grupos de la iglesia</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/grupos/nuevo">
              <Plus className="size-4" />
              Nuevo Grupo
            </Link>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
              <TableHead>Líder</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ['s1', 's2', 's3'].map((key) => (
                <TableRow key={key}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron grupos.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((grupo) => (
                <TableRow key={grupo.id_grupo}>
                  <TableCell className="font-medium">{grupo.nombre}</TableCell>
                  <TableCell className="text-muted-foreground hidden max-w-xs truncate md:table-cell">
                    {grupo.descripcion ?? '—'}
                  </TableCell>
                  <TableCell>
                    {grupo.encargado_actual
                      ? `${grupo.encargado_actual.nombre} ${grupo.encargado_actual.apellido}`
                      : 'Sin encargado'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={grupo.activo ? 'default' : 'secondary'}>
                      {grupo.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/grupos/${grupo.id_grupo}`}>
                            <Eye className="size-4" />
                            Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/grupos/${grupo.id_grupo}/editar`}>
                                <Pencil className="size-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(grupo)}
                            >
                              <Trash2 className="size-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
