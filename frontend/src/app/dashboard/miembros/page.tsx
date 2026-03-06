'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { CambiarEstadoModal } from '@/features/miembros/components/cambiar-estado-modal';
import { getMiembrosColumns } from '@/features/miembros/components/columns';
import { DataTable } from '@/features/miembros/components/data-table';
import { useMiembrosPaginated } from '@/features/miembros/hooks/use-miembros';
import type { EstadoComunion, Miembro } from '@/features/miembros/types';

const PAGE_SIZE = 10;

export default function MiembrosPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoComunion | ''>('');
  const [estadoModal, setEstadoModal] = useState<Miembro | null>(null);

  const queryParams = useMemo(
    () => ({ page, limit: PAGE_SIZE, search: search || undefined, estado_comunion: estadoFilter || undefined }),
    [page, search, estadoFilter],
  );

  const { data, isLoading, isFetching } = useMiembrosPaginated(queryParams);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [],
  );

  const handleEstadoFilter = useCallback(
    (value: string) => {
      setEstadoFilter(value === 'todos' ? '' : (value as EstadoComunion));
      setPage(1);
    },
    [],
  );

  const columns = useMemo(
    () => getMiembrosColumns({ isAdmin, onCambiarEstado: setEstadoModal }),
    [isAdmin],
  );

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
          onChange={(e) => handleSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={estadoFilter || 'todos'} onValueChange={handleEstadoFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="asistente">Asistente</SelectItem>
            <SelectItem value="probando">Probando</SelectItem>
            <SelectItem value="plena_comunion">Plena Comunión</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        meta={data?.meta}
        isLoading={isLoading || isFetching}
        page={page}
        onPageChange={setPage}
      />

      <CambiarEstadoModal
        miembro={estadoModal}
        open={!!estadoModal}
        onOpenChange={(open) => !open && setEstadoModal(null)}
      />
    </div>
  );
}

