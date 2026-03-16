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
  DialogFooter,
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
import { useResponderInvitacion } from '../hooks/use-responder-invitacion';
import { type ResponderInvitacionFormData, responderInvitacionSchema } from '../schemas';
import type { Invitado } from '../types';

interface ResponderInvitacionModalProps {
  invitado: Invitado | null;
  accion: 'aceptar' | 'rechazar';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResponderInvitacionModal({
  invitado,
  accion,
  open,
  onOpenChange,
}: ResponderInvitacionModalProps) {
  const mutation = useResponderInvitacion();

  const form = useForm<ResponderInvitacionFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.refine creates input type mismatch with zodResolver
    resolver: zodResolver(responderInvitacionSchema) as any,
    defaultValues: { estado: 'confirmado', motivo_rechazo: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        estado: accion === 'aceptar' ? 'confirmado' : 'rechazado',
        motivo_rechazo: '',
      });
    }
  }, [open, accion, form]);

  function submitResponse(data: ResponderInvitacionFormData) {
    if (!invitado) return;
    mutation.mutate(
      {
        id: invitado.id,
        input: {
          estado: data.estado,
          ...(data.estado === 'rechazado' && data.motivo_rechazo
            ? { motivo_rechazo: data.motivo_rechazo }
            : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            data.estado === 'confirmado' ? 'Invitación confirmada' : 'Invitación rechazada',
          );
          onOpenChange(false);
          form.reset();
        },
        onError: () => toast.error('Error al responder invitación'),
      },
    );
  }

  const rolNombre = invitado?.rol?.nombre;
  const actividadNombre = invitado?.actividad?.nombre;
  const fechaActividad = invitado?.actividad?.fecha
    ? new Date(`${invitado.actividad.fecha}T12:00:00`).toLocaleDateString('es-CL', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
    : null;

  const verbo = accion === 'aceptar' ? 'aceptar' : 'rechazar';
  const descripcion = [
    `¿Deseas ${verbo} la invitación`,
    rolNombre ? `para "${rolNombre}"` : null,
    actividadNombre ? `en la actividad "${actividadNombre}"` : null,
    fechaActividad ? `el día ${fechaActividad}` : null,
  ]
    .filter(Boolean)
    .join(' ')
    .concat('?');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {accion === 'aceptar' ? 'Aceptar invitación' : 'Rechazar invitación'}
          </DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        {accion === 'rechazar' ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submitResponse)} className="grid gap-4">
              <FormField
                control={form.control}
                name="motivo_rechazo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo del rechazo *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explique el motivo por el cual no puede asistir (mínimo 10 caracteres)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={mutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Confirmar rechazo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => submitResponse({ estado: 'confirmado', motivo_rechazo: '' })}
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar asistencia
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
