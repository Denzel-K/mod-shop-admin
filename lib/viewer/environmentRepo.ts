import { ENVIRONMENT_PRESETS } from './environment'
import type { EnvPreset } from './environment'

export type OverlayConfig = {
  image?: string
  overlayOpacity?: number
  vignetteOpacity?: number
  tint?: string
}

export type StoredPreset = {
  key: EnvPreset
  label?: string
  files?: string | string[]
  thumbnail?: string
  groundTexture?: string
  groundName?: string
  dreiPreset?: string
  defaultBlur?: number
  overlays?: OverlayConfig
}

export type StoredConfig = {
  presets: Record<string, StoredPreset>
}

export type RuntimePreset = (typeof ENVIRONMENT_PRESETS)[EnvPreset]

export function normalizeToRuntime(presets: Record<string, StoredPreset>): Record<EnvPreset, RuntimePreset> {
  const out = { ...ENVIRONMENT_PRESETS } as Record<EnvPreset, RuntimePreset>
  for (const [key, val] of Object.entries(presets as Record<string, StoredPreset>)) {
    const k = key as EnvPreset
    const base = out[k] || ({} as RuntimePreset)
    out[k] = {
      ...base,
      key: (val.key as EnvPreset) || (k as EnvPreset),
      label: val.label ?? base.label ?? k,
      files: val.files ?? base.files,
      thumbnail: val.thumbnail ?? base.thumbnail,
      groundTexture: val.groundTexture ?? base.groundTexture,
      groundName: val.groundName ?? base.groundName,
      dreiPreset: val.dreiPreset ?? base.dreiPreset,
      defaultBlur: val.defaultBlur ?? 0,
    } as RuntimePreset
  }
  return out
}

export function denormalizeFromRuntime(map: Record<EnvPreset, RuntimePreset>): StoredConfig {
  const presets: Record<string, StoredPreset> = {}
  for (const [k, v] of Object.entries(map as Record<string, RuntimePreset>)) {
    const key = k as EnvPreset
    presets[key] = {
      key,
      label: v.label,
      files: v.files,
      thumbnail: v.thumbnail,
      groundTexture: v.groundTexture,
      groundName: v.groundName,
      dreiPreset: v.dreiPreset,
      defaultBlur: v.defaultBlur ?? 0,
    }
  }
  return { presets }
}
