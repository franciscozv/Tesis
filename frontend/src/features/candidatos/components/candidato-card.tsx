'use client';

import { CheckCircle2, Clock, Star, Tag, UserPlus, XCircle } from 'lucide-react';
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

  return (
    <Card>
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
              <Badge variant="destructive">
                <XCircle className="mr-1 size-3" />
                {indicadores.conflictos_en_fecha_count} conflicto
                {indicadores.conflictos_en_fecha_count !== 1 ? 's' : ''}
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
