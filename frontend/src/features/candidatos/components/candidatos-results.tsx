'use client';

import type { Candidato } from '../types';
import { CandidatoCard } from './candidato-card';

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
    <div className="grid gap-3">
      {candidatos.map((c) => (
        <CandidatoCard key={c.miembro_id} candidato={c} onInvitar={onInvitar} />
      ))}
    </div>
  );
}

