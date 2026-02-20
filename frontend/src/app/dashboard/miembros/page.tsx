'use client';

import { Eye, MoreHorizontal, Pencil, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { CambiarEstadoModal } from '@/features/miembros/components/cambiar-estado-modal';
import { useMiembros } from '@/features/miembros/hooks/use-miembros';
import type { EstadoMembresia, Miembro } from '@/features/miembros/types';

const estadoLabels: Record<EstadoMembresia, string> = {
  sin_membresia: 'Sin Membresía',
  probando: 'Probando',
  plena_comunion: 'Plena Comunión',
};

const estadoVariant: Record<EstadoMembresia, 'default' | 'secondary' | 'outline'> = {
  plena_comunion: 'default',
  probando: 'secondary',
  sin_membresia: 'outline',
};

export default function MiembrosPage() {
  const { data: miembros, isLoading } = useMiembros();
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [estadoModal, setEstadoModal] = useState<Miembro | null>(null);

  const filtered = useMemo(() => {
    if (!miembros) return [];
    return miembros.filter((m) => {
      const matchesSearch =
        !search ||
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
        m.rut.toLowerCase().includes(search.toLowerCase());
      const matchesEstado = estadoFilter === 'todos' || m.estado_membresia === estadoFilter;
      return matchesSearch && matchesEstado;
    });
  }, [miembros, search, estadoFilter]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Miembros</h1>
          <p className="text-muted-foreground">Gestión de miembros de la iglesia</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/miembros/nuevo">
              <Plus className="size-4" />
              Nuevo Miembro
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por nombre o RUT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="sin_membresia">Sin Membresía</SelectItem>
            <SelectItem value="probando">Probando</SelectItem>
            <SelectItem value="plena_comunion">Plena Comunión</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ['s1', 's2', 's3', 's4', 's5'].map((key) => (
                <TableRow key={key}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron miembros.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((miembro) => (
                <TableRow key={miembro.id}>
                  <TableCell className="font-mono text-sm">{miembro.rut}</TableCell>
                  <TableCell className="font-medium">
                    {miembro.nombre} {miembro.apellido}
                  </TableCell>
                  <TableCell>
                    <Badge variant={estadoVariant[miembro.estado_membresia]}>
                      {estadoLabels[miembro.estado_membresia]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{miembro.telefono ?? '—'}</TableCell>
                  <TableCell className="hidden md:table-cell">{miembro.email ?? '—'}</TableCell>
                  <TableCell>
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
                            <DropdownMenuItem onClick={() => setEstadoModal(miembro)}>
                              <RefreshCw className="size-4" />
                              Cambiar estado
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CambiarEstadoModal
        miembro={estadoModal}
        open={!!estadoModal}
        onOpenChange={(open) => !open && setEstadoModal(null)}
      />
    </div>
  );
}
