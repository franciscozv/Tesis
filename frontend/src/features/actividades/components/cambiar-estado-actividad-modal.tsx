'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useCambiarEstadoActividad } from '../hooks/use-cambiar-estado-actividad';
import { type CambiarEstadoActividadFormData, cambiarEstadoActividadSchema } from '../schemas';
import type { Actividad, EstadoActividad } from '../types';

function esEstadoTerminal(estado: EstadoActividad): boolean {
  return estado === 'cancelada' || estado === 'realizada';
}

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

  const puedeCancelar = useMemo(
    () => !!actividad && actividad.estado === 'programada',
    [actividad],
  );

  const form = useForm<CambiarEstadoActividadFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: refine creates input type mismatch with zodResolver
    resolver: zodResolver(cambiarEstadoActividadSchema) as any,
    defaultValues: {
      estado: 'cancelada',
      motivo_cancelacion: '',
    },
  });

  useEffect(() => {
    if (open && actividad && puedeCancelar) {
      form.reset({
        estado: 'cancelada',
        motivo_cancelacion: '',
      });
    }
  }, [open, actividad, puedeCancelar, form]);

  function onSubmit(data: CambiarEstadoActividadFormData) {
    if (!actividad) return;
    const input: { estado: 'cancelada'; motivo_cancelacion?: string } = {
      estado: 'cancelada',
    };
    if (data.motivo_cancelacion) {
      input.motivo_cancelacion = data.motivo_cancelacion;
    }
    mutation.mutate(
      { id: actividad.id, input },
      {
        onSuccess: () => {
          toast.success('Actividad cancelada');
          onOpenChange(false);
        },
        onError: () => toast.error('Error al cancelar la actividad'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar actividad</DialogTitle>
          <DialogDescription>{actividad?.nombre}</DialogDescription>
        </DialogHeader>

        {!puedeCancelar ? (
          <p className="py-2 text-sm text-muted-foreground">
            {actividad && esEstadoTerminal(actividad.estado)
              ? 'Esta actividad ya está finalizada o cancelada.'
              : 'No se puede cancelar esta actividad.'}
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="animate-spin" />}
                  Cancelar actividad
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
