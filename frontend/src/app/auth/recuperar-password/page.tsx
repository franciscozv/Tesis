'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApi } from '@/features/auth/api';
import { type RecuperarPasswordFormData, recuperarPasswordSchema } from '@/features/auth/schemas';

export default function RecuperarPasswordPage() {
  const [isPending, setIsPending] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RecuperarPasswordFormData>({
    resolver: zodResolver(recuperarPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: RecuperarPasswordFormData) {
    setIsPending(true);
    setError(null);
    try {
      await authApi.recuperarPassword(data);
      setEnviado(true);
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Error al enviar el correo'
          : 'Error al enviar el correo',
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
          <CardDescription>
            {enviado
              ? 'Revisa tu bandeja de entrada'
              : 'Ingresa tu email para recibir instrucciones'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="grid gap-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Mail className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-muted-foreground text-sm">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña. El
                enlace expira en 1 hora.
              </p>
              <Button variant="outline" asChild>
                <Link href="/auth/login">
                  <ArrowLeft className="size-4" />
                  Volver al login
                </Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                {error && <p className="text-destructive text-center text-sm">{error}</p>}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="animate-spin" />}
                  Enviar instrucciones
                </Button>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/auth/login">
                    <ArrowLeft className="size-4" />
                    Volver al login
                  </Link>
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
