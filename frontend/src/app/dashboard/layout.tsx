import { Navbar } from '@/components/layout/navbar';
import { RouteGuard } from '@/components/layout/route-guard';
import { SidebarWrapper } from '@/components/layout/sidebar-wrapper';
import { NotificacionesProvider } from '@/providers/notificaciones-provider';
import { SidebarProvider } from '@/providers/sidebar-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificacionesProvider>
      <SidebarProvider>
        <RouteGuard>
          <div className="flex h-svh overflow-hidden">
            <SidebarWrapper />

            <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
              <Navbar />
              <main className="flex-1 p-4 lg:p-6">{children}</main>
            </div>
          </div>
        </RouteGuard>
      </SidebarProvider>
    </NotificacionesProvider>
  );
}
