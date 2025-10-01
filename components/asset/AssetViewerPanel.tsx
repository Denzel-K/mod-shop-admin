"use client";

import { useMemo, useState, useEffect } from "react";
import EnhancedModelViewer from "@/components/viewer/EnhancedModelViewer";
import ScaleEditor from "@/components/asset/ScaleEditor";
import WrapCustomizer from "@/components/configurator/WrapCustomizer";
import SurfaceSelector from "@/components/configurator/SurfaceSelector";
import EnvironmentControls from "@/components/configurator/EnvironmentControls";
import { cn } from "@/lib/utils";
import { WrapColor, WrapFinish, WrapCategory, WrapConfiguration } from "@/types/wrap";
import { IAssetMetadata } from "@/models/Asset";
import wrapColorsData from "@/lib/data/wrap-colors.json";
import wrapFinishesData from "@/lib/data/wrap-finishes.json";

type WrapColorsData = {
  categories: WrapCategory[];
  colors: WrapColor[];
};

type WrapFinishesData = {
  finishes: WrapFinish[];
};

type EnvPreset = "city" | "studio" | "sunset" | "dawn" | "warehouse" | "apartment" | "night" | "forest" | "park" | "lobby";
type PlatformStyle = "circle" | "rounded" | "grid";
type GroundVariant = "plain" | "concrete" | "asphalt" | "carpet" | "studio";

export default function AssetViewerPanel({
  url,
  assetId,
  initialScale = 1,
  assetName,
  assetFormat,
  assetMetadata,
}: {
  url: string;
  assetId: string;
  initialScale?: number;
  assetName?: string;
  assetFormat?: string;
  assetMetadata?: IAssetMetadata;
}) {
  const [envPreset, setEnvPreset] = useState<EnvPreset>("city");
  const [hdriBackground, setHdriBackground] = useState<boolean>(false);
  const [envIntensity, setEnvIntensity] = useState<number>(1.25);
  const [platformStyle, setPlatformStyle] = useState<PlatformStyle>("circle");
  const [groundVariant, setGroundVariant] = useState<GroundVariant>("plain");
  const [autoRotateEnabled, setAutoRotateEnabled] = useState<boolean>(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(0.52);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [highlightMode, setHighlightMode] = useState<boolean>(false);
  const [wrapConfig, setWrapConfig] = useState<WrapConfiguration>({
    surfaces: {},
    environment: {
      preset: envPreset,
      intensity: envIntensity,
      background: hdriBackground,
    },
  });
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedFinish, setSelectedFinish] = useState<string>("gloss");

  // Reset viewer state when asset changes to prevent cross-contamination
  useEffect(() => {
    setSelectedSurfaces([]);
    setHighlightMode(false);
    setWrapConfig({
      surfaces: {},
      environment: {
        preset: envPreset,
        intensity: envIntensity,
        background: hdriBackground,
      },
    });
    setSelectedColor("");
    setSelectedFinish("gloss");
  }, [assetId, envPreset, envIntensity, hdriBackground]);
  
  const isMobile = useMemo(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 767px)").matches, []);
  const isTablet = useMemo(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: 768px) and (max-width: 1199px)").matches, []);
  
  // Load wrap data
  const wrapColors: WrapColor[] = (wrapColorsData as WrapColorsData).colors;
  const wrapFinishes: WrapFinish[] = (wrapFinishesData as WrapFinishesData).finishes;
  const wrapCategories: WrapCategory[] = (wrapColorsData as WrapColorsData).categories;

  // Handle surface selection
  const handleSurfaceToggle = (surfaceId: string) => {
    setSelectedSurfaces((prev) => {
      const next = prev.includes(surfaceId)
        ? prev.filter((s) => s !== surfaceId)
        : [...prev, surfaceId];
      // Auto-manage highlight mode so selection changes reflect immediately in the scene
      setHighlightMode(next.length > 0);
      return next;
    });
  };

  const handleSurfaceSelect = (surfaceId: string) => {
    // Focus on surface in 3D view (to be implemented in ModelViewer)
    console.log('Focus on surface:', surfaceId);
  };

  const handleColorSelect = (colorId: string) => {
    setSelectedColor(colorId);
    // Apply to selected surfaces
    if (selectedSurfaces.length > 0) {
      const newConfig = { ...wrapConfig };
      selectedSurfaces.forEach(surfaceId => {
        newConfig.surfaces[surfaceId] = {
          ...newConfig.surfaces[surfaceId],
          colorId,
          finishId: selectedFinish,
        };
      });
      setWrapConfig(newConfig);
    }
  };

  const handleFinishSelect = (finishId: string) => {
    setSelectedFinish(finishId);
    // Apply to selected surfaces
    if (selectedSurfaces.length > 0) {
      const newConfig = { ...wrapConfig };
      selectedSurfaces.forEach(surfaceId => {
        newConfig.surfaces[surfaceId] = {
          ...newConfig.surfaces[surfaceId],
          colorId: selectedColor,
          finishId,
        };
      });
      setWrapConfig(newConfig);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Layout */}
      <div className={cn(
        "flex transition-all duration-300 ease-in-out",
        "w-full h-full"
      )}>
        {/* Left Sidebar: Car Controls (Desktop only) */}
        {!isMobile && !isTablet && (
          <div className={cn(
            "xl:block h-full border-r border-slate-800 bg-slate-900 flex-shrink-0",
            "overflow-y-auto overscroll-y-contain scroll-smooth min-h-0 scrollbar-subtle",
            "transition-[width] duration-300 ease-in-out",
            leftSidebarOpen ? "w-[300px]" : "w-0 overflow-hidden"
          )}>
            <div className={cn(
              "w-[300px] transition-opacity duration-300",
              leftSidebarOpen ? "opacity-100" : "opacity-0"
            )}>
              <div className="p-4 space-y-6">
                <SurfaceSelector
                  metadata={assetMetadata}
                  selectedSurfaces={selectedSurfaces}
                  onSurfaceToggle={handleSurfaceToggle}
                  onSurfaceSelect={handleSurfaceSelect}
                  highlightMode={highlightMode}
                  onHighlightModeToggle={setHighlightMode}
                />
                <WrapCustomizer
                  colors={wrapColors}
                  finishes={wrapFinishes}
                  categories={wrapCategories}
                  selectedColor={selectedColor}
                  selectedFinish={selectedFinish}
                  onColorSelect={handleColorSelect}
                  onFinishSelect={handleFinishSelect}
                />
              </div>
            </div>
          </div>
        )}

        {/* Center: Canvas area */}
        <div className="relative bg-black flex-1 min-h-0 min-w-0 h-full">
          <EnhancedModelViewer
            url={url}
            scale={initialScale}
            envPreset={envPreset}
            hdriBackground={hdriBackground}
            envIntensity={envIntensity}
            platformStyle={platformStyle}
            groundVariant={groundVariant}
            autoRotateEnabled={autoRotateEnabled}
            autoRotateSpeed={autoRotateSpeed}
            wrapConfig={wrapConfig}
            wrapColors={wrapColors}
            wrapFinishes={wrapFinishes}
            selectedSurfaces={selectedSurfaces}
            highlightMode={highlightMode}
            onSurfaceClick={handleSurfaceSelect}
          />

          {/* Mobile rotate tip */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 md:hidden">
            <div className="px-3 py-1.5 text-[11px] rounded-full bg-black/60 text-slate-200 border border-white/10 backdrop-blur-md">
              Rotate your phone for a better view
            </div>
          </div>

          {/* Mobile/Tablet overlay sidebars */}
          {(isMobile || isTablet) && (
            <>
              {/* Left sidebar overlay (Car controls) */}
              {leftSidebarOpen && (
                <div className="absolute inset-0 z-20">
                  <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity opacity-100"
                    onClick={() => setLeftSidebarOpen(false)}
                  />
                  <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-slate-900 border-r border-slate-800 shadow-xl max-h-[80vh] md:max-h-[calc(100vh-140px)] overflow-y-auto overscroll-y-contain scroll-smooth translate-x-0 transition-transform duration-300 scrollbar-subtle">
                    <div className="p-4 space-y-6">
                      <SurfaceSelector
                        metadata={assetMetadata}
                        selectedSurfaces={selectedSurfaces}
                        onSurfaceToggle={handleSurfaceToggle}
                        onSurfaceSelect={handleSurfaceSelect}
                        highlightMode={highlightMode}
                        onHighlightModeToggle={setHighlightMode}
                      />
                      <WrapCustomizer
                        colors={wrapColors}
                        finishes={wrapFinishes}
                        categories={wrapCategories}
                        selectedColor={selectedColor}
                        selectedFinish={selectedFinish}
                        onColorSelect={handleColorSelect}
                        onFinishSelect={handleFinishSelect}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Right sidebar overlay (Environment controls) */}
              {rightSidebarOpen && (
                <div className="absolute inset-0 z-20">
                  <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity opacity-100"
                    onClick={() => setRightSidebarOpen(false)}
                  />
                  <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-slate-900 border-l border-slate-800 shadow-xl max-h-[80vh] md:max-h-[calc(100vh-140px)] overflow-y-auto overscroll-y-contain scroll-smooth translate-x-0 transition-transform duration-300 scrollbar-subtle">
                    <div className="p-4">
                      <EnvironmentControls
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
                      />
                      <div className="mt-6">
                        <ScaleEditor id={assetId} initialScale={initialScale} inlineReadOnlyInitially />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Toggle buttons */}
          <div className="absolute top-3 left-3 right-3 z-10 flex justify-between">
            {/* Left sidebar toggle */}
            <button
              onClick={() => setLeftSidebarOpen((v) => !v)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md border",
                "bg-slate-900/70 border-slate-700 text-slate-200 hover:bg-slate-800",
                "backdrop-blur-md transition-colors"
              )}
            >
              {leftSidebarOpen ? "Hide" : "Show"} Car Controls
            </button>
            
            {/* Right sidebar toggle */}
            <button
              onClick={() => setRightSidebarOpen((v) => !v)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md border",
                "bg-slate-900/70 border-slate-700 text-slate-200 hover:bg-slate-800",
                "backdrop-blur-md transition-colors"
              )}
            >
              {rightSidebarOpen ? "Hide" : "Show"} Environment
            </button>
          </div>
        </div>

        {/* Right Sidebar: Environment Controls (Desktop only) */}
        {!isMobile && !isTablet && (
          <div className={cn(
            "xl:block h-full border-l border-slate-800 bg-slate-900 flex-shrink-0",
            "overflow-y-auto overscroll-y-contain scroll-smooth min-h-0 scrollbar-subtle",
            "transition-[width] duration-300 ease-in-out",
            rightSidebarOpen ? "w-[300px]" : "w-0 overflow-hidden"
          )}>
            <div className={cn(
              "w-[300px] transition-opacity duration-300",
              rightSidebarOpen ? "opacity-100" : "opacity-0"
            )}>
              <div className="p-4">
                <EnvironmentControls
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
                />
                <div className="mt-6 space-y-2">
                  <label className="text-sm text-slate-300">Scale</label>
                  <ScaleEditor id={assetId} initialScale={initialScale} inlineReadOnlyInitially />
                </div>
                
                {/* Asset Info */}
                <div className="mt-6 text-xs text-slate-400 flex items-center gap-2">
                  {assetName && <span className="truncate">{assetName}</span>}
                  {assetFormat && <span className="uppercase border border-slate-700 rounded px-1 py-0.5">{assetFormat}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
