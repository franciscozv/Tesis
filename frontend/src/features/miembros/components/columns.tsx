'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EstadoComunion, Miembro } from '../types';

const estadoLabels: Record<EstadoComunion, string> = {
  asistente: 'Asistente',
  probando: 'Probando',
  plena_comunion: 'Plena Comunión',
};

const estadoVariant: Record<EstadoComunion, 'success' | 'secondary' | 'outline'> = {
  plena_comunion: 'success',
  probando: 'secondary',
  asistente: 'outline',
};

interface ColumnOptions {
  isAdmin: boolean;
  onCambiarEstado: (miembro: Miembro) => void;
}

export function getMiembrosColumns({
  isAdmin,
  onCambiarEstado,
}: ColumnOptions): ColumnDef<Miembro>[] {
  return [
    {
      accessorKey: 'rut',
      header: 'RUT',
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('rut')}</span>,
    },
    {
      id: 'nombre_completo',
      header: 'Nombre Completo',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.nombre} {row.original.apellido}
        </span>
      ),
    },
    {
      accessorKey: 'estado_comunion',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.getValue<EstadoComunion>('estado_comunion');
        return <Badge variant={estadoVariant[estado]}>{estadoLabels[estado]}</Badge>;
      },
    },
    {
      accessorKey: 'telefono',
      header: 'Teléfono',
      cell: ({ row }) => row.getValue('telefono') ?? '—',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.getValue('email') ?? '—',
    },
    {
      accessorKey: 'fecha_ingreso',
      header: 'Fecha Ingreso',
      cell: ({ row }) => {
        const fecha = row.getValue<string>('fecha_ingreso');
        return new Date(fecha).toLocaleDateString('es-CL');
      },
    },
    {
      id: 'acciones',
      header: '',
      enableHiding: false,
      cell: ({ row }) => {
        const miembro = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/miembros/${miembro.id}`}>
                  <Eye className="size-4" />
                  Ver detalle
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/miembros/${miembro.id}/editar`}>
                      <Pencil className="size-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCambiarEstado(miembro)}>
                    <RefreshCw className="size-4" />
                    Cambiar estado
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
