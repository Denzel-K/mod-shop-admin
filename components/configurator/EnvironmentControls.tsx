"use client";

import { Settings, Sun, Camera, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type EnvPreset = "city" | "sunset" | "dawn" | "warehouse" | "night" | "park";
type PlatformStyle = "circle" | "rounded" | "grid";
type GroundVariant = "plain" | "concrete" | "asphalt" | "carpet" | "studio";

interface EnvironmentControlsProps {
  envPreset: EnvPreset;
  setEnvPreset: (v: EnvPreset) => void;
  hdriBackground: boolean;
  setHdriBackground: (v: boolean) => void;
  platformStyle: PlatformStyle;
  setPlatformStyle: (v: PlatformStyle) => void;
  groundVariant: GroundVariant;
  setGroundVariant: (v: GroundVariant) => void;
  autoRotateEnabled: boolean;
  setAutoRotateEnabled: (v: boolean) => void;
  autoRotateSpeed: number;
  setAutoRotateSpeed: (v: number) => void;
}

export default function EnvironmentControls({
  envPreset,
  setEnvPreset,
  hdriBackground,
  setHdriBackground,
  platformStyle,
  setPlatformStyle,
  groundVariant,
  setGroundVariant,
  autoRotateEnabled,
  setAutoRotateEnabled,
  autoRotateSpeed,
  setAutoRotateSpeed,
}: EnvironmentControlsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Settings className="w-4 h-4" />
          Environment
        </div>
        <div className="text-lg font-semibold text-slate-100">Scene Settings</div>
      </div>

      {/* Environment Preset */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Sun className="w-4 h-4" />
          Lighting Environment
        </div>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-slate-400">HDRI preset</label>
            <Select value={envPreset} onValueChange={(v) => setEnvPreset(v as EnvPreset)}>
              <SelectTrigger className="w-full bg-slate-800 text-slate-200 border border-slate-700">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                {(['city','sunset','dawn','warehouse','night','park'] as EnvPreset[]).map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Use as background</span>
            <Switch checked={hdriBackground} onCheckedChange={setHdriBackground} />
          </div>
        </div>
      </div>

      {/* Platform & Ground */}
      <div className="space-y-4">
        <div className="text-sm text-slate-300">Platform & Ground</div>
        
        {/* Platform Style */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400">Platform style</label>
          <div className="grid grid-cols-3 gap-1">
            {([
              ["circle", "Circle"],
              ["rounded", "Rounded"],
              ["grid", "Grid"],
            ] as [PlatformStyle, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPlatformStyle(val)}
                className={cn(
                  "px-2 py-1.5 rounded text-xs transition-colors",
                  platformStyle === val
                    ? "bg-cyan-600/20 border border-cyan-600 text-cyan-300"
                    : "bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Ground Variant */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400">Ground material</label>
          <Select value={groundVariant} onValueChange={(v) => setGroundVariant(v as GroundVariant)}>
            <SelectTrigger className="w-full bg-slate-800 text-slate-200 border border-slate-700">
              <SelectValue placeholder="Select ground" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
              {(["plain", "concrete", "asphalt", "carpet", "studio"] as GroundVariant[]).map((p) => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Camera Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Camera className="w-4 h-4" />
          Camera Controls
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <label className="text-xs text-slate-400">Auto-rotate</label>
            </div>
            <div className="inline-flex items-center gap-2">
              <Switch checked={autoRotateEnabled} onCheckedChange={setAutoRotateEnabled} />
              <span className="text-xs text-slate-400">{autoRotateEnabled ? 'On' : 'Off'}</span>
            </div>
          </div>
          
          {autoRotateEnabled && (
            <div className="grid gap-1">
              <label className="text-xs text-slate-400">Rotation speed</label>
              <Slider
                value={[autoRotateSpeed]}
                onValueChange={(v) => setAutoRotateSpeed(v[0] ?? autoRotateSpeed)}
                min={0}
                max={10}
                step={0.02}
                className="w-full"
              />
              <div className="text-xs text-slate-400">{autoRotateSpeed.toFixed(2)} (0–10)</div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="text-xs text-slate-400 border-t border-slate-800 pt-4">
        • Left Click + Drag: Rotate
        <br />• Right Click + Drag: Pan
        <br />• Scroll: Zoom
        <br />• Double Click: Reset view
      </div>
    </div>
  );
}
