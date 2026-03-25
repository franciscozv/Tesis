'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GrupoMinisterial } from '../types';

interface GruposTableProps {
  grupos: GrupoMinisterial[];
  isLoading: boolean;
  isAdmin: boolean;
  onEliminar: (grupo: GrupoMinisterial) => void;
}

export function GruposTable({ grupos, isLoading, isAdmin, onEliminar }: GruposTableProps) {
  const router = useRouter();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead>Estado</TableHead>
                {isAdmin && <TableHead className="w-28" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                ['s1', 's2', 's3'].map((key) => (
                  <TableRow key={key}>
                    <TableCell colSpan={isAdmin ? 4 : 3}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : grupos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="h-24 text-center">
                    No se encontraron grupos.
                  </TableCell>
                </TableRow>
              ) : (
                grupos.map((grupo) => (
                  <TableRow
                    key={grupo.id_grupo}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/grupos/${grupo.id_grupo}`)}
                  >
                    <TableCell className="font-medium">{grupo.nombre}</TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-xs truncate md:table-cell">
                      {grupo.descripcion ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={grupo.activo ? 'success' : 'secondary'}>
                        {grupo.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {/* Desktop: botones independientes */}
                        <div className="hidden items-center justify-end gap-1 md:flex">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/dashboard/grupos/${grupo.id_grupo}/editar`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onEliminar(grupo)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        {/* Móvil: menú de tres puntos */}
                        <div className="flex justify-end md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/grupos/${grupo.id_grupo}/editar`}>
                                  <Pencil className="size-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onEliminar(grupo)}
                              >
                                <Trash2 className="size-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
