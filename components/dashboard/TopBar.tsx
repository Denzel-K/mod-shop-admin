"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { ModShopLogo } from "@/components/mod-shop-logo";

type TopBarProps = {
  onLogout?: () => void;
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
};

export function TopBar({ onLogout, onMenuClick, title, subtitle = "3D Models" }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const [role, setRole] = useState<"super-admin" | "manager" | "curator" | null>(null);

  const handleLogout = useCallback(async () => {
    if (onLogout) return onLogout();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (typeof window !== 'undefined') window.location.href = '/';
    } catch {
      // noop
    }
  }, [onLogout]);

  useEffect(() => {
    const close = () => { setMenuOpen(false); setProfileOpen(false); };
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close);
    return () => { window.removeEventListener('resize', close); window.removeEventListener('scroll', close); };
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Fetch current user role once
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const r = data?.admin?.role as typeof role | undefined;
        if (r) setRole(r);
      } catch {
        // no-op
      }
    };
    run();
  }, []);

  // Compute default title based on route if not provided
  const computedTitle = useMemo(() => {
    if (title) return title;
    if (!pathname) return "Mod Shop";
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/dashboard/library")) return "Library";
    if (pathname.startsWith("/dashboard/mail")) return "Mail";
    if (pathname.startsWith("/dashboard/invitations")) return "Team Invitations";
    if (pathname.startsWith("/dashboard/profile")) return "Profile";
    return "Dashboard";
  }, [pathname, title]);

  return (
    <header className="sticky top-0 z-100 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <ModShopLogo size="md" />
          <h1 className="text-white text-lg sm:text-xl font-semibold tracking-wide truncate">{computedTitle}</h1>
        </div>

        {/* Right actions: profile/logout */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="relative" ref={profileRef}>
            <Button
              onClick={() => setProfileOpen((v) => !v)}
              variant="outline"
              className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 p-2"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              <User className="w-4 h-4" />
            </Button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-800 bg-slate-900/95 shadow-xl">
                <Link
                  href="/dashboard/profile"
                  className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-t-lg"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-b-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: sidebar toggle + profile */}
        <div className="sm:hidden">
          <div className="flex items-center gap-2">
            <Button
              onClick={onMenuClick}
              variant="outline"
              className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div className="relative" ref={profileRef}>
              <Button
                onClick={() => setProfileOpen((v) => !v)}
                variant="outline"
                className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 p-2"
                aria-label="Profile menu"
                aria-expanded={profileOpen}
              >
                <User className="w-4 h-4" />
              </Button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-800 bg-slate-900/95 shadow-xl">
                  <Link
                    href="/dashboard/profile"
                    className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-t-lg"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80 rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile actions panel removed; navigation is in Sidebar */}
    </header>
  );
}
