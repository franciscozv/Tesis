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
import { Textarea } from '@/components/ui/textarea';
import { useResponderInvitacion } from '../hooks/use-responder-invitacion';
import { type ResponderInvitacionFormData, responderInvitacionSchema } from '../schemas';
import type { Invitado } from '../types';

interface ResponderInvitacionModalProps {
  invitado: Invitado | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResponderInvitacionModal({
  invitado,
  open,
  onOpenChange,
}: ResponderInvitacionModalProps) {
  const mutation = useResponderInvitacion();

  const form = useForm<ResponderInvitacionFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.refine creates input type mismatch with zodResolver
    resolver: zodResolver(responderInvitacionSchema) as any,
    defaultValues: {
      estado: 'confirmado',
      motivo_rechazo: '',
    },
  });

  const estadoActual = form.watch('estado');

  function handleResponder(estado: 'confirmado' | 'rechazado') {
    form.setValue('estado', estado);

    if (estado === 'confirmado') {
      submitResponse({ estado: 'confirmado', motivo_rechazo: '' });
    }
  }

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

  const actividadNombre = invitado?.actividad?.nombre ?? `Actividad #${invitado?.actividad_id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Responder Invitación</DialogTitle>
          <DialogDescription>
            Confirme o rechace su invitación a &quot;{actividadNombre}&quot;.
          </DialogDescription>
        </DialogHeader>

        {estadoActual === 'rechazado' ? (
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
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.setValue('estado', 'confirmado');
                    form.clearErrors();
                  }}
                >
                  Volver
                </Button>
                <Button type="submit" variant="destructive" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="animate-spin" />}
                  Confirmar Rechazo
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={() => handleResponder('rechazado')}
              disabled={mutation.isPending}
            >
              Rechazar
            </Button>
            <Button onClick={() => handleResponder('confirmado')} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              Confirmar Asistencia
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
