'use client';

import { Award, CalendarDays, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { CandidatoCargo } from '../types';

interface CandidatoCargoCardProps {
  candidato: CandidatoCargo;
}

export function CandidatoCargoCard({ candidato }: CandidatoCargoCardProps) {
  const { indicadores } = candidato;
  const pct = Math.round(indicadores.asistencia_ratio_periodo * 100);
  const gruposVariant = indicadores.grupos_activos_count <= 1 ? 'secondary' : 'outline';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 font-bold text-muted-foreground">
                #{candidato.posicion}
              </span>
              <p className="truncate font-semibold leading-tight">{candidato.nombre_completo}</p>
            </div>
            {candidato.email && (
              <p className="mt-0.5 text-xs text-muted-foreground">{candidato.email}</p>
            )}
            {candidato.telefono && (
              <p className="text-xs text-muted-foreground">{candidato.telefono}</p>
            )}
          </div>

          {indicadores.plena_comunion && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Plena comunión
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {/* Experiencia en el cargo dentro del grupo */}
          <div className="flex items-center gap-1.5 text-sm">
            <Award className="size-3.5 shrink-0 text-amber-500" />
            <span className="text-muted-foreground">En este grupo:</span>
            <span className="ml-auto font-medium">{indicadores.experiencia_cargo_en_grupo}×</span>
          </div>

          {/* Grupos activos — menos es mejor */}
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="size-3.5 shrink-0 text-blue-500" />
            <span className="text-muted-foreground">Grupos activos:</span>
            <span className="ml-auto">
              <Badge variant={gruposVariant} className="px-1.5 py-0 text-xs font-medium">
                {indicadores.grupos_activos_count}
              </Badge>
            </span>
          </div>

          {/* Actividad en Servicios */}
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className="size-3.5 shrink-0 text-green-500" />
            <span className="text-muted-foreground">Actividad en Servicios:</span>
            <span className="ml-auto font-medium">{indicadores.asistencias_count} serv.</span>
          </div>

          {/* Antigüedad */}
          <div className="flex items-center gap-1.5 text-sm">
            <CalendarDays className="size-3.5 shrink-0 text-purple-500" />
            <span className="text-muted-foreground">Antigüedad:</span>
            <span className="ml-auto font-medium">{indicadores.antiguedad_anios} años</span>
          </div>
        </div>

        {/* Resumen de servicios realizados en el período */}
        <div className="rounded-md border bg-muted/30 p-2.5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Resumen de actividades:
          </p>
          {indicadores.resumen_servicios && indicadores.resumen_servicios.length > 0 ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {indicadores.resumen_servicios.map((s, idx) => (
                <span key={idx} className="text-xs text-muted-foreground">
                  • <span className="font-semibold text-foreground">{s.cantidad}</span> {s.tipo} ({s.rol})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No se registran servicios realizados en el período de análisis.
            </p>
          )}
        </div>

        {/* Justificación */}
        <p className="text-sm text-muted-foreground">{candidato.justificacion}</p>
      </CardContent>
    </Card>
  );
}
