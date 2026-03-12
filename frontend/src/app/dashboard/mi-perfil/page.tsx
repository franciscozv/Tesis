'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock, UserPen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { authApi } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { type CambiarPasswordFormData, cambiarPasswordSchema } from '@/features/auth/schemas';
import { useAsignacionesMiembro } from '@/features/integrantes-grupo/hooks/use-integraciones-miembro';
import { useMiembro } from '@/features/miembros/hooks/use-miembros';
import { useUpdateMiPerfil } from '@/features/miembros/hooks/use-update-mi-perfil';
import { type MiPerfilFormData, miPerfilSchema } from '@/features/miembros/schemas';
import type { EstadoComunion } from '@/features/miembros/types';

const estadoLabels: Record<EstadoComunion, string> = {
  asistente: 'Asistente',
  probando: 'Probando',
  plena_comunion: 'Plena Comunion',
};

const estadoVariant: Record<EstadoComunion, 'default' | 'secondary' | 'outline'> = {
  plena_comunion: 'default',
  probando: 'secondary',
  asistente: 'outline',
};

export default function MiPerfilPage() {
  const { usuario } = useAuth();
  const miembroId = usuario?.miembro_id ?? 0;
  const { data: miembro, isLoading } = useMiembro(miembroId);
  const { data: comunions } = useAsignacionesMiembro(miembroId);
  const mutation = useUpdateMiPerfil();

  const form = useForm<MiPerfilFormData>({
    resolver: zodResolver(miPerfilSchema),
    defaultValues: {
      direccion: '',
      telefono: '',
      email: '',
    },
  });

  useEffect(() => {
    if (miembro) {
      form.reset({
        direccion: miembro.direccion ?? '',
        telefono: miembro.telefono ?? '',
        email: miembro.email ?? '',
      });
    }
  }, [miembro, form]);

  function onSubmit(data: MiPerfilFormData) {
    mutation.mutate(
      {
        direccion: data.direccion || null,
        telefono: data.telefono || null,
        email: data.email || null,
      },
      {
        onSuccess: () => toast.success('Perfil actualizado exitosamente'),
        onError: (error: any) => {
          const message = error.response?.data?.message || 'Error al actualizar el perfil';
          toast.error(message);
        },
      },
    );
  }

  if (!usuario?.miembro_id) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Tu usuario no tiene un miembro asociado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!miembro) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No se encontraron datos del miembro.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gruposActivos = comunions?.filter((m) => !m.fecha_desvinculacion) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserPen className="size-6" />
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos de solo lectura */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Personales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Nombre completo" value={`${miembro.nombre} ${miembro.apellido}`} />
            <Separator />
            <InfoRow label="RUT" value={miembro.rut} />
            <Separator />
            <div className="grid grid-cols-3 gap-2 py-2">
              <span className="text-muted-foreground text-sm">Estado comunion</span>
              <div className="col-span-2">
                <Badge variant={estadoVariant[miembro.estado_comunion]}>
                  {estadoLabels[miembro.estado_comunion]}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-2 py-2">
              <span className="text-muted-foreground text-sm">Grupos actuales</span>
              <div className="col-span-2 flex flex-wrap gap-1">
                {gruposActivos.length === 0 ? (
                  <span className="text-muted-foreground text-sm">Sin grupos</span>
                ) : (
                  gruposActivos.map((m) => (
                    <Badge key={m.id} variant="secondary">
                      {m.grupo.nombre} ({m.rol.nombre})
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario editable */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input placeholder="+56 9 1234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direccion</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ingrese su direccion"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="animate-spin" />}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Cambiar contraseña */}
      <CambiarPasswordCard />
    </div>
  );
}

function CambiarPasswordCard() {
  const [isPending, setIsPending] = useState(false);
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);

  const form = useForm<CambiarPasswordFormData>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { password_actual: '', password_nueva: '' },
  });

  async function onSubmit(data: CambiarPasswordFormData) {
    setIsPending(true);
    try {
      await authApi.cambiarPassword(data);
      toast.success('Contraseña actualizada exitosamente');
      form.reset();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-4" />
          Cambiar Contraseña
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password_actual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showActual ? 'text' : 'password'}
                        placeholder="Ingrese su contraseña actual"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowActual(!showActual)}
                        tabIndex={-1}
                      >
                        {showActual ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password_nueva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNueva ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowNueva(!showNueva)}
                        tabIndex={-1}
                      >
                        {showNueva ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Cambiar Contraseña
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm">{value || '—'}</span>
    </div>
  );
}
