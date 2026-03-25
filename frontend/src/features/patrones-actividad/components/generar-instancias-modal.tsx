'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenerarInstancias } from '../hooks/use-generar-instancias';
import { usePatrones } from '../hooks/use-patrones';
import { type GenerarInstanciasFormData, generarInstanciasSchema } from '../schemas';
import type { PatronActividad } from '../types';

const meses = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const currentYear = new Date().getFullYear();
const anios = Array.from({ length: 7 }, (_, i) => currentYear + i - 1);

/**
 * Calcula las fechas (días del mes) que generaría un patrón para un mes/año dado.
 * dia_semana: 1=Lunes … 6=Sábado, 7=Domingo (convención del form)
 * Date.getDay(): 0=Domingo, 1=Lunes … 6=Sábado
 */
function calcularFechasPatron(patron: PatronActividad, mes: number, anio: number): Date[] {
  const jsDia = patron.dia_semana === 7 ? 0 : patron.dia_semana;
  const diasEnMes = new Date(anio, mes, 0).getDate();

  const coincidencias: Date[] = [];
  for (let d = 1; d <= diasEnMes; d++) {
    const fecha = new Date(anio, mes - 1, d);
    if (fecha.getDay() === jsDia) {
      coincidencias.push(fecha);
    }
  }

  switch (patron.frecuencia) {
    case 'semanal':
      return coincidencias;
    case 'primera_semana':
      return coincidencias.slice(0, 1);
    case 'segunda_semana':
      return coincidencias.slice(1, 2);
    case 'tercera_semana':
      return coincidencias.slice(2, 3);
    case 'cuarta_semana':
      return coincidencias.slice(3, 4);
    default:
      return [];
  }
}

interface GenerarInstanciasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerarInstanciasModal({ open, onOpenChange }: GenerarInstanciasModalProps) {
  const mutation = useGenerarInstancias();
  const { data: patrones } = usePatrones();

  const form = useForm<GenerarInstanciasFormData>({
    // biome-ignore lint/suspicious/noExplicitAny: z.coerce creates input type mismatch with zodResolver
    resolver: zodResolver(generarInstanciasSchema) as any,
    defaultValues: {
      mes: new Date().getMonth() + 1,
      anio: currentYear,
    },
  });

  const mesSeleccionado = Number(form.watch('mes'));
  const anioSeleccionado = Number(form.watch('anio'));

  const patronesActivos = patrones?.filter((p) => p.activo) ?? [];

  const preview = patronesActivos.map((patron) => ({
    patron,
    fechas: calcularFechasPatron(patron, mesSeleccionado, anioSeleccionado),
  }));

  const totalInstancias = preview.reduce((acc, { fechas }) => acc + fechas.length, 0);
  const nombreMes = meses.find((m) => m.value === String(mesSeleccionado))?.label ?? '';

  function onSubmit(data: GenerarInstanciasFormData) {
    mutation.mutate(data, {
      onSuccess: (result) => {
        toast.success(
          `Se generaron ${result.total_actividades_creadas} actividades desde ${result.total_patrones} patrones`,
        );
        onOpenChange(false);
      },
      onError: () => {
        toast.error('Error al generar instancias');
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generar Instancias</DialogTitle>
          <DialogDescription>
            Genera actividades automáticamente desde todos los patrones activos para el mes y año
            seleccionados.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="mes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mes</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {meses.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="anio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {anios.map((a) => (
                        <SelectItem key={a} value={String(a)}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vista previa de fechas */}
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vista previa · {nombreMes} {anioSeleccionado}
              </p>
              {patronesActivos.length === 0 ? (
                <p className="text-muted-foreground">No hay patrones activos.</p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {preview.map(({ patron, fechas }) => (
                    <li key={patron.id} className="grid grid-cols-[1fr_auto] gap-x-3">
                      <span className="truncate font-medium">{patron.nombre}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {fechas.length === 0
                          ? 'sin fechas'
                          : `días ${fechas.map((f) => f.getDate()).join(', ')}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {patronesActivos.length > 0 && (
                <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                  {totalInstancias === 0
                    ? 'No se crearán actividades este mes.'
                    : `${totalInstancias} actividad${totalInstancias !== 1 ? 'es' : ''} a crear (se omiten duplicados)`}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || totalInstancias === 0}>
                {mutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <CalendarPlus className="size-4" />
                )}
                Generar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
