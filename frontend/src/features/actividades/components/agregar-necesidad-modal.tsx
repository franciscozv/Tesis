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
import { Textarea } from '@/components/ui/textarea';
import type { TipoNecesidad } from '@/features/catalogos/types';
import { useCreateNecesidad } from '../hooks/use-necesidades-actividad';

const necesidadSchema = z.object({
  tipo_necesidad_id: z.coerce.number().int().positive('Seleccione un tipo'),
  descripcion: z.string().min(1, 'La descripción es requerida').max(1000, 'Máximo 1000 caracteres'),
  cantidad_requerida: z.coerce.number().positive('Debe ser mayor a 0'),
  unidad_medida: z.string().min(1, 'La unidad es requerida').max(50, 'Máximo 50 caracteres'),
});

type NecesidadFormData = z.infer<typeof necesidadSchema>;

interface AgregarNecesidadModalProps {
  actividadId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiposNecesidad: TipoNecesidad[] | undefined;
}

export function AgregarNecesidadModal({
  actividadId,
  open,
  onOpenChange,
  tiposNecesidad,
}: AgregarNecesidadModalProps) {
  const mutation = useCreateNecesidad();

  const form = useForm<NecesidadFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(necesidadSchema) as any,
    defaultValues: {
      tipo_necesidad_id: 0,
      descripcion: '',
      cantidad_requerida: 1,
      unidad_medida: '',
    },
  });

  function onSubmit(data: NecesidadFormData) {
    mutation.mutate(
      {
        actividad_id: actividadId,
        ...data,
      },
      {
        onSuccess: () => {
          toast.success('Necesidad agregada exitosamente');
          onOpenChange(false);
          form.reset();
        },
        onError: () => toast.error('Error al agregar necesidad'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Necesidad Logística</DialogTitle>
          <DialogDescription>
            Registre una necesidad logística para esta actividad.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="tipo_necesidad_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Necesidad *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposNecesidad?.map((t) => (
                        <SelectItem key={t.id_tipo} value={String(t.id_tipo)}>
                          {t.nombre}
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
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Pan para la santa cena" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cantidad_requerida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step="any" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unidad_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Medida *</FormLabel>
                    <FormControl>
                      <Input placeholder="unidades, litros, kg" {...field} />
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
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                Agregar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

