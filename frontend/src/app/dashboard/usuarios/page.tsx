'use client';

import { Pencil, Plus, Power, ShieldCheck } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMiembrosPaginated } from '@/features/miembros/hooks/use-miembros';
import { UsuarioFormModal } from '@/features/usuarios/components/usuario-form-modal';
import {
  useCambiarEstadoUsuario,
  useCreateUsuario,
  useUpdateUsuario,
  useUsuarios,
} from '@/features/usuarios/hooks/use-usuarios';
import type { CreateUsuarioFormData, UpdateUsuarioFormData } from '@/features/usuarios/schemas';
import type { Usuario } from '@/features/usuarios/types';

const rolLabels: Record<string, string> = {
  administrador: 'Administrador',
  usuario: 'Usuario',
};

const rolVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  administrador: 'default',
  usuario: 'secondary',
};

export default function UsuariosPage() {
  const { data: usuarios, isLoading } = useUsuarios();
  const { data: miembrosData } = useMiembrosPaginated({ page: 1, limit: 100 });
  const miembros = miembrosData?.data;
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const estadoMutation = useCambiarEstadoUsuario();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [toggling, setToggling] = useState<Usuario | null>(null);

  const miembrosMap = useMemo(() => new Map(miembros?.map((m) => [m.id, m])), [miembros]);

  function handleCreate(data: CreateUsuarioFormData) {
    const input = {
      email: data.email,
      password: data.password,
      rol: data.rol,
      miembro_id: data.miembro_id && data.miembro_id > 0 ? data.miembro_id : undefined,
    };
    createMutation.mutate(input, {
      onSuccess: () => {
        toast.success('Usuario creado exitosamente');
        setFormOpen(false);
      },
      onError: () => toast.error('Error al crear usuario'),
    });
  }

  function handleUpdate(data: UpdateUsuarioFormData) {
    if (!editing) return;
    updateMutation.mutate(
      { id: editing.id, input: data },
      {
        onSuccess: () => {
          toast.success('Usuario actualizado');
          setFormOpen(false);
          setEditing(null);
        },
        onError: () => toast.error('Error al actualizar usuario'),
      },
    );
  }

  function handleToggleEstado() {
    if (!toggling) return;
    estadoMutation.mutate(
      { id: toggling.id, input: { activo: !toggling.activo } },
      {
        onSuccess: () => {
          toast.success(toggling.activo ? 'Usuario desactivado' : 'Usuario activado');
          setToggling(null);
        },
        onError: () => toast.error('Error al cambiar estado'),
      },
    );
  }

  function openEdit(usuario: Usuario) {
    setEditing(usuario);
    setFormOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de cuentas de acceso al sistema.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Nuevo Usuario
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            {['a', 'b', 'c', 'd', 'e'].map((key) => (
              <Skeleton key={key} className="mb-3 h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : !usuarios?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-muted-foreground">No hay usuarios registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Miembro vinculado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead className="w-28">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => {
                  const miembro = u.miembro_id ? miembrosMap.get(u.miembro_id) : null;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={rolVariant[u.rol]}>{rolLabels[u.rol]}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {miembro
                          ? `${miembro.nombre} ${miembro.apellido}`
                          : u.miembro_id
                            ? `#${u.miembro_id}`
                            : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.activo ? 'default' : 'destructive'}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.ultimo_acceso
                          ? new Date(u.ultimo_acceso).toLocaleDateString('es-CL', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(u)}
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setToggling(u)}
                            title={u.activo ? 'Desactivar' : 'Activar'}
                          >
                            <Power
                              className={`size-4 ${u.activo ? 'text-destructive' : 'text-green-600'}`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <UsuarioFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
        miembros={miembros}
        isPending={createMutation.isPending || updateMutation.isPending}
        onCreateSubmit={handleCreate}
        onUpdateSubmit={handleUpdate}
      />

      <AlertDialog open={!!toggling} onOpenChange={(open) => !open && setToggling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggling?.activo ? 'Desactivar usuario' : 'Activar usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggling?.activo
                ? `¿Está seguro de desactivar a ${toggling.email}? No podrá iniciar sesión.`
                : `¿Activar a ${toggling?.email}? Podrá volver a iniciar sesión.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleEstado} disabled={estadoMutation.isPending}>
              {toggling?.activo ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
