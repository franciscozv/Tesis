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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useActividades } from '@/features/actividades/hooks/use-actividades';
import type { TipoNecesidad } from '@/features/catalogos/types';
import {
  type CreateNecesidadFormData,
  createNecesidadSchema,
  type UpdateNecesidadFormData,
  updateNecesidadSchema,
} from '@/features/necesidades/schemas';
import type { NecesidadLogistica } from '@/features/necesidades/types';

interface NecesidadFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: NecesidadLogistica | null;
  tiposNecesidad: TipoNecesidad[] | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: mutation types vary between create/update
  createMutation: any;
  // biome-ignore lint/suspicious/noExplicitAny: mutation types vary between create/update
  updateMutation: any;
}

export function NecesidadFormModal({
  open,
  onOpenChange,
  editing,
  tiposNecesidad,
  createMutation,
  updateMutation,
}: NecesidadFormModalProps) {
  const { data: actividades } = useActividades({ estado: 'programada' });
  const isEditing = !!editing;

  const form = useForm<CreateNecesidadFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(isEditing ? updateNecesidadSchema : createNecesidadSchema) as any,
    defaultValues: {
      actividad_id: 0,
      tipo_necesidad_id: 0,
      descripcion: '',
      cantidad_requerida: 1,
      unidad_medida: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        form.reset({
          actividad_id: editing.actividad_id,
          tipo_necesidad_id: editing.tipo_necesidad_id,
          descripcion: editing.descripcion,
          cantidad_requerida: editing.cantidad_requerida,
          unidad_medida: editing.unidad_medida,
        });
      } else {
        form.reset({
          actividad_id: 0,
          tipo_necesidad_id: 0,
          descripcion: '',
          cantidad_requerida: 1,
          unidad_medida: '',
        });
      }
    }
  }, [open, editing, form]);

  function onSubmit(data: CreateNecesidadFormData | UpdateNecesidadFormData) {
    if (isEditing) {
      const { actividad_id: _, ...updateData } = data as CreateNecesidadFormData;
      updateMutation.mutate(
        { id: editing.id, input: updateData },
        {
          onSuccess: () => {
            toast.success('Necesidad actualizada');
            onOpenChange(false);
          },
          onError: () => toast.error('Error al actualizar necesidad'),
        },
      );
    } else {
      createMutation.mutate(data as CreateNecesidadFormData, {
        onSuccess: () => {
          toast.success('Necesidad creada exitosamente');
          onOpenChange(false);
        },
        onError: () => toast.error('Error al crear necesidad'),
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Necesidad' : 'Nueva Necesidad Logística'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifique los datos de la necesidad.'
              : 'Registre una necesidad logística para una actividad.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            {!isEditing && (
              <FormField
                control={form.control}
                name="actividad_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actividad *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ? String(field.value) : ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar actividad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {actividades?.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.nombre} ({a.fecha})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {isEditing ? 'Guardar Cambios' : 'Crear Necesidad'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
