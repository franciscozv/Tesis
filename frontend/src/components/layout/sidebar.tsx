'use client';

import {
  Calendar,
  ClipboardList,
  FolderCog,
  HandHeart,
  Home,
  Package,
  Repeat,
  ShieldCheck,
  UserPen,
  Users,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
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

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Personal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ['administrador', 'usuario'] },
      {
        label: 'Mi Perfil',
        href: '/dashboard/mi-perfil',
        icon: UserPen,
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Mis Responsabilidades',
        href: '/dashboard/mis-responsabilidades',
        icon: ClipboardList,
        roles: ['administrador', 'usuario'],
      },
    ],
  },
  {
    label: 'Ministerio',
    items: [
      {
        label: 'Miembros',
        href: '/dashboard/miembros',
        icon: Users,
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Grupos Ministeriales',
        href: '/dashboard/grupos',
        icon: UsersRound,
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Actividades',
        href: '/dashboard/actividades',
        icon: HandHeart,
        roles: ['administrador'],
      },
      {
        label: 'Patrones de Actividad',
        href: '/dashboard/patrones',
        icon: Repeat,
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Calendario',
        href: '/dashboard/calendario',
        icon: Calendar,
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Necesidades Logísticas',
        href: '/dashboard/necesidades',
        icon: Package,
        roles: ['administrador', 'usuario'],
      },
    ],
  },
  {
    label: 'Administración',
    items: [
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
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { usuario } = useAuth();
  const rol = usuario?.rol ?? 'usuario';

  return (
    <aside
      className={cn('flex h-full flex-col', className)}
      style={{ backgroundColor: 'oklch(0.22 0.09 230)' }}
    >
      {/* Cabecera institucional */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="shrink-0 rounded-full bg-white/10 p-1">
          <Image
            src="/logo_iep.png"
            alt="Logo IEP"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate">Sistema IEP</p>
          <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase leading-tight">
            Gestión Ministerial
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4 gap-5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(rol));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[9px] font-bold tracking-[0.20em] uppercase text-white/35">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-white/55 hover:bg-white/8 hover:text-white/90',
                      )}
                    >
                      {isActive && (
                        <span className="absolute inset-y-[20%] left-0 w-[3px] rounded-r-full bg-white/80" />
                      )}
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Pie del sidebar */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/25 text-[9px] tracking-widest uppercase text-center">
          I.E.P. &mdash; uso interno
        </p>
      </div>
    </aside>
  );
}
