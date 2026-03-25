'use client';

import dayjs from 'dayjs';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { tiposNecesidadHooks } from '@/features/catalogos/hooks';
import { useColaboradores } from '@/features/colaboradores/hooks/use-colaboradores';
import { useMarcarCumplio } from '@/features/colaboradores/hooks/use-marcar-cumplio';
import type { Colaborador } from '@/features/colaboradores/types';
import { NecesidadFormModal } from '@/features/necesidades/components/necesidad-form-modal';
import { useCreateNecesidad } from '@/features/necesidades/hooks/use-create-necesidad';
import { useDeleteNecesidad } from '@/features/necesidades/hooks/use-delete-necesidad';
import { useNecesidades } from '@/features/necesidades/hooks/use-necesidades';
import { useUpdateNecesidad } from '@/features/necesidades/hooks/use-update-necesidad';
import type { EstadoNecesidad, NecesidadLogistica } from '@/features/necesidades/types';
import { cn } from '@/lib/utils';

const estadoVariant: Record<
  EstadoNecesidad,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  abierta: 'default',
  cubierta: 'secondary',
  cerrada: 'outline',
  cancelada: 'destructive',
};

const estadoLabel: Record<EstadoNecesidad, string> = {
  abierta: 'Abierta',
  cubierta: 'Cubierta',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
};

export interface LogisticaTabProps {
  actividadId: number;
  canManage: boolean;
  isCancelada: boolean;
  resaltarColaboradorId?: number;
}

function actividadTerminada(col: Colaborador): boolean {
  if (!col.necesidad?.actividad) return false;
  const { fecha, hora_fin, estado } = col.necesidad.actividad;
  if (estado === 'cancelada') return true;
  const endStr = hora_fin ? `${fecha}T${hora_fin}` : `${fecha}T23:59:59`;
  return dayjs(endStr).isBefore(dayjs());
}

export function LogisticaTab({ actividadId, canManage, isCancelada, resaltarColaboradorId }: LogisticaTabProps) {
  const { data: necesidades, isLoading: loadingNecesidades } = useNecesidades({
    actividad_id: actividadId,
  });
  const { data: tiposNecesidad } = tiposNecesidadHooks.useAllActivos();
  const { data: allColaboradores, isLoading: loadingColaboradores } = useColaboradores(undefined, {
    enabled: (necesidades?.length ?? 0) > 0,
  });

  const necesidadIds = useMemo(() => new Set(necesidades?.map((n) => n.id) ?? []), [necesidades]);
  const actividadColaboradores = useMemo(
    () => allColaboradores?.filter((c) => necesidadIds.has(c.necesidad_id)) ?? [],
    [allColaboradores, necesidadIds],
  );

  const createMutation = useCreateNecesidad();
  const updateMutation = useUpdateNecesidad();
  const deleteMutation = useDeleteNecesidad();
  const marcarCumplioMutation = useMarcarCumplio();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NecesidadLogistica | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedNecId, setExpandedNecId] = useState<number | null>(null);

  // Auto-expandir y hacer scroll a la colaboración resaltada
  useEffect(() => {
    if (!resaltarColaboradorId || !allColaboradores || !necesidades) return;
    const colab = allColaboradores.find((c) => c.id === resaltarColaboradorId);
    if (!colab) return;
    setExpandedNecId(colab.necesidad_id);
    const timer = setTimeout(() => {
      const el = document.getElementById(`colaborador-${resaltarColaboradorId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    return () => clearTimeout(timer);
  }, [resaltarColaboradorId, allColaboradores, necesidades]);

  const tiposMap = useMemo(
    () => new Map(tiposNecesidad?.map((t) => [t.id_tipo, t])),
    [tiposNecesidad],
  );

  function handleDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        toast.success('Necesidad eliminada');
        setDeletingId(null);
      },
      onError: () =>
        toast.error('Solo se pueden eliminar necesidades abiertas sin colaboraciones.'),
    });
  }

  function handleMarcarCumplio(col: Colaborador, cumplio: boolean) {
    marcarCumplioMutation.mutate(
      { id: col.id, input: { cumplio } },
      {
        onSuccess: () =>
          toast.success(cumplio ? 'Marcado como cumplido' : 'Marcado como no cumplido'),
        onError: () => toast.error('Error al actualizar'),
      },
    );
  }

  return (
    <div className="grid gap-4">
      {canManage && !isCancelada && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nueva Necesidad
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Tipo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead>Estado</TableHead>
              {canManage && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingNecesidades ? (
              ['s1', 's2', 's3'].map((key) => (
                <TableRow key={key}>
                  <TableCell colSpan={canManage ? 6 : 5}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !necesidades?.length ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay necesidades registradas para esta actividad.
                </TableCell>
              </TableRow>
            ) : (
              necesidades.map((nec) => {
                const progreso = Math.round(
                  (nec.cantidad_cubierta / nec.cantidad_requerida) * 100,
                );
                const colabs = actividadColaboradores.filter((c) => c.necesidad_id === nec.id);
                const isExpanded = expandedNecId === nec.id;

                return (
                  <React.Fragment key={nec.id}>
                    {/* Fila de necesidad */}
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setExpandedNecId(isExpanded ? null : nec.id)}
                          title={isExpanded ? 'Ocultar colaboraciones' : 'Ver colaboraciones'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {tiposMap.get(nec.tipo_necesidad_id)?.nombre ??
                          `Tipo #${nec.tipo_necesidad_id}`}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{nec.descripcion}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progreso} className="h-2 w-16" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {nec.cantidad_cubierta}/{nec.cantidad_requerida} {nec.unidad_medida}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={estadoVariant[nec.estado]}>
                          {estadoLabel[nec.estado]}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          {(nec.estado === 'abierta') && !isCancelada && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditing(nec);
                                    setFormOpen(true);
                                  }}
                                >
                                  <Pencil className="size-4" />
                                  Editar
                                </DropdownMenuItem>
                                {colabs.length === 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setDeletingId(nec.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="size-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>

                    {/* Fila expandida con colaboraciones */}
                    {isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={canManage ? 6 : 5} className="py-0">
                          <div className="px-6 py-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                              <Users className="size-3.5" />
                              Colaboraciones ({colabs.length})
                            </p>
                            {loadingColaboradores ? (
                              <Skeleton className="h-8 w-full" />
                            ) : colabs.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-1">
                                Nadie se ha ofrecido aún.
                              </p>
                            ) : (
                              <div className="rounded border overflow-hidden mb-1">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/40">
                                      <TableHead>Miembro</TableHead>
                                      <TableHead>Cantidad</TableHead>
                                      <TableHead className="hidden md:table-cell">
                                        Observaciones
                                      </TableHead>
                                      <TableHead>Cumplió</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {colabs.map((col) => {
                                      const terminada = actividadTerminada(col);
                                      const esResaltado = col.id === resaltarColaboradorId;
                                      return (
                                        <TableRow
                                          key={col.id}
                                          id={esResaltado ? `colaborador-${col.id}` : undefined}
                                          className={cn(
                                            'transition-colors border-l-4',
                                            esResaltado
                                              ? 'bg-primary/5 border-l-primary'
                                              : 'border-l-transparent',
                                          )}
                                        >
                                          <TableCell>
                                            {col.miembro
                                              ? `${col.miembro.nombre} ${col.miembro.apellido}`
                                              : `Miembro #${col.miembro_id}`}
                                          </TableCell>
                                          <TableCell>
                                            {col.cantidad_comprometida} {nec.unidad_medida}
                                          </TableCell>
                                          <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {col.observaciones ?? '—'}
                                          </TableCell>
                                          <TableCell>
                                            {canManage ? (
                                              <Button
                                                variant={col.cumplio ? 'secondary' : 'outline'}
                                                size="sm"
                                                className="h-7 text-xs gap-1.5"
                                                onClick={() =>
                                                  handleMarcarCumplio(col, !col.cumplio)
                                                }
                                                disabled={
                                                  marcarCumplioMutation.isPending || !terminada
                                                }
                                                title={
                                                  !terminada
                                                    ? 'Disponible después de la actividad'
                                                    : col.cumplio
                                                      ? 'Desmarcar'
                                                      : 'Marcar como cumplido'
                                                }
                                              >
                                                {marcarCumplioMutation.isPending ? (
                                                  <Loader2 className="size-3 animate-spin" />
                                                ) : (
                                                  <Check
                                                    className={cn(
                                                      'size-3',
                                                      col.cumplio && 'text-success-foreground',
                                                    )}
                                                  />
                                                )}
                                                {col.cumplio ? 'Cumplió' : 'Pendiente'}
                                              </Button>
                                            ) : (
                                              <Badge
                                                variant={col.cumplio ? 'secondary' : 'outline'}
                                              >
                                                {col.cumplio ? 'Sí' : 'Pendiente'}
                                              </Badge>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <NecesidadFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        actividadId={actividadId}
        editing={editing}
        tiposNecesidad={tiposNecesidad}
        createMutation={createMutation}
        updateMutation={updateMutation}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar necesidad</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
