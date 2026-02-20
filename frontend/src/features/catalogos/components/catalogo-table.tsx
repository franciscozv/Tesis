'use client';

import { Pencil, Power, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ColumnConfig<T> {
  key: keyof T | 'actions';
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface CatalogoTableProps<T> {
  items: T[] | undefined;
  columns: ColumnConfig<T>[];
  idKey: keyof T;
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggleEstado?: (item: T) => void;
}

export function CatalogoTable<T>({
  items,
  columns,
  idKey,
  isLoading,
  isAdmin,
  onEdit,
  onDelete,
  onToggleEstado,
}: CatalogoTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!items?.length) {
    return <p className="py-8 text-center text-muted-foreground">No hay registros.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.key)}>{col.header}</TableHead>
          ))}
          {isAdmin && <TableHead className="w-[100px]">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={String(item[idKey])}>
            {columns.map((col) => (
              <TableCell key={String(col.key)}>
                {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '—')}
              </TableCell>
            ))}
            {isAdmin && (
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {onToggleEstado && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleEstado(item)}
                      title={(item as Record<string, unknown>).activo ? 'Desactivar' : 'Activar'}
                    >
                      <Power
                        className={`h-4 w-4 ${(item as Record<string, unknown>).activo ? 'text-destructive' : 'text-green-600'}`}
                      />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => onDelete(item)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ActiveBadge({ activo }: { activo: boolean }) {
  return <Badge variant={activo ? 'default' : 'secondary'}>{activo ? 'Activo' : 'Inactivo'}</Badge>;
}

export function BooleanBadge({
  value,
  trueLabel,
  falseLabel,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return <Badge variant={value ? 'default' : 'outline'}>{value ? trueLabel : falseLabel}</Badge>;
}

export function ColorCell({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
      <span className="font-mono text-xs">{color}</span>
    </div>
  );
}
