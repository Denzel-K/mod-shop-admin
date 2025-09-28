"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, User, Users, Menu } from "lucide-react";

type TopBarProps = {
  onUploadClick?: () => void;
  onLogout?: () => void;
  title?: string;
  subtitle?: string;
};

export function TopBar({ onLogout, title, subtitle = "3D Models" }: TopBarProps) {
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
    if (pathname === "/dashboard") return "Mod Shop Library";
    if (pathname.startsWith("/dashboard/invitations")) return "Team Invitations";
    if (pathname.startsWith("/dashboard/profile")) return "Profile";
    return "Dashboard";
  }, [pathname, title]);

  const isMailActive = pathname?.startsWith('/mail') ?? false;
  const isInvitesActive = pathname?.startsWith('/dashboard/invitations') ?? false;

  const canSeeMail = role === 'super-admin' || role === 'manager';
  const canSeeInvites = role === 'super-admin';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-2.5 h-2.5 flex-shrink-0 rounded-full bg-cyan-400 shadow-[0_0_24px] shadow-cyan-400/50" />
          <h1 className="text-white text-lg sm:text-xl font-semibold tracking-wide truncate">{computedTitle}</h1>
          {subtitle && (
            <span className="hidden md:inline text-xs text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">{subtitle}</span>
          )}
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-2">
          {canSeeMail && (
            <Button
              asChild
              className={`bg-slate-800 hover:bg-slate-700 text-slate-100 border ${isMailActive ? 'border-cyan-600 ring-2 ring-cyan-700/40' : 'border-slate-700'}`}
            >
              <Link href="/mail">
                <Mail className="w-4 h-4 mr-2" /> <span className="hidden md:inline">Mail</span><span className="md:hidden">Mail</span>
              </Link>
            </Button>
          )}
          {canSeeInvites && (
            <Button
              asChild
              variant="outline"
              className={`bg-slate-800/80 text-slate-300 hover:bg-slate-700 border ${isInvitesActive ? 'border-cyan-600 ring-2 ring-cyan-700/40' : 'border-slate-700'}`}
            >
              <Link href="/dashboard/invitations">
                <Users className="w-4 h-4 mr-2" /> <span className="hidden md:inline">Invite Admins</span><span className="md:hidden">Invite</span>
              </Link>
            </Button>
          )}
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

        {/* Mobile menu button */}
        <div className="sm:hidden">
          <Button
            onClick={() => setMenuOpen((v) => !v)}
            variant="outline"
            className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile actions panel */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2 space-y-2">
            {canSeeMail && (
              <Button asChild className={`w-full justify-start bg-slate-800 hover:bg-slate-700 text-slate-100 border ${isMailActive ? 'border-cyan-600' : 'border-slate-700'}`}>
                <Link href="/mail"><Mail className="w-4 h-4 mr-2" /> Mail</Link>
              </Button>
            )}
            {canSeeInvites && (
              <Button asChild variant="outline" className={`w-full justify-start bg-slate-800/80 text-slate-300 hover:bg-slate-700 border ${isInvitesActive ? 'border-cyan-600' : 'border-slate-700'}`}>
                <Link href="/dashboard/invitations"><Users className="w-4 h-4 mr-2" /> Invite Admins</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full justify-start bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700">
              <Link href="/dashboard/profile"><User className="w-4 h-4 mr-2" /> Profile</Link>
            </Button>
            <Button onClick={handleLogout} variant="outline" className="w-full justify-start bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
