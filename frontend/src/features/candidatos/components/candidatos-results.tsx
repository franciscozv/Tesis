'use client';

import { UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Candidato } from '../types';

const criterios = [
  { key: 'experiencia' as const, label: 'Exp', max: 30 },
  { key: 'antiguedad' as const, label: 'Ant', max: 20 },
  { key: 'asistencia' as const, label: 'Asis', max: 30 },
  { key: 'disponibilidad' as const, label: 'Disp', max: 20 },
];

interface CandidatosResultsProps {
  candidatos: Candidato[];
  onInvitar?: (candidato: Candidato) => void;
}

export function CandidatosResults({ candidatos, onInvitar }: CandidatosResultsProps) {
  if (candidatos.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No se encontraron candidatos para esta búsqueda.
      </p>
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Candidato</TableHead>
            <TableHead className="text-center">Puntaje</TableHead>
            <TableHead>Desglose</TableHead>
            <TableHead>Justificación</TableHead>
            {onInvitar && <TableHead className="w-24" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidatos.map((c) => (
            <TableRow key={c.miembro_id}>
              <TableCell>
                <div>
                  <p className="font-medium">{c.nombre_completo}</p>
                  {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={c.puntuacion_total >= 70 ? 'default' : 'secondary'}>
                  {c.puntuacion_total}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="grid gap-1.5 min-w-[140px]">
                  {criterios.map((cr) => (
                    <Tooltip key={cr.key}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <span className="w-8 text-xs text-muted-foreground">{cr.label}</span>
                          <Progress
                            value={(c.desglose[cr.key] / cr.max) * 100}
                            className="h-1.5 flex-1"
                          />
                          <span className="w-8 text-right text-xs">
                            {c.desglose[cr.key]}/{cr.max}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {cr.label === 'Exp' && 'Experiencia en el rol'}
                        {cr.label === 'Ant' && 'Antigüedad en la iglesia'}
                        {cr.label === 'Asis' && 'Asistencia a actividades'}
                        {cr.label === 'Disp' && 'Disponibilidad en la fecha'}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                {c.justificacion}
              </TableCell>
              {onInvitar && (
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => onInvitar(c)}>
                    <UserPlus className="size-4" />
                    Invitar
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
