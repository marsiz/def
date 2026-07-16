import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { RouteGuard } from '@/components/route-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex min-h-screen bg-background">
        <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-card lg:flex lg:flex-col">
          <Sidebar />
        </aside>
        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
