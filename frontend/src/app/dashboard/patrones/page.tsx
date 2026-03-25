'use client';

import { CalendarPlus, MoreHorizontal, Pencil, Plus, Power } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
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
import { useAuth } from '@/features/auth/hooks/use-auth';
import { tiposActividadHooks } from '@/features/catalogos/hooks';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { GenerarInstanciasModal } from '@/features/patrones-actividad/components/generar-instancias-modal';
import { PatronFormModal } from '@/features/patrones-actividad/components/patron-form';
import { useCreatePatron } from '@/features/patrones-actividad/hooks/use-create-patron';
import { usePatrones } from '@/features/patrones-actividad/hooks/use-patrones';
import {
  useToggleEstadoPatron,
  useUpdatePatron,
} from '@/features/patrones-actividad/hooks/use-update-patron';
import type { CreatePatronFormData } from '@/features/patrones-actividad/schemas';
import type { PatronActividad } from '@/features/patrones-actividad/types';

const frecuenciaLabels: Record<string, string> = {
  semanal: 'Semanal',
  primera_semana: '1ra semana',
  segunda_semana: '2da semana',
  tercera_semana: '3ra semana',
  cuarta_semana: '4ta semana',
};

const diasSemanaLabels: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

export default function PatronesPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  const { data: patrones, isLoading, isError } = usePatrones(isAdmin);
  const { data: tiposActividad } = tiposActividadHooks.useAllActivos();
  const { data: grupos } = useGrupos();

  const createMutation = useCreatePatron();
  const updateMutation = useUpdatePatron();
  const toggleMutation = useToggleEstadoPatron();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState<PatronActividad | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setEditing(null);
      setFormOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  const [editing, setEditing] = useState<PatronActividad | null>(null);
  const [generarOpen, setGenerarOpen] = useState(false);

  const tiposMap = useMemo(
    () => new Map(tiposActividad?.map((t) => [t.id_tipo, t])),
    [tiposActividad],
  );

  const gruposMap = useMemo(() => new Map(grupos?.map((g) => [g.id_grupo, g])), [grupos]);

  const filtered = useMemo(() => {
    if (!patrones) return [];
    if (!search) return patrones;
    const q = search.toLowerCase();
    return patrones.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (tiposMap.get(p.tipo_actividad_id)?.nombre ?? '').toLowerCase().includes(q),
    );
  }, [patrones, search, tiposMap]);

  const patronesInactivos = useMemo(
    () => patrones?.filter((p) => !p.activo) ?? [],
    [patrones],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(patron: PatronActividad) {
    setEditing(patron);
    setFormOpen(true);
  }

  function handleSubmit(data: CreatePatronFormData) {
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, input: data },
        {
          onSuccess: () => {
            toast.success('Patrón actualizado');
            setFormOpen(false);
          },
          onError: () => toast.error('Error al actualizar patrón'),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Patrón creado exitosamente');
          setFormOpen(false);
        },
        onError: () => toast.error('Error al crear patrón'),
      });
    }
  }

  function handleToggleEstado(patron: PatronActividad) {
    setToggleConfirm(patron);
  }

  function confirmToggleEstado() {
    if (!toggleConfirm) return;
    const patron = toggleConfirm;
    toggleMutation.mutate(
      { id: patron.id, activo: !patron.activo },
      {
        onSuccess: () => {
          toast.success(patron.activo ? 'Patrón desactivado' : 'Patrón activado');
          setToggleConfirm(null);
        },
        onError: () => {
          toast.error('Error al cambiar estado');
          setToggleConfirm(null);
        },
      },
    );
  }

  const editingDefaults = editing
    ? {
        nombre: editing.nombre,
        tipo_actividad_id: editing.tipo_actividad_id,
        frecuencia: editing.frecuencia,
        dia_semana: editing.dia_semana,
        hora_inicio: formatHora(editing.hora_inicio),
        duracion_minutos: editing.duracion_minutos,
        lugar: editing.lugar,
        grupo_id: editing.grupo_id ?? 0,
        es_publica: editing.es_publica,
      }
    : undefined;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Patrones de Actividad</h1>
          <p className="text-muted-foreground">
            Define patrones recurrentes para generar actividades automáticamente.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGenerarOpen(true)}>
              <CalendarPlus className="size-4" />
              Generar Instancias
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Nuevo Patrón
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por nombre o tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo Actividad</TableHead>
                  <TableHead className="hidden md:table-cell">Frecuencia</TableHead>
                  <TableHead className="hidden md:table-cell">Día</TableHead>
                  <TableHead className="hidden lg:table-cell">Hora</TableHead>
                  <TableHead className="hidden lg:table-cell">Duración</TableHead>
                  <TableHead className="hidden xl:table-cell">Grupo</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdmin && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  ['s1', 's2', 's3', 's4', 's5'].map((key) => (
                    <TableRow key={key}>
                      <TableCell colSpan={isAdmin ? 9 : 8}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 9 : 8}
                      className="h-24 text-center text-destructive"
                    >
                      Error al cargar los patrones. Intente nuevamente.
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center">
                      No se encontraron patrones.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((patron) => (
                    <TableRow key={patron.id} className={!patron.activo ? 'opacity-50' : undefined}>
                      <TableCell className="font-medium">{patron.nombre}</TableCell>
                      <TableCell>
                        {tiposMap.get(patron.tipo_actividad_id)?.nombre ?? patron.tipo_actividad_id}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {frecuenciaLabels[patron.frecuencia] ?? patron.frecuencia}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {diasSemanaLabels[patron.dia_semana] ?? patron.dia_semana}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatHora(patron.hora_inicio)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {patron.duracion_minutos} min
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {patron.grupo_id ? (gruposMap.get(patron.grupo_id)?.nombre ?? '—') : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={patron.activo ? 'success' : 'secondary'}>
                            {patron.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {patron.es_publica && <Badge variant="outline">Público</Badge>}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(patron)}>
                                <Pencil className="size-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleEstado(patron)}>
                                <Power className="size-4" />
                                {patron.activo ? 'Desactivar' : 'Activar'}
                              </DropdownMenuItem>
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
        </CardContent>
      </Card>

      <PatronFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={editingDefaults}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        tiposActividad={tiposActividad}
        grupos={grupos}
        isEditing={!!editing}
        patronesInactivos={patronesInactivos}
      />

      <GenerarInstanciasModal open={generarOpen} onOpenChange={setGenerarOpen} />

      <AlertDialog open={!!toggleConfirm} onOpenChange={(open) => !open && setToggleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleConfirm?.activo ? 'Desactivar patrón' : 'Activar patrón'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleConfirm?.activo
                ? `¿Desactivar "${toggleConfirm?.nombre}"? No se generarán nuevas instancias a partir de este patrón.`
                : `¿Activar "${toggleConfirm?.nombre}"? Se podrán volver a generar instancias desde este patrón.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleEstado}
              disabled={toggleMutation.isPending}
            >
              {toggleConfirm?.activo ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
