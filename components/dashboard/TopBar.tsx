"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Mail } from "lucide-react";

export function TopBar({ onUploadClick, onLogout }: { onUploadClick: () => void; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-2.5 h-2.5 flex-shrink-0 rounded-full bg-cyan-400 shadow-[0_0_24px] shadow-cyan-400/50" />
          <h1 className="text-white text-lg sm:text-xl font-semibold tracking-wide truncate">Mod Shop Library</h1>
          <span className="hidden sm:inline text-xs text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">3D Models</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700">
            <Link href="/mail">
              <Mail className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Mail</span><span className="sm:hidden">Mail</span>
            </Link>
          </Button>
          <Button onClick={onUploadClick} className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700">
            <Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Upload Model</span><span className="sm:hidden">Upload</span>
          </Button>
          <Button onClick={onLogout} variant="outline" className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
