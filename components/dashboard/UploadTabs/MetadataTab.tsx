"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ComboBox } from "@/components/dashboard/ComboBox";
import { ChipsInput } from "@/components/dashboard/ChipsInput";

export type MetadataTabProps = {
  // Make/Model/Year/Variant
  makes: string[];
  models: string[];
  make: string;
  setMake: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  year: string;
  setYear: (v: string) => void;
  variant: string;
  setVariant: (v: string) => void;
  // Tags
  tagsChips: string[];
  setTagsChips: (v: string[]) => void;
  // Metadata mode and values
  metadataMode: 'chips' | 'csv' | 'json';
  setMetadataMode: (v: 'chips' | 'csv' | 'json') => void;
  wrappableSurfacesChips: string[];
  setWrappableSurfacesChips: (v: string[]) => void;
  rimsChips: string[];
  setRimsChips: (v: string[]) => void;
  windowsChips: string[];
  setWindowsChips: (v: string[]) => void;
  doorsChips: string[];
  setDoorsChips: (v: string[]) => void;
  tyresChips: string[];
  setTyresChips: (v: string[]) => void;
  interiorChips: string[];
  setInteriorChips: (v: string[]) => void;
  lightsChips: string[];
  setLightsChips: (v: string[]) => void;
  wrappableSurfacesCsv: string;
  setWrappableSurfacesCsv: (v: string) => void;
  rimsCsv: string;
  setRimsCsv: (v: string) => void;
  windowsCsv: string;
  setWindowsCsv: (v: string) => void;
  doorsCsv: string;
  setDoorsCsv: (v: string) => void;
  tyresCsv: string;
  setTyresCsv: (v: string) => void;
  interiorCsv: string;
  setInteriorCsv: (v: string) => void;
  lightsCsv: string;
  setLightsCsv: (v: string) => void;
  metadataJson: string;
  setMetadataJson: (v: string) => void;
};

export function MetadataTab(props: MetadataTabProps) {
  const {
    makes,
    models,
    make,
    setMake,
    model,
    setModel,
    year,
    setYear,
    variant,
    setVariant,
    tagsChips,
    setTagsChips,
    metadataMode,
    setMetadataMode,
    wrappableSurfacesChips,
    setWrappableSurfacesChips,
    rimsChips,
    setRimsChips,
    windowsChips,
    setWindowsChips,
    doorsChips,
    setDoorsChips,
    tyresChips,
    setTyresChips,
    interiorChips,
    setInteriorChips,
    lightsChips,
    setLightsChips,
    wrappableSurfacesCsv,
    setWrappableSurfacesCsv,
    rimsCsv,
    setRimsCsv,
    windowsCsv,
    setWindowsCsv,
    doorsCsv,
    setDoorsCsv,
    tyresCsv,
    setTyresCsv,
    interiorCsv,
    setInteriorCsv,
    lightsCsv,
    setLightsCsv,
    metadataJson,
    setMetadataJson,
  } = props;

  return (
    <div className="space-y-5">
      {/* Make / Model / Year / Variant */}
      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="space-y-2">
          <Label htmlFor="make" className="text-slate-300">Make</Label>
          <ComboBox id="make" value={make} onChange={setMake} options={makes} placeholder="e.g. Nissan" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model" className="text-slate-300">Model</Label>
          <ComboBox id="model" value={model} onChange={setModel} options={models} placeholder="e.g. GTR" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year" className="text-slate-300">Year</Label>
          <Input id="year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2017" type="number" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="variant" className="text-slate-300">Variant</Label>
          <Input id="variant" value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="e.g. NISMO" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
        </div>
      </div>

      {/* Tags */}
      <div className="md:col-span-2 space-y-2">
        <Label className="text-slate-300">Tags</Label>
        <ChipsInput value={tagsChips} onChange={setTagsChips} placeholder="Type and press Enter or comma to add" />
      </div>

      {/* Metadata entry mode */}
      <div className="md:col-span-2">
        <div className="flex flex-wrap gap-2 text-xs text-slate-300 mb-2 items-center ">
          <span className="text-slate-400">Metadata input:</span>
          <div className="border-[1.5px] border-slate-700 px-2 py-[4px] rounded-md space-x-2">  
            <button type="button" onClick={() => setMetadataMode('chips')} className={`px-2 py-1 rounded border transition-colors ${metadataMode==='chips'? 'border-cyan-600 bg-cyan-600/20 text-cyan-300':'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'}`}>Chips</button>
            <button type="button" onClick={() => setMetadataMode('csv')} className={`px-2 py-1 rounded border transition-colors ${metadataMode==='csv'? 'border-cyan-600 bg-cyan-600/20 text-cyan-300':'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'}`}>CSV</button>
            <button type="button" onClick={() => setMetadataMode('json')} className={`px-2 py-1 rounded border transition-colors ${metadataMode==='json'? 'border-cyan-600 bg-cyan-600/20 text-cyan-300':'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70'}`}>JSON</button>
          </div>
        </div>
      </div>

      {/* Metadata category inputs */}
      {metadataMode !== 'json' && (
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-2">
            <Label className="text-slate-300">Wrappable Surfaces</Label>
            {metadataMode === 'chips' ? (
              <ChipsInput value={wrappableSurfacesChips} onChange={setWrappableSurfacesChips} placeholder="Body, Hood, Roof" />
            ) : (
              <Input value={wrappableSurfacesCsv} onChange={(e) => setWrappableSurfacesCsv(e.target.value)} placeholder="Body, Hood, Roof" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Rims</Label>
            {metadataMode === 'chips' ? (
              <ChipsInput value={rimsChips} onChange={setRimsChips} placeholder="FL_Rim, FR_Rim, RL_Rim, RR_Rim" />
            ) : (
              <Input value={rimsCsv} onChange={(e) => setRimsCsv(e.target.value)} placeholder="FL_Rim, FR_Rim, RL_Rim, RR_Rim" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Windows</Label>
            {metadataMode === 'chips' ? (
              <ChipsInput value={windowsChips} onChange={setWindowsChips} placeholder="Front_Windshield, Rear_Windshield" />
            ) : (
              <Input value={windowsCsv} onChange={(e) => setWindowsCsv(e.target.value)} placeholder="Front_Windshield, Rear_Windshield" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Doors</Label>
            {metadataMode === 'chips' ? (
              <ChipsInput value={doorsChips} onChange={setDoorsChips} placeholder="FL_Door, FR_Door, RL_Door, RR_Door" />
            ) : (
              <Input value={doorsCsv} onChange={(e) => setDoorsCsv(e.target.value)} placeholder="FL_Door, FR_Door, RL_Door, RR_Door" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Tyres</Label>
            {metadataMode === 'chips' ? (
              <ChipsInput value={tyresChips} onChange={setTyresChips} placeholder="FL_Tyre, FR_Tyre, RL_Tyre, RR_Tyre" />
            ) : (
              <Input value={tyresCsv} onChange={(e) => setTyresCsv(e.target.value)} placeholder="FL_Tyre, FR_Tyre, RL_Tyre, RR_Tyre" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Interior</Label>
            {metadataMode === 'chips' ? (
              <ChipsInput value={interiorChips} onChange={setInteriorChips} placeholder="Seats, Dashboard, Steering_Wheel" />
            ) : (
              <Input value={interiorCsv} onChange={(e) => setInteriorCsv(e.target.value)} placeholder="Seats, Dashboard, Steering_Wheel" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Lights</Label>
            {metadataMode === 'chips' ? (
              <ChipsInput value={lightsChips} onChange={setLightsChips} placeholder="Headlights, Taillights, Indicators" />
            ) : (
              <Input value={lightsCsv} onChange={(e) => setLightsCsv(e.target.value)} placeholder="Headlights, Taillights, Indicators" className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500" />
            )}
          </div>
        </div>
      )}

      {/* Raw JSON metadata editor */}
      {metadataMode === 'json' && (
        <div className="md:col-span-2 space-y-2 animate-in fade-in zoom-in-95 duration-200">
          <Label htmlFor="metadataJson" className="text-slate-300">Raw Metadata JSON</Label>
          <textarea id="metadataJson" value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} rows={5} className="w-full bg-slate-800/60 border border-slate-700 text-white rounded px-3 py-2 font-mono text-sm" placeholder='{"wrappableSurfaces":["Body","Hood"],"windows":["Front_Windshield"]}' />
          <p className="text-xs text-slate-500">Paste a JSON object. If provided, it will override the category inputs above.</p>
        </div>
      )}
    </div>
  );
}
