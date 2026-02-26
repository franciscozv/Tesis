'use client';

import { Calendar, ExternalLink, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

const rolLabels: Record<string, string> = {
  administrador: 'Admin',
  usuario: 'Usuario',
};

export function Navbar() {
  const { usuario, logout } = useAuth();

  const initials = usuario?.email?.slice(0, 2).toUpperCase() ?? '??';
  const rolLabel = usuario?.rol ? rolLabels[usuario.rol] : '';

  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
          <Link href="/calendario-publico" target="_blank">
            <Calendar className="size-4" />
            Calendario Público
            <ExternalLink className="size-3" />
          </Link>
        </Button>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {rolLabel}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{usuario?.email}</span>
                <span className="text-muted-foreground text-xs">{rolLabel}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
