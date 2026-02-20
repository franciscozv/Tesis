'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MiembroForm } from '@/features/miembros/components/miembro-form';
import { useCreateMiembro } from '@/features/miembros/hooks/use-create-miembro';
import type { CreateMiembroFormData } from '@/features/miembros/schemas';

function cleanOptionalFields(data: CreateMiembroFormData) {
  return {
    ...data,
    email: data.email || null,
    telefono: data.telefono || null,
    fecha_nacimiento: data.fecha_nacimiento || null,
    direccion: data.direccion || null,
    genero: (data.genero as 'masculino' | 'femenino') || null,
  };
}

export default function NuevoMiembroPage() {
  const router = useRouter();
  const mutation = useCreateMiembro();

  function onSubmit(data: CreateMiembroFormData) {
    mutation.mutate(cleanOptionalFields(data), {
      onSuccess: () => {
        toast.success('Miembro registrado exitosamente');
        router.push('/dashboard/miembros');
      },
      onError: () => {
        toast.error('Error al registrar miembro');
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Miembro</CardTitle>
          <CardDescription>Registrar un nuevo miembro en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <MiembroForm onSubmit={onSubmit} isPending={mutation.isPending} submitLabel="Registrar" />
        </CardContent>
      </Card>
    </div>
  );
}
