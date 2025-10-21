import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { getStorageService } from '@/lib/enhanced-storage'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const prefix = url.searchParams.get('prefix') || ''

    const storage = getStorageService()
    const serviceAny = storage as unknown as { bucket?: import('@google-cloud/storage').Bucket }
    const bucket = serviceAny.bucket
    if (!bucket) return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })

    const [files] = await bucket.getFiles({ prefix })

    const items = await Promise.all(
      files.map(async (f) => {
        const [meta] = await f.getMetadata()
        return {
          name: f.name,
          size: Number(meta.size || 0),
          contentType: meta.contentType || null,
          updated: meta.updated || null,
          url: `/api/storage/objects/${encodeURI(f.name)}`,
        }
      })
    )

    return NextResponse.json({ prefix, items })
  } catch (e) {
    console.error('[Library List] Failed:', e)
    return NextResponse.json({ error: 'Failed to list library' }, { status: 500 })
  }
}
