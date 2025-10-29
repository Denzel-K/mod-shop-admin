"use client";

import { Car, Layers, Lightbulb, Circle, Square, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IAssetMetadata } from "@/models/Asset";

export type MetadataCategory = 'wrappableSurfaces' | 'rims' | 'windows' | 'doors' | 'tyres' | 'interior' | 'lights';

interface CategorySelectorProps {
  metadata?: IAssetMetadata;
  selectedCategory: MetadataCategory | null;
  onCategorySelect: (category: MetadataCategory) => void;
}

const METADATA_CATEGORIES = [
  {
    id: 'wrappableSurfaces' as MetadataCategory,
    label: 'Body Panels',
    icon: Car,
    color: 'cyan',
    description: 'Wrappable surfaces like bumpers, hood, roof, etc.',
  },
  {
    id: 'rims' as MetadataCategory,
    label: 'Wheels & Rims',
    icon: CircleDot,
    color: 'orange',
    description: 'Wheel rims and related components',
  },
  {
    id: 'windows' as MetadataCategory,
    label: 'Windows',
    icon: Square,
    color: 'blue',
    description: 'Glass surfaces and windows',
  },
  {
    id: 'doors' as MetadataCategory,
    label: 'Doors',
    icon: Layers,
    color: 'green',
    description: 'Door panels and components',
  },
  {
    id: 'tyres' as MetadataCategory,
    label: 'Tyres',
    icon: Circle,
    color: 'purple',
    description: 'Tire components',
  },
  {
    id: 'interior' as MetadataCategory,
    label: 'Interior',
    icon: Layers,
    color: 'indigo',
    description: 'Interior components like seats, dashboard, etc.',
  },
  {
    id: 'lights' as MetadataCategory,
    label: 'Lights',
    icon: Lightbulb,
    color: 'yellow',
    description: 'Lighting components',
  },
];

export default function CategorySelector({
  metadata,
  selectedCategory,
  onCategorySelect,
}: CategorySelectorProps) {
  // Filter categories that have data
  const availableCategories = METADATA_CATEGORIES.filter((category) => {
    const categoryData = metadata?.[category.id];
    return categoryData && Object.keys(categoryData).length > 0;
  });

  if (availableCategories.length === 0) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
        <div className="text-slate-400 text-sm">No metadata categories available</div>
        <div className="text-xs text-slate-500 mt-1">This asset has no configured surfaces</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm text-slate-400">Select Category</div>
        <div className="text-xs text-slate-500">Choose which type of surfaces to customize</div>
      </div>

      {/* Horizontal scrollable category list */}
      <div className="relative -mx-2 px-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-subtle">
          {availableCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            const categoryData = metadata?.[category.id];
            const itemCount = categoryData ? Object.keys(categoryData).length : 0;

            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg border transition-all min-w-[100px]",
                  isSelected
                    ? "bg-cyan-600/20 border-cyan-600 shadow-lg shadow-cyan-500/20"
                    : "bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 hover:border-slate-600"
                )}
              >
                <div className="relative">
                  <IconComponent
                    className={cn(
                      "w-6 h-6 transition-colors",
                      isSelected
                        ? "text-cyan-400"
                        : category.color === "cyan"
                        ? "text-cyan-400/70"
                        : category.color === "orange"
                        ? "text-orange-400/70"
                        : category.color === "blue"
                        ? "text-blue-400/70"
                        : category.color === "green"
                        ? "text-green-400/70"
                        : category.color === "purple"
                        ? "text-purple-400/70"
                        : category.color === "indigo"
                        ? "text-indigo-400/70"
                        : "text-yellow-400/70"
                    )}
                  />
                  {itemCount > 0 && (
                    <span
                      className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center",
                        isSelected
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-700 text-slate-300"
                      )}
                    >
                      {itemCount}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      isSelected ? "text-cyan-300" : "text-slate-300"
                    )}
                  >
                    {category.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
