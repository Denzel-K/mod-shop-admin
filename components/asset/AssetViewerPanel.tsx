"use client";

import { useMemo, useState } from "react";
import ModelViewer from "@/components/viewer/ModelViewer";
import ScaleEditor from "@/components/asset/ScaleEditor";
import { cn } from "@/lib/utils";

const ENV_PRESETS = [
  "city",
  "studio",
  "sunset",
  "dawn",
  "warehouse",
  "apartment",
  "night",
  "forest",
  "park",
  "lobby",
] as const;

type EnvPreset = (typeof ENV_PRESETS)[number];
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
  const [platformStyle, setPlatformStyle] = useState<PlatformStyle>("circle");
  const [groundVariant, setGroundVariant] = useState<GroundVariant>("plain");
  const [autoRotateEnabled, setAutoRotateEnabled] = useState<boolean>(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(0.52);
  const [hdriBackground, setHdriBackground] = useState<boolean>(false);
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
            platformStyle={platformStyle}
            groundVariant={groundVariant}
            hdriBackground={hdriBackground}
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
                  "transition-transform duration-300",
                  sidebarOpen ? "translate-x-0" : "translate-x-full"
                )}
              >
                <SidebarContent
                  envPreset={envPreset}
                  setEnvPreset={setEnvPreset}
                  platformStyle={platformStyle}
                  setPlatformStyle={setPlatformStyle}
                  groundVariant={groundVariant}
                  setGroundVariant={setGroundVariant}
                  autoRotateEnabled={autoRotateEnabled}
                  setAutoRotateEnabled={setAutoRotateEnabled}
                  autoRotateSpeed={autoRotateSpeed}
                  setAutoRotateSpeed={setAutoRotateSpeed}
                  hdriBackground={hdriBackground}
                  setHdriBackground={setHdriBackground}
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
          "hidden md:block h-full border-l border-slate-800 bg-slate-900 overflow-y-auto",
          "transition-[width] duration-300",
          sidebarOpen ? "w-[320px]" : "w-0"
        )}
        >
          {sidebarOpen && (
            <SidebarContent
              envPreset={envPreset}
              setEnvPreset={setEnvPreset}
              platformStyle={platformStyle}
              setPlatformStyle={setPlatformStyle}
              groundVariant={groundVariant}
              setGroundVariant={setGroundVariant}
              autoRotateEnabled={autoRotateEnabled}
              setAutoRotateEnabled={setAutoRotateEnabled}
              autoRotateSpeed={autoRotateSpeed}
              setAutoRotateSpeed={setAutoRotateSpeed}
              hdriBackground={hdriBackground}
              setHdriBackground={setHdriBackground}
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
  platformStyle,
  setPlatformStyle,
  groundVariant,
  setGroundVariant,
  autoRotateEnabled,
  setAutoRotateEnabled,
  autoRotateSpeed,
  setAutoRotateSpeed,
  hdriBackground,
  setHdriBackground,
  assetId,
  initialScale,
  assetName,
  assetFormat,
}: {
  envPreset: EnvPreset;
  setEnvPreset: (v: EnvPreset) => void;
  platformStyle: PlatformStyle;
  setPlatformStyle: (v: PlatformStyle) => void;
  groundVariant: GroundVariant;
  setGroundVariant: (v: GroundVariant) => void;
  autoRotateEnabled: boolean;
  setAutoRotateEnabled: (v: boolean) => void;
  autoRotateSpeed: number;
  setAutoRotateSpeed: (v: number) => void;
  hdriBackground: boolean;
  setHdriBackground: (v: boolean) => void;
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

      {/* HDRI selector */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">HDRI preset</label>
        <select
          value={envPreset}
          onChange={(e) => setEnvPreset(e.target.value as EnvPreset)}
          className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-2 outline-none focus:ring-2 ring-cyan-500"
        >
          {ENV_PRESETS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
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
        <select
          value={groundVariant}
          onChange={(e) => setGroundVariant(e.target.value as GroundVariant)}
          className="w-full bg-slate-800 text-slate-200 border border-slate-700 rounded px-3 py-2 outline-none focus:ring-2 ring-cyan-500"
        >
          {(["plain", "concrete", "asphalt", "carpet", "studio"] as GroundVariant[]).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* HDRI options */}
      <div className="space-y-2">
        <label className="text-sm text-slate-300">HDRI options</label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Use HDRI as background</span>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hdriBackground}
              onChange={(e) => setHdriBackground(e.target.checked)}
              className="accent-cyan-500"
            />
          </label>
        </div>
      </div>

      {/* Auto rotate speed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-300">Auto-rotate</label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRotateEnabled}
              onChange={(e) => setAutoRotateEnabled(e.target.checked)}
              className="accent-cyan-500"
            />
            <span className="text-xs text-slate-400">{autoRotateEnabled ? 'On' : 'Off'}</span>
          </label>
        </div>
        <label className="text-sm text-slate-300">Speed</label>
        <input
          type="range"
          min={0}
          max={30}
          step={0.02}
          value={autoRotateSpeed}
          onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
          className="w-full disabled:opacity-50"
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
