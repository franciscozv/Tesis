'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Info, Loader2, ShieldCheck, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ApiResponse } from '@/features/auth/types';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useMiembros } from '@/features/miembros/hooks/use-miembros';
import { useIntegrantesGrupo } from '../hooks/use-integrantes-grupo';
import { useRolesGrupo } from '../hooks/use-roles-grupo';
import { useVincularMiembro } from '../hooks/use-vincular-miembro';
import { type VincularMiembroFormData, vincularMiembroSchema } from '../schemas';

interface VincularMiembroModalProps {
  grupoId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VincularMiembroModal({ grupoId, open, onOpenChange }: VincularMiembroModalProps) {
  const { usuario } = useAuth();
  const { data: miembros } = useMiembros();
  const { data: miembrosGrupo } = useIntegrantesGrupo(grupoId);
  const { data: roles } = useRolesGrupo();
  const mutation = useVincularMiembro();

  const esAdmin = usuario?.rol === 'administrador';
  const miembrosYaEnGrupo = new Set((miembrosGrupo ?? []).map((m) => m.miembro_id));
  const miembrosActivos = (miembros?.filter((m) => m.activo) ?? []).filter(
    (m) => !miembrosYaEnGrupo.has(m.id),
  );
  const rolesActivos = (roles?.filter((r) => r.activo) ?? []).filter(
    (r) => esAdmin || !r.es_directiva,
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
        },
        onError: (err: any) => {
          const backendMsg = (err?.response?.data as ApiResponse | undefined)?.message;
          toast.error(backendMsg || 'Error al vincular miembro');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular Miembro al Grupo</DialogTitle>
          <DialogDescription>
            Seleccione un miembro y asigne un rol dentro del grupo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {!esAdmin && (
              <Alert className="py-2 px-3 border-blue-300 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200">
                <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-sm font-semibold">Cargos de Directiva</AlertTitle>
                <AlertDescription className="text-xs">
                  Los cargos de directiva están reservados para la administración general.
                </AlertDescription>
              </Alert>
            )}
            {mostrarAdvertenciaPlenaComunion && (
              <Alert variant="destructive" className="py-2 px-3 border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200">
                <Info className="size-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-sm font-semibold">Aviso de Requisito</AlertTitle>
                <AlertDescription className="text-xs">
                  Este rol requiere que el miembro tenga <strong>Plena Comunión</strong>.
                  El miembro seleccionado actualmente es <strong>{selectedMiembro?.estado_comunion.replace('_', ' ')}</strong>.
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="miembro_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Miembro *</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar miembro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {miembrosActivos.length === 0 && (
                        <SelectItem value="-1" disabled>
                          No hay miembros disponibles para vincular
                        </SelectItem>
                      )}
                      {miembrosActivos.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{m.nombre} {m.apellido}</span>
                            <Badge variant="outline" className="text-[10px] h-4 py-0 font-normal">
                              {m.estado_comunion.replace('_', ' ')}
                            </Badge>
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
                              {r.es_directiva && (
                                <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                                  <ShieldCheck className="size-2.5" />
                                  Directiva
                                </Badge>
                              )}
                              {r.es_unico && (
                                <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none">
                                  <UserCheck className="size-2.5" />
                                  Único
                                </Badge>
                              )}
                              {r.requiere_plena_comunion && (
                                <Badge variant="secondary" className="px-1 py-0 text-[10px] h-4 flex items-center gap-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none">
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
                <FormItem>
                  <FormLabel>Fecha de Vinculación *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                Vincular
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


