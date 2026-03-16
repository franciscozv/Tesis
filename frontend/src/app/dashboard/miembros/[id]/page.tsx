'use client';

import { ArrowLeft, ArrowRight, History, Pencil, UserMinus, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
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
import { useDesvincularMiembro } from '@/features/integrantes-grupo/hooks/use-desvincular-miembro';
import { useAsignacionesMiembro } from '@/features/integrantes-grupo/hooks/use-integraciones-miembro';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { useMiembro } from '@/features/miembros/hooks/use-miembros';
import type { EstadoComunion } from '@/features/miembros/types';
import { cn } from '@/lib/utils';

const estadoLabels: Record<EstadoComunion, string> = {
  asistente: 'Asistente',
  probando: 'Probando',
  plena_comunion: 'Plena Comunión',
};

const estadoVariant: Record<EstadoComunion, 'success' | 'secondary' | 'outline'> = {
  plena_comunion: 'success',
  probando: 'secondary',
  asistente: 'outline',
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
  const { data: comunions, isLoading: loadingComunions } = useAsignacionesMiembro(miembroId);
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  const { data: historial, isLoading: loadingHistorial } = useHistorialEstado(miembroId);
  const desvincularMutation = useDesvincularMiembro();
  const todas = comunions ?? [];
  const [comunionADesvincular, setComunionADesvincular] = useState<MiembroGrupo | null>(null);

  const historialOrdenado = historial
    ? [...historial].sort(
        (a, b) => new Date(b.fecha_cambio).getTime() - new Date(a.fecha_cambio).getTime(),
      )
    : [];

  function handleConfirmDesvincular() {
    if (!comunionADesvincular) return;
    desvincularMutation.mutate(comunionADesvincular.id, {
      onSuccess: () => {
        toast.success('Desvinculado del grupo exitosamente');
        setComunionADesvincular(null);
      },
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
            <h1 className="text-2xl font-light tracking-tight">
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
            <CardTitle className="text-base">Estado en la Iglesia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 py-2">
              <span className="text-muted-foreground text-sm">Estado</span>
              <span className="col-span-2">
                <Badge variant={estadoVariant[miembro.estado_comunion]}>
                  {estadoLabels[miembro.estado_comunion]}
                </Badge>
              </span>
            </div>
            <Separator />
            <InfoRow label="Fecha Ingreso" value={miembro.fecha_ingreso} />
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
          {loadingComunions ? (
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vinculación</TableHead>
                    <TableHead>Desvinculación</TableHead>
                    {isAdmin && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todas.map((mg) => {
                    const activo = !mg.fecha_desvinculacion;
                    return (
                      <TableRow key={mg.id} className={activo ? '' : 'opacity-60'}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/grupos/${mg.grupo.id}`}
                            className="hover:underline"
                          >
                            {mg.grupo.nombre}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{mg.rol.nombre}</Badge>
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
                        {isAdmin && (
                          <TableCell>
                            {activo && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setComunionADesvincular(mg)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Estados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" />
            Historial de Estados
            {historialOrdenado.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {historialOrdenado.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistorial ? (
            <div className="flex flex-col gap-4">
              {['a', 'b', 'c'].map((key) => (
                <div key={key} className="flex gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="size-3 rounded-full" />
                    <Skeleton className="h-12 w-px" />
                  </div>
                  <Skeleton className="mb-4 h-16 flex-1" />
                </div>
              ))}
            </div>
          ) : historialOrdenado.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No hay cambios de estado registrados.
            </p>
          ) : (
            <ol className="flex flex-col">
              {historialOrdenado.map((h, index) => {
                const isLast = index === historialOrdenado.length - 1;
                const dotColor: Record<EstadoComunion, string> = {
                  plena_comunion: 'bg-primary',
                  probando: 'bg-secondary-foreground/40',
                  asistente: 'bg-muted-foreground/40',
                };
                return (
                  <li key={h.id} className="flex gap-4">
                    {/* Línea + punto */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'mt-1 size-3 shrink-0 rounded-full ring-2 ring-background',
                          dotColor[h.estado_nuevo],
                        )}
                      />
                      {!isLast && <div className="bg-border w-px flex-1 my-1" />}
                    </div>

                    {/* Contenido */}
                    <div className={cn('flex flex-col gap-1 pb-6', isLast && 'pb-0')}>
                      {/* Transición de estados */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={estadoVariant[h.estado_anterior]}>
                          {estadoLabels[h.estado_anterior]}
                        </Badge>
                        <ArrowRight className="text-muted-foreground size-3 shrink-0" />
                        <Badge variant={estadoVariant[h.estado_nuevo]}>
                          {estadoLabels[h.estado_nuevo]}
                        </Badge>
                      </div>

                      {/* Fecha */}
                      <p className="text-muted-foreground text-xs">
                        {new Date(h.fecha_cambio).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {/* Motivo */}
                      {h.motivo && (
                        <p className="text-sm text-muted-foreground italic">"{h.motivo}"</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!comunionADesvincular}
        onOpenChange={(v) => {
          if (!v) setComunionADesvincular(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular del grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              {comunionADesvincular && (
                <>
                  ¿Está seguro que desea desvincular a{' '}
                  <span className="font-semibold text-foreground">
                    {miembro.nombre} {miembro.apellido}
                  </span>{' '}
                  del grupo{' '}
                  <span className="font-semibold text-foreground">
                    {comunionADesvincular.grupo.nombre}
                  </span>
                  ? Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={desvincularMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDesvincular}
              disabled={desvincularMutation.isPending}
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
