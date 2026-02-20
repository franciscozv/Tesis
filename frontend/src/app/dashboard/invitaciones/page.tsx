'use client';

import { CheckCircle, Eye, MoreHorizontal, Reply, XCircle } from 'lucide-react';
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
import { rolesActividadHooks } from '@/features/catalogos/hooks';
import { ResponderInvitacionModal } from '@/features/invitados/components/responder-invitacion-modal';
import { useInvitados } from '@/features/invitados/hooks/use-invitados';
import type { EstadoInvitado, Invitado, InvitadoFilters } from '@/features/invitados/types';

const estadoLabels: Record<EstadoInvitado, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  rechazado: 'Rechazado',
};

const estadoVariant: Record<EstadoInvitado, 'default' | 'secondary' | 'destructive'> = {
  pendiente: 'default',
  confirmado: 'secondary',
  rechazado: 'destructive',
};

function formatFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDatetime(datetime: string) {
  return new Date(datetime).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function InvitacionesPage() {
  const { usuario } = useAuth();
  const isMiembro = usuario?.rol === 'miembro';

  const [estadoFilter, setEstadoFilter] = useState<string>('todos');

  const filters: InvitadoFilters = {};
  if (isMiembro && usuario?.miembro_id) {
    filters.miembro_id = usuario.miembro_id;
  }
  if (estadoFilter !== 'todos') filters.estado = estadoFilter as EstadoInvitado;

  const { data: invitados, isLoading } = useInvitados(filters);
  const { data: rolesActividad } = rolesActividadHooks.useAllActivos();

  const [respondiendo, setRespondiendo] = useState<Invitado | null>(null);

  const rolesMap = useMemo(
    () => new Map(rolesActividad?.map((r) => [r.id_rol, r])),
    [rolesActividad],
  );

  const canRespond = (inv: Invitado) => {
    if (inv.estado !== 'pendiente') return false;
    if (!usuario?.miembro_id) return false;
    return inv.miembro_id === usuario.miembro_id;
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isMiembro ? 'Mis Invitaciones' : 'Invitaciones'}
        </h1>
        <p className="text-muted-foreground">
          {isMiembro
            ? 'Revise y responda sus invitaciones a actividades.'
            : 'Gestión de invitaciones a actividades.'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actividad</TableHead>
              {!isMiembro && <TableHead>Miembro</TableHead>}
              <TableHead className="hidden md:table-cell">Rol</TableHead>
              <TableHead className="hidden md:table-cell">Fecha Actividad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Asistió</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              ['s1', 's2', 's3', 's4', 's5'].map((key) => (
                <TableRow key={key}>
                  <TableCell colSpan={isMiembro ? 6 : 7}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !invitados?.length ? (
              <TableRow>
                <TableCell colSpan={isMiembro ? 6 : 7} className="h-24 text-center">
                  No se encontraron invitaciones.
                </TableCell>
              </TableRow>
            ) : (
              invitados.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/actividades/${inv.actividad_id}`}
                      className="hover:underline"
                    >
                      {inv.actividad?.nombre ?? `Actividad #${inv.actividad_id}`}
                    </Link>
                  </TableCell>
                  {!isMiembro && (
                    <TableCell>
                      {inv.miembro
                        ? `${inv.miembro.nombre} ${inv.miembro.apellido}`
                        : `Miembro #${inv.miembro_id}`}
                    </TableCell>
                  )}
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">
                      {rolesMap.get(inv.rol_id)?.nombre ?? inv.rol?.nombre ?? `Rol #${inv.rol_id}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell">
                    {inv.actividad?.fecha
                      ? formatFecha(inv.actividad.fecha)
                      : formatDatetime(inv.fecha_invitacion)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={estadoVariant[inv.estado]}>{estadoLabels[inv.estado]}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {inv.asistio ? (
                      <CheckCircle className="size-4 text-green-600" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/actividades/${inv.actividad_id}`}>
                            <Eye className="size-4" />
                            Ver actividad
                          </Link>
                        </DropdownMenuItem>
                        {canRespond(inv) && (
                          <DropdownMenuItem onClick={() => setRespondiendo(inv)}>
                            <Reply className="size-4" />
                            Responder
                          </DropdownMenuItem>
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

      <ResponderInvitacionModal
        invitado={respondiendo}
        open={!!respondiendo}
        onOpenChange={(open) => !open && setRespondiendo(null)}
      />
    </div>
  );
}
