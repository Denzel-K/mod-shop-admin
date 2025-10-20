export type EnvPreset = 'city' | 'sunset' | 'dawn' | 'night'| 'park';

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
    overlayOpacity: 0.0,
    vignetteOpacity: 0.0,
    tint: 'rgba(120,160,255,0.06)'
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
  night: {
    image: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.12,
    vignetteOpacity: 0.45,
    tint: 'rgba(120,140,255,0.10)'
  },
  park: {
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1920&auto=format&fit=crop',
    overlayOpacity: 0.08,
    vignetteOpacity: 0.28,
    tint: 'rgba(160,220,160,0.08)'
  },
};
