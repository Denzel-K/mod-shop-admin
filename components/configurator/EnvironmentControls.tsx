"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Settings, Sun, Camera, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ENVIRONMENT_PRESETS } from "@/lib/viewer/environment";
import type { EnvPreset } from "@/lib/viewer/environment";
import { useEnvPresets } from "@/lib/viewer/useEnvPresets";

interface EnvironmentControlsProps {
  envPreset: EnvPreset;
  setEnvPreset: (v: EnvPreset) => void;
  hdriBackground: boolean;
  setHdriBackground: (v: boolean) => void;
  envBlur: number;
  setEnvBlur: (v: number) => void;
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
  envBlur,
  setEnvBlur,
  autoRotateEnabled,
  setAutoRotateEnabled,
  autoRotateSpeed,
  setAutoRotateSpeed,
}: EnvironmentControlsProps) {
  const { presets: presetMap } = useEnvPresets();
  const presets = useMemo(() => Object.keys(presetMap) as EnvPreset[], [presetMap]);
  const activeIndex = useMemo(() => presets.indexOf(envPreset), [presets, envPreset]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<EnvPreset, HTMLButtonElement | null>>({
    city: null,
    sunset: null,
    dawn: null,
    night: null,
    park: null,
    'snowy-mountain': null,
  });

  const prettyPreset = useMemo(() => envPreset.charAt(0).toUpperCase() + envPreset.slice(1), [envPreset]);
  const groundName = useMemo(() => {
    switch (envPreset) {
      case 'dawn':
        return 'Desert rocks';
      case 'sunset':
        return 'Pea gravel';
      case 'city':
        return 'Gravel';
      case 'park':
        return 'Wispy grass meadow';
      case 'night':
        return 'Rocky dirt';
      default:
        return 'Gravel';
    }
  }, [envPreset]);

  const scrollItemIntoView = (preset: EnvPreset) => {
    const el = itemRefs.current[preset];
    const list = listRef.current;
    if (el && list) {
      const elRect = el.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      if (elRect.left < listRect.left) {
        list.scrollBy({ left: elRect.left - listRect.left - 12, behavior: "smooth" });
      } else if (elRect.right > listRect.right) {
        list.scrollBy({ left: elRect.right - listRect.right + 12, behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    scrollItemIntoView(envPreset);
  }, [envPreset]);

  const handlePrev = () => {
    const nextIdx = (activeIndex - 1 + presets.length) % presets.length;
    setEnvPreset(presets[nextIdx]);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % presets.length;
    setEnvPreset(presets[nextIdx]);
  };

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
            <div
              className="relative w-full overflow-hidden -mx-2"
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  handlePrev();
                }
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  handleNext();
                }
              }}
            >
              <button
                type="button"
                aria-label="Previous HDRI"
                onClick={handlePrev}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-700 focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={listRef}
                tabIndex={0}
                className="w-full flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent py-1 px-8"
                role="listbox"
                aria-label="HDRI presets"
              >
                {presets.map((p) => {
                  const cfg = presetMap[p] ?? ENVIRONMENT_PRESETS[p];
                  const active = envPreset === p;
                  return (
                    <div key={p} className="shrink-0 flex flex-col items-center gap-1 w-24">
                      <button
                        ref={(el) => { itemRefs.current[p] = el }}
                        type="button"
                        onClick={() => setEnvPreset(p)}
                        role="option"
                        aria-selected={active}
                        className={`relative w-24 h-16 rounded-md border transition-colors focus:outline-none ${
                          active
                            ? "border-cyan-500 ring-2 ring-cyan-500/40"
                            : "border-slate-700 hover:border-slate-500"
                        }`}
                        title={p}
                      >
                        <Image
                          src={cfg?.thumbnail ?? `/HDRI-thumbnails/${p}.svg`}
                          alt={`${cfg?.label ?? p} HDRI`}
                          fill
                          sizes="80px"
                          className="object-cover rounded-md"
                          priority={active}
                        />
                        {active && (
                          <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-cyan-500/60" />
                        )}
                      </button>
                      <div className="text-[12px] font-semibold leading-3 capitalize text-center text-slate-300 w-full">
                        {cfg?.label ?? p}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Next HDRI"
                onClick={handleNext}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-700 focus:outline-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Use as background</span>
            <Switch checked={hdriBackground} onCheckedChange={setHdriBackground} />
          </div>
          {/* Blur slider */}
          <div className="grid gap-1">
            <label className="text-xs text-slate-400">HDRI blur</label>
            <Slider
              value={[envBlur]}
              onValueChange={(v) => setEnvBlur(v[0] ?? envBlur)}
              min={0}
              max={0.6}
              step={0.01}
              className="w-full"
            />
            <div className="text-xs text-slate-400">{envBlur.toFixed(2)} (0–0.60)</div>
          </div>
          {/* Ground texture preview tied to HDRI preset */}
          <div className="grid gap-2">
            <label className="text-xs text-slate-400">{`Ground texture for ${prettyPreset}`}</label>
            <div className="relative w-full h-24 rounded-md overflow-hidden border border-slate-700 bg-slate-800">
              <Image
                src={(presetMap[envPreset]?.groundTexture ?? ENVIRONMENT_PRESETS[envPreset]?.groundTexture) || '/ground-textures/gravel/gravel_albedo.png'}
                alt={`${envPreset} ground preview`}
                fill
                sizes="320px"
                className="object-cover"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[14px] bg-black/40 font-semibold text-slate-200">{(presetMap[envPreset]?.groundName ?? ENVIRONMENT_PRESETS[envPreset]?.groundName) || groundName}</div>
            </div>
          </div>
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
