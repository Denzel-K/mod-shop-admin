"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { listMakes, listModels, getBrandCountry, getBrandLogo } from "@/lib/model-mapping";
import { Car } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AssetFilters = {
  q?: string;
  make?: string;
  model?: string;
  year?: number;
  assetSource?: 'sketchfab' | 'turbosquid' | 'internal' | 'other';
  tag?: string;
  lastEditedBy?: string; // adminId
};

type Editor = { id: string; fullname: string; email: string; count: number };

export function FilterBar({ value, onChange, onApply }: { value: AssetFilters; onChange: (v: AssetFilters) => void; onApply: () => void }) {
  const makes = useMemo(() => listMakes(), []);
  const [local, setLocal] = useState<AssetFilters>(value);
  const models = useMemo(() => local.make ? listModels(local.make) : listModels(), [local.make]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [meId, setMeId] = useState<string | null>(null);

  const set = (patch: Partial<AssetFilters>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  // Load editors with counts and current admin id
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [meRes, listRes] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/assets/editors', { cache: 'no-store' }),
        ]);
        if (mounted && meRes.ok) {
          const me = await meRes.json();
          if (me?.admin?.id) setMeId(String(me.admin.id));
        }
        if (mounted && listRes.ok) {
          const data = await listRes.json();
          setEditors(Array.isArray(data.editors) ? data.editors : []);
          if (typeof data.total === 'number') setTotalAssets(data.total);
        }
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div role="region" aria-label="Asset filters" className="border-t border-slate-800 pt-3">
      {/* Compact horizontal filter layout */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Make */}
        <div className="min-w-[120px]">
          <Label className="text-xs text-slate-400 mb-1 block">Make</Label>
          <EnhancedMakeCombobox
            value={local.make || ''}
            onChange={(v) => {
              const nextModel = v && local.model && listModels(v).includes(local.model) ? local.model : undefined;
              set({ make: v || undefined, model: nextModel });
            }}
            options={makes}
            placeholder="Any"
            compact
          />
        </div>

        {/* Model */}
        <div className="min-w-[120px]">
          <Label className="text-xs text-slate-400 mb-1 block">Model</Label>
          <Combobox
            value={local.model || ''}
            onChange={(v) => set({ model: v || undefined })}
            options={models}
            placeholder="Any"
            disabled={!local.make && models.length === 0}
            compact
          />
        </div>

        {/* Year */}
        <div className="min-w-[100px]">
          <Label className="text-xs text-slate-400 mb-1 block" htmlFor="year">Year</Label>
          <Input 
            id="year" 
            inputMode="numeric" 
            pattern="[0-9]*" 
            type="number" 
            value={local.year || ''} 
            onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : undefined })} 
            placeholder="Any" 
            className="h-8 bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 text-sm" 
          />
        </div>

        {/* Source */}
        <div className="min-w-[120px]">
          <Label className="text-xs text-slate-400 mb-1 block">Source</Label>
          <Select
            value={local.assetSource ?? 'any'}
            onValueChange={(val) => set({ assetSource: (val === 'any' ? undefined : (val as AssetFilters['assetSource'])) })}
          >
            <SelectTrigger className="h-8 bg-slate-800/60 border-slate-700 text-white text-sm">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-slate-200 border-slate-700">
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="sketchfab">Sketchfab</SelectItem>
              <SelectItem value="turbosquid">TurboSquid</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Last edited by */}
        <div className="min-w-[180px]">
          <Label className="text-xs text-slate-400 mb-1 block">Last edited by</Label>
          <Select
            value={local.lastEditedBy ?? 'all'}
            onValueChange={(val) => set({ lastEditedBy: val === 'all' ? undefined : val })}
          >
            <SelectTrigger className="h-8 bg-slate-800/60 border-slate-700 text-white text-sm">
              <SelectValue placeholder="All editors" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-slate-200 border-slate-700">
              <SelectItem value="all">{`All editors${totalAssets ? ` (${totalAssets})` : ''}`}</SelectItem>
              {meId && (
                <SelectItem value={meId}>
                  Me{(() => {
                    const me = editors.find(c => c.id === meId);
                    return me ? ` (${me.count})` : '';
                  })()}
                </SelectItem>
              )}
              {editors
                .filter(c => !meId || c.id !== meId)
                .map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fullname || c.email} ({c.count})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700 text-xs"
            onClick={() => { setLocal({}); onChange({}); onApply(); }}
          >
            Reset
          </Button>
          <Button 
            size="sm" 
            className="h-8 bg-cyan-600 hover:bg-cyan-500 text-xs" 
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Make Combobox with icons and country info
function EnhancedMakeCombobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o === value) || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-slate-800/60 border-slate-700 text-white",
            compact ? "h-8 text-sm" : ""
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selected && (() => {
              const logo = getBrandLogo(selected);
              return logo ? (
                <Image src={logo} alt={`${selected} logo`} width={16} height={16} className="h-4 w-4 flex-shrink-0 object-contain" />
              ) : (
                <Car className="h-4 w-4 flex-shrink-0" />
              );
            })()}
            <span className="truncate">{selected || placeholder || "Select"}</span>
          </div>
          {selected && (
            <X
              className="h-4 w-4 opacity-70 hover:opacity-100 mr-1 flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            />
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-60 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-900 border-slate-700" align="start">
        <Command className="bg-transparent text-slate-200">
          <CommandInput placeholder="Search makes..." className="placeholder-slate-500" />
          <CommandEmpty>No makes found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            <CommandItem
              key="__any__"
              value=""
              onSelect={() => { onChange(''); setOpen(false); }}
              className="text-slate-300"
            >
              <Check className={cn("mr-2 h-4 w-4", value ? "opacity-0" : "opacity-100")} /> Any
            </CommandItem>
            {options.map((make) => {
              const country = getBrandCountry(make);
              return (
                <CommandItem
                  key={make}
                  value={make}
                  onSelect={(cur) => { onChange(cur === value ? '' : cur); setOpen(false); }}
                  className="text-slate-300"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === make ? "opacity-100" : "opacity-0")} />
                  {(() => {
                    const logo = getBrandLogo(make);
                    return logo ? (
                      <div className="flex items-center justify-center mr-2 rounded-sm bg-slate-100/60 border-slate-700 h-8 w-8">
                        <Image src={logo} alt={`${make} logo`} width={16} height={16} className="h-6 w-6 object-contain" />
                      </div>
                    ) : (
                      <Car className="mr-2 h-4 w-4" />
                    );
                  })()}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{make}</span>
                    {country && compact && <span className="text-xs text-slate-500 truncate">{country}</span>}
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

function Combobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o === value) || '';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-slate-800/60 border-slate-700 text-white",
            compact ? "h-8 text-sm" : ""
          )}
        >
          <span className="truncate mr-2">{selected || placeholder || "Select"}</span>
          {selected && (
            <X
              className="h-4 w-4 opacity-70 hover:opacity-100 mr-1"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            />
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-900 border-slate-700" align="start">
        <Command className="bg-transparent text-slate-200">
          <CommandInput placeholder="Search..." className="placeholder-slate-500" />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              key="__any__"
              value=""
              onSelect={() => { onChange(''); setOpen(false); }}
              className="text-slate-300"
            >
              <Check className={cn("mr-2 h-4 w-4", value ? "opacity-0" : "opacity-100")} /> Any
            </CommandItem>
            {options.map((opt) => (
              <CommandItem
                key={opt}
                value={opt}
                onSelect={(cur) => { onChange(cur === value ? '' : cur); setOpen(false); }}
                className="text-slate-300"
              >
                <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{opt}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
