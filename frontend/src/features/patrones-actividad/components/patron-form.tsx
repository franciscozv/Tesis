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
import { TimePicker } from '@/components/ui/time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TipoActividad } from '@/features/catalogos/types';
import type { GrupoMinisterial } from '@/features/grupos-ministeriales/types';
import { type CreatePatronFormData, createPatronSchema } from '../schemas';

const frecuenciaLabels: Record<string, string> = {
  semanal: 'Semanal',
  primera_semana: 'Primera semana',
  segunda_semana: 'Segunda semana',
  tercera_semana: 'Tercera semana',
  cuarta_semana: 'Cuarta semana',
};

const diasSemana: { value: string; label: string }[] = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '7', label: 'Domingo' },
];

interface PatronFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CreatePatronFormData>;
  onSubmit: (data: CreatePatronFormData) => void;
  isPending: boolean;
  tiposActividad: TipoActividad[] | undefined;
  grupos: GrupoMinisterial[] | undefined;
  isEditing?: boolean;
}

export function PatronFormModal({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending,
  tiposActividad,
  grupos,
  isEditing = false,
}: PatronFormProps) {
  const form = useForm<CreatePatronFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(createPatronSchema) as any,
    defaultValues: {
      nombre: '',
      tipo_actividad_id: 0,
      frecuencia: 'semanal',
      dia_semana: 7,
      hora_inicio: '',
      duracion_minutos: 60,
      lugar: '',
      grupo_id: 0,
      es_publica: false,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nombre: '',
        tipo_actividad_id: 0,
        frecuencia: 'semanal',
        dia_semana: 7,
        hora_inicio: '',
        duracion_minutos: 60,
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
          <DialogTitle>{isEditing ? 'Editar Patrón' : 'Nuevo Patrón de Actividad'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del patrón.'
              : 'Define un patrón recurrente para generar actividades automáticamente.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Culto dominical matutino" {...field} />
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
              name="frecuencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(frecuenciaLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
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
              name="dia_semana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Día de la Semana *</FormLabel>
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
                      {diasSemana.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
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
              name="hora_inicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Hora de Inicio *</FormLabel>
                  <TimePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duracion_minutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duración (minutos) *</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="90" {...field} />
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
              name="grupo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo Organizador</FormLabel>
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
                      <SelectItem value="0">Ninguno</SelectItem>
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
                {isEditing ? 'Guardar Cambios' : 'Crear Patrón'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
