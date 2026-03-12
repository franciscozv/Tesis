'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Miembro } from '@/features/miembros/types';
import {
  type CreateUsuarioFormData,
  createUsuarioSchema,
  type UpdateUsuarioFormData,
  updateUsuarioSchema,
} from '../schemas';
import type { Usuario } from '../types';

interface UsuarioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Usuario | null;
  miembros: Miembro[] | undefined;
  isPending: boolean;
  onCreateSubmit: (data: CreateUsuarioFormData) => void;
  onUpdateSubmit: (data: UpdateUsuarioFormData) => void;
}

export function UsuarioFormModal({
  open,
  onOpenChange,
  editing,
  miembros,
  isPending,
  onCreateSubmit,
  onUpdateSubmit,
}: UsuarioFormModalProps) {
  const isEditing = !!editing;

  const form = useForm<CreateUsuarioFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(isEditing ? updateUsuarioSchema : createUsuarioSchema) as any,
    defaultValues: {
      email: '',
      password: '',
      rol: 'usuario',
      miembro_id: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        form.reset({
          email: editing.email,
          password: '',
          rol: editing.rol,
          miembro_id: editing.miembro_id ?? 0,
        });
      } else {
        form.reset({
          email: '',
          password: '',
          rol: 'usuario',
          miembro_id: 0,
        });
      }
    }
  }, [open, editing, form]);

  function onSubmit(data: CreateUsuarioFormData) {
    if (isEditing) {
      onUpdateSubmit({ email: data.email, rol: data.rol });
    } else {
      const input: CreateUsuarioFormData = {
        email: data.email,
        password: data.password,
        rol: data.rol,
      };
      if (data.miembro_id && data.miembro_id > 0) {
        input.miembro_id = data.miembro_id;
      }
      onCreateSubmit(input);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifique el email o rol del usuario.'
              : 'Complete los datos para crear un nuevo usuario.'}
          </DialogDescription>
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
                    <Input type="email" placeholder="usuario@iglesia.cl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {!isEditing && (
              <FormField
                control={form.control}
                name="miembro_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Miembro vinculado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ? String(field.value) : ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin vincular" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Sin vincular</SelectItem>
                        {miembros?.map((m) => (
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
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
