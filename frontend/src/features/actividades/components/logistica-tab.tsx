'use client';

import dayjs from 'dayjs';
import {
  Check,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { tiposNecesidadHooks } from '@/features/catalogos/hooks';
import { useColaboradores } from '@/features/colaboradores/hooks/use-colaboradores';
import { useDecidirOferta } from '@/features/colaboradores/hooks/use-decidir-oferta';
import type { Colaborador, EstadoColaborador } from '@/features/colaboradores/types';
import { NecesidadFormModal } from '@/features/necesidades/components/necesidad-form-modal';
import { useCambiarEstadoNecesidad } from '@/features/necesidades/hooks/use-cambiar-estado-necesidad';
import { useCreateNecesidad } from '@/features/necesidades/hooks/use-create-necesidad';
import { useDeleteNecesidad } from '@/features/necesidades/hooks/use-delete-necesidad';
import { useNecesidades } from '@/features/necesidades/hooks/use-necesidades';
import { useUpdateNecesidad } from '@/features/necesidades/hooks/use-update-necesidad';
import type { EstadoNecesidad, NecesidadLogistica } from '@/features/necesidades/types';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Label / variant maps
// ---------------------------------------------------------------------------

const necesidadEstadoLabels: Record<EstadoNecesidad, string> = {
  abierta: 'Abierta',
  cubierta: 'Cubierta',
  cerrada: 'Cerrada',
};

const necesidadEstadoVariant: Record<EstadoNecesidad, 'default' | 'secondary' | 'outline'> = {
  abierta: 'default',
  cubierta: 'secondary',
  cerrada: 'outline',
};

const colaboradorEstadoLabels: Record<EstadoColaborador, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
};

const colaboradorEstadoVariant: Record<EstadoColaborador, 'default' | 'secondary' | 'destructive'> =
  {
    pendiente: 'default',
    aceptada: 'secondary',
    rechazada: 'destructive',
  };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LogisticaTabProps {
  actividadId: number;
  canManage: boolean;
  isCancelada: boolean;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function isColaboradorExpirado(col: Colaborador): boolean {
  if (!col.necesidad?.actividad) return false;
  const { fecha, hora_fin, estado } = col.necesidad.actividad;
  if (estado === 'cancelada') return true;
  const endStr = hora_fin ? `${fecha}T${hora_fin}` : `${fecha}T23:59:59`;
  return dayjs(endStr).isBefore(dayjs());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LogisticaTab({ actividadId, canManage, isCancelada }: LogisticaTabProps) {
  // Data
  const { data: necesidades, isLoading: loadingNecesidades } = useNecesidades({
    actividad_id: actividadId,
  });
  const { data: tiposNecesidad } = tiposNecesidadHooks.useAllActivos();
  const { data: allColaboradores, isLoading: loadingColaboradores } = useColaboradores(undefined, {
    enabled: (necesidades?.length ?? 0) > 0,
  });

  // Filter colaboradores to those belonging to this actividad's necesidades
  const necesidadIds = useMemo(() => new Set(necesidades?.map((n) => n.id) ?? []), [necesidades]);
  const actividadColaboradores = useMemo(
    () => allColaboradores?.filter((c) => necesidadIds.has(c.necesidad_id)) ?? [],
    [allColaboradores, necesidadIds],
  );

  // Mutations
  const createMutation = useCreateNecesidad();
  const updateMutation = useUpdateNecesidad();
  const deleteMutation = useDeleteNecesidad();
  const estadoMutation = useCambiarEstadoNecesidad();
  const decidirMutation = useDecidirOferta();

  // State
  const [activeTab, setActiveTab] = useState('necesidades');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NecesidadLogistica | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [ofertaFilter, setOfertaFilter] = useState<string>('pendiente');
  const [ofertaNecesidadId, setOfertaNecesidadId] = useState<number | null>(null);

  const tiposMap = useMemo(
    () => new Map(tiposNecesidad?.map((t) => [t.id_tipo, t])),
    [tiposNecesidad],
  );

  const filteredNecesidades = useMemo(() => {
    if (!necesidades) return [];
    if (estadoFilter === 'todos') return necesidades;
    return necesidades.filter((n) => n.estado === estadoFilter);
  }, [necesidades, estadoFilter]);

  const filteredColaboradores = useMemo(() => {
    let cols = actividadColaboradores;
    if (ofertaNecesidadId !== null) cols = cols.filter((c) => c.necesidad_id === ofertaNecesidadId);
    if (ofertaFilter !== 'todos') cols = cols.filter((c) => c.estado === ofertaFilter);
    return cols;
  }, [actividadColaboradores, ofertaFilter, ofertaNecesidadId]);

  const pendingCount = actividadColaboradores.filter((c) => c.estado === 'pendiente').length;
  const filteredNecesidadLabel = ofertaNecesidadId
    ? necesidades?.find((n) => n.id === ofertaNecesidadId)?.descripcion
    : null;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(nec: NecesidadLogistica) {
    setEditing(nec);
    setFormOpen(true);
  }

  function handleVerOfertas(necesidadId: number) {
    setOfertaNecesidadId(necesidadId);
    setOfertaFilter('todos');
    setActiveTab('ofertas');
  }

  function handleDelete() {
    if (!deletingId) return;
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        toast.success('Necesidad eliminada');
        setDeletingId(null);
      },
      onError: () =>
        toast.error('Error al eliminar. Solo se pueden eliminar necesidades abiertas.'),
    });
  }

  function handleCambiarEstado(id: number, estado: EstadoNecesidad) {
    estadoMutation.mutate(
      { id, input: { estado } },
      {
        onSuccess: () => toast.success(`Estado cambiado a ${necesidadEstadoLabels[estado]}`),
        onError: () => toast.error('Error al cambiar estado'),
      },
    );
  }

  function handleDecidir(col: Colaborador, estado: 'aceptada' | 'rechazada') {
    decidirMutation.mutate(
      { id: col.id, input: { estado } },
      {
        onSuccess: () =>
          toast.success(estado === 'aceptada' ? 'Colaboración aceptada' : 'Colaboración rechazada'),
        onError: () => toast.error('Error al procesar colaboración'),
      },
    );
  }

  return (
    <div className="grid gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="necesidades">Necesidades ({necesidades?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="ofertas">
            Colaboraciones{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        {/* Necesidades Tab                                                   */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="necesidades" className="grid gap-4">
          <div className="flex items-center justify-between">
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
                <SelectItem value="cubierta">Cubierta</SelectItem>
                <SelectItem value="cerrada">Cerrada</SelectItem>
              </SelectContent>
            </Select>
            {canManage && !isCancelada && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                Nueva Necesidad
              </Button>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingNecesidades ? (
                  ['s1', 's2', 's3'].map((key) => (
                    <TableRow key={key}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredNecesidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {estadoFilter === 'todos'
                        ? 'No hay necesidades registradas para esta actividad.'
                        : 'No se encontraron necesidades con ese estado.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNecesidades.map((nec) => {
                    const progreso = Math.round(
                      (nec.cantidad_cubierta / nec.cantidad_requerida) * 100,
                    );
                    const ofertasCount = actividadColaboradores.filter(
                      (c) => c.necesidad_id === nec.id,
                    ).length;
                    return (
                      <TableRow key={nec.id}>
                        <TableCell className="font-medium">
                          {tiposMap.get(nec.tipo_necesidad_id)?.nombre ??
                            `Tipo #${nec.tipo_necesidad_id}`}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{nec.descripcion}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progreso} className="h-2 w-16" />
                            <span className="text-xs text-muted-foreground">
                              {nec.cantidad_cubierta}/{nec.cantidad_requerida} {nec.unidad_medida}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={necesidadEstadoVariant[nec.estado]}>
                            {necesidadEstadoLabels[nec.estado]}
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
                              {canManage && !isCancelada && (
                                <DropdownMenuItem onClick={() => openEdit(nec)}>
                                  <Pencil className="size-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canManage && nec.estado === 'abierta' && !isCancelada && (
                                <DropdownMenuItem
                                  onClick={() => handleCambiarEstado(nec.id, 'cubierta')}
                                  disabled={estadoMutation.isPending}
                                >
                                  <RefreshCw className="size-4" />
                                  Marcar cubierta
                                </DropdownMenuItem>
                              )}
                              {canManage && nec.estado === 'cubierta' && !isCancelada && (
                                <DropdownMenuItem
                                  onClick={() => handleCambiarEstado(nec.id, 'cerrada')}
                                  disabled={estadoMutation.isPending}
                                >
                                  <RefreshCw className="size-4" />
                                  Cerrar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleVerOfertas(nec.id)}>
                                <Eye className="size-4" />
                                Ver Colaboraciones{ofertasCount > 0 ? ` (${ofertasCount})` : ''}
                              </DropdownMenuItem>
                              {canManage && nec.estado === 'abierta' && !isCancelada && (
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
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* Colaboraciones Tab                                                 */}
        {/* ---------------------------------------------------------------- */}
        <TabsContent value="ofertas" className="grid gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={ofertaFilter} onValueChange={setOfertaFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aceptada">Aceptada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            {ofertaNecesidadId !== null && (
              <Badge variant="secondary" className="flex items-center gap-1 h-9 px-3 text-sm">
                <Filter className="size-3" />
                {filteredNecesidadLabel
                  ? filteredNecesidadLabel.length > 30
                    ? `${filteredNecesidadLabel.slice(0, 30)}…`
                    : filteredNecesidadLabel
                  : `Necesidad #${ofertaNecesidadId}`}
                <button
                  type="button"
                  onClick={() => setOfertaNecesidadId(null)}
                  className="ml-1 rounded-full hover:opacity-70"
                  aria-label="Quitar filtro de necesidad"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Necesidad</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="hidden md:table-cell">Observaciones</TableHead>
                  <TableHead>Estado</TableHead>
                  {canManage && <TableHead className="w-24">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingColaboradores ? (
                  ['s1', 's2', 's3'].map((key) => (
                    <TableRow key={key}>
                      <TableCell colSpan={canManage ? 6 : 5}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredColaboradores.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 6 : 5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No se encontraron colaboraciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredColaboradores.map((col) => {
                    const expirada = isColaboradorExpirado(col);
                    return (
                      <TableRow key={col.id}>
                        <TableCell className="font-medium">
                          {col.miembro
                            ? `${col.miembro.nombre} ${col.miembro.apellido}`
                            : `Miembro #${col.miembro_id}`}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {col.necesidad?.descripcion ?? `Necesidad #${col.necesidad_id}`}
                        </TableCell>
                        <TableCell>{col.cantidad_ofrecida}</TableCell>
                        <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                          {col.observaciones ?? '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={colaboradorEstadoVariant[col.estado]}>
                              {colaboradorEstadoLabels[col.estado]}
                            </Badge>
                            {expirada && col.estado === 'pendiente' && (
                              <span className="text-[10px] font-semibold text-destructive uppercase">
                                Expirada
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            {col.estado === 'pendiente' && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleDecidir(col, 'aceptada')}
                                  disabled={decidirMutation.isPending || expirada}
                                  title={expirada ? 'Actividad ya finalizó' : 'Aceptar'}
                                >
                                  {decidirMutation.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Check
                                      className={cn(
                                        'size-4 text-success-foreground',
                                        expirada && 'opacity-50',
                                      )}
                                    />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleDecidir(col, 'rechazada')}
                                  disabled={decidirMutation.isPending || expirada}
                                  title={expirada ? 'Actividad ya finalizó' : 'Rechazar'}
                                >
                                  <X
                                    className={cn(
                                      'size-4 text-destructive',
                                      expirada && 'opacity-50',
                                    )}
                                  />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

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
              Solo se pueden eliminar necesidades abiertas. Esta acción no se puede deshacer.
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
