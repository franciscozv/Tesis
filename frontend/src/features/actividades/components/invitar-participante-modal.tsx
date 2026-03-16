'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResponsabilidadActividad } from '@/features/catalogos/types';
import type { Miembro } from '@/features/miembros/types';
import { useCreateInvitado } from '../hooks/use-invitados-actividad';
import type { Invitado } from '../types/invitados';

const invitarSchema = z.object({
  miembro_id: z.coerce.number().int().positive('Seleccione un miembro'),
  responsabilidad_id: z.coerce.number().int().positive('Seleccione una responsabilidad'),
  confirmado: z.boolean().default(false),
});

type InvitarFormData = z.infer<typeof invitarSchema>;

interface InvitarParticipanteModalProps {
  actividadId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  miembros: Miembro[] | undefined;
  responsabilidadesActividad: ResponsabilidadActividad[] | undefined;
  invitados: Invitado[] | undefined;
  defaultValues?: { miembro_id?: number; responsabilidad_id?: number };
  excludeMiembroId?: number;
}

export function InvitarParticipanteModal({
  actividadId,
  open,
  onOpenChange,
  miembros,
  responsabilidadesActividad,
  invitados,
  defaultValues,
  excludeMiembroId,
}: InvitarParticipanteModalProps) {
  const mutation = useCreateInvitado();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<InvitarFormData | null>(null);
  const [alreadyInvitedWarning, setAlreadyInvitedWarning] = React.useState<string | null>(null);

  const miembrosBase = excludeMiembroId
    ? (miembros?.filter((m) => m.id !== excludeMiembroId) ?? [])
    : (miembros ?? []);

  const miembrosFiltrados = miembrosBase.filter((m) =>
    `${m.nombre} ${m.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const form = useForm<InvitarFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(invitarSchema) as any,
    defaultValues: {
      miembro_id: 0,
      responsabilidad_id: 0,
      confirmado: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        miembro_id: defaultValues?.miembro_id ?? 0,
        responsabilidad_id: defaultValues?.responsabilidad_id ?? 0,
        confirmado: false,
      });
    } else {
      setSearchTerm('');
      setOpenCombobox(false);
    }
  }, [open, defaultValues, form]);

  function onSubmit(data: InvitarFormData) {
    if (excludeMiembroId && data.miembro_id === excludeMiembroId) {
      toast.error('No puede invitarse a sí mismo');
      return;
    }

    const existente = invitados?.find((inv) => inv.miembro_id === data.miembro_id);
    if (existente) {
      if (existente.responsabilidad_id === data.responsabilidad_id) {
        toast.error('Este miembro ya está invitado con esta misma responsabilidad.');
        return;
      }
      const nombreResponsabilidadExistente =
        existente.rol?.nombre ??
        responsabilidadesActividad?.find(
          (r) => r.id_responsabilidad === existente.responsabilidad_id,
        )?.nombre ??
        'otra responsabilidad';
      setAlreadyInvitedWarning(
        `Este miembro ya está invitado a esta actividad como ${nombreResponsabilidadExistente}.`,
      );
    } else {
      setAlreadyInvitedWarning(null);
    }

    setPendingData(data);
  }

  function handleConfirmInvitar() {
    if (!pendingData) return;
    mutation.mutate(
      {
        actividad_id: actividadId,
        miembro_id: pendingData.miembro_id,
        responsabilidad_id: pendingData.responsabilidad_id,
        confirmado: pendingData.confirmado,
      },
      {
        onSuccess: () => {
          toast.success('Miembro invitado exitosamente');
          setPendingData(null);
          setAlreadyInvitedWarning(null);
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? 'Error al invitar participante')
            : 'Error al invitar participante';
          toast.error(message);
          setPendingData(null);
          setAlreadyInvitedWarning(null);
        },
      },
    );
  }

  return (
    <>
    <AlertDialog
      open={!!pendingData}
      onOpenChange={(o) => {
        if (!o) {
          setPendingData(null);
          setAlreadyInvitedWarning(null);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar invitación</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {(() => {
              const m = miembrosBase.find((m) => m.id === pendingData?.miembro_id);
              const nombreMiembro = m ? `${m.nombre} ${m.apellido}` : '—';
              const responsabilidad =
                responsabilidadesActividad?.find(
                  (r) => r.id_responsabilidad === pendingData?.responsabilidad_id,
                )?.nombre ?? '—';
              return (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Estás a punto de invitar a{' '}
                    <span className="font-medium text-foreground">{nombreMiembro}</span> como{' '}
                    <span className="font-medium text-foreground">{responsabilidad}</span>.{' '}
                    {pendingData?.confirmado
                      ? 'Quedará registrado como confirmado de inmediato.'
                      : 'Quedará pendiente hasta que confirme su participación.'}
                  </p>
                  {alreadyInvitedWarning && (
                    <div className="flex items-start gap-2 rounded-md border border-warning-foreground/40 bg-warning px-3 py-2 text-warning-foreground dark:border-warning-foreground/40 dark:bg-warning/30 dark:text-warning-foreground">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>{alreadyInvitedWarning} ¿Deseas agregarlo con esta nueva responsabilidad de todos modos?</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmInvitar} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />}
            Invitar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar Participante</DialogTitle>
          <DialogDescription>
            Seleccione un miembro y asígnele una responsabilidad.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="miembro_id"
              render={({ field }) => {
                const selectedMiembro = miembrosBase.find((m) => m.id === field.value);
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Miembro *</FormLabel>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value && selectedMiembro
                              ? `${selectedMiembro.nombre} ${selectedMiembro.apellido}`
                              : 'Buscar miembro por nombre...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            placeholder="Escriba para buscar..."
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                          {miembrosFiltrados.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No se encontraron miembros.
                            </div>
                          ) : (
                            miembrosFiltrados.map((m) => (
                              <div
                                key={m.id}
                                className={cn(
                                  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                                  field.value === m.id && 'bg-accent text-accent-foreground',
                                )}
                                onClick={() => {
                                  form.setValue('miembro_id', m.id);
                                  setOpenCombobox(false);
                                  setSearchTerm('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === m.id ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                <span className="font-medium">
                                  {m.nombre} {m.apellido}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="responsabilidad_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsabilidad *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar responsabilidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {responsabilidadesActividad?.map((r) => (
                        <SelectItem key={r.id_responsabilidad} value={String(r.id_responsabilidad)}>
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
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
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
    </>
  );
}
