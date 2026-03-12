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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCambiarEstadoActividad } from '../hooks/use-cambiar-estado-actividad';
import { type CambiarEstadoActividadFormData, cambiarEstadoActividadSchema } from '../schemas';
import type { Actividad, EstadoActividad } from '../types';

const estadoLabels: Record<string, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

function getOpcionesDisponibles(
  actividad: Actividad | null,
  isAdmin: boolean,
): { value: EstadoActividad; label: string }[] {
  if (!actividad) return [];

  // La fecha+hora_fin determina si la actividad ya ocurrió
  const isPast = new Date(`${actividad.fecha}T${actividad.hora_fin}`) <= new Date();

  switch (actividad.estado) {
    case 'programada':
      // "Realizada" es automática (sistema la transiciona); solo se puede cancelar manualmente
      return [{ value: 'cancelada', label: 'Cancelada' }];

    case 'realizada':
      // Solo admin puede cancelar una actividad ya realizada (corrección administrativa)
      if (isAdmin) return [{ value: 'cancelada', label: 'Cancelada' }];
      return [];

    case 'cancelada':
      if (!isAdmin) return [];
      // Futura → se puede reprogramar; pasada → se puede marcar como realizada
      if (!isPast) return [{ value: 'programada', label: 'Programada' }];
      return [{ value: 'realizada', label: 'Realizada' }];

    default:
      return [];
  }
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
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  const opciones = useMemo(() => getOpcionesDisponibles(actividad, isAdmin), [actividad, isAdmin]);

  const form = useForm<CambiarEstadoActividadFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: refine creates input type mismatch with zodResolver
    resolver: zodResolver(cambiarEstadoActividadSchema) as any,
    defaultValues: {
      estado: opciones[0]?.value ?? 'cancelada',
      motivo_cancelacion: '',
    },
  });

  useEffect(() => {
    if (open && actividad && opciones.length > 0) {
      form.reset({
        estado: opciones[0].value,
        motivo_cancelacion: '',
      });
    }
  }, [open, actividad, opciones, form]);

  const estadoSeleccionado = form.watch('estado');

  function onSubmit(data: CambiarEstadoActividadFormData) {
    if (!actividad) return;
    const input: { estado: typeof data.estado; motivo_cancelacion?: string } = {
      estado: data.estado,
    };
    if (data.estado === 'cancelada' && data.motivo_cancelacion) {
      input.motivo_cancelacion = data.motivo_cancelacion;
    }
    mutation.mutate(
      { id: actividad.id, input },
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

        {opciones.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No hay transiciones de estado disponibles para esta actividad.
          </p>
        ) : (
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
                        {opciones.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
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
                        <Textarea
                          placeholder="Describa el motivo de la cancelación..."
                          {...field}
                        />
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
        )}
      </DialogContent>
    </Dialog>
  );
}
