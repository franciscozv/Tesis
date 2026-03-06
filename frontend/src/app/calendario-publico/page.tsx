'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Actividad } from '@/features/actividades/types';
import type { ApiResponse } from '@/features/auth/types';
import publicApiClient from '@/lib/public-api-client';

dayjs.locale('es');
const localizer = dayjsLocalizer(dayjs);

const messages = {
  today: 'Hoy',
  previous: 'Anterior',
  next: 'Siguiente',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay actividades en este rango.',
  showMore: (count: number) => `+${count} más`,
};

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Actividad;
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

function formatFechaLarga(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

async function fetchPublicas() {
  const { data } = await publicApiClient.get<ApiResponse<Actividad[]>>('/actividades/publicas');
  return data.responseObject;
}

export default function CalendarioPublicoPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleActividad, setDetalleActividad] = useState<Actividad | null>(null);

  const { data: actividades, isLoading } = useQuery({
    queryKey: ['actividades-publicas'],
    queryFn: fetchPublicas,
    staleTime: 5 * 60 * 1000,
  });

  const events: CalendarEvent[] = useMemo(() => {
    if (!actividades) return [];
    return actividades.map((a) => ({
      id: a.id,
      title: a.nombre,
      start: new Date(`${a.fecha}T${a.hora_inicio}`),
      end: new Date(`${a.fecha}T${a.hora_fin}`),
      resource: a,
    }));
  }, [actividades]);

  const eventStyleGetter = useCallback((_event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: '#3b82f6',
        borderRadius: '4px',
        color: '#fff',
        border: 'none',
        fontSize: '0.8rem',
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setDetalleActividad(event.resource);
    setDetalleOpen(true);
  }, []);

  function handleNavigate(action: 'PREV' | 'NEXT' | 'TODAY') {
    const d = dayjs(currentDate);
    if (action === 'PREV') setCurrentDate(d.subtract(1, 'month').toDate());
    else if (action === 'NEXT') setCurrentDate(d.add(1, 'month').toDate());
    else setCurrentDate(new Date());
  }

  const monthLabel = dayjs(currentDate).format('MMMM YYYY');

  // Mobile: group events by date for the current month
  const currentMonthEvents = useMemo(() => {
    const start = dayjs(currentDate).startOf('month');
    const end = dayjs(currentDate).endOf('month');
    return events
      .filter((e) => {
        const d = dayjs(e.start);
        return d.isAfter(start.subtract(1, 'day')) && d.isBefore(end.add(1, 'day'));
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, currentDate]);

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-primary" />
            <span className="text-lg font-semibold">IEP Santa Juana</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/login">
              <LogIn className="size-4" />
              Iniciar sesión
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Calendario de Actividades Públicas</h1>
          <p className="text-muted-foreground">Actividades abiertas a la comunidad.</p>
        </div>

        {/* Navigation */}
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => handleNavigate('PREV')}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleNavigate('TODAY')}>
            Hoy
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => handleNavigate('NEXT')}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="ml-2 text-lg font-semibold capitalize">{monthLabel}</span>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-[500px] w-full rounded-md" />
          </div>
        ) : (
          <>
            {/* Desktop calendar */}
            <div className="calendar-wrapper hidden rounded-md border bg-background p-2 sm:block">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                date={currentDate}
                view="month"
                onNavigate={setCurrentDate}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                messages={messages}
                toolbar={false}
                style={{ height: 550 }}
                popup
              />
            </div>

            {/* Mobile card list */}
            <div className="grid gap-3 sm:hidden">
              {currentMonthEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CalendarIcon className="mx-auto mb-3 size-10 text-muted-foreground" />
                    <p className="text-muted-foreground">No hay actividades públicas este mes.</p>
                  </CardContent>
                </Card>
              ) : (
                currentMonthEvents.map((ev) => {
                  const a = ev.resource;
                  return (
                    <Card
                      key={a.id}
                      className="cursor-pointer transition-colors hover:bg-accent"
                      onClick={() => {
                        setDetalleActividad(a);
                        setDetalleOpen(true);
                      }}
                    >
                      <CardContent className="flex items-center gap-4 py-3">
                        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-md bg-primary text-primary-foreground">
                          <span className="text-lg font-bold leading-none">
                            {dayjs(a.fecha).format('DD')}
                          </span>
                          <span className="text-[10px] uppercase leading-none">
                            {dayjs(a.fecha).format('MMM')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-tight">{a.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatHora(a.hora_inicio)} - {formatHora(a.hora_fin)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* Detail modal (read-only) */}
      <DetallePublicoModal
        actividad={detalleActividad}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
      />
    </div>
  );
}

// --- Read-only detail modal ---

function DetallePublicoModal({
  actividad,
  open,
  onOpenChange,
}: {
  actividad: Actividad | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!actividad) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{actividad.nombre}</DialogTitle>
          <DialogDescription>{formatFechaLarga(actividad.fecha)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Horario</span>
            <span>
              {formatHora(actividad.hora_inicio)} - {formatHora(actividad.hora_fin)}
            </span>
          </div>
          {actividad.descripcion && (
            <div>
              <span className="text-muted-foreground">Descripción</span>
              <p className="mt-1">{actividad.descripcion}</p>
            </div>
          )}
          <Badge variant="outline" className="w-fit">
            Actividad Pública
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}

