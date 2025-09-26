"use client";

import { useState, useMemo } from "react";
import { Search, Palette, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WrapColor, WrapFinish, WrapCategory } from "@/types/wrap";

interface WrapCustomizerProps {
  colors: WrapColor[];
  finishes: WrapFinish[];
  categories: WrapCategory[];
  selectedColor?: string;
  selectedFinish?: string;
  onColorSelect: (colorId: string) => void;
  onFinishSelect: (finishId: string) => void;
}

export default function WrapCustomizer({
  colors,
  finishes,
  categories,
  selectedColor,
  selectedFinish,
  onColorSelect,
  onFinishSelect,
}: WrapCustomizerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFinishCategory, setSelectedFinishCategory] = useState<string>("all");

  const filteredColors = useMemo(() => {
    return colors.filter((color) => {
      const matchesSearch = color.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || color.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [colors, searchTerm, selectedCategory]);

  const filteredFinishes = useMemo(() => {
    return finishes.filter((finish) => {
      const matchesCategory = selectedFinishCategory === "all" || finish.category === selectedFinishCategory;
      return matchesCategory;
    });
  }, [finishes, selectedFinishCategory]);

  const selectedColorData = colors.find(c => c.id === selectedColor);
  const selectedFinishData = finishes.find(f => f.id === selectedFinish);

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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search colors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900/60 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-600/40"
        />
      </div>

      {/* Finish Selection */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Finish Type</label>
          <Select value={selectedFinishCategory} onValueChange={setSelectedFinishCategory}>
            <SelectTrigger className="bg-slate-900/60 border-slate-600 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-950/90 text-slate-100 border-slate-700">
              <SelectItem value="all">All Finishes</SelectItem>
              <SelectItem value="gloss">Gloss</SelectItem>
              <SelectItem value="satin">Satin</SelectItem>
              <SelectItem value="matte">Matte</SelectItem>
              <SelectItem value="metallic">Metallic</SelectItem>
              <SelectItem value="chrome">Chrome</SelectItem>
              <SelectItem value="textured">Textured</SelectItem>
              <SelectItem value="pearlescent">Pearlescent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {filteredFinishes.map((finish) => {
            const isSelected = selectedFinish === finish.id;
            return (
              <button
                key={finish.id}
                onClick={() => onFinishSelect(finish.id)}
                className={cn(
                  "w-full p-2.5 rounded-md border text-left transition-colors",
                  isSelected
                    ? "bg-cyan-600/20 border-cyan-600 text-cyan-300"
                    : "bg-slate-900/50 border-slate-700 text-slate-200 hover:bg-slate-800/70"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{finish.name}</div>
                </div>
                {finish.description && (
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">{finish.description}</div>
                )}
                {finish.characteristics?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {finish.characteristics.slice(0, 3).map((char) => (
                      <Badge key={char} variant="outline" className="text-[10px] text-slate-200 border-slate-600">
                        {char.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Color Category</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-slate-900/60 border-slate-600 text-slate-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-950/90 text-slate-100 border-slate-700">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Colors</label>
          <Badge variant="secondary" className="text-xs">
            {filteredColors.length} available
          </Badge>
        </div>
        <div className="grid grid-cols-5 gap-1 max-h-44 overflow-y-auto">
          {filteredColors.map((color) => (
            <button
              key={color.id}
              onClick={() => onColorSelect(color.id)}
              className={cn(
                "aspect-square rounded-md border transition-all hover:scale-[1.03]",
                selectedColor === color.id
                  ? "border-cyan-400 ring-1 ring-cyan-400/40"
                  : "border-slate-600 hover:border-slate-500"
              )}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Current Selection Preview */}
      {selectedColorData && selectedFinishData && (
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
