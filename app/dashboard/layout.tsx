"use client";

import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback, useState } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false); // desktop collapse to icons
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer open

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }, [router]);

  const sidebarWidth = collapsed ? 60 : 224; // px, matches w-[60px] and w-56

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      <TopBar onLogout={handleLogout} onMenuClick={() => setMobileOpen((v) => !v)} />

      {/* Content area: fixed sidebar (desktop) + scrollable main */}
      <div className="relative flex-1 overflow-hidden">
        {/* Desktop fixed sidebar */}
        <div
          className="hidden lg:block fixed left-0 top-[56px] bottom-0 z-30"
          style={{ width: sidebarWidth }}
        >
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v)=>!v)} onLogout={handleLogout} />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 p-2">
              <Sidebar onToggleCollapse={() => {}} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
            </div>
          </div>
        )}

        {/* Main content (scrollable only) */}
        <main
          className="h-full overflow-y-auto"
          style={{ marginLeft: 0 }}
        >
          <div className="px-0 lg:px-0" style={{ paddingLeft: 0 }}>
            <div className="lg:ml-0" style={{ marginLeft: 0 }}>
              <div className="hidden lg:block" style={{ height: 0, marginLeft: sidebarWidth }} />
            </div>
          </div>
          <div className="lg:pl-0" style={{ paddingLeft: sidebarWidth }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
