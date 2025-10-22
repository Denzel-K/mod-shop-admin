"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, Pencil, Trash2, Quote, Gauge, Tag, Car } from "lucide-react";
import type { Asset } from "@/types/asset";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { Copy } from "lucide-react";

export function AssetCard({ asset, onEdit, onDelete, currentAdminId }: { asset: Asset; onEdit: (a: Asset) => void; onDelete: (id: string) => void; currentAdminId?: string }) {
  const [creditsOpen, setCreditsOpen] = useState<boolean>(false);
  const creditsText = asset.creatorCredits?.text?.trim() || '';
  const [copied, setCopied] = useState(false);
  const [progressOpen, setProgressOpen] = useState<boolean>(false);
  
  const onCopy = async () => {
    if (!creditsText) return;
    try {
      await navigator.clipboard.writeText(creditsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <article className="group relative flex flex-col h-full rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-950/80 to-slate-900/80 hover:from-slate-950 hover:to-slate-900 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 overflow-hidden backdrop-blur-sm">
      {/* Thumbnail */}
      <Link href={`/assets/${asset._id}`} className="block relative">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
          <Image
            src={asset.thumbnailUrl}
            alt={`${asset.name} thumbnail`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-all duration-500 group-hover:scale-105"
          />
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Hover ring effect */}
          <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-cyan-400/40 transition-all duration-300 rounded-t-2xl" />
          
          {/* Format badge */}
          {/* <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-sm text-white border border-white/20">
              {asset.format.toUpperCase()}
            </span>
          </div> */}
          {/* Vehicle info */}
          {asset.make && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-2 text-slate-300 rounded-full bg-black/70 backdrop-blur-sm py-[2px] px-[4px]"> 
                <span className="font-medium text-xs">
                  {asset.make}
                  {asset.model && <span className="text-slate-400 text-[10px]"> • {asset.model}</span>}
                  {asset.year && <span className="text-slate-400 text-[10px]"> • {asset.year}</span>}
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Header */}
        <header className="space-y-2 mb-4 flex">
          <h3 className="text-base font-semibold text-white leading-tight line-clamp-2 group-hover:text-cyan-100 transition-colors" title={asset.name}>
            {asset.name}
          </h3>
        </header>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              <span className="font-medium">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {asset.tags.slice(0, 4).map((tag) => (
                <span 
                  key={tag} 
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-200 border border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600/50 transition-colors"
                >
                  {tag}
                </span>
              ))}
              {asset.tags.length > 4 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/40 text-slate-400 border border-slate-700/30">
                  +{asset.tags.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons - Always at bottom */}
        <div className="flex items-center justify-between pt-4 mt-auto">
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
                        onPressedChange={(pressed) => setProgressOpen(pressed)}
                        className="h-8 w-8 rounded-lg data-[state=on]:bg-cyan-500/20 data-[state=on]:text-cyan-300 data-[state=on]:border-cyan-500/40 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-slate-700/50 transition-all"
                        aria-label="View completion progress"
                      >
                        <Gauge className="w-4 h-4" />
                      </Toggle>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                    View completion progress
                  </TooltipContent>
                  <PopoverContent className="bg-slate-900 border-slate-700 text-slate-200 w-80 shadow-xl">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Completion Progress</span>
                        <span className="text-sm font-mono text-cyan-300">{asset.progress?.overall ?? 0}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {(() => {
                          const breakdown = asset.progress?.breakdown || {} as Record<string, number>;
                          const entries = Object.entries(breakdown).filter(([_, v]) => (v || 0) > 0);
                          if (entries.length === 0) {
                            return <span className="col-span-2 text-slate-400 italic">No metadata contributions yet.</span>;
                          }
                          return entries.map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                              <span className="truncate font-medium">{key}</span>
                              <span className="text-slate-300 font-mono">{value}%</span>
                            </div>
                          ));
                        })()}
                      </div>
                      <div className="pt-2 border-t border-slate-700">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Last edited by</span>
                          <span className="truncate max-w-[60%] text-right font-medium" title={asset.lastEditedBy?.email || asset.lastEditedBy?.name}>
                            {asset.lastEditedBy?.name || asset.lastEditedBy?.email || '—'}
                          </span>
                        </div>
                      </div>
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
                        onPressedChange={(pressed) => {
                          if (!creditsText && !asset.assetSource) return;
                          setCreditsOpen(pressed);
                        }}
                        className="h-8 w-8 rounded-lg data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-300 data-[state=on]:border-amber-500/40 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-slate-700/50 transition-all"
                        aria-label="View creator credits"
                      >
                        <Quote className="w-4 h-4" />
                      </Toggle>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200">
                    {creditsText || asset.assetSource ? 'View creator credits' : 'No credits available'}
                  </TooltipContent>
                  <PopoverContent className="bg-slate-900 border-slate-700 text-slate-200 w-80 shadow-xl">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Creator Credits</span>
                        {creditsText && (
                          <button
                            type="button"
                            onClick={onCopy}
                            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-600"
                            title="Copy credits to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Asset Source */}
                      {asset.assetSource && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-slate-400">Source</span>
                          <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium">
                            {asset.assetSource}
                          </div>
                        </div>
                      )}
                      
                      {/* Credits Text */}
                      {creditsText ? (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-slate-400">Credits</span>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
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
          </div>

          {/* Main actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/assets/${asset._id}`}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 transition-all"
              title="View asset details"
            >
              <Eye className="w-4 h-4" />
            </Link>
            
            {currentAdminId && (
              <button
                type="button"
                onClick={() => onEdit(asset)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 transition-all"
                title="Edit asset"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => onDelete(asset._id)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all"
              title="Delete asset"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

