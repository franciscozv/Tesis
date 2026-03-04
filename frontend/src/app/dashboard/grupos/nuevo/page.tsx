'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GrupoForm } from '@/features/grupos-ministeriales/components/grupo-form';
import { useCreateGrupo } from '@/features/grupos-ministeriales/hooks/use-create-grupo';

export default function NuevoGrupoPage() {
  const router = useRouter();
  const mutation = useCreateGrupo();

  function onSubmit(data: any) {
    mutation.mutate(
      { ...data, descripcion: data.descripcion || null },
      {
        onSuccess: () => {
          toast.success('Grupo creado exitosamente');
          router.push('/dashboard/grupos');
        },
        onError: () => {
          toast.error('Error al crear grupo');
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Grupo Ministerial</CardTitle>
          <CardDescription>Registrar un nuevo grupo en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <GrupoForm onSubmit={onSubmit} isPending={mutation.isPending} submitLabel="Crear Grupo" />
        </CardContent>
      </Card>
    </div>
  );
}
