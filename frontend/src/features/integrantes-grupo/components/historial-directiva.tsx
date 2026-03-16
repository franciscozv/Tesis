'use client';

import { ChevronDown, ChevronUp, Clock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { HistorialDirectivaEntry } from '../types';

interface HistorialDirectivaProps {
  historial: HistorialDirectivaEntry[] | null | undefined;
  isLoading: boolean;
}

interface EntradaAnio {
  anio: number;
  entradas: HistorialDirectivaEntry[];
}

function agruparPorAnio(historial: HistorialDirectivaEntry[]): EntradaAnio[] {
  const map = new Map<number, HistorialDirectivaEntry[]>();
  for (const entry of historial) {
    const anio = new Date(entry.fecha_vinculacion).getFullYear();
    if (!map.has(anio)) map.set(anio, []);
    map.get(anio)!.push(entry);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b - a)
    .map(([anio, entradas]) => ({ anio, entradas }));
}

function getNombreMiembro(entry: HistorialDirectivaEntry): string {
  if (entry.miembro) return `${entry.miembro.nombre} ${entry.miembro.apellido}`;
  return `Miembro #${entry.miembro_id}`;
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function AnioSection({ grupo }: { grupo: EntradaAnio }) {
  const [abierto, setAbierto] = useState(true);

  // Agrupar por cargo para mostrar quién ocupó cada cargo ese año
  const porCargo = new Map<string, HistorialDirectivaEntry[]>();
  for (const e of grupo.entradas) {
    const key = e.rol.nombre;
    if (!porCargo.has(key)) porCargo.set(key, []);
    porCargo.get(key)!.push(e);
  }

  return (
    <div className="rounded-lg border">
      {/* Header del año */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary dark:text-primary" />
          <span className="font-semibold text-sm">{grupo.anio}</span>
          <Badge variant="secondary" className="ml-1 text-xs">
            {grupo.entradas.length} registro{grupo.entradas.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {abierto ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {/* Contenido desplegable */}
      {abierto && (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...porCargo.entries()].map(([cargoNombre, entradas]) => (
              <div
                key={cargoNombre}
                className="rounded-md border border-primary/20 bg-primary/5 p-3 dark:border-primary/20 dark:bg-primary/5"
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 shrink-0 text-primary dark:text-primary" />
                  <span className="text-xs font-semibold text-primary dark:text-primary">
                    {cargoNombre}
                  </span>
                </div>
                <div className="grid gap-1.5">
                  {entradas.map((e) => (
                    <div key={e.id} className="text-sm">
                      <p className="font-medium leading-none">{getNombreMiembro(e)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatFecha(e.fecha_vinculacion)}
                        {e.fecha_desvinculacion
                          ? ` → ${formatFecha(e.fecha_desvinculacion)}`
                          : ' → Activo'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistorialDirectiva({ historial, isLoading }: HistorialDirectivaProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!historial || historial.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No hay historial de directiva registrado para este grupo.
      </p>
    );
  }

  const grupos = agruparPorAnio(historial);

  return (
    <div className="grid gap-2">
      {grupos.map((g) => (
        <AnioSection key={g.anio} grupo={g} />
      ))}
    </div>
  );
}
