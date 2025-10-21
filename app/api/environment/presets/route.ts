import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { getStorageService } from '@/lib/enhanced-storage'
import { ENVIRONMENT_PRESETS } from '@/lib/viewer/environment'

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
      return NextResponse.json({ presets: ENVIRONMENT_PRESETS }, { status: 200 })
    }
    const [buf] = await file.download()
    const json = JSON.parse(buf.toString('utf-8'))
    return NextResponse.json({ presets: json?.presets || ENVIRONMENT_PRESETS }, { status: 200 })
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
    const data = Buffer.from(JSON.stringify({ presets: body.presets }, null, 2))
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
