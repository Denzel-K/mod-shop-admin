"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { listMakes, listModels } from "@/lib/model-mapping";

export type AssetFilters = {
  q?: string;
  make?: string;
  model?: string;
  year?: number;
  assetSource?: 'sketchfab' | 'turbosquid' | 'internal' | 'other';
  tag?: string;
};

export function FilterBar({ value, onChange, onApply }: { value: AssetFilters; onChange: (v: AssetFilters) => void; onApply: () => void }) {
  const makes = useMemo(() => listMakes(), []);
  const [local, setLocal] = useState<AssetFilters>(value);
  const models = useMemo(() => local.make ? listModels(local.make) : listModels(), [local.make]);

  const set = (patch: Partial<AssetFilters>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange(next);
  };

  return (
    <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3 sm:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="space-y-1 col-span-2 sm:col-span-1 lg:col-span-2">
          <Label className="text-slate-300" htmlFor="q">Search</Label>
          <Input id="q" value={local.q || ''} onChange={(e) => set({ q: e.target.value })} placeholder="Name, make, model, tag" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
        </div>
        <div className="space-y-1">
          <Label className="text-slate-300" htmlFor="make">Make</Label>
          <input list="makes" id="make" value={local.make || ''} onChange={(e) => set({ make: e.target.value })} placeholder="Any" className="w-full bg-slate-800/60 border border-slate-700 text-white rounded px-3 py-2" />
          <datalist id="makes">
            {makes.map((m) => (<option key={m} value={m} />))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-300" htmlFor="model">Model</Label>
          <input list="models" id="model" value={local.model || ''} onChange={(e) => set({ model: e.target.value })} placeholder="Any" className="w-full bg-slate-800/60 border border-slate-700 text-white rounded px-3 py-2" />
          <datalist id="models">
            {models.map((m) => (<option key={m} value={m} />))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-300" htmlFor="year">Year</Label>
          <Input id="year" type="number" value={local.year || ''} onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : undefined })} placeholder="Any" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
        </div>
        <div className="space-y-1">
          <Label className="text-slate-300" htmlFor="source">Source</Label>
          <select id="source" value={local.assetSource || ''} onChange={(e) => {
            const value = e.target.value as AssetFilters['assetSource'] | '';
            set({ assetSource: value === '' ? undefined : value });
          }} className="w-full bg-slate-800/60 border border-slate-700 text-white rounded px-3 py-2">
            <option value="">Any</option>
            <option value="sketchfab">Sketchfab</option>
            <option value="turbosquid">TurboSquid</option>
            <option value="internal">Internal</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-300" htmlFor="tag">Tag</Label>
          <Input id="tag" value={local.tag || ''} onChange={(e) => set({ tag: e.target.value })} placeholder="Any" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="outline" className="bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700" onClick={() => { setLocal({}); onChange({}); onApply(); }}>Reset</Button>
        <Button className="bg-cyan-600 hover:bg-cyan-500" onClick={onApply}>Apply Filters</Button>
      </div>
    </div>
  );
}
