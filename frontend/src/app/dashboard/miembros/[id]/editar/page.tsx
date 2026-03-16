'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MiembroForm } from '@/features/miembros/components/miembro-form';
import { useMiembro } from '@/features/miembros/hooks/use-miembros';
import { useUpdateMiembro } from '@/features/miembros/hooks/use-update-miembro';
import type { CreateMiembroFormData } from '@/features/miembros/schemas';

export default function EditarMiembroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const miembroId = Number(id);
  const router = useRouter();
  const { data: miembro, isLoading } = useMiembro(miembroId);
  const mutation = useUpdateMiembro();

  function onSubmit(data: CreateMiembroFormData) {
    const { rut: _, estado_comunion: __, ...input } = data;
    const cleaned = {
      ...input,
      email: input.email || null,
      telefono: input.telefono || null,
      fecha_nacimiento: input.fecha_nacimiento || null,
      direccion: input.direccion || null,
      genero: (input.genero as 'masculino' | 'femenino') || null,
    };
    mutation.mutate(
      { id: miembroId, input: cleaned },
      {
        onSuccess: () => {
          toast.success('Miembro actualizado exitosamente');
          router.push(`/dashboard/miembros/${miembroId}`);
        },
        onError: () => {
          toast.error('Error al actualizar miembro');
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!miembro) {
    return <p className="text-muted-foreground py-8 text-center">Miembro no encontrado.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl grid gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/miembros/${miembroId}`}>
            <ArrowLeft className="size-4" />
            Volver al miembro
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editar Miembro</CardTitle>
          <CardDescription>
            {miembro.nombre} {miembro.apellido}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MiembroForm
            defaultValues={{
              rut: miembro.rut,
              nombre: miembro.nombre,
              apellido: miembro.apellido,
              email: miembro.email ?? '',
              telefono: miembro.telefono ?? '',
              fecha_nacimiento: miembro.fecha_nacimiento ?? '',
              direccion: miembro.direccion ?? '',
              genero: miembro.genero ?? '',
              fecha_ingreso: miembro.fecha_ingreso,
            }}
            onSubmit={onSubmit}
            isPending={mutation.isPending}
            submitLabel="Actualizar"
            disableRut
            allowEstadoComunion={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
