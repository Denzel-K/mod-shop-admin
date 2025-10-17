"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Palette, Sparkles, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { WrapColor, WrapFinish } from "@/types/wrap";

interface WrapCustomizerProps {
  colors: WrapColor[];
  finishes: WrapFinish[];
  selectedColor?: string;
  selectedFinish?: string;
  onColorSelect: (colorId: string) => void;
  onFinishSelect: (finishId: string) => void;
  hasSelection?: boolean;
}

export default function WrapCustomizer({
  colors,
  finishes,
  selectedColor,
  selectedFinish,
  onColorSelect,
  onFinishSelect,
  hasSelection,
}: WrapCustomizerProps) {
  // No color search or finish dropdown filters; reduce clutter
  const finishesScrollRef = useRef<HTMLDivElement | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const compatibleColors = useMemo(() => {
    if (!selectedFinish) return [] as WrapColor[];
    return colors.filter((c) => c.compatibleFinishes?.includes(selectedFinish));
  }, [colors, selectedFinish]);

  const filteredColors = useMemo(() => {
    return compatibleColors;
  }, [compatibleColors]);

  const filteredFinishes = useMemo(() => finishes, [finishes]);

  const selectedColorData = colors.find(c => c.id === selectedColor);
  const selectedFinishData = finishes.find(f => f.id === selectedFinish);

  // Pagination: 5 columns x 3 rows = 15 items per page
  const ITEMS_PER_ROW = 5;
  const ROWS_PER_PAGE = 3;
  const ITEMS_PER_PAGE = ITEMS_PER_ROW * ROWS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil((filteredColors.length || 0) / ITEMS_PER_PAGE));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStart = (clampedPage - 1) * ITEMS_PER_PAGE;
  const pageEnd = pageStart + ITEMS_PER_PAGE;
  const pageColors = filteredColors.slice(pageStart, pageEnd);

  // Reset to page 1 whenever the selected finish or color list changes significantly
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFinish]);

  // Auto-select the first visible color after switching finishes
  useEffect(() => {
    if (!hasSelection) return;
    if (!selectedFinish) return;
    // After finish change, pick the first color currently rendered (page 1 by reset)
    const firstVisible = (filteredColors[0] ?? null);
    if (firstVisible && selectedColor !== firstVisible.id) {
      onColorSelect(firstVisible.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFinish, hasSelection, filteredColors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Palette className="w-4 h-4" />
          Customize
        </div>
        <div className="text-lg font-semibold text-slate-100">Wrap Selection</div>
      </div>

      {/* Empty state when no surfaces are selected */}
      {!hasSelection && (
        <div className="p-6 rounded-xl border border-slate-700/60 bg-slate-900/40 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl border border-cyan-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-xl bg-slate-800/50 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cyan-400/80 animate-[spin_6s_linear_infinite]" />
            </div>
          </div>
          <div className="text-slate-200 font-medium">Select a surface to start</div>
          <div className="text-slate-400 text-sm mt-1">Choose one or more body panels in the list above to reveal finishes and colors.</div>
        </div>
      )}

      {/* Finish Selection (Horizontal) */}
      {hasSelection && (
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Finishes</label>
        <div className="-mx-2 px-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll finishes left"
              className="rounded-full p-1 bg-slate-900/70 border border-slate-700 text-slate-200 hover:bg-slate-800/80"
              onClick={() => finishesScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div ref={finishesScrollRef} className="flex-1 flex gap-2 overflow-x-auto pb-1 scrollbar-subtle">
              {filteredFinishes.map((finish) => {
                const isSelected = selectedFinish === finish.id;
                return (
                  <div key={finish.id} className="relative flex items-center">
                    <button
                      onClick={() => {
                        onFinishSelect(finish.id);
                      }}
                      className={cn(
                        "px-3 py-2 rounded-full border text-xs whitespace-nowrap transition-colors",
                        isSelected
                          ? "bg-cyan-600/20 border-cyan-600 text-cyan-300"
                          : "bg-slate-900/50 border-slate-700 text-slate-200 hover:bg-slate-800/70"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {finish.name}
                        {isSelected && (finish.description || (finish.characteristics?.length ?? 0) > 0) ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={`More info about ${finish.name}`}
                                className="inline-flex items-center justify-center ml-1 p-0.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-700"
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { (e.currentTarget as HTMLElement).click(); } }}
                              >
                                <Info className="w-3.5 h-3.5" />
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 bg-slate-950/95 text-slate-100 border-slate-700">
                              <div className="text-sm font-medium mb-1">{finish.name}</div>
                              {finish.description && (
                                <div className="text-xs text-slate-300 mb-2">{finish.description}</div>
                              )}
                              {finish.characteristics?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {finish.characteristics.map((char) => (
                                    <Badge key={char} variant="outline" className="text-[10px] text-slate-200 border-slate-600">
                                      {char.replace('_', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                            </PopoverContent>
                          </Popover>
                        ) : null}
                      </span>
                    </button>
                  </div>
                );
              })}
            
            </div>
            <button
              type="button"
              aria-label="Scroll finishes right"
              className="rounded-full p-1 bg-slate-900/70 border border-slate-700 text-slate-200 hover:bg-slate-800/80"
              onClick={() => finishesScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Color Grid */}
      {hasSelection && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Colors</label>
          <Badge variant="secondary" className="text-xs">
            {selectedFinish ? filteredColors.length : 0} available
          </Badge>
        </div>
        {!selectedFinish ? (
          <div className="text-xs text-slate-400 p-3 bg-slate-800/40 rounded border border-slate-700">
            Select a finish to see compatible colors.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-2 max-h-52 overflow-y-auto">
              {pageColors.map((color) => (
                <div key={color.id} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => onColorSelect(color.id)}
                    className={cn(
                      "w-full aspect-square rounded-md border transition-all hover:scale-[1.03]",
                      selectedColor === color.id
                        ? "border-cyan-400 ring-1 ring-cyan-400/40"
                        : "border-slate-600 hover:border-slate-500"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} (${color.id})`}
                  />
                  <div className="w-full text-center">
                    <div className="text-[10px] text-slate-300 truncate" title={color.name}>{color.name}</div>
                    <div className="text-[9px] text-slate-500 truncate font-mono" title={color.id}>{color.id}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
                <button
                  type="button"
                  disabled={clampedPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded border",
                    clampedPage <= 1 ? "opacity-50 cursor-not-allowed border-slate-700" : "border-slate-600 hover:bg-slate-800/70"
                  )}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <div className="font-mono">Page {clampedPage} / {totalPages}</div>
                <button
                  type="button"
                  disabled={clampedPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded border",
                    clampedPage >= totalPages ? "opacity-50 cursor-not-allowed border-slate-700" : "border-slate-600 hover:bg-slate-800/70"
                  )}
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Current Selection Preview */}
      {hasSelection && selectedColorData && selectedFinishData && (
        <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Sparkles className="w-4 h-4" />
            Current Selection
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg border border-slate-600"
              style={{ backgroundColor: selectedColorData.hex }}
            />
            <div>
              <div className="text-sm font-medium text-slate-200">
                {selectedColorData.name}
              </div>
              <div className="text-xs text-slate-400">
                {selectedFinishData.name} finish
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Roughness: {selectedFinishData.materialProperties.roughness} • 
            Metalness: {selectedFinishData.materialProperties.metalness}
          </div>
        </div>
      )}
    </div>
  );
}
