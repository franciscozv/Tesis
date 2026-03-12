'use client';

import {
  Award,
  BadgeCheck,
  CalendarDays,
  Crown,
  Loader2,
  TrendingUp,
  Users,
  UserX,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSugerirCandidatosCargo } from '@/features/candidatos/hooks/use-sugerir-candidatos-cargo';
import type { RolGrupo } from '@/features/catalogos/types';
import type { MiembroGrupo } from '@/features/grupos-ministeriales/types';
import { useCambiarRol } from '../hooks/use-cambiar-rol';

interface NombramientoModalProps {
  grupoId: number;
  cargo: RolGrupo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Integrantes con rol no-directiva — universo de candidatos elegibles */
  integrantesNomina: MiembroGrupo[];
}

export function NombramientoModal({
  grupoId,
  cargo,
  open,
  onOpenChange,
  integrantesNomina,
}: NombramientoModalProps) {
  const sugerirMutation = useSugerirCandidatosCargo();
  const cambiarRolMutation = useCambiarRol();

  // Lanzar la consulta automáticamente al abrir el modal
  const { mutate: buscarCandidatos } = sugerirMutation;
  useEffect(() => {
    if (open && cargo) {
      buscarCandidatos({ cargo_id: cargo.id_rol_grupo, grupo_id: grupoId, periodo_meses: 12 });
    }
  }, [open, cargo?.id_rol_grupo, grupoId, buscarCandidatos]);

  function handleNombrar(miembroId: number) {
    if (!cargo) return;
    const integrante = integrantesNomina.find((mg) => mg.miembro_id === miembroId);
    if (!integrante) {
      toast.error('Este miembro no está en la nómina del grupo');
      return;
    }
    cambiarRolMutation.mutate(
      { id: integrante.id, input: { rol_grupo_id: cargo.id_rol_grupo } },
      {
        onSuccess: () => {
          toast.success('Nombramiento realizado exitosamente');
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Error al realizar el nombramiento');
        },
      },
    );
  }

  function handleClose() {
    sugerirMutation.reset();
    onOpenChange(false);
  }

  const nominaIds = new Set(integrantesNomina.map((mg) => mg.miembro_id));
  const candidatos = (sugerirMutation.data?.candidatos ?? []).filter((c) =>
    nominaIds.has(c.miembro_id),
  );
  const metadata = sugerirMutation.data?.metadata;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="size-4 text-amber-500" />
            Realizar Nombramiento
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-0.5">
              {cargo && (
                <span>
                  Cargo: <span className="font-semibold text-foreground">{cargo.nombre}</span>
                  {cargo.requiere_plena_comunion && (
                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                      · requiere plena comunión
                    </span>
                  )}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Alert className="border-blue-200 bg-blue-50 py-2.5 dark:bg-blue-950/20">
            <BadgeCheck className="size-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
              Se muestran solo los miembros de la nómina del grupo, ordenados por idoneidad según el
              algoritmo de candidatos.
            </AlertDescription>
          </Alert>

          {/* Cargando */}
          {sugerirMutation.isPending && (
            <div className="grid gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          )}

          {/* Sin nómina */}
          {!sugerirMutation.isPending && integrantesNomina.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No hay integrantes en la nómina del grupo para nominar.
              </p>
            </div>
          )}

          {/* Sin candidatos elegibles */}
          {!sugerirMutation.isPending &&
            sugerirMutation.isSuccess &&
            candidatos.length === 0 &&
            integrantesNomina.length > 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <UserX className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Ningún miembro de la nómina cumple los requisitos para este cargo.
                </p>
                {cargo?.requiere_plena_comunion && (
                  <p className="text-xs text-muted-foreground">
                    Este cargo requiere{' '}
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      Plena Comunión
                    </span>
                    .
                  </p>
                )}
              </div>
            )}

          {/* Tabla de candidatos */}
          {candidatos.length > 0 && (
            <div className="grid gap-3">
              {metadata && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''} elegible
                    {candidatos.length !== 1 ? 's' : ''} · últimos {metadata.periodo_meses_usado}{' '}
                    meses
                  </span>
                  {metadata.requiere_plena_comunion && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      Filtro: Plena Comunión
                    </Badge>
                  )}
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-2.5 font-medium text-muted-foreground">Candidato</th>
                      <th className="hidden px-4 py-2.5 text-center font-medium text-muted-foreground sm:table-cell">
                        <span className="flex items-center justify-center gap-1">
                          <Award className="size-3.5 text-amber-500" />
                          Exp.
                        </span>
                      </th>
                      <th className="hidden px-4 py-2.5 text-center font-medium text-muted-foreground sm:table-cell">
                        <span className="flex items-center justify-center gap-1">
                          <TrendingUp className="size-3.5 text-green-500" />
                          Asist.
                        </span>
                      </th>
                      <th className="hidden px-4 py-2.5 text-center font-medium text-muted-foreground md:table-cell">
                        <span className="flex items-center justify-center gap-1">
                          <CalendarDays className="size-3.5 text-purple-500" />
                          Antigüedad
                        </span>
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidatos.map((c, idx) => {
                      const pct = Math.round(c.indicadores.asistencia_ratio_periodo * 100);
                      return (
                        <tr
                          key={c.miembro_id}
                          className={
                            idx !== candidatos.length - 1
                              ? 'border-b transition-colors hover:bg-muted/30'
                              : 'transition-colors hover:bg-muted/30'
                          }
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            #{c.posicion}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium leading-none">{c.nombre_completo}</p>
                            {c.indicadores.plena_comunion && (
                              <Badge
                                variant="secondary"
                                className="mt-1.5 h-4 border-none bg-amber-100 px-1 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              >
                                <BadgeCheck className="mr-0.5 size-2.5" />
                                Plena Comunión
                              </Badge>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 text-center sm:table-cell">
                            <span className="font-medium">
                              {c.indicadores.experiencia_cargo_en_grupo}×
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-center sm:table-cell">
                            <span className="font-medium">{pct}%</span>
                          </td>
                          <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">
                            {c.indicadores.antiguedad_anios} año
                            {c.indicadores.antiguedad_anios !== 1 ? 's' : ''}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleNombrar(c.miembro_id)}
                              disabled={cambiarRolMutation.isPending}
                            >
                              {cambiarRolMutation.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Crown className="size-3.5" />
                              )}
                              Nombrar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose} disabled={cambiarRolMutation.isPending}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
