export type EnvPreset = 'city' | 'studio' | 'sunset' | 'dawn' | 'warehouse' | 'apartment' | 'night' | 'forest' | 'park' | 'lobby';

// Simple mapping of presets to lightweight mood overlays.
// You can replace these URLs with your own assets later.
export const ENV_OVERLAYS: Record<EnvPreset, {
  image: string;          // background image url
  overlayOpacity?: number; // 0..1
  vignetteOpacity?: number; // 0..1
  tint?: string;           // e.g. 'rgba(255,180,120,0.08)'
}> = {
  city: {
    image: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.08,
    vignetteOpacity: 0.3,
    tint: 'rgba(120,160,255,0.06)'
  },
  studio: {
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.06,
    vignetteOpacity: 0.25,
    tint: 'rgba(200,200,200,0.04)'
  },
  sunset: {
    image: 'https://images.unsplash.com/photo-1475724017904-b712052c192a?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.1,
    vignetteOpacity: 0.35,
    tint: 'rgba(255,180,120,0.10)'
  },
  dawn: {
    image: 'https://images.unsplash.com/photo-1443890923422-7819ed4101c0?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.08,
    vignetteOpacity: 0.3,
    tint: 'rgba(200,220,255,0.07)'
  },
  warehouse: {
    image: 'https://images.unsplash.com/photo-1541976076758-347942db1979?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.08,
    vignetteOpacity: 0.3,
    tint: 'rgba(180,200,220,0.06)'
  },
  apartment: {
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.06,
    vignetteOpacity: 0.25,
    tint: 'rgba(220,220,220,0.05)'
  },
  night: {
    image: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.12,
    vignetteOpacity: 0.45,
    tint: 'rgba(120,140,255,0.10)'
  },
  forest: {
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.08,
    vignetteOpacity: 0.3,
    tint: 'rgba(140,200,160,0.08)'
  },
  park: {
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.08,
    vignetteOpacity: 0.28,
    tint: 'rgba(160,220,160,0.08)'
  },
  lobby: {
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.06,
    vignetteOpacity: 0.25,
    tint: 'rgba(220,210,200,0.06)'
  }
};
