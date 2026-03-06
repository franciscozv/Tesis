'use client';

import { Check, Loader2, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
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
import { useCambiarEstadoNecesidad } from '@/features/necesidades/hooks/use-cambiar-estado-necesidad';
import { useCreateNecesidad } from '@/features/necesidades/hooks/use-create-necesidad';
import { useDeleteNecesidad } from '@/features/necesidades/hooks/use-delete-necesidad';
import { useNecesidades } from '@/features/necesidades/hooks/use-necesidades';
import { useUpdateNecesidad } from '@/features/necesidades/hooks/use-update-necesidad';
import type { EstadoNecesidad, NecesidadLogistica } from '@/features/necesidades/types';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { NecesidadFormModal } from './necesidad-form-modal';

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

export default function GestionarNecesidadesPage() {
  const { data: necesidades, isLoading: loadingNecesidades } = useNecesidades();
  const { data: tiposNecesidad } = tiposNecesidadHooks.useAllActivos();
  const { data: colaboradores, isLoading: loadingColaboradores } = useColaboradores();

  const createMutation = useCreateNecesidad();
  const updateMutation = useUpdateNecesidad();
  const deleteMutation = useDeleteNecesidad();
  const estadoMutation = useCambiarEstadoNecesidad();
  const decidirMutation = useDecidirOferta();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NecesidadLogistica | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [ofertaFilter, setOfertaFilter] = useState<string>('pendiente');

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
    if (!colaboradores) return [];
    if (ofertaFilter === 'todos') return colaboradores;
    return colaboradores.filter((c) => c.estado === ofertaFilter);
  }, [colaboradores, ofertaFilter]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(nec: NecesidadLogistica) {
    setEditing(nec);
    setFormOpen(true);
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

  function handleDecidir(colaborador: Colaborador, estado: 'aceptada' | 'rechazada') {
    decidirMutation.mutate(
      { id: colaborador.id, input: { estado } },
      {
        onSuccess: () =>
          toast.success(estado === 'aceptada' ? 'Oferta aceptada' : 'Oferta rechazada'),
        onError: () => toast.error('Error al procesar oferta'),
      },
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestionar Necesidades</h1>
        <p className="text-muted-foreground">
          Administre necesidades logísticas y ofertas de colaboración.
        </p>
      </div>

      <Tabs defaultValue="necesidades">
        <TabsList>
          <TabsTrigger value="necesidades">Necesidades</TabsTrigger>
          <TabsTrigger value="ofertas">
            Ofertas Pendientes
            {colaboradores?.filter((c) => c.estado === 'pendiente').length
              ? ` (${colaboradores.filter((c) => c.estado === 'pendiente').length})`
              : ''}
          </TabsTrigger>
        </TabsList>

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
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Nueva Necesidad
            </Button>
          </div>

          <NecesidadesTable
            necesidades={filteredNecesidades}
            isLoading={loadingNecesidades}
            tiposMap={tiposMap}
            onEdit={openEdit}
            onDelete={setDeletingId}
            onCambiarEstado={handleCambiarEstado}
            estadoMutationPending={estadoMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="ofertas" className="grid gap-4">
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

          <OfertasTable
            colaboradores={filteredColaboradores}
            isLoading={loadingColaboradores}
            onDecidir={handleDecidir}
            isPending={decidirMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      <NecesidadFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
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

// --- Necesidades Table ---

interface NecesidadesTableProps {
  necesidades: NecesidadLogistica[];
  isLoading: boolean;
  tiposMap: Map<number, { nombre: string }>;
  onEdit: (nec: NecesidadLogistica) => void;
  onDelete: (id: number) => void;
  onCambiarEstado: (id: number, estado: EstadoNecesidad) => void;
  estadoMutationPending: boolean;
}

function NecesidadesTable({
  necesidades,
  isLoading,
  tiposMap,
  onEdit,
  onDelete,
  onCambiarEstado,
  estadoMutationPending,
}: NecesidadesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="hidden md:table-cell">Actividad</TableHead>
            <TableHead>Progreso</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            ['s1', 's2', 's3', 's4', 's5'].map((key) => (
              <TableRow key={key}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : necesidades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No se encontraron necesidades.
              </TableCell>
            </TableRow>
          ) : (
            necesidades.map((nec) => {
              const progreso = Math.round((nec.cantidad_cubierta / nec.cantidad_requerida) * 100);
              return (
                <TableRow key={nec.id}>
                  <TableCell className="font-medium">
                    {tiposMap.get(nec.tipo_necesidad_id)?.nombre ??
                      `Tipo #${nec.tipo_necesidad_id}`}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{nec.descripcion}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {nec.actividad?.nombre ?? `#${nec.actividad_id}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progreso} className="h-2 w-16" />
                      <span className="text-xs text-muted-foreground">
                        {nec.cantidad_cubierta}/{nec.cantidad_requerida}
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
                        <DropdownMenuItem onClick={() => onEdit(nec)}>
                          <Pencil className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        {nec.estado === 'abierta' && (
                          <DropdownMenuItem
                            onClick={() => onCambiarEstado(nec.id, 'cubierta')}
                            disabled={estadoMutationPending}
                          >
                            <RefreshCw className="size-4" />
                            Marcar cubierta
                          </DropdownMenuItem>
                        )}
                        {nec.estado === 'cubierta' && (
                          <DropdownMenuItem
                            onClick={() => onCambiarEstado(nec.id, 'cerrada')}
                            disabled={estadoMutationPending}
                          >
                            <RefreshCw className="size-4" />
                            Cerrar
                          </DropdownMenuItem>
                        )}
                        {nec.estado === 'abierta' && (
                          <DropdownMenuItem onClick={() => onDelete(nec.id)}>
                            <Trash2 className="size-4 text-destructive" />
                            Eliminar
                          </DropdownMenuItem>
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
  );
}

// --- Ofertas Table ---

interface OfertasTableProps {
  colaboradores: Colaborador[];
  isLoading: boolean;
  onDecidir: (colaborador: Colaborador, estado: 'aceptada' | 'rechazada') => void;
  isPending: boolean;
}

function OfertasTable({ colaboradores, isLoading, onDecidir, isPending }: OfertasTableProps) {
  const isActividadPasada = (col: Colaborador) => {
    if (!col.necesidad?.actividad) return false;
    const { fecha, hora_fin, estado } = col.necesidad.actividad;

    if (estado === 'cancelada') return true;

    // Si no hay hora_fin, asumimos las 23:59:59 del día de la fecha
    const endStr = hora_fin ? `${fecha}T${hora_fin}` : `${fecha}T23:59:59`;
    return dayjs(endStr).isBefore(dayjs());
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Miembro</TableHead>
            <TableHead>Necesidad / Actividad</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead className="hidden md:table-cell">Observaciones</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-24">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            ['s1', 's2', 's3', 's4', 's5'].map((key) => (
              <TableRow key={key}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : colaboradores.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No se encontraron ofertas.
              </TableCell>
            </TableRow>
          ) : (
            colaboradores.map((col) => {
              const expirada = isActividadPasada(col);
              return (
                <TableRow key={col.id}>
                  <TableCell className="font-medium">
                    {col.miembro
                      ? `${col.miembro.nombre} ${col.miembro.apellido}`
                      : `Miembro #${col.miembro_id}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {col.necesidad?.descripcion ?? `Necesidad #${col.necesidad_id}`}
                      </span>
                      {col.necesidad?.actividad && (
                        <span className="text-xs text-muted-foreground">
                          {col.necesidad.actividad.nombre} ({dayjs(col.necesidad.actividad.fecha).format('DD/MM/YYYY')})
                        </span>
                      )}
                    </div>
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
                  <TableCell>
                    {col.estado === 'pendiente' && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDecidir(col, 'aceptada')}
                          disabled={isPending || expirada}
                          title={expirada ? 'Actividad ya finalizó' : 'Aceptar'}
                        >
                          {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className={cn('size-4 text-green-600', expirada && 'opacity-50')} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onDecidir(col, 'rechazada')}
                          disabled={isPending || expirada}
                          title={expirada ? 'Actividad ya finalizó' : 'Rechazar'}
                        >
                          <X className={cn('size-4 text-destructive', expirada && 'opacity-50')} />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

