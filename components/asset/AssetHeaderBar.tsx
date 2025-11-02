"use client";

import Link from "next/link";
import { useState } from "react";
import { Gauge, Quote, Tag as TagIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface AssetHeaderBarProps {
  asset: {
    _id: string;
    name: string;
    format: "glb" | "gltf" | string;
    make?: string;
    model?: string;
    year?: number;
    creatorCredits?: { text?: string };
    assetSource?: string;
    progress?: { overall?: number; breakdown?: Record<string, number>; metadataValidation?: Record<string, boolean> };
    lastEditedBy?: { name?: string; email?: string; at?: string | Date };
    tags?: string[];
  };
}

export default function AssetHeaderBar({ asset }: AssetHeaderBarProps) {
  const [progressOpen, setProgressOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const creditsText = asset.creatorCredits?.text?.trim() || "";

  return (
    <div className="glass-header mx-auto max-w-6xl rounded-2xl px-4 py-[0.505rem] flex items-center justify-between relative">
      {/* Left group: title + small badges */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_20px] shadow-cyan-400/50" />
        <h1 className="text-white text-[0.95rem] font-semibold tracking-wide truncate" title={asset.name}>{asset.name}</h1>
      </div>

      {/* Right group: compact toggles + back button */}
      <div className="flex items-center gap-2">
        {/* Progress toggle */}
        <TooltipProvider>
          <Tooltip>
            <Popover open={progressOpen} onOpenChange={setProgressOpen}>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={progressOpen}
                    onPressedChange={(p) => setProgressOpen(p)}
                    className="h-8 w-8 rounded-lg data-[state=on]:bg-cyan-500/20 data-[state=on]:text-cyan-300 data-[state=on]:border-cyan-500/40 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-white/10"
                    aria-label="View completion progress"
                  >
                    <Gauge className="w-4 h-4" />
                  </Toggle>
                </TooltipTrigger>
              </PopoverTrigger>
              <TooltipContent className="bg-slate-900 border-white/10 text-slate-200">
                View completion progress
              </TooltipContent>
              <PopoverContent className="bg-slate-900 border-white/10 text-slate-200 w-[28rem] shadow-xl">
                <div className="space-y-3">
                  {(() => {
                    const overall = Math.round(((asset.progress?.overall ?? 0)) * 100) / 100;
                    const breakdown = (asset.progress?.breakdown || {}) as Record<string, number>;
                    const metadataValidation = (asset.progress?.metadataValidation || {}) as Record<string, boolean>;
                    const entries = Object.entries(breakdown);
                    return (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Completion</span>
                            <span className="text-sm font-mono text-cyan-300">{overall}%</span>
                          </div>
                          <div className="h-2 w-full rounded bg-slate-800/70 overflow-hidden border border-white/10">
                            <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, Math.max(0, overall))}%` }} />
                          </div>
                        </div>
                        {entries.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-slate-400">Metadata breakdown</div>
                            <div className="space-y-2 max-h-64 overflow-auto pr-1 scrollbar-subtle">
                              {entries.map(([k, baseVal]) => {
                                const isValidated = metadataValidation[k] || false;
                                const val = !isValidated ? Math.round((baseVal - 0.25) * 100) / 100 : Math.round(baseVal * 100) / 100;
                                return (
                                  <div key={k} className="flex items-center justify-between text-xs">
                                    <span className="truncate mr-2 text-slate-300">{k}</span>
                                    <span className={isValidated ? 'text-slate-400' : 'text-amber-400'}>{val}%</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                          <span>Last edited by</span>
                          <span className="truncate max-w-[60%] text-right" title={asset.lastEditedBy?.email || asset.lastEditedBy?.name}>
                            {asset.lastEditedBy?.name || asset.lastEditedBy?.email || '—'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </PopoverContent>
            </Popover>
          </Tooltip>
        </TooltipProvider>

        {/* Credits toggle */}
        <TooltipProvider>
          <Tooltip>
            <Popover open={creditsOpen} onOpenChange={setCreditsOpen}>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Toggle
                    size="sm"
                    pressed={creditsOpen}
                    onPressedChange={(p) => {
                      if (!creditsText && !asset.assetSource) return;
                      setCreditsOpen(p);
                    }}
                    className="h-8 w-8 rounded-lg data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-300 data-[state=on]:border-amber-500/40 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-white/10"
                    aria-label="View creator credits"
                  >
                    <Quote className="w-4 h-4" />
                  </Toggle>
                </TooltipTrigger>
              </PopoverTrigger>
              <TooltipContent className="bg-slate-900 border-white/10 text-slate-200">
                {creditsText || asset.assetSource ? 'View creator credits' : 'No credits available'}
              </TooltipContent>
              <PopoverContent className="bg-slate-900 border-white/10 text-slate-200 w-80 shadow-xl">
                <div className="space-y-3">
                  {/* Asset Source */}
                  {asset.assetSource && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-400">Source</span>
                      <div className="ml-2 inline-flex items-center px-[6px] py-[2px] rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
                        {asset.assetSource}
                      </div>
                    </div>
                  )}
                  {/* Credits Text */}
                  {creditsText ? (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-400">Credits</span>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words p-3 rounded-lg bg-slate-800/40 border border-white/10">
                        {creditsText}
                      </div>
                    </div>
                  ) : !asset.assetSource && (
                    <div className="text-sm text-slate-400 italic">No credits available for this asset.</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </Tooltip>
        </TooltipProvider>

        {/* Tags toggle */}
        {asset.tags && asset.tags.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
                <PopoverTrigger asChild>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      pressed={tagsOpen}
                      onPressedChange={(p) => setTagsOpen(p)}
                      className="h-8 w-8 rounded-lg data-[state=on]:bg-violet-500/20 data-[state=on]:text-violet-300 data-[state=on]:border-violet-500/40 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-white/10"
                      aria-label="View tags"
                    >
                      <TagIcon className="w-4 h-4" />
                    </Toggle>
                  </TooltipTrigger>
                </PopoverTrigger>
                <TooltipContent className="bg-slate-900 border-white/10 text-slate-200">View tags</TooltipContent>
                <PopoverContent className="bg-slate-900 border-white/10 text-slate-200 w-80 shadow-xl">
                  <div className="flex flex-wrap gap-1.5">
                    {asset.tags.map((t) => (
                      <span key={t} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-200 border border-white/10">
                        {t}
                      </span>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Back CTA */}
        <Link href="/dashboard" className="text-slate-200 hover:text-white border border-white/10 bg-slate-800/60 hover:bg-slate-800/80 rounded-full px-3 py-1.5 text-sm transition-colors">Back to Library</Link>
      </div>
    </div>
  );
}
