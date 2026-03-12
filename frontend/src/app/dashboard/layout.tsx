import { Navbar } from '@/components/layout/navbar';
import { RouteGuard } from '@/components/layout/route-guard';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex min-h-svh">
        {/* Sidebar — visible solo en desktop */}
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-0 h-svh overflow-hidden">
            <Sidebar className="h-full" />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
