'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
import { useMiembros } from '@/features/miembros/hooks/use-miembros';
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
}

export function GrupoForm({
  mode = 'create',
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = 'Guardar',
}: GrupoFormProps) {
  const { data: miembros } = useMiembros();
  const lideres =
    miembros?.filter((m) => m.estado_membresia === 'plena_comunion' && m.activo) ?? [];

  const schema = mode === 'edit' ? updateGrupoSchema : createGrupoSchema;

  const form = useForm<CreateGrupoFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      lider_principal_id: 0,
      descripcion: '',
      fecha_creacion: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

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
          name="lider_principal_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Líder Principal *</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value ? String(field.value) : ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar líder" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {lideres.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nombre} {m.apellido}
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
            <FormItem>
              <FormLabel>Fecha de Creación *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
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
