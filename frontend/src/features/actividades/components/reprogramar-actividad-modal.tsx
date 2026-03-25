'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { type ReprogramarActividadFormData, reprogramarActividadSchema } from '../schemas';

interface ReprogramarActividadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actividadNombre: string;
  isPending: boolean;
  onSubmit: (data: ReprogramarActividadFormData) => void;
}

export function ReprogramarActividadModal({
  open,
  onOpenChange,
  actividadNombre,
  isPending,
  onSubmit,
}: ReprogramarActividadModalProps) {
  const form = useForm<ReprogramarActividadFormData>({
    resolver: zodResolver(reprogramarActividadSchema),
    defaultValues: {
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
    },
  });

  function handleSubmit(data: ReprogramarActividadFormData) {
    onSubmit(data);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) form.reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reprogramar Actividad</DialogTitle>
          <DialogDescription>
            Se creará una nueva actividad basada en <strong>{actividadNombre}</strong>. La actividad
            cancelada quedará en el historial.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hora_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Inicio</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Reprogramar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
