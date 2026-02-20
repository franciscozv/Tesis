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
import { useCambiarEstado } from '../hooks/use-cambiar-estado';
import { type CambiarEstadoFormData, cambiarEstadoSchema } from '../schemas';
import type { Miembro } from '../types';

interface CambiarEstadoModalProps {
  miembro: Miembro | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CambiarEstadoModal({ miembro, open, onOpenChange }: CambiarEstadoModalProps) {
  const mutation = useCambiarEstado();

  const form = useForm<CambiarEstadoFormData>({
    resolver: zodResolver(cambiarEstadoSchema),
    defaultValues: {
      estado_nuevo: 'sin_membresia',
      motivo: '',
    },
  });

  useEffect(() => {
    if (open && miembro) {
      form.reset({
        estado_nuevo: miembro.estado_membresia,
        motivo: '',
      });
    }
  }, [open, miembro, form]);

  function onSubmit(data: CambiarEstadoFormData) {
    if (!miembro) return;
    mutation.mutate(
      { id: miembro.id, input: data },
      {
        onSuccess: () => {
          toast.success('Estado actualizado exitosamente');
          onOpenChange(false);
        },
        onError: () => {
          toast.error('Error al cambiar el estado');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Estado de Membresía</DialogTitle>
          <DialogDescription>
            {miembro ? `${miembro.nombre} ${miembro.apellido}` : ''}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="estado_nuevo"
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
                      <SelectItem value="sin_membresia">Sin Membresía</SelectItem>
                      <SelectItem value="probando">Probando</SelectItem>
                      <SelectItem value="plena_comunion">Plena Comunión</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo del cambio *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Aprobado por el consejo en reunión..." {...field} />
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
                Cambiar Estado
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
