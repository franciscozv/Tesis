'use client';

import {
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FolderCog,
  HandHeart,
  Home,
  Package,
  Repeat,
  UserPen,
  Users,
  UsersRound,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { Usuario } from '@/features/auth/types';
import { cn } from '@/lib/utils';
import { useSidebarCollapse } from '@/providers/sidebar-provider';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  roles: Usuario['rol'][];
  requiresDirectiva?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Personal',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        iconClassName: 'text-blue-500',
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Mi Perfil',
        href: '/dashboard/mi-perfil',
        icon: UserPen,
        iconClassName: 'text-indigo-500',
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Mis Responsabilidades',
        href: '/dashboard/mis-responsabilidades',
        icon: ClipboardList,
        iconClassName: 'text-violet-500',
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
        iconClassName: 'text-cyan-600',
        roles: ['administrador', 'usuario'],
        requiresDirectiva: true,
      },
      {
        label: 'Mis Grupos',
        href: '/dashboard/mis-grupos',
        icon: UsersRound,
        iconClassName: 'text-sky-500',
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Grupos Ministeriales',
        href: '/dashboard/grupos',
        icon: UsersRound,
        iconClassName: 'text-sky-700',
        roles: ['administrador'],
      },
      {
        label: 'Actividades',
        href: '/dashboard/actividades',
        icon: HandHeart,
        iconClassName: 'text-emerald-500',
        roles: ['administrador'],
      },
      {
        label: 'Patrones de Actividad',
        href: '/dashboard/patrones',
        icon: Repeat,
        iconClassName: 'text-orange-500',
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Calendario',
        href: '/dashboard/calendario',
        icon: Calendar,
        iconClassName: 'text-blue-400',
        roles: ['administrador', 'usuario'],
      },
      {
        label: 'Necesidades Logísticas',
        href: '/dashboard/necesidades',
        icon: Package,
        iconClassName: 'text-amber-500',
        roles: ['administrador', 'usuario'],
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        label: 'Configuración',
        href: '/dashboard/configuracion',
        icon: FolderCog,
        iconClassName: 'text-slate-400',
        roles: ['administrador'],
      },
    ],
  },
];

export function Sidebar({
  className,
  forceExpanded = false,
}: {
  className?: string;
  forceExpanded?: boolean;
}) {
  const pathname = usePathname();
  const { usuario } = useAuth();
  const { collapsed, toggle } = useSidebarCollapse();
  const rol = usuario?.rol ?? 'usuario';
  const isAdmin = rol === 'administrador';
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <aside
      style={
        forceExpanded
          ? undefined
          : {
              width: isCollapsed ? 60 : 256,
              minWidth: isCollapsed ? 60 : 256,
              transition: 'width 280ms ease-in-out, min-width 280ms ease-in-out',
            }
      }
      className={cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <Link
        href="/dashboard"
        className={cn(
          'flex items-center border-b border-sidebar-border shrink-0',
          isCollapsed ? 'justify-center py-[18px] px-2' : 'gap-3 px-5 py-5',
        )}
      >
        <Image
          src="/logo_iep.png"
          alt="Logo IEP"
          width={40}
          height={40}
          className="shrink-0"
          unoptimized
        />
        {!isCollapsed && (
          <div className="min-w-0">
            <p
              className="text-sidebar-foreground text-sm leading-tight truncate uppercase tracking-wide"
              style={{ fontFamily: 'var(--font-condensed)' }}
            >
              Sistema IEP
            </p>
          </div>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col overflow-y-auto py-2">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (!item.roles.includes(rol)) return false;
            if (item.requiresDirectiva && !isAdmin && !usuario?.es_directiva) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-1">
              {!isCollapsed && (
                <p className="px-5 pb-1 pt-2 text-[9px] font-bold tracking-[0.20em] uppercase text-sidebar-foreground/35">
                  {group.label}
                </p>
              )}
              {isCollapsed && <div className="mx-3 my-1.5 border-t border-sidebar-border/40" />}

              <div className={cn('flex flex-col gap-0.5', isCollapsed ? 'px-2' : 'px-3')}>
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  const linkNode = (
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center rounded-md text-sm font-medium transition-colors',
                        isCollapsed ? 'justify-center p-[9px]' : 'gap-3 px-3 py-[7px]',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                      )}
                    >
                      {isActive && !isCollapsed && (
                        <span className="absolute inset-y-[20%] left-0 w-[3px] rounded-r-full bg-sidebar-primary" />
                      )}
                      <item.icon
                        className={cn(
                          'shrink-0',
                          isCollapsed ? 'size-5' : 'size-[18px]',
                          item.iconClassName,
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <TooltipProvider key={item.href} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>{linkNode}</TooltipTrigger>
                          <TooltipContent side="right" className="font-medium text-xs">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return <div key={item.href}>{linkNode}</div>;
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer — toggle */}
      <div
        className={cn(
          'shrink-0 border-t border-sidebar-border flex items-center',
          isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-5 py-3',
        )}
      >
        {!isCollapsed && (
          <p className="text-sidebar-foreground/25 text-[9px] tracking-widest uppercase">
            I.E.P. &mdash; uso interno
          </p>
        )}
        <button
          type="button"
          onClick={toggle}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="rounded p-1 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          {isCollapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>
    </aside>
  );
}
