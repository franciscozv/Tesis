'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCambiarEstadoActividad } from '../hooks/use-cambiar-estado-actividad';
import { type CambiarEstadoActividadFormData, cambiarEstadoActividadSchema } from '../schemas';
import type { Actividad } from '../types';

const estadoLabels: Record<string, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

interface CambiarEstadoActividadModalProps {
  actividad: Actividad | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CambiarEstadoActividadModal({
  actividad,
  open,
  onOpenChange,
}: CambiarEstadoActividadModalProps) {
  const mutation = useCambiarEstadoActividad();

  const form = useForm<CambiarEstadoActividadFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: refine creates input type mismatch with zodResolver
    resolver: zodResolver(cambiarEstadoActividadSchema) as any,
    defaultValues: {
      estado: actividad?.estado ?? 'programada',
      motivo_cancelacion: '',
    },
  });

  useEffect(() => {
    if (open && actividad) {
      form.reset({
        estado: actividad.estado,
        motivo_cancelacion: '',
      });
    }
  }, [open, actividad, form]);

  const estadoSeleccionado = form.watch('estado');

  function onSubmit(data: CambiarEstadoActividadFormData) {
    if (!actividad) return;
    mutation.mutate(
      { id: actividad.id, input: data },
      {
        onSuccess: () => {
          toast.success(`Estado cambiado a ${estadoLabels[data.estado]}`);
          onOpenChange(false);
        },
        onError: () => toast.error('Error al cambiar el estado'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Estado de Actividad</DialogTitle>
          <DialogDescription>{actividad?.nombre}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuevo Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="realizada">Realizada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {estadoSeleccionado === 'cancelada' && (
              <FormField
                control={form.control}
                name="motivo_cancelacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de Cancelación *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describa el motivo de la cancelación..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                Cambiar Estado
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
