import { Navbar } from '@/components/layout/navbar';
import { RouteGuard } from '@/components/layout/route-guard';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex min-h-svh">
        <div className="bg-background hidden w-64 border-r lg:block">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}

