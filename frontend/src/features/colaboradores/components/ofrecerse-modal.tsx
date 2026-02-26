'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import type { NecesidadLogistica } from '@/features/necesidades/types';
import { useOfrecerColaboracion } from '../hooks/use-ofrecer-colaboracion';
import { type OfrecerColaboracionFormData, ofrecerColaboracionSchema } from '../schemas';

function formatFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

interface OfrecerseModalProps {
  necesidad: NecesidadLogistica | null;
  miembroId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfrecerseModal({ necesidad, miembroId, open, onOpenChange }: OfrecerseModalProps) {
  const mutation = useOfrecerColaboracion();

  const faltante = necesidad ? necesidad.cantidad_requerida - necesidad.cantidad_cubierta : 0;
  const progreso = necesidad
    ? Math.round((necesidad.cantidad_cubierta / necesidad.cantidad_requerida) * 100)
    : 0;

  const form = useForm<OfrecerColaboracionFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(ofrecerColaboracionSchema) as any,
    defaultValues: {
      cantidad_ofrecida: 1,
      observaciones: '',
    },
  });

  function onSubmit(data: OfrecerColaboracionFormData) {
    if (!necesidad) return;
    if (data.cantidad_ofrecida > faltante) {
      form.setError('cantidad_ofrecida', {
        message: `No puede exceder la cantidad faltante (${faltante})`,
      });
      return;
    }
    mutation.mutate(
      {
        necesidad_id: necesidad.id,
        miembro_id: miembroId,
        cantidad_ofrecida: data.cantidad_ofrecida,
        ...(data.observaciones ? { observaciones: data.observaciones } : {}),
      },
      {
        onSuccess: () => {
          toast.success('Oferta de colaboración registrada');
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.status === 409) {
            toast.error(error.response.data.message || 'Esta oferta ya fue registrada.');
          } else {
            toast.error('Error al registrar la oferta.');
          }
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ofrecerse como Colaborador</DialogTitle>
          <DialogDescription>
            {necesidad?.actividad
              ? `${necesidad.actividad.nombre} · ${formatFecha(necesidad.actividad.fecha)}, ${formatHora(necesidad.actividad.hora_inicio)}`
              : (necesidad?.descripcion ?? 'Registre su oferta de colaboración para esta necesidad.')}
          </DialogDescription>
        </DialogHeader>

        {necesidad && (
          <div className="grid gap-3 rounded-md border p-3 text-sm">
            {necesidad.actividad && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actividad</span>
                  <span className="font-medium text-right">{necesidad.actividad.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha y hora</span>
                  <span>
                    {formatFecha(necesidad.actividad.fecha)} ·{' '}
                    {formatHora(necesidad.actividad.hora_inicio)}–
                    {formatHora(necesidad.actividad.hora_fin)}
                  </span>
                </div>
                {necesidad.actividad.lugar && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lugar</span>
                    <span>{necesidad.actividad.lugar}</span>
                  </div>
                )}
              </>
            )}
            {necesidad.tipo_necesidad && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span>{necesidad.tipo_necesidad.nombre}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Necesidad</span>
              <span className="font-medium text-right">{necesidad.descripcion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progreso</span>
              <span>
                {necesidad.cantidad_cubierta} / {necesidad.cantidad_requerida}{' '}
                {necesidad.unidad_medida}
              </span>
            </div>
            <Progress value={progreso} className="h-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Faltante</span>
              <span className="font-medium">
                {faltante} {necesidad.unidad_medida}
              </span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="cantidad_ofrecida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cantidad a ofrecer ({necesidad?.unidad_medida ?? 'unidades'}) *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={faltante}
                      step="any"
                      placeholder={`Máximo ${faltante}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Comentarios adicionales (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                aria-label={
                  necesidad?.actividad
                    ? `Ofrecerme para ${necesidad.actividad.nombre}, ${formatFecha(necesidad.actividad.fecha)}, ${necesidad.tipo_necesidad?.nombre ?? 'necesidad logística'}`
                    : 'Confirmar oferta de colaboración'
                }
              >
                {mutation.isPending && <Loader2 className="animate-spin" />}
                Ofrecerme
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
