'use client';

import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  Star,
  Tag,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Candidato } from '../types';

interface CandidatoCardProps {
  candidato: Candidato;
  onInvitar?: (candidato: Candidato) => void;
}

export function CandidatoCard({ candidato, onInvitar }: CandidatoCardProps) {
  const { indicadores } = candidato;
  const pct = Math.round(indicadores.asistencia_ratio_periodo * 100);
  const esNuevoTalento = indicadores.experiencia_rol_total === 0;
  const tieneConflicto = !indicadores.disponible_en_fecha;

  return (
    <Card
      className={tieneConflicto ? 'border-destructive/60 bg-destructive/5' : ''}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold leading-tight">{candidato.nombre_completo}</p>
            {candidato.email && <p className="text-xs text-muted-foreground">{candidato.email}</p>}
            {candidato.telefono && (
              <p className="text-xs text-muted-foreground">{candidato.telefono}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {indicadores.disponible_en_fecha ? (
              <Badge variant="outline" className="border-green-600 text-green-600">
                <CheckCircle2 className="mr-1 size-3" />
                Disponible
              </Badge>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <Badge variant="destructive">
                  <XCircle className="mr-1 size-3" />
                  {indicadores.conflictos_en_fecha_count} conflicto
                  {indicadores.conflictos_en_fecha_count !== 1 ? 's' : ''}
                </Badge>
                {indicadores.conflictos_detalle && indicadores.conflictos_detalle.length > 0 && (
                  <ul className="space-y-0.5 text-right">
                    {indicadores.conflictos_detalle.map((c, i) => (
                      <li key={i} className="text-xs font-medium text-destructive">
                        {c.rol} en {c.actividad}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {esNuevoTalento && (
              <Badge
                variant="secondary"
                className="border-violet-300 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
              >
                <Sparkles className="mr-1 size-3" />
                Nuevo talento
              </Badge>
            )}
            {indicadores.plena_comunion && (
              <Badge variant="secondary" className="text-xs">
                Plena comunión
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Indicadores crudos */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="size-3.5 shrink-0 text-amber-500" />
            <span className="text-muted-foreground">Exp. total:</span>
            <span className="ml-auto font-medium">{indicadores.experiencia_rol_total}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Tag className="size-3.5 shrink-0 text-blue-500" />
            <span className="text-muted-foreground">En este tipo:</span>
            <span className="ml-auto font-medium">{indicadores.experiencia_rol_en_tipo}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
            <span className="text-muted-foreground">Asistencia:</span>
            <span className="ml-auto font-medium">{pct}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="size-3.5 shrink-0 text-purple-500" />
            <span className="text-muted-foreground">Antigüedad:</span>
            <span className="ml-auto font-medium">{indicadores.antiguedad_anios} años</span>
          </div>

          {/* Indicadores de rotación y carga semanal */}
          <div className="flex items-center gap-1.5 text-sm">
            <CalendarDays className="size-3.5 shrink-0 text-orange-500" />
            <span className="text-muted-foreground">Último uso:</span>
            <span className="ml-auto font-medium">
              {indicadores.dias_desde_ultimo_uso === null
                ? '—'
                : `hace ${indicadores.dias_desde_ultimo_uso}d`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Briefcase className="size-3.5 shrink-0 text-sky-500" />
            <span className="text-muted-foreground">Esta semana:</span>
            <span
              className={`ml-auto font-medium ${indicadores.servicios_esta_semana > 1 ? 'text-amber-600 dark:text-amber-400' : ''}`}
            >
              {indicadores.servicios_esta_semana === 0
                ? '0 servicios'
                : `${indicadores.servicios_esta_semana} servicio${indicadores.servicios_esta_semana !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Justificación */}
        <p className="text-sm text-muted-foreground">{candidato.justificacion}</p>

        {/* Botón invitar */}
        {onInvitar && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => onInvitar(candidato)}>
              <UserPlus className="size-4" />
              Invitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
