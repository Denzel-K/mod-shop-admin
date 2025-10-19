export type EnvPreset = 'city' | 'sunset' | 'dawn' | 'night' | 'park';

export interface EnvPresetConfig {
  key: EnvPreset;
  label: string;
  dreiPreset: 'city' | 'sunset' | 'dawn' | 'night' | 'forest' | 'apartment' | 'warehouse' | 'park' | 'studio' | 'lobby';
  thumbnail: string;
  defaultBlur: number; // 0..1 range
  groundTexture: string;
  groundName: string;
}

export const ENVIRONMENT_PRESETS: Record<EnvPreset, EnvPresetConfig> = {
  dawn: {
    key: 'dawn',
    label: 'Dawn',
    dreiPreset: 'dawn',
    thumbnail: '/HDRI-thumbnails/dawn.svg',
    defaultBlur: 0.2,
    groundTexture: '/ground-textures/desert-rocks/desert-rocks1-albedo.png',
    groundName: 'Desert rocks',
  },
  sunset: {
    key: 'sunset',
    label: 'Sunset',
    dreiPreset: 'sunset',
    thumbnail: '/HDRI-thumbnails/sunset.svg',
    defaultBlur: 0.2,
    groundTexture: '/ground-textures/pea-gravel-unity/pea-gravel_albedo.png',
    groundName: 'Pea gravel',
  },
  city: {
    key: 'city',
    label: 'City',
    dreiPreset: 'city',
    thumbnail: '/HDRI-thumbnails/city.svg',
    defaultBlur: 0.2,
    groundTexture: '/ground-textures/gravel/gravel_albedo.png',
    groundName: 'Gravel',
  },
  park: {
    key: 'park',
    label: 'Park',
    dreiPreset: 'park',
    thumbnail: '/HDRI-thumbnails/park.svg',
    defaultBlur: 0.2,
    groundTexture: '/ground-textures/leafy-grass/leafy-grass2-albedo.png',
    groundName: 'Leafy grass',
  },
  night: {
    key: 'night',
    label: 'Night',
    dreiPreset: 'night',
    thumbnail: '/HDRI-thumbnails/night.svg',
    defaultBlur: 0.25,
    groundTexture: '/ground-textures/rocky-dirt/rocky_dirt1-albedo.png',
    groundName: 'Rocky dirt',
  },
};
