'use client';

import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useId, useMemo, useState } from 'react';
import { Calendar, dayjsLocalizer, type View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ActividadFormModal } from '@/features/actividades/components/actividad-form';
import { CambiarEstadoActividadModal } from '@/features/actividades/components/cambiar-estado-actividad-modal';
import { useActividades } from '@/features/actividades/hooks/use-actividades';
import { useCreateActividad } from '@/features/actividades/hooks/use-create-actividad';
import { useUpdateActividad } from '@/features/actividades/hooks/use-update-actividad';
import type { CreateActividadFormData } from '@/features/actividades/schemas';
import type { Actividad, ActividadFilters, EstadoActividad } from '@/features/actividades/types';
import { useCalendarioConsolidado } from '@/features/calendario/hooks/use-calendario';
import type { CalendarioEvento } from '@/features/calendario/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { tiposActividadHooks } from '@/features/catalogos/hooks';
import type { TipoActividad } from '@/features/catalogos/types';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useGruposPermitidos } from '@/features/grupos-ministeriales/hooks/use-grupos-permitidos';
import { GenerarInstanciasModal } from '@/features/patrones-actividad/components/generar-instancias-modal';

dayjs.locale('es');
const localizer = dayjsLocalizer(dayjs);

const estadoLabels: Record<EstadoActividad, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

const estadoColors: Record<EstadoActividad, string> = {
  programada: '#3b82f6',
  realizada: '#22c55e',
  cancelada: '#ef4444',
};

// Convierte CalendarioEvento (consolidado) al shape Actividad que usa el calendario
function toCalendarActividad(evento: CalendarioEvento): Actividad {
  return {
    id: evento.id,
    nombre: evento.nombre,
    tipo_actividad_id: evento.tipo_actividad.id,
    tipo_actividad: null,
    fecha: evento.fecha,
    hora_inicio: evento.hora_inicio,
    hora_fin: evento.hora_fin,
    lugar: evento.lugar ?? '',
    grupo_id: evento.grupo_organizador?.id ?? null,
    descripcion: null,
    es_publica: false,
    estado: 'programada',
    motivo_cancelacion: null,
    patron_id: null,
    creador_id: 0,
    fecha_creacion: '',
  };
}

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

export default function CalendarioPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const isAdminOrLider = isAdmin || usuario?.rol === 'lider';
  const isMember = !!usuario && !isAdminOrLider;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [soloPublicas, setSoloPublicas] = useState(false);

  const mes = currentDate.getMonth() + 1;
  const anio = currentDate.getFullYear();

  const filters: ActividadFilters = { mes, anio };
  if (soloPublicas) filters.es_publica = true;

  const { data: actividadesAll } = useActividades(filters, { enabled: !!usuario && isAdminOrLider });
  const { data: consolidado } = useCalendarioConsolidado(mes, anio, { enabled: isMember });
  const actividades = useMemo(
    () => (isMember ? (consolidado ?? []).map(toCalendarActividad) : (actividadesAll ?? [])),
    [isMember, consolidado, actividadesAll],
  );
  const { data: tiposActividad } = tiposActividadHooks.useAll();
  const { data: todosLosGrupos } = useGrupos();
  const { grupos: gruposPermitidos, misGruposIds } = useGruposPermitidos();

  const createMutation = useCreateActividad();
  const updateMutation = useUpdateActividad();

  const [formOpen, setFormOpen] = useState(false);
  const [formDefaults, setFormDefaults] = useState<Partial<CreateActividadFormData> | undefined>();
  const [editing, setEditing] = useState<Actividad | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleActividad, setDetalleActividad] = useState<Actividad | null>(null);
  const [estadoModal, setEstadoModal] = useState<Actividad | null>(null);
  const [generarOpen, setGenerarOpen] = useState(false);

  const tiposMap = useMemo(
    () => new Map(tiposActividad?.map((t) => [t.id_tipo, t])),
    [tiposActividad],
  );

  const gruposMap = useMemo(() => new Map(todosLosGrupos?.map((g) => [g.id_grupo, g])), [todosLosGrupos]);

  const events: CalendarEvent[] = useMemo(() => {
    if (!actividades) return [];
    return actividades.map((a) => {
      const start = new Date(`${a.fecha}T${a.hora_inicio}`);
      const end = new Date(`${a.fecha}T${a.hora_fin}`);
      return {
        id: a.id,
        title: a.nombre,
        start,
        end,
        resource: a,
      };
    });
  }, [actividades]);

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const actividad = event.resource;
      const bgColor =
        tiposMap.get(actividad.tipo_actividad_id)?.color ??
        actividad.tipo_actividad?.color ??
        estadoColors[actividad.estado];
      const opacity = actividad.estado === 'cancelada' ? 0.5 : 1;

      return {
        style: {
          backgroundColor: bgColor,
          borderRadius: '4px',
          opacity,
          color: '#fff',
          border: 'none',
          fontSize: '0.8rem',
        },
      };
    },
    [tiposMap],
  );

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date }) => {
      if (!isAdminOrLider) return;
      const fecha = dayjs(start).format('YYYY-MM-DD');
      setEditing(null);
      setFormDefaults({ fecha });
      setFormOpen(true);
    },
    [isAdminOrLider],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setDetalleActividad(event.resource);
    setDetalleOpen(true);
  }, []);

  function openEdit(actividad: Actividad) {
    setDetalleOpen(false);
    setEditing(actividad);
    setFormDefaults({
      tipo_actividad_id: actividad.tipo_actividad_id,
      nombre: actividad.nombre,
      descripcion: actividad.descripcion ?? '',
      fecha: actividad.fecha,
      hora_inicio: formatHora(actividad.hora_inicio),
      hora_fin: formatHora(actividad.hora_fin),
      lugar: actividad.lugar,
      grupo_id: actividad.grupo_id ?? 0,
      es_publica: actividad.es_publica,
    });
    setFormOpen(true);
  }

  function openEstadoModal(actividad: Actividad) {
    setDetalleOpen(false);
    setEstadoModal(actividad);
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

  function handleNavigate(action: 'PREV' | 'NEXT' | 'TODAY') {
    const d = dayjs(currentDate);
    if (action === 'PREV') {
      setCurrentDate(
        view === 'month'
          ? d.subtract(1, 'month').toDate()
          : view === 'week'
            ? d.subtract(1, 'week').toDate()
            : d.subtract(1, 'day').toDate(),
      );
    } else if (action === 'NEXT') {
      setCurrentDate(
        view === 'month'
          ? d.add(1, 'month').toDate()
          : view === 'week'
            ? d.add(1, 'week').toDate()
            : d.add(1, 'day').toDate(),
      );
    } else {
      setCurrentDate(new Date());
    }
  }

  const canManageDetalleActividad =
    isAdmin ||
    (isAdminOrLider &&
      !!detalleActividad?.grupo_id &&
      misGruposIds.has(detalleActividad.grupo_id));

  const detalleTipo = detalleActividad
    ? (tiposMap.get(detalleActividad.tipo_actividad_id) ??
        (detalleActividad.tipo_actividad
          ? ({
              id_tipo: detalleActividad.tipo_actividad_id,
              nombre: detalleActividad.tipo_actividad.nombre,
              color: detalleActividad.tipo_actividad.color,
              activo: false,
              descripcion: null,
              created_at: '',
              updated_at: '',
            } satisfies TipoActividad)
          : undefined))
    : undefined;
  const detalleGrupo = detalleActividad?.grupo_id
    ? gruposMap.get(detalleActividad.grupo_id)
    : undefined;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">Vista de actividades de la iglesia.</p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setGenerarOpen(true)}>
            <CalendarPlus className="size-4" />
            Generar Instancias
          </Button>
        )}
      </div>

      <CalendarToolbar
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
        soloPublicas={soloPublicas}
        onSoloPublicasChange={setSoloPublicas}
      />

      <div className="calendar-wrapper rounded-md border bg-background p-2">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={view}
          onNavigate={setCurrentDate}
          onView={setView}
          selectable={isAdminOrLider}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          toolbar={false}
          style={{ height: 650 }}
          popup
        />
      </div>

      {actividades.length > 0 && <CalendarLegend actividades={actividades} tiposMap={tiposMap} />}

      <ActividadFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={formDefaults}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        tiposActividad={tiposActividad}
        grupos={gruposPermitidos}
        isEditing={!!editing}
      />

      <DetalleRapidoModal
        actividad={detalleActividad}
        open={detalleOpen}
        onOpenChange={setDetalleOpen}
        tipo={detalleTipo}
        grupoNombre={detalleGrupo?.nombre}
        canManageActividad={canManageDetalleActividad}
        onEdit={openEdit}
        onCambiarEstado={openEstadoModal}
      />

      <CambiarEstadoActividadModal
        actividad={estadoModal}
        open={!!estadoModal}
        onOpenChange={(open) => !open && setEstadoModal(null)}
      />

      <GenerarInstanciasModal open={generarOpen} onOpenChange={setGenerarOpen} />
    </div>
  );
}

// --- Toolbar ---

interface CalendarToolbarProps {
  currentDate: Date;
  view: View;
  onViewChange: (view: View) => void;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  soloPublicas: boolean;
  onSoloPublicasChange: (val: boolean) => void;
}

function CalendarToolbar({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  soloPublicas,
  onSoloPublicasChange,
}: CalendarToolbarProps) {
  const checkboxId = useId();
  const label = dayjs(currentDate).format(
    view === 'month' ? 'MMMM YYYY' : view === 'week' ? 'D MMM - ' : 'dddd D [de] MMMM YYYY',
  );

  const weekEnd = view === 'week' ? dayjs(currentDate).endOf('week').format('D MMM YYYY') : '';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => onNavigate('PREV')}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')}>
          Hoy
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => onNavigate('NEXT')}>
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-2 text-lg font-semibold capitalize">
          {label}
          {weekEnd}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={checkboxId}
            checked={soloPublicas}
            onCheckedChange={(checked) => onSoloPublicasChange(!!checked)}
          />
          <Label htmlFor={checkboxId} className="text-sm">
            Solo públicas
          </Label>
        </div>

        <div className="flex rounded-md border">
          {(['month', 'week', 'day'] as const).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none first:rounded-l-md last:rounded-r-md"
              onClick={() => onViewChange(v)}
            >
              {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Detalle Rápido ---

interface DetalleRapidoModalProps {
  actividad: Actividad | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoActividad | undefined;
  grupoNombre: string | undefined;
  canManageActividad: boolean;
  onEdit: (a: Actividad) => void;
  onCambiarEstado: (a: Actividad) => void;
}

function DetalleRapidoModal({
  actividad,
  open,
  onOpenChange,
  tipo,
  grupoNombre,
  canManageActividad,
  onEdit,
  onCambiarEstado,
}: DetalleRapidoModalProps) {
  if (!actividad) return null;

  const fecha = new Date(`${actividad.fecha}T12:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{actividad.nombre}</DialogTitle>
          <DialogDescription>{fecha}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tipo</span>
            <span className="flex items-center gap-2">
              {tipo && (
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: tipo.color }}
                />
              )}
              {tipo?.nombre ?? actividad.tipo_actividad_id}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Horario</span>
            <span>
              {formatHora(actividad.hora_inicio)} - {formatHora(actividad.hora_fin)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Lugar</span>
            <span>{actividad.lugar}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estado</span>
            <Badge
              variant={
                actividad.estado === 'programada'
                  ? 'default'
                  : actividad.estado === 'realizada'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {estadoLabels[actividad.estado]}
            </Badge>
          </div>
          {grupoNombre && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Grupo</span>
              <span>{grupoNombre}</span>
            </div>
          )}
          {actividad.descripcion && (
            <div>
              <span className="text-muted-foreground">Descripción</span>
              <p className="mt-1">{actividad.descripcion}</p>
            </div>
          )}
          {actividad.es_publica && (
            <Badge variant="outline" className="w-fit">
              Pública
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/actividades/${actividad.id}?origin=calendar`}>
              <Eye className="size-4" />
              Ver detalle
            </Link>
          </Button>
          {canManageActividad && actividad.estado !== 'cancelada' && (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit(actividad)}>
                <Pencil className="size-4" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onCambiarEstado(actividad)}>
                <RefreshCw className="size-4" />
                Estado
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Legend ---

function CalendarLegend({
  actividades,
  tiposMap,
}: {
  actividades: Actividad[];
  tiposMap: Map<number, TipoActividad>;
}) {
  const tiposEnPeriodo = useMemo(() => {
    const seen = new Set<number>();
    const result: TipoActividad[] = [];
    for (const a of actividades) {
      const tipo = tiposMap.get(a.tipo_actividad_id);
      if (tipo && !seen.has(tipo.id_tipo)) {
        seen.add(tipo.id_tipo);
        result.push(tipo);
      }
    }
    return result;
  }, [actividades, tiposMap]);

  if (!tiposEnPeriodo.length) return null;

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {tiposEnPeriodo.map((t) => (
        <div key={t.id_tipo} className="flex items-center gap-1.5">
          <span className="inline-block size-3 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
          <span className="text-muted-foreground">{t.nombre}</span>
        </div>
      ))}
    </div>
  );
}
