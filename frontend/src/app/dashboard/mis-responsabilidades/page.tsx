'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Eye, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
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
import { ResponderInvitacionModal } from '@/features/invitados/components/responder-invitacion-modal';
import type { Invitado } from '@/features/invitados/types';
import {
  MIS_RESPONSABILIDADES_KEY,
  useMisResponsabilidades,
} from '@/features/mis-responsabilidades/hooks/use-mis-responsabilidades';
import type { Responsabilidad } from '@/features/mis-responsabilidades/types';
import { cn } from '@/lib/utils';

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
    responsabilidad_id: r.rol?.id ?? 0,
    estado: r.estado_invitacion as Invitado['estado'],
    motivo_rechazo: null,
    asistio: false,
    fecha_invitacion: '',
    fecha_respuesta: null,
    actividad: r.actividad,
    rol: r.rol ? { id_responsabilidad: r.rol.id, nombre: r.rol.nombre } : undefined,
  };
}

type Respondiendo = { invitado: Invitado; accion: 'aceptar' | 'rechazar' };

export default function MisResponsabilidadesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Skeleton className="h-20 w-full mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      }
    >
      <MisResponsabilidadesContent />
    </Suspense>
  );
}

function MisResponsabilidadesContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const actividadIdParam = searchParams.get('actividadId');
  const invitadoIdParam = searchParams.get('invitadoId');
  const { data: responsabilidades, isLoading } = useMisResponsabilidades();

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [respondiendo, setRespondiendo] = useState<Respondiendo | null>(null);
  const [tabActual, setTabActual] = useState<'proximas' | 'historial'>('proximas');
  const [alertDismissed, setAlertDismissed] = useState(false);

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

  // Determinar la fila resaltada: invitadoId tiene prioridad sobre actividadId
  const resaltadaId = useMemo(() => {
    if (!responsabilidades) return null;
    if (invitadoIdParam) {
      const inv = parseInt(invitadoIdParam);
      return isNaN(inv) ? null : responsabilidades.find((r) => r.invitado_id === inv) ?? null;
    }
    if (actividadIdParam) {
      const act = parseInt(actividadIdParam);
      return isNaN(act) ? null : responsabilidades.find((r) => r.actividad.id === act) ?? null;
    }
    return null;
  }, [invitadoIdParam, actividadIdParam, responsabilidades]);

  // Reset alerta si cambia el param
  useEffect(() => {
    setAlertDismissed(false);
  }, [invitadoIdParam, actividadIdParam]);

  // Decidir pestaña y hacer scroll al elemento resaltado
  useEffect(() => {
    if (!resaltadaId || !responsabilidades) return;

    const enProximas = proximas.some((r) => r === resaltadaId);
    if (enProximas) {
      setTabActual('proximas');
    } else {
      const enHistorial = historial.some((r) => r === resaltadaId);
      if (enHistorial) setTabActual('historial');
    }

    const timer = setTimeout(() => {
      const element = document.getElementById(`resaltada-${resaltadaId.id}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
    return () => clearTimeout(timer);
  }, [resaltadaId, responsabilidades, proximas, historial]);

  function scrollToHighlighted() {
    if (!resaltadaId) return;
    const element = document.getElementById(`resaltada-${resaltadaId.id}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function filtrarPorFechas(items: Responsabilidad[]) {
    return items.filter((r) => {
      if (fechaDesde && r.actividad.fecha < fechaDesde) return false;
      if (fechaHasta && r.actividad.fecha > fechaHasta) return false;
      return true;
    });
  }

  function handleResponder(r: Responsabilidad, accion: 'aceptar' | 'rechazar') {
    setRespondiendo({ invitado: responsabilidadToInvitado(r), accion });
  }

  function handleResponderSuccess() {
    queryClient.invalidateQueries({ queryKey: [MIS_RESPONSABILIDADES_KEY] });
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-light tracking-tight">Mis Responsabilidades</h1>
        <p className="text-muted-foreground mt-1">
          Tus invitaciones confirmadas/pendientes y colaboraciones aceptadas en actividades.
        </p>
      </div>

      {/* Banner de navegación desde notificación */}
      {resaltadaId && !alertDismissed && (
        <Alert className="border-primary/30 bg-primary/5 py-3">
          <div className="flex items-center gap-3">
            <Bell className="size-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none">Invitación recibida</p>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {resaltadaId.actividad.nombre}
              </p>
            </div>
            <AlertDescription className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={scrollToHighlighted}
              >
                Ver fila
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setAlertDismissed(true)}
              >
                <X className="size-3.5" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid gap-1.5">
          <Label>Desde</Label>
          <div className="sm:w-44">
            <DatePicker value={fechaDesde} onChange={setFechaDesde} placeholder="Desde" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Hasta</Label>
          <div className="sm:w-44">
            <DatePicker value={fechaHasta} onChange={setFechaHasta} placeholder="Hasta" />
          </div>
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

      <Tabs value={tabActual} onValueChange={(v) => setTabActual(v as any)} className="min-w-0">
        <TabsList>
          <TabsTrigger value="proximas">Próximas ({proximas.length})</TabsTrigger>
          <TabsTrigger value="historial">Historial ({historial.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="proximas" className="mt-4">
          <ResponsabilidadesTable
            items={filtrarPorFechas(proximas)}
            isLoading={isLoading}
            resaltarProximos
            onResponder={handleResponder}
            resaltadaRowId={resaltadaId?.id}
          />
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <ResponsabilidadesTable
            items={filtrarPorFechas(historial)}
            isLoading={isLoading}
            resaltarProximos={false}
            onResponder={handleResponder}
            resaltadaRowId={resaltadaId?.id}
          />
        </TabsContent>
      </Tabs>

      <ResponderInvitacionModal
        invitado={respondiendo?.invitado ?? null}
        accion={respondiendo?.accion ?? 'aceptar'}
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
  resaltadaRowId,
}: {
  items: Responsabilidad[];
  isLoading: boolean;
  resaltarProximos: boolean;
  onResponder: (r: Responsabilidad, accion: 'aceptar' | 'rechazar') => void;
  resaltadaRowId?: number;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Actividad</TableHead>
              <TableHead>Rol / Necesidad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="hidden md:table-cell">Hora</TableHead>
              <TableHead className="hidden lg:table-cell">Grupo</TableHead>
              <TableHead className="hidden lg:table-cell">Tipo Actividad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-20" />
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
                const esResaltada = r.id === resaltadaRowId;
                const highlight =
                  !esResaltada && resaltarProximos && isProximos7Dias(r.actividad.fecha);
                const esPendiente =
                  r.tipo === 'invitacion' &&
                  r.estado_invitacion === 'pendiente' &&
                  r.actividad.estado === 'programada';

                return (
                  <TableRow
                    key={`${r.tipo}-${r.id}`}
                    id={esResaltada ? `resaltada-${r.id}` : undefined}
                    className={cn(
                      'transition-colors border-l-4',
                      esResaltada
                        ? 'bg-primary/5 border-l-primary'
                        : highlight
                          ? 'bg-muted/40 border-l-transparent'
                          : 'border-l-transparent',
                    )}
                  >
                    <TableCell>
                      <Badge variant={r.tipo === 'invitacion' ? 'info' : 'secondary'}>
                        {r.tipo === 'invitacion' ? 'Invitación' : 'Colaboración'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/actividades/${r.actividad.id}?origin=mis-responsabilidades`}
                        className="hover:underline"
                      >
                        {r.actividad.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {r.tipo === 'invitacion' ? (
                        <Badge variant="outline">{r.rol?.nombre ?? '—'}</Badge>
                      ) : (
                        <span className="text-sm">
                          {r.tipo_necesidad?.nombre ?? r.necesidad?.descripcion ?? '—'}
                          {r.cantidad_comprometida ? ` (${r.cantidad_comprometida})` : ''}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatFecha(r.actividad.fecha)}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap md:table-cell">
                      {formatHora(r.actividad.hora_inicio)} - {formatHora(r.actividad.hora_fin)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{r.grupo?.nombre ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {r.tipo_actividad.nombre}
                    </TableCell>
                    <TableCell>
                      {r.tipo === 'invitacion' ? (
                        <Badge
                          variant={
                            r.estado_invitacion === 'pendiente'
                              ? 'warning'
                              : r.estado_invitacion === 'cancelado'
                                ? 'destructive'
                                : 'success'
                          }
                        >
                          {r.estado_invitacion === 'pendiente'
                            ? 'Pendiente'
                            : r.estado_invitacion === 'cancelado'
                              ? 'Cancelado'
                              : 'Confirmado'}
                        </Badge>
                      ) : (
                        <Badge variant="success">Comprometido</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {esPendiente ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-success-foreground hover:bg-success hover:text-success-foreground"
                            title="Aceptar invitación"
                            onClick={() => onResponder(r, 'aceptar')}
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Rechazar invitación"
                            onClick={() => onResponder(r, 'rechazar')}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                          <Link
                            href={`/dashboard/actividades/${r.actividad.id}?origin=mis-responsabilidades`}
                          >
                            <Eye className="size-4" />
                            <span className="sr-only">Ver actividad</span>
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
