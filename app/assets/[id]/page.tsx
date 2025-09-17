import { Suspense } from 'react';
import { headers } from 'next/headers';
import AssetViewerPanel from '@/components/asset/AssetViewerPanel';
import Link from 'next/link';

async function getAssetAbsolute(baseUrl: string, id: string) {
  const res = await fetch(`${baseUrl}/api/assets/${id}`, {
    // Force dynamic for SSR page loads
    cache: 'no-store',
    // In Next.js App Router, fetch on the server includes cookies by default
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.asset as {
    _id: string;
    name: string;
    description?: string;
    modelUrl: string;
    format: 'glb' | 'gltf';
    scale?: number;
  } | null;
}

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host');
  const proto = (hdrs.get('x-forwarded-proto') || 'http').split(',')[0];
  const baseUrl = `${proto}://${host}`;
  const asset = await getAssetAbsolute(baseUrl, id);

  if (!asset) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Asset not found</h1>
            <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">Back to Library</Link>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">We could not find that asset.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_24px] shadow-cyan-400/50" />
            <h1 className="text-white text-xl font-semibold tracking-wide">{asset.name}</h1>
            <span className="text-xs text-slate-400 border border-slate-700 rounded px-1.5 py-0.5 uppercase">{asset.format}</span>
          </div>
          <Link href="/dashboard" className="text-slate-300 hover:text-white border border-slate-700 bg-slate-800/70 hover:bg-slate-700 rounded px-3 py-1.5 text-sm">Back to Library</Link>
        </div>
      </header>

      {/* Viewer section */}
      <main className="px-6 py-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {/* Responsive container: 70vh on desktop, 60vh on mobile */}
          <div className="w-full h-[60vh] md:h-[70vh]">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-slate-400">Loading viewer…</div>}>
              <AssetViewerPanel
                url={asset.modelUrl}
                assetId={asset._id}
                initialScale={asset.scale || 1.0}
                assetName={asset.name}
                assetFormat={asset.format}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
