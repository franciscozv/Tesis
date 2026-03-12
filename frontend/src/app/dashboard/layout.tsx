import { Navbar } from '@/components/layout/navbar';
import { RouteGuard } from '@/components/layout/route-guard';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex h-svh overflow-hidden">
        {/* Sidebar — visible solo en desktop */}
        <div className="hidden w-64 shrink-0 lg:flex">
          <Sidebar className="h-full w-full" />
        </div>

        {/* Contenido principal */}
        <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
          <Navbar />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
