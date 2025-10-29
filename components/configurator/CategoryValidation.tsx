"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetadataCategory } from "./CategorySelector";
import type { IMetadataValidation } from "@/models/Asset";

interface CategoryValidationProps {
  selectedCategory: MetadataCategory | null;
  metadataValidation?: IMetadataValidation;
  onValidationToggle: (category: MetadataCategory, validated: boolean) => void;
  isUpdating: boolean;
}

const CATEGORY_LABELS: Record<MetadataCategory, string> = {
  wrappableSurfaces: 'Body Panels',
  rims: 'Wheels & Rims',
  windows: 'Windows',
  doors: 'Doors',
  tyres: 'Tyres',
  interior: 'Interior',
  lights: 'Lights',
};

export default function CategoryValidation({
  selectedCategory,
  metadataValidation,
  onValidationToggle,
  isUpdating,
}: CategoryValidationProps) {
  if (!selectedCategory) return null;

  const isValidated = metadataValidation?.[selectedCategory] || false;
  const categoryLabel = CATEGORY_LABELS[selectedCategory];

  return (
    <div className="pt-4 border-t border-slate-700/50">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={isValidated}
            onChange={(e) => onValidationToggle(selectedCategory, e.target.checked)}
            disabled={isUpdating}
            className="sr-only"
          />
          <div
            className={cn(
              "w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center",
              isValidated
                ? "bg-emerald-500 border-emerald-500"
                : "bg-transparent border-slate-600 group-hover:border-slate-500",
              isUpdating && "opacity-50 cursor-not-allowed"
            )}
          >
            {isValidated && (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
            {categoryLabel} Validated
          </div>
          <div className="text-xs text-slate-400 leading-relaxed mt-0.5">
            Confirm that {categoryLabel.toLowerCase()} metadata works correctly in the 3D viewer
          </div>
        </div>
      </label>
    </div>
  );
}
