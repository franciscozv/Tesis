'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useLogin } from '../hooks/use-login';
import { type LoginFormData, loginSchema } from '../schemas';

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useLogin();

  function onSubmit(data: LoginFormData) {
    loginMutation.mutate(data);
  }

  const errorMessage = loginMutation.error
    ? isAxiosError(loginMutation.error)
      ? loginMutation.error.response?.status === 401
        ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
        : loginMutation.error.response?.status === 403
          ? 'Tu cuenta se encuentra desactivada. Contacta al administrador.'
          : 'Error al iniciar sesión. Intenta nuevamente.'
      : 'Error al iniciar sesión. Intenta nuevamente.'
    : null;

  return (
    <Card className="w-full max-w-sm shadow-md border-border/60">
      <CardHeader className="pb-4 space-y-1">
        <CardTitle
          className="text-xl font-semibold tracking-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Iniciar sesión
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          Ingresa tus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="correo@iglesia.cl"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                    <Link
                      href="/auth/recuperar-password"
                      className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errorMessage && (
              <Alert variant="destructive" className="py-3">
                <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full mt-1"
              size="default"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
