'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { ArrowLeft, CheckCircle, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
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
import { type ResetPasswordFormData, resetPasswordSchema } from '@/features/auth/schemas';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isPending, setIsPending] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { nueva_password: '', confirmar_password: '' },
  });

  if (!token) {
    return (
      <Card className="w-full max-w-sm shadow-md border-border/60">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/30">
            <XCircle className="size-6 text-destructive dark:text-destructive" />
          </div>
          <CardTitle className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Enlace inválido
          </CardTitle>
          <CardDescription>El enlace de recuperación no es válido o ha expirado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/recuperar-password">Solicitar nuevo enlace</Link>
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="size-4" />
                Volver al login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(data: ResetPasswordFormData) {
    setIsPending(true);
    setError(null);
    try {
      await authApi.resetPassword({ token: token!, nueva_password: data.nueva_password });
      setExito(true);
    } catch (err) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || 'Error al restablecer la contraseña'
          : 'Error al restablecer la contraseña',
      );
    } finally {
      setIsPending(false);
    }
  }

  if (exito) {
    return (
      <Card className="w-full max-w-sm shadow-md border-border/60">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-success/20 dark:bg-success/30">
            <CheckCircle className="size-6 text-success-foreground dark:text-success-foreground" />
          </div>
          <CardTitle className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Contraseña restablecida
          </CardTitle>
          <CardDescription>Tu contraseña ha sido actualizada exitosamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm shadow-md border-border/60">
      <CardHeader className="text-center">
        <CardTitle className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>
          Nueva contraseña
        </CardTitle>
        <CardDescription>Ingresa tu nueva contraseña</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="nueva_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={0}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Debe contener mayúscula, minúscula y número.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmar_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Repite tu contraseña"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex={0}
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-destructive text-center text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Restablecer contraseña
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/auth/login">
                <ArrowLeft className="size-4" />
                Volver al login
              </Link>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Suspense
        fallback={<div className="w-full max-w-sm h-64 rounded-lg bg-card animate-pulse" />}
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
