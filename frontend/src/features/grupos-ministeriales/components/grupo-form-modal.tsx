'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateGrupo } from '../hooks/use-create-grupo';
import { GrupoForm } from './grupo-form';

interface GrupoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrupoFormModal({ open, onOpenChange }: GrupoFormModalProps) {
  const mutation = useCreateGrupo();
  const [formKey, setFormKey] = useState(0);

  function handleOpenChange(value: boolean) {
    if (value) setFormKey((k) => k + 1);
    onOpenChange(value);
  }

  function onSubmit(data: any) {
    mutation.mutate(
      { ...data, descripcion: data.descripcion || null },
      {
        onSuccess: () => {
          toast.success('Grupo creado exitosamente');
          onOpenChange(false);
        },
        onError: (error: any) => {
          const apiMessage = error.response?.data?.message;
          toast.error(apiMessage || 'Error al crear grupo');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Grupo Ministerial</DialogTitle>
          <DialogDescription>Registrar un nuevo grupo en el sistema</DialogDescription>
        </DialogHeader>
        <GrupoForm
          key={formKey}
          onSubmit={onSubmit}
          isPending={mutation.isPending}
          error={mutation.error}
          submitLabel="Crear Grupo"
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
