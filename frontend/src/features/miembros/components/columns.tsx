'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, RefreshCw, Trash2 } from 'lucide-react';
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
  onEliminar: (miembro: Miembro) => void;
}

export function getMiembrosColumns({
  isAdmin,
  onCambiarEstado,
  onEliminar,
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
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {row.original.nombre} {row.original.apellido}
          </span>
          {!row.original.activo && (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              Inactivo
            </Badge>
          )}
        </div>
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
              {isAdmin && miembro.activo && (
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
                  <DropdownMenuItem
                    onClick={() => onEliminar(miembro)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Dar de baja
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
