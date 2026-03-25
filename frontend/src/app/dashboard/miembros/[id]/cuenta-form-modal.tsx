'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import type { Miembro } from '@/features/miembros/types';

const rolEnum = z.enum(['administrador', 'usuario']);

const updateSchema = z.object({
  email: z.string().email('Email invalido').max(150).optional(),
  rol: rolEnum.optional(),
});

type UpdateData = z.infer<typeof updateSchema>;

interface CuentaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  miembro: Miembro | null;
  isPending: boolean;
  onUpdateSubmit: (data: UpdateData) => void;
  serverError?: string | null;
}

export function CuentaFormModal({
  open,
  onOpenChange,
  miembro,
  isPending,
  onUpdateSubmit,
  serverError,
}: CuentaFormModalProps) {
  const form = useForm<UpdateData>({
    resolver: zodResolver(updateSchema),
    defaultValues: { email: '', rol: 'usuario' },
  });

  useEffect(() => {
    if (open && miembro) {
      form.reset({
        email: miembro.email ?? '',
        rol: miembro.rol ?? 'usuario',
      });
    }
  }, [open, miembro, form]);

  useEffect(() => {
    if (serverError) {
      form.setError('email', { message: serverError });
    }
  }, [serverError, form]);

  function onSubmit(data: UpdateData) {
    const cleaned = {
      email: data.email || undefined,
      rol: data.rol,
    };
    onUpdateSubmit(cleaned);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cuenta</DialogTitle>
          {miembro && (
            <DialogDescription>
              {miembro.nombre} {miembro.apellido}
            </DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="miembro@iglesia.cl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? 'usuario'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="usuario">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
