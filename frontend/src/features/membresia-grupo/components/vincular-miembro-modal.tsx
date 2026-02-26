'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
import { useMiembros } from '@/features/miembros/hooks/use-miembros';
import { useMembresiasGrupo } from '../hooks/use-membresias-grupo';
import { useRolesGrupo } from '../hooks/use-roles-grupo';
import { useVincularMiembro } from '../hooks/use-vincular-miembro';
import { type VincularMiembroFormData, vincularMiembroSchema } from '../schemas';

interface VincularMiembroModalProps {
  grupoId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VincularMiembroModal({ grupoId, open, onOpenChange }: VincularMiembroModalProps) {
  const { data: miembros } = useMiembros();
  const { data: miembrosGrupo } = useMembresiasGrupo(grupoId);
  const { data: roles } = useRolesGrupo();
  const mutation = useVincularMiembro();

  const miembrosYaEnGrupo = new Set((miembrosGrupo ?? []).map((m) => m.miembro_id));
  const miembrosActivos = (miembros?.filter((m) => m.activo) ?? []).filter(
    (m) => !miembrosYaEnGrupo.has(m.id),
  );
  const rolesActivos =
    roles?.filter((r) => r.activo && r.nombre?.toLowerCase() !== 'encargado') ?? [];

  const form = useForm<VincularMiembroFormData>({
    resolver: zodResolver(vincularMiembroSchema),
    defaultValues: {
      miembro_id: 0,
      rol_grupo_id: 0,
      fecha_vinculacion: new Date().toISOString().split('T')[0],
    },
  });

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular Miembro al Grupo</DialogTitle>
          <DialogDescription>
            Seleccione un miembro y asigne un rol dentro del grupo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                          {m.nombre} {m.apellido}
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
                          {r.nombre}
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
