'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { RolActividad } from '@/features/catalogos/types';
import type { Miembro } from '@/features/miembros/types';
import { useCreateInvitado } from '../hooks/use-invitados-actividad';

const invitarSchema = z.object({
  miembro_id: z.coerce.number().int().positive('Seleccione un miembro'),
  rol_id: z.coerce.number().int().positive('Seleccione un rol'),
  confirmado: z.boolean().default(false),
});

type InvitarFormData = z.infer<typeof invitarSchema>;

interface InvitarParticipanteModalProps {
  actividadId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  miembros: Miembro[] | undefined;
  rolesActividad: RolActividad[] | undefined;
  defaultValues?: { miembro_id?: number; rol_id?: number };
}

export function InvitarParticipanteModal({
  actividadId,
  open,
  onOpenChange,
  miembros,
  rolesActividad,
  defaultValues,
}: InvitarParticipanteModalProps) {
  const mutation = useCreateInvitado();

  const form = useForm<InvitarFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(invitarSchema) as any,
    defaultValues: {
      miembro_id: 0,
      rol_id: 0,
      confirmado: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        miembro_id: defaultValues?.miembro_id ?? 0,
        rol_id: defaultValues?.rol_id ?? 0,
        confirmado: false,
      });
    }
  }, [open, defaultValues, form]);

  function onSubmit(data: InvitarFormData) {
    mutation.mutate(
      {
        actividad_id: actividadId,
        miembro_id: data.miembro_id,
        rol_id: data.rol_id,
        confirmado: data.confirmado,
      },
      {
        onSuccess: () => {
          toast.success('Participante invitado exitosamente');
          onOpenChange(false);
          form.reset();
        },
        onError: () => toast.error('Error al invitar participante'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar Participante</DialogTitle>
          <DialogDescription>Seleccione un miembro y asígnele un rol.</DialogDescription>
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
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar miembro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {miembros?.map((m) => (
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
              name="rol_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rolesActividad?.map((r) => (
                        <SelectItem key={r.id_rol} value={String(r.id_rol)}>
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
              name="confirmado"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">
                    Registrar como confirmado directamente
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                Invitar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
