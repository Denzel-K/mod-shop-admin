import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth'
import { getStorageService } from '@/lib/enhanced-storage'

export const runtime = 'nodejs'

// DELETE /api/library/object?path=<gcs-object-path>
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const path = url.searchParams.get('path') || ''
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

    const storage = getStorageService()
    const serviceAny = storage as unknown as { bucket?: import('@google-cloud/storage').Bucket }
    const bucket = serviceAny.bucket
    if (!bucket) return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })

    await bucket.file(path).delete({ ignoreNotFound: true })

    return NextResponse.json({ ok: true, path })
  } catch (e) {
    console.error('[Library Delete] Failed:', e)
    return NextResponse.json({ error: 'Failed to delete object' }, { status: 500 })
  }
}
