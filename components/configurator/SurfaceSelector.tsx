"use client";

import { useState } from "react";
import { Car, Layers, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { IAssetMetadata } from "@/models/Asset";

interface SurfaceSelectorProps {
  metadata?: IAssetMetadata;
  selectedSurfaces: string[];
  onSurfaceToggle: (surfaceId: string) => void;
  onSurfaceSelect: (surfaceId: string) => void;
  highlightMode: boolean;
  onHighlightModeToggle: (enabled: boolean) => void;
}

export default function SurfaceSelector({
  metadata,
  selectedSurfaces,
  onSurfaceToggle,
  onSurfaceSelect,
  highlightMode,
  onHighlightModeToggle,
}: SurfaceSelectorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['wrappableSurfaces']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const surfaceSections = [
    {
      key: 'wrappableSurfaces',
      label: 'Body Panels',
      icon: Car,
      surfaces: metadata?.wrappableSurfaces || [],
      color: 'cyan'
    },
    {
      key: 'rims',
      label: 'Wheels & Rims',
      icon: Layers,
      surfaces: metadata?.rims || [],
      color: 'orange'
    },
    {
      key: 'windows',
      label: 'Windows',
      icon: Eye,
      surfaces: metadata?.windows || [],
      color: 'blue'
    },
    {
      key: 'doors',
      label: 'Doors',
      icon: Layers,
      surfaces: metadata?.doors || [],
      color: 'green'
    },
    {
      key: 'interior',
      label: 'Interior',
      icon: Layers,
      surfaces: metadata?.interior || [],
      color: 'purple'
    },
    {
      key: 'lights',
      label: 'Lights',
      icon: Eye,
      surfaces: metadata?.lights || [],
      color: 'yellow'
    }
  ];

  const totalSurfaces = surfaceSections.reduce((sum, section) => sum + section.surfaces.length, 0);
  const selectedCount = selectedSurfaces.length;

  if (!metadata || totalSurfaces === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Car className="w-4 h-4" />
            Surfaces
          </div>
          <div className="text-lg font-semibold text-slate-100">Surface Selection</div>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-sm">
            No surface metadata available for this asset.
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Upload an asset with surface metadata to enable customization.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Car className="w-4 h-4" />
          Surfaces
        </div>
        <div className="text-lg font-semibold text-slate-100">Surface Selection</div>
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="text-sm">
          <span className="text-slate-300">{selectedCount}</span>
          <span className="text-slate-400"> of {totalSurfaces} selected</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {selectedCount > 0 ? 'Active' : 'None'}
        </Badge>
      </div>

      {/* Highlight Mode Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
        <div className="flex items-center gap-2">
          {highlightMode ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
          <span className="text-sm text-slate-300">Highlight Mode</span>
        </div>
        <Switch
          checked={highlightMode}
          onCheckedChange={onHighlightModeToggle}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const allSurfaces = surfaceSections.flatMap(section => section.surfaces);
            allSurfaces.forEach(surface => {
              if (!selectedSurfaces.includes(surface)) {
                onSurfaceToggle(surface);
              }
            });
          }}
          className="flex-1 text-xs bg-slate-900/60 border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-white"
        >
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            selectedSurfaces.forEach(surface => onSurfaceToggle(surface));
          }}
          className="flex-1 text-xs bg-slate-900/60 border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          disabled={selectedCount === 0}
        >
          Clear All
        </Button>
      </div>

      {/* Surface Sections */}
      <div className="space-y-3">
        {surfaceSections.map((section) => {
          if (section.surfaces.length === 0) return null;
          
          const isExpanded = expandedSections.has(section.key);
          const sectionSelectedCount = section.surfaces.filter(s => selectedSurfaces.includes(s)).length;
          const IconComponent = section.icon;

          return (
            <div key={section.key} className="space-y-2">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between p-2 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className={cn("w-4 h-4", section.color === 'cyan' ? 'text-cyan-400' : section.color === 'orange' ? 'text-orange-400' : section.color === 'blue' ? 'text-blue-400' : section.color === 'green' ? 'text-green-400' : section.color === 'purple' ? 'text-purple-400' : 'text-yellow-400')} />
                  <span className="text-sm font-medium text-slate-300">{section.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {sectionSelectedCount}/{section.surfaces.length}
                  </Badge>
                </div>
                <div className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded ? "rotate-90" : "rotate-0"
                )}>
                  ▶
                </div>
              </button>

              {/* Section Content */}
              {isExpanded && (
                <div className={cn(
                  "space-y-1 pl-2",
                  section.key === 'wrappableSurfaces' && "p-2 border border-slate-700/60 rounded-lg max-h-64 overflow-y-auto bg-slate-900/30"
                )}>
                  {section.surfaces.map((surface) => {
                    const isSelected = selectedSurfaces.includes(surface);
                    const rowClasses = cn(
                      "flex items-center justify-between p-2 rounded border",
                      isSelected ? "bg-cyan-600/10 border-cyan-700/50" : "bg-slate-800/20 border-slate-700/50"
                    );
                    return (
                      <div key={surface} className={rowClasses}>
                        {section.key === 'wrappableSurfaces' ? (
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-cyan-600 mr-3 flex-shrink-0"
                            checked={isSelected}
                            onChange={() => onSurfaceToggle(surface)}
                            aria-label={`Select ${surface}`}
                          />
                        ) : null}
                        <button
                          onClick={() => {
                            onSurfaceToggle(surface);
                            onSurfaceSelect(surface);
                          }}
                          className="flex-1 text-left text-sm text-slate-300 hover:text-slate-200 transition-colors break-words whitespace-pre-wrap leading-relaxed min-w-0"
                        >
                          {surface}
                        </button>
                        {section.key !== 'wrappableSurfaces' ? (
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => onSurfaceToggle(surface)}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
        • Click surface names to focus in 3D view
        <br />• Use highlight mode to see selected surfaces
        <br />• Apply wraps to multiple surfaces at once
      </div>
    </div>
  );
}
