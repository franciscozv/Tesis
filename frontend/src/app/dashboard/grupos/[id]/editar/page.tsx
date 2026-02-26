'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GrupoForm } from '@/features/grupos-ministeriales/components/grupo-form';
import { useGrupo } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useUpdateGrupo } from '@/features/grupos-ministeriales/hooks/use-update-grupo';
import type { CreateGrupoFormData } from '@/features/grupos-ministeriales/schemas';

export default function EditarGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const grupoId = Number(id);
  const router = useRouter();
  const { data: grupo, isLoading } = useGrupo(grupoId);
  const mutation = useUpdateGrupo();

  function onSubmit(data: CreateGrupoFormData) {
    const { fecha_creacion: _, ...input } = data;
    mutation.mutate(
      { id: grupoId, input: { ...input, descripcion: input.descripcion || null } },
      {
        onSuccess: () => {
          toast.success('Grupo actualizado exitosamente');
          router.push(`/dashboard/grupos/${grupoId}`);
        },
        onError: () => {
          toast.error('Error al actualizar grupo');
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="grid gap-4">
            {['a', 'b', 'c', 'd'].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!grupo) {
    return <p className="text-muted-foreground py-8 text-center">Grupo no encontrado.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Editar Grupo</CardTitle>
          <CardDescription>{grupo.nombre}</CardDescription>
        </CardHeader>
        <CardContent>
          <GrupoForm
            defaultValues={{
              nombre: grupo.nombre,
              descripcion: grupo.descripcion ?? '',
              fecha_creacion: grupo.fecha_creacion,
            }}
            onSubmit={onSubmit}
            isPending={mutation.isPending}
            submitLabel="Actualizar"
          />
        </CardContent>
      </Card>
    </div>
  );
}
