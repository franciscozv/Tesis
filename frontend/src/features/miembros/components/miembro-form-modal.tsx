'use client';

import type { AxiosError } from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ApiResponse } from '@/features/auth/types';
import { useCreateMiembro } from '../hooks/use-create-miembro';
import type { CreateMiembroFormData } from '../schemas';
import { MiembroForm } from './miembro-form';

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

interface MiembroFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MiembroFormModal({ open, onOpenChange }: MiembroFormModalProps) {
  const mutation = useCreateMiembro();
  const [formKey, setFormKey] = useState(0);
  const [apiErrors, setApiErrors] = useState<Partial<Record<keyof CreateMiembroFormData, string>>>(
    {},
  );

  function handleOpenChange(value: boolean) {
    if (value) {
      setFormKey((k) => k + 1);
      setApiErrors({});
    }
    onOpenChange(value);
  }

  function onSubmit(data: CreateMiembroFormData) {
    setApiErrors({});
    mutation.mutate(cleanOptionalFields(data), {
      onSuccess: () => {
        toast.success('Miembro registrado exitosamente');
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Miembro</DialogTitle>
          <DialogDescription>Registrar un nuevo miembro en el sistema</DialogDescription>
        </DialogHeader>
        <MiembroForm
          key={formKey}
          onSubmit={onSubmit}
          isPending={mutation.isPending}
          submitLabel="Registrar"
          apiErrors={apiErrors}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
