"use client";

import { useMemo, useState } from "react";
import { Car, Layers, Eye, EyeOff, ArrowLeft, CircleDot, Square, Circle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { IAssetMetadata } from "@/models/Asset";
import type { MetadataCategory } from "./CategorySelector";

interface SurfaceSelectorProps {
  metadata?: IAssetMetadata;
  selectedCategory: MetadataCategory | null;
  selectedSurfaces: string[];
  onSurfaceToggle: (surfaceId: string) => void;
  onSurfaceSelect: (surfaceId: string) => void;
  highlightMode: boolean;
  onHighlightModeToggle: (enabled: boolean) => void;
  onBackToCategories: () => void;
}

const CATEGORY_INFO = {
  wrappableSurfaces: { label: 'Body Panels', icon: Car, color: 'cyan' },
  rims: { label: 'Wheels & Rims', icon: CircleDot, color: 'orange' },
  windows: { label: 'Windows', icon: Square, color: 'blue' },
  doors: { label: 'Doors', icon: Layers, color: 'green' },
  tyres: { label: 'Tyres', icon: Circle, color: 'purple' },
  interior: { label: 'Interior', icon: Layers, color: 'indigo' },
  lights: { label: 'Lights', icon: Lightbulb, color: 'yellow' },
};

export default function SurfaceSelector({
  metadata,
  selectedCategory,
  selectedSurfaces,
  onSurfaceToggle,
  onSurfaceSelect,
  highlightMode,
  onHighlightModeToggle,
  onBackToCategories,
}: SurfaceSelectorProps) {
  // Get surfaces for the selected category only
  const categorySurfaces = selectedCategory && metadata?.[selectedCategory]
    ? Object.entries(metadata[selectedCategory]).map(([name, id]) => ({ name, id }))
    : [];

  const selectedCount = selectedSurfaces.length;
  const categorySelectedCount = categorySurfaces.filter((s) => selectedSurfaces.includes(s.id)).length;

  if (!selectedCategory) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-sm">No category selected</div>
          <div className="text-xs text-slate-500 mt-1">Select a category above to view and customize surfaces</div>
        </div>
      </div>
    );
  }

  if (categorySurfaces.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-sm">No surfaces available in this category</div>
          <div className="text-xs text-slate-500 mt-1">This category has no configured surfaces</div>
        </div>
      </div>
    );
  }

  const categoryInfo = selectedCategory ? CATEGORY_INFO[selectedCategory] : null;
  const CategoryIcon = categoryInfo?.icon || Car;

  return (
    <div className="space-y-4">
      {/* Back button and category header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToCategories}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800/70 transition-colors text-slate-300 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Categories</span>
        </button>
        {categoryInfo && (
          <div className="flex items-center gap-2">
            <CategoryIcon className={cn(
              "w-5 h-5",
              categoryInfo.color === 'cyan' ? 'text-cyan-400' :
              categoryInfo.color === 'orange' ? 'text-orange-400' :
              categoryInfo.color === 'blue' ? 'text-blue-400' :
              categoryInfo.color === 'green' ? 'text-green-400' :
              categoryInfo.color === 'purple' ? 'text-purple-400' :
              categoryInfo.color === 'indigo' ? 'text-indigo-400' :
              'text-yellow-400'
            )} />
            <span className="text-sm font-medium text-slate-200">{categoryInfo.label}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="text-sm">
          <span className="text-slate-300">{categorySelectedCount}</span>
          <span className="text-slate-400"> of {categorySurfaces.length} selected</span>
        </div>
        <Badge variant="secondary" className="text-xs">{categorySelectedCount > 0 ? "Active" : "None"}</Badge>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            {highlightMode ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span className="text-sm text-slate-300">Highlight Mode</span>
          </div>
          <Switch checked={highlightMode} onCheckedChange={onHighlightModeToggle} />
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            categorySurfaces.forEach((s) => {
              if (!selectedSurfaces.includes(s.id)) onSurfaceToggle(s.id);
            });
          }}
          className="flex-1 text-xs bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            categorySurfaces.forEach((s) => {
              if (selectedSurfaces.includes(s.id)) onSurfaceToggle(s.id);
            });
          }}
          className="flex-1 text-xs bg-slate-900/60 border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          disabled={categorySelectedCount === 0}
        >
          Clear Category
        </Button>
      </div>

      {/* Surface list for selected category */}
      <div className={cn(
        "space-y-1",
        selectedCategory === "wrappableSurfaces" && "p-2 border border-slate-700/60 rounded-lg max-h-64 overflow-y-auto bg-slate-900/30"
      )}>
        {categorySurfaces.map((surface) => {
          const isSelected = selectedSurfaces.includes(surface.id);
          const rowClasses = cn(
            "flex items-center justify-between p-2 rounded border",
            isSelected ? "bg-cyan-600/10 border-cyan-700/50" : "bg-slate-800/20 border-slate-700/50"
          );
          return (
            <div key={surface.id} className={rowClasses}>
              {selectedCategory === "wrappableSurfaces" ? (
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-cyan-600 mr-3 flex-shrink-0"
                  checked={isSelected}
                  onChange={() => onSurfaceToggle(surface.id)}
                  aria-label={`Select ${surface.name}`}
                />
              ) : null}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => {
                    onSurfaceToggle(surface.id);
                    onSurfaceSelect(surface.id);
                  }}
                  className="w-full text-left text-sm text-slate-300 hover:text-slate-200 transition-colors"
                >
                  <div className="font-medium">{surface.name}</div>
                  <div className="text-xs text-slate-500 font-mono truncate" title={surface.id}>
                    {surface.id}
                  </div>
                </button>
              </div>
              {selectedCategory !== "wrappableSurfaces" ? (
                <Switch checked={isSelected} onCheckedChange={() => onSurfaceToggle(surface.id)} />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
        • Click surface names to focus in 3D view
        <br />• Use highlight mode to see selected surfaces
        {selectedCategory === "wrappableSurfaces" && (
          <>
            <br />• Apply wraps to multiple surfaces at once
          </>
        )}
      </div>
    </div>
  );
}
 