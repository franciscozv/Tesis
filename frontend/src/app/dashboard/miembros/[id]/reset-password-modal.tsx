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
import type { Miembro } from '@/features/miembros/types';

const schema = z.object({
  nueva_password: z.string().min(8, 'Minimo 8 caracteres').max(100),
});

type ResetPasswordData = z.infer<typeof schema>;

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  miembro: Miembro | null;
  isPending: boolean;
  onSubmit: (data: ResetPasswordData) => void;
  serverError?: string | null;
}

export function ResetPasswordModal({
  open,
  onOpenChange,
  miembro,
  isPending,
  onSubmit,
  serverError,
}: ResetPasswordModalProps) {
  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(schema),
    defaultValues: { nueva_password: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ nueva_password: '' });
    }
  }, [open, form]);

  useEffect(() => {
    if (serverError) {
      form.setError('nueva_password', { message: serverError });
    }
  }, [serverError, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{'Restablecer contrase\u00f1a'}</DialogTitle>
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
              name="nueva_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{'Nueva contrase\u00f1a *'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Minimo 8 caracteres" {...field} />
                  </FormControl>
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
                Restablecer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
