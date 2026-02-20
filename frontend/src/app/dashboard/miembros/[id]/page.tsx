'use client';

import { ArrowLeft, History, Pencil, UserMinus, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { useHistorialEstado } from '@/features/historial-estado/hooks/use-historial-estado';
import { useDesvincularMiembro } from '@/features/membresia-grupo/hooks/use-desvincular-miembro';
import { useMembresiaseMiembro } from '@/features/membresia-grupo/hooks/use-membresias-miembro';
import { useMiembro } from '@/features/miembros/hooks/use-miembros';
import type { EstadoMembresia } from '@/features/miembros/types';

const estadoLabels: Record<EstadoMembresia, string> = {
  sin_membresia: 'Sin Membresía',
  probando: 'Probando',
  plena_comunion: 'Plena Comunión',
};

const estadoVariant: Record<EstadoMembresia, 'default' | 'secondary' | 'outline'> = {
  plena_comunion: 'default',
  probando: 'secondary',
  sin_membresia: 'outline',
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm">{value || '—'}</span>
    </div>
  );
}

export default function DetalleMiembroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const miembroId = Number(id);
  const { data: miembro, isLoading } = useMiembro(miembroId);
  const { data: membresias, isLoading: loadingMembresias } = useMembresiaseMiembro(miembroId);
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const isAdminOrLider = isAdmin || usuario?.rol === 'lider';

  const { data: historial, isLoading: loadingHistorial } = useHistorialEstado(miembroId);
  const desvincularMutation = useDesvincularMiembro();
  const todas = membresias ?? [];

  const historialOrdenado = historial
    ? [...historial].sort(
        (a, b) => new Date(b.fecha_cambio).getTime() - new Date(a.fecha_cambio).getTime(),
      )
    : [];

  function handleDesvincular(membresiaId: number) {
    desvincularMutation.mutate(membresiaId, {
      onSuccess: () => toast.success('Desvinculado del grupo exitosamente'),
      onError: () => toast.error('Error al desvincular'),
    });
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((key) => (
              <Skeleton key={key} className="mb-3 h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!miembro) {
    return <p className="text-muted-foreground py-8 text-center">Miembro no encontrado.</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/miembros">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {miembro.nombre} {miembro.apellido}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">{miembro.rut}</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/miembros/${miembro.id}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información Personal</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Nombre" value={`${miembro.nombre} ${miembro.apellido}`} />
            <Separator />
            <InfoRow label="RUT" value={miembro.rut} />
            <Separator />
            <InfoRow label="Email" value={miembro.email} />
            <Separator />
            <InfoRow label="Teléfono" value={miembro.telefono} />
            <Separator />
            <InfoRow label="Dirección" value={miembro.direccion} />
            <Separator />
            <InfoRow label="Fecha Nacimiento" value={miembro.fecha_nacimiento} />
            <Separator />
            <InfoRow
              label="Género"
              value={
                miembro.genero ? (miembro.genero === 'masculino' ? 'Masculino' : 'Femenino') : null
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Membresía</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 py-2">
              <span className="text-muted-foreground text-sm">Estado</span>
              <span className="col-span-2">
                <Badge variant={estadoVariant[miembro.estado_membresia]}>
                  {estadoLabels[miembro.estado_membresia]}
                </Badge>
              </span>
            </div>
            <Separator />
            <InfoRow label="Fecha Ingreso" value={miembro.fecha_ingreso} />
            <Separator />
            <InfoRow label="Bautizado" value={miembro.bautizado ? 'Sí' : 'No'} />
            <Separator />
            <InfoRow label="Activo" value={miembro.activo ? 'Sí' : 'No'} />
            <Separator />
            <InfoRow
              label="Registrado"
              value={new Date(miembro.created_at).toLocaleDateString('es-CL')}
            />
            <Separator />
            <InfoRow
              label="Última actualización"
              value={new Date(miembro.updated_at).toLocaleDateString('es-CL')}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersRound className="size-4" />
            Grupos ({todas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMembresias ? (
            <div className="grid gap-2">
              {['a', 'b', 'c'].map((key) => (
                <Skeleton key={key} className="h-8 w-full" />
              ))}
            </div>
          ) : todas.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Este miembro no tiene historial de grupos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vinculación</TableHead>
                  <TableHead>Desvinculación</TableHead>
                  {isAdminOrLider && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {todas.map((mg) => {
                  const activo = !mg.fecha_desvinculacion;
                  return (
                    <TableRow key={mg.id} className={activo ? '' : 'opacity-60'}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/grupos/${mg.grupo.id}`} className="hover:underline">
                          {mg.grupo.nombre}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {mg.rol.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={activo ? 'default' : 'outline'}>
                          {activo ? 'Activo' : 'Desvinculado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(mg.fecha_vinculacion).toLocaleDateString('es-CL')}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {mg.fecha_desvinculacion
                          ? new Date(mg.fecha_desvinculacion).toLocaleDateString('es-CL')
                          : '—'}
                      </TableCell>
                      {isAdminOrLider && (
                        <TableCell>
                          {activo && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDesvincular(mg.id)}
                              disabled={desvincularMutation.isPending}
                            >
                              <UserMinus className="size-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Historial de Estados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Historial de Estados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistorial ? (
            <div className="grid gap-2">
              {['a', 'b', 'c'].map((key) => (
                <Skeleton key={key} className="h-8 w-full" />
              ))}
            </div>
          ) : historialOrdenado.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No hay cambios de estado registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado Anterior</TableHead>
                  <TableHead>Estado Nuevo</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialOrdenado.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(h.fecha_cambio).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant[h.estado_anterior]}>
                        {estadoLabels[h.estado_anterior]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoVariant[h.estado_nuevo]}>
                        {estadoLabels[h.estado_nuevo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] text-sm">{h.motivo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
