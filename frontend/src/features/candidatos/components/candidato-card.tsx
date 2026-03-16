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
  const esNuevoTalento = indicadores.experiencia_rol_total === 0;
  const tieneConflicto = !indicadores.disponible_en_fecha;

  return (
    <Card className={tieneConflicto ? 'border-destructive/60 bg-destructive/5' : ''}>
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
              <Badge variant="outline" className="border-success-foreground text-success-foreground">
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
            <Star className="size-3.5 shrink-0 text-warning-foreground" />
            <span className="text-muted-foreground">Exp. total:</span>
            <span className="ml-auto font-medium">{indicadores.experiencia_rol_total}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Tag className="size-3.5 shrink-0 text-primary" />
            <span className="text-muted-foreground">En este tipo:</span>
            <span className="ml-auto font-medium">{indicadores.experiencia_rol_en_tipo}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="size-3.5 shrink-0 text-success-foreground" />
            <span className="text-muted-foreground">Actividad en Servicios:</span>
            <span className="ml-auto font-medium">{indicadores.asistencias_count} serv.</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="size-3.5 shrink-0 text-accent-foreground" />
            <span className="text-muted-foreground">Antigüedad:</span>
            <span className="ml-auto font-medium">{indicadores.antiguedad_anios} años</span>
          </div>

          {/* Indicadores de rotación y carga semanal */}
          <div className="col-span-2 flex items-start gap-1.5 text-sm">
            <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-warning-foreground" />
            <span className="text-muted-foreground">Último uso:</span>
            <span className="ml-auto text-right font-medium">
              {indicadores.dias_desde_ultimo_uso === null ? (
                '—'
              ) : indicadores.ultimo_uso_nombre ? (
                <>
                  <span>hace {indicadores.dias_desde_ultimo_uso}d</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {indicadores.ultimo_uso_tipo_actividad
                      ? `${indicadores.ultimo_uso_tipo_actividad} · ${indicadores.ultimo_uso_nombre}`
                      : indicadores.ultimo_uso_nombre}
                  </span>
                </>
              ) : (
                `hace ${indicadores.dias_desde_ultimo_uso}d`
              )}
            </span>
          </div>
          <div className="col-span-2 flex items-start gap-1.5 text-sm">
            <Briefcase className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
            <span className="text-muted-foreground">Esta semana:</span>
            <span
              className={`ml-auto text-right font-medium ${indicadores.servicios_esta_semana > 1 ? 'text-warning-foreground dark:text-warning-foreground' : ''}`}
            >
              {indicadores.servicios_esta_semana === 0 ? (
                '0 servicios'
              ) : (
                <>
                  <span>
                    {indicadores.servicios_esta_semana} servicio
                    {indicadores.servicios_esta_semana !== 1 ? 's' : ''}
                  </span>
                  {indicadores.servicios_esta_semana_detalle &&
                    indicadores.servicios_esta_semana_detalle.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5 text-right">
                        {indicadores.servicios_esta_semana_detalle.map((s, i) => {
                          const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                          const dia = s.fecha
                            ? DIAS[new Date(s.fecha + 'T12:00:00').getDay()]
                            : null;
                          return (
                            <li key={i} className="text-xs font-normal text-muted-foreground">
                              {dia && <span className="font-medium">{dia} · </span>}
                              {s.rol} en {s.actividad}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Resumen de servicios realizados */}
        <div className="rounded-md border bg-muted/30 p-2.5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Actividades Realizadas:
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
              No se registran actividades realizadas en el período de análisis.
            </p>
          )}
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
