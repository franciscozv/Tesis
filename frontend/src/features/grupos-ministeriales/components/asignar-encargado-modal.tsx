'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMiembros } from '@/features/miembros/hooks/use-miembros';
import { useAsignarEncargado } from '../hooks/use-asignar-encargado';

const schema = z.object({
  nuevo_miembro_id: z.number().int().positive('Debe seleccionar un miembro'),
  fecha: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AsignarEncargadoModalProps {
  grupoId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AsignarEncargadoModal({ grupoId, open, onOpenChange }: AsignarEncargadoModalProps) {
  const { data: miembros } = useMiembros();
  const mutation = useAsignarEncargado();

  const miembrosActivos = miembros?.filter((m) => m.activo) ?? [];

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nuevo_miembro_id: 0,
      fecha: new Date().toISOString().split('T')[0],
    },
  });

  function onSubmit(data: FormData) {
    mutation.mutate(
      { id: grupoId, input: data },
      {
        onSuccess: () => {
          toast.success('Encargado asignado exitosamente');
          onOpenChange(false);
          form.reset();
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message ?? 'Error al asignar encargado';
          toast.error(msg);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar / Cambiar Encargado</DialogTitle>
          <DialogDescription>
            El encargado vigente será cerrado automáticamente con la fecha indicada.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="nuevo_miembro_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo Encargado *</FormLabel>
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
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de vigencia</FormLabel>
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
                {mutation.isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
