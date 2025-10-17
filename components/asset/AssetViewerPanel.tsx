"use client";

import { useMemo, useState, useEffect } from "react";
import EnhancedModelViewer from "@/components/viewer/EnhancedModelViewer";
import ScaleEditor from "@/components/asset/ScaleEditor";
import WrapCustomizer from "@/components/configurator/WrapCustomizer";
import SurfaceSelector from "@/components/configurator/SurfaceSelector";
import EnvironmentControls from "@/components/configurator/EnvironmentControls";
import { cn } from "@/lib/utils";
import { WrapColor, WrapFinish, WrapConfiguration } from "@/types/wrap";
import { IAssetMetadata } from "@/models/Asset";
// import wrapColorsData from "@/lib/data/wrap-colors.json";
// import wrapFinishesData from "@/lib/data/wrap-finishes.json";
import wrapColorsData from "@/lib/data/wrap_colors.json";
import wrapFinishesData from "@/lib/data/wrap_finishes.json";
import { ChevronLeft, ChevronRight, Palette, Settings } from "lucide-react";

type WrapColorsData = {
  // categories kept in data for potential future use but not used in UI anymore
  categories?: unknown[];
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
  assetDescription,
  assetTags,
}: {
  url: string;
  assetId: string;
  initialScale?: number;
  assetName?: string;
  assetFormat?: string;
  assetMetadata?: IAssetMetadata;
  assetDescription?: string;
  assetTags?: string[];
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
  const [selectedFinish, setSelectedFinish] = useState<string>("gloss_series");

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
    setSelectedFinish("gloss_series");
  }, [assetId, envPreset, envIntensity, hdriBackground]);
  
  // Responsive breakpoints with dynamic updates
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const updateBreakpoints = () => {
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const tablet = window.matchMedia("(min-width: 768px) and (max-width: 1199px)").matches;
      const mobilePortrait = window.matchMedia("(max-width: 640px) and (orientation: portrait)").matches;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsMobilePortrait(mobilePortrait);
    };
    
    updateBreakpoints();
    window.addEventListener("resize", updateBreakpoints);
    window.addEventListener("orientationchange", updateBreakpoints);
    
    return () => {
      window.removeEventListener("resize", updateBreakpoints);
      window.removeEventListener("orientationchange", updateBreakpoints);
    };
  }, []);
  
  // Load wrap data
  const wrapColors: WrapColor[] = (wrapColorsData as WrapColorsData).colors;
  const wrapFinishes: WrapFinish[] = (wrapFinishesData as WrapFinishesData).finishes;
  // categories are no longer used in UI since colors are driven by finish compatibility

  // Handle surface selection
  const handleSurfaceToggle = (surfaceId: string) => {
    setSelectedSurfaces((prev) => {
      const next = prev.includes(surfaceId)
        ? prev.filter((s) => s !== surfaceId)
        : [...prev, surfaceId];
      // Auto-enable highlight when there is at least one selection, otherwise disable
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
    // When a color is selected, turn off highlight mode for a clearer final preview
    setHighlightMode(false);
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
    // If current selectedColor is incompatible with new finish, clear it
    const color = wrapColors.find(c => c.id === selectedColor);
    if (color && !(color.compatibleFinishes || []).includes(finishId)) {
      setSelectedColor("");
    }
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

  // Calculate responsive sidebar width
  const sidebarWidth = useMemo(() => {
    if (isMobile) return "85%"; // Mobile
    if (isTablet) return "280px"; // Tablet
    return "320px"; // Desktop
  }, [isMobile, isTablet]);
  
  const sidebarWidthPx = useMemo(() => {
    if (isMobile) return 0; // Not used for mobile
    if (isTablet) return 280;
    return 320;
  }, [isMobile, isTablet]);

  return (
    <div className="absolute inset-0">
      {/* Mobile Portrait Landscape Prompt */}
      {isMobilePortrait && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="text-center max-w-sm">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-cyan-400/30 rounded-2xl animate-pulse" />
              <div className="absolute inset-2 border-4 border-cyan-400 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">Rotate Your Device</h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              This 3D experience is optimized for landscape orientation
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Rotate to continue</span>
            </div>
          </div>
        </div>
      )}
      {/* Canvas - Full screen background layer (z-0) */}
      <div className="absolute inset-0 bg-black">
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
      </div>
      {/* Left Sidebar: Car Controls (Desktop/Tablet - overlay with glassmorphism) */}
      {!isMobile && (
        <div 
          className={cn(
            "absolute left-4 top-4 bottom-4 z-10",
            "rounded-2xl border border-white/10",
            "bg-slate-900/50",
            "overflow-hidden",
            "shadow-2xl shadow-black/40",
            "transition-all duration-300 ease-in-out",
            leftSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          )}
          style={{ width: sidebarWidth }}
        >
          <div style={{ width: sidebarWidth }} className="h-full overflow-y-auto overscroll-y-contain scroll-smooth scrollbar-subtle">
            <div className="p-6 space-y-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Customization</h2>
                </div>
                <SurfaceSelector
                  metadata={assetMetadata}
                  selectedSurfaces={selectedSurfaces}
                  onSurfaceToggle={handleSurfaceToggle}
                  onSurfaceSelect={handleSurfaceSelect}
                  highlightMode={highlightMode}
                  onHighlightModeToggle={setHighlightMode}
                />
              </div>
              {assetMetadata?.wrappableSurfaces && Object.keys(assetMetadata.wrappableSurfaces).length > 0 ? (
                <WrapCustomizer
                  colors={wrapColors}
                  finishes={wrapFinishes}
                  selectedColor={selectedColor}
                  selectedFinish={selectedFinish}
                  onColorSelect={handleColorSelect}
                  onFinishSelect={handleFinishSelect}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Mobile rotate tip */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 md:hidden z-10">
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
              <div className="absolute left-2 top-2 bottom-2 w-[85%] max-w-sm rounded-2xl bg-slate-900/50 border border-white/10 shadow-2xl overflow-y-auto overscroll-y-contain scroll-smooth translate-x-0 transition-transform duration-300 scrollbar-subtle">
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Customization</h2>
                  </div>
                  <SurfaceSelector
                    metadata={assetMetadata}
                    selectedSurfaces={selectedSurfaces}
                    onSurfaceToggle={handleSurfaceToggle}
                    onSurfaceSelect={handleSurfaceSelect}
                    highlightMode={highlightMode}
                    onHighlightModeToggle={setHighlightMode}
                  />
                  {assetMetadata?.wrappableSurfaces && Object.keys(assetMetadata.wrappableSurfaces).length > 0 ? (
                    <WrapCustomizer
                      colors={wrapColors}
                      finishes={wrapFinishes}
                      selectedColor={selectedColor}
                      selectedFinish={selectedFinish}
                      onColorSelect={handleColorSelect}
                      onFinishSelect={handleFinishSelect}
                    />
                  ) : null}
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
              <div className="absolute right-2 top-2 bottom-2 w-[85%] max-w-sm rounded-2xl bg-slate-900/50 border border-white/10 shadow-2xl overflow-y-auto overscroll-y-contain scroll-smooth translate-x-0 transition-transform duration-300 scrollbar-subtle">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Environment</h2>
                  </div>
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
                  
                  {/* Asset metadata in right sidebar */}
                  {(assetDescription || assetTags) && (
                    <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-4">
                      {assetDescription && (
                        <div>
                          <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Description</div>
                          <div className="text-sm text-slate-300 leading-relaxed">{assetDescription}</div>
                        </div>
                      )}
                      {assetTags && assetTags.length > 0 && (
                        <div>
                          <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Tags</div>
                          <div className="flex flex-wrap gap-2">
                            {assetTags.map((t) => (
                              <span key={t} className="text-xs text-slate-300 bg-slate-800/50 border border-white/10 rounded-full px-3 py-1 hover:bg-slate-700/50 hover:border-cyan-400/30 transition-colors cursor-default">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toggle buttons (z-20) - Icon-based with smooth positioning */}
      <div className="absolute top-4 z-20 flex justify-between pointer-events-none" style={{ left: '1rem', right: '1rem' }}>
        {/* Left sidebar toggle */}
        <button
          onClick={() => setLeftSidebarOpen((v) => !v)}
          className={cn(
            "group flex items-center gap-2 pointer-events-auto",
            "px-3 py-2 rounded-full border",
            "bg-slate-900/80 border-white/10 text-slate-200",
            "hover:bg-slate-800/90 hover:border-cyan-400/30",
            "backdrop-blur-xl transition-all duration-300",
            "shadow-lg hover:shadow-xl hover:shadow-cyan-500/20",
            "hover:scale-105 active:scale-95"
          )}
          style={{
            transform: leftSidebarOpen && !isMobile ? `translateX(${sidebarWidthPx + 8}px)` : 'translateX(0)',
            transition: 'transform 300ms ease-in-out, all 200ms ease-in-out'
          }}
          aria-label="Toggle customization panel"
          aria-expanded={leftSidebarOpen}
        >
          <ChevronRight className={cn(
            "w-4 h-4 transition-transform duration-300",
            leftSidebarOpen ? "rotate-180" : "rotate-0"
          )} />
          <span className="text-xs font-medium hidden sm:inline">Customize</span>
          <Palette className="w-3.5 h-3.5 text-cyan-400 hidden sm:inline" />
        </button>
        
        {/* Right sidebar toggle */}
        <button
          onClick={() => setRightSidebarOpen((v) => !v)}
          className={cn(
            "group flex items-center gap-2 pointer-events-auto",
            "px-3 py-2 rounded-full border",
            "bg-slate-900/80 border-white/10 text-slate-200",
            "hover:bg-slate-800/90 hover:border-cyan-400/30",
            "backdrop-blur-xl transition-all duration-300",
            "shadow-lg hover:shadow-xl hover:shadow-cyan-500/20",
            "hover:scale-105 active:scale-95"
          )}
          style={{
            transform: rightSidebarOpen && !isMobile ? `translateX(-${sidebarWidthPx + 8}px)` : 'translateX(0)',
            transition: 'transform 300ms ease-in-out, all 200ms ease-in-out'
          }}
          aria-label="Toggle environment panel"
          aria-expanded={rightSidebarOpen}
        >
          <Settings className="w-3.5 h-3.5 text-cyan-400 hidden sm:inline" />
          <span className="text-xs font-medium hidden sm:inline">Environment</span>
          <ChevronLeft className={cn(
            "w-4 h-4 transition-transform duration-300",
            rightSidebarOpen ? "rotate-180" : "rotate-0"
          )} />
        </button>
      </div>

      {/* Right Sidebar: Environment Controls (Desktop/Tablet - overlay with glassmorphism) */}
      {!isMobile && (
        <div 
          className={cn(
            "absolute right-4 top-4 bottom-4 z-10",
            "rounded-2xl border border-white/10",
            "bg-slate-900/50",
            "overflow-hidden",
            "shadow-2xl shadow-black/40",
            "transition-all duration-300 ease-in-out",
            rightSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          )}
          style={{ width: sidebarWidth }}
        >
          <div style={{ width: sidebarWidth }} className="h-full overflow-y-auto overscroll-y-contain scroll-smooth scrollbar-subtle">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Environment</h2>
              </div>
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
              <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                <label className="text-xs text-slate-400 uppercase tracking-wide">Scale</label>
                <ScaleEditor id={assetId} initialScale={initialScale} inlineReadOnlyInitially />
              </div>
              
              {/* Asset Info */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Asset Info</div>
                <div className="flex flex-wrap items-center gap-2">
                  {assetName && <span className="text-sm text-slate-300 truncate">{assetName}</span>}
                  {assetFormat && <span className="text-xs uppercase border border-white/10 rounded px-1.5 py-0.5 text-cyan-400">{assetFormat}</span>}
                </div>
              </div>
              
              {/* Asset metadata in right sidebar */}
              {(assetDescription || assetTags) && (
                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  {assetDescription && (
                    <div>
                      <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Description</div>
                      <div className="text-sm text-slate-300 leading-relaxed">{assetDescription}</div>
                    </div>
                  )}
                  {assetTags && assetTags.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {assetTags.map((t) => (
                          <span key={t} className="text-xs text-slate-300 bg-slate-800/50 border border-white/10 rounded-full px-3 py-1 hover:bg-slate-700/50 hover:border-cyan-400/30 transition-colors cursor-default">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
