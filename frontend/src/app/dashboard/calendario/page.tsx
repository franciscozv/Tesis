'use client';

import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  Pencil,
  RefreshCw,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ActividadFormModal } from '@/features/actividades/components/actividad-form';
import { CambiarEstadoActividadModal } from '@/features/actividades/components/cambiar-estado-actividad-modal';
import { useActividades } from '@/features/actividades/hooks/use-actividades';
import { useCreateActividad } from '@/features/actividades/hooks/use-create-actividad';
import { useUpdateActividad } from '@/features/actividades/hooks/use-update-actividad';
import type { CreateActividadFormData } from '@/features/actividades/schemas';
import type { Actividad, ActividadFilters, EstadoActividad } from '@/features/actividades/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCalendarioConsolidado } from '@/features/calendario/hooks/use-calendario';
import type { CalendarioEvento } from '@/features/calendario/types';
import { tiposActividadHooks } from '@/features/catalogos/hooks';
import type { TipoActividad } from '@/features/catalogos/types';
import { useGrupos } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useGruposPermitidos } from '@/features/grupos-ministeriales/hooks/use-grupos-permitidos';
import { GenerarInstanciasModal } from '@/features/patrones-actividad/components/generar-instancias-modal';
import { cn } from '@/lib/utils';

dayjs.locale('es');
const localizer = dayjsLocalizer(dayjs);

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

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
  const prefix = evento.grupo_organizador ? `[${evento.grupo_organizador.nombre}] ` : '';
  return {
    id: evento.id,
    nombre: `${prefix}${evento.nombre}`,
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
  const isUsuario = !!usuario && !isAdmin;
  const isMobile = useIsMobile();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [soloPublicas, setSoloPublicas] = useState(false);
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | undefined>(undefined);

  const mes = currentDate.getMonth() + 1;
  const anio = currentDate.getFullYear();

  const filters: ActividadFilters = { mes, anio };
  if (soloPublicas) filters.es_publica = true;
  if (selectedGrupoId) filters.grupo_id = selectedGrupoId;

  const { data: actividadesAll } = useActividades(filters, { enabled: !!usuario && isAdmin });
  const { data: consolidado } = useCalendarioConsolidado(mes, anio, selectedGrupoId, {
    enabled: isUsuario,
  });
  
  const actividades = useMemo(
    () => (isUsuario ? (consolidado ?? []).map(toCalendarActividad) : (actividadesAll ?? [])),
    [isUsuario, consolidado, actividadesAll],
  );

  const { data: tiposActividad } = tiposActividadHooks.useAll();
  const { data: tiposActividadActivos } = tiposActividadHooks.useAllActivos();
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

  const gruposMap = useMemo(
    () => new Map(todosLosGrupos?.map((g) => [g.id_grupo, g])),
    [todosLosGrupos],
  );

  const events: CalendarEvent[] = useMemo(() => {
    if (!actividades) return [];
    return actividades.map((a) => {
      const start = new Date(`${a.fecha}T${a.hora_inicio}`);
      const end = new Date(`${a.fecha}T${a.hora_fin}`);
      // Asegurarnos que si es admin también tenga el prefijo
      const grupo = a.grupo_id ? gruposMap.get(a.grupo_id) : null;
      const prefix = grupo ? `[${grupo.nombre}] ` : '';
      const title = a.nombre.startsWith('[') ? a.nombre : `${prefix}${a.nombre}`;

      return {
        id: a.id,
        title,
        start,
        end,
        resource: a,
      };
    });
  }, [actividades, gruposMap]);

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

  const canCreate = isAdmin || (isUsuario && misGruposIds.size > 0);

  const handleSelectSlot = useCallback(
    ({ start }: { start: Date }) => {
      if (!canCreate) return;
      const fecha = dayjs(start).format('YYYY-MM-DD');
      setEditing(null);
      setFormDefaults({ fecha });
      setFormOpen(true);
    },
    [canCreate],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setDetalleActividad(event.resource);
    setDetalleOpen(true);
  }, []);

  function openEdit(actividad: Actividad) {
    setDetalleOpen(false);
    setEditing(actividad);
    // Limpiar el prefijo si existe para editar el nombre limpio
    const nombreLimpio = actividad.nombre.replace(/^\[.*?\]\s/, '');
    setFormDefaults({
      tipo_actividad_id: actividad.tipo_actividad_id,
      nombre: nombreLimpio,
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
          onSuccess: (creada) => {
            toast.success('Actividad creada exitosamente');
            setFormOpen(false);
            if (creada) {
              setCurrentDate(new Date(`${creada.fecha}T12:00:00`));
              setDetalleActividad(creada);
              setDetalleOpen(true);
            }
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
    (isUsuario && !!detalleActividad?.grupo_id && misGruposIds.has(detalleActividad.grupo_id));

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
        gruposPermitidos={gruposPermitidos}
        selectedGrupoId={selectedGrupoId}
        onGrupoChange={setSelectedGrupoId}
      />

      {isMobile ? (
        <div className="rounded-md border bg-background p-4">
          <MobileCalendarList
            events={events}
            currentDate={currentDate}
            tiposMap={tiposMap}
            gruposMap={gruposMap}
            onSelectEvent={handleSelectEvent}
            canCreate={canCreate}
            onAddActivity={(date) => {
              setEditing(null);
              setFormDefaults({ fecha: dayjs(date).format('YYYY-MM-DD') });
              setFormOpen(true);
            }}
          />
        </div>
      ) : (
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
            selectable={canCreate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            messages={messages}
            toolbar={false}
            style={{ height: 650 }}
            popup
          />
        </div>
      )}

      {actividades.length > 0 && <CalendarLegend actividades={actividades} tiposMap={tiposMap} />}

      <ActividadFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={formDefaults}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        tiposActividad={tiposActividadActivos}
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
        isAdmin={isAdmin}
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
  gruposPermitidos: any[] | undefined;
  selectedGrupoId: number | undefined;
  onGrupoChange: (id: number | undefined) => void;
}

function CalendarToolbar({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  soloPublicas,
  onSoloPublicasChange,
  gruposPermitidos,
  selectedGrupoId,
  onGrupoChange,
}: CalendarToolbarProps) {
  const checkboxId = useId();
  const label = dayjs(currentDate).format(
    view === 'month' ? 'MMMM YYYY' : view === 'week' ? 'D MMM - ' : 'dddd D [de] MMMM YYYY',
  );

  const weekEnd = view === 'week' ? dayjs(currentDate).endOf('week').format('D MMM YYYY') : '';

  // Combobox para filtrar por grupo
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredGroups = useMemo(() => {
    if (!gruposPermitidos) return [];
    return gruposPermitidos.filter((g) =>
      g.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [gruposPermitidos, searchTerm]);

  const selectedGrupo = gruposPermitidos?.find((g) => g.id_grupo === selectedGrupoId);

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

      <div className="flex items-center gap-3 flex-wrap">
        {/* Selector de Grupo Inteligente */}
        {(gruposPermitidos?.length ?? 0) > 0 && (
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                role="combobox"
                aria-expanded={openCombobox}
                className="justify-between min-w-[150px]"
              >
                {selectedGrupoId ? selectedGrupo?.nombre : 'Todos los grupos'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="end">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Buscar grupo..."
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto p-1">
                <div
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    !selectedGrupoId && 'bg-accent text-accent-foreground',
                  )}
                  onClick={() => {
                    onGrupoChange(undefined);
                    setOpenCombobox(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', !selectedGrupoId ? 'opacity-100' : 'opacity-0')}
                  />
                  Ver todos los grupos
                </div>
                {filteredGroups.map((g) => (
                  <div
                    key={g.id_grupo}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      selectedGrupoId === g.id_grupo && 'bg-accent text-accent-foreground',
                    )}
                    onClick={() => {
                      onGrupoChange(g.id_grupo);
                      setOpenCombobox(false);
                      setSearchTerm('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedGrupoId === g.id_grupo ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {g.nombre}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <div className="flex items-center gap-2 border-l pl-3 ml-1">
          <Checkbox
            id={checkboxId}
            checked={soloPublicas}
            onCheckedChange={(checked) => onSoloPublicasChange(!!checked)}
          />
          <Label htmlFor={checkboxId} className="text-xs whitespace-nowrap">
            Solo públicas
          </Label>
        </div>

        <div className="hidden lg:flex rounded-md border">
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
  isAdmin: boolean;
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
  isAdmin,
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

  // Limpiar el prefijo para mostrar el nombre limpio en el modal
  const nombreLimpio = actividad.nombre.replace(/^\[.*?\]\s/, '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{nombreLimpio}</DialogTitle>
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
              <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                {grupoNombre}
              </Badge>
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
            <Button variant="outline" size="sm" onClick={() => onEdit(actividad)}>
              <Pencil className="size-4" />
              Editar
            </Button>
          )}
          {(canManageActividad && actividad.estado !== 'cancelada') ||
          (isAdmin && actividad.estado === 'cancelada') ? (
            <Button variant="outline" size="sm" onClick={() => onCambiarEstado(actividad)}>
              <RefreshCw className="size-4" />
              Estado
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Mobile List View ---

interface MobileCalendarListProps {
  events: CalendarEvent[];
  currentDate: Date;
  tiposMap: Map<number, TipoActividad>;
  gruposMap: Map<number, any>;
  onSelectEvent: (event: CalendarEvent) => void;
  canCreate: boolean;
  onAddActivity: (date: Date) => void;
}

function MobileCalendarList({
  events,
  currentDate,
  tiposMap,
  gruposMap,
  onSelectEvent,
  canCreate,
  onAddActivity,
}: MobileCalendarListProps) {
  const today = dayjs();
  const monthStart = dayjs(currentDate).startOf('month');
  const monthEnd = dayjs(currentDate).endOf('month');

  const monthEvents = events.filter((e) => {
    const d = dayjs(e.start);
    return d.isAfter(monthStart.subtract(1, 'day')) && d.isBefore(monthEnd.add(1, 'day'));
  });

  // Group by day key
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of monthEvents) {
      const key = dayjs(event.start).format('YYYY-MM-DD');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, currentDate]);

  const sortedDays = [...grouped.keys()].sort();

  if (sortedDays.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">No hay actividades este mes.</p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {sortedDays.map((dayKey) => {
        const dayEvents = grouped.get(dayKey)!;
        const dayjsDate = dayjs(dayKey);
        const isToday = dayjsDate.isSame(today, 'day');

        return (
          <div key={dayKey}>
            {/* Day header */}
            <div className="mb-2 flex items-center gap-3">
              <div
                className={cn(
                  'flex size-9 shrink-0 flex-col items-center justify-center rounded-full text-xs font-bold leading-none',
                  isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <span className="uppercase" style={{ fontSize: '0.6rem' }}>
                  {dayjsDate.format('ddd')}
                </span>
                <span className="text-sm">{dayjsDate.format('D')}</span>
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-sm font-semibold capitalize',
                    isToday ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {dayjsDate.format('dddd')}
                </span>
                <span className="text-muted-foreground text-xs capitalize">
                  {dayjsDate.format('D [de] MMMM [de] YYYY')}
                </span>
              </div>
              {canCreate && (
                <button
                  onClick={() => onAddActivity(dayjsDate.toDate())}
                  className="text-muted-foreground hover:text-foreground ml-auto text-xs underline-offset-2 hover:underline"
                >
                  + Agregar
                </button>
              )}
            </div>

            {/* Events */}
            <div className="flex flex-col gap-2 pl-12">
              {dayEvents
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .map((event) => {
                  const tipo = tiposMap.get(event.resource.tipo_actividad_id);
                  const color = tipo?.color ?? estadoColors[event.resource.estado];
                  const isCancelled = event.resource.estado === 'cancelada';
                  const grupo = event.resource.grupo_id ? gruposMap.get(event.resource.grupo_id) : null;

                  return (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent w-full',
                        isCancelled && 'opacity-60',
                      )}
                    >
                      {/* Color bar */}
                      <div
                        className="mt-0.5 w-1 self-stretch shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                           <p className="truncate text-sm font-medium">{event.title.replace(/^\[.*?\]\s/, '')}</p>
                           {grupo && (
                             <Badge variant="secondary" className="px-1 py-0 text-[9px] h-3.5 leading-none">
                               {grupo.nombre}
                             </Badge>
                           )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {formatHora(event.resource.hora_inicio)} –{' '}
                          {formatHora(event.resource.hora_fin)}
                          {event.resource.lugar && ` · ${event.resource.lugar}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          event.resource.estado === 'programada'
                            ? 'default'
                            : event.resource.estado === 'realizada'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="ml-auto shrink-0 text-xs"
                      >
                        {estadoLabels[event.resource.estado]}
                      </Badge>
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
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
          <span
            className="inline-block size-3 shrink-0 rounded-full"
            style={{ backgroundColor: t.color }}
          />
          <span className="text-muted-foreground">{t.nombre}</span>
        </div>
      ))}
    </div>
  );
}
