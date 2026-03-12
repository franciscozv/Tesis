'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type CreateGrupoFormData,
  createGrupoSchema,
  type UpdateGrupoFormData,
  updateGrupoSchema,
} from '../schemas';

interface GrupoFormProps {
  mode?: 'create' | 'edit';
  defaultValues?: Partial<CreateGrupoFormData>;
  onSubmit: (data: CreateGrupoFormData | UpdateGrupoFormData) => void;
  isPending: boolean;
  submitLabel?: string;
  error?: any;
}

export function GrupoForm({
  mode = 'create',
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = 'Guardar',
  error,
}: GrupoFormProps) {
  const schema = mode === 'edit' ? updateGrupoSchema : createGrupoSchema;

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      fecha_creacion: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (error && isAxiosError(error) && error.response?.status === 409) {
      const apiMessage = (error.response.data as any).message;
      if (apiMessage.toLowerCase().includes('nombre')) {
        form.setError('nombre', { type: 'manual', message: apiMessage });
      }
    }
  }, [error, form.setError]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del grupo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del grupo" rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fecha_creacion"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha de Creación *</FormLabel>
              <DatePicker value={field.value} onChange={field.onChange} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
