import { useEffect, useState } from 'react'
import { ENVIRONMENT_PRESETS } from './environment'

export type EnvPresetKey = keyof typeof ENVIRONMENT_PRESETS
export type EnvPresetConfig = typeof ENVIRONMENT_PRESETS[EnvPresetKey]

export function useEnvPresets() {
  const [presets, setPresets] = useState(ENVIRONMENT_PRESETS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/environment/presets', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load presets: ${res.status}`)
        const data = await res.json()
        if (mounted && data?.presets) setPresets(data.presets)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load presets')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  return { presets, setPresets, loading, error }
}
