'use client';

import { ClipboardList, Eye, MoreHorizontal, Reply } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
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
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ResponderInvitacionModal } from '@/features/invitados/components/responder-invitacion-modal';
import type { Invitado } from '@/features/invitados/types';
import {
  MIS_RESPONSABILIDADES_KEY,
  useMisResponsabilidades,
} from '@/features/mis-responsabilidades/hooks/use-mis-responsabilidades';
import type { Responsabilidad } from '@/features/mis-responsabilidades/types';

function formatFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

function getHoy() {
  return new Date().toISOString().slice(0, 10);
}

function isProximos7Dias(fecha: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const target = new Date(`${fecha}T12:00:00`);
  const diff = target.getTime() - hoy.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function responsabilidadToInvitado(r: Responsabilidad): Invitado {
  return {
    id: r.invitado_id!,
    actividad_id: r.actividad.id,
    miembro_id: 0,
    rol_id: r.rol?.id ?? 0,
    estado: r.estado_invitacion as Invitado['estado'],
    motivo_rechazo: null,
    asistio: false,
    fecha_invitacion: '',
    fecha_respuesta: null,
  };
}

export default function MisResponsabilidadesPage() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const { data: responsabilidades, isLoading } = useMisResponsabilidades();

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [respondiendo, setRespondiendo] = useState<Invitado | null>(null);

  const hoy = getHoy();

  const proximas = useMemo(() => {
    if (!responsabilidades) return [];
    return responsabilidades.filter(
      (r) => r.actividad.fecha >= hoy && r.actividad.estado === 'programada',
    );
  }, [responsabilidades, hoy]);

  const historial = useMemo(() => {
    if (!responsabilidades) return [];
    return responsabilidades.filter(
      (r) => r.actividad.fecha < hoy || r.actividad.estado !== 'programada',
    );
  }, [responsabilidades, hoy]);

  function filtrarPorFechas(items: Responsabilidad[]) {
    return items.filter((r) => {
      if (fechaDesde && r.actividad.fecha < fechaDesde) return false;
      if (fechaHasta && r.actividad.fecha > fechaHasta) return false;
      return true;
    });
  }

  function handleResponderSuccess() {
    queryClient.invalidateQueries({ queryKey: [MIS_RESPONSABILIDADES_KEY] });
  }

  if (!usuario?.miembro_id) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mis Responsabilidades</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Tu usuario no tiene un miembro asociado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <div className="flex items-center gap-3">
          <ClipboardList className="size-6" />
          <h1 className="text-2xl font-bold tracking-tight">Mis Responsabilidades</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Tus invitaciones confirmadas/pendientes y colaboraciones aceptadas en actividades.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="fecha-desde">Desde</Label>
          <Input
            id="fecha-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="sm:w-44"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fecha-hasta">Hasta</Label>
          <Input
            id="fecha-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="sm:w-44"
          />
        </div>
        {(fechaDesde || fechaHasta) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFechaDesde('');
              setFechaHasta('');
            }}
          >
            Limpiar fechas
          </Button>
        )}
      </div>

      <Tabs defaultValue="proximas">
        <TabsList>
          <TabsTrigger value="proximas">
            Proximas ({proximas.length})
          </TabsTrigger>
          <TabsTrigger value="historial">
            Historial ({historial.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proximas" className="mt-4">
          <ResponsabilidadesTable
            items={filtrarPorFechas(proximas)}
            isLoading={isLoading}
            resaltarProximos
            onResponder={(r) => setRespondiendo(responsabilidadToInvitado(r))}
          />
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <ResponsabilidadesTable
            items={filtrarPorFechas(historial)}
            isLoading={isLoading}
            resaltarProximos={false}
            onResponder={(r) => setRespondiendo(responsabilidadToInvitado(r))}
          />
        </TabsContent>
      </Tabs>

      <ResponderInvitacionModal
        invitado={respondiendo}
        open={!!respondiendo}
        onOpenChange={(open) => {
          if (!open) {
            setRespondiendo(null);
            handleResponderSuccess();
          }
        }}
      />
    </div>
  );
}

function ResponsabilidadesTable({
  items,
  isLoading,
  resaltarProximos,
  onResponder,
}: {
  items: Responsabilidad[];
  isLoading: boolean;
  resaltarProximos: boolean;
  onResponder: (r: Responsabilidad) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Actividad</TableHead>
            <TableHead className="hidden md:table-cell">Rol / Necesidad</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="hidden md:table-cell">Hora</TableHead>
            <TableHead className="hidden lg:table-cell">Grupo</TableHead>
            <TableHead className="hidden lg:table-cell">Tipo Actividad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            ['s1', 's2', 's3', 's4', 's5'].map((key) => (
              <TableRow key={key}>
                <TableCell colSpan={9}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : !items.length ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No se encontraron responsabilidades.
              </TableCell>
            </TableRow>
          ) : (
            items.map((r) => {
              const highlight =
                resaltarProximos && isProximos7Dias(r.actividad.fecha);

              return (
                <TableRow
                  key={`${r.tipo}-${r.id}`}
                  className={highlight ? 'bg-blue-50 dark:bg-blue-950/20' : undefined}
                >
                  <TableCell>
                    <Badge variant={r.tipo === 'invitacion' ? 'default' : 'secondary'}>
                      {r.tipo === 'invitacion' ? 'Invitacion' : 'Colaboracion'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/actividades/${r.actividad.id}`}
                      className="hover:underline"
                    >
                      {r.actividad.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {r.tipo === 'invitacion' ? (
                      <Badge variant="outline">{r.rol?.nombre ?? '—'}</Badge>
                    ) : (
                      <span className="text-sm">
                        {r.tipo_necesidad?.nombre ?? r.necesidad?.descripcion ?? '—'}
                        {r.cantidad_ofrecida ? ` (${r.cantidad_ofrecida})` : ''}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatFecha(r.actividad.fecha)}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell">
                    {formatHora(r.actividad.hora_inicio)} - {formatHora(r.actividad.hora_fin)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {r.grupo?.nombre ?? '—'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {r.tipo_actividad.nombre}
                  </TableCell>
                  <TableCell>
                    {r.tipo === 'invitacion' ? (
                      <Badge
                        variant={
                          r.estado_invitacion === 'pendiente' ? 'default' : 'secondary'
                        }
                      >
                        {r.estado_invitacion === 'pendiente' ? 'Pendiente' : 'Confirmado'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Aceptada</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/actividades/${r.actividad.id}`}>
                            <Eye className="size-4" />
                            Ver actividad
                          </Link>
                        </DropdownMenuItem>
                        {r.tipo === 'invitacion' && r.estado_invitacion === 'pendiente' && (
                          <DropdownMenuItem onClick={() => onResponder(r)}>
                            <Reply className="size-4" />
                            Responder
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
