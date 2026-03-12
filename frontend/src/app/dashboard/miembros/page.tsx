'use client';

import axios from 'axios';
import { Plus, ShieldOff } from 'lucide-react';
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
import { MiembroFormModal } from '@/features/miembros/components/miembro-form-modal';
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
  const [createOpen, setCreateOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      estado_comunion: estadoFilter || undefined,
    }),
    [page, search, estadoFilter],
  );

  const { data, isLoading, isFetching, error } = useMiembrosPaginated(queryParams);

  const isForbidden = axios.isAxiosError(error) && error.response?.status === 403;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleEstadoFilter = useCallback((value: string) => {
    setEstadoFilter(value === 'todos' ? '' : (value as EstadoComunion));
    setPage(1);
  }, []);

  const columns = useMemo(
    () => getMiembrosColumns({ isAdmin, onCambiarEstado: setEstadoModal }),
    [isAdmin],
  );

  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <ShieldOff className="size-12 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">Acceso restringido</h2>
          <p className="text-muted-foreground mt-1">
            Solo los miembros de directiva pueden ver la lista de miembros.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Miembros</h1>
          <p className="text-muted-foreground">Gestión de miembros de la iglesia</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo Miembro
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

      <MiembroFormModal open={createOpen} onOpenChange={setCreateOpen} />

      <CambiarEstadoModal
        miembro={estadoModal}
        open={!!estadoModal}
        onOpenChange={(open) => !open && setEstadoModal(null)}
      />
    </div>
  );
}
