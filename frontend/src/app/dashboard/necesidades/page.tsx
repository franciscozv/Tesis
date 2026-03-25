'use client';

import { HandHeart, Package } from 'lucide-react';
import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { tiposNecesidadHooks } from '@/features/catalogos/hooks';
import { OfrecerseModal } from '@/features/colaboradores/components/ofrecerse-modal';
import { useNecesidadesAbiertas } from '@/features/necesidades/hooks/use-necesidades-abiertas';
import type { NecesidadLogistica } from '@/features/necesidades/types';

function formatFecha(fecha: string) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatHora(hora: string) {
  return hora.slice(0, 5);
}

export default function NecesidadesAbiertasPage() {
  const { usuario } = useAuth();
  const miembroId = usuario?.id;

  const { data: necesidades, isLoading } = useNecesidadesAbiertas();
  const { data: tiposNecesidad } = tiposNecesidadHooks.useAllActivos();

  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [soloConFaltante, setSoloConFaltante] = useState(false);
  const [ofreciendose, setOfreciendose] = useState<NecesidadLogistica | null>(null);
  const checkboxId = useId();

  const tiposMap = useMemo(
    () => new Map(tiposNecesidad?.map((t) => [t.id_tipo, t])),
    [tiposNecesidad],
  );

  const filtered = useMemo(() => {
    if (!necesidades) return [];
    return necesidades.filter((n) => {
      if (tipoFilter !== 'todos' && n.tipo_necesidad_id !== Number(tipoFilter)) return false;
      if (soloConFaltante && n.cantidad_cubierta >= n.cantidad_requerida) return false;
      return true;
    });
  }, [necesidades, tipoFilter, soloConFaltante]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Necesidades Materiales</h1>
          <p className="text-muted-foreground">
            Necesidades abiertas para actividades de los próximos 60 días.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Tipo de necesidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposNecesidad?.map((t) => (
              <SelectItem key={t.id_tipo} value={String(t.id_tipo)}>
                {t.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Checkbox
            id={checkboxId}
            checked={soloConFaltante}
            onCheckedChange={(checked) => setSoloConFaltante(!!checked)}
          />
          <Label htmlFor={checkboxId} className="text-sm">
            Solo con faltante
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {['s1', 's2', 's3', 's4', 's5', 's6'].map((key) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <Skeleton className="mb-3 h-5 w-3/4" />
                <Skeleton className="mb-3 h-4 w-full" />
                <Skeleton className="mb-3 h-2 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="text-muted-foreground">No hay necesidades abiertas en este momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((nec) => {
            const faltante = nec.cantidad_requerida - nec.cantidad_cubierta;
            const progreso = Math.round((nec.cantidad_cubierta / nec.cantidad_requerida) * 100);
            const tipoNombre =
              tiposMap.get(nec.tipo_necesidad_id)?.nombre ??
              nec.tipo_necesidad?.nombre ??
              'Sin tipo';

            return (
              <Card key={nec.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold leading-tight">
                      {nec.actividad ? (
                        <Link
                          href={`/dashboard/actividades/${nec.actividad_id}?origin=necesidades`}
                          className="hover:underline"
                        >
                          {nec.actividad.nombre}
                        </Link>
                      ) : (
                        `Actividad #${nec.actividad_id}`
                      )}
                    </CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      {tipoNombre}
                    </Badge>
                  </div>
                  {nec.actividad?.fecha && (
                    <p className="text-xs text-muted-foreground">
                      {formatFecha(nec.actividad.fecha)}
                      {nec.actividad.hora_inicio && ` · ${formatHora(nec.actividad.hora_inicio)}`}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm">{nec.descripcion}</p>

                  <div className="grid gap-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso</span>
                      <span>
                        {nec.cantidad_cubierta} / {nec.cantidad_requerida} {nec.unidad_medida}
                      </span>
                    </div>
                    <Progress value={progreso} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Faltan:{' '}
                      <span className="font-medium text-foreground">
                        {faltante} {nec.unidad_medida}
                      </span>
                    </span>
                    {faltante > 0 && miembroId && (
                      <Button
                        size="sm"
                        onClick={() => setOfreciendose(nec)}
                        aria-label={`Ofrecerme para ${nec.actividad?.nombre ?? `Actividad #${nec.actividad_id}`}${nec.actividad?.fecha ? `, ${formatFecha(nec.actividad.fecha)}` : ''}, ${tipoNombre}`}
                      >
                        <HandHeart className="size-4" />
                        Ofrecerme
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {miembroId && (
        <OfrecerseModal
          necesidad={ofreciendose}
          miembroId={miembroId}
          open={!!ofreciendose}
          onOpenChange={(open) => !open && setOfreciendose(null)}
        />
      )}
    </div>
  );
}
