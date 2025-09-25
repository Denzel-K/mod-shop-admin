"use client";

import { TopBar } from "@/components/dashboard/TopBar";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleUploadClick = useCallback(() => {
    // Navigate to dashboard root where upload is available
    router.push("/dashboard");
  }, [router]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar onUploadClick={handleUploadClick} onLogout={handleLogout} />
      <main className="">
        {children}
      </main>
    </div>
  );
}
