"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipsInput } from "@/components/dashboard/ChipsInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X, Car, Crown, Truck, Mountain, Zap, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { listMakes, listModels, getBrandIcon, getBrandCountry } from "@/lib/model-mapping";
import { useMemo, useState } from "react";
 

export type PrimaryInfoProps = {
  isEdit: boolean;
  // Core fields
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  scaleOverride: string;
  setScaleOverride: (v: string) => void;
  // Source and credits
  assetSource: string;
  setAssetSource: (v: string) => void;
  isSketchfab: boolean;
  sketchfabValid: boolean;
  fieldErrors: Record<string, string>;
  creatorText: string;
  setCreatorText: (v: string) => void;
  // Vehicle identity (moved from metadata)
  make: string;
  setMake: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  // Tags (moved from metadata)
  tagsChips: string[];
  setTagsChips: (v: string[]) => void;
  // Files
  modelFile: File | null;
  setModelFile: (f: File | null) => void;
  thumbFile: File | null;
  setThumbFile: (f: File | null) => void;
  isModelDragOver: boolean;
  setIsModelDragOver: (v: boolean) => void;
  isThumbDragOver: boolean;
  setIsThumbDragOver: (v: boolean) => void;
  thumbPreviewUrl: string | null;
};

export function PrimaryInfoTab(props: PrimaryInfoProps) {
  const {
    isEdit,
    name,
    setName,
    description,
    setDescription,
    scaleOverride,
    setScaleOverride,
    assetSource,
    setAssetSource,
    isSketchfab,
    sketchfabValid,
    fieldErrors,
    creatorText,
    setCreatorText,
    make,
    setMake,
    model,
    setModel,
    year,
    setYear,
    tagsChips,
    setTagsChips,
    modelFile,
    setModelFile,
    thumbFile,
    setThumbFile,
    isModelDragOver,
    setIsModelDragOver,
    isThumbDragOver,
    setIsThumbDragOver,
    thumbPreviewUrl,
  } = props;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-300">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nissan GTR R35" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assetSource" className="text-slate-300">Asset Source</Label>
          <Select
            value={assetSource || 'any'}
            onValueChange={(val) => setAssetSource(val === 'any' ? '' : val)}
          >
            <SelectTrigger id="assetSource" className="bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-slate-200 border-slate-700">
              <SelectItem value="any">Select source</SelectItem>
              <SelectItem value="sketchfab">Sketchfab</SelectItem>
              <SelectItem value="turbosquid">TurboSquid</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {isSketchfab && (
            <p className="text-xs text-slate-500">Creator credit text is required for Sketchfab-sourced models.</p>
          )}
        </div>
        {/* Vehicle identity */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="space-y-2">
            <Label htmlFor="make" className="text-slate-300">Make</Label>
            <EnhancedMakeSelector value={make} onChange={(newMake: string) => {
              setMake(newMake);
              // Reset model if the new make doesn't have the current model
              if (newMake && model && !listModels(newMake).includes(model)) {
                setModel('');
              }
            }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model" className="text-slate-300">Model</Label>
            <EnhancedModelSelector 
              value={model} 
              onChange={setModel} 
              make={make}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year" className="text-slate-300">Year</Label>
            <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2017" type="number" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
          </div>
        </div>
        {/* Tags */}
        <div className="md:col-span-2 space-y-2">
          <Label className="text-slate-300">Tags</Label>
          <ChipsInput value={tagsChips} onChange={setTagsChips} placeholder="Type and press Enter or comma to add" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Auto-scaling</Label>
          <div className="text-xs text-slate-400 border border-slate-700 rounded-lg p-3 bg-slate-800/40">
            {isEdit ? (
              <>Update name/description/scale below. Re-upload files is not supported in this dialog.</>
            ) : (
              <>We automatically compute a display scale from the model’s bounding box so cars render uniformly. No manual scale input needed.</>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="scale" className="text-slate-300">Scale override (optional)</Label>
          <Input
            id="scale"
            type="number"
            min="0.0001"
            step="0.0001"
            value={scaleOverride}
            onChange={(e) => setScaleOverride(e.target.value)}
            placeholder="e.g. 100"
            className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500"
          />
          <p className="text-xs text-slate-500">If provided, this value will be used instead of the auto-computed scale.</p>
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="description" className="text-slate-300">Description (optional)</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
        </div>
        {/* Creator Credits */}
        <div className="md:col-span-2 grid grid-cols-1 gap-5">
          <div className="space-y-2">
            <Label htmlFor="creatorText" className="text-slate-300">Creator Credits Text</Label>
            <Input id="creatorText" value={creatorText} onChange={(e) => setCreatorText(e.target.value)} placeholder="e.g. Model by Jane Doe on Sketchfab" className={`bg-slate-800/60 border ${sketchfabValid ? 'border-slate-700' : 'border-red-600'} text-white placeholder-slate-500`} />
            {!sketchfabValid && <p className="text-xs text-red-400">Creator credit text is required for Sketchfab assets.</p>}
            {fieldErrors.creatorText && <p className="text-xs text-red-400">{fieldErrors.creatorText}</p>}
          </div>
        </div>
      </div>

      {/* File pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-slate-300">Model (.glb/.gltf)</Label>
          <div
            className={`border border-dashed rounded-lg p-4 bg-slate-800/40 transition-colors ${
              isModelDragOver ? 'border-cyan-500/60 bg-slate-800/60' : 'border-slate-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsModelDragOver(true); }}
            onDragLeave={() => setIsModelDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsModelDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file && /\.(glb|gltf)$/i.test(file.name)) setModelFile(file);
            }}
          >
            <div className="text-sm text-slate-400">
              {modelFile ? (
                <div className="flex items-center justify-between">
                  <span className="truncate">{modelFile.name}</span>
                  <button type="button" className="text-cyan-400 hover:text-cyan-300 text-xs" onClick={() => setModelFile(null)}>Change</button>
                </div>
              ) : (
                <>
                  <p>Drag & drop your .glb or .gltf file here</p>
                  <p className="text-xs mt-1">or click to browse</p>
                </>
              )}
            </div>
            <input
              accept=".glb,.gltf"
              type="file"
              onChange={(e) => setModelFile(e.target.files?.[0] || null)}
              className="sr-only"
              id="model-input"
            />
            <label htmlFor="model-input" className="block mt-3 text-center text-xs text-slate-300 underline cursor-pointer">Choose file</label>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Thumbnail (image)</Label>
          <div
            className={`border border-dashed rounded-lg p-4 bg-slate-800/40 transition-colors ${
              isThumbDragOver ? 'border-cyan-500/60 bg-slate-800/60' : 'border-slate-700'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsThumbDragOver(true); }}
            onDragLeave={() => setIsThumbDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsThumbDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) setThumbFile(file);
            }}
          >
            {thumbPreviewUrl ? (
              <div className="flex items-center gap-4">
                <Image src={thumbPreviewUrl} alt="Thumbnail preview" width={128} height={80} className="h-20 w-32 object-cover rounded border border-slate-700" />
                <div className="text-sm text-slate-400 truncate">{thumbFile?.name}</div>
                <button type="button" className="ml-auto text-cyan-400 hover:text-cyan-300 text-xs" onClick={() => setThumbFile(null)}>Change</button>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                <p>Drag & drop an image here</p>
                <p className="text-xs mt-1">or click to browse</p>
              </div>
            )}
            <input
              accept="image/*"
              type="file"
              onChange={(e) => setThumbFile(e.target.files?.[0] || null)}
              className="sr-only"
              id="thumb-input"
            />
            <label htmlFor="thumb-input" className="block mt-3 text-center text-xs text-slate-300 underline cursor-pointer">Choose file</label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Make Selector with icons and search
function EnhancedMakeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const makes = useMemo(() => listMakes(), []);
  
  const getIcon = (iconName: string) => {
    const iconByName: Record<string, LucideIcon> = {
      car: Car,
      crown: Crown,
      truck: Truck,
      mountain: Mountain,
      zap: Zap,
      shield: Shield,
    };
    const key = (iconName || "").toLowerCase();
    const IconComponent = iconByName[key] ?? Car;
    return IconComponent;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-slate-800/60 border-slate-700 text-white hover:bg-slate-700"
        >
          <div className="flex items-center gap-2">
            {value && (() => {
              const IconComponent = getIcon(getBrandIcon(value));
              return <IconComponent className="h-4 w-4" />;
            })()}
            <span className="truncate">{value || "Select make"}</span>
          </div>
          {value && (
            <X
              className="h-4 w-4 opacity-70 hover:opacity-100 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-900 border-slate-700" align="start">
        <Command className="bg-transparent text-slate-200">
          <CommandInput placeholder="Search makes..." className="placeholder-slate-500" />
          <CommandEmpty>No makes found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            <CommandItem
              key="__clear__"
              value=""
              onSelect={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-slate-300"
            >
              <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
              <span>Clear selection</span>
            </CommandItem>
            {makes.map((make) => {
              const IconComponent = getIcon(getBrandIcon(make));
              const country = getBrandCountry(make);
              return (
                <CommandItem
                  key={make}
                  value={make}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                  className="text-slate-300"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === make ? "opacity-100" : "opacity-0")} />
                  <IconComponent className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="truncate">{make}</span>
                    {country && <span className="text-xs text-slate-500">{country}</span>}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Enhanced Model Selector with search
function EnhancedModelSelector({
  value,
  onChange,
  make,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  make: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const models = useMemo(() => (make ? listModels(make) : listModels()), [make]);
  const isDisabled = !!disabled || models.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className="w-full justify-between bg-slate-800/60 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          <span className="truncate">{value || "Select model"}</span>
          {value && !isDisabled && (
            <X
              className="h-4 w-4 opacity-70 hover:opacity-100 mr-1"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-900 border-slate-700" align="start">
        <Command className="bg-transparent text-slate-200">
          <CommandInput placeholder="Search models..." className="placeholder-slate-500" />
          <CommandEmpty>No models found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            <CommandItem
              key="__clear__"
              value=""
              onSelect={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-slate-300"
            >
              <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
              <span>Clear selection</span>
            </CommandItem>
            {models.map((model) => (
              <CommandItem
                key={model}
                value={model}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? '' : currentValue);
                  setOpen(false);
                }}
                className="text-slate-300"
              >
                <Check className={cn("mr-2 h-4 w-4", value === model ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{model}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
