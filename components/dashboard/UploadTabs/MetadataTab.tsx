"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChipsInput } from "@/components/dashboard/ChipsInput";
import { JsonEditor } from "@/components/ui/JsonEditor";

export type MetadataTabProps = {
  // Metadata mode and values (true metadata only)
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
  isEdit?: boolean;
};

const DEFAULT_METADATA_TEMPLATE = `{
  "wrappableSurfaces": [
    "body_front_bumper",
    "body_rear_bumper",
    "body_hood",
    "body_trunk",
    "body_roof"
  ],
  "rims": [
    "wheel_front_left_rim",
    "wheel_front_right_rim",
    "wheel_rear_left_rim",
    "wheel_rear_right_rim"
  ],
  "windows": [
    "window_windshield",
    "window_rear",
    "window_left_front",
    "window_right_front"
  ],
  "doors": [
    "door_left_front",
    "door_right_front",
    "door_left_rear",
    "door_right_rear"
  ],
  "tyres": [
    "tyre_front_left",
    "tyre_front_right",
    "tyre_rear_left",
    "tyre_rear_right"
  ],
  "interior": [
    "interior_dashboard",
    "interior_seats_front",
    "interior_steering_wheel"
  ],
  "lights": [
    "light_headlight_left",
    "light_headlight_right",
    "light_taillight_left",
    "light_taillight_right"
  ]
}`;

export function MetadataTab(props: MetadataTabProps) {
  const {
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
    isEdit,
  } = props;

  // Use template for new uploads when JSON editor is empty
  const jsonValue = metadataJson || (!isEdit ? DEFAULT_METADATA_TEMPLATE : '');

  return (
    <div className="space-y-5">
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
          <Label className="text-slate-300">Raw Metadata JSON</Label>
          <JsonEditor
            value={jsonValue}
            onChange={setMetadataJson}
            placeholder='{"wrappableSurfaces":["Body","Hood"],"windows":["Front_Windshield"]}'
            height="600px"
          />
          <p className="text-xs text-slate-500">
            Edit JSON metadata with syntax highlighting and error detection. 
            This will override the category inputs above when saved.
          </p>
        </div>
      )}
    </div>
  );
}
