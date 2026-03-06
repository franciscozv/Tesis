'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { TipoActividad } from '@/features/catalogos/types';
import type { GrupoMinisterial } from '@/features/grupos-ministeriales/types';
import { type CreateActividadFormData, createActividadSchema } from '../schemas';

interface ActividadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CreateActividadFormData>;
  onSubmit: (data: CreateActividadFormData) => void;
  isPending: boolean;
  tiposActividad: TipoActividad[] | undefined;
  grupos: GrupoMinisterial[] | undefined;
  isEditing?: boolean;
}

export function ActividadFormModal({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending,
  tiposActividad,
  grupos,
  isEditing = false,
}: ActividadFormProps) {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<CreateActividadFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce + refine creates input type mismatch with zodResolver
    resolver: zodResolver(createActividadSchema) as any,
    defaultValues: {
      tipo_actividad_id: 0,
      nombre: '',
      descripcion: '',
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
      lugar: '',
      grupo_id: 0,
      es_publica: false,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        tipo_actividad_id: 0,
        nombre: '',
        descripcion: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        lugar: '',
        grupo_id: 0,
        es_publica: false,
        ...defaultValues,
      });
    }
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifica los datos de la actividad.' : 'Crea una nueva actividad.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => {
              if (!isAdmin && (!data.grupo_id || data.grupo_id === 0)) {
                form.setError('grupo_id', {
                  message: 'Como líder, es obligatorio seleccionar un grupo.',
                });
                return;
              }
              onSubmit(data);
            })}
            className="grid gap-4 sm:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Culto especial de Navidad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_actividad_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Actividad *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposActividad?.map((t) => (
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
              name="fecha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input type="date" min={isEditing ? undefined : today} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hora_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora Inicio *</FormLabel>
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
                  <FormLabel>Hora Fin *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lugar"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Lugar *</FormLabel>
                  <FormControl>
                    <Input placeholder="Templo principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción de la actividad..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grupo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo Organizador {!isAdmin && '*'}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : '0'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isAdmin && <SelectItem value="0">Ninguno</SelectItem>}
                      {grupos?.map((g) => (
                        <SelectItem key={g.id_grupo} value={String(g.id_grupo)}>
                          {g.nombre}
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
              name="es_publica"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-7">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Actividad pública</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {isEditing ? 'Guardar Cambios' : 'Crear Actividad'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

