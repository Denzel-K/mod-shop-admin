import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { getStorageService } from '@/lib/enhanced-storage'
import { normalizeToRuntime, denormalizeFromRuntime, type StoredConfig } from '@/lib/viewer/environmentRepo'

export const runtime = 'nodejs'

const CONFIG_PATH = 'config/environment-presets.json'

export async function GET() {
  try {
    const storage = getStorageService()
    const serviceAny = storage as unknown as { bucket?: import('@google-cloud/storage').Bucket }
    const bucket = serviceAny.bucket
    if (!bucket) return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })

    const file = bucket.file(CONFIG_PATH)
    const [exists] = await file.exists()
    if (!exists) {
      // No stored config yet: return defaults (normalized w/ defaultBlur=0)
      const normalized = normalizeToRuntime({})
      return NextResponse.json({ presets: normalized }, { status: 200 })
    }
    const [buf] = await file.download()
    const json = JSON.parse(buf.toString('utf-8')) as StoredConfig | { presets: Record<string, import('@/lib/viewer/environmentRepo').StoredPreset> }
    const raw = (json && 'presets' in json ? json.presets : {}) as StoredConfig['presets']
    const normalized = normalizeToRuntime(raw)
    return NextResponse.json({ presets: normalized }, { status: 200 })
  } catch (e) {
    console.error('[Env Presets GET] Failed:', e)
    return NextResponse.json({ error: 'Failed to load presets' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object' || !body.presets) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const storage = getStorageService()
    const serviceAny = storage as unknown as { bucket?: import('@google-cloud/storage').Bucket }
    const bucket = serviceAny.bucket
    if (!bucket) return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })

    const file = bucket.file(CONFIG_PATH)
    // Accept either a stored shape or a runtime map; persist in stored shape
    let toStore: StoredConfig
    if (body.presets && typeof body.presets === 'object' && !Array.isArray(body.presets)) {
      // If entries include complex runtime values, convert
      toStore = denormalizeFromRuntime(body.presets)
    } else {
      toStore = { presets: {} }
    }
    const data = Buffer.from(JSON.stringify(toStore, null, 2))
    await file.save(data, {
      resumable: false,
      contentType: 'application/json',
      metadata: { cacheControl: 'no-cache' },
      validation: 'crc32c'
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('[Env Presets PUT] Failed:', e)
    return NextResponse.json({ error: 'Failed to save presets' }, { status: 500 })
  }
}
