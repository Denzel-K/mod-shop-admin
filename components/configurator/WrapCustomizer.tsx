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
          className="pl-10 bg-slate-800 border-slate-700 text-slate-200"
        />
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Color Category</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
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
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
          {filteredColors.map((color) => (
            <button
              key={color.id}
              onClick={() => onColorSelect(color.id)}
              className={cn(
                "aspect-square rounded-lg border-2 transition-all hover:scale-105",
                selectedColor === color.id
                  ? "border-cyan-400 ring-2 ring-cyan-400/30"
                  : "border-slate-600 hover:border-slate-500"
              )}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Finish Selection */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Finish Type</label>
          <Select value={selectedFinishCategory} onValueChange={setSelectedFinishCategory}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
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

        <div className="space-y-2">
          {filteredFinishes.map((finish) => (
            <button
              key={finish.id}
              onClick={() => onFinishSelect(finish.id)}
              className={cn(
                "w-full p-3 rounded-lg border text-left transition-colors",
                selectedFinish === finish.id
                  ? "bg-cyan-600/20 border-cyan-600 text-cyan-300"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              )}
            >
              <div className="font-medium">{finish.name}</div>
              <div className="text-xs text-slate-400 mt-1">{finish.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {finish.characteristics.slice(0, 2).map((char) => (
                  <Badge key={char} variant="outline" className="text-xs">
                    {char.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </button>
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
