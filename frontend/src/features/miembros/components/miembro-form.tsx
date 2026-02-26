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
import { type CreateMiembroFormData, createMiembroSchema } from '../schemas';

interface MiembroFormProps {
  defaultValues?: Partial<CreateMiembroFormData>;
  onSubmit: (data: CreateMiembroFormData) => void;
  isPending: boolean;
  submitLabel?: string;
  disableRut?: boolean;
  allowEstadoMembresia?: boolean;
}

export function MiembroForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = 'Guardar',
  disableRut = false,
  allowEstadoMembresia = true,
}: MiembroFormProps) {
  const form = useForm<CreateMiembroFormData>({
    resolver: zodResolver(createMiembroSchema),
    defaultValues: {
      rut: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fecha_nacimiento: '',
      direccion: '',
      genero: '',
      bautizado: false,
      estado_membresia: 'sin_membresia',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="rut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RUT *</FormLabel>
              <FormControl>
                <Input placeholder="12345678-9" disabled={disableRut} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input placeholder="Juan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="apellido"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido *</FormLabel>
              <FormControl>
                <Input placeholder="Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.cl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="+56912345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fecha_nacimiento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Nacimiento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Calle Principal 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="genero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Género</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {allowEstadoMembresia && (
          <FormField
            control={form.control}
            name="estado_membresia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado Membresía *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sin_membresia">Sin Membresía</SelectItem>
                    <SelectItem value="probando">Probando</SelectItem>
                    <SelectItem value="plena_comunion">Plena Comunión</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="fecha_ingreso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Ingreso *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bautizado"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0 pt-6">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="size-4 rounded border"
                />
              </FormControl>
              <FormLabel className="font-normal">Bautizado</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
