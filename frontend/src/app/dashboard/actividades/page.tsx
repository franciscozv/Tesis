'use client';

import { Eye, MoreHorizontal, Pencil, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { ActividadFormModal } from '@/features/actividades/components/actividad-form';
import { CambiarEstadoActividadModal } from '@/features/actividades/components/cambiar-estado-actividad-modal';
import { useActividades } from '@/features/actividades/hooks/use-actividades';
import { useCreateActividad } from '@/features/actividades/hooks/use-create-actividad';
import { useUpdateActividad } from '@/features/actividades/hooks/use-update-actividad';
import type { CreateActividadFormData } from '@/features/actividades/schemas';
import type { Actividad, ActividadFilters, EstadoActividad } from '@/features/actividades/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { tiposActividadHooks } from '@/features/catalogos/hooks';
import { useGruposPermitidos } from '@/features/grupos-ministeriales/hooks/use-grupos-permitidos';

const estadoLabels: Record<EstadoActividad, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

const estadoVariant: Record<EstadoActividad, 'default' | 'secondary' | 'destructive'> = {
  programada: 'default',
  realizada: 'secondary',
  cancelada: 'destructive',
};

const currentYear = new Date().getFullYear();

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

function formatFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ActividadesPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const isAdmin = usuario?.rol === 'administrador';
  const isAdminOrLider = isAdmin || usuario?.rol === 'lider';

  const [mesFilter, setMesFilter] = useState<string>('todos');
  const [anioFilter, setAnioFilter] = useState<string>(String(currentYear));
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');

  const filters: ActividadFilters = {};
  if (mesFilter !== 'todos') filters.mes = Number(mesFilter);
  if (anioFilter !== 'todos') filters.anio = Number(anioFilter);
  if (estadoFilter !== 'todos') filters.estado = estadoFilter as EstadoActividad;

  const { data: actividades, isLoading } = useActividades(filters);
  const { data: tiposActividad } = tiposActividadHooks.useAllActivos();
  const { grupos } = useGruposPermitidos();

  const createMutation = useCreateActividad();
  const updateMutation = useUpdateActividad();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Actividad | null>(null);
  const [estadoModal, setEstadoModal] = useState<Actividad | null>(null);

  const tiposMap = useMemo(
    () => new Map(tiposActividad?.map((t) => [t.id_tipo, t])),
    [tiposActividad],
  );

  const gruposMap = useMemo(() => new Map(grupos?.map((g) => [g.id_grupo, g])), [grupos]);

  const filtered = useMemo(() => {
    if (!actividades) return [];
    if (!search) return actividades;
    const q = search.toLowerCase();
    return actividades.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        (a.tipo_actividad?.nombre ?? tiposMap.get(a.tipo_actividad_id)?.nombre ?? '').toLowerCase().includes(q),
    );
  }, [actividades, search, tiposMap]);

  useEffect(() => {
    if (usuario?.rol === 'miembro' || usuario?.rol === 'lider') {
      router.replace('/dashboard/calendario');
    }
  }, [usuario, router]);

  if (!usuario || usuario.rol === 'miembro' || usuario.rol === 'lider') return null;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(actividad: Actividad) {
    setEditing(actividad);
    setFormOpen(true);
  }

  function handleSubmit(data: CreateActividadFormData) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, input: data },
        {
          onSuccess: () => {
            toast.success('Actividad actualizada');
            setFormOpen(false);
          },
          onError: (err: any) =>
            toast.error(err?.response?.data?.message || 'Error al actualizar actividad'),
        },
      );
    } else {
      if (!usuario) return;
      createMutation.mutate(
        { ...data, creador_id: usuario.id },
        {
          onSuccess: () => {
            toast.success('Actividad creada exitosamente');
            setFormOpen(false);
          },
          onError: (err: any) =>
            toast.error(err?.response?.data?.message || 'Error al crear actividad'),
        },
      );
    }
  }

  const editingDefaults = editing
    ? {
        tipo_actividad_id: editing.tipo_actividad_id,
        nombre: editing.nombre,
        descripcion: editing.descripcion ?? '',
        fecha: editing.fecha,
        hora_inicio: formatHora(editing.hora_inicio),
        hora_fin: formatHora(editing.hora_fin),
        grupo_id: editing.grupo_id ?? 0,
        es_publica: editing.es_publica,
      }
    : undefined;

  const colSpan = isAdminOrLider ? 9 : 8;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground">Gestión de actividades de la iglesia.</p>
        </div>
        {isAdminOrLider && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nueva Actividad
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={mesFilter} onValueChange={setMesFilter}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los meses</SelectItem>
            <SelectItem value="1">Enero</SelectItem>
            <SelectItem value="2">Febrero</SelectItem>
            <SelectItem value="3">Marzo</SelectItem>
            <SelectItem value="4">Abril</SelectItem>
            <SelectItem value="5">Mayo</SelectItem>
            <SelectItem value="6">Junio</SelectItem>
            <SelectItem value="7">Julio</SelectItem>
            <SelectItem value="8">Agosto</SelectItem>
            <SelectItem value="9">Septiembre</SelectItem>
            <SelectItem value="10">Octubre</SelectItem>
            <SelectItem value="11">Noviembre</SelectItem>
            <SelectItem value="12">Diciembre</SelectItem>
          </SelectContent>
        </Select>
        <Select value={anioFilter} onValueChange={setAnioFilter}>
          <SelectTrigger className="sm:w-28">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="programada">Programada</SelectItem>
            <SelectItem value="realizada">Realizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="hidden md:table-cell">Hora</TableHead>
              <TableHead className="hidden md:table-cell">Tipo</TableHead>
              <TableHead className="hidden lg:table-cell">Grupo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Pública</TableHead>
              {isAdminOrLider && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ['s1', 's2', 's3', 's4', 's5'].map((key) => (
                <TableRow key={key}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-24 text-center">
                  No se encontraron actividades.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((actividad) => (
                <TableRow key={actividad.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/actividades/${actividad.id}`}
                      className="hover:underline"
                    >
                      {actividad.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatFecha(actividad.fecha)}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell">
                    {formatHora(actividad.hora_inicio)} - {formatHora(actividad.hora_fin)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {actividad.tipo_actividad?.nombre ??
                      tiposMap.get(actividad.tipo_actividad_id)?.nombre ??
                      actividad.tipo_actividad_id}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {actividad.grupo_id ? (gruposMap.get(actividad.grupo_id)?.nombre ?? '—') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={estadoVariant[actividad.estado]}>
                      {estadoLabels[actividad.estado]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {actividad.es_publica ? (
                      <Badge variant="outline">Sí</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  {isAdminOrLider && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/actividades/${actividad.id}`}>
                              <Eye className="size-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          {actividad.estado !== 'cancelada' && (
                            <DropdownMenuItem onClick={() => openEdit(actividad)}>
                              <Pencil className="size-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {actividad.estado !== 'cancelada' && (
                            <DropdownMenuItem onClick={() => setEstadoModal(actividad)}>
                              <RefreshCw className="size-4" />
                              Cambiar estado
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ActividadFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={editingDefaults}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        tiposActividad={tiposActividad}
        grupos={grupos}
        isEditing={!!editing}
      />

      <CambiarEstadoActividadModal
        actividad={estadoModal}
        open={!!estadoModal}
        onOpenChange={(open) => !open && setEstadoModal(null)}
      />
    </div>
  );
}
