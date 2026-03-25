'use client';

import { Shield, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMisGrupos } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';

export default function MisGruposPage() {
  const router = useRouter();
  const { data: misGrupos, isLoading } = useMisGrupos();
  const [search, setSearch] = useState('');

  const filtered =
    misGrupos?.filter((g) => !search || g.nombre.toLowerCase().includes(search.toLowerCase())) ??
    [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-light tracking-tight">Mis Grupos</h1>
        <p className="text-muted-foreground text-sm">Grupos ministeriales en los que participas</p>
      </div>

      <div>
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead>Mi Rol</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  ['s1', 's2', 's3'].map((key) => (
                    <TableRow key={key}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="size-8 opacity-30" />
                        <p className="text-sm">
                          {search
                            ? 'No se encontraron grupos.'
                            : 'Aún no perteneces a ningún grupo ministerial.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((grupo) => (
                    <TableRow
                      key={grupo.id_grupo}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/grupos/${grupo.id_grupo}?from=mis-grupos`)
                      }
                    >
                      <TableCell className="font-medium">{grupo.nombre}</TableCell>
                      <TableCell className="text-muted-foreground hidden max-w-xs truncate md:table-cell">
                        {grupo.descripcion ?? '—'}
                      </TableCell>
                      <TableCell>
                        {grupo.es_directiva_miembro ? (
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary"
                          >
                            <Shield className="size-3" />
                            Directiva
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Integrante</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={grupo.activo ? 'success' : 'secondary'}>
                          {grupo.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
