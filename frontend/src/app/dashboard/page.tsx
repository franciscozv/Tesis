'use client';

import { Calendar, Mail, Package, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMiembros } from '@/features/miembros/hooks/use-miembros';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, description, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-muted-foreground text-xs">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: miembros, isLoading } = useMiembros();

  const totalMiembros = miembros?.length ?? 0;
  const activos = miembros?.filter((m) => m.activo).length ?? 0;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del sistema</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Miembros"
          value={totalMiembros}
          icon={Users}
          description={`${activos} activos`}
          loading={isLoading}
        />
        <StatCard
          title="Próximas Actividades"
          value="—"
          icon={Calendar}
          description="Próximos 15 días"
        />
        <StatCard
          title="Necesidades Abiertas"
          value="—"
          icon={Package}
          description="Pendientes de asignar"
        />
        <StatCard
          title="Invitaciones Pendientes"
          value="—"
          icon={Mail}
          description="Sin respuesta"
        />
      </div>
    </div>
  );
}
