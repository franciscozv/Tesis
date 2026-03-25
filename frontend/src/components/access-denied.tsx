'use client';

import { ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function AccessDenied({
  message = 'No tienes permisos para acceder a este recurso.',
  backHref = '/dashboard',
  backLabel = 'Volver al inicio',
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <ShieldOff className="size-12 text-muted-foreground/40" />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Acceso Restringido</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
