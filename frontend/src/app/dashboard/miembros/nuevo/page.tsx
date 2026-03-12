'use client';

import type { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiResponse } from '@/features/auth/types';
import { MiembroForm } from '@/features/miembros/components/miembro-form';
import { useCreateMiembro } from '@/features/miembros/hooks/use-create-miembro';
import type { CreateMiembroFormData } from '@/features/miembros/schemas';

function cleanOptionalFields(data: CreateMiembroFormData) {
  return {
    ...data,
    email: data.email || undefined,
    telefono: data.telefono || undefined,
    fecha_nacimiento: data.fecha_nacimiento || undefined,
    direccion: data.direccion || undefined,
    genero: (data.genero as 'masculino' | 'femenino') || undefined,
  };
}

function parseApiFieldErrors(
  message: string,
): Partial<Record<keyof CreateMiembroFormData, string>> {
  const errors: Partial<Record<keyof CreateMiembroFormData, string>> = {};
  const parts = message.split('; ');
  for (const part of parts) {
    const match = part.match(/body\.(\w+):\s*(.+)/);
    if (match) {
      errors[match[1] as keyof CreateMiembroFormData] = match[2];
    }
  }
  return errors;
}

export default function NuevoMiembroPage() {
  const router = useRouter();
  const mutation = useCreateMiembro();
  const [apiErrors, setApiErrors] = useState<Partial<Record<keyof CreateMiembroFormData, string>>>(
    {},
  );

  function onSubmit(data: CreateMiembroFormData) {
    setApiErrors({});
    mutation.mutate(cleanOptionalFields(data), {
      onSuccess: () => {
        toast.success('Miembro registrado exitosamente');
        router.push('/dashboard/miembros');
      },
      onError: (error) => {
        const axiosError = error as AxiosError<ApiResponse<null>>;
        const message = axiosError.response?.data?.message ?? '';
        const fieldErrors = parseApiFieldErrors(message);
        if (Object.keys(fieldErrors).length > 0) {
          setApiErrors(fieldErrors);
          toast.error('Corrija los errores del formulario');
        } else {
          toast.error(message || 'Error al registrar miembro');
        }
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
          <MiembroForm
            onSubmit={onSubmit}
            isPending={mutation.isPending}
            submitLabel="Registrar"
            apiErrors={apiErrors}
          />
        </CardContent>
      </Card>
    </div>
  );
}
