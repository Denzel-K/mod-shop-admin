"use client";

import { useMemo, useState } from "react";
import ModelViewer from "@/components/viewer/ModelViewer";
import ScaleEditor from "@/components/asset/ScaleEditor";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

type EnvPreset = "city" | "studio" | "sunset" | "dawn" | "warehouse" | "apartment" | "night" | "forest" | "park" | "lobby";
type PlatformStyle = "circle" | "rounded" | "grid";
type GroundVariant = "plain" | "concrete" | "asphalt" | "carpet" | "studio";

export default function AssetViewerPanel({
  url,
  assetId,
  initialScale = 1,
  assetName,
  assetFormat,
}: {
  url: string;
  assetId: string;
  initialScale?: number;
  assetName?: string;
  assetFormat?: string;
}) {
  const [envPreset, setEnvPreset] = useState<EnvPreset>("city");
  const [hdriBackground, setHdriBackground] = useState<boolean>(false);
  const [envIntensity, setEnvIntensity] = useState<number>(1.25);
  const [platformStyle, setPlatformStyle] = useState<PlatformStyle>("circle");
  const [groundVariant, setGroundVariant] = useState<GroundVariant>("plain");
  const [autoRotateEnabled, setAutoRotateEnabled] = useState<boolean>(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(0.52);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const isMobile = useMemo(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 767px)").matches, []);

  return (
    <div className="relative w-full">
      {/* Layout */}
      <div className={cn(
        "grid transition-[grid-template-columns] duration-300 ease-in-out",
        "w-full min-h-[60vh] md:min-h-[70vh]",
        sidebarOpen ? "grid-cols-1 md:grid-cols-[1fr_320px]" : "grid-cols-1"
      )}>
        {/* Left: Canvas area */}
        <div className="relative bg-black">
          <ModelViewer
            url={url}
            scale={initialScale}
            envPreset={envPreset}
            hdriBackground={hdriBackground}
            envIntensity={envIntensity}
            platformStyle={platformStyle}
            groundVariant={groundVariant}
            autoRotateEnabled={autoRotateEnabled}
            autoRotateSpeed={autoRotateSpeed}
          />

          {/* Mobile rotate tip */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 md:hidden">
            <div className="px-3 py-1.5 text-[11px] rounded-full bg-black/60 text-slate-200 border border-white/10 backdrop-blur-md">
              Rotate your phone for a better view
            </div>
          </div>

          {/* Mobile overlay sidebar */}
          {isMobile && (
            <div className={cn(
              "absolute inset-0 z-20",
              sidebarOpen ? "" : "pointer-events-none"
            )}>
              {/* Backdrop */}
              <div
                className={cn(
                  "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity",
                  sidebarOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={() => setSidebarOpen(false)}
              />
              {/* Panel */}
              <div
                className={cn(
                  "absolute right-0 top-0 h-full w-[85%] max-w-sm bg-slate-900 border-l border-slate-800 shadow-xl",
                  // Cap height and enable smooth, contained scrolling on all sizes
                  "max-h-[80vh] md:max-h-[calc(100vh-140px)] overflow-y-auto overscroll-y-contain scroll-smooth",
                  sidebarOpen ? "translate-x-0" : "translate-x-full"
                )}
              >
                <SidebarContent
                  envPreset={envPreset}
                  setEnvPreset={setEnvPreset}
                  hdriBackground={hdriBackground}
                  setHdriBackground={setHdriBackground}
                  envIntensity={envIntensity}
                  setEnvIntensity={setEnvIntensity}
                  platformStyle={platformStyle}
                  setPlatformStyle={setPlatformStyle}
                  groundVariant={groundVariant}
                  setGroundVariant={setGroundVariant}
                  autoRotateEnabled={autoRotateEnabled}
                  setAutoRotateEnabled={setAutoRotateEnabled}
                  autoRotateSpeed={autoRotateSpeed}
                  setAutoRotateSpeed={setAutoRotateSpeed}
                  assetId={assetId}
                  initialScale={initialScale}
                  assetName={assetName}
                  assetFormat={assetFormat}
                />
              </div>
            </div>
          )}

          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className={cn(
              "absolute top-3 right-3 z-10 px-3 py-1.5 text-xs rounded-md border",
              "bg-slate-900/70 border-slate-700 text-slate-200 hover:bg-slate-800",
              "backdrop-blur-md transition-colors"
            )}
          >
            {sidebarOpen ? "Hide" : "Show"} Panel
          </button>
        </div>

        {/* Right: Desktop sidebar */}
        <div className={cn(
          "hidden md:block h-full border-l border-slate-800 bg-slate-900",
          // Cap height and enable contained scrolling even on large screens
          "max-h-[80vh] md:max-h-[calc(100vh-140px)] overflow-y-auto overscroll-y-contain scroll-smooth",
          "transition-[width] duration-300",
          sidebarOpen ? "w-[320px]" : "w-0"
        )}
        >
          {sidebarOpen && (
            <SidebarContent
              envPreset={envPreset}
              setEnvPreset={setEnvPreset}
              hdriBackground={hdriBackground}
              setHdriBackground={setHdriBackground}
              envIntensity={envIntensity}
              setEnvIntensity={setEnvIntensity}
              platformStyle={platformStyle}
              setPlatformStyle={setPlatformStyle}
              groundVariant={groundVariant}
              setGroundVariant={setGroundVariant}
              autoRotateEnabled={autoRotateEnabled}
              setAutoRotateEnabled={setAutoRotateEnabled}
              autoRotateSpeed={autoRotateSpeed}
              setAutoRotateSpeed={setAutoRotateSpeed}
              assetId={assetId}
              initialScale={initialScale}
              assetName={assetName}
              assetFormat={assetFormat}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  envPreset,
  setEnvPreset,
  hdriBackground,
  setHdriBackground,
  envIntensity,
  setEnvIntensity,
  platformStyle,
  setPlatformStyle,
  groundVariant,
  setGroundVariant,
  autoRotateEnabled,
  setAutoRotateEnabled,
  autoRotateSpeed,
  setAutoRotateSpeed,
  assetId,
  initialScale,
  assetName,
  assetFormat,
}: {
  envPreset: EnvPreset;
  setEnvPreset: (v: EnvPreset) => void;
  hdriBackground: boolean;
  setHdriBackground: (v: boolean) => void;
  envIntensity: number;
  setEnvIntensity: (v: number) => void;
  platformStyle: PlatformStyle;
  setPlatformStyle: (v: PlatformStyle) => void;
  groundVariant: GroundVariant;
  setGroundVariant: (v: GroundVariant) => void;
  autoRotateEnabled: boolean;
  setAutoRotateEnabled: (v: boolean) => void;
  autoRotateSpeed: number;
  setAutoRotateSpeed: (v: number) => void;
  assetId: string;
  initialScale: number;
  assetName?: string;
  assetFormat?: string;
}) {
  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="text-sm text-slate-400">Customize</div>
        <div className="text-lg font-semibold text-slate-100">Viewer Settings</div>
      </div>

      {/* Asset meta */}
      <div className="text-xs text-slate-400 flex items-center gap-2">
        {assetName && <span className="truncate">{assetName}</span>}
        {assetFormat && <span className="uppercase border border-slate-700 rounded px-1 py-0.5">{assetFormat}</span>}
      </div>

      {/* Environment */}
      <div className="space-y-3">
        <div className="text-sm text-slate-300">Environment</div>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-slate-400">HDRI preset</label>
            <Select value={envPreset} onValueChange={(v) => setEnvPreset(v as EnvPreset)}>
              <SelectTrigger className="w-full bg-slate-800 text-slate-200 border border-slate-700">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
                {(['city','studio','sunset','dawn','warehouse','apartment','night','forest','park','lobby'] as EnvPreset[]).map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Use as background</span>
            <Switch checked={hdriBackground} onCheckedChange={setHdriBackground} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-slate-400">Environment intensity</label>
            <Slider
              value={[envIntensity]}
              onValueChange={(v) => setEnvIntensity(v[0] ?? envIntensity)}
              min={0}
              max={2}
              step={0.01}
            />
            <div className="text-[10px] text-slate-500">{envIntensity.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Platform style */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Platform style</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["circle", "Circle"],
            ["rounded", "Rounded"],
            ["grid", "Grid"],
          ] as [PlatformStyle, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPlatformStyle(val)}
              className={cn(
                "px-3 py-2 rounded border text-sm transition-colors",
                platformStyle === val
                  ? "bg-cyan-600/20 border-cyan-600 text-cyan-300"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Ground variant */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Ground variant</label>
        <Select value={groundVariant} onValueChange={(v) => setGroundVariant(v as GroundVariant)}>
          <SelectTrigger className="w-full bg-slate-800 text-slate-200 border border-slate-700">
            <SelectValue placeholder="Select ground" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 text-slate-100 border-slate-700">
            {(["plain", "concrete", "asphalt", "carpet", "studio"] as GroundVariant[]).map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {/* Auto rotate speed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Auto-rotate</label>
          <div className="inline-flex items-center gap-2 cursor-pointer">
            <Switch checked={autoRotateEnabled} onCheckedChange={setAutoRotateEnabled} />
            <span className="text-xs text-slate-400">{autoRotateEnabled ? 'On' : 'Off'}</span>
          </div>
        </div>
        <label className="text-sm text-slate-300">Speed</label>
        <Slider
          value={[autoRotateSpeed]}
          onValueChange={(v) => setAutoRotateSpeed(v[0] ?? autoRotateSpeed)}
          min={0}
          max={30}
          step={0.02}
          disabled={!autoRotateEnabled}
        />
        <div className="text-xs text-slate-400">{autoRotateSpeed.toFixed(2)} (0–30)</div>
      </div>

      {/* Scale editor */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">Scale</label>
        <ScaleEditor id={assetId} initialScale={initialScale} inlineReadOnlyInitially />
      </div>

      {/* Tips */}
      <div className="text-xs text-slate-400 border-t border-slate-800 pt-4">
        • Left Click + Drag: Rotate
        <br />• Right Click + Drag: Pan
        <br />• Scroll: Zoom
      </div>
    </div>
  );
}
