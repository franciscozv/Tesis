'use client';

import { Bell, Calendar, ExternalLink, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { Notificacion } from '@/features/notificaciones/types';
import { useNotificaciones } from '@/providers/notificaciones-provider';
import { Sidebar } from './sidebar';

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/dashboard/mi-perfil')) return 'Mi Perfil';
  if (pathname.startsWith('/dashboard/mis-responsabilidades')) return 'Mis Responsabilidades';
  if (pathname.startsWith('/dashboard/miembros')) return 'Miembros';
  if (pathname.startsWith('/dashboard/grupos')) return 'Grupos Ministeriales';
  if (pathname.startsWith('/dashboard/actividades')) return 'Actividades';
  if (pathname.startsWith('/dashboard/patrones')) return 'Patrones de Actividad';
  if (pathname.startsWith('/dashboard/calendario')) return 'Calendario';
  if (pathname.startsWith('/dashboard/necesidades')) return 'Necesidades Logísticas';
  if (pathname.startsWith('/dashboard/configuracion')) return 'Configuración';
  if (pathname.startsWith('/dashboard/invitaciones')) return 'Mis Invitaciones';
  return '';
}

function formatTimestamp(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD}d`;
}

const rolLabels: Record<string, string> = {
  administrador: 'Administrador',
  usuario: 'Usuario',
};

export function Navbar() {
  const { usuario, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { notificaciones, unreadCount, markAsRead, markAllAsRead } = useNotificaciones();
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = usuario?.email?.slice(0, 2).toUpperCase() ?? '??';
  const rolLabel = usuario?.rol ? rolLabels[usuario.rol] : '';
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 lg:px-6">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <Sidebar className="h-full" forceExpanded />
        </SheetContent>
      </Sheet>

      {/* Page title — desktop */}
      {pageTitle && (
        <h1 className="hidden lg:block text-sm font-medium text-foreground">{pageTitle}</h1>
      )}

      <div className="flex-1" />

      {/* Acciones derechas */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex text-muted-foreground gap-1.5"
          asChild
        >
          <Link href="/calendario-publico" target="_blank">
            <Calendar className="size-4" />
            Calendario Público
            <ExternalLink className="size-3 opacity-60" />
          </Link>
        </Button>

        <div className="h-5 w-px bg-border hidden sm:block" />

        {/* Campana de notificaciones */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground"
              aria-label="Notificaciones"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Notificaciones</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-0.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={markAllAsRead}
                >
                  Marcar todo como leído
                </Button>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-[400px] overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Bell className="size-7 opacity-30" />
                  <p className="text-sm">Sin notificaciones</p>
                </div>
              ) : (
                <>
                  {/* No leídas */}
                  {notificaciones.filter((n) => !n.leida).length > 0 && (
                    <>
                      <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        No leídas
                      </p>
                      {notificaciones
                        .filter((n) => !n.leida)
                        .map((n) => (
                          <NotifItem
                            key={n.id}
                            n={n}
                            onNavigate={() => {
                              setNotifOpen(false);
                              markAsRead(n.id);
                              router.push(n.href);
                            }}
                          />
                        ))}
                    </>
                  )}

                  {/* Leídas */}
                  {notificaciones.filter((n) => n.leida).length > 0 && (
                    <>
                      <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground border-t mt-1">
                        Anteriores
                      </p>
                      {notificaciones
                        .filter((n) => n.leida)
                        .map((n) => (
                          <NotifItem
                            key={n.id}
                            n={n}
                            onNavigate={() => {
                              setNotifOpen(false);
                              router.push(n.href);
                            }}
                          />
                        ))}
                    </>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 px-2 rounded-md h-9"
            >
              <Avatar className="size-7">
                <AvatarFallback className="text-[11px] font-semibold bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                  {usuario?.email}
                </span>
                <span className="text-[11px] text-muted-foreground">{rolLabel}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium truncate">{usuario?.email}</span>
                <span className="text-muted-foreground text-xs font-normal">{rolLabel}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/mi-perfil">
                <User className="size-4" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function NotifItem({ n, onNavigate }: { n: Notificacion; onNavigate: () => void }) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-accent',
        !n.leida && 'bg-primary/5',
      )}
    >
      <span
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          !n.leida ? 'bg-primary' : 'bg-transparent',
        )}
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className={cn(
            'text-sm leading-snug',
            !n.leida ? 'font-medium text-foreground' : 'text-muted-foreground',
          )}
        >
          {n.mensaje}
        </span>
        {n.detalle && (
          <span className="text-xs text-muted-foreground truncate">{n.detalle}</span>
        )}
        <span className="text-[11px] text-muted-foreground/70 mt-0.5">
          {formatTimestamp(n.timestamp)}
        </span>
      </div>
    </button>
  );
}
