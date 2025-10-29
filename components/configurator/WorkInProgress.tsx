"use client";

import { Construction, Sparkles } from "lucide-react";

interface WorkInProgressProps {
  categoryName: string;
}

export default function WorkInProgress({ categoryName }: WorkInProgressProps) {
  return (
    <div className="space-y-4">
      <div className="p-8 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-800/20 text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30 animate-pulse" />
          <div className="absolute inset-2 rounded-xl bg-slate-900/40 flex items-center justify-center">
            <Construction className="w-10 h-10 text-cyan-400/80" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
        </div>
        
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          {categoryName} Customization
        </h3>
        
        <div className="text-slate-400 text-sm mb-4">
          This feature is currently in development
        </div>
        
        <div className="max-w-md mx-auto space-y-2 text-xs text-slate-500">
          <p>
            We are working on bringing you advanced customization options for {categoryName.toLowerCase()}.
          </p>
          <p className="text-slate-600">
            Stay tuned for updates!
          </p>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-600/10 border border-cyan-600/30">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-cyan-300 font-medium">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
