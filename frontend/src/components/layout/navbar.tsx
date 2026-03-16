'use client';

import { Calendar, ExternalLink, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/hooks/use-auth';
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
  if (pathname.startsWith('/dashboard/usuarios')) return 'Usuarios';
  if (pathname.startsWith('/dashboard/configuracion')) return 'Configuración';
  if (pathname.startsWith('/dashboard/invitaciones')) return 'Mis Invitaciones';
  return '';
}

const rolLabels: Record<string, string> = {
  administrador: 'Administrador',
  usuario: 'Usuario',
};

export function Navbar() {
  const { usuario, logout } = useAuth();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

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
          <Sidebar className="h-full" />
        </SheetContent>
      </Sheet>

      {/* Page title — desktop */}
      {pageTitle && (
        <h1 className="hidden lg:block text-sm font-semibold text-foreground">{pageTitle}</h1>
      )}

      {/* Spacer */}
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
                <AvatarFallback
                  className="text-[11px] font-semibold bg-primary text-primary-foreground"
                >
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
