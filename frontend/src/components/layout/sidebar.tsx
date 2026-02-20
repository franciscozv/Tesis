'use client';

import {
  Calendar,
  ClipboardList,
  FolderCog,
  HandHeart,
  Home,
  Mail,
  Package,
  Repeat,
  ShieldCheck,
  UserPen,
  Users,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { Usuario } from '@/features/auth/types';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Usuario['rol'][];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    roles: ['administrador', 'lider', 'miembro'],
  },
  {
    label: 'Mi Perfil',
    href: '/dashboard/mi-perfil',
    icon: UserPen,
    roles: ['administrador', 'lider', 'miembro'],
  },
  {
    label: 'Mis Responsabilidades',
    href: '/dashboard/mis-responsabilidades',
    icon: ClipboardList,
    roles: ['administrador', 'lider', 'miembro'],
  },
  {
    label: 'Miembros',
    href: '/dashboard/miembros',
    icon: Users,
    roles: ['administrador', 'lider'],
  },
  {
    label: 'Grupos Ministeriales',
    href: '/dashboard/grupos',
    icon: UsersRound,
    roles: ['administrador', 'lider'],
  },
  {
    label: 'Actividades',
    href: '/dashboard/actividades',
    icon: HandHeart,
    roles: ['administrador', 'lider'],
  },
  {
    label: 'Patrones de Actividad',
    href: '/dashboard/patrones',
    icon: Repeat,
    roles: ['administrador', 'lider'],
  },
  {
    label: 'Calendario',
    href: '/dashboard/calendario',
    icon: Calendar,
    roles: ['administrador', 'lider', 'miembro'],
  },
  {
    label: 'Invitaciones',
    href: '/dashboard/invitaciones',
    icon: Mail,
    roles: ['administrador', 'lider', 'miembro'],
  },
  {
    label: 'Necesidades Logísticas',
    href: '/dashboard/necesidades',
    icon: Package,
    roles: ['administrador', 'lider', 'miembro'],
  },
  {
    label: 'Usuarios',
    href: '/dashboard/usuarios',
    icon: ShieldCheck,
    roles: ['administrador'],
  },
  {
    label: 'Configuración',
    href: '/dashboard/configuracion',
    icon: FolderCog,
    roles: ['administrador'],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { usuario } = useAuth();
  const rol = usuario?.rol ?? 'miembro';

  const filtered = navItems.filter((item) => item.roles.includes(rol));

  return (
    <aside className={cn('flex h-full flex-col gap-2 p-4', className)}>
      <div className="mb-4 px-2">
        <h2 className="text-lg font-semibold tracking-tight">Sistema IEP</h2>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {filtered.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
