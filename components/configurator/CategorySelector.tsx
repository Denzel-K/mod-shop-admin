"use client";

import { Car, Layers, Lightbulb, Circle, Square, CircleDot, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
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

  const hasCategories = availableCategories.length > 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Horizontal scrollable category list - shown first */}
      {hasCategories && (
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={handleScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-lg"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right arrow */}
          <button
            onClick={handleScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-900/90 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-lg"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 px-10 scrollbar-subtle">
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
                    "flex-shrink-0 w-28 p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 group",
                    isSelected
                      ? "bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-cyan-500 shadow-xl shadow-cyan-500/30 scale-105"
                      : "bg-slate-800/50 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600 hover:scale-105"
                  )}
                >
                  <div className="relative">
                    {/* Icon container with gradient background */}
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200",
                      isSelected
                        ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-lg"
                        : "bg-slate-700/50 group-hover:bg-slate-700/70"
                    )}>
                      <IconComponent
                        className={cn(
                          "w-7 h-7 transition-all duration-200",
                          isSelected
                            ? "text-cyan-400 scale-110"
                            : category.color === "cyan"
                            ? "text-cyan-400/70 group-hover:text-cyan-400"
                            : category.color === "orange"
                            ? "text-orange-400/70 group-hover:text-orange-400"
                            : category.color === "blue"
                            ? "text-blue-400/70 group-hover:text-blue-400"
                            : category.color === "green"
                            ? "text-green-400/70 group-hover:text-green-400"
                            : category.color === "purple"
                            ? "text-purple-400/70 group-hover:text-purple-400"
                            : category.color === "indigo"
                            ? "text-indigo-400/70 group-hover:text-indigo-400"
                            : "text-yellow-400/70 group-hover:text-yellow-400"
                        )}
                      />
                    </div>
                    {/* Item count badge */}
                    {itemCount > 0 && (
                      <span
                        className={cn(
                          "absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-md transition-all duration-200",
                          isSelected
                            ? "bg-cyan-500 text-white scale-110"
                            : "bg-slate-600 text-slate-200 group-hover:bg-slate-500"
                        )}
                      >
                        {itemCount}
                      </span>
                    )}
                  </div>
                  
                  {/* Category label */}
                  <div
                    className={cn(
                      "text-xs font-semibold text-center leading-tight transition-colors duration-200",
                      isSelected ? "text-cyan-300" : "text-slate-300 group-hover:text-slate-200"
                    )}
                  >
                    {category.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced instructional card - only shown when categories exist */}
      {hasCategories && (
        <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-cyan-600/10 via-blue-600/5 to-purple-600/10 border border-cyan-500/20 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
          <div className="relative z-10">
            {/* Animated icon */}
            <div className="w-16 h-16 mx-auto mb-3 relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-400 animate-pulse" style={{animationDuration: '1.5s'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
            </div>
            
            {/* Instructional message */}
            <div className="text-slate-200 font-semibold mb-1.5 text-base">Select Category</div>
            <div className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Choose which type of surfaces to customize
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>
      )}

      {/* Empty state - shown when no categories available */}
      {!hasCategories && (
        <div className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-black/50 border border-slate-700 text-center mt-4">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
          <div className="relative z-10">
            {/* Animated icon */}
            <div className="w-20 h-20 mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-cyan-400/70 animate-bounce" style={{animationDuration: '2s'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            
            {/* Instructional message */}
            <div className="text-slate-200 font-semibold mb-2 text-lg">No Metadata Categories</div>
            <div className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              This asset does not have any configured surface metadata yet.
            </div>
            <div className="text-xs text-slate-500 mt-3 max-w-sm mx-auto">
              Add metadata in the asset editor to enable surface customization categories.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
