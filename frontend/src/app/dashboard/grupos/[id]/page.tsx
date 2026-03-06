'use client';

import {
  ArrowLeft,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  UserMinus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { SugerirCargoModal } from '@/features/candidatos/components/sugerir-cargo-modal';
import { useSugerirCandidatosCargo } from '@/features/candidatos/hooks/use-sugerir-candidatos-cargo';
import { rolesGrupoHooks } from '@/features/catalogos/hooks';
import { useGrupo } from '@/features/grupos-ministeriales/hooks/use-grupos';
import { useMisGrupos } from '@/features/grupos-ministeriales/hooks/use-mis-grupos';
import { CambiarRolModal } from '@/features/integrantes-grupo/components/cambiar-rol-modal';
import { VincularMiembroModal } from '@/features/integrantes-grupo/components/vincular-miembro-modal';
import { useDesvincularMiembro } from '@/features/integrantes-grupo/hooks/use-desvincular-miembro';
import { useIntegrantesGrupo } from '@/features/integrantes-grupo/hooks/use-integrantes-grupo';
import { useMiembros } from '@/features/miembros/hooks/use-miembros';

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm">{value || '—'}</span>
    </div>
  );
}

export default function DetalleGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const grupoId = Number(id);
  const { data: grupo, isLoading } = useGrupo(grupoId);
  const { data: miembrosGrupo, isLoading: loadingMiembros } = useIntegrantesGrupo(grupoId);
  const { data: allMiembros } = useMiembros();
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const { data: misGrupos } = useMisGrupos();
  const misGruposIds = new Set(misGrupos?.map((g) => g.id_grupo) ?? []);
  const puedeEditar = isAdmin || misGruposIds.has(grupoId);

  const [vincularOpen, setVincularOpen] = useState(false);
  const [sugerirOpen, setSugerirOpen] = useState(false);
  const [cambiarRolTarget, setCambiarRolTarget] = useState<(typeof activos)[number] | null>(null);
  const [miembroADesvincular, setMiembroADesvincular] = useState<(typeof activos)[number] | null>(
    null,
  );
  const desvincularMutation = useDesvincularMiembro();
  const sugerirCargoMutation = useSugerirCandidatosCargo();
  const { data: rolesGrupo } = rolesGrupoHooks.useAllActivos();

  const miembroMap = new Map(allMiembros?.map((m) => [m.id, m]));
  const activos = miembrosGrupo?.filter((mg) => !mg.fecha_desvinculacion) ?? [];

  function handleConfirmDesvincular() {
    if (!miembroADesvincular) return;
    desvincularMutation.mutate(miembroADesvincular.id, {
      onSuccess: () => {
        toast.success('Miembro desvinculado exitosamente');
        setMiembroADesvincular(null);
      },
      onError: () => toast.error('Error al desvincular miembro'),
    });
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            {['a', 'b', 'c', 'd'].map((key) => (
              <Skeleton key={key} className="mb-3 h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!grupo) {
    return <p className="text-muted-foreground py-8 text-center">Grupo no encontrado.</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/grupos">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{grupo.nombre}</h1>
            <p className="text-muted-foreground text-sm">Grupo Ministerial</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/grupos/${grupo.id_grupo}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Nombre" value={grupo.nombre} />
            <Separator />
            <InfoRow label="Descripción" value={grupo.descripcion} />
            <Separator />
            <InfoRow label="Fecha Creación" value={grupo.fecha_creacion} />
            <Separator />
            <InfoRow label="Estado" value={grupo.activo ? 'Activo' : 'Inactivo'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Miembros del Grupo ({activos.length})
            </CardTitle>
            {puedeEditar && (
              <div className="flex gap-2">
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => setSugerirOpen(true)}>
                    <Sparkles className="size-4" />
                    Sugerir
                  </Button>
                )}
                <Button size="sm" onClick={() => setVincularOpen(true)}>
                  <Plus className="size-4" />
                  Agregar
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loadingMiembros ? (
              <div className="grid gap-2">
                {['a', 'b', 'c'].map((key) => (
                  <Skeleton key={key} className="h-8 w-full" />
                ))}
              </div>
            ) : activos.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No hay miembros en este grupo.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Vinculación</TableHead>
                    {puedeEditar && <TableHead className="w-24" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activos.map((mg) => {
                    const miembro = mg.miembro ?? miembroMap.get(mg.miembro_id);
                    const esDirectiva = mg.rol.es_directiva;
                    const gestionDirectivaBloqueada = esDirectiva && !isAdmin;
                    const desvincularBloqueado = gestionDirectivaBloqueada;
                    return (
                      <TableRow key={mg.id}>
                        <TableCell className="font-medium">
                          {miembro
                            ? `${miembro.nombre} ${miembro.apellido}`
                            : `Miembro #${mg.miembro_id}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{mg.rol.nombre}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(mg.fecha_vinculacion).toLocaleDateString('es-CL')}
                        </TableCell>
                        {puedeEditar && (
                          <TableCell>
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => !gestionDirectivaBloqueada && setCambiarRolTarget(mg)}
                                        disabled={gestionDirectivaBloqueada}
                                        style={gestionDirectivaBloqueada ? { pointerEvents: 'none' } : undefined}
                                      >
                                        <RefreshCw className="size-4" />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {gestionDirectivaBloqueada && (
                                    <TooltipContent side="left" className="max-w-56 text-center">
                                      La gestión de miembros de la directiva es facultad exclusiva de la Administración General
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => !desvincularBloqueado && setMiembroADesvincular(mg)}
                                        disabled={desvincularMutation.isPending || desvincularBloqueado}
                                        style={desvincularBloqueado ? { pointerEvents: 'none' } : undefined}
                                      >
                                        <UserMinus className="size-4" />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {desvincularBloqueado && (
                                    <TooltipContent side="left" className="max-w-56 text-center">
                                      La gestión de miembros de la directiva es facultad exclusiva de la Administración General
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <VincularMiembroModal grupoId={grupoId} open={vincularOpen} onOpenChange={setVincularOpen} />

      <CambiarRolModal
        open={!!cambiarRolTarget}
        onOpenChange={(v) => {
          if (!v) setCambiarRolTarget(null);
        }}
        comunion={cambiarRolTarget}
        rolesGrupo={rolesGrupo}
      />

      <SugerirCargoModal
        open={sugerirOpen}
        onOpenChange={setSugerirOpen}
        rolesGrupo={rolesGrupo}
        sugerirMutation={sugerirCargoMutation}
      />

      <AlertDialog
        open={!!miembroADesvincular}
        onOpenChange={(v) => {
          if (!v) setMiembroADesvincular(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                if (!miembroADesvincular) return null;
                const m =
                  miembroADesvincular.miembro ?? miembroMap.get(miembroADesvincular.miembro_id);
                const nombre = m
                  ? `${m.nombre} ${m.apellido}`
                  : `Miembro #${miembroADesvincular.miembro_id}`;
                return (
                  <>
                    ¿Está seguro que desea desvincular a{' '}
                    <span className="font-semibold text-foreground">{nombre}</span> del grupo{' '}
                    <span className="font-semibold text-foreground">{grupo.nombre}</span>? Esta
                    acción no se puede deshacer.
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={desvincularMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDesvincular}
              disabled={desvincularMutation.isPending}
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
