"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, Pencil, Trash2, Quote } from "lucide-react";
import type { Asset } from "@/types/asset";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { Copy } from "lucide-react";

export function AssetCard({ asset, onEdit, onDelete }: { asset: Asset; onEdit: (a: Asset) => void; onDelete: (id: string) => void }) {
  const [creditsOpen, setCreditsOpen] = useState<boolean>(false); // popover visibility
  const creditsText = asset.creatorCredits?.text?.trim() || '';
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!creditsText) return;
    try {
      await navigator.clipboard.writeText(creditsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-950/70 hover:bg-slate-950 transition-colors shadow-lg shadow-black/30 overflow-hidden">
      {/* Media */}
      <Link href={`/assets/${asset._id}`} className="block">
        <div className="relative aspect-[4/3] bg-slate-900">
          <Image
            src={asset.thumbnailUrl}
            alt={asset.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-cyan-400/30 transition-all" />
        </div>
      </Link>

      {/* Body */}
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white font-medium truncate" title={asset.name}>{asset.name}</h3>
          <span className="text-[10px] text-slate-200/80 uppercase border border-slate-700/80 rounded px-1 py-0.5 bg-slate-800/50">{asset.format}</span>
        </div>

        {/* Info row (left: vehicle info) (right: source + credits toggle) */}
        <div className="mt-2 flex items-center gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {asset.make && (
              <span className="text-[10px] text-slate-200/90 border border-slate-700/70 rounded px-1.5 py-0.5 bg-slate-800/40">
                {asset.make}{asset.model ? ` • ${asset.model}` : ''}{asset.year ? ` • ${asset.year}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {asset.assetSource && (
              <span className="text-[10px] tracking-wide text-cyan-200 border border-cyan-700/60 rounded px-1 py-0.5 bg-cyan-500/10 uppercase">
                {asset.assetSource}
              </span>
            )}
            {/* Credits toggle to the right of assetSource */}
            <TooltipProvider>
              <Tooltip>
                <Popover open={creditsOpen} onOpenChange={setCreditsOpen}>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <Toggle
                        size="sm"
                        pressed={creditsOpen}
                        onPressedChange={(pressed) => {
                          if (!creditsText) return;
                          setCreditsOpen(pressed);
                        }}
                        className="data-[state=on]:bg-slate-800/70 data-[state=on]:text-cyan-200 bg-slate-800/40 text-slate-200 hover:bg-slate-800/60 hover:text-white"
                        aria-label="Toggle credits"
                      >
                        <Quote className="w-4 h-4" />
                      </Toggle>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent className="bg-slate-900 border-slate-800 text-slate-200">{creditsText ? 'Show credits' : 'No credits available'}</TooltipContent>
                  <PopoverContent className="bg-slate-900 border-slate-800 text-slate-200 w-80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Creator Credits</span>
                      {creditsText && (
                        <button
                          type="button"
                          onClick={onCopy}
                          className="inline-flex items-center gap-1 text-slate-200 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800/60 border border-transparent hover:border-slate-700"
                          title="Copy credits"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {creditsText || 'No credits available for this asset.'}
                    </div>
                  </PopoverContent>
                </Popover>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* No in-card truncated credits; popover replaces it */}

        {/* Tags (always compact, subtle) */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] text-slate-300/90 border border-slate-700/70 rounded px-1 py-0.5 bg-slate-800/40">{t}</span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-[10px] text-slate-400">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-800 bg-slate-900/70">
        <Link
          href={`/assets/${asset._id}`}
          className="inline-flex items-center gap-1 text-slate-200 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800/60"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(asset)}
            className="inline-flex items-center gap-1 text-slate-200 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800/60 border border-transparent hover:border-slate-700"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(asset._id)}
            className="inline-flex items-center gap-1 text-red-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-red-600/20 border border-transparent hover:border-red-600/40"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
