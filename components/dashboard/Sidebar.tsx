"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, FileBox, Mail, Users, User, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";

export type SidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void; // for mobile: close sidebar after click
  onLogout?: () => void;
};

export function Sidebar({ collapsed = false, onToggleCollapse, onNavigate, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<"super-admin" | "manager" | "curator" | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setRole(data?.admin?.role ?? null);
      } catch {}
    };
    run();
  }, []);

  const Item = ({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) => {
    const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
          active ? 'border-cyan-700 bg-cyan-900/10 text-white' : 'border-transparent text-slate-300 hover:bg-slate-800'
        }`}
        onClick={onNavigate}
      >
        <Icon className="w-4 h-4" />
        {!collapsed && <span className="text-sm">{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`h-full bg-slate-900/70 border-r border-slate-800 px-2 py-3 flex flex-col ${collapsed ? 'w-[60px]' : 'w-56'} transition-[width] duration-200`}
    >
      <div className="flex items-center justify-between mb-2 pt-4">
        {!collapsed && <div className="text-slate-200 text-sm font-semibold px-1">Navigation</div>}
        <button
          onClick={onToggleCollapse}
          className={`ml-auto p-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 ${collapsed ? 'mr-2' : 'mr-0'}`}
          aria-label="Toggle collapse"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="space-y-1 mt-4">
        <Item href="/dashboard" icon={LayoutGrid} label="Dashboard" />
        <Item href="/dashboard/library" icon={FileBox} label="ENV Assets" />
        {(role === 'super-admin' || role === 'manager') && (
          <Item href="/dashboard/mail" icon={Mail} label="Mail" />
        )}
        {role === 'super-admin' && (
          <Item href="/dashboard/invitations" icon={Users} label="Invitations" />
        )}
        <Item href="/dashboard/profile" icon={User} label="Profile" />
      </nav>
      <div className="mt-auto pt-2">
        <button
          onClick={onLogout}
          className={`w-full ${collapsed ? 'px-2 py-2' : 'px-3 py-2'} text-left rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800`}
        >
          {!collapsed ? 'Logout' : <span className="sr-only">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
