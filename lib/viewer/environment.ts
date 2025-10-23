export type EnvPreset = 'city' | 'sunset' | 'dawn' | 'night' | 'park' | 'snowy-mountain';

export interface EnvPresetConfig {
  key: EnvPreset;
  label: string;
  dreiPreset: 'city' | 'sunset' | 'dawn' | 'night' | 'forest' | 'apartment' | 'warehouse' | 'park' | 'studio' | 'lobby';
  thumbnail: string;
  defaultBlur: number; // 0..1 range
  groundTexture: string;
  groundName: string;
  files?: string | string[]; // optional custom HDRI file(s)
}

export const ENVIRONMENT_PRESETS: Record<EnvPreset, EnvPresetConfig> = {
  dawn: {
    key: 'dawn',
    label: 'Dawn',
    dreiPreset: 'dawn',
    thumbnail: '/api/storage/objects/HDRI-thumbnails/dawn.svg',
    defaultBlur: 0.0,
    groundTexture: '/api/storage/objects/ground-textures/desert-rocks/desert-rocks1-albedo.png',
    groundName: 'Desert rocks',
  },
  sunset: {
    key: 'sunset',
    label: 'Sunset',
    dreiPreset: 'sunset',
    thumbnail: '/api/storage/objects/HDRI-thumbnails/sunset.svg',
    defaultBlur: 0.0,
    groundTexture: '/api/storage/objects/ground-textures/pea-gravel-unity/pea-gravel_albedo.png',
    groundName: 'Pea gravel',
  },
  city: {
    key: 'city',
    label: 'City',
    dreiPreset: 'city',
    thumbnail: '/api/storage/objects/HDRI-thumbnails/city.svg',
    defaultBlur: 0.0,
    groundTexture: '/api/storage/objects/ground-textures/asphalt/CityStreetAsphaltGenericClean001_COL_4K.jpg',
    groundName: 'Asphalt',
  },
  park: {
    key: 'park',
    label: 'Park',
    dreiPreset: 'park',
    thumbnail: '/api/storage/objects/HDRI-thumbnails/park.svg',
    defaultBlur: 0.0,
    groundTexture: '/api/storage/objects/ground-textures/leafy-grass/leafy-grass2-albedo.png',
    groundName: 'Leafy grass',
  },
  night: {
    key: 'night',
    label: 'Night',
    dreiPreset: 'night',
    thumbnail: '/api/storage/objects/HDRI-thumbnails/night.svg',
    defaultBlur: 0.0,
    groundTexture: '/api/storage/objects/ground-textures/rocky-dirt/rocky_dirt1-albedo.png',
    groundName: 'Rocky dirt',
  },
  'snowy-mountain': {
    key: 'snowy-mountain',
    label: 'Snowy Mountain',
    dreiPreset: 'studio',
    thumbnail: '/api/storage/objects/HDRI-thumbnails/snowy-mountain.svg',
    defaultBlur: 0.0,
    groundTexture: '/api/storage/objects/ground-textures/rocky-dirt/rocky_dirt1-albedo.png',
    groundName: 'Rocky dirt',
    files: '/api/storage/objects/HDRI-backgrounds/snowy-mountain/HdrOutdoorSnowMountainsEveningClear001_JPG_8K.jpg',
  },
};
