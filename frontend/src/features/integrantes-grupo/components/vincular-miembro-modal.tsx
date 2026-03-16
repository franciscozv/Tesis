'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronsUpDown,
  Info,
  Loader2,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { ApiResponse } from '@/features/auth/types';
import { useMiembros } from '@/features/miembros/hooks/use-miembros';
import { cn } from '@/lib/utils';
import { useAsignacionesMiembro } from '../hooks/use-integraciones-miembro';
import { useIntegrantesGrupo } from '../hooks/use-integrantes-grupo';
import { useRolesHabilitadosEnGrupo } from '@/features/grupo-rol/hooks/use-grupo-rol';
import { useVincularMiembro } from '../hooks/use-vincular-miembro';
import { type VincularMiembroFormData, vincularMiembroSchema } from '../schemas';

interface VincularMiembroModalProps {
  grupoId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si es true, solo muestra roles donde es_directiva=false (para la sección Nómina) */
  soloNoDirectiva?: boolean;
}

export function VincularMiembroModal({
  grupoId,
  open,
  onOpenChange,
  soloNoDirectiva = false,
}: VincularMiembroModalProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [openCombobox, setOpenCombobox] = React.useState(false);

  const { usuario } = useAuth();
  const { data: miembros, isLoading: isLoadingMiembros } = useMiembros();
  const { data: miembrosGrupo } = useIntegrantesGrupo(grupoId);
  const { data: roles } = useRolesHabilitadosEnGrupo(grupoId);
  const mutation = useVincularMiembro();

  const esAdmin = usuario?.rol === 'administrador';
  const miembrosYaEnGrupo = new Set((miembrosGrupo ?? []).map((m) => m.miembro_id));
  const miembrosActivos = (miembros?.filter((m) => m.activo) ?? []).filter(
    (m) => !miembrosYaEnGrupo.has(m.id),
  );

  const miembrosFiltrados = miembrosActivos.filter((m) => {
    const fullSearch = `${m.nombre} ${m.apellido}`.toLowerCase();
    return fullSearch.includes(searchTerm.toLowerCase());
  });

  const rolesActivos = (roles?.filter((r) => r.activo) ?? []).filter((r) =>
    soloNoDirectiva ? !r.es_directiva : esAdmin || !r.es_directiva,
  );

  const form = useForm<VincularMiembroFormData>({
    resolver: zodResolver(vincularMiembroSchema),
    defaultValues: {
      miembro_id: 0,
      rol_grupo_id: 0,
      fecha_vinculacion: new Date().toISOString().split('T')[0],
    },
  });

  const selectedMiembroId = form.watch('miembro_id');
  const selectedRolId = form.watch('rol_grupo_id');

  const selectedMiembro = miembrosActivos.find((m) => m.id === selectedMiembroId);
  const selectedRol = rolesActivos.find((r) => r.id_rol_grupo === selectedRolId);

  const { data: asignacionesMiembro } = useAsignacionesMiembro(selectedMiembroId);
  const membresiasActivas = (asignacionesMiembro ?? []).filter(
    (mg) => mg.fecha_desvinculacion === null,
  );
  const mostrarAdvertenciaVinculacion = selectedMiembroId > 0 && membresiasActivas.length > 0;

  const mostrarAdvertenciaPlenaComunion =
    selectedRol?.requiere_plena_comunion &&
    selectedMiembro &&
    selectedMiembro.estado_comunion !== 'plena_comunion';

  function onSubmit(data: VincularMiembroFormData) {
    mutation.mutate(
      {
        ...data,
        grupo_id: grupoId,
        fecha_vinculacion: new Date(data.fecha_vinculacion).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success('Miembro vinculado exitosamente');
          onOpenChange(false);
          form.reset();
          setSearchTerm('');
        },
        onError: (err: any) => {
          const backendMsg = (err?.response?.data as ApiResponse | undefined)?.message;
          toast.error(backendMsg || 'Error al vincular miembro');
        },
      },
    );
  }

  // Limpiar búsqueda al abrir/cerrar modal
  React.useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setOpenCombobox(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Integrante</DialogTitle>
          <DialogDescription>
            Busque un miembro y asígnele un rol de nómina en el grupo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {!esAdmin && !soloNoDirectiva && (
              <Alert className="py-2 px-3 border-blue-300 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200">
                <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-sm font-semibold">Cargos de Directiva</AlertTitle>
                <AlertDescription className="text-xs">
                  Los cargos de directiva están reservados para la administración general.
                </AlertDescription>
              </Alert>
            )}
            {mostrarAdvertenciaPlenaComunion && (
              <Alert
                variant="destructive"
                className="py-2 px-3 border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
              >
                <Info className="size-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-sm font-semibold">Aviso de Requisito</AlertTitle>
                <AlertDescription className="text-xs">
                  Este rol requiere que el miembro tenga <strong>Plena Comunión</strong>. El miembro
                  seleccionado actualmente es{' '}
                  <strong>{selectedMiembro?.estado_comunion.replace('_', ' ')}</strong>.
                </AlertDescription>
              </Alert>
            )}
            {mostrarAdvertenciaVinculacion && (
              <Alert className="py-2 px-3 border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-sm font-semibold">Vinculación Activa</AlertTitle>
                <AlertDescription className="text-xs">
                  Este miembro ya está activo en{' '}
                  {membresiasActivas.length === 1 ? 'un grupo' : `${membresiasActivas.length} grupos`}
                  :{' '}
                  <strong>{membresiasActivas.map((mg) => mg.grupo.nombre).join(', ')}</strong>.
                  La vinculación múltiple está permitida.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="miembro_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Miembro *</FormLabel>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className={cn(
                            'w-full justify-between font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                          disabled={isLoadingMiembros}
                        >
                          {field.value
                            ? `${selectedMiembro?.nombre} ${selectedMiembro?.apellido}`
                            : 'Buscar miembro por nombre...'}
                          {isLoadingMiembros ? (
                            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          placeholder="Escriba para buscar..."
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                        {miembrosFiltrados.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No se encontraron miembros disponibles.
                          </div>
                        ) : (
                          miembrosFiltrados.map((m) => (
                            <div
                              key={m.id}
                              className={cn(
                                'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                                field.value === m.id && 'bg-accent text-accent-foreground',
                              )}
                              onClick={() => {
                                form.setValue('miembro_id', m.id);
                                setOpenCombobox(false);
                                setSearchTerm('');
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  field.value === m.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="font-medium">
                                  {m.nombre} {m.apellido}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-4 py-0 font-normal bg-muted/50"
                                >
                                  {m.estado_comunion.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rol_grupo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en el Grupo *</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rolesActivos.map((r) => (
                        <SelectItem key={r.id_rol_grupo} value={String(r.id_rol_grupo)}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm">{r.nombre}</span>
                            <div className="flex flex-wrap gap-1">
                              {r.es_unico && (
                                <Badge
                                  variant="secondary"
                                  className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none"
                                >
                                  <UserCheck className="size-2.5" />
                                  Único
                                </Badge>
                              )}
                              {r.requiere_plena_comunion && (
                                <Badge
                                  variant="secondary"
                                  className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none"
                                >
                                  <BadgeCheck className="size-2.5" />
                                  Plena Comunión
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fecha_vinculacion"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Vinculación *</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabledDays={(date) => date > new Date()}
                    toYear={new Date().getFullYear()}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Vincular
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
