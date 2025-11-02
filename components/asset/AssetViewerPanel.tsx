"use client";

import { useMemo, useState, useEffect } from "react";
import EnhancedModelViewer from "@/components/viewer/EnhancedModelViewer";
import ScaleEditor from "@/components/asset/ScaleEditor";
import WrapCustomizer from "@/components/configurator/WrapCustomizer";
import SurfaceSelector from "@/components/configurator/SurfaceSelector";
import CategorySelector from "@/components/configurator/CategorySelector";
import CategoryValidation from "@/components/configurator/CategoryValidation";
import WorkInProgress from "@/components/configurator/WorkInProgress";
import EnvironmentControls from "@/components/configurator/EnvironmentControls";
import { cn } from "@/lib/utils";
import { WrapColor, WrapFinish, WrapConfiguration } from "@/types/wrap";
import { IAssetMetadata, IMetadataValidation } from "@/models/Asset";
import type { MetadataCategory } from "@/components/configurator/CategorySelector";
import wrapColorsData from "@/lib/data/wrap_colors.json";
import wrapFinishesData from "@/lib/data/wrap_finishes.json";
import { ChevronsLeft, ChevronsRight, Palette, Settings } from "lucide-react";
import { ENVIRONMENT_PRESETS } from "@/lib/viewer/environment";
import type { EnvPreset } from "@/lib/viewer/environment";

type WrapColorsData = {
  // categories kept in data for potential future use but not used in UI anymore
  categories?: unknown[];
  colors: WrapColor[];
};

type WrapFinishesData = {
  finishes: WrapFinish[];
};

// EnvPreset is now imported from shared environment config

export default function AssetViewerPanel({
  url,
  assetId,
  initialScale = 1,
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
  const envIntensity = 1.25; // Constant value, no setter needed
  const [envBlur, setEnvBlur] = useState<number>(ENVIRONMENT_PRESETS[envPreset]?.defaultBlur ?? 0.0);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState<boolean>(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(0.52);
  const [environmentMode, setEnvironmentMode] = useState<'indoors' | 'outdoors'>(
    'indoors'
  );
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<MetadataCategory | null>(null);
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
  const [metadataValidation, setMetadataValidation] = useState<IMetadataValidation>({});
  const [isUpdatingValidation, setIsUpdatingValidation] = useState<boolean>(false);

  // Load initial validation state
  useEffect(() => {
    if (assetId) {
      // Fetch current validation state from API
      fetch(`/api/assets/${assetId}/metadata-validation`)
        .then(res => res.json())
        .then(data => {
          if (data.metadataValidation) {
            setMetadataValidation(data.metadataValidation);
          }
        })
        .catch(err => console.error('Failed to load validation state:', err));
    }
  }, [assetId]);

  // Reset viewer state when asset changes to prevent cross-contamination
  useEffect(() => {
    setSelectedCategory(null);
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

  // Update blur default when preset changes
  useEffect(() => {
    setEnvBlur(ENVIRONMENT_PRESETS[envPreset]?.defaultBlur ?? 0.0);
  }, [envPreset]);

  // Enforce background ON when outdoors mode is active
  useEffect(() => {
    if (environmentMode === 'outdoors' && !hdriBackground) {
      setHdriBackground(true);
    }
  }, [environmentMode, hdriBackground]);
  
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

  const handleCategoryValidationToggle = async (category: MetadataCategory, validated: boolean) => {
    setIsUpdatingValidation(true);
    try {
      const response = await fetch(`/api/assets/${assetId}/validate-metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category,
          validated,
        }),
      });
      if (!response.ok) throw new Error('Failed to update validation status');
      
      // Update local state
      setMetadataValidation(prev => ({
        ...prev,
        [category]: validated,
      }));
    } catch (error) {
      console.error('Error updating category validation:', error);
      alert('Failed to update validation status');
    } finally {
      setIsUpdatingValidation(false);
    }
  };

  // Calculate responsive sidebar width
  const sidebarWidth = useMemo(() => {
    if (isMobile) return "76.5%"; // Mobile (85% -> -10%)
    if (isTablet) return "252px"; // Tablet (280 -> -10%)
    return "288px"; // Desktop (320 -> -10%)
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
          envBlur={envBlur}
          autoRotateEnabled={autoRotateEnabled}
          autoRotateSpeed={autoRotateSpeed}
          wrapConfig={wrapConfig}
          wrapColors={wrapColors}
          wrapFinishes={wrapFinishes}
          selectedSurfaces={selectedSurfaces}
          highlightMode={highlightMode}
          onSurfaceClick={handleSurfaceSelect}
          environmentMode={environmentMode}
        />
      </div>
      {/* Left Sidebar: Car Controls (Desktop/Tablet - overlay with glassmorphism) */}
      {!isMobile && (
        <div 
          className={cn(
            "absolute left-4 top-4 bottom-4 z-40",
            "rounded-2xl border border-white/10",
            "glass-panel",
            "overflow-hidden",
            "shadow-2xl shadow-black/40",
            "transition-all duration-300 ease-in-out",
            leftSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          )}
          style={{ width: sidebarWidth }}
        >
          <div style={{ width: sidebarWidth }} className="h-full overflow-y-auto overscroll-y-contain scroll-smooth scrollbar-subtle">
            <div className="py-3 px-2 space-y-6">
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Customization</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftSidebarOpen(false)}
                  className="p-1.5 rounded-lg border border-white/10 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200"
                  aria-label="Collapse customization panel"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>
                
              {/* Step 1: Category Selection (hidden when category is selected) */}
              {!selectedCategory && (
                <div className="glass-section">
                  <CategorySelector
                    metadata={assetMetadata}
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                  />
                </div>
              )}

              {/* Step 2: Surface Selection (shown when category is selected) */}
              {selectedCategory && (
                <div className="glass-section">
                  <SurfaceSelector
                    metadata={assetMetadata}
                    selectedCategory={selectedCategory}
                    selectedSurfaces={selectedSurfaces}
                    onSurfaceToggle={handleSurfaceToggle}
                    onSurfaceSelect={handleSurfaceSelect}
                    highlightMode={highlightMode}
                    onHighlightModeToggle={setHighlightMode}
                    onBackToCategories={() => setSelectedCategory(null)}
                  />
                </div>
              )}

              {/* Step 3: Customization options (shown when category is selected) */}
              {selectedCategory === 'wrappableSurfaces' && assetMetadata?.wrappableSurfaces && Object.keys(assetMetadata.wrappableSurfaces).length > 0 ? (
                <div className="glass-section">
                  <WrapCustomizer
                    colors={wrapColors}
                    finishes={wrapFinishes}
                    selectedColor={selectedColor}
                    selectedFinish={selectedFinish}
                    onColorSelect={handleColorSelect}
                    onFinishSelect={handleFinishSelect}
                    hasSelection={selectedSurfaces.length > 0}
                  />
                </div>
              ) : selectedCategory && selectedCategory !== 'wrappableSurfaces' ? (
                <div className="glass-section">
                  <WorkInProgress
                    categoryName={selectedCategory === 'rims' ? 'Wheels & Rims' : selectedCategory === 'windows' ? 'Windows' : selectedCategory === 'doors' ? 'Doors' : selectedCategory === 'tyres' ? 'Tyres' : selectedCategory === 'interior' ? 'Interior' : 'Lights'}
                  />
                </div>
              ) : null}
              
              {/* Category-specific Metadata Validation */}
              <div className="glass-section">
                <CategoryValidation
                  selectedCategory={selectedCategory}
                  metadataValidation={metadataValidation}
                  onValidationToggle={handleCategoryValidationToggle}
                  isUpdating={isUpdatingValidation}
                />
              </div>
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
              <div className="absolute left-2 top-2 bottom-2 w-[76.5%] max-w-sm rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-y-auto overscroll-y-contain scroll-smooth translate-x-0 transition-transform duration-300 scrollbar-subtle">
                <div className="p-2 space-y-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Customization</h2>
                  </div>
                  
                  {/* Step 1: Category Selection (hidden when category is selected) */}
                  {!selectedCategory && (
                    <div className="glass-section">
                      <CategorySelector
                        metadata={assetMetadata}
                        selectedCategory={selectedCategory}
                        onCategorySelect={setSelectedCategory}
                      />
                    </div>
                  )}

                  {/* Step 2: Surface Selection (shown when category is selected) */}
                  {selectedCategory && (
                    <div className="glass-section">
                      <SurfaceSelector
                        metadata={assetMetadata}
                        selectedCategory={selectedCategory}
                        selectedSurfaces={selectedSurfaces}
                        onSurfaceToggle={handleSurfaceToggle}
                        onSurfaceSelect={handleSurfaceSelect}
                        highlightMode={highlightMode}
                        onHighlightModeToggle={setHighlightMode}
                        onBackToCategories={() => setSelectedCategory(null)}
                      />
                    </div>
                  )}

                  {/* Step 3: Customization options (shown when category is selected) */}
                  {selectedCategory === 'wrappableSurfaces' && assetMetadata?.wrappableSurfaces && Object.keys(assetMetadata.wrappableSurfaces).length > 0 ? (
                    <div className="glass-section">
                      <WrapCustomizer
                        colors={wrapColors}
                        finishes={wrapFinishes}
                        selectedColor={selectedColor}
                        selectedFinish={selectedFinish}
                        onColorSelect={handleColorSelect}
                        onFinishSelect={handleFinishSelect}
                        hasSelection={selectedSurfaces.length > 0}
                      />
                    </div>
                  ) : selectedCategory && selectedCategory !== 'wrappableSurfaces' ? (
                    <div className="glass-section">
                      <WorkInProgress
                        categoryName={selectedCategory === 'rims' ? 'Wheels & Rims' : selectedCategory === 'windows' ? 'Windows' : selectedCategory === 'doors' ? 'Doors' : selectedCategory === 'tyres' ? 'Tyres' : selectedCategory === 'interior' ? 'Interior' : 'Lights'}
                      />
                    </div>
                  ) : null}
                  
                  {/* Category-specific Metadata Validation */}
                  <div className="glass-section">
                    <CategoryValidation
                      selectedCategory={selectedCategory}
                      metadataValidation={metadataValidation}
                      onValidationToggle={handleCategoryValidationToggle}
                      isUpdating={isUpdatingValidation}
                    />
                  </div>
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
              <div className="absolute right-2 top-2 bottom-2 w-[76.5%] max-w-sm rounded-2xl glass-panel border border-white/10 shadow-2xl overflow-y-auto overscroll-y-contain scroll-smooth translate-x-0 transition-transform duration-300 scrollbar-subtle">
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Environment</h2>
                  </div>
                  <div className="glass-section">
                    <EnvironmentControls
                      envPreset={envPreset}
                      setEnvPreset={setEnvPreset}
                      hdriBackground={hdriBackground}
                      setHdriBackground={setHdriBackground}
                      envBlur={envBlur}
                      setEnvBlur={setEnvBlur}
                      autoRotateEnabled={autoRotateEnabled}
                      setAutoRotateEnabled={setAutoRotateEnabled}
                      autoRotateSpeed={autoRotateSpeed}
                      setAutoRotateSpeed={setAutoRotateSpeed}
                      environmentMode={environmentMode}
                      setEnvironmentMode={setEnvironmentMode}
                    />
                  </div>
                  <div className="mt-6">
                    <div className="glass-section">
                      <ScaleEditor id={assetId} initialScale={initialScale} inlineReadOnlyInitially />
                    </div>
                  </div>
                  
                  {/* Asset metadata in right sidebar */}
                  {(assetDescription || assetTags) && (
                    <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-4">
                      {assetDescription && (
                        <div className="glass-section">
                          <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Description</div>
                          <div className="text-sm text-slate-300 leading-relaxed">{assetDescription}</div>
                        </div>
                      )}
                      {assetTags && assetTags.length > 0 && (
                        <div className="glass-section">
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

      {/* Collapsed title-only bars when sidebars are closed (desktop) */}
      {!isMobile && !leftSidebarOpen && (
        <div className="absolute left-4 top-4 z-40">
          <div className="glass-panel rounded-2xl border border-white/10 px-3 py-2 flex items-center gap-2 shadow-2xl">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">Customization</span>
            <button
              type="button"
              onClick={() => setLeftSidebarOpen(true)}
              className="ml-2 p-1.5 rounded-lg border border-white/10 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200"
              aria-label="Expand customization panel"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!isMobile && !rightSidebarOpen && (
        <div className="absolute right-4 top-4 z-40">
          <div className="glass-panel rounded-2xl border border-white/10 px-3 py-2 flex items-center gap-2 shadow-2xl">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">Environment</span>
            <button
              type="button"
              onClick={() => setRightSidebarOpen(true)}
              className="ml-2 p-1.5 rounded-lg border border-white/10 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200"
              aria-label="Expand environment panel"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Right Sidebar: Environment Controls (Desktop/Tablet - overlay with glassmorphism) */}
      {!isMobile && (
        <div 
          className={cn(
            "absolute right-4 top-4 bottom-4 z-40",
            "rounded-2xl border border-white/10",
            "glass-panel",
            "overflow-hidden",
            "shadow-2xl shadow-black/40",
            "transition-all duration-300 ease-in-out",
            rightSidebarOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          )}
          style={{ width: sidebarWidth }}
        >
          <div style={{ width: sidebarWidth }} className="h-full overflow-y-auto overscroll-y-contain scroll-smooth scrollbar-subtle">
            <div className="py-3 px-2">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Environment</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setRightSidebarOpen(false)}
                  className="p-1.5 rounded-lg border border-white/10 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200"
                  aria-label="Collapse environment panel"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
              <div className="glass-section">
                <EnvironmentControls
                  envPreset={envPreset}
                  setEnvPreset={setEnvPreset}
                  hdriBackground={hdriBackground}
                  setHdriBackground={setHdriBackground}
                  envBlur={envBlur}
                  setEnvBlur={setEnvBlur}
                  autoRotateEnabled={autoRotateEnabled}
                  setAutoRotateEnabled={setAutoRotateEnabled}
                  autoRotateSpeed={autoRotateSpeed}
                  setAutoRotateSpeed={setAutoRotateSpeed}
                  environmentMode={environmentMode}
                  setEnvironmentMode={setEnvironmentMode}
                />
              </div>
              <div className="mt-4 pt-2 border-t border-white/10 space-y-2 glass-section">
                <label className="text-xs text-slate-400 uppercase tracking-wide">Scale</label>
                <div className="">
                  <ScaleEditor id={assetId} initialScale={initialScale} inlineReadOnlyInitially />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
